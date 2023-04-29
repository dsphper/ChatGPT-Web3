<script setup lang='ts'>
import type {Ref} from 'vue'
import {computed, onMounted, onUnmounted, ref} from 'vue'
import {useRoute} from 'vue-router'
import {storeToRefs} from 'pinia'
import {NAutoComplete, NButton, NInput, useDialog, useMessage} from 'naive-ui'
import html2canvas from 'html2canvas'
import {Message} from './components'
import {useScroll} from './hooks/useScroll'
import {useChat} from './hooks/useChat'
import {useCopyCode} from './hooks/useCopyCode'
import {useUsingContext} from './hooks/useUsingContext'
import HeaderComponent from './components/Header/index.vue'
import {HoverButton, SvgIcon} from '@/components/common'
import {useBasicLayout} from '@/hooks/useBasicLayout'
import {useChatStore, usePromptStore} from '@/store'
import {fetchChatAPIProcess} from '@/api'
import {t} from '@/locales'

let controller = new AbortController() // 用于取消 HTTP 请求的控制器

const openLongReply = import.meta.env.VITE_GLOB_OPEN_LONG_REPLY === 'true' // 是否开启了长回复模式

const route = useRoute() // 获取当前路由对象
const dialog = useDialog() // 弹窗相关的 hook
const ms = useMessage() // 消息提示相关的 hook

const chatStore = useChatStore() // 使用 chatStore 的 hook 获取 chat 数据

useCopyCode() // 复制代码相关的 hook

const {isMobile} = useBasicLayout() // 获取当前是否为移动端的 hook
const {addChat, updateChat, updateChatSome, getChatByUuidAndIndex} = useChat() // 获取 chat 相关的 hook
const {scrollRef, scrollToBottom, scrollToBottomIfAtBottom} = useScroll() // 页面滚动相关的 hook
const {usingContext, toggleUsingContext} = useUsingContext() // 获取是否开启对话上下文的 hook

const {uuid} = route.params as { uuid: string } // 获取路由参数中的 uuid

const dataSources = computed(() => chatStore.getChatByUuid(+uuid)) // 通过 chatStore 获取当前 uuid 对应的 chat 数据
const conversationList = computed(() => dataSources.value.filter(item => (!item.inversion && !!item.conversationOptions))) // 获取包含对话选项的 chat 数据列表

const prompt = ref<string>('') // 输入框的值
const loading = ref<boolean>(false) // 是否正在加载
const inputRef = ref<Ref | null>(null)

// 输入提示相关的 store
const promptStore = usePromptStore()
// 使用 storeToRefs，保证 store 修改后，联想部分能够重新渲染
const {promptList: promptTemplate} = storeToRefs<any>(promptStore)

// 未知原因刷新页面，loading 状态不会重置，手动重置
// 遍历 chat 数据，将 loading 状态为 true 的 chat 更新为 false
dataSources.value.forEach((item, index) => {
	if (item.loading)
		updateChatSome(+uuid, index, {loading: false})
})

// 处理表单提交的回调函数
function handleSubmit() {
	onConversation()
}

