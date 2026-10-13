import pb from '@/lib/pocketbase/client'
import type { LessonChatMessage } from '@/types/backoffice'

export async function listLessonChatMessages(lessonId: string): Promise<LessonChatMessage[]> {
  return pb.collection<LessonChatMessage>('lesson_chat_messages').getFullList({
    filter: pb.filter('lesson = {:lesson}', { lesson: lessonId }),
    sort: 'created',
    expand: 'user',
  })
}

export interface SendChatMessageOptions {
  isAi?: boolean
  conversationId?: string
}

export async function sendLessonChatMessage(
  lessonId: string,
  userId: string,
  message: string,
  options: SendChatMessageOptions = {},
): Promise<LessonChatMessage> {
  return pb.collection<LessonChatMessage>('lesson_chat_messages').create(
    {
      lesson: lessonId,
      user: userId,
      message: message.trim(),
      is_ai: Boolean(options.isAi),
      conversation_id: options.conversationId || '',
    },
    {
      expand: 'user',
    },
  )
}

export async function deleteLessonChatMessage(id: string): Promise<void> {
  await pb.collection('lesson_chat_messages').delete(id)
}
