import { useEffect, useState } from 'react'
import {
  Clock,
  ExternalLink,
  Instagram,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  ShieldAlert,
  Sparkles,
  User,
  Youtube,
  CheckCircle2,
  Trash2,
} from 'lucide-react'
import { PageIntro } from '@/components/PageIntro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getUserRole } from '@/lib/roles'
import { cn } from '@/lib/utils'
import {
  createCeoMessage,
  deleteCeoMessage,
  listCeoMessages,
  updateCeoMessageStatus,
} from '@/services/ceo'
import type { CeoMessage, CeoMessageStatus } from '@/types/backoffice'

export default function Contatos() {
  const { user } = useAuth()
  const { toast } = useToast()
  const role = getUserRole(user)
  const isAdmin = role === 'adm' || role === 'coordenador'

  // Form Fale com o CEO
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Chat direto com CEO / Equipe
  const [chatOpen, setChatOpen] = useState(false)
  const [chatText, setChatText] = useState('')
  const [chatSending, setChatSending] = useState(false)

  // Mensagens do CEO (para usuário ou para Adm)
  const [messages, setMessages] = useState<CeoMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadMessages = async () => {
    setLoadingMessages(true)
    try {
      const data = await listCeoMessages(isAdmin ? undefined : user?.id)
      setMessages(data)
    } catch (err) {
      console.warn('Erro ao carregar mensagens:', err)
    } finally {
      setLoadingMessages(false)
    }
  }

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      void loadMessages()
    }
  }, [user, isAdmin])

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha seu nome, e-mail e a mensagem.',
      })
      return
    }

    setSubmitting(true)
    try {
      await createCeoMessage({
        userId: user?.id || '',
        name,
        email,
        subject: subject.trim() || 'Fale com o CEO',
        message,
        channel: 'form',
      })
      setMessage('')
      setSubject('')
      toast({
        title: 'Mensagem enviada com sucesso!',
        description: 'Edson Lúcio e a equipe executiva receberam sua mensagem.',
      })
      void loadMessages()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar',
        description: 'Não foi possível registrar sua mensagem. Tente novamente.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatText.trim() || !user) return

    setChatSending(true)
    try {
      await createCeoMessage({
        userId: user.id,
        name: user.name || 'Aluno',
        email: user.email || '',
        subject: 'Chat direto com a Equipe / CEO',
        message: chatText.trim(),
        channel: 'chat',
      })
      setChatText('')
      toast({
        title: 'Mensagem de chat enviada!',
        description: 'Sua solicitação foi registrada no canal direto.',
      })
      void loadMessages()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao enviar no chat',
        description: 'Tente novamente em instantes.',
      })
    } finally {
      setChatSending(false)
    }
  }

  const handleUpdateStatus = async (msgId: string, newStatus: CeoMessageStatus, reply?: string) => {
    setUpdatingId(msgId)
    try {
      await updateCeoMessageStatus(msgId, newStatus, reply)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                status: newStatus,
                reply: reply ?? m.reply,
                replied_at: new Date().toISOString(),
              }
            : m,
        ),
      )
      toast({ title: 'Status da mensagem atualizado!' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status' })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm('Excluir esta mensagem?')) return
    try {
      await deleteCeoMessage(msgId)
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      toast({ title: 'Mensagem excluída' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao excluir mensagem' })
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 font-quicksand">
      <PageIntro
        eyebrow="Central de Atendimento & Relacionamento"
        title="Canais de Contato"
        description="Fale diretamente com nossa diretoria, tire dúvidas sobre matrículas ou conecte-se com nossa equipe pelos canais oficiais."
      />

      {/* GRADE PRINCIPAL DE CANAIS DE CONTATO */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* 1. WhatsApp Oficial */}
        <a
          href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20informa%C3%A7%C3%B5es%20sobre%20as%20P%C3%ADlulas%20de%20Desenvolvimento."
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.06)] transition hover:-translate-y-1 hover:shadow-lg border border-[#EDF0EA]"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#128C7E] transition group-hover:scale-105">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold text-lg text-[#1F3864]">WhatsApp Oficial</h3>
            <p className="mt-1 text-xs text-[#718096] leading-relaxed">
              Atendimento rápido para suporte e orientações sobre cursos.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#128C7E] group-hover:underline">
            Conversar no WhatsApp <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </a>

        {/* 2. E-mail de Suporte */}
        <a
          href="mailto:contato@pilulasdedesenvolvimento.com.br"
          className="group flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.06)] transition hover:-translate-y-1 hover:shadow-lg border border-[#EDF0EA]"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F3864]/10 text-[#1F3864] transition group-hover:scale-105">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold text-lg text-[#1F3864]">E-mail Corporativo</h3>
            <p className="mt-1 text-xs text-[#718096] leading-relaxed">
              contato@pilulasdedesenvolvimento.com.br
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#1F3864] group-hover:underline">
            Enviar mensagem por e-mail <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </a>

        {/* 3. Instagram Oficial & CEO */}
        <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.06)] border border-[#EDF0EA]">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E1306C]/15 text-[#E1306C]">
              <Instagram className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold text-lg text-[#1F3864]">Instagram</h3>
            <div className="mt-2 space-y-1.5">
              <a
                href="https://www.instagram.com/pilulasdedesenvolvimento"
                target="_blank"
                rel="noreferrer"
                className="block text-xs font-bold text-[#5A6B7E] hover:text-[#E1306C] transition"
              >
                @pilulasdedesenvolvimento
              </a>
              <a
                href="https://www.instagram.com/prof_edsonlucio"
                target="_blank"
                rel="noreferrer"
                className="block text-xs font-bold text-[#5A6B7E] hover:text-[#E1306C] transition"
              >
                @prof_edsonlucio (CEO)
              </a>
            </div>
          </div>
          <span className="mt-4 text-[11px] font-semibold text-[#8C9BAE]">
            Acompanhe pílulas diárias
          </span>
        </div>

        {/* 4. Canal no YouTube */}
        <a
          href="https://www.youtube.com/@pilulasdedesenvolvimento"
          target="_blank"
          rel="noreferrer"
          className="group flex flex-col justify-between rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.06)] transition hover:-translate-y-1 hover:shadow-lg border border-[#EDF0EA]"
        >
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FF0000]/10 text-[#FF0000] transition group-hover:scale-105">
              <Youtube className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-bold text-lg text-[#1F3864]">YouTube Oficial</h3>
            <p className="mt-1 text-xs text-[#718096] leading-relaxed">
              Aulas abertas, podcasts, reflexões e debates com Edson Lúcio.
            </p>
          </div>
          <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#FF0000] group-hover:underline">
            Inscrever-se no canal <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </a>
      </div>

      {/* SEÇÃO PRINCIPAL: FALE COM O CEO (EDSON LÚCIO) + CHAT DIRETO */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Cartão de Apresentação e Formulário Fale com o CEO */}
        <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(31,56,100,.08)] sm:p-8 border border-[#EDF0EA]">
          <div className="flex flex-col sm:flex-row gap-5 items-start border-b border-[#EDF0EA] pb-6">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[#1F3864] text-white flex items-center justify-center text-xl font-bold shadow-md ring-4 ring-[#EAF0DF]">
              <span>EL</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#EAF0DF] px-3 py-0.5 text-xs font-bold text-[#527915]">
                  Canal Direto Executivo
                </span>
                <span className="rounded-full bg-[#1F3864]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#1F3864]">
                  Confidencial
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-[#1F3864]">Fale com o CEO</h2>
              <p className="text-sm font-bold text-[#6E9B1F]">Prof. Edson Lúcio — Fundador & CEO</p>
              <p className="mt-2 text-xs font-medium text-[#5A6B7E] leading-relaxed">
                Tem uma sugestão de curso, parceria institucional ou feedback direto sobre sua
                experiência na plataforma? Este canal chega diretamente à liderança.
              </p>
            </div>
          </div>

          {/* Formulário de Mensagem ao CEO */}
          <form onSubmit={handleSubmitForm} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#1F3864]">Seu Nome *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo"
                  className="h-11 rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#1F3864]">Seu E-mail *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="h-11 rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Assunto (opcional)</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex.: Sugestão de mentoria corporativa / Elogio ao Clube"
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Mensagem *</Label>
              <Textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escreva sua mensagem com clareza para Edson Lúcio..."
                className="rounded-xl border-[#D9D9D9] text-xs font-medium focus-visible:ring-[#6E9B1F]"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setChatOpen((prev) => !prev)}
                className="h-11 rounded-xl border-[#1F3864] text-xs font-bold text-[#1F3864] hover:bg-[#1F3864] hover:text-white"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                {chatOpen ? 'Ocultar chat' : 'Abrir chat direto'}
              </Button>

              <Button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-xl bg-[#6E9B1F] px-6 font-bold text-white hover:bg-[#5C8619] shadow-md"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar ao CEO
              </Button>
            </div>
          </form>
        </div>

        {/* COLUNA DIREITA: CHAT DIRETO DE CONTATO OU HISTÓRICO DAS MENSAGENS */}
        <div className="flex flex-col gap-6">
          {/* Caixa de Chat Direto */}
          <div className="overflow-hidden rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(31,56,100,.08)] border border-[#EDF0EA] flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#EDF0EA] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6E9B1F] text-white">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[#1F3864]">Canal de Chat Direto</h3>
                    <p className="text-xs text-[#718096]">
                      Converse em tempo real com a coordenação & CEO
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#6E9B1F]">
                  <span className="h-2 w-2 rounded-full bg-[#6E9B1F] animate-pulse" />
                  Online
                </span>
              </div>

              <div className="my-5 rounded-2xl bg-[#F8F9F7] p-4 text-xs font-medium text-[#5A6B7E] space-y-2 border border-[#EDF0EA]">
                <p>
                  👋 Olá! Utilize este canal para dúvidas de suporte técnico, agendamento de
                  mentorias ou solicitações imediatas.
                </p>
                <p className="text-[11px] text-[#718096]">
                  Suas mensagens são salvas na plataforma e respondidas pela equipe ou pelo CEO.
                </p>
              </div>
            </div>

            {/* Input de envio do chat */}
            <form onSubmit={handleSendChatMessage} className="space-y-3">
              <Textarea
                rows={3}
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                placeholder="Digite sua dúvida ou mensagem de chat aqui..."
                className="rounded-xl border-[#D9D9D9] text-xs font-medium focus-visible:ring-[#6E9B1F]"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={chatSending || !chatText.trim()}
                  className="h-10 rounded-xl bg-[#1F3864] px-5 text-xs font-bold text-white hover:bg-[#172E43]"
                >
                  {chatSending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Enviar pelo chat
                </Button>
              </div>
            </form>
          </div>

          {/* Histórico das Minhas Mensagens enviadas */}
          {!isAdmin && (
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-[#EDF0EA]">
              <h4 className="font-bold text-sm text-[#1F3864]">Suas mensagens recentes</h4>
              {loadingMessages ? (
                <div className="py-4 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#6E9B1F]" />
                </div>
              ) : messages.length === 0 ? (
                <p className="mt-2 text-xs text-[#718096]">Nenhuma mensagem enviada ainda.</p>
              ) : (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-[#EDF0EA] p-3 text-xs bg-[#FCFCFB]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#1F3864] line-clamp-1">
                          {m.subject || 'Mensagem ao CEO'}
                        </span>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                            m.status === 'respondida'
                              ? 'bg-[#EAF0DF] text-[#527915]'
                              : 'bg-[#FFF8E7] text-[#B7791F]',
                          )}
                        >
                          {m.status}
                        </span>
                      </div>
                      <p className="mt-1 text-[#5A6B7E] line-clamp-2">{m.message}</p>
                      {m.reply && (
                        <div className="mt-2 rounded-lg bg-[#EAF0DF]/60 p-2 text-[11px] font-semibold text-[#1F3864]">
                          <span className="font-bold text-[#527915]">Resposta da Diretoria: </span>
                          {m.reply}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* PAINEL DE GESTÃO DO ADM: MENSAGENS RECEBIDAS (FALE COM O CEO / CHAT) */}
      {isAdmin && (
        <section className="rounded-3xl bg-white p-6 shadow-[0_8px_30px_rgba(31,56,100,.08)] border border-[#EDF0EA]">
          <div className="flex items-center justify-between border-b border-[#EDF0EA] pb-4 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-xl bg-[#6E9B1F]/20 p-2 text-[#527915]">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <h3 className="font-bold text-xl text-[#1F3864]">
                  Gestão de Mensagens (Visível apenas para Administrador/Coordenador)
                </h3>
              </div>
              <p className="mt-1 text-xs text-[#718096]">
                Visualize, responda e altere o status dos contatos enviados pelos alunos e
                visitantes.
              </p>
            </div>
            <span className="rounded-full bg-[#1F3864]/10 px-3 py-1 text-xs font-bold text-[#1F3864]">
              {messages.length} recebidas
            </span>
          </div>

          {loadingMessages ? (
            <div className="py-12 text-center">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#6E9B1F]" />
              <p className="mt-2 text-xs text-[#718096]">Carregando mensagens...</p>
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-xs font-semibold text-[#718096]">
              Nenhuma mensagem recebida até o momento.
            </p>
          ) : (
            <div className="space-y-4">
              {messages.map((m) => {
                const isNova = m.status === 'nova'
                const isRespondida = m.status === 'respondida'

                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-[#EDF0EA] bg-[#FDFDFD] p-5 shadow-xs transition hover:border-[#6E9B1F]/40"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#EDF0EA] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#1F3864]">{m.name}</span>
                          <span className="text-xs text-[#718096]">({m.email})</span>
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700 uppercase">
                            Canal: {m.channel || 'form'}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-[#6E9B1F] mt-0.5">
                          Assunto: {m.subject || 'Fale com o CEO'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase',
                            isNova
                              ? 'bg-[#E74C3C]/10 text-[#C0392B]'
                              : isRespondida
                                ? 'bg-[#EAF0DF] text-[#527915]'
                                : 'bg-[#FFF8E7] text-[#B7791F]',
                          )}
                        >
                          {m.status}
                        </span>
                        <span className="text-[11px] text-[#8C9BAE]">
                          {new Date(m.created).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void handleDeleteMessage(m.id)}
                          className="h-7 w-7 text-[#C0392B] hover:bg-[#C0392B]/10 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-3 text-xs font-medium text-[#44546A] whitespace-pre-wrap leading-relaxed">
                      {m.message}
                    </p>

                    {m.reply && (
                      <div className="mt-3 rounded-xl bg-[#EAF0DF]/80 p-3 text-xs font-semibold text-[#1F3864]">
                        <p className="font-bold text-[#527915]">Resposta enviada pelo Adm:</p>
                        <p className="mt-1">{m.reply}</p>
                      </div>
                    )}

                    {/* Formulário de resposta do Adm */}
                    <div className="mt-4 flex flex-col sm:flex-row items-center gap-2 pt-3 border-t border-[#EDF0EA]">
                      <Input
                        value={replyTextMap[m.id] ?? ''}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({ ...prev, [m.id]: e.target.value }))
                        }
                        placeholder="Escrever resposta para este aluno..."
                        className="h-9 rounded-xl text-xs flex-1"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          disabled={updatingId === m.id || !replyTextMap[m.id]?.trim()}
                          onClick={() =>
                            void handleUpdateStatus(m.id, 'respondida', replyTextMap[m.id])
                          }
                          className="h-9 rounded-xl bg-[#6E9B1F] text-xs font-bold text-white hover:bg-[#5C8619]"
                        >
                          {updatingId === m.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          )}
                          Salvar Resposta
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === m.id}
                          onClick={() =>
                            void handleUpdateStatus(
                              m.id,
                              m.status === 'em_analise' ? 'arquivada' : 'em_analise',
                            )
                          }
                          className="h-9 rounded-xl text-xs font-bold"
                        >
                          {m.status === 'em_analise' ? 'Arquivar' : 'Marcar em análise'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
