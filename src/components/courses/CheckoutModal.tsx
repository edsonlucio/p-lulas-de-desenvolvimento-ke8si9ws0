import { useState } from 'react'
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useToast } from '@/hooks/use-toast'
import { getCourseCoverUrl } from '@/services/courses'
import { requestCourseCheckout } from '@/services/enrollments'
import type { Course } from '@/types/backoffice'

interface CheckoutModalProps {
  course: Course | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CheckoutModal({ course, open, onOpenChange, onSuccess }: CheckoutModalProps) {
  const { user } = useAuth()
  const { refreshEnrollments } = useBackoffice()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!course) return null

  const cover = getCourseCoverUrl(course)
  const formattedPrice = course.price
    ? course.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : 'R$ 197,00'

  const handleRequestEnrollment = async () => {
    if (!user?.id) return
    setSubmitting(true)
    try {
      await requestCourseCheckout(user.id, course.id)
      await refreshEnrollments()
      setSubmitted(true)
      toast({
        title: 'Solicitação de Matrícula Enviada!',
        description:
          'Seu pedido foi registrado. O acesso será liberado assim que o pagamento for confirmado.',
      })
      onSuccess?.()
    } catch (err) {
      console.error('Erro ao solicitar checkout:', err)
      toast({
        variant: 'destructive',
        title: 'Não foi possível enviar a solicitação',
        description: 'Tente novamente ou entre em contato com a coordenação.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setSubmitted(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg rounded-3xl p-0 overflow-hidden font-quicksand dark:bg-[#1A334C]">
        {/* Banner com Capa */}
        <div className="relative aspect-[16/8] w-full overflow-hidden bg-gradient-to-br from-[#1F3864] via-[#334F68] to-[#1E3A12]">
          {cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white">
              P<span className="text-[#9CC747]">.</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <span className="inline-block rounded-full bg-[#6E9B1F] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Checkout Oficial
            </span>
            <h3 className="mt-1 text-xl font-bold text-white line-clamp-1">{course.title}</h3>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {submitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#EAF0DF] text-[#6E9B1F]">
                <Clock className="h-8 w-8 text-[#6E9B1F]" />
              </div>
              <h4 className="text-xl font-bold text-[#1F3864] dark:text-white">
                Pagamento em análise
              </h4>
              <p className="text-sm font-medium text-[#718096] dark:text-white/70 max-w-sm mx-auto">
                Sua solicitação para{' '}
                <strong className="text-[#1F3864] dark:text-white">{course.title}</strong> foi
                registrada com o status <strong>“pendente”</strong>.
              </p>
              <div className="rounded-2xl bg-[#FFF8E7] p-4 text-xs font-medium text-[#92400E] border border-[#F5B041]/30">
                A confirmação do pagamento é realizada manualmente pela administração. Assim que
                confirmada, as aulas e apostilas serão desbloqueadas automaticamente em sua conta.
              </div>
              <Button
                onClick={handleClose}
                className="w-full h-11 rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
              >
                Entendido
              </Button>
            </div>
          ) : (
            <>
              <div>
                <DialogHeader className="text-left space-y-1">
                  <DialogTitle className="text-lg font-bold text-[#1F3864] dark:text-white">
                    Solicitar Matrícula no Treinamento
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#718096] dark:text-white/60">
                    Garanta seu acesso completo às aulas gravadas, materiais complementares em
                    PDF/PPT e ao chat tutor com IA.
                  </DialogDescription>
                </DialogHeader>
              </div>

              {/* Bloco de Preço */}
              <div className="flex items-center justify-between rounded-2xl bg-[#F4F5F3] p-4 dark:bg-white/5 border border-[#EDF0EA] dark:border-white/10">
                <div>
                  <p className="text-xs font-semibold text-[#718096] dark:text-white/50 uppercase tracking-wider">
                    Investimento único
                  </p>
                  <p className="text-2xl font-bold text-[#1F3864] dark:text-white">
                    {formattedPrice}
                  </p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-[#EAF0DF] px-3 py-1 text-xs font-bold text-[#527915]">
                  <ShieldCheck className="h-4 w-4" />
                  Acesso completo
                </span>
              </div>

              {/* Aviso do fluxo sem gateway */}
              <div className="rounded-2xl border border-dashed border-[#CBD3C3] bg-[#FCFDFB] p-4 text-xs text-[#5A6B7E] dark:bg-white/5 dark:border-white/10 dark:text-white/70 leading-relaxed">
                <p className="font-bold text-[#1F3864] dark:text-white flex items-center gap-1.5 mb-1">
                  <CreditCard className="h-4 w-4 text-[#6E9B1F]" />
                  Como funciona a liberação?
                </p>
                Ao clicar em <strong>“Solicitar matrícula”</strong>, seu pedido ficará registrado
                como <em>Pagamento em análise</em>. Nossa equipe administrativa validará a
                confirmação manual do pagamento e ativará o acesso imediato ao seu curso.
              </div>

              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleRequestEnrollment}
                  disabled={submitting}
                  className="w-full h-12 rounded-xl bg-[#6E9B1F] text-base font-bold text-white shadow-md hover:bg-[#5C8619]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processando pedido...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Solicitar matrícula · {formattedPrice}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleClose}
                  className="w-full h-10 rounded-xl text-xs font-semibold text-[#718096] hover:bg-black/5 dark:hover:bg-white/10"
                >
                  Voltar ao catálogo
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
