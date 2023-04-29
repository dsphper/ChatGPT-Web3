<script setup lang='ts'>
// 引入所需的依赖项
import { defineAsyncComponent, ref } from 'vue'
import { HoverButton, SvgIcon, UserAvatar } from '@/components/common' // 引入自定义的组件

// 使用 defineAsyncComponent() 函数定义 Setting 组件，实现异步加载
const Setting = defineAsyncComponent(() => import('@/components/common/Setting/index.vue'))

// 使用 ref() 函数定义一个名为 show 的响应式变量，用于控制 Setting 组件的显示和隐藏
const show = ref(false)
</script>

<template>
	<!-- 页面底部 -->
	<footer class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">
		<div class="flex-1 flex-shrink-0 overflow-hidden">
			<!-- 显示用户头像 -->
			<UserAvatar />
		</div>

		<!-- 显示设置按钮 -->
		<HoverButton @click="show = true">
      <span class="text-xl text-[#4f555e] dark:text-white">
        <SvgIcon icon="ri:settings-4-line" />
      </span>
		</HoverButton>

		<!-- 显示 Setting 组件 -->
		<Setting v-if="show" v-model:visible="show" />
	</footer>
</template>