async function onConversation() {
	// 获取用户输入的文本
	let message = prompt.value

	// 如果当前正在加载中，则不执行任何操作
	if (loading.value)
		return

	// 如果用户未输入任何文本或输入的文本都是空格，则不执行任何操作
	if (!message || message.trim() === '')
		return

	// 取消之前可能正在进行的聊天请求
	controller = new AbortController()

	// 添加当前用户的输入到聊天记录中，并滚动到最底部
	addChat(
		+uuid,
		{
			dateTime: new Date().toLocaleString(),
			text: message,
			inversion: true,
			error: false,
			conversationOptions: null,
			requestOptions: {prompt: message, options: null},
		},
	)
	scrollToBottom()

	// 标记为正在加载中，并清空输入框
	loading.value = true
	prompt.value = ''

	// 设置请求参数
	let options: Chat.ConversationRequest = {}
	const lastContext = conversationList.value[conversationList.value.length - 1]?.conversationOptions

	if (lastContext && usingContext.value)
		options = {...lastContext}

	// 在聊天记录中添加一个正在加载的消息，并滚动到最底部
	addChat(
		+uuid,
		{
			dateTime: new Date().toLocaleString(),
			text: '',
			loading: true,
			inversion: false,
			error: false,
			conversationOptions: null,
			requestOptions: {prompt: message, options: {...options}},
		},
	)
	scrollToBottom()

	try {
		let lastText = ''
		// 定义聊天请求的处理方法
		const fetchChatAPIOnce = async () => {
			// 发送聊天请求
			await fetchChatAPIProcess<Chat.ConversationResponse>({
				prompt: message,
				options,
				signal: controller.signal,
				onDownloadProgress: ({event}) => {
					// 处理聊天请求返回的数据
					const xhr = event.target
					const {responseText} = xhr
					// 总是处理最后一行
					const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
					let chunk = responseText
					if (lastIndex !== -1)
						chunk = responseText.substring(lastIndex)
					try {
						const data = JSON.parse(chunk)
						// 将聊天请求的结果添加到聊天记录中，并标记为非加载状态
						updateChat(
							+uuid,
							dataSources.value.length - 1,
							{
								dateTime: new Date().toLocaleString(),
								text: lastText + (data.text ?? ''),
								inversion: false,
								error: false,
								loading: true,
								conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
								requestOptions: {prompt: message, options: {...options}},
							},
						)

						// 如果需要长时间等待聊天请求的响应
						if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
							options.parentMessageId = data.id
							lastText = data.text
							message = ''
							return fetchChatAPIOnce()
						}

						// 如果滚动条在最底部，则滚动到底部
						scrollToBottomIfAtBottom()
					} catch (error) {
						//
					}
				},
			})
			updateChatSome(+uuid, dataSources.value.length - 1, {loading: false})
		}

		await fetchChatAPIOnce()
	} catch (error: any) {
		// 如果error存在，则errorMessage等于error.message，否则等于t('common.wrong')
		const errorMessage = error?.message ?? t('common.wrong')

		// 如果error.message等于'canceled'
		if (error.message === 'canceled') {
			// 更新当前聊天的loading为false
			updateChatSome(
				+uuid,
				dataSources.value.length - 1,
				{
					loading: false,
				},
			)
			// 如果当前滚动条已经在底部，则滚动到底部
			scrollToBottomIfAtBottom()
			return
		}

		// 根据uuid和索引获取当前聊天
		const currentChat = getChatByUuidAndIndex(+uuid, dataSources.value.length - 1)

		// 如果当前聊天的文本存在且不为空
		if (currentChat?.text && currentChat.text !== '') {
			// 更新当前聊天的文本，加上错误信息
			updateChatSome(
				+uuid,
				dataSources.value.length - 1,
				{
					text: `${currentChat.text}\n[${errorMessage}]`,
					error: false,
					loading: false,
				},
			)
			return
		}
		console.log('err')
		// 更新当前聊天的信息，包括错误信息
		updateChat(
			+uuid,
			dataSources.value.length - 1,
			{
				dateTime: new Date().toLocaleString(),
				text: errorMessage,
				inversion: false,
				error: true,
				loading: false,
				conversationOptions: null,
				requestOptions: {prompt: message, options: {...options}},
			},
		)
		// 如果当前滚动条已经在底部
		scrollToBottomIfAtBottom()
	} finally {
		loading.value = false
	}
}

