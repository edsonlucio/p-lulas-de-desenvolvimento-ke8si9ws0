import { useState, type FormEvent } from 'react'
import { Loader2, LogIn, Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { getPortugueseError, getPortugueseFieldErrors } from '@/lib/pocketbase/translated-errors'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate to="/" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!email.trim()) next.identity = 'Informe seu e-mail.'
    if (!password) next.password = 'Informe sua senha.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await login(email, password)
      const destination =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'
      navigate(destination, { replace: true })
    } catch (error) {
      const field = getPortugueseFieldErrors(error)
      setErrors({ ...field, form: Object.keys(field).length ? '' : getPortugueseError(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell title="Bem-vindo de volta" description="Entre com seu e-mail e senha para acessar.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold text-[#1F3864]">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290A0]" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              className="h-12 rounded-xl border-[#D9D9D9] pl-11 font-medium focus-visible:ring-[#6E9B1F]"
            />
          </div>
          {errors.identity || errors.email ? (
            <p className="text-xs font-semibold text-[#C0392B]">
              {errors.identity || errors.email}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="font-bold text-[#1F3864]">
              Senha
            </Label>
            <Link
              to="/esqueci-senha"
              className="text-xs font-bold text-[#6E9B1F] transition hover:text-[#527915]"
            >
              Esqueci minha senha
            </Link>
          </div>
          <PasswordField
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Digite sua senha"
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
          disabled={loading}
          className="h-12 w-full rounded-xl bg-[#6E9B1F] font-bold text-white shadow-[0_7px_18px_rgba(110,155,31,.2)] transition hover:scale-[1.01] hover:bg-[#5C8619] active:scale-[.99]"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Entrar
        </Button>
        <p className="text-center text-sm font-medium text-[#718096]">
          Ainda não tem acesso?{' '}
          <Link to="/cadastro" className="font-bold text-[#1F3864] hover:text-[#6E9B1F]">
            Criar conta
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
