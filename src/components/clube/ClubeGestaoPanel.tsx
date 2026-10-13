import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  MessageSquare,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'

import { UserAvatar } from '@/components/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import pb from '@/lib/pocketbase/client'
import type { ClubeComment, ClubeDailyPost, UserRecord } from '@/types/backoffice'
import { cn } from '@/lib/utils'

interface MemberEngagement {
  user: UserRecord
  commentCount: number
  lastCommentDate: string | null
  isLate: boolean // atrasado na leitura
  daysSinceLastActivity: number | null
  missedPostsCount: number
}

export function ClubeGestaoPanel({ posts }: { posts: ClubeDailyPost[] }) {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [allComments, setAllComments] = useState<ClubeComment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'todos' | 'em_dia' | 'atrasado'>('todos')

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([
      pb.collection<UserRecord>('users').getFullList({ sort: 'name' }),
      pb.collection<ClubeComment>('clube_comments').getFullList({
        sort: '-created',
        expand: 'author',
      }),
    ])
      .then(([userRows, commentRows]) => {
        if (!active) return
        setUsers(userRows)
        setAllComments(commentRows)
      })
      .catch((err) => console.error('Erro ao carregar dados de gestão do clube:', err))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Ordenar posts pela data (mais antigo para o mais recente)
  const sortedPosts = useMemo(() => {
    return [...posts].sort(
      (a, b) => new Date(a.date || a.created).getTime() - new Date(b.date || b.created).getTime(),
    )
  }, [posts])

  // Calcular engajamento por membro
  const memberStats = useMemo<MemberEngagement[]>(() => {
    const now = new Date().getTime()

    return users.map((u) => {
      const userComments = allComments.filter((c) => c.author === u.id)
      const commentCount = userComments.length

      // Data do último comentário
      let lastCommentDate: string | null = null
      let daysSinceLastActivity: number | null = null

      if (userComments.length > 0) {
        // Ordenado pelo mais recente
        const latest = [...userComments].sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime(),
        )[0]
        lastCommentDate = latest.created
        const diffMs = now - new Date(latest.created).getTime()
        daysSinceLastActivity = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      }

      // Critério "atrasado na leitura":
      // Se não comentou em nenhum post publicado após seu último comentário,
      // ou se há posts recentes (últimos 3 dias) e o usuário nunca comentou.
      let missedPostsCount = 0
      if (!lastCommentDate) {
        missedPostsCount = posts.length
      } else {
        const lastDateObj = new Date(lastCommentDate)
        missedPostsCount = sortedPosts.filter(
          (p) => new Date(p.date || p.created) > lastDateObj,
        ).length
      }

      // Considera-se atrasado se houver 2 ou mais posts publicados sem comentários do membro,
      // ou se não comenta há mais de 5 dias e há posts pendentes
      const isLate = missedPostsCount >= 2

      return {
        user: u,
        commentCount,
        lastCommentDate,
        isLate,
        daysSinceLastActivity,
        missedPostsCount,
      }
    })
  }, [users, allComments, sortedPosts, posts.length])

  const filteredMembers = useMemo(() => {
    return memberStats.filter((m) => {
      if (filter === 'em_dia' && m.isLate) return false
      if (filter === 'atrasado' && !m.isLate) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const name = (m.user.name || '').toLowerCase()
        const email = (m.user.email || '').toLowerCase()
        return name.includes(q) || email.includes(q)
      }
      return true
    })
  }, [memberStats, filter, search])

  const totalMembers = memberStats.length
  const emDiaCount = memberStats.filter((m) => !m.isLate).length
  const atrasadosCount = memberStats.filter((m) => m.isLate).length

  return (
    <div className="space-y-6">
      {/* Cards de Resumo da Gestão */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.06)] dark:bg-[#1A334C]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F5F3] text-[#1F3864] dark:bg-white/10 dark:text-white">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1F3864] dark:text-white">{totalMembers}</p>
            <p className="text-xs font-semibold text-[#718096] dark:text-white/60">
              Membros Totais da Plataforma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.06)] dark:bg-[#1A334C]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#527915] dark:bg-[#6E9B1F]/20">
            <CheckCircle2 className="h-6 w-6 text-[#6E9B1F]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#527915] dark:text-white">{emDiaCount}</p>
            <p className="text-xs font-semibold text-[#527915] dark:text-white/70">
              Membros "Em dia" na Leitura
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.06)] dark:bg-[#1A334C]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8E7] text-[#D97706] dark:bg-[#D97706]/20">
            <AlertTriangle className="h-6 w-6 text-[#D97706]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#D97706] dark:text-white">{atrasadosCount}</p>
            <p className="text-xs font-semibold text-[#D97706] dark:text-white/70">
              Membros "Atrasados" (sem reflexões recentes)
            </p>
          </div>
        </div>
      </div>

      {/* Controles de Filtro e Busca */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1A334C] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar membro por nome ou email..."
            className="h-10 rounded-xl border-[#EDF0EA] pl-10 text-xs font-medium dark:border-white/10 dark:bg-white/5"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('todos')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-bold transition',
              filter === 'todos'
                ? 'bg-[#1F3864] text-white'
                : 'bg-[#F4F5F3] text-[#5A6B7E] hover:bg-[#EAF0DF] dark:bg-white/10 dark:text-white/70',
            )}
          >
            Todos ({totalMembers})
          </button>
          <button
            onClick={() => setFilter('em_dia')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-bold transition',
              filter === 'em_dia'
                ? 'bg-[#6E9B1F] text-white'
                : 'bg-[#F4F5F3] text-[#5A6B7E] hover:bg-[#EAF0DF] dark:bg-white/10 dark:text-white/70',
            )}
          >
            Em dia ({emDiaCount})
          </button>
          <button
            onClick={() => setFilter('atrasado')}
            className={cn(
              'rounded-xl px-3 py-1.5 text-xs font-bold transition',
              filter === 'atrasado'
                ? 'bg-[#D97706] text-white'
                : 'bg-[#F4F5F3] text-[#5A6B7E] hover:bg-[#EAF0DF] dark:bg-white/10 dark:text-white/70',
            )}
          >
            Atrasados ({atrasadosCount})
          </button>
        </div>
      </div>

      {/* Tabela de Membros com Badges de Status */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="hidden grid-cols-[minmax(240px,1.5fr)_140px_160px_130px] items-center gap-4 border-b border-[#EDF0EA] bg-[#F8F9F7] px-5 py-3 text-[11px] font-bold uppercase tracking-[.1em] text-[#718096] dark:border-white/10 dark:bg-white/5 dark:text-white/60 md:grid">
            <span>Membro</span>
            <span>Comentários</span>
            <span>Última Atividade</span>
            <span className="text-right">Status de Leitura</span>
          </div>

          <div className="divide-y divide-[#EDF0EA] dark:divide-white/10">
            {filteredMembers.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#718096] dark:text-white/60">
                Nenhum membro encontrado com este filtro.
              </div>
            ) : (
              filteredMembers.map((m) => (
                <div
                  key={m.user.id}
                  className="flex flex-col gap-2 p-4 transition hover:bg-[#F9FAF8] dark:hover:bg-white/5 md:grid md:grid-cols-[minmax(240px,1.5fr)_140px_160px_130px] md:items-center md:gap-4 md:px-5"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar user={m.user} className="h-9 w-9 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-[#1F3864] dark:text-white">
                        {m.user.name || 'Sem nome'}
                      </p>
                      <p className="truncate text-[11px] text-[#718096] dark:text-white/60">
                        {m.user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3864] dark:text-white">
                    <MessageSquare className="h-3.5 w-3.5 text-[#6E9B1F]" />
                    <span>
                      {m.commentCount} comentário{m.commentCount === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="text-xs text-[#5A6B7E] dark:text-white/70">
                    {m.lastCommentDate ? (
                      <div>
                        <span>
                          {new Date(m.lastCommentDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </span>
                        {m.daysSinceLastActivity !== null && (
                          <span className="ml-1 text-[11px] text-[#718096] dark:text-white/40">
                            (há {m.daysSinceLastActivity}d)
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#99A7B7]">Nunca comentou</span>
                    )}
                  </div>

                  <div className="flex items-center justify-end">
                    {m.isLate ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF8E7] px-2.5 py-1 text-xs font-bold text-[#D97706] border border-[#F5B041]/40">
                        <AlertTriangle className="h-3 w-3" />
                        Atrasado ({m.missedPostsCount} cards)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF0DF] px-2.5 py-1 text-xs font-bold text-[#527915] border border-[#C9DCB0]">
                        <CheckCircle2 className="h-3 w-3" />
                        Em dia
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
