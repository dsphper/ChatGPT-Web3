<script setup lang='ts'>
// 引入所需的依赖项
import type { CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { NButton, NLayoutSider } from 'naive-ui'
import List from './List.vue'
import Footer from './Footer.vue'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { PromptStore } from '@/components/common'

// 获取 appStore 和 chatStore 实例
const appStore = useAppStore()
const chatStore = useChatStore()

// 获取 isMobile 变量，用于判断是否为移动端
const { isMobile } = useBasicLayout()

// 使用 ref() 函数定义一个名为 show 的响应式变量，用于控制 PromptStore 组件的显示和隐藏
const show = ref(false)

// 使用 computed() 函数定义一个名为 collapsed 的计算属性，用于获取 appStore 中的 siderCollapsed 状态
const collapsed = computed(() => appStore.siderCollapsed)

// 定义 handleAdd() 函数，用于处理添加新聊天记录的逻辑
function handleAdd() {
	chatStore.addHistory({ title: 'New Chat', uuid: Date.now(), isEdit: false })
	if (isMobile.value)
		appStore.setSiderCollapsed(true)
}

// 定义 handleUpdateCollapsed() 函数，用于更新 siderCollapsed 状态
function handleUpdateCollapsed() {
	appStore.setSiderCollapsed(!collapsed.value)
}

// 使用 computed() 函数定义一个名为 getMobileClass 的计算属性，用于控制移动端样式
const getMobileClass = computed<CSSProperties>(() => {
	if (isMobile.value) {
		return {
			position: 'fixed',
			zIndex: 50,
		}
	}
	return {}
})

// 使用 computed() 函数定义一个名为 mobileSafeArea 的计算属性，用于控制移动端安全区域的样式
const mobileSafeArea = computed(() => {
	if (isMobile.value) {
		return {
			paddingBottom: 'env(safe-area-inset-bottom)',
		}
	}
	return {}
})

// 监听 isMobile 变量的变化，并更新 siderCollapsed 状态
watch(
	isMobile,
	(val) => {
		appStore.setSiderCollapsed(val)
	},
	{
		immediate: true,
		flush: 'post',
	},
)
</script>

<template>
	<NLayoutSider
		:collapsed="collapsed"
		:collapsed-width="0"
		:width="260"
		:show-trigger="isMobile ? false : 'arrow-circle'"
		collapse-mode="transform"
		position="absolute"
		bordered
		:style="getMobileClass"
		@update-collapsed="handleUpdateCollapsed"
	>
		<div class="flex flex-col h-full" :style="mobileSafeArea">
			<main class="flex flex-col flex-1 min-h-0">
				<!-- 添加新聊天记录的按钮 -->
				<div class="p-4">
					<NButton dashed block @click="handleAdd">
						{{ $t('chat.newChatButton') }}
					</NButton>
				</div>
				<!-- 聊天记录列表 -->
				<div class="flex-1 min-h-0 pb-4 overflow-hidden">
					<List />
				</div>
				<!-- 显示 PromptStore 组件的按钮 -->
				<div class="p-4">
					<NButton block @click="show = true">
						{{ $t('store.siderButton') }}
					</NButton>
				</div>
			</main>
			<!-- 底部 -->
			<Footer />
		</div>
	</NLayoutSider>
	<!-- 移动端下展开侧边栏时，显示的遮罩层 -->
	<template v-if="isMobile">
		<div v-show="!collapsed" class="fixed inset-0 z-40 bg-black/40" @click="handleUpdateCollapsed" />
	</template>
	<!-- 显示 PromptStore 组件 -->
	<PromptStore v-model:visible="show" />
</template>