// 当点击“重新生成”按钮时触发
async function onRegenerate(index: number) {
	// 如果已经在加载，则返回
	if (loading.value)
		return

	// 创建一个新的AbortController
	controller = new AbortController()

	// 获取当前数据源的请求选项
	const {requestOptions} = dataSources.value[index]

	// 设置消息和选项
	let message = requestOptions?.prompt ?? ''
	let options: Chat.ConversationRequest = {}
	if (requestOptions.options)
		options = {...requestOptions.options}

	// 将loading设置为true
	loading.value = true

	// 更新聊天窗口，设置loading为true
	updateChat(
		+uuid,
		index,
		{
			dateTime: new Date().toLocaleString(),
			text: '',
			inversion: false,
			error: false,
			loading: true,
			conversationOptions: null,
			requestOptions: {prompt: message, options: {...options}},
		},
	)

	try {
		// 初始化lastText为空字符串
		let lastText = ''
		// 创建一个fetchChatAPIProcess函数
		const fetchChatAPIOnce = async () => {
			// 调用fetchChatAPIProcess函数，传递请求选项和控制器信号
			await fetchChatAPIProcess<Chat.ConversationResponse>({
				prompt: message,
				options,
				signal: controller.signal,
				// 处理下载进度
				onDownloadProgress: ({event}) => {
					const xhr = event.target
					const {responseText} = xhr
					// 始终处理最后一行
					const lastIndex = responseText.lastIndexOf('\n', responseText.length - 2)
					let chunk = responseText
					if (lastIndex !== -1)
						chunk = responseText.substring(lastIndex)
					try {
						// 尝试解析响应JSON
						const data = JSON.parse(chunk)
						console.log(data)
						// 更新聊天窗口
						updateChat(
							+uuid,
							index,
							{
								dateTime: new Date().toLocaleString(),
								text: lastText + (data.text ?? ''),
								inversion: false,
								error: false,
								loading: true,
								conversationOptions: {conversationId: data.conversationId, parentMessageId: data.id},
								requestOptions: {prompt: message, options: {...options}},
							},
						)
						// 如果存在openLongReply且达到了最大长度，则继续请求
						if (openLongReply && data.detail.choices[0].finish_reason === 'length') {
							options.parentMessageId = data.id
							lastText = data.text
							message = ''
							return fetchChatAPIOnce()
						}
					} catch (error) {
						//
					}
				},
			})
			// 更新聊天窗口，设置loading为false
			updateChatSome(+uuid, index, {loading: false})
		}
		// 调用fetchChatAPIOnce函数
		await fetchChatAPIOnce()
	} catch (error: any) {
		// 如果是取消操作，则更新聊天窗口，设置loading为false
		if (error.message === 'canceled') {
			updateChatSome(
				+uuid,
				index,
				{
					loading: false,
				},
			)
			return
		}

		// 如果发生错误，则将errorMessage设置为error.message，否则设置为t('common.wrong')
		const errorMessage = error?.message ?? t('common.wrong')
		// 更新聊天窗口，设置error为true，loading为false，设置错误消息
		updateChat(
			+uuid,
			index,
			{
				dateTime: new Date().toLocaleString(),
				text: errorMessage,
				inversion: false,
				error: true,
				loading: false,
				conversationOptions: null,
				requestOptions: {prompt: message, options: {...options}},
			},
		)
	} finally {
		// 将loading设置为false
		loading.value = false
	}
}
// 处理导出聊天窗口为图片的操作
function handleExport() {
	// 如果正在加载，则返回
	if (loading.value)
		return

	// 弹出确认对话框
	const d = dialog.warning({
		title: t('chat.exportImage'),
		content: t('chat.exportImageConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		// 当用户点击“是”时
		onPositiveClick: async () => {
			try {
				// 将对话框的loading设置为true
				d.loading = true
				// 获取聊天窗口的div元素
				const ele = document.getElementById('image-wrapper')
				// 使用html2canvas将div元素转换为canvas
				const canvas = await html2canvas(ele as HTMLDivElement, {
					useCORS: true,
				})
				// 获取图片的base64编码
				const imgUrl = canvas.toDataURL('image/png')
				// 创建一个a元素
				const tempLink = document.createElement('a')
				// 设置a元素的属性
				tempLink.style.display = 'none'
				tempLink.href = imgUrl
				tempLink.setAttribute('download', 'chat-shot.png')
				if (typeof tempLink.download === 'undefined')
					tempLink.setAttribute('target', '_blank')

				// 将a元素添加到body中，模拟用户点击下载
				document.body.appendChild(tempLink)
				tempLink.click()
				document.body.removeChild(tempLink)
				// 释放图片的URL对象
				window.URL.revokeObjectURL(imgUrl)
				// 显示导出成功的消息
				d.loading = false
				ms.success(t('chat.exportSuccess'))
				Promise.resolve()
			} catch (error: any) {
				// 显示导出失败的消息
				ms.error(t('chat.exportFailed'))
			} finally {
				// 将对话框的loading设置为false
				d.loading = false
			}
		},
	})
}
// 处理删除单个消息的操作
function handleDelete(index: number) {
	// 如果正在加载，则返回
	if (loading.value)
		return

	// 弹出确认对话框
	dialog.warning({
		title: t('chat.deleteMessage'),
		content: t('chat.deleteMessageConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: () => {
			// 调用chatStore的deleteChatByUuid函数，删除指定索引处的聊天数据
			chatStore.deleteChatByUuid(+uuid, index)
		},
	})
}

// 处理清空聊天窗口的操作
function handleClear() {
	// 如果正在加载，则返回
	if (loading.value)
		return

	// 弹出确认对话框
	dialog.warning({
		title: t('chat.clearChat'),
		content: t('chat.clearChatConfirm'),
		positiveText: t('common.yes'),
		negativeText: t('common.no'),
		onPositiveClick: () => {
			// 调用chatStore的clearChatByUuid函数，清空当前聊天窗口的所有聊天数据
			chatStore.clearChatByUuid(+uuid)
		},
	})
}

// 处理键盘输入事件
function handleEnter(event: KeyboardEvent) {
	// 如果不是移动设备
	if (!isMobile.value) {
		// 如果按下了Enter键且没有按下Shift键，则调用handleSubmit函数
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault()
			handleSubmit()
		}
	} else {
		// 如果按下了Enter键且同时按下了Ctrl键，则调用handleSubmit函数
		if (event.key === 'Enter' && event.ctrlKey) {
			event.preventDefault()
			handleSubmit()
		}
	}
}

