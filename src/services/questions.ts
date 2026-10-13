import pb from '@/lib/pocketbase/client'
import type { LessonChatMessage } from '@/types/backoffice'

/**
 * Mensagens de dúvida enviadas por alunos (is_ai = false),
 * com a aula e o curso expandidos para agrupamento.
 */
export type QuestionMessage = LessonChatMessage & {
  expand?: {
    user?: { name?: string; email?: string }
    lesson?: { title: string; course: string }
    'lesson.course'?: { id: string; title: string; slug: string }
  }
}

export async function listStudentQuestions(): Promise<QuestionMessage[]> {
  return pb.collection<QuestionMessage>('lesson_chat_messages').getFullList({
    filter: pb.filter('is_ai != true'),
    sort: '-created',
    expand: 'user, lesson, lesson.course',
  })
}
