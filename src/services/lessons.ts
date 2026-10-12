import pb from '@/lib/pocketbase/client'
import type { Lesson, LessonInput } from '@/types/backoffice'

export async function listLessons(): Promise<Lesson[]> {
  return pb
    .collection<Lesson>('lessons')
    .getFullList({ sort: 'course,order,created', expand: 'course' })
}

export async function listCourseLessons(courseId: string): Promise<Lesson[]> {
  return pb.collection<Lesson>('lessons').getFullList({
    filter: pb.filter('course = {:course}', { course: courseId }),
    sort: 'order,created',
  })
}

export async function createLesson(input: LessonInput): Promise<Lesson> {
  return pb.collection<Lesson>('lessons').create({
    title: input.title.trim(),
    course: input.course,
    duration_min: input.durationMin,
    order: input.order,
  })
}

export async function updateLesson(id: string, input: LessonInput): Promise<Lesson> {
  return pb.collection<Lesson>('lessons').update(id, {
    title: input.title.trim(),
    course: input.course,
    duration_min: input.durationMin,
    order: input.order,
  })
}

export async function removeLesson(id: string): Promise<void> {
  await pb.collection('lessons').delete(id)
}
