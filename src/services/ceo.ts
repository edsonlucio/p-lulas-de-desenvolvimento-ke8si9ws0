import pb from '@/lib/pocketbase/client'
import type { CeoMessage, CeoMessageStatus } from '@/types/backoffice'

export async function listCeoMessages(userId?: string): Promise<CeoMessage[]> {
  const options: Record<string, unknown> = {
    sort: '-created',
    expand: 'user',
  }
  if (userId) {
    options.filter = pb.filter('user = {:user}', { user: userId })
  }
  return pb.collection<CeoMessage>('ceo_messages').getFullList(options)
}

export async function createCeoMessage(data: {
  userId: string
  name: string
  email: string
  subject?: string
  message: string
  channel?: 'form' | 'chat'
}): Promise<CeoMessage> {
  return pb.collection<CeoMessage>('ceo_messages').create({
    user: data.userId,
    name: data.name.trim(),
    email: data.email.trim(),
    subject: (data.subject || 'Fale com o CEO').trim(),
    message: data.message.trim(),
    status: 'nova',
    channel: data.channel || 'form',
  })
}

export async function updateCeoMessageStatus(
  id: string,
  status: CeoMessageStatus,
  reply?: string,
): Promise<CeoMessage> {
  const payload: Record<string, unknown> = { status }
  if (reply !== undefined) {
    payload.reply = reply.trim()
    payload.replied_at = new Date().toISOString()
  }
  return pb.collection<CeoMessage>('ceo_messages').update(id, payload)
}

export async function deleteCeoMessage(id: string): Promise<void> {
  await pb.collection('ceo_messages').delete(id)
}
