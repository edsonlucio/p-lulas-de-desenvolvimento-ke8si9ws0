import { useState, type FormEvent } from 'react'
import { ArrowRight, Loader2, MailCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { ActionState } from '@/components/auth/ActionState'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getPortugueseError, getPortugueseFieldErrors } from '@/lib/pocketbase/translated-errors'
import { confirmEmailChange } from '@/services/auth'

export default function ConfirmEmailChange() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!token) next.token = 'O link de confirmação está incompleto ou expirou.'
    if (!password) next.password = 'Informe sua senha para confirmar sua identidade.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await confirmEmailChange(token, password)
      setSuccess(true)
    } catch (error) {
      const field = getPortugueseFieldErrors(error)
      setErrors({ ...field, form: Object.keys(field).length ? '' : getPortugueseError(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      compact
      title="Confirmar novo e-mail"
      description="Digite sua senha atual para concluir a alteração com segurança."
    >
      {success ? (
        <ActionState
          status="success"
          title="E-mail alterado"
          description="Seu novo endereço foi confirmado. Entre novamente com o e-mail atualizado."
        >
          <Button
            asChild
            className="h-11 w-full rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
          >
            <Link to="/login">
              Ir para o login <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </ActionState>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          {errors.token ? (
            <p className="rounded-xl bg-[#C0392B]/10 px-4 py-3 text-sm font-semibold text-[#C0392B]">
              {errors.token}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email-change-password" className="font-bold text-[#1F3864]">
              Senha atual
            </Label>
            <PasswordField
              id="email-change-password"
              value={password}
              onChange={setPassword}
              placeholder="Confirme sua senha"
              invalid={Boolean(errors.password)}
            />
            {errors.password ? (
              <p className="text-xs font-semibold text-[#C0392B]">{errors.password}</p>
            ) : null}
          </div>
          {errors.form ? (
            <p className="rounded-xl bg-[#C0392B]/10 px-4 py-3 text-sm font-semibold text-[#C0392B]">
              {errors.form}
            </p>
          ) : null}
          <Button
            type="submit"
            disabled={loading || !token}
            className="h-12 w-full rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MailCheck className="mr-2 h-4 w-4" />
            )}
            Confirmar alteração
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
