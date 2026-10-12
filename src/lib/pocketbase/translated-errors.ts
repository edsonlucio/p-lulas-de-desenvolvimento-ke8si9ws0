import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'

const translations: Array<[RegExp, string]> = [
  [/missing required value|cannot be blank|required/i, 'Este campo é obrigatório.'],
  [/must be unique|already exists|unique constraint/i, 'Este valor já está em uso.'],
  [/invalid email|must be a valid email/i, 'Informe um e-mail válido.'],
  [/invalid password|old password/i, 'A senha atual está incorreta.'],
  [/failed to authenticate|authentication failed/i, 'E-mail ou senha incorretos.'],
  [/file.*too (large|big)|maximum.*size|max.*size/i, 'A imagem deve ter no máximo 5 MB.'],
  [/mime|file type|extension/i, 'Use uma imagem PNG, JPG ou WEBP.'],
  [/token.*expired|invalid token/i, 'Este link é inválido ou expirou. Solicite um novo link.'],
  [
    /network|failed to fetch/i,
    'Não foi possível conectar. Verifique sua internet e tente novamente.',
  ],
]

function translate(message: string): string {
  const match = translations.find(([pattern]) => pattern.test(message))
  return match?.[1] ?? message
}

export function getPortugueseFieldErrors(error: unknown): FieldErrors {
  const raw = extractFieldErrors(error)
  return Object.fromEntries(
    Object.entries(raw).map(([field, message]) => [field, translate(message)]),
  )
}

export function getPortugueseError(error: unknown): string {
  return translate(getErrorMessage(error))
}
