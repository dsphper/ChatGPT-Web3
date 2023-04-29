// 导入需要的类型和函数
import type { Ref } from 'vue'
import { nextTick, ref } from 'vue'

// 定义一个类型别名，表示滚动元素的类型为HTMLDivElement或null
type ScrollElement = HTMLDivElement | null

// 定义一个接口，表示useScroll函数的返回值类型
interface ScrollReturn {
	scrollRef: Ref<ScrollElement> // 引用组件中的滚动元素
	scrollToBottom: () => Promise<void> // 将滚动元素滚动到底部
	scrollToTop: () => Promise<void> // 将滚动元素滚动到顶部
	scrollToBottomIfAtBottom: () => Promise<void> // 将滚动元素滚动到底部，但仅在滚动条当前位于底部时才会滚动
}

// 定义自定义hook，用于处理与滚动相关的功能
export function useScroll(): ScrollReturn {
	const scrollRef = ref<ScrollElement>(null) // 创建一个引用，用于引用组件中的滚动元素

	// 异步函数，用于将滚动元素滚动到底部
	const scrollToBottom = async () => {
		await nextTick() // 等待Vue.js更新DOM
		if (scrollRef.value) // 检查滚动元素是否存在
			scrollRef.value.scrollTop = scrollRef.value.scrollHeight // 将滚动元素滚动到底部
	}

	// 异步函数，用于将滚动元素滚动到顶部
	const scrollToTop = async () => {
		await nextTick() // 等待Vue.js更新DOM
		if (scrollRef.value) // 检查滚动元素是否存在
			scrollRef.value.scrollTop = 0 // 将滚动元素滚动到顶部
	}

	// 异步函数，用于将滚动元素滚动到底部，但仅在滚动条当前位于底部时才会滚动
	const scrollToBottomIfAtBottom = async () => {
		await nextTick() // 等待Vue.js更新DOM
		if (scrollRef.value) {
			const threshold = 100 // 阈值，表示滚动条到底部的距离阈值
			const distanceToBottom = scrollRef.value.scrollHeight - scrollRef.value.scrollTop - scrollRef.value.clientHeight // 计算滚动条当前距离底部的距离
			if (distanceToBottom <= threshold) // 如果当前距离小于或等于阈值，则将滚动元素滚动到底部
				scrollRef.value.scrollTop = scrollRef.value.scrollHeight
		}
	}

	// 返回包含滚动元素引用和各种滚动函数的对象
	return {
		scrollRef,
		scrollToBottom,
		scrollToTop,
		scrollToBottomIfAtBottom,
	}
}
