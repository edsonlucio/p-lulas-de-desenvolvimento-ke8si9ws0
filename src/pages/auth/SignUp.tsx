import { useState, type FormEvent } from 'react'
import { Loader2, Mail, UserRound, UserPlus } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import { AuthShell } from '@/components/auth/AuthShell'
import { PasswordField } from '@/components/auth/PasswordField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError, getPortugueseFieldErrors } from '@/lib/pocketbase/translated-errors'
import { createAccount } from '@/services/auth'

export default function SignUp() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Informe seu nome.'
    if (!email.trim()) next.email = 'Informe seu e-mail.'
    if (password.length < 8) next.password = 'A senha deve ter pelo menos 8 caracteres.'
    if (password !== confirm) next.passwordConfirm = 'As senhas não coincidem.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      await createAccount(name, email, password)
      toast({
        title: 'Conta criada',
        description: 'Enviamos um link de verificação para o seu e-mail.',
      })
      navigate('/login', { replace: true })
    } catch (error) {
      const field = getPortugueseFieldErrors(error)
      setErrors({ ...field, form: Object.keys(field).length ? '' : getPortugueseError(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Crie sua conta"
      description="Cadastre seus dados para começar a administrar a plataforma."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name" className="font-bold text-[#1F3864]">
            Nome
          </Label>
          <div className="relative">
            <UserRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290A0]" />
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Seu nome completo"
              className="h-12 rounded-xl border-[#D9D9D9] pl-11 font-medium focus-visible:ring-[#6E9B1F]"
            />
          </div>
          {errors.name ? (
            <p className="text-xs font-semibold text-[#C0392B]">{errors.name}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email" className="font-bold text-[#1F3864]">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290A0]" />
            <Input
              id="signup-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              className="h-12 rounded-xl border-[#D9D9D9] pl-11 font-medium focus-visible:ring-[#6E9B1F]"
            />
          </div>
          {errors.email ? (
            <p className="text-xs font-semibold text-[#C0392B]">{errors.email}</p>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="font-bold text-[#1F3864]">
              Senha
            </Label>
            <PasswordField
              id="signup-password"
              value={password}
              onChange={setPassword}
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
            />
            {errors.password ? (
              <p className="text-xs font-semibold text-[#C0392B]">{errors.password}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-confirm" className="font-bold text-[#1F3864]">
              Confirmar
            </Label>
            <PasswordField
              id="signup-confirm"
              value={confirm}
              onChange={setConfirm}
              placeholder="Repita a senha"
              autoComplete="new-password"
              invalid={Boolean(errors.passwordConfirm)}
            />
            {errors.passwordConfirm ? (
              <p className="text-xs font-semibold text-[#C0392B]">{errors.passwordConfirm}</p>
            ) : null}
          </div>
        </div>
        {errors.form ? (
          <p className="rounded-xl bg-[#C0392B]/10 px-4 py-3 text-sm font-semibold text-[#C0392B]">
            {errors.form}
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          Criar conta
        </Button>
        <p className="text-center text-sm font-medium text-[#718096]">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-bold text-[#1F3864] hover:text-[#6E9B1F]">
            Entrar
          </Link>
        </p>
      </form>
    </AuthShell>
  )
}
