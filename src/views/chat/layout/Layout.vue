<script setup lang='ts'>
// 引入所需的依赖项
import { computed } from 'vue'
import { NLayout, NLayoutContent } from 'naive-ui'
import { useRouter } from 'vue-router'
import Sider from './sider/index.vue'
import Permission from './Permission.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore, useChatStore } from '@/store'

// 获取路由对象并跳转到 Chat 页面
const router = useRouter()
const appStore = useAppStore()
const chatStore = useChatStore()
const authStore = useAuthStore()
router.replace({ name: 'Chat', params: { uuid: chatStore.active } })

// 使用 useBasicLayout() 钩子获取应用程序的布局信息
const { isMobile } = useBasicLayout()

// 定义计算属性
const collapsed = computed(() => appStore.siderCollapsed) // 侧边栏是否收起
const needPermission = computed(() => !!authStore.session?.auth && !authStore.token) // 是否需要用户登录或权限才能访问
const getMobileClass = computed(() => { // 动态获取样式类名，用于移动设备上的样式调整
	if (isMobile.value)
		return ['rounded-none', 'shadow-none']
	return ['border', 'rounded-md', 'shadow-md', 'dark:border-neutral-800']
})
const getContainerClass = computed(() => { // 动态获取样式类名，用于主体区域容器的样式调整
	return [
		'h-full',
		{ 'pl-[260px]': !isMobile.value && !collapsed.value },
	]
})
</script>

<template>
	<!-- 页面布局 -->
	<div class="h-full dark:bg-[#24272e] transition-all" :class="[isMobile ? 'p-0' : 'p-4']">
		<div class="h-full overflow-hidden" :class="getMobileClass">
			<NLayout class="z-40 transition" :class="getContainerClass" has-sider>
				<Sider /> <!-- 侧边栏组件 -->
				<NLayoutContent class="h-full">
					<RouterView v-slot="{ Component, route }">
						<component :is="Component" :key="route.fullPath" />
					</RouterView>
				</NLayoutContent>
			</NLayout>
		</div>
		<Permission :visible="needPermission" /> <!-- 遮罩层组件，用于提示需要用户登录或权限才能访问 -->
	</div>
</template>
