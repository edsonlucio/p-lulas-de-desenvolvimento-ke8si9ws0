import pb from '@/lib/pocketbase/client'
import type { CertificateRecord } from '@/types/backoffice'

function generateCertificateCode(courseSlug: string): string {
  const cleanSlug = (courseSlug || 'curso')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 8)
    .toUpperCase()
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `PIL-${cleanSlug}-${randomPart}`
}

export async function listUserCertificates(studentId: string): Promise<CertificateRecord[]> {
  if (!studentId) return []
  return pb.collection<CertificateRecord>('certificates').getFullList({
    filter: pb.filter('student = {:studentId}', { studentId }),
    sort: '-issued_at',
    expand: 'course,student',
  })
}

export async function listAllCertificates(): Promise<CertificateRecord[]> {
  return pb.collection<CertificateRecord>('certificates').getFullList({
    sort: '-issued_at',
    expand: 'course,student',
  })
}

export async function getCertificateForCourse(
  studentId: string,
  courseId: string,
): Promise<CertificateRecord | null> {
  if (!studentId || !courseId) return null
  try {
    return await pb.collection<CertificateRecord>('certificates').getFirstListItem(
      pb.filter('student = {:studentId} && course = {:courseId}', {
        studentId,
        courseId,
      }),
      { expand: 'course,student' },
    )
  } catch {
    return null
  }
}

/**
 * Cria ou retorna certificado existente para o curso (idempotente)
 */
export async function issueCertificate(
  studentId: string,
  courseId: string,
  courseSlug: string = 'curso',
): Promise<CertificateRecord> {
  const existing = await getCertificateForCourse(studentId, courseId)
  if (existing) {
    return existing
  }

  const code = generateCertificateCode(courseSlug)
  return pb.collection<CertificateRecord>('certificates').create(
    {
      student: studentId,
      course: courseId,
      issued_at: new Date().toISOString(),
      code,
    },
    { expand: 'course,student' },
  )
}
