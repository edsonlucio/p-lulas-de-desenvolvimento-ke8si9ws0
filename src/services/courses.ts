import pb from '@/lib/pocketbase/client'
import type { Course, CourseInput, CourseStatus } from '@/types/backoffice'

const seedCovers: Record<string, string> = {
  'mentoria-de-lideranca': 'https://img.usecurling.com/p/900/506?q=leadership%20meeting',
  'vendas-estrategicas': 'https://img.usecurling.com/p/900/506?q=business%20handshake',
  'atendimento-ao-cliente': 'https://img.usecurling.com/p/900/506?q=customer%20support',
  'inteligencia-emocional-integrativa':
    'https://img.usecurling.com/p/900/506?q=mindful%20meditation',
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function getCourseCoverUrl(course: Course): string | null {
  if (course.thumbnail) {
    return pb.files.getURL(course, course.thumbnail, { thumb: '640x360' })
  }
  return seedCovers[course.slug] ?? null
}

export async function listCourses(): Promise<Course[]> {
  return pb.collection<Course>('courses').getFullList({ sort: 'order,created' })
}

export async function getCourse(id: string): Promise<Course> {
  return pb.collection<Course>('courses').getOne(id)
}

function toFormData(input: CourseInput, current?: Course): FormData {
  const data = new FormData()
  data.append('title', input.title.trim())
  data.append('slug', slugify(input.title))
  data.append('description', input.description.trim())
  data.append('status', input.status)
  data.append('students_count', String(input.studentsCount ?? current?.students_count ?? 0))
  data.append('order', String(input.order ?? current?.order ?? 0))
  if (input.price !== undefined) {
    data.append('price', String(input.price))
  }
  if (input.thumbnail) {
    data.append('thumbnail', input.thumbnail)
  } else if (input.removeThumbnail) {
    data.append('thumbnail', '')
  }
  return data
}

export async function createCourse(input: CourseInput): Promise<Course> {
  return pb.collection<Course>('courses').create(toFormData(input))
}

export async function updateCourse(course: Course, input: CourseInput): Promise<Course> {
  return pb.collection<Course>('courses').update(course.id, toFormData(input, course))
}

export async function setCourseStatus(id: string, status: CourseStatus): Promise<Course> {
  return pb.collection<Course>('courses').update(id, { status })
}

export async function removeCourse(id: string): Promise<void> {
  await pb.collection('courses').delete(id)
}
