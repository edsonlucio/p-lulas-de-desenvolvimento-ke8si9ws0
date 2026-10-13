import type { UserRecord, UserRole } from '@/types/backoffice'

export const ROLE_LABELS: Record<UserRole, string> = {
  adm: 'Adm',
  coordenador: 'Coordenador',
  professor: 'Professor',
  aluno: 'Aluno',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  adm: 4,
  coordenador: 3,
  professor: 2,
  aluno: 1,
}

export function getUserRole(user: UserRecord | null | undefined): UserRole {
  if (!user || !user.role) return 'aluno'
  const role = user.role.toLowerCase() as UserRole
  if (['adm', 'coordenador', 'professor', 'aluno'].includes(role)) {
    return role
  }
  return 'aluno'
}

/**
 * Adm e Coordenador podem gerenciar (criar, excluir, status) cursos e aulas.
 */
export function canManageCoursesAndLessons(user: UserRecord | null | undefined): boolean {
  const role = getUserRole(user)
  return role === 'adm' || role === 'coordenador'
}

/**
 * Adm e Coordenador podem gerenciar papéis de outros usuários.
 */
export function canManageUsers(user: UserRecord | null | undefined): boolean {
  const role = getUserRole(user)
  return role === 'adm' || role === 'coordenador'
}

/**
 * Professor pode editar o conteúdo/descrição da aula; Adm e Coordenador têm permissão total.
 */
export function canEditLesson(user: UserRecord | null | undefined): boolean {
  const role = getUserRole(user)
  return role === 'adm' || role === 'coordenador' || role === 'professor'
}

/**
 * Cores do Badge de papel:
 * Adm: azul petróleo (#1F3864)
 * Coordenador: verde oliva mais escuro (#527915)
 * Professor: verde oliva (#6E9B1F)
 * Aluno: cinza claro (#718096 / bg-[#E2E8F0])
 */
export function getRoleBadgeStyles(role: UserRole): { bg: string; text: string; border: string } {
  switch (role) {
    case 'adm':
      return {
        bg: 'bg-[#1F3864]',
        text: 'text-white',
        border: 'border-[#1F3864]',
      }
    case 'coordenador':
      return {
        bg: 'bg-[#527915]',
        text: 'text-white',
        border: 'border-[#527915]',
      }
    case 'professor':
      return {
        bg: 'bg-[#6E9B1F]',
        text: 'text-white',
        border: 'border-[#6E9B1F]',
      }
    case 'aluno':
    default:
      return {
        bg: 'bg-[#EDF0EA]',
        text: 'text-[#44546A]',
        border: 'border-[#D9DED6]',
      }
  }
}
