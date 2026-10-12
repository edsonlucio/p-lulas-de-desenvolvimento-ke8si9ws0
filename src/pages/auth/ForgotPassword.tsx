import { useState, type FormEvent } from 'react'
import { ArrowLeft, Loader2, Mail, Send } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ActionState } from '@/components/auth/ActionState'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getPortugueseError, getPortugueseFieldErrors } from '@/lib/pocketbase/translated-errors'
import { requestPasswordReset } from '@/services/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) {
      setErrors({ email: 'Informe seu e-mail.' })
      return
    }
    setLoading(true)
    setErrors({})
    try {
      await requestPasswordReset(email)
      setSent(true)
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
      title="Recupere seu acesso"
      description="Enviaremos um link seguro para você definir uma nova senha."
    >
      {sent ? (
        <ActionState
          status="success"
          title="E-mail enviado"
          description={`Se existir uma conta para ${email}, você receberá as instruções em instantes.`}
        >
          <Button
            variant="outline"
            onClick={() => setSent(false)}
            className="w-full rounded-xl border-[#D9D9D9] font-bold text-[#1F3864]"
          >
            Enviar novamente
          </Button>
          <Link
            to="/login"
            className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 text-sm font-bold text-[#6E9B1F]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
        </ActionState>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div className="space-y-2">
            <Label htmlFor="reset-email" className="font-bold text-[#1F3864]">
              E-mail cadastrado
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8290A0]" />
              <Input
                id="reset-email"
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
              <Send className="mr-2 h-4 w-4" />
            )}
            Enviar link de recuperação
          </Button>
          <Link
            to="/login"
            className="flex min-h-10 items-center justify-center gap-2 text-sm font-bold text-[#5A6B7E] hover:text-[#1F3864]"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>
        </form>
      )}
    </AuthShell>
  )
}
