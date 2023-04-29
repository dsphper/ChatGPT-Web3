// 导入需要的库、自定义hook和函数
import { computed } from 'vue'
import { useMessage } from 'naive-ui'
import { t } from '@/locales'
import { useChatStore } from '@/store'

// 定义自定义hook，用于处理与聊天上下文相关的功能
export function useUsingContext() {
	const ms = useMessage() // 使用useMessage自定义hook，用于显示提示消息
	const chatStore = useChatStore() // 使用useChatStore自定义hook，用于获取和设置聊天存储库中的状态
	const usingContext = computed<boolean>(() => chatStore.usingContext) // 定义计算属性，用于获取当前聊天上下文是否启用的状态

	// 切换聊天上下文的启用状态，并显示相应的提示消息
	function toggleUsingContext() {
		chatStore.setUsingContext(!usingContext.value) // 切换聊天上下文的启用状态
		if (usingContext.value) // 如果当前为开启状态，则显示关闭上下文的提示消息
			ms.warning(t('chat.turnOffContext'))
		else // 如果当前为关闭状态，则显示开启上下文的提示消息
			ms.success(t('chat.turnOnContext'))
	}

	// 返回包含聊天上下文状态和切换函数的对象
	return {
		usingContext,
		toggleUsingContext,
	}
}
