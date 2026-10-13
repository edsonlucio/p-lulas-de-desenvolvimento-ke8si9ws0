import pb from '@/lib/pocketbase/client'
import type { AppNotification, NotificationType } from '@/types/backoffice'

export async function listUserNotifications(userId: string): Promise<AppNotification[]> {
  if (!userId) return []
  return pb.collection<AppNotification>('notifications').getFullList({
    filter: pb.filter('user = {:user}', { user: userId }),
    sort: '-created',
  })
}

export async function countUnreadNotifications(userId: string): Promise<number> {
  if (!userId) return 0
  try {
    const list = await pb.collection<AppNotification>('notifications').getList(1, 1, {
      filter: pb.filter('user = {:user} && read != true', { user: userId }),
    })
    return list.totalItems
  } catch {
    return 0
  }
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await pb.collection('notifications').update(id, { read: true })
}

export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  const unread = await pb.collection<AppNotification>('notifications').getFullList({
    filter: pb.filter('user = {:user} && read != true', { user: userId }),
  })
  await Promise.all(unread.map((n) => pb.collection('notifications').update(n.id, { read: true })))
}

export async function createNotification(data: {
  userId: string
  title: string
  message: string
  type: NotificationType
  link?: string
}): Promise<AppNotification> {
  return pb.collection<AppNotification>('notifications').create({
    user: data.userId,
    title: data.title,
    message: data.message,
    type: data.type,
    link: data.link || '',
    read: false,
  })
}

/**
 * Notifica todos os alunos matriculados em determinado curso
 */
export async function notifyEnrolledStudents(
  courseId: string,
  data: { title: string; message: string; type: NotificationType; link?: string },
): Promise<void> {
  try {
    const enrollments = await pb.collection('enrollments').getFullList({
      filter: pb.filter('course = {:course} && status = "ativo"', { course: courseId }),
    })
    const uniqueUserIds = Array.from(new Set(enrollments.map((e) => (e as { user: string }).user)))
    await Promise.all(
      uniqueUserIds.map((userId) =>
        createNotification({
          userId,
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link,
        }).catch((err) => console.warn('Falha ao notificar usuário:', err)),
      ),
    )
  } catch (err) {
    console.warn('Erro ao disparar notificações de curso:', err)
  }
}

/**
 * Notifica administradores e coordenadores (ex.: nova matrícula pendente)
 */
export async function notifyAdmins(data: {
  title: string
  message: string
  type: NotificationType
  link?: string
}): Promise<void> {
  try {
    const admins = await pb.collection('users').getFullList({
      filter: 'role = "adm" || role = "coordenador"',
    })
    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          title: data.title,
          message: data.message,
          type: data.type,
          link: data.link,
        }).catch((err) => console.warn('Falha ao notificar admin:', err)),
      ),
    )
  } catch (err) {
    console.warn('Erro ao notificar administradores:', err)
  }
}
