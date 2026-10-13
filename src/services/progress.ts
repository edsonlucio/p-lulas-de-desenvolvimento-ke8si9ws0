import pb from '@/lib/pocketbase/client'
import type { LessonProgress } from '@/types/backoffice'

export async function getUserCourseProgress(userId: string): Promise<LessonProgress[]> {
  if (!userId) return []
  return pb.collection<LessonProgress>('lesson_progress').getFullList({
    filter: pb.filter('user = {:userId}', { userId }),
  })
}

export async function getLessonProgress(
  userId: string,
  lessonId: string,
): Promise<LessonProgress | null> {
  if (!userId || !lessonId) return null
  try {
    return await pb.collection<LessonProgress>('lesson_progress').getFirstListItem(
      pb.filter('user = {:userId} && lesson = {:lessonId}', {
        userId,
        lessonId,
      }),
    )
  } catch {
    return null
  }
}

export async function toggleLessonProgress(
  userId: string,
  lessonId: string,
  completed: boolean,
): Promise<LessonProgress> {
  const existing = await getLessonProgress(userId, lessonId)

  if (existing) {
    return pb.collection<LessonProgress>('lesson_progress').update(existing.id, {
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
  }

  return pb.collection<LessonProgress>('lesson_progress').create({
    user: userId,
    lesson: lessonId,
    completed,
    completed_at: completed ? new Date().toISOString() : null,
  })
}
