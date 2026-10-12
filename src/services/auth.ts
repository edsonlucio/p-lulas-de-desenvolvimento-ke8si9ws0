import pb from '@/lib/pocketbase/client'
import type { UserRecord } from '@/types/backoffice'

export async function loginWithPassword(email: string, password: string) {
  return pb.collection<UserRecord>('users').authWithPassword(email.trim(), password)
}

export async function createAccount(name: string, email: string, password: string) {
  const user = await pb.collection<UserRecord>('users').create({
    name: name.trim(),
    email: email.trim(),
    password,
    passwordConfirm: password,
    emailVisibility: false,
  })
  await pb.collection('users').requestVerification(email.trim())
  return user
}

export async function requestPasswordReset(email: string) {
  return pb.collection('users').requestPasswordReset(email.trim())
}

export async function confirmPasswordReset(token: string, password: string) {
  return pb.collection('users').confirmPasswordReset(token, password, password)
}

export async function confirmEmailVerification(token: string) {
  return pb.collection('users').confirmVerification(token)
}

export async function requestEmailChange(email: string) {
  return pb.collection('users').requestEmailChange(email.trim())
}

export async function confirmEmailChange(token: string, password: string) {
  return pb.collection('users').confirmEmailChange(token, password)
}

export function getUserAvatarUrl(user: UserRecord | null, size = '100x100'): string | null {
  if (!user?.avatar) return null
  return pb.files.getURL(user, user.avatar, { thumb: size })
}
