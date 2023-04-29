import { useChatStore } from '@/store'

// 定义自定义hook
export function useChat() {
	const chatStore = useChatStore() // 获取聊天记录的Vuex store

	// 获取给定UUID和索引的聊天记录
	const getChatByUuidAndIndex = (uuid: number, index: number) => {
		return chatStore.getChatByUuidAndIndex(uuid, index)
	}

	// 向给定UUID的聊天记录中添加一个新的聊天记录
	const addChat = (uuid: number, chat: Chat.Chat) => {
		chatStore.addChatByUuid(uuid, chat)
	}

	// 更新给定UUID和索引的聊天记录为一个新的聊天记录
	const updateChat = (uuid: number, index: number, chat: Chat.Chat) => {
		chatStore.updateChatByUuid(uuid, index, chat)
	}

	// 更新给定UUID和索引的聊天记录的部分属性
	const updateChatSome = (uuid: number, index: number, chat: Partial<Chat.Chat>) => {
		chatStore.updateChatSomeByUuid(uuid, index, chat)
	}

	// 导出函数和对象，供调用此hook的组件使用
	return {
		addChat,
		updateChat,
		updateChatSome,
		getChatByUuidAndIndex,
	}
}
