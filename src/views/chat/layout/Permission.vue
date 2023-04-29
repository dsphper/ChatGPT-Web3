<script setup lang='ts'>
// 引入所需的依赖项
import { computed, ref } from 'vue'
import { NButton, NInput, NModal, useMessage } from 'naive-ui'
import { fetchVerify } from '@/api' // 自定义的 API 请求函数
import { useAuthStore } from '@/store' // 自定义的 authStore
import Icon403 from '@/icons/403.vue' // 自定义的 403 错误图标组件

// 定义 Props 接口，规定组件的 props 类型
interface Props {
	visible: boolean
}

// 使用 defineProps() 函数定义 Props 接口，并将其作为组件的 props 类型
defineProps<Props>()

// 使用 useAuthStore() 钩子获取 authStore 引用
const authStore = useAuthStore()

// 使用 useMessage() 钩子创建一个全局消息对象 ms
const ms = useMessage()

// 使用 ref() 函数定义两个响应式变量 loading 和 token，分别表示当前验证过程是否正在进行以及用户输入的验证密钥
const loading = ref(false)
const token = ref('')

// 使用 computed() 函数定义 disabled 计算属性，用于动态计算验证按钮是否可用
const disabled = computed(() => !token.value.trim() || loading.value)

// 定义 handleVerify() 函数，处理用户点击验证按钮时的逻辑
async function handleVerify() {
	const secretKey = token.value.trim() // 获取用户输入的验证密钥

	if (!secretKey) // 如果验证密钥为空，则直接返回
		return

	try {
		loading.value = true // 将 loading 变量设置为 true，表示正在进行验证过程
		await fetchVerify(secretKey) // 发送验证请求
		authStore.setToken(secretKey) // 将验证密钥保存到 authStore 中
		ms.success('success') // 显示成功提示信息
		window.location.reload() // 重新加载页面
	}
	catch (error: any) {
		ms.error(error.message ?? 'error') // 显示失败提示信息
		authStore.removeToken() // 删除 authStore 中保存的验证密钥
		token.value = '' // 将 token 变量重置为空
	}
	finally {
		loading.value = false // 将 loading 变量设置为 false，表示验证过程结束
	}
}

// 定义 handlePress() 函数，处理用户在输入验证密钥时按下回车键的逻辑
function handlePress(event: KeyboardEvent) {
	if (event.key === 'Enter' && !event.shiftKey) { // 如果按下的是回车键，则调用 handleVerify() 函数
		event.preventDefault()
		handleVerify()
	}
}
</script>

<template>
	<!-- 验证窗口 -->
	<NModal :show="visible" style="width: 90%; max-width: 640px">
		<div class="p-10 bg-white rounded dark:bg-slate-800">
			<div class="space-y-4">
				<header class="space-y-2">
					<!-- 显示 403 错误图标 -->
					<h2 class="text-2xl font-bold text-center text-slate-800 dark:text-neutral-200">
						403
					</h2>
					<p class="text-base text-center text-slate-500 dark:text-slate-500">
						{{ $t('common.unauthorizedTips') }} <!-- 根据当前语言环境显示提示信息 -->
					</p>
					<Icon403 class="w-[200px] m-auto" /> <!-- 显示自定义的 403 错误图标组件 -->
				</header>
				<!-- 输入验证密钥的表单 -->
				<NInput v-model:value="token" type="password" placeholder="" @keypress="handlePress" />
				<!-- 验证按钮 -->
				<NButton
					block
					type="primary"
					:disabled="disabled"
					:loading="loading"
					@click="handleVerify"
				>
					{{ $t('common.verify') }} <!-- 根据当前语言环境显示“验证”按钮文本 -->
				</NButton>
			</div>
		</div>
	</NModal>
</template>
