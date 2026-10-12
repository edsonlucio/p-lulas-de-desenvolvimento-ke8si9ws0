import type { RecordModel } from 'pocketbase'

export type CourseStatus = 'ativo' | 'inativo'

export interface Course extends RecordModel {
  title: string
  slug: string
  description: string
  thumbnail: string
  status: CourseStatus
  students_count: number
  order: number
  created: string
  updated: string
}

export interface Lesson extends RecordModel {
  title: string
  course: string
  duration_min: number
  order: number
  created: string
  updated: string
  expand?: {
    course?: Course
  }
}

export interface UserRecord extends RecordModel {
  email: string
  name: string
  avatar: string
  verified: boolean
}

export interface CourseInput {
  title: string
  description: string
  status: CourseStatus
  thumbnail?: File | null
  studentsCount?: number
  order?: number
}

export interface LessonInput {
  title: string
  course: string
  durationMin: number
  order: number
}
