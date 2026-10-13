import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Edit3,
  Flame,
  HelpCircle,
  Loader2,
  MessageCircle,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Video,
} from 'lucide-react'
import { ClubeBrandHeader } from '@/components/clube/ClubeBrand'
import { ClubeGestaoPanel } from '@/components/clube/ClubeGestaoPanel'
import { PageIntro } from '@/components/PageIntro'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { getUserRole } from '@/lib/roles'
import { cn } from '@/lib/utils'
import {
  createClubeBook,
  createClubeComment,
  createClubeDailyPost,
  createClubeMeeting,
  deleteClubeComment,
  deleteClubeDailyPost,
  deleteClubeMeeting,
  getActiveClubeBook,
  getClubeBookCoverUrl,
  listClubeBooks,
  listClubeComments,
  listClubeDailyPosts,
  listClubeMeetings,
  updateClubeBook,
  updateClubeDailyPost,
  updateClubeMeeting,
} from '@/services/clube'
import type {
  ClubeBook,
  ClubeComment,
  ClubeDailyPost,
  ClubeMeeting,
  ClubePostType,
} from '@/types/backoffice'

function formatDayHeader(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatPostTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatMeetingDate(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatMeetingTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Clube() {
  const { user } = useAuth()
  const { toast } = useToast()
  const role = getUserRole(user)
  const canManage = role === 'adm' || role === 'coordenador'

  const [activeBook, setActiveBook] = useState<ClubeBook | null>(null)
  const [allBooks, setAllBooks] = useState<ClubeBook[]>([])
  const [posts, setPosts] = useState<ClubeDailyPost[]>([])
  const [meetings, setMeetings] = useState<ClubeMeeting[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros do feed
  const [filterType, setFilterType] = useState<'todos' | ClubePostType>('todos')
  const [searchPost, setSearchPost] = useState('')

  // Comentários por post: { [postId]: ClubeComment[] }
  const [commentsMap, setCommentsMap] = useState<Record<string, ClubeComment[]>>({})
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({})
  const [newCommentText, setNewCommentText] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<string | null>(null)

  // Modais de Adm
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<ClubeDailyPost | null>(null)

  const [meetingModalOpen, setMeetingModalOpen] = useState(false)
  const [editingMeeting, setEditingMeeting] = useState<ClubeMeeting | null>(null)

  const [bookModalOpen, setBookModalOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<ClubeBook | null>(null)
  const [currentTab, setCurrentTab] = useState<'feed' | 'gestao'>('feed')

  // Carregar dados principais
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [book, booksList] = await Promise.all([getActiveClubeBook(), listClubeBooks()])
      setActiveBook(book ?? (booksList[0] || null))
      setAllBooks(booksList)

      const bookId = book?.id ?? booksList[0]?.id
      const [postList, meetingList] = await Promise.all([
        listClubeDailyPosts(bookId),
        listClubeMeetings(bookId),
      ])
      setPosts(postList)
      setMeetings(meetingList)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar o Clube',
        description: getPortugueseError(error),
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Carregar comentários quando o balão de comentários for aberto
  const toggleComments = async (postId: string) => {
    const isNowOpen = !openComments[postId]
    setOpenComments((prev) => ({ ...prev, [postId]: isNowOpen }))

    if (isNowOpen && !commentsMap[postId]) {
      try {
        const comms = await listClubeComments(postId)
        setCommentsMap((prev) => ({ ...prev, [postId]: comms }))
      } catch (error) {
        console.error('Erro ao listar comentários:', error)
      }
    }
  }

  const handleSendComment = async (postId: string) => {
    const text = newCommentText[postId]?.trim()
    if (!text || !user) return

    setSubmittingComment(postId)
    try {
      const created = await createClubeComment(postId, text)
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }))
      setNewCommentText((prev) => ({ ...prev, [postId]: '' }))
      toast({
        title: 'Comentário enviado!',
        description: 'Sua contribuição foi adicionada ao card.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao comentar',
        description: getPortugueseError(error),
      })
    } finally {
      setSubmittingComment(null)
    }
  }

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await deleteClubeComment(commentId)
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).filter((c) => c.id !== commentId),
      }))
      toast({ title: 'Comentário excluído' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: getPortugueseError(error),
      })
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Deseja realmente remover este card diário?')) return
    try {
      await deleteClubeDailyPost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast({ title: 'Card removido com sucesso' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover card',
        description: getPortugueseError(error),
      })
    }
  }

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm('Deseja excluir este encontro?')) return
    try {
      await deleteClubeMeeting(meetingId)
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId))
      toast({ title: 'Encontro removido com sucesso' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover encontro',
        description: getPortugueseError(error),
      })
    }
  }

  // Agrupamento dos posts por data
  const groupedPosts = useMemo(() => {
    const filtered = posts.filter((p) => {
      if (filterType !== 'todos' && p.type !== filterType) return false
      if (searchPost) {
        const query = searchPost.toLowerCase()
        return (
          p.title.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          (p.pages_range && p.pages_range.toLowerCase().includes(query))
        )
      }
      return true
    })

    const groups: Record<string, ClubeDailyPost[]> = {}
    for (const post of filtered) {
      const dateKey = post.date ? post.date.split('T')[0] : 'Sem data'
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(post)
    }

    // Ordenar posts de cada dia pela propriedade 'order'
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }

    // Retorna array de dias ordenados
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
  }, [posts, filterType, searchPost])

  // Encontro virtual de discussão mais próximo
  const upcomingMeeting = useMemo(() => {
    return meetings.find((m) => m.status === 'agendado') ?? meetings[0] ?? null
  }, [meetings])

  const coverUrl = activeBook ? getClubeBookCoverUrl(activeBook) : null

  return (
    <div className="mx-auto max-w-[1500px] space-y-8 font-quicksand">
      {/* 1. LOGO & HEADER OFICIAL DO CLUBE DAS PÍLULAS COM C ESTILIZADO */}
      <ClubeBrandHeader />

      <PageIntro
        eyebrow="Comunidade e Leitura Dirigida"
        title="Clube das Pílulas"
        description="Leitura dirigida mensal, reflexões diárias no estilo comunidade e encontros virtuais ao vivo para debater cada livro."
        action={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  setEditingPost(null)
                  setPostModalOpen(true)
                }}
                className="h-11 rounded-xl bg-[#6E9B1F] px-4 font-bold text-white shadow-md hover:bg-[#5C8619]"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Card Diário
              </Button>
              <Button
                onClick={() => {
                  setEditingMeeting(null)
                  setMeetingModalOpen(true)
                }}
                variant="outline"
                className="h-11 rounded-xl border-[#1F3864] px-4 font-bold text-[#1F3864] hover:bg-[#1F3864] hover:text-white"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Novo Encontro
              </Button>
              <Button
                onClick={() => {
                  setEditingBook(activeBook)
                  setBookModalOpen(true)
                }}
                variant="ghost"
                className="h-11 rounded-xl text-xs font-bold text-[#5A6B7E] hover:bg-white"
              >
                <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                Livro do Mês
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* NAVEGAÇÃO DE ABAS: FEED / GESTÃO */}
      {canManage && (
        <div className="flex items-center gap-2 border-b border-[#EDF0EA] pb-3 dark:border-white/10">
          <button
            onClick={() => setCurrentTab('feed')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2',
              currentTab === 'feed'
                ? 'bg-[#1F3864] text-white'
                : 'bg-white text-[#5A6B7E] hover:bg-[#F4F5F3] dark:bg-white/5 dark:text-white/70',
            )}
          >
            <BookOpen className="h-4 w-4" />
            Feed & Encontros
          </button>
          <button
            onClick={() => setCurrentTab('gestao')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-2',
              currentTab === 'gestao'
                ? 'bg-[#6E9B1F] text-white'
                : 'bg-white text-[#5A6B7E] hover:bg-[#F4F5F3] dark:bg-white/5 dark:text-white/70',
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Gestão do Clube (Engajamento & Leituras)
          </button>
        </div>
      )}

      {currentTab === 'gestao' && canManage ? (
        <ClubeGestaoPanel posts={posts} />
      ) : (
        <>
          {loading ? (
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Skeleton className="h-64 rounded-3xl" />
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          ) : (
            <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              {/* Card do Livro do Mês */}
              <div className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_6px_24px_rgba(31,56,100,.08)] sm:p-8 flex flex-col justify-between">
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative h-44 w-32 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1F3864] to-[#6E9B1F] shadow-lg flex items-center justify-center text-white text-center p-3">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={`Capa do livro ${activeBook?.title}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div>
                        <BookOpen className="mx-auto h-8 w-8 opacity-80 mb-2" />
                        <p className="text-xs font-bold leading-tight line-clamp-3">
                          {activeBook?.title || 'Metanoia'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF0DF] px-3 py-1 text-xs font-bold text-[#527915]">
                        <Sparkles className="h-3.5 w-3.5" />
                        Livro do mês ({activeBook?.month || 'Ciclo Atual'})
                      </span>
                      <span className="rounded-full bg-[#1F3864]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#1F3864]">
                        1 Livro por Mês
                      </span>
                    </div>

                    <h2 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#1F3864]">
                      {activeBook?.title || 'Metanoia — a chave está sem sua cabeça'}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-[#6E9B1F]">
                      Por {activeBook?.author || 'JK Carvalho'}
                    </p>

                    <p className="mt-3 text-sm font-medium leading-relaxed text-[#5A6B7E] line-clamp-3">
                      {activeBook?.description ||
                        'Uma jornada profunda de renovação da mente, autoconsciência e expansão de potencial humano.'}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between border-t border-[#EDF0EA] pt-4 gap-3 text-xs font-medium text-[#718096]">
                  <span className="flex items-center gap-1.5">
                    <Compass className="h-4 w-4 text-[#6E9B1F]" />
                    Comunidade ativa com leitura dirigida diária
                  </span>
                  {canManage && activeBook && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBook(activeBook)
                        setBookModalOpen(true)
                      }}
                      className="h-8 rounded-lg text-xs font-bold text-[#1F3864]"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Editar Livro
                    </Button>
                  )}
                </div>
              </div>

              {/* Destaque do Encontro Virtual (03 de Novembro) */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F3864] via-[#1D3B5C] to-[#172E43] p-6 sm:p-8 text-white shadow-[0_8px_28px_rgba(31,56,100,.14)] flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-[#A8D052] backdrop-blur-sm">
                      <Video className="h-3.5 w-3.5" />
                      Próximo Encontro Virtual
                    </span>
                    <h3 className="mt-3 text-xl sm:text-2xl font-bold text-white leading-snug">
                      {upcomingMeeting?.title || 'Encontro Virtual de Discussão — Metanoia'}
                    </h3>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#A8D052]">
                    <Calendar className="h-7 w-7" />
                  </div>
                </div>

                <div className="my-5 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-center bg-[#6E9B1F] text-white rounded-xl px-3 py-1.5 font-bold">
                      <p className="text-xl leading-none">
                        {upcomingMeeting?.date ? new Date(upcomingMeeting.date).getDate() : '03'}
                      </p>
                      <p className="text-[10px] uppercase">
                        {upcomingMeeting?.date
                          ? new Date(upcomingMeeting.date).toLocaleString('pt-BR', {
                              month: 'short',
                            })
                          : 'nov'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#A8D052]">
                        Data e Horário
                      </p>
                      <p className="text-sm font-semibold text-white/90">
                        {upcomingMeeting?.date
                          ? `${formatMeetingDate(upcomingMeeting.date)} às ${formatMeetingTime(upcomingMeeting.date)}`
                          : '03 de novembro às 20h00'}
                      </p>
                    </div>
                  </div>
                  {upcomingMeeting?.description && (
                    <p className="mt-3 text-xs font-medium text-white/75 line-clamp-2">
                      {upcomingMeeting.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {upcomingMeeting?.meeting_link ? (
                    <a
                      href={upcomingMeeting.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#6E9B1F] px-5 text-sm font-bold text-white shadow-md transition hover:bg-[#5C8619]"
                    >
                      <Video className="h-4 w-4" />
                      Acessar Sala Virtual
                    </a>
                  ) : (
                    <span className="text-xs font-semibold text-white/60">
                      Link será liberado próximo ao horário
                    </span>
                  )}

                  {canManage && upcomingMeeting && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingMeeting(upcomingMeeting)
                        setMeetingModalOpen(true)
                      }}
                      className="h-8 rounded-lg text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Editar Encontro
                    </Button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* 3. FEED DIÁRIO NO ESTILO COMUNIDADE DO WHATSAPP */}
          <section className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#25D366]/20 text-[#128C7E]">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <h2 className="text-2xl font-bold text-[#1F3864]">Feed Diário da Comunidade</h2>
                </div>
                <p className="mt-1 text-sm font-medium text-[#718096]">
                  Acompanhe os cards diários de leitura dirigida, perguntas para reflexão e
                  provocações.
                </p>
              </div>

              {/* Filtros simples */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setFilterType('todos')}
                  className={cn(
                    'rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm',
                    filterType === 'todos'
                      ? 'bg-[#1F3864] text-white'
                      : 'bg-white text-[#5A6B7E] hover:bg-[#F4F5F3]',
                  )}
                >
                  Todos os cards
                </button>
                <button
                  onClick={() => setFilterType('resumo')}
                  className={cn(
                    'rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm flex items-center gap-1.5',
                    filterType === 'resumo'
                      ? 'bg-[#6E9B1F] text-white'
                      : 'bg-white text-[#527915] hover:bg-[#EAF0DF]',
                  )}
                >
                  <BookOpen className="h-3 w-3" />
                  Resumo do dia
                </button>
                <button
                  onClick={() => setFilterType('pergunta')}
                  className={cn(
                    'rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm flex items-center gap-1.5',
                    filterType === 'pergunta'
                      ? 'bg-[#1F3864] text-white'
                      : 'bg-white text-[#1F3864] hover:bg-[#F4F5F3]',
                  )}
                >
                  <HelpCircle className="h-3 w-3" />
                  Pergunta
                </button>
                <button
                  onClick={() => setFilterType('provocacao')}
                  className={cn(
                    'rounded-xl px-3.5 py-1.5 text-xs font-bold transition shadow-sm flex items-center gap-1.5',
                    filterType === 'provocacao'
                      ? 'bg-[#E67E22] text-white'
                      : 'bg-white text-[#D35400] hover:bg-[#FDF5E6]',
                  )}
                >
                  <Flame className="h-3 w-3" />
                  Provocação
                </button>
              </div>
            </div>

            {/* Timeline estilo WhatsApp: cards organizados dia a dia */}
            {groupedPosts.length === 0 ? (
              <div className="flex min-h-60 flex-col items-center justify-center rounded-3xl border border-dashed border-[#CBD3C3] bg-white/70 p-8 text-center">
                <MessageSquare className="h-10 w-10 text-[#718096]/50 mb-2" />
                <h3 className="text-lg font-bold text-[#1F3864]">
                  Nenhum card postado para este filtro
                </h3>
                <p className="mt-1 text-sm font-medium text-[#718096]">
                  {canManage
                    ? 'Clique no botão acima para cadastrar a leitura de hoje.'
                    : 'Aguarde as próximas postagens diárias da leitura dirigida.'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {groupedPosts.map(([dateKey, dayPosts]) => (
                  <div key={dateKey} className="space-y-4">
                    {/* Separador de Data estilo balão central do WhatsApp */}
                    <div className="flex items-center justify-center">
                      <span className="rounded-full bg-[#E4E6E3] px-4 py-1 text-xs font-bold text-[#5A6B7E] shadow-sm uppercase tracking-wide">
                        {formatDayHeader(dateKey)}
                      </span>
                    </div>

                    {/* Grid com até 3 cards do dia */}
                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {dayPosts.map((post) => {
                        const isOpen = Boolean(openComments[post.id])
                        const postComments = commentsMap[post.id] || []

                        // Cores por tipo
                        const isResumo = post.type === 'resumo'
                        const isPergunta = post.type === 'pergunta'
                        const isProvocacao = post.type === 'provocacao'

                        const typeMeta = isResumo
                          ? {
                              tag: 'Resumo da Leitura Dirigida',
                              badgeClass: 'bg-[#EAF0DF] text-[#527915] border border-[#C9DCB0]',
                              cardBorder: 'border-l-4 border-l-[#6E9B1F]',
                              icon: BookOpen,
                            }
                          : isPergunta
                            ? {
                                tag: 'Pergunta Reflexiva',
                                badgeClass: 'bg-[#E9EEF4] text-[#1F3864] border border-[#D0DCEB]',
                                cardBorder: 'border-l-4 border-l-[#1F3864]',
                                icon: HelpCircle,
                              }
                            : {
                                tag: 'Provocação do Dia',
                                badgeClass: 'bg-[#FDF2E9] text-[#B9770E] border border-[#FAD7A0]',
                                cardBorder: 'border-l-4 border-l-[#E67E22]',
                                icon: Flame,
                              }

                        const Icon = typeMeta.icon

                        return (
                          <article
                            key={post.id}
                            className={cn(
                              'flex flex-col justify-between rounded-3xl bg-white p-5 shadow-[0_4px_18px_rgba(31,56,100,.06)] transition-all hover:shadow-[0_8px_24px_rgba(31,56,100,.10)]',
                              typeMeta.cardBorder,
                            )}
                          >
                            <div>
                              {/* Cabeçalho do Card */}
                              <div className="flex items-start justify-between gap-2">
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-xs',
                                    typeMeta.badgeClass,
                                  )}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {typeMeta.tag}
                                </span>
                                <span className="text-[11px] font-semibold text-[#8C9BAE]">
                                  {formatPostTime(post.date)}
                                </span>
                              </div>

                              {/* Faixa de Páginas (Destaque Leitura Dirigida) */}
                              {post.pages_range && (
                                <div className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#6E9B1F]/15 px-3 py-1 text-xs font-bold text-[#527915]">
                                  <BookOpen className="h-3.5 w-3.5 text-[#6E9B1F]" />
                                  Meta de Leitura: {post.pages_range}
                                </div>
                              )}

                              {/* Título do Card */}
                              <h4 className="mt-3 text-lg font-bold text-[#1F3864] leading-snug">
                                {post.title}
                              </h4>

                              {/* Conteúdo Longo / Parágrafos */}
                              <div className="mt-2 text-sm font-medium leading-relaxed text-[#44546A] whitespace-pre-line">
                                {post.content}
                              </div>
                            </div>

                            {/* Rodapé: Comentários e Ações de Adm */}
                            <div className="mt-5 border-t border-[#EDF0EA] pt-3">
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => void toggleComments(post.id)}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1F3864] transition hover:text-[#6E9B1F]"
                                >
                                  <MessageSquare className="h-4 w-4 text-[#6E9B1F]" />
                                  <span>
                                    {isOpen ? 'Ocultar comentários' : 'Ver comentários'}
                                    {postComments.length > 0 ? ` (${postComments.length})` : ''}
                                  </span>
                                </button>

                                {canManage && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setEditingPost(post)
                                        setPostModalOpen(true)
                                      }}
                                      className="h-7 w-7 rounded-lg text-[#5A6B7E] hover:bg-[#F4F5F3]"
                                    >
                                      <Edit3 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => void handleDeletePost(post.id)}
                                      className="h-7 w-7 rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                )}
                              </div>

                              {/* Gaveta de Comentários */}
                              {isOpen && (
                                <div className="mt-4 space-y-3 rounded-2xl bg-[#F8F9F7] p-3.5 border border-[#EDF0EA]">
                                  {/* Lista de Comentários */}
                                  {postComments.length === 0 ? (
                                    <p className="text-center text-xs font-medium text-[#718096] py-2">
                                      Nenhum comentário ainda. Seja o primeiro a compartilhar sua
                                      reflexão!
                                    </p>
                                  ) : (
                                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                                      {postComments.map((c) => {
                                        const canDeleteComm =
                                          canManage || (user && c.author === user.id)
                                        return (
                                          <div
                                            key={c.id}
                                            className="rounded-xl bg-white p-2.5 shadow-xs border border-[#EDF0EA]/70 text-xs"
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="flex items-center gap-2">
                                                <UserAvatar
                                                  user={c.expand?.author ?? null}
                                                  className="h-6 w-6 text-[10px]"
                                                />
                                                <span className="font-bold text-[#1F3864]">
                                                  {c.expand?.author?.name || 'Membro do Clube'}
                                                </span>
                                              </div>
                                              {canDeleteComm && (
                                                <button
                                                  onClick={() =>
                                                    void handleDeleteComment(post.id, c.id)
                                                  }
                                                  className="text-[#718096] hover:text-[#C0392B]"
                                                  title="Excluir comentário"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              )}
                                            </div>
                                            <p className="mt-1.5 text-[#44546A] whitespace-pre-line font-medium leading-relaxed">
                                              {c.text}
                                            </p>
                                          </div>
                                        )
                                      })}
                                    </div>
                                  )}

                                  {/* Caixa para novo comentário */}
                                  {user ? (
                                    <div className="flex items-center gap-2 pt-1">
                                      <Input
                                        value={newCommentText[post.id] || ''}
                                        onChange={(e) =>
                                          setNewCommentText((prev) => ({
                                            ...prev,
                                            [post.id]: e.target.value,
                                          }))
                                        }
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault()
                                            void handleSendComment(post.id)
                                          }
                                        }}
                                        placeholder="Escreva seu comentário..."
                                        className="h-9 rounded-xl border-[#D9D9D9] bg-white text-xs font-medium focus-visible:ring-[#6E9B1F]"
                                      />
                                      <Button
                                        size="sm"
                                        onClick={() => void handleSendComment(post.id)}
                                        disabled={
                                          submittingComment === post.id ||
                                          !newCommentText[post.id]?.trim()
                                        }
                                        className="h-9 w-9 rounded-xl bg-[#6E9B1F] p-0 text-white hover:bg-[#5C8619]"
                                      >
                                        {submittingComment === post.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <Send className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-center text-xs font-medium text-[#718096]">
                                      Faça login para comentar.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. HISTÓRICO DE ENCONTROS DO CLUBE */}
          <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.06)] sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1F3864]/10 text-[#1F3864]">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <h3 className="text-xl font-bold text-[#1F3864]">
                    Encontros Virtuais de Discussão
                  </h3>
                </div>
                <p className="mt-0.5 text-xs font-medium text-[#718096]">
                  Momentos de integração ao vivo para troca de percepções e aplicação prática dos
                  conceitos.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {meetings.map((m) => {
                const isAgendado = m.status === 'agendado'
                const isRealizado = m.status === 'realizado'
                return (
                  <div
                    key={m.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#EDF0EA] bg-[#FDFDFD] p-4 transition hover:border-[#6E9B1F]/40"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                            isAgendado
                              ? 'bg-[#EAF0DF] text-[#527915]'
                              : isRealizado
                                ? 'bg-[#1F3864] text-white'
                                : 'bg-[#E4E6E3] text-[#718096]',
                          )}
                        >
                          {m.status}
                        </span>
                        <span className="text-xs font-semibold text-[#718096]">
                          {formatMeetingDate(m.date)}
                        </span>
                      </div>
                      <h4 className="mt-2 font-bold text-[#1F3864] line-clamp-1">{m.title}</h4>
                      <p className="mt-1 text-xs font-medium text-[#5A6B7E] line-clamp-2">
                        {m.description || 'Discussão e debate coletivo.'}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[#EDF0EA] pt-3">
                      {m.meeting_link ? (
                        <a
                          href={m.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#6E9B1F] hover:underline"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Entrar no encontro
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-[#718096]">Sem link</span>
                      )}

                      {canManage && (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingMeeting(m)
                              setMeetingModalOpen(true)
                            }}
                            className="h-7 w-7 rounded-lg p-0 text-[#718096] hover:bg-[#F4F5F3]"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void handleDeleteMeeting(m.id)}
                            className="h-7 w-7 rounded-lg p-0 text-[#C0392B] hover:bg-[#C0392B]/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* MODAL 1: CRIAR/EDITAR CARD DIÁRIO */}
      {canManage && (
        <PostDialog
          open={postModalOpen}
          onOpenChange={setPostModalOpen}
          post={editingPost}
          bookId={activeBook?.id || ''}
          onSaved={() => void loadData()}
        />
      )}

      {/* MODAL 2: CRIAR/EDITAR ENCONTRO VIRTUAL */}
      {canManage && (
        <MeetingDialog
          open={meetingModalOpen}
          onOpenChange={setMeetingModalOpen}
          meeting={editingMeeting}
          bookId={activeBook?.id || ''}
          onSaved={() => void loadData()}
        />
      )}

      {/* MODAL 3: CADASTRAR/EDITAR LIVRO DO MÊS */}
      {canManage && (
        <BookDialog
          open={bookModalOpen}
          onOpenChange={setBookModalOpen}
          book={editingBook}
          onSaved={() => void loadData()}
        />
      )}
    </div>
  )
}

/* Modal de Card Diário */
function PostDialog({
  open,
  onOpenChange,
  post,
  bookId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: ClubeDailyPost | null
  bookId: string
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<ClubePostType>('resumo')
  const [date, setDate] = useState('')
  const [pagesRange, setPagesRange] = useState('')
  const [order, setOrder] = useState<number>(1)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (post) {
      setTitle(post.title)
      setContent(post.content)
      setType(post.type)
      setDate(post.date ? post.date.split('T')[0] : '')
      setPagesRange(post.pages_range || '')
      setOrder(post.order ?? 1)
    } else {
      setTitle('')
      setContent('')
      setType('resumo')
      setDate(new Date().toISOString().split('T')[0])
      setPagesRange('')
      setOrder(1)
    }
  }, [post, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim() || !date) {
      toast({ variant: 'destructive', title: 'Preencha título, conteúdo e data.' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        book: bookId,
        date: new Date(date).toISOString(),
        type,
        title,
        content,
        pages_range: pagesRange,
        order,
      }
      if (post) {
        await updateClubeDailyPost(post.id, payload)
        toast({ title: 'Card atualizado com sucesso!' })
      } else {
        await createClubeDailyPost(payload)
        toast({ title: 'Card diário postado com sucesso!' })
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar card',
        description: getPortugueseError(error),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl sm:max-w-xl font-quicksand">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1F3864]">
              {post ? 'Editar Card Diário' : 'Novo Card Diário do Clube'}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-[#718096]">
              Publique o card diário de leitura dirigida, pergunta reflexiva ou provocação.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Tipo do Card *</Label>
              <Select value={type} onValueChange={(val) => setType(val as ClubePostType)}>
                <SelectTrigger className="h-10 rounded-xl font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-quicksand">
                  <SelectItem value="resumo">Resumo da Leitura Dirigida</SelectItem>
                  <SelectItem value="pergunta">Pergunta Reflexiva</SelectItem>
                  <SelectItem value="provocacao">Provocação do Conteúdo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Data da Leitura *</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Título do Card *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Resumo do Dia · O Poder do Ponto Cego"
              className="h-10 rounded-xl"
            />
          </div>

          {type === 'resumo' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">
                Páginas Sugeridas (Leitura Dirigida)
              </Label>
              <Input
                value={pagesRange}
                onChange={(e) => setPagesRange(e.target.value)}
                placeholder="Ex.: páginas 12 a 25"
                className="h-10 rounded-xl"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Conteúdo / Parágrafos *</Label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva a reflexão, o resumo detalhado ou a pergunta com clareza..."
              className="w-full rounded-xl border border-[#D9D9D9] p-3 text-xs font-medium text-[#1F3864] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E9B1F]"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Ordem no Dia</Label>
            <Input
              type="number"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              className="h-10 rounded-xl"
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {post ? 'Salvar Alterações' : 'Publicar Card'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* Modal de Encontro Virtual */
function MeetingDialog({
  open,
  onOpenChange,
  meeting,
  bookId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  meeting: ClubeMeeting | null
  bookId: string
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [status, setStatus] = useState<'agendado' | 'realizado' | 'cancelado'>('agendado')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title)
      setDescription(meeting.description || '')
      setDate(meeting.date ? new Date(meeting.date).toISOString().slice(0, 16) : '')
      setMeetingLink(meeting.meeting_link || '')
      setStatus(meeting.status)
    } else {
      setTitle('Encontro Virtual de Discussão')
      setDescription('')
      setDate('')
      setMeetingLink('')
      setStatus('agendado')
    }
  }, [meeting, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !date) {
      toast({ variant: 'destructive', title: 'Preencha título e data do encontro.' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        book: bookId,
        date: new Date(date).toISOString(),
        title,
        description,
        meeting_link: meetingLink,
        status,
      }
      if (meeting) {
        await updateClubeMeeting(meeting.id, payload)
        toast({ title: 'Encontro atualizado com sucesso!' })
      } else {
        await createClubeMeeting(payload)
        toast({ title: 'Encontro virtual agendado!' })
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar encontro',
        description: getPortugueseError(error),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg font-quicksand">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1F3864]">
              {meeting ? 'Editar Encontro Virtual' : 'Agendar Encontro Virtual'}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-[#718096]">
              Defina o debate coletivo mensal entre os membros do Clube.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Título do Encontro *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Encontro Virtual de Discussão — Metanoia"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Data e Hora *</Label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as 'agendado' | 'realizado' | 'cancelado')}
              >
                <SelectTrigger className="h-10 rounded-xl font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-quicksand">
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="realizado">Realizado</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">
              Link da Reunião (Google Meet / Zoom)
            </Label>
            <Input
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/..."
              className="h-10 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Descrição / Pauta</Label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Temas centrais que serão discutidos na sala virtual..."
              className="w-full rounded-xl border border-[#D9D9D9] p-3 text-xs font-medium text-[#1F3864] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E9B1F]"
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {meeting ? 'Salvar Encontro' : 'Agendar Encontro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/* Modal de Livro do Mês */
function BookDialog({
  open,
  onOpenChange,
  book,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  book: ClubeBook | null
  onSaved: () => void
}) {
  const { toast } = useToast()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [month, setMonth] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (book) {
      setTitle(book.title)
      setAuthor(book.author)
      setMonth(book.month)
      setDescription(book.description || '')
      setStatus(book.status)
      setCoverFile(null)
    } else {
      setTitle('')
      setAuthor('')
      setMonth(new Date().toISOString().slice(0, 7)) // "YYYY-MM"
      setDescription('')
      setStatus('ativo')
      setCoverFile(null)
    }
  }, [book, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !author.trim() || !month.trim()) {
      toast({ variant: 'destructive', title: 'Preencha título, autor e mês.' })
      return
    }

    setSaving(true)
    try {
      if (book) {
        await updateClubeBook(book.id, {
          title,
          author,
          month,
          description,
          status,
          cover: coverFile,
        })
        toast({ title: 'Livro atualizado com sucesso!' })
      } else {
        await createClubeBook({
          title,
          author,
          month,
          description,
          status,
          cover: coverFile,
        })
        toast({ title: 'Livro cadastrado com sucesso!' })
      }
      onSaved()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar livro',
        description: getPortugueseError(error),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-lg font-quicksand">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#1F3864]">
              {book ? 'Editar Livro do Mês' : 'Cadastrar Próximo Livro'}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-[#718096]">
              Cadastre a obra do ciclo mensal do Clube das Pílulas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Título do Livro *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Metanoia — a chave está sem sua cabeça"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Autor *</Label>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Ex.: JK Carvalho"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Mês de Leitura *</Label>
              <Input
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                placeholder="Ex.: 2025-11"
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Status</Label>
            <Select value={status} onValueChange={(val) => setStatus(val as 'ativo' | 'inativo')}>
              <SelectTrigger className="h-10 rounded-xl font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="font-quicksand">
                <SelectItem value="ativo">Ativo (Livro Corrente)</SelectItem>
                <SelectItem value="inativo">Inativo / Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Capa do Livro (imagem)</Label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => coverInputRef.current?.click()}
                className="h-9 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864]"
              >
                {coverFile ? 'Trocar Capa' : 'Escolher Imagem de Capa'}
              </Button>
              {coverFile && (
                <span className="text-xs font-semibold text-[#1F3864] truncate max-w-[200px]">
                  {coverFile.name}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#1F3864]">Sinopse / Descrição</Label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Sobre a obra e o objetivo desta leitura dirigida..."
              className="w-full rounded-xl border border-[#D9D9D9] p-3 text-xs font-medium text-[#1F3864] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E9B1F]"
            />
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {book ? 'Salvar Livro' : 'Cadastrar Livro'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
