import pb from '@/lib/pocketbase/client'
import type { Enrollment, EnrollmentStatus } from '@/types/backoffice'

export async function listEnrollments(filter?: string): Promise<Enrollment[]> {
  return pb.collection<Enrollment>('enrollments').getFullList({
    filter: filter ?? '',
    sort: '-created',
    expand: 'user,course',
  })
}

export async function listUserEnrollments(userId: string): Promise<Enrollment[]> {
  return pb.collection<Enrollment>('enrollments').getFullList({
    filter: `user = '${userId}' && status = 'ativo'`,
    sort: '-created',
    expand: 'course',
  })
}

export async function checkUserCourseAccess(userId: string, courseId: string): Promise<boolean> {
  try {
    const list = await pb.collection<Enrollment>('enrollments').getList(1, 1, {
      filter: `user = '${userId}' && course = '${courseId}' && status = 'ativo'`,
    })
    return list.totalItems > 0
  } catch {
    return false
  }
}

export async function enrollStudent(data: {
  userId: string
  courseId: string
  status?: EnrollmentStatus
  purchasedAt?: string
}): Promise<Enrollment> {
  // Verificar se já existe matrícula (mesmo que cancelada)
  try {
    const existing = await pb
      .collection<Enrollment>('enrollments')
      .getFirstListItem(`user = '${data.userId}' && course = '${data.courseId}'`)
    if (existing) {
      return pb.collection<Enrollment>('enrollments').update(
        existing.id,
        {
          status: data.status || 'ativo',
          purchased_at: data.purchasedAt || existing.purchased_at || new Date().toISOString(),
        },
        { expand: 'user,course' },
      )
    }
  } catch {
    /* intentionally ignored */
  }

  return pb.collection<Enrollment>('enrollments').create(
    {
      user: data.userId,
      course: data.courseId,
      status: data.status || 'ativo',
      purchased_at: data.purchasedAt || new Date().toISOString(),
    },
    { expand: 'user,course' },
  )
}

export async function cancelEnrollment(enrollmentId: string): Promise<Enrollment> {
  return pb
    .collection<Enrollment>('enrollments')
    .update(enrollmentId, { status: 'cancelado' }, { expand: 'user,course' })
}

export async function reactivateEnrollment(enrollmentId: string): Promise<Enrollment> {
  return pb
    .collection<Enrollment>('enrollments')
    .update(enrollmentId, { status: 'ativo' }, { expand: 'user,course' })
}

export async function deleteEnrollment(enrollmentId: string): Promise<boolean> {
  return pb.collection('enrollments').delete(enrollmentId)
}
