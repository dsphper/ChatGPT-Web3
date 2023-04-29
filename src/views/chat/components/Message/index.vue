<script setup lang='ts'>
// 引入必要的 Vue 相关组件和函数、工具函数等等
import { computed, ref } from 'vue'
import { NDropdown } from 'naive-ui'
import AvatarComponent from './Avatar.vue'
import TextComponent from './Text.vue'
import { SvgIcon } from '@/components/common'
import { copyText } from '@/utils/format'
import { useIconRender } from '@/hooks/useIconRender'
import { t } from '@/locales'
import { useBasicLayout } from '@/hooks/useBasicLayout'

// Props 的类型定义
interface Props {
	dateTime?: string
	text?: string
	inversion?: boolean
	error?: boolean
	loading?: boolean
}

// Emit 的类型定义，用于定义 emit 函数的参数
interface Emit {
	(ev: 'regenerate'): void
	(ev: 'delete'): void
}

// 定义组件 Props
const props = defineProps<Props>()

// 定义组件 emit 函数，用于子组件向父组件传递数据
const emit = defineEmits<Emit>()

// 使用 useBasicLayout() 自定义的 hook 获取 isMobile 属性
const { isMobile } = useBasicLayout()

// 使用 useIconRender() 自定义的 hook 获取 iconRender 函数
const { iconRender } = useIconRender()

// 定义 ref 变量 textRef 和 asRawText
const textRef = ref<HTMLElement>()
const asRawText = ref(props.inversion)

// 定义 ref 变量 messageRef
const messageRef = ref<HTMLElement>()

// 计算属性 options，根据组件 props 和 asRawText 的值返回不同的选项数组
const options = computed(() => {
	const common = [
		// 复制文本选项，包含 label、key 和 icon 三个属性
		{
			label: t('chat.copy'), // 根据国际化语言获取复制文本的翻译
			key: 'copyText', // key，用于在 handleSelect() 函数中区分不同的选项
			icon: iconRender({ icon: 'ri:file-copy-2-line' }), // 使用 iconRender() 函数获取 icon
		},
		// 删除选项，包含 label、key 和 icon 三个属性
		{
			label: t('common.delete'), // 根据国际化语言获取删除的翻译
			key: 'delete', // key，用于在 handleSelect() 函数中区分不同的选项
			icon: iconRender({ icon: 'ri:delete-bin-line' }), // 使用 iconRender() 函数获取 icon
		},
	]

	// 如果不是倒置模式，则添加“预览”或“查看原始文本”选项
	if (!props.inversion) {
		common.unshift({
			label: asRawText.value ? t('chat.preview') : t('chat.showRawText'), // 根据 asRawText 的值获取不同的翻译
			key: 'toggleRenderType', // key，用于在 handleSelect() 函数中区分不同的选项
			icon: iconRender({ icon: asRawText.value ? 'ic:outline-code-off' : 'ic:outline-code' }), // 使用 iconRender() 函数获取 icon
		})
	}


	return common
})

// 处理选项被选择时的函数，根据传入的 key 区分不同的选项
function handleSelect(key: 'copyText' | 'delete' | 'toggleRenderType') {
	switch (key) {
		case 'copyText':
			copyText({ text: props.text ?? '' }) // 调用 copyText() 函数复制文本
			return
		case 'toggleRenderType':
			asRawText.value = !asRawText.value // 切换 asRawText 的值，控制文本的渲染方式
			return
		case 'delete':
			emit('delete') // 触发父组件的 delete 事件
	}
}

// 处理重新生成消息的函数，将 messageRef 滚动到视图中并触发父组件的 regenerate 事件
function handleRegenerate() {
	messageRef.value?.scrollIntoView() // 将 messageRef 滚动到视图中
	emit('regenerate') // 触发父组件的 regenerate 事件
}
</script>

<template>
	<!-- 定义一个包含消息的 div 元素，使用 ref 属性给其命名为 "messageRef"，同时设置了一些样式 -->
	<div
		ref="messageRef"
		class="flex w-full mb-6 overflow-hidden"
		:class="[{ 'flex-row-reverse': inversion }]">
		<!-- 左侧是一个圆形头像，使用 AvatarComponent 组件，其中头像的图片根据 inversion 变量的值来决定，同时设置一些样式 -->
		<div
			class="flex items-center justify-center flex-shrink-0 h-8 overflow-hidden rounded-full basis-8"
			:class="[inversion ? 'ml-2' : 'mr-2']">
			<AvatarComponent :image="inversion" />
		</div>
		<!-- 右侧是消息的具体内容，包括消息的时间戳和文本内容 -->
		<div class="overflow-hidden text-sm " :class="[inversion ? 'items-end' : 'items-start']">
			<!-- 消息的时间戳，使用了 p 元素和 text-xs 样式，根据 inversion 的值来决定时间戳的位置和对齐方式 -->
			<p class="text-xs text-[#b4bbc4]" :class="[inversion ? 'text-right' : 'text-left']">
				{{ dateTime }}
			</p>
			<!-- 消息的文本内容，使用了 TextComponent 组件，其中的一些属性值根据变量的值来决定，同时设置一些样式 -->
			<div
				class="flex items-end gap-1 mt-2"
				:class="[inversion ? 'flex-row-reverse' : 'flex-row']">
				<TextComponent
					ref="textRef"
					:inversion="inversion"
					:error="error"
					:text="text"
					:loading="loading"
					:as-raw-text="asRawText"
				/>
				<!-- 消息的操作区域，包括重新生成按钮和更多操作按钮 -->
				<div class="flex flex-col">
					<!-- 重新生成按钮，根据 inversion 决定其位置，使用 SvgIcon 组件，并设置了一些样式 -->
					<button
						v-if="!inversion"
						class="mb-2 transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-300"
						@click="handleRegenerate"
					>
						<SvgIcon icon="ri:restart-line" />
					</button>
					<!-- 更多操作按钮，使用了 NDropdown 组件，其中触发方式根据 isMobile 变量的值来决定，位置根据 inversion 变量的值来决定，选项根据 options 变量的值来决定，同时设置了一些样式 -->
					<NDropdown
						:trigger="isMobile ? 'click' : 'hover'"
						:placement="!inversion ? 'right' : 'left'"
						:options="options"
						@select="handleSelect"
					>
						<button class="transition text-neutral-300 hover:text-neutral-800 dark:hover:text-neutral-200">
							<SvgIcon icon="ri:more-2-fill" />
						</button>
					</NDropdown>
				</div>
			</div>
		</div>
	</div>
</template>
