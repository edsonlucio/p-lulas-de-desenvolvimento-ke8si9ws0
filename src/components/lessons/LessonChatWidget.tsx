import { useEffect, useRef, useState, type FormEvent } from 'react'
import { MessageSquare, X, Send, Loader2, Trash2, Bot, Sparkles, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RoleBadge } from '@/components/RoleBadge'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import {
  listLessonChatMessages,
  sendLessonChatMessage,
  deleteLessonChatMessage,
} from '@/services/chat'
import { streamAgentChat } from '@/lib/skipAi'
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
  const [isThinking, setIsThinking] = useState(false)
  const [streamingAiText, setStreamingAiText] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Carregar histórico de mensagens desta aula
  const loadMessages = async (quiet = false) => {
    if (!quiet) setLoading(true)
    try {
      const list = await listLessonChatMessages(lessonId)
      setMessages(list)

      // Se já houver um conversation_id persistido em mensagens desta aula, reaproveitar
      // Priorizamos o conversation_id mais recente que pertença ao usuário logado ou da aula
      const userMsgWithConv = [...list]
        .reverse()
        .find((m) => m.conversation_id && (m.user === user?.id || m.is_ai))

      if (userMsgWithConv?.conversation_id) {
        setConversationId(userMsgWithConv.conversation_id)
      } else {
        // Tenta também buscar no localStorage como fallback para a sessão da aula
        const localConvKey = `tutor_conv_${lessonId}_${user?.id || 'guest'}`
        const cachedConv = localStorage.getItem(localConvKey)
        if (cachedConv) {
          setConversationId(cachedConv)
        }
      }
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
    } else {
      // Ao fechar, aborta qualquer stream pendente se houver
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      setIsThinking(false)
      setStreamingAiText(null)
      setSending(false)
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
        try {
          const fresh = await pb
            .collection<LessonChatMessage>('lesson_chat_messages')
            .getOne(record.id, { expand: 'user' })
          setMessages((prev) => {
            if (prev.some((m) => m.id === fresh.id)) return prev
            return [...prev, fresh]
          })
          setTimeout(() => scrollToBottom('smooth'), 80)
        } catch {
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

  // Rolar para a última mensagem quando as mensagens ou o streaming mudarem
  useEffect(() => {
    if (isOpen && (messages.length > 0 || streamingAiText || isThinking)) {
      scrollToBottom('smooth')
    }
  }, [messages.length, streamingAiText, isThinking, isOpen])

  const handleSendMessage = async (e?: FormEvent, textOverride?: string) => {
    if (e) e.preventDefault()
    const questionText = (textOverride ?? draft).trim()
    if (!questionText || !user || sending || isThinking) return

    if (!textOverride) setDraft('')
    setSending(true)
    setIsThinking(true)
    setStreamingAiText(null)

    // Cria AbortController para permitir cancelamento se o usuário fechar
    const abortCtrl = new AbortController()
    abortControllerRef.current = abortCtrl

    const localConvKey = `tutor_conv_${lessonId}_${user.id}`
    let activeConvId = conversationId || localStorage.getItem(localConvKey)

    let createdUserMsg: LessonChatMessage | null = null

    try {
      // 1. Salvar a pergunta do usuário no banco
      createdUserMsg = await sendLessonChatMessage(lessonId, user.id, questionText, {
        isAi: false,
        conversationId: activeConvId || undefined,
      })

      // Atualizar localmente a mensagem do aluno caso o realtime leve milissegundos
      setMessages((prev) => {
        if (createdUserMsg && !prev.some((m) => m.id === createdUserMsg?.id)) {
          return [...prev, createdUserMsg]
        }
        return prev
      })
      setTimeout(() => scrollToBottom('smooth'), 50)

      // 2. Chamar o backend hook do tutor com streaming
      const backendUrl = import.meta.env.VITE_POCKETBASE_URL
      const response = await fetch(`${backendUrl}/backend/v1/lesson-tutor-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: pb.authStore.token,
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          message: questionText,
          conversation_id: activeConvId || null,
        }),
        signal: abortCtrl.signal,
      })

      // Captura antecipada de X-Conversation-Id do header SSE
      const headerConvId = response.headers.get('X-Conversation-Id')
      if (headerConvId && headerConvId !== activeConvId) {
        activeConvId = headerConvId
        setConversationId(headerConvId)
        localStorage.setItem(localConvKey, headerConvId)
      }

      // 3. Processar stream de resposta do agente Skip nativo
      const streamResult = await streamAgentChat(response, {
        onChunk: (_delta, accumulated) => {
          setIsThinking(false)
          setStreamingAiText(accumulated)
          scrollToBottom('auto')
        },
        onError: (err) => {
          console.error('Erro no stream do tutor:', err)
        },
        signal: abortCtrl.signal,
      })

      const finalConvId = streamResult.conversation_id || activeConvId || ''
      if (finalConvId) {
        setConversationId(finalConvId)
        localStorage.setItem(localConvKey, finalConvId)
      }

      const finalReply = streamResult.content.trim()

      // 4. Salvar resposta final da IA no banco com marcador is_ai = true
      if (finalReply) {
        const savedAiMsg = await sendLessonChatMessage(lessonId, user.id, finalReply, {
          isAi: true,
          conversationId: finalConvId,
        })

        // Garante que a mensagem final da IA entra na lista
        setMessages((prev) => {
          if (!prev.some((m) => m.id === savedAiMsg.id)) {
            return [...prev, savedAiMsg]
          }
          return prev
        })
      }
    } catch (error) {
      if (abortCtrl.signal.aborted) {
        return
      }
      console.error('Erro no Tutor IA:', error)
      toast({
        variant: 'destructive',
        title: 'Tutor Pílulas',
        description: 'Não foi possível responder agora. Tente novamente.',
      })
      // Se falhou antes de enviar a pergunta, restaura o rascunho
      if (!createdUserMsg) {
        setDraft(questionText)
      }
    } finally {
      setIsThinking(false)
      setStreamingAiText(null)
      setSending(false)
      abortControllerRef.current = null
      setTimeout(() => {
        scrollToBottom('smooth')
        inputRef.current?.focus()
      }, 60)
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

  // Reiniciar a conversa (novo tópico)
  const handleResetConversation = () => {
    const localConvKey = `tutor_conv_${lessonId}_${user?.id || 'guest'}`
    localStorage.removeItem(localConvKey)
    setConversationId(null)
    toast({
      title: 'Nova conversa iniciada',
      description: 'O contexto anterior foi zerado para uma nova sequência de dúvidas.',
    })
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-quicksand">
      {/* Painel do Chat */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chat de dúvidas com Tutor IA da aula"
          className="animate-fade-in-up mb-3 flex h-[560px] w-[350px] flex-col overflow-hidden rounded-3xl border border-[#1F3864]/10 bg-white shadow-[0_16px_40px_rgba(31,56,100,.22)] sm:w-[420px]"
        >
          {/* Header do Chat com identidade Pílulas de Desenvolvimento e Tutor IA */}
          <div className="flex items-center justify-between bg-[#1F3864] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#9CC747] ring-2 ring-white/10">
                <Bot className="h-5 w-5 text-[#9CC747]" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-bold text-white">Tutor Pílulas</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#6E9B1F]/30 px-2 py-0.5 text-[10px] font-bold text-[#A8D052] ring-1 ring-[#6E9B1F]/50">
                    <Sparkles className="h-2.5 w-2.5" />
                    IA Nativa
                  </span>
                </div>
                <p className="truncate text-[11px] font-medium text-white/70">{lessonTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {conversationId && (
                <button
                  onClick={handleResetConversation}
                  disabled={sending || isThinking}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-40"
                  title="Reiniciar conversa com o Tutor"
                  aria-label="Reiniciar conversa"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition"
                aria-label="Fechar chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Banner de apresentação sutil */}
          <div className="border-b border-[#EDF0EA] bg-[#F7F9F5] px-4 py-2 text-[11px] font-medium text-[#5A6B7E] flex items-center justify-between">
            <span>Tire dúvidas desta aula com a IA educacional</span>
            <span className="flex items-center gap-1 text-[#6E9B1F] font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6E9B1F] animate-pulse" />
              Pronto para ajudar
            </span>
          </div>

          {/* Área de mensagens */}
          <div className="flex-1 overflow-y-auto bg-[#F8F9F7] p-4 space-y-3.5">
            {loading ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#6E9B1F]" />
                <p className="text-xs text-[#718096]">Carregando histórico da aula...</p>
              </div>
            ) : messages.length === 0 && !isThinking && !streamingAiText ? (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#6E9B1F] mb-3 shadow-inner">
                  <Bot className="h-7 w-7" />
                </div>
                <p className="font-bold text-sm text-[#1F3864]">Olá! Eu sou o Tutor Pílulas</p>
                <p className="text-xs text-[#718096] mt-1.5 leading-relaxed max-w-[280px]">
                  Ficou com alguma dúvida sobre esta aula? Clique em uma pergunta pronta abaixo ou
                  digite sua dúvida:
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-[320px]">
                  {[
                    'O que é autoliderança?',
                    'Resuma esta aula',
                    'Como aplico isso no meu dia a dia?',
                    'Quais as ferramentas usadas nesta aula?',
                  ].map((quickQuestion) => (
                    <button
                      key={quickQuestion}
                      type="button"
                      onClick={() => void handleSendMessage(undefined, quickQuestion)}
                      className="rounded-full border border-[#6E9B1F]/40 bg-white px-3 py-1.5 text-[11px] font-bold text-[#1F3864] shadow-xs hover:border-[#6E9B1F] hover:bg-[#F1F5EA] hover:text-[#527915] transition active:scale-95 text-left"
                    >
                      💬 {quickQuestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((item) => {
                  const isAi = Boolean(item.is_ai)
                  const isOwn = !isAi && item.user === user?.id
                  const author = item.expand?.user
                  const authorName = isAi
                    ? 'Tutor Pílulas'
                    : isOwn
                      ? 'Você'
                      : author?.name || 'Aluno'
                  const authorRole = author?.role

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'group flex flex-col max-w-[88%]',
                        isOwn ? 'ml-auto items-end' : 'mr-auto items-start',
                      )}
                    >
                      {/* Cabeçalho da mensagem: nome + badge IA/papel + horário */}
                      <div
                        className={cn(
                          'flex items-center gap-1.5 px-1 mb-1 text-[11px] font-semibold',
                          isAi ? 'text-[#6E9B1F]' : 'text-[#718096]',
                        )}
                      >
                        {isAi ? (
                          <span className="flex items-center gap-1 font-bold text-[#6E9B1F]">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6E9B1F] text-white">
                              <Bot className="h-2.5 w-2.5" />
                            </span>
                            {authorName}
                            <span className="rounded-md bg-[#6E9B1F]/15 px-1.5 py-0.2 text-[9px] font-bold text-[#557B15]">
                              IA
                            </span>
                          </span>
                        ) : (
                          <>
                            <span>{authorName}</span>
                            {authorRole && !isOwn && <RoleBadge role={authorRole} size="sm" />}
                          </>
                        )}

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
                          - Usuário (própria): verde oliva (#6E9B1F) com texto branco
                          - Tutor IA: card branco com borda sutil verde oliva (#6E9B1F/30), acento e texto escuro
                          - Outro usuário: branco com borda cinza */}
                      <div
                        className={cn(
                          'rounded-2xl px-3.5 py-2.5 text-sm shadow-sm break-words',
                          isOwn
                            ? 'bg-[#6E9B1F] text-white rounded-br-none'
                            : isAi
                              ? 'bg-white text-[#1F3864] border border-[#6E9B1F]/30 ring-1 ring-[#6E9B1F]/10 rounded-bl-none shadow-[0_2px_8px_rgba(110,155,31,0.08)]'
                              : 'bg-white text-[#1F3864] border border-[#E2E8F0] rounded-bl-none',
                        )}
                      >
                        <p className="whitespace-pre-wrap leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                  )
                })}

                {/* Indicador "pensando..." da IA */}
                {isThinking && (
                  <div className="mr-auto flex flex-col max-w-[85%] items-start animate-fade-in">
                    <div className="flex items-center gap-1.5 px-1 mb-1 text-[11px] font-bold text-[#6E9B1F]">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6E9B1F] text-white">
                        <Bot className="h-2.5 w-2.5" />
                      </span>
                      <span>Tutor Pílulas</span>
                      <span className="rounded-md bg-[#6E9B1F]/15 px-1.5 py-0.2 text-[9px] font-bold text-[#557B15]">
                        IA
                      </span>
                    </div>
                    <div className="rounded-2xl rounded-bl-none bg-white border border-[#6E9B1F]/30 px-3.5 py-2.5 text-xs text-[#5A6B7E] shadow-sm flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#6E9B1F]" />
                      <span>Consultando aula e pensando na resposta...</span>
                    </div>
                  </div>
                )}

                {/* Resposta da IA sendo gerada em streaming */}
                {streamingAiText && (
                  <div className="mr-auto flex flex-col max-w-[88%] items-start animate-fade-in">
                    <div className="flex items-center gap-1.5 px-1 mb-1 text-[11px] font-bold text-[#6E9B1F]">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#6E9B1F] text-white">
                        <Bot className="h-2.5 w-2.5" />
                      </span>
                      <span>Tutor Pílulas</span>
                      <span className="rounded-md bg-[#6E9B1F]/15 px-1.5 py-0.2 text-[9px] font-bold text-[#557B15]">
                        digitando...
                      </span>
                    </div>
                    <div className="rounded-2xl rounded-bl-none bg-white text-[#1F3864] border border-[#6E9B1F]/40 ring-2 ring-[#6E9B1F]/10 px-3.5 py-2.5 text-sm shadow-sm break-words">
                      <p className="whitespace-pre-wrap leading-relaxed">{streamingAiText}</p>
                      <span className="inline-block h-3.5 w-1.5 bg-[#6E9B1F] ml-1 animate-pulse align-middle" />
                    </div>
                  </div>
                )}
              </>
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
              placeholder="Pergunte ao Tutor sobre esta aula..."
              className="h-11 flex-1 rounded-xl border-[#D9D9D9] font-medium text-sm focus-visible:ring-[#6E9B1F]"
              disabled={sending || isThinking}
            />
            <Button
              type="submit"
              disabled={!draft.trim() || sending || isThinking}
              className="h-11 w-11 shrink-0 rounded-xl bg-[#6E9B1F] p-0 text-white hover:bg-[#5C8619] transition"
              aria-label="Enviar pergunta"
            >
              {sending || isThinking ? (
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
        aria-label={isOpen ? 'Fechar chat do Tutor IA' : 'Abrir chat do Tutor IA da aula'}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(31,56,100,.3)] transition-all duration-300 hover:scale-105 active:scale-95',
          isOpen ? 'bg-[#1F3864] hover:bg-[#172E43]' : 'bg-[#6E9B1F] hover:bg-[#5C8619]',
        )}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <>
            <Bot className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#1F3864] text-[9px] font-bold text-[#A8D052] ring-2 ring-white">
              <Sparkles className="h-2.5 w-2.5" />
            </span>
          </>
        )}
      </button>
    </div>
  )
}
