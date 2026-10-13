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
  price?: number
  created: string
  updated: string
}

export interface Lesson extends RecordModel {
  title: string
  course: string
  duration_min: number
  order: number
  description?: string
  content?: string
  video_url?: string
  thumbnail?: string
  video_upload?: string
  pdf_file?: string
  pdf_url?: string
  ppt_file?: string
  ppt_url?: string
  excel_file?: string
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
  study_material?: string
  study_material_file?: string
  course?: string
  resumo?: string
  created: string
  updated: string
  expand?: {
    student?: UserRecord
    course?: Course
  }
}

export interface MentorshipInput {
  student: string
  topic: string
  scheduledAt: string
  status: MentorshipStatus
  meetingLink?: string
  notes?: string
  studyMaterial?: string
  studyMaterialFile?: File | null
  removeStudyMaterialFile?: boolean
  course?: string
  resumo?: string
}

export type ClubePostType = 'pergunta' | 'resumo' | 'provocacao'

export interface ClubeBook extends RecordModel {
  title: string
  author: string
  month: string
  description?: string
  cover?: string
  status: 'ativo' | 'inativo'
  created: string
  updated: string
}

export interface ClubeDailyPost extends RecordModel {
  book: string
  date: string
  type: ClubePostType
  title: string
  content: string
  pages_range?: string
  order?: number
  created: string
  updated: string
  expand?: {
    book?: ClubeBook
  }
}

export interface ClubeMeeting extends RecordModel {
  book?: string
  date: string
  title: string
  description?: string
  meeting_link?: string
  status: 'agendado' | 'realizado' | 'cancelado'
  created: string
  updated: string
  expand?: {
    book?: ClubeBook
  }
}

export interface ClubeComment extends RecordModel {
  post: string
  author: string
  text: string
  created: string
  updated: string
  expand?: {
    author?: UserRecord
  }
}

export type EnrollmentStatus = 'ativo' | 'pendente' | 'cancelado'

export interface Enrollment extends RecordModel {
  user: string
  course: string
  status: EnrollmentStatus
  purchased_at?: string
  created: string
  updated: string
  expand?: {
    user?: UserRecord
    course?: Course
  }
}

export interface CourseInput {
  title: string
  description: string
  status: CourseStatus
  thumbnail?: File | null
  removeThumbnail?: boolean
  studentsCount?: number
  order?: number
  price?: number
}

export interface LessonInput {
  title: string
  course: string
  durationMin: number
  order: number
  description?: string
  content?: string
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
  excelFile?: File | null
  removeExcelFile?: boolean
}

export interface LessonFavorite extends RecordModel {
  user: string
  lesson: string
  created: string
  updated: string
  expand?: {
    lesson?: Lesson
  }
}

export type NotificationType = 'aula' | 'clube' | 'mentoria' | 'matricula' | 'sistema'

export interface CertificateRecord extends RecordModel {
  student: string
  course: string
  issued_at: string
  code: string
  created: string
  updated: string
  expand?: {
    student?: UserRecord
    course?: Course
  }
}

export interface AppNotification extends RecordModel {
  user: string
  title: string
  message: string
  type: NotificationType
  link?: string
  read?: boolean
  created: string
  updated: string
}

export type CeoMessageStatus = 'nova' | 'em_analise' | 'respondida' | 'arquivada'

export interface CeoMessage extends RecordModel {
  user: string
  name: string
  email: string
  subject?: string
  message: string
  status: CeoMessageStatus
  reply?: string
  replied_at?: string
  channel?: 'form' | 'chat'
  created: string
  updated: string
  expand?: {
    user?: UserRecord
  }
}

export type CommunityPostStatus = 'pendente' | 'aprovado' | 'rejeitado'

export interface CommunityPost extends RecordModel {
  author: string
  course?: string
  title: string
  content: string
  status: CommunityPostStatus
  rejection_reason?: string
  moderated_by?: string
  moderated_at?: string
  created: string
  updated: string
  expand?: {
    author?: UserRecord
    course?: Course
    moderated_by?: UserRecord
  }
  replies_count?: number
}

export interface CommunityReply extends RecordModel {
  post: string
  author: string
  content: string
  created: string
  updated: string
  expand?: {
    author?: UserRecord
  }
}
