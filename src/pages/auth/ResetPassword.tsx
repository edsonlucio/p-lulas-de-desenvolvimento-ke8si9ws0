import { useState, type FormEvent } from 'react'
import { ArrowRight, KeyRound, Loader2 } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { ActionState } from '@/components/auth/ActionState'
import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { getPortugueseError, getPortugueseFieldErrors } from '@/lib/pocketbase/translated-errors'
import { confirmPasswordReset } from '@/services/auth'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!token) next.token = 'O link de recuperação está incompleto ou expirou.'
    if (password.length < 8) next.password = 'A senha deve ter pelo menos 8 caracteres.'
    if (password !== confirm) next.passwordConfirm = 'As senhas não coincidem.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await confirmPasswordReset(token, password)
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
      title="Defina uma nova senha"
      description="Escolha uma senha segura, com pelo menos 8 caracteres."
    >
      {success ? (
        <ActionState
          status="success"
          title="Senha redefinida"
          description="Sua nova senha já está ativa. Você pode entrar no backoffice."
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
            <Label htmlFor="reset-password" className="font-bold text-[#1F3864]">
              Nova senha
            </Label>
            <PasswordField
              id="reset-password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo de 8 caracteres"
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
            />
            {errors.password ? (
              <p className="text-xs font-semibold text-[#C0392B]">{errors.password}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reset-confirm" className="font-bold text-[#1F3864]">
              Confirmar nova senha
            </Label>
            <PasswordField
              id="reset-confirm"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repita a nova senha"
              autoComplete="new-password"
              invalid={Boolean(errors.passwordConfirm)}
            />
            {errors.passwordConfirm ? (
              <p className="text-xs font-semibold text-[#C0392B]">{errors.passwordConfirm}</p>
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
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            Salvar nova senha
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
