import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'

import { ActionState } from '@/components/auth/ActionState'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { confirmEmailVerification } from '@/services/auth'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Estamos validando seu endereço de e-mail com segurança.')

  useEffect(() => {
    if (!token) {
      setState('error')
      setMessage('O link de verificação está incompleto ou expirou.')
      return
    }
    confirmEmailVerification(token)
      .then(() => {
        setState('success')
        setMessage('Seu e-mail foi confirmado. A conta está pronta para uso.')
      })
      .catch((error) => {
        setState('error')
        setMessage(getPortugueseError(error))
      })
  }, [token])

  return (
    <AuthShell
      compact
      title="Verificação de e-mail"
      description="Confirmação da sua conta administrativa."
    >
      <ActionState
        status={state}
        title={
          state === 'loading'
            ? 'Confirmando seu e-mail'
            : state === 'success'
              ? 'E-mail verificado'
              : 'Não foi possível verificar'
        }
        description={message}
      >
        {state !== 'loading' ? (
          <Button
            asChild
            className="h-11 w-full rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
          >
            <Link to="/login">
              Ir para o login <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : null}
      </ActionState>
    </AuthShell>
  )
}
