import type { RecordModel } from 'pocketbase'

export type CourseStatus = 'ativo' | 'inativo'

export type MentorshipStatus = 'agendada' | 'concluida' | 'cancelada'

export type UserRole = 'adm' | 'coordenador' | 'professor' | 'aluno'

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
  description?: string
  video_url?: string
  thumbnail?: string
  video_upload?: string
  pdf_file?: string
  pdf_url?: string
  ppt_file?: string
  ppt_url?: string
  created: string
  updated: string
  expand?: {
    course?: Course
  }
}

export interface LessonProgress extends RecordModel {
  user: string
  lesson: string
  completed: boolean
  completed_at?: string
  created: string
  updated: string
  expand?: {
    lesson?: Lesson
    user?: UserRecord
  }
}

export interface UserRecord extends RecordModel {
  email: string
  name: string
  avatar: string
  role?: UserRole
  verified: boolean
}

export interface LessonChatMessage extends RecordModel {
  lesson: string
  user: string
  message: string
  is_ai?: boolean
  conversation_id?: string
  created: string
  updated: string
  expand?: {
    user?: UserRecord
    lesson?: Lesson
  }
}

export interface Mentorship extends RecordModel {
  student: string
  topic: string
  scheduled_at: string
  status: MentorshipStatus
  meeting_link?: string
  notes?: string
  created: string
  updated: string
  expand?: {
    student?: UserRecord
  }
}

export interface MentorshipInput {
  student: string
  topic: string
  scheduledAt: string
  status: MentorshipStatus
  meetingLink?: string
  notes?: string
}

export interface CourseInput {
  title: string
  description: string
  status: CourseStatus
  thumbnail?: File | null
  removeThumbnail?: boolean
  studentsCount?: number
  order?: number
}

export interface LessonInput {
  title: string
  course: string
  durationMin: number
  order: number
  description?: string
  videoUrl?: string
  thumbnail?: File | null
  removeThumbnail?: boolean
  videoUpload?: File | null
  removeVideoUpload?: boolean
  pdfFile?: File | null
  removePdfFile?: boolean
  pdfUrl?: string
  pptFile?: File | null
  removePptFile?: boolean
  pptUrl?: string
}