// 处理停止按钮的操作
function handleStop() {
	// 如果正在加载，则调用AbortController的abort方法，并将loading设置为false
	if (loading.value) {
		controller.abort()
		loading.value = false
	}
}

// 计算搜索选项
const searchOptions = computed(() => {
	// 如果提示符以“/”开头，则返回与提示符相匹配的选项
	if (prompt.value.startsWith('/')) {
		// 从promptTemplate中过滤出与提示符匹配的选项，并将其转换为一个包含"label"和"value"属性的数组
		return promptTemplate.value.filter((item: { key: string }) => item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())).map((obj: { value: any }) => {
			return {
				label: obj.value,
				value: obj.value,
			}
		})
	} else {
		// 否则返回一个空数组
		return []
	}
})

// 反渲染选项的label
const renderOption = (option: { label: string }) => {
	// 遍历promptTemplate，找到与选项的"label"属性匹配的项，并返回其"key"属性
	for (const i of promptTemplate.value) {
		if (i.value === option.label)
			return [i.key]
	}
	// 如果没有找到匹配的项，则返回一个空数组
	return []
}

// 计算输入框的placeholder文本
const placeholder = computed(() => {
	if (isMobile.value)
		return t('chat.placeholderMobile')
	return t('chat.placeholder')
})

// 计算发送按钮是否可用
const buttonDisabled = computed(() => {
	return loading.value || !prompt.value || prompt.value.trim() === ''
})

// 计算底部区域的样式类
const footerClass = computed(() => {
	let classes = ['p-4']
	if (isMobile.value)
		classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
	return classes
})

// 组件挂载时将滚动条滚动到底部，并将焦点设置到输入框中（如果是桌面设备）
onMounted(() => {
	scrollToBottom()
	if (inputRef.value && !isMobile.value)
		inputRef.value?.focus()
})

// 组件卸载时如果正在加载，则调用AbortController的abort方法
onUnmounted(() => {
	if (loading.value)
		controller.abort()
})

</script>

<template>
	<div class="flex flex-col w-full h-full">
		<HeaderComponent
			v-if="isMobile"
			:using-context="usingContext"
			@export="handleExport"
			@toggle-using-context="toggleUsingContext"
		/>
		<main class="flex-1 overflow-hidden">
			<div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">
				<div
					id="image-wrapper"
					class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
					:class="[isMobile ? 'p-2' : 'p-4']"
				>
					<template v-if="!dataSources.length">
						<div class="flex items-center justify-center mt-4 text-center text-neutral-300">
							<SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl"/>
							<span>Aha~</span>
						</div>
					</template>
					<template v-else>
						<div>
							<Message
								v-for="(item, index) of dataSources"
								:key="index"
								:date-time="item.dateTime"
								:text="item.text"
								:inversion="item.inversion"
								:error="item.error"
								:loading="item.loading"
								@regenerate="onRegenerate(index)"
								@delete="handleDelete(index)"
							/>
							<div class="sticky bottom-0 left-0 flex justify-center">
								<NButton v-if="loading" type="warning" @click="handleStop">
									<template #icon>
										<SvgIcon icon="ri:stop-circle-line"/>
									</template>
									Stop Responding
								</NButton>
							</div>
						</div>
					</template>
				</div>
			</div>
		</main>
		<footer :class="footerClass">
			<div class="w-full max-w-screen-xl m-auto">
				<div class="flex items-center justify-between space-x-2">
					<HoverButton @click="handleClear">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:delete-bin-line"/>
            </span>
					</HoverButton>
					<HoverButton v-if="!isMobile" @click="handleExport">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:download-2-line"/>
            </span>
					</HoverButton>
					<HoverButton v-if="!isMobile" @click="toggleUsingContext">
            <span class="text-xl" :class="{ 'text-[#4b9e5f]': usingContext, 'text-[#a8071a]': !usingContext }">
              <SvgIcon icon="ri:chat-history-line"/>
            </span>
					</HoverButton>
					<NAutoComplete v-model:value="prompt" :options="searchOptions" :render-label="renderOption">
						<template #default="{ handleInput, handleBlur, handleFocus }">
							<NInput
								ref="inputRef"
								v-model:value="prompt"
								type="textarea"
								:placeholder="placeholder"
								:autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
								@input="handleInput"
								@focus="handleFocus"
								@blur="handleBlur"
								@keypress="handleEnter"
							/>
						</template>
					</NAutoComplete>
					<NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
						<template #icon>
              <span class="dark:text-black">
                <SvgIcon icon="ri:send-plane-fill"/>
              </span>
						</template>
					</NButton>
				</div>
			</div>
		</footer>
	</div>
</template>
