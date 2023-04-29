<script lang="ts" setup>
import { computed, ref } from 'vue'
import MarkdownIt from 'markdown-it'
import mdKatex from '@traptitech/markdown-it-katex'
import mila from 'markdown-it-link-attributes'
import hljs from 'highlight.js'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { t } from '@/locales'

// 定义 Props 接口，包括 inversion、error、text、loading 和 asRawText 五个可选属性
interface Props {
	inversion?: boolean // 是否是请求消息，默认值为 false，即回复消息
	error?: boolean // 是否显示为错误消息，默认值为 false
	text?: string // 显示的文本内容
	loading?: boolean // 是否显示加载动画，默认值为 false
	asRawText?: boolean // 是否显示纯文本，默认值为 false，即使用 markdown 渲染
}

// 使用 defineProps 函数定义组件的 props，并将其赋值给 props 变量
const props = defineProps<Props>()

// 使用 useBasicLayout 自定义 Hook 获取布局相关的信息，例如设备是否为手机
const { isMobile } = useBasicLayout()

// 定义一个 textRef 变量，其初始值为 ref<HTMLElement> 类型的空对象
const textRef = ref<HTMLElement>()

// 创建一个 MarkdownIt 实例，设置了一些选项和插件，例如高亮代码和渲染公式
const mdi = new MarkdownIt({
	html: true,
	linkify: true,
	highlight(code, language) {
		const validLang = !!(language && hljs.getLanguage(language))
		if (validLang) {
			const lang = language ?? ''
			return highlightBlock(hljs.highlight(code, { language: lang }).value, lang)
		}
		return highlightBlock(hljs.highlightAuto(code).value, '')
	},
})

mdi.use(mila, { attrs: { target: '_blank', rel: 'noopener' } })
mdi.use(mdKatex, { blockClass: 'katexmath-block rounded-md p-[10px]', errorColor: ' #cc0000' })

// 定义一个 computed 属性 wrapClass，用于计算消息框的 CSS 类名
const wrapClass = computed(() => {
	return [
		'text-wrap', // 文本换行
		'min-w-[20px]', // 最小宽度为 20 像素
		'rounded-md', // 圆角边框
		isMobile.value ? 'p-2' : 'px-3 py-2', // 根据设备是否为手机设置不同的内边距
		props.inversion ? 'bg-[#d2f9d1]' : 'bg-[#f4f6f8]', // 根据是否是请求消息设置不同的背景色
		props.inversion ? 'dark:bg-[#a1dc95]' : 'dark:bg-[#1e1e20]', // 根据是否是请求消息设置不同的暗色背景色
		props.inversion ? 'message-request' : 'message-reply', // 根据是否是请求消息设置不同的样式
		{ 'text-red-500': props.error }, // 根据是否是错误消息设置不同的文本颜色
	]
})
// 定义一个 computed 属性 text，用于计算显示的文本
const text = computed(() => {
	const value = props.text ?? ''
	if (!props.asRawText)
		return mdi.render(value) // 如果不是纯文本，则使用 Markdown 渲染
	return value // 否则直接返回原始文本
})

// 定义一个函数 highlightBlock，用于高亮显示代码块
function highlightBlock(str: string, lang?: string) {
	return `<pre class="code-block-wrapper"><div class="code-block-header"><span class="code-block-header__lang">${lang}</span><span class="code-block-header__copy">${t('chat.copyCode')}</span></div><code class="hljs code-block-body ${lang}">${str}</code></pre>`
}

// 使用 defineExpose 函数将 textRef 暴露给组件的父组件
defineExpose({ textRef })
</script>

<template>
	<!-- 消息框的外层 div，根据 wrapClass 计算出的 CSS 类名动态设置样式 -->
	<div class="text-black" :class="wrapClass">
		<!-- 消息文本内容所在的 div，包含了一些其他样式和动态绑定的属性 -->
		<div ref="textRef" class="leading-relaxed break-words">
			<div v-if="!inversion">
				<!-- 如果不是纯文本，则使用 div 和 v-html 属性渲染 Markdown，否则使用 div 和 v-text 属性直接显示原始文本 -->
				<div v-if="!asRawText" class="markdown-body" v-html="text" />
				<div v-else class="whitespace-pre-wrap" v-text="text" />
			</div>
			<div v-else class="whitespace-pre-wrap" v-text="text" />
			<!-- 如果是加载状态，则显示一个动画小点 -->
			<template v-if="loading">
				<span class="dark:text-white w-[4px] h-[20px] block animate-blink" />
			</template>
		</div>
	</div>
</template>

<style lang="less">
@import url(./style.less); // 导入样式表
</style>
