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

export async function getLesson(id: string): Promise<Lesson> {
  return pb.collection<Lesson>('lessons').getOne(id, { expand: 'course' })
}

export function getLessonFileUrl(
  lesson: Lesson,
  filename?: string | null,
  options?: { thumb?: string; download?: boolean },
): string | null {
  if (!filename) return null
  return pb.files.getURL(lesson, filename, options)
}

function toLessonFormData(input: LessonInput): FormData {
  const data = new FormData()
  data.append('title', input.title.trim())
  data.append('course', input.course)
  data.append('duration_min', String(input.durationMin))
  data.append('order', String(input.order))
  data.append('description', input.description ?? '')
  data.append('content', input.content ?? '')
  data.append('video_url', input.videoUrl ?? '')
  data.append('pdf_url', input.pdfUrl ?? '')
  data.append('ppt_url', input.pptUrl ?? '')

  if (input.excelFile) {
    data.append('excel_file', input.excelFile)
  } else if (input.removeExcelFile) {
    data.append('excel_file', '')
  }

  if (input.thumbnail) {
    data.append('thumbnail', input.thumbnail)
  } else if (input.removeThumbnail) {
    data.append('thumbnail', '')
  }

  if (input.videoUpload) {
    data.append('video_upload', input.videoUpload)
  } else if (input.removeVideoUpload) {
    data.append('video_upload', '')
  }

  if (input.pdfFile) {
    data.append('pdf_file', input.pdfFile)
  } else if (input.removePdfFile) {
    data.append('pdf_file', '')
  }

  if (input.pptFile) {
    data.append('ppt_file', input.pptFile)
  } else if (input.removePptFile) {
    data.append('ppt_file', '')
  }

  return data
}

export async function createLesson(input: LessonInput): Promise<Lesson> {
  return pb.collection<Lesson>('lessons').create(toLessonFormData(input))
}

export async function updateLesson(id: string, input: LessonInput): Promise<Lesson> {
  return pb.collection<Lesson>('lessons').update(id, toLessonFormData(input))
}

export async function removeLesson(id: string): Promise<void> {
  await pb.collection('lessons').delete(id)
}
