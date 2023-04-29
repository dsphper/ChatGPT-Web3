<script setup lang='ts'>
// 导入所需的Vue.js和Naive UI组件，以及其他实用程序和存储函数
import { computed } from 'vue'
import { NInput, NPopconfirm, NScrollbar } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { debounce } from '@/utils/functions/debounce'

// 从useBasicLayout钩子中检索布局信息
const { isMobile } = useBasicLayout()

// 检索应用程序和聊天存储实例
const appStore = useAppStore()
const chatStore = useChatStore()

// 计算属性，从store中检索聊天历史数据
const dataSources = computed(() => chatStore.history)

// 处理选择历史记录项的事件
async function handleSelect({ uuid }: Chat.History) {
	// 如果所选项已经是活动状态，则不做任何操作
	if (isActive(uuid))
		return

	// 如果已经有一个活动项，则将其更新为非编辑模式
	if (chatStore.active)
		chatStore.updateHistory(chatStore.active, { isEdit: false })
	// 将所选项设置为活动状态
	await chatStore.setActive(uuid)

	// 如果在移动设备上，则折叠侧边栏
	if (isMobile.value)
		appStore.setSiderCollapsed(true)
}

// 处理编辑历史记录项的事件
function handleEdit({ uuid }: Chat.History, isEdit: boolean, event?: MouseEvent) {
	// 阻止事件冒泡
	event?.stopPropagation()
	// 更新该项的编辑状态
	chatStore.updateHistory(uuid, { isEdit })
}

// 处理删除历史记录项的事件
function handleDelete(index: number, event?: MouseEvent | TouchEvent) {
	// 阻止事件冒泡
	event?.stopPropagation()
	// 从store中删除该项
	chatStore.deleteHistory(index)
	// 如果在移动设备上，则折叠侧边栏
	if (isMobile.value)
		appStore.setSiderCollapsed(true)
}

// 使用debounce函数来延迟删除历史记录项，以避免用户发出多个删除请求
const handleDeleteDebounce = debounce(handleDelete, 600)

// 处理用户按下Enter键以保存编辑的历史记录项
function handleEnter({ uuid }: Chat.History, isEdit: boolean, event: KeyboardEvent) {
	// 阻止事件冒泡
	event?.stopPropagation()
	// 如果按下了Enter键，则保存编辑后的项
	if (event.key === 'Enter')
		chatStore.updateHistory(uuid, { isEdit })
}

// 检查项是否处于活动状态
function isActive(uuid: number) {
	return chatStore.active === uuid
}
</script>

<template>
	<NScrollbar class="px-4">
		<!-- 如果没有聊天历史记录，则显示一条消息 -->
		<template v-if="!dataSources.length">
			<div class="flex flex-col items-center mt-4 text-center text-neutral-300">
				<SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
				<span>{{ $t('common.noData') }}</span>
			</div>
		</template>
		<!-- 如果有聊天历史记录，则显示每个项 -->
		<template v-else>
			<div v-for="(item, index) of dataSources" :key="index">
				<a
					class="relative flex items-center gap-3 px-3 py-3 break-all border rounded-md cursor-pointer hover:bg-neutral-100 group dark:border-neutral-800 dark:hover:bg-[#24272e]"
					:class="isActive(item.uuid) && ['border-[#4b9e5f]', 'bg-neutral-100', 'text-[#4b9e5f]', 'dark:bg-[#24272e]', 'dark:border-[#4b9e5f]', 'pr-14']"
					@click="handleSelect(item)"
				>
          <span>
            <SvgIcon icon="ri:message-3-line" />
          </span>
					<div class="relative flex-1 overflow-hidden break-all text-ellipsis whitespace-nowrap">
						<!-- 如果该项处于编辑状态，则显示一个输入框 -->
						<NInput
							v-if="item.isEdit"
							v-model:value="item.title" size="tiny"
							@keypress="handleEnter(item, false, $event)"
						/>
						<!-- 否则，显示该项的标题 -->
						<span v-else>{{ item.title }}</span>
					</div>
					<div v-if="isActive(item.uuid)" class="absolute z-10 flex visible right-1">
						<template v-if="item.isEdit">
							<!-- 如果该项处于编辑状态，则显示一个保存按钮 -->
							<button class="p-1" @click="handleEdit(item, false, $event)">
								<SvgIcon icon="ri:save-line" />
							</button>
						</template>
						<template v-else>
							<!-- 否则，显示一个编辑按钮和一个删除确认框 -->
							<button class="p-1">
								<SvgIcon icon="ri:edit-line" @click="handleEdit(item, true, $event)" />
							</button>
							<NPopconfirm placement="bottom" @positive-click="handleDeleteDebounce(index, $event)">
								<template #trigger>
									<button class="p-1">
										<SvgIcon icon="ri:delete-bin-line" />
									</button>
								</template>
								{{ $t('chat.deleteHistoryConfirm') }}
							</NPopconfirm>
						</template>
					</div>
				</a>
			</div>
		</template>
	</NScrollbar>
</template>
