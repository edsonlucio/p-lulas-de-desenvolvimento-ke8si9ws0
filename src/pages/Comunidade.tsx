import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Filter,
  Globe,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useToast } from '@/hooks/use-toast'
import { getUserRole } from '@/lib/roles'
import { cn } from '@/lib/utils'
import {
  createCommunityPost,
  createCommunityReply,
  deleteCommunityPost,
  deleteCommunityReply,
  listCommunityPosts,
  listCommunityReplies,
  moderateCommunityPost,
} from '@/services/community'
import { notifyAdmins } from '@/services/notifications'
import type { CommunityPost, CommunityReply, Course } from '@/types/backoffice'

function formatPostTime(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

export default function Comunidade() {
  const { user } = useAuth()
  const { courses, canAccessCourseContent } = useBackoffice()
  const { toast } = useToast()
  const role = getUserRole(user)
  const isAdmin = role === 'adm' || role === 'coordenador'

  // Cursos nos quais o aluno tem matrícula (Adm vê todos)
  const accessibleCourses = useMemo(() => {
    return courses.filter((c) => isAdmin || canAccessCourseContent(c.id))
  }, [courses, isAdmin, canAccessCourseContent])

  // Seletor de espaço: 'geral' ou courseId
  const [selectedCourse, setSelectedCourse] = useState<string>('geral')

  // Aba atual: 'feed' ou 'moderacao' (só Adm)
  const [activeTab, setActiveTab] = useState<'feed' | 'moderacao'>('feed')

  // Listagem de posts
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Thread ativa aberta (detalhe do post selecionado)
  const [activePost, setActivePost] = useState<CommunityPost | null>(null)
  const [replies, setReplies] = useState<CommunityReply[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Modal Novo Post
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [newPostTitle, setNewPostTitle] = useState('')
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostCourseId, setNewPostCourseId] = useState<string>('geral')
  const [creatingPost, setCreatingPost] = useState(false)

  // Moderação
  const [pendingPosts, setPendingPosts] = useState<CommunityPost[]>([])
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [postToReject, setPostToReject] = useState<CommunityPost | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [moderatingId, setModeratingId] = useState<string | null>(null)

  // Carregar posts do espaço selecionado
  const loadPosts = async () => {
    setLoadingPosts(true)
    try {
      const data = await listCommunityPosts({
        courseId: selectedCourse,
        userId: user?.id,
      })
      setPosts(data)
    } catch (err) {
      console.warn('Erro ao carregar posts:', err)
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar comunidade',
        description: 'Tente recarregar a página.',
      })
    } finally {
      setLoadingPosts(false)
    }
  }

  // Carregar pendentes de moderação para Adm
  const loadPending = async () => {
    if (!isAdmin) return
    try {
      const pending = await listCommunityPosts({
        status: 'pendente',
      })
      setPendingPosts(pending)
    } catch (err) {
      console.warn('Erro ao carregar moderação:', err)
    }
  }

  useEffect(() => {
    void loadPosts()
  }, [selectedCourse])

  useEffect(() => {
    if (isAdmin) void loadPending()
  }, [isAdmin])

  // Abrir thread de um post
  const handleOpenThread = async (post: CommunityPost) => {
    setActivePost(post)
    setLoadingReplies(true)
    try {
      const reps = await listCommunityReplies(post.id)
      setReplies(reps)
    } catch (err) {
      console.warn('Erro ao carregar respostas:', err)
    } finally {
      setLoadingReplies(false)
    }
  }

  // Enviar resposta na thread
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !user || !activePost || sendingReply) return

    setSendingReply(true)
    try {
      const rep = await createCommunityReply({
        postId: activePost.id,
        authorId: user.id,
        content: replyText,
      })
      setReplies((prev) => [...prev, rep])
      setReplyText('')
      setPosts((prev) =>
        prev.map((p) =>
          p.id === activePost.id ? { ...p, replies_count: (p.replies_count || 0) + 1 } : p,
        ),
      )
      toast({ title: 'Resposta publicada!' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao responder',
        description: 'Tente novamente em instantes.',
      })
    } finally {
      setSendingReply(false)
    }
  }

  // Deletar resposta
  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteCommunityReply(replyId)
      setReplies((prev) => prev.filter((r) => r.id !== replyId))
      if (activePost) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === activePost.id
              ? { ...p, replies_count: Math.max(0, (p.replies_count || 1) - 1) }
              : p,
          ),
        )
      }
      toast({ title: 'Resposta excluída' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao excluir' })
    }
  }

  // Submeter novo post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPostTitle.trim() || !newPostContent.trim() || !user) {
      toast({
        variant: 'destructive',
        title: 'Preencha o título e o conteúdo da postagem.',
      })
      return
    }

    setCreatingPost(true)
    try {
      const created = await createCommunityPost({
        authorId: user.id,
        courseId: newPostCourseId,
        title: newPostTitle,
        content: newPostContent,
      })

      // Notifica administradores sobre post pendente de aprovação
      void notifyAdmins({
        title: 'Novo post na Comunidade pendente de aprovação',
        message: `${user.name || 'Um aluno'} publicou: "${newPostTitle.slice(0, 50)}..."`,
        type: 'sistema',
        link: '/comunidade',
      })

      setNewPostTitle('')
      setNewPostContent('')
      setNewPostOpen(false)

      toast({
        title: 'Post criado com sucesso!',
        description:
          'Seu post foi enviado para moderação e ficará visível aos outros membros assim que for aprovado.',
      })

      void loadPosts()
      if (isAdmin) void loadPending()
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar post',
        description: 'Não foi possível publicar agora.',
      })
    } finally {
      setCreatingPost(false)
    }
  }

  // Aprovar post (Adm)
  const handleApprove = async (post: CommunityPost) => {
    if (!user) return
    setModeratingId(post.id)
    try {
      await moderateCommunityPost(post.id, {
        status: 'aprovado',
        moderatorId: user.id,
      })
      setPendingPosts((prev) => prev.filter((p) => p.id !== post.id))
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: 'aprovado' } : p)))
      toast({
        title: 'Post aprovado!',
        description: 'A publicação agora está visível para a comunidade.',
      })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao aprovar post' })
    } finally {
      setModeratingId(null)
    }
  }

  // Abrir modal de rejeição com motivo (Adm)
  const handleOpenReject = (post: CommunityPost) => {
    setPostToReject(post)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  // Confirmar rejeição com motivo
  const handleConfirmReject = async () => {
    if (!postToReject || !user) return
    setModeratingId(postToReject.id)
    try {
      await moderateCommunityPost(postToReject.id, {
        status: 'rejeitado',
        moderatorId: user.id,
        rejectionReason: rejectionReason.trim(),
      })
      setPendingPosts((prev) => prev.filter((p) => p.id !== postToReject.id))
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postToReject.id
            ? { ...p, status: 'rejeitado', rejection_reason: rejectionReason }
            : p,
        ),
      )
      setRejectModalOpen(false)
      setPostToReject(null)
      toast({ title: 'Post rejeitado', description: 'O motivo foi registrado.' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao rejeitar post' })
    } finally {
      setModeratingId(null)
    }
  }

  // Deletar post (Adm ou próprio autor)
  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Excluir esta postagem e todas as respostas?')) return
    try {
      await deleteCommunityPost(postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setPendingPosts((prev) => prev.filter((p) => p.id !== postId))
      if (activePost?.id === postId) setActivePost(null)
      toast({ title: 'Post removido com sucesso' })
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao remover post' })
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 font-quicksand">
      <PageIntro
        eyebrow="Espaço de Trocas & Networking"
        title="Comunidade Pílulas"
        description="Participe dos debates da comunidade geral e dos espaços exclusivos dos seus cursos matriculados."
        action={
          <Button
            onClick={() => {
              setNewPostCourseId(selectedCourse)
              setNewPostOpen(true)
            }}
            className="h-11 rounded-xl bg-[#6E9B1F] px-4 font-bold text-white shadow-md hover:bg-[#5C8619]"
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Post
          </Button>
        }
      />

      {/* SELETOR DE ESPAÇO (GERAL VS. CURSO) + ABAS DE MODERAÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EDF0EA] pb-4">
        {/* Espaços da Comunidade */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedCourse('geral')
              setActiveTab('feed')
            }}
            className={cn(
              'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs',
              selectedCourse === 'geral' && activeTab === 'feed'
                ? 'bg-[#1F3864] text-white'
                : 'bg-white text-[#5A6B7E] hover:bg-[#F4F5F3] border border-[#EDF0EA]',
            )}
          >
            <Globe className="h-3.5 w-3.5" />
            Comunidade Geral da Plataforma
          </button>

          {/* Cursos Matriculados */}
          {accessibleCourses.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCourse(c.id)
                setActiveTab('feed')
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs max-w-[260px] truncate',
                selectedCourse === c.id && activeTab === 'feed'
                  ? 'bg-[#6E9B1F] text-white'
                  : 'bg-white text-[#5A6B7E] hover:bg-[#F4F5F3] border border-[#EDF0EA]',
              )}
            >
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{c.title}</span>
            </button>
          ))}
        </div>

        {/* Aba de Moderação exclusiva para Adm/Coordenador */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('moderacao')}
              className={cn(
                'relative flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition shadow-xs',
                activeTab === 'moderacao'
                  ? 'bg-[#E74C3C] text-white'
                  : 'bg-white text-[#C0392B] border border-[#E74C3C]/30 hover:bg-[#FDEDEC]',
              )}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Painel de Moderação</span>
              {pendingPosts.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#E74C3C]">
                  {pendingPosts.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* CONTEÚDO DA ABA SELECIONADA */}
      {activeTab === 'moderacao' && isAdmin ? (
        /* PAINEL DE MODERAÇÃO DE POSTS PENDENTES */
        <section className="rounded-3xl bg-white p-6 shadow-[0_6px_24px_rgba(31,56,100,.08)] border border-[#EDF0EA]">
          <div className="flex items-center justify-between border-b border-[#EDF0EA] pb-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[#1F3864]">Moderação de Postagens Pendentes</h2>
              <p className="text-xs text-[#718096] mt-0.5">
                Revise os posts criados pelos alunos antes que fiquem visíveis para os demais
                participantes.
              </p>
            </div>
            <span className="rounded-full bg-[#E74C3C]/10 px-3 py-1 text-xs font-bold text-[#C0392B]">
              {pendingPosts.length} aguardando aprovação
            </span>
          </div>

          {pendingPosts.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-[#6E9B1F] mb-2" />
              <p className="font-bold text-sm text-[#1F3864]">Tudo em dia!</p>
              <p className="text-xs text-[#718096]">Não há postagens aguardando aprovação.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPosts.map((post) => (
                <div
                  key={post.id}
                  className="rounded-2xl border border-[#EDF0EA] bg-[#FCFCFB] p-5 shadow-xs transition hover:border-[#6E9B1F]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#EDF0EA] pb-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={post.expand?.author ?? null} className="h-9 w-9" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-[#1F3864]">
                            {post.expand?.author?.name || 'Aluno'}
                          </p>
                          <span className="rounded-md bg-[#FFF8E7] px-2 py-0.5 text-[10px] font-bold text-[#B7791F]">
                            Aguardando Aprovação
                          </span>
                        </div>
                        <p className="text-[11px] text-[#718096]">
                          {post.expand?.course
                            ? `Curso: ${post.expand.course.title}`
                            : 'Comunidade Geral'}{' '}
                          · {formatPostTime(post.created)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        disabled={moderatingId === post.id}
                        onClick={() => void handleApprove(post)}
                        className="h-9 rounded-xl bg-[#6E9B1F] px-4 text-xs font-bold text-white hover:bg-[#5C8619]"
                      >
                        {moderatingId === post.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="mr-1.5 h-3.5 w-3.5 stroke-[3]" />
                        )}
                        Aprovar Post
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={moderatingId === post.id}
                        onClick={() => handleOpenReject(post)}
                        className="h-9 rounded-xl border-[#E74C3C] text-xs font-bold text-[#E74C3C] hover:bg-[#FDEDEC]"
                      >
                        <X className="mr-1.5 h-3.5 w-3.5" />
                        Rejeitar com Motivo
                      </Button>
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-bold text-[#1F3864]">{post.title}</h3>
                  <p className="mt-1 text-xs text-[#44546A] whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* FEED DA COMUNIDADE (LISTA DE POSTS + THREAD SELECIONADA) */
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* LISTA DE POSTS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-[#1F3864]">
                {selectedCourse === 'geral' ? 'Posts da Comunidade Geral' : `Discussões do Curso`}
              </h2>
              <span className="text-xs text-[#718096]">
                {posts.length} {posts.length === 1 ? 'post' : 'posts'}
              </span>
            </div>

            {loadingPosts ? (
              <div className="rounded-3xl bg-white p-12 text-center shadow-xs border border-[#EDF0EA]">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-[#6E9B1F]" />
                <p className="mt-2 text-xs text-[#718096]">Carregando conversas...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="rounded-3xl bg-white p-12 text-center shadow-xs border border-[#EDF0EA]">
                <UsersRound className="mx-auto h-10 w-10 text-[#CBD3C3] mb-2" />
                <h3 className="font-bold text-base text-[#1F3864]">Nenhum post publicado ainda</h3>
                <p className="mt-1 text-xs text-[#718096] max-w-sm mx-auto">
                  Seja o primeiro a compartilhar uma dúvida, ideia ou reflexão neste espaço.
                </p>
                <Button
                  onClick={() => {
                    setNewPostCourseId(selectedCourse)
                    setNewPostOpen(true)
                  }}
                  className="mt-4 h-10 rounded-xl bg-[#6E9B1F] text-xs font-bold text-white hover:bg-[#5C8619]"
                >
                  Criar primeiro post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => {
                  const isAuthor = user?.id === post.author
                  const isPending = post.status === 'pendente'
                  const isRejected = post.status === 'rejeitado'
                  const isSelected = activePost?.id === post.id

                  return (
                    <article
                      key={post.id}
                      onClick={() => void handleOpenThread(post)}
                      className={cn(
                        'cursor-pointer rounded-3xl bg-white p-5 sm:p-6 shadow-[0_4px_20px_rgba(31,56,100,.06)] border transition hover:border-[#6E9B1F]/40 hover:shadow-md',
                        isSelected
                          ? 'border-[#6E9B1F] ring-2 ring-[#6E9B1F]/15'
                          : 'border-[#EDF0EA]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={post.expand?.author ?? null} className="h-10 w-10" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#1F3864]">
                                {post.expand?.author?.name || 'Membro da Comunidade'}
                              </span>
                              {isPending && (
                                <span className="rounded-full bg-[#FFF8E7] px-2.5 py-0.5 text-[10px] font-bold text-[#B7791F] border border-[#FAD7A0]">
                                  Aguardando aprovação
                                </span>
                              )}
                              {isRejected && (
                                <span className="rounded-full bg-[#FDEDEC] px-2.5 py-0.5 text-[10px] font-bold text-[#C0392B] border border-[#F5B7B1]">
                                  Rejeitado
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#8C9BAE]">
                              {formatPostTime(post.created)}
                            </span>
                          </div>
                        </div>

                        {(isAdmin || isAuthor) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleDeletePost(post.id)
                            }}
                            className="text-[#A0AEC0] hover:text-[#C0392B] transition p-1"
                            title="Excluir post"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Título e prévia */}
                      <h3 className="mt-3 text-base sm:text-lg font-bold text-[#1F3864]">
                        {post.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-[#5A6B7E] line-clamp-2 leading-relaxed">
                        {post.content}
                      </p>

                      {/* Se foi rejeitado e tiver motivo, exibir para o autor */}
                      {isRejected && post.rejection_reason && (
                        <div className="mt-3 rounded-xl bg-[#FDEDEC] p-3 text-xs text-[#C0392B]">
                          <span className="font-bold">Motivo da recusa: </span>
                          {post.rejection_reason}
                        </div>
                      )}

                      {/* Contador de respostas */}
                      <div className="mt-4 flex items-center justify-between border-t border-[#EDF0EA] pt-3 text-xs font-bold text-[#1F3864]">
                        <span className="inline-flex items-center gap-1.5 text-[#6E9B1F]">
                          <MessageSquare className="h-4 w-4" />
                          {post.replies_count || 0}{' '}
                          {post.replies_count === 1 ? 'resposta' : 'respostas'}
                        </span>
                        <span className="text-xs text-[#5A6B7E] hover:underline">
                          Abrir conversa →
                        </span>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>

          {/* PAINEL DA THREAD SELECIONADA */}
          <div className="lg:sticky lg:top-24 h-fit">
            {activePost ? (
              <div className="rounded-3xl bg-white p-6 shadow-[0_6px_24px_rgba(31,56,100,.08)] border border-[#EDF0EA] space-y-4">
                <div className="flex items-start justify-between border-b border-[#EDF0EA] pb-3">
                  <div>
                    <span className="rounded-full bg-[#EAF0DF] px-2.5 py-0.5 text-[10px] font-bold text-[#527915]">
                      Thread de Discussão
                    </span>
                    <h3 className="mt-1 font-bold text-lg text-[#1F3864]">{activePost.title}</h3>
                  </div>
                  <button
                    onClick={() => setActivePost(null)}
                    className="text-[#718096] hover:text-[#1F3864] p-1 rounded-lg"
                    title="Fechar thread"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Conteúdo completo do post original */}
                <div className="rounded-2xl bg-[#F8F9F7] p-4 text-xs font-medium text-[#1F3864] whitespace-pre-wrap leading-relaxed border border-[#EDF0EA]">
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-[#EDF0EA]">
                    <UserAvatar
                      user={activePost.expand?.author ?? null}
                      className="h-6 w-6 text-[10px]"
                    />
                    <span className="font-bold text-[#1F3864]">
                      {activePost.expand?.author?.name || 'Autor'}
                    </span>
                    <span className="text-[10px] text-[#718096]">
                      {formatPostTime(activePost.created)}
                    </span>
                  </div>
                  {activePost.content}
                </div>

                {/* Lista de respostas */}
                <div className="space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#6E9B1F]">
                    Respostas ({replies.length})
                  </h4>

                  {loadingReplies ? (
                    <div className="py-6 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-[#6E9B1F]" />
                    </div>
                  ) : replies.length === 0 ? (
                    <p className="text-center text-xs text-[#718096] py-3">
                      Nenhuma resposta ainda. Seja o primeiro a responder!
                    </p>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {replies.map((r) => {
                        const canDel = isAdmin || user?.id === r.author
                        return (
                          <div
                            key={r.id}
                            className="rounded-2xl border border-[#EDF0EA] bg-[#FCFCFB] p-3 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <UserAvatar
                                  user={r.expand?.author ?? null}
                                  className="h-6 w-6 text-[10px]"
                                />
                                <span className="font-bold text-[#1F3864]">
                                  {r.expand?.author?.name || 'Membro'}
                                </span>
                                <span className="text-[10px] text-[#A0AEC0]">
                                  {formatPostTime(r.created)}
                                </span>
                              </div>
                              {canDel && (
                                <button
                                  onClick={() => void handleDeleteReply(r.id)}
                                  className="text-[#A0AEC0] hover:text-[#C0392B]"
                                  title="Excluir resposta"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="mt-1.5 text-[#44546A] whitespace-pre-wrap leading-relaxed">
                              {r.content}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Caixa para enviar resposta */}
                <form
                  onSubmit={handleSendReply}
                  className="space-y-2 pt-2 border-t border-[#EDF0EA]"
                >
                  <Textarea
                    rows={2}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva sua resposta para a thread..."
                    className="rounded-xl border-[#D9D9D9] text-xs font-medium focus-visible:ring-[#6E9B1F]"
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className="h-9 rounded-xl bg-[#6E9B1F] px-4 text-xs font-bold text-white hover:bg-[#5C8619]"
                    >
                      {sendingReply ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Responder
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#CBD3C3] bg-white/70 p-8 text-center text-[#718096]">
                <MessageSquare className="mx-auto h-8 w-8 text-[#A0AEC0] mb-2" />
                <p className="font-bold text-sm text-[#1F3864]">Nenhum post selecionado</p>
                <p className="mt-1 text-xs">
                  Clique em qualquer post ao lado para abrir a conversa completa e enviar sua
                  resposta.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO POST (FICA PENDENTE DE APROVAÇÃO) */}
      <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
        <DialogContent className="rounded-3xl sm:max-w-lg font-quicksand">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[#1F3864]">
                Criar Nova Postagem na Comunidade
              </DialogTitle>
              <DialogDescription className="text-xs text-[#718096]">
                Compartilhe com seus colegas de aprendizado. Para manter um ambiente seguro e de
                alto valor, todo novo post passa por aprovação prévia de nossa equipe.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Espaço da Comunidade *</Label>
              <Select value={newPostCourseId} onValueChange={setNewPostCourseId}>
                <SelectTrigger className="h-10 rounded-xl font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-quicksand">
                  <SelectItem value="geral">Comunidade Geral da Plataforma</SelectItem>
                  {accessibleCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Título da Postagem *</Label>
              <Input
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                placeholder="Ex.: Dúvida sobre aplicação de feedback da aula 3"
                className="h-10 rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Conteúdo da Postagem *</Label>
              <Textarea
                rows={5}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Detalhe sua reflexão, insight ou questionamento..."
                className="rounded-xl border-[#D9D9D9] text-xs font-medium focus-visible:ring-[#6E9B1F]"
                required
              />
            </div>

            <div className="rounded-xl bg-[#FFF8E7] p-3 text-[11px] font-medium text-[#B7791F] flex items-start gap-2">
              <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Seu post ficará com status <strong>pendente de aprovação</strong> até que um
                coordenador valide o conteúdo. Você poderá acompanhar o status diretamente no feed.
              </span>
            </div>

            <DialogFooter className="mt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewPostOpen(false)}
                className="rounded-xl font-bold"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={creatingPost}
                className="rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
              >
                {creatingPost ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar para Aprovação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: MOTIVO DA REJEIÇÃO DO POST (ADM) */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md font-quicksand">
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#C0392B] flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Rejeitar Postagem
              </DialogTitle>
              <DialogDescription className="text-xs text-[#718096]">
                Informe o motivo da reprovação para que o autor compreenda as diretrizes da
                comunidade.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1F3864]">Motivo da Rejeição</Label>
              <Textarea
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex.: Conteúdo fora do tema da aula, linguagem inadequada ou spam..."
                className="rounded-xl border-[#D9D9D9] text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
                className="rounded-xl font-bold"
              >
                Voltar
              </Button>
              <Button
                onClick={() => void handleConfirmReject()}
                className="rounded-xl bg-[#E74C3C] font-bold text-white hover:bg-[#C0392B]"
              >
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
