import pb from '@/lib/pocketbase/client'
import type { Mentorship, MentorshipInput, UserRecord } from '@/types/backoffice'

export function getMentorshipMaterialUrl(mentorship: Mentorship): string | null {
  if (!mentorship.study_material_file) return null
  return pb.files.getURL(mentorship, mentorship.study_material_file)
}

export async function listMentorships(): Promise<Mentorship[]> {
  return pb.collection<Mentorship>('mentorships').getFullList({
    sort: '-scheduled_at',
    expand: 'student,course',
  })
}

export async function listStudents(): Promise<UserRecord[]> {
  return pb.collection<UserRecord>('users').getFullList({
    sort: 'name',
  })
}

export async function createMentorship(input: MentorshipInput): Promise<Mentorship> {
  const form = new FormData()
  form.append('student', input.student)
  form.append('topic', input.topic.trim())
  form.append('scheduled_at', input.scheduledAt)
  form.append('status', input.status)
  form.append('meeting_link', input.meetingLink?.trim() || '')
  form.append('notes', input.notes?.trim() || '')
  if (input.course) form.append('course', input.course)
  if (input.studyMaterial) form.append('study_material', input.studyMaterial.trim())
  if (input.studyMaterialFile) form.append('study_material_file', input.studyMaterialFile)

  return pb.collection<Mentorship>('mentorships').create(form, {
    expand: 'student,course',
  })
}

export async function updateMentorship(id: string, input: MentorshipInput): Promise<Mentorship> {
  const form = new FormData()
  form.append('student', input.student)
  form.append('topic', input.topic.trim())
  form.append('scheduled_at', input.scheduledAt)
  form.append('status', input.status)
  form.append('meeting_link', input.meetingLink?.trim() || '')
  form.append('notes', input.notes?.trim() || '')
  form.append('course', input.course || '')
  form.append('study_material', input.studyMaterial?.trim() || '')
  if (input.removeStudyMaterialFile) {
    form.append('study_material_file', '')
  } else if (input.studyMaterialFile) {
    form.append('study_material_file', input.studyMaterialFile)
  }

  return pb.collection<Mentorship>('mentorships').update(id, form, {
    expand: 'student,course',
  })
}

export async function removeMentorship(id: string): Promise<void> {
  await pb.collection('mentorships').delete(id)
}
