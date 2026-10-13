import pb from '@/lib/pocketbase/client'
import type { LessonFavorite } from '@/types/backoffice'

export async function listUserFavorites(userId: string): Promise<LessonFavorite[]> {
  if (!userId) return []
  return pb.collection<LessonFavorite>('lesson_favorites').getFullList({
    filter: pb.filter('user = {:user}', { user: userId }),
    sort: '-created',
    expand: 'lesson,lesson.course',
  })
}

export async function isLessonFavorited(userId: string, lessonId: string): Promise<boolean> {
  if (!userId || !lessonId) return false
  try {
    const list = await pb.collection<LessonFavorite>('lesson_favorites').getList(1, 1, {
      filter: pb.filter('user = {:user} && lesson = {:lesson}', { user: userId, lesson: lessonId }),
    })
    return list.totalItems > 0
  } catch {
    return false
  }
}

export async function toggleFavoriteLesson(userId: string, lessonId: string): Promise<boolean> {
  if (!userId || !lessonId) return false
  try {
    const existing = await pb
      .collection<LessonFavorite>('lesson_favorites')
      .getFirstListItem(`user = '${userId}' && lesson = '${lessonId}'`)
    if (existing) {
      await pb.collection('lesson_favorites').delete(existing.id)
      return false
    }
  } catch {
    // not favorited yet
  }

  await pb.collection<LessonFavorite>('lesson_favorites').create({
    user: userId,
    lesson: lessonId,
  })
  return true
}
