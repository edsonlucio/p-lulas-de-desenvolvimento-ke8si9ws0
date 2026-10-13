import pb from '@/lib/pocketbase/client'
import type { Mentorship, MentorshipInput, UserRecord } from '@/types/backoffice'

export async function listMentorships(): Promise<Mentorship[]> {
  return pb.collection<Mentorship>('mentorships').getFullList({
    sort: '-scheduled_at',
    expand: 'student',
  })
}

export async function listStudents(): Promise<UserRecord[]> {
  return pb.collection<UserRecord>('users').getFullList({
    sort: 'name',
  })
}

export async function createMentorship(input: MentorshipInput): Promise<Mentorship> {
  return pb.collection<Mentorship>('mentorships').create(
    {
      student: input.student,
      topic: input.topic.trim(),
      scheduled_at: input.scheduledAt,
      status: input.status,
      meeting_link: input.meetingLink?.trim() || '',
      notes: input.notes?.trim() || '',
    },
    {
      expand: 'student',
    },
  )
}

export async function updateMentorship(id: string, input: MentorshipInput): Promise<Mentorship> {
  return pb.collection<Mentorship>('mentorships').update(
    id,
    {
      student: input.student,
      topic: input.topic.trim(),
      scheduled_at: input.scheduledAt,
      status: input.status,
      meeting_link: input.meetingLink?.trim() || '',
      notes: input.notes?.trim() || '',
    },
    {
      expand: 'student',
    },
  )
}

export async function removeMentorship(id: string): Promise<void> {
  await pb.collection('mentorships').delete(id)
}
