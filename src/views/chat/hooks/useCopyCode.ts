import { onMounted, onUpdated } from 'vue'
import { copyText } from '@/utils/format'

// 自定义 Hook，用于实现复制代码块的功能
export function useCopyCode() {
	function copyCodeBlock() {
		// 获取页面上所有的代码块元素
		const codeBlockWrapper = document.querySelectorAll('.code-block-wrapper')
		codeBlockWrapper.forEach((wrapper) => {
			const copyBtn = wrapper.querySelector('.code-block-header__copy') // 获取当前代码块元素中的复制按钮
			const codeBlock = wrapper.querySelector('.code-block-body') // 获取当前代码块元素中的代码块元素
			if (copyBtn && codeBlock) {
				// 为复制按钮添加 click 事件监听器
				copyBtn.addEventListener('click', () => {
					if (navigator.clipboard?.writeText)
						// 如果支持 navigator.clipboard.writeText 方法，则使用该方法将代码块的文本内容复制到剪贴板中
						navigator.clipboard.writeText(codeBlock.textContent ?? '')
					else
						// 否则，调用 copyText 函数，将代码块的文本内容复制到剪贴板中
						copyText({ text: codeBlock.textContent ?? '', origin: true })
				})
			}
		})
	}

	// 在组件挂载时执行 copyCodeBlock 函数
	onMounted(() => copyCodeBlock())

	// 在组件更新时执行 copyCodeBlock 函数
	onUpdated(() => copyCodeBlock())
}
