import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageSquare, X, Send, Loader2, Trash2, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserAvatar } from '@/components/UserAvatar'
import { RoleBadge } from '@/components/RoleBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  listLessonChatMessages,
  sendLessonChatMessage,
  deleteLessonChatMessage,
} from '@/services/chat'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import type { LessonChatMessage } from '@/types/backoffice'
import { cn } from '@/lib/utils'

interface LessonChatWidgetProps {
  lessonId: string
  lessonTitle: string
}

function formatChatTime(dateString: string): string {
  try {
    const d = new Date(dateString)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function LessonChatWidget({ lessonId, lessonTitle }: LessonChatWidgetProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<LessonChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [draft, setDraft] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Carregar histórico de mensagens
  const loadMessages = async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const list = await listLessonChatMessages(lessonId)
      setMessages(list)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    } finally {
      if (!quiet) setLoading(false)
    }
  }

  // Carrega ao abrir o chat ou ao trocar de aula
  useEffect(() => {
    if (isOpen) {
      loadMessages().then(() => {
        setTimeout(() => scrollToBottom('auto'), 150)
      })
    }
  }, [isOpen, lessonId])

  // Realtime subscription para novas mensagens da coleção de chat
  useEffect(() => {
    if (!isOpen) return

    let isMounted = true
    const unsubscribePromise = pb.collection('lesson_chat_messages').subscribe('*', async (e) => {
      if (!isMounted) return
      const record = e.record as unknown as LessonChatMessage
      if (record.lesson !== lessonId) return

      if (e.action === 'create') {
        // Buscar com expand para ter os dados do autor
        try {
          const fresh = await pb
            .collection<LessonChatMessage>('lesson_chat_messages')
            .getOne(record.id, { expand: 'user' })
          setMessages((prev) => {
            if (prev.some((m) => m.id === fresh.id)) return prev
            return [...prev, fresh]
          })
          setTimeout(() => scrollToBottom('smooth'), 100)
        } catch {
          // Se falhar o getOne, usa o registro puro
          setMessages((prev) => {
            if (prev.some((m) => m.id === record.id)) return prev
            return [...prev, record]
          })
        }
      } else if (e.action === 'delete') {
        setMessages((prev) => prev.filter((m) => m.id !== record.id))
      }
    })

    return () => {
      isMounted = false
      unsubscribePromise
        .then((unsub) => unsub())
        .catch(() => pb.collection('lesson_chat_messages').unsubscribe('*'))
    }
  }, [isOpen, lessonId])

  // Rolar para a última mensagem quando as mensagens mudarem e o chat estiver aberto
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      scrollToBottom('smooth')
    }
  }, [messages.length, isOpen])

  const handleSendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!draft.trim() || !user || sending) return

    const text = draft.trim()
    setDraft('')
    setSending(true)

    try {
      const created = await sendLessonChatMessage(lessonId, user.id, text)
      // Garantir que a mensagem aparece mesmo se o realtime atrasar
      setMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev
        return [...prev, created]
      })
      setTimeout(() => {
        scrollToBottom('smooth')
        inputRef.current?.focus()
      }, 50)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível enviar a mensagem',
        description: getPortugueseError(error),
      })
      setDraft(text) // Restaura em caso de falha
    } finally {
      setSending(false)
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    setDeletingId(msgId)
    try {
      await deleteLessonChatMessage(msgId)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      toast({ title: 'Mensagem apagada' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao apagar mensagem',
        description: getPortugueseError(error),
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-quicksand">
      {/* Painel do Chat */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat de dúvidas da aula"
          className="animate-fade-in-up mb-3 flex h-[520px] w-[340px] flex-col overflow-hidden rounded-3xl border border-[#1F3864]/10 bg-white shadow-[0_16px_40px_rgba(31,56,100,.22)] sm:w-[400px]"
        >
          {/* Header do Chat */}
          <div className="flex items-center justify-between bg-[#1F3864] px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-[#9CC747]">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">Dúvidas da Aula</p>
                <p className="truncate text-[11px] font-medium text-white/60">{lessonTitle}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
              aria-label="Fechar chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto bg-[#F8F9F7] p-4 space-y-3">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#6E9B1F]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#6E9B1F] mb-3">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <p className="font-bold text-sm text-[#1F3864]">Nenhuma dúvida ainda</p>
                <p className="text-xs text-[#718096] mt-1">
                  Seja o primeiro a enviar uma pergunta ou contribuição sobre esta aula!
                </p>
              </div>
            ) : (
              messages.map((item) => {
                const isOwn = item.user === user?.id
                const author = item.expand?.user
                const authorName = isOwn
                  ? 'Você'
                  : author?.name || (item.user ? 'Aluno' : 'Anônimo')
                const authorRole = author?.role

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group flex flex-col max-w-[85%]',
                      isOwn ? 'ml-auto items-end' : 'mr-auto items-start',
                    )}
                  >
                    {/* Cabeçalho da mensagem: nome + papel + horário */}
                    <div className="flex items-center gap-1.5 px-1 mb-1 text-[11px] font-semibold text-[#718096]">
                      <span>{authorName}</span>
                      {authorRole && !isOwn && <RoleBadge role={authorRole} size="sm" />}
                      <span className="text-[10px] text-[#A0AEC0]">
                        {formatChatTime(item.created)}
                      </span>
                      {isOwn && (
                        <button
                          onClick={() => handleDeleteMessage(item.id)}
                          disabled={deletingId === item.id}
                          className="opacity-0 group-hover:opacity-100 transition text-[#C0392B] hover:text-[#962D22] ml-1"
                          title="Apagar mensagem"
                          aria-label="Apagar mensagem"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Balão de mensagem:
                        Própria: verde oliva (#6E9B1F) com texto branco alinhado à direita
                        Alheia: cinza claro (#E2E8F0 / #EDF0EA) com texto escuro à esquerda */}
                    <div
                      className={cn(
                        'rounded-2xl px-3.5 py-2.5 text-sm shadow-sm break-words',
                        isOwn
                          ? 'bg-[#6E9B1F] text-white rounded-br-none'
                          : 'bg-white text-[#1F3864] border border-[#E2E8F0] rounded-bl-none',
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{item.message}</p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Campo para digitar perguntas */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 border-t border-[#EDF0EA] bg-white p-3"
          >
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void handleSendMessage()
                }
              }}
              placeholder="Digite sua dúvida ou comentário..."
              className="h-11 flex-1 rounded-xl border-[#D9D9D9] font-medium text-sm focus-visible:ring-[#6E9B1F]"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={!draft.trim() || sending}
              className="h-11 w-11 shrink-0 rounded-xl bg-[#6E9B1F] p-0 text-white hover:bg-[#5C8619] transition"
              aria-label="Enviar mensagem"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Fechar chat de dúvidas' : 'Abrir chat de dúvidas'}
        className={cn(
          'flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(31,56,100,.3)] transition-all duration-300 hover:scale-105 active:scale-95',
          isOpen ? 'bg-[#1F3864] hover:bg-[#172E43]' : 'bg-[#6E9B1F] hover:bg-[#5C8619]',
        )}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </button>
    </div>
  )
}
