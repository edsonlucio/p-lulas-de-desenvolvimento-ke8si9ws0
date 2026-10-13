import { useEffect, useMemo, useState } from 'react'
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Layers,
  MoreVertical,
  Plus,
  Power,
  Search,
  Sparkles,
  UserCheck,
  Users,
  Video,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { PageIntro } from '@/components/PageIntro'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useCourseModal } from '@/contexts/CourseModalContext'
import pb from '@/lib/pocketbase/client'
import { getUserRole } from '@/lib/roles'
import { listMentorships } from '@/services/mentorships'
import type { Course, Enrollment, LessonProgress, Mentorship } from '@/types/backoffice'
import { cn } from '@/lib/utils'

export default function Gestao() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { courses, lessons } = useBackoffice()
  const { openNewCourse, openEditCourse } = useCourseModal()
  const role = getUserRole(user)
  const canAccess = role === 'adm' || role === 'coordenador'

  const [togglingCourseId, setTogglingCourseId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'treinamentos' | 'mentorias'>('treinamentos')
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [progressList, setProgressList] = useState<LessonProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mentorshipFilter, setMentorshipFilter] = useState<
    'todas' | 'agendada' | 'concluida' | 'cancelada'
  >('todas')

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([
      listMentorships(),
      pb.collection<Enrollment>('enrollments').getFullList({ expand: 'user,course' }),
      pb.collection<LessonProgress>('lesson_progress').getFullList({ expand: 'lesson,user' }),
    ])
      .then(([mRows, eRows, pRows]) => {
        if (!active) return
        setMentorships(mRows)
        setEnrollments(eRows)
        setProgressList(pRows)
      })
      .catch((err) => console.error('Erro ao carregar dados de gestão:', err))
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Cursos consolidados com métricas de alunos e progresso médio
  const coursesWithMetrics = useMemo(() => {
    return courses.map((course) => {
      const courseLessons = lessons.filter((l) => l.course === course.id)
      const courseEnrollments = enrollments.filter(
        (e) => e.course === course.id && e.status === 'ativo',
      )
      const totalStudents = courseEnrollments.length

      let avgCompletion = 0
      if (courseLessons.length > 0 && totalStudents > 0) {
        const lessonIds = new Set(courseLessons.map((l) => l.id))
        let completedLessonsCount = 0
        for (const enr of courseEnrollments) {
          const finished = progressList.filter(
            (p) => p.user === enr.user && p.completed && lessonIds.has(p.lesson),
          ).length
          completedLessonsCount += finished
        }
        avgCompletion = Math.round(
          (completedLessonsCount / (totalStudents * courseLessons.length)) * 100,
        )
      }

      return {
        ...course,
        lessonsCount: courseLessons.length,
        studentsEnrolled: totalStudents,
        avgCompletion,
      }
    })
  }, [courses, lessons, enrollments, progressList])

  const filteredCourses = useMemo(() => {
    if (!search.trim()) return coursesWithMetrics
    const q = search.toLowerCase()
    return coursesWithMetrics.filter(
      (c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    )
  }, [coursesWithMetrics, search])

  // Overview metrics consolidadas
  const overviewStats = useMemo(() => {
    const activeCourses = courses.filter((c) => c.status === 'ativo').length
    const inactiveCourses = courses.filter((c) => c.status === 'inativo').length
    const totalAulas = lessons.length
    const activeEnrollments = enrollments.filter((e) => e.status === 'ativo').length
    const pendingEnrollments = enrollments.filter((e) => e.status === 'pendente').length
    const scheduledMentorships = mentorships.filter((m) => m.status === 'agendada').length
    const completedMentorships = mentorships.filter((m) => m.status === 'concluida').length
    const cancelledMentorships = mentorships.filter((m) => m.status === 'cancelada').length

    return {
      activeCourses,
      inactiveCourses,
      totalCourses: courses.length,
      totalAulas,
      activeEnrollments,
      pendingEnrollments,
      totalEnrollments: enrollments.length,
      scheduledMentorships,
      completedMentorships,
      cancelledMentorships,
      totalMentorships: mentorships.length,
    }
  }, [courses, lessons, enrollments, mentorships])

  const handleToggleCourseStatus = async (course: Course) => {
    const nextStatus = course.status === 'ativo' ? 'inativo' : 'ativo'
    setTogglingCourseId(course.id)
    try {
      await pb.collection('courses').update(course.id, { status: nextStatus })
      // Disparar recarregamento no BackofficeContext atualizando o state local
      window.dispatchEvent(new CustomEvent('courses-updated'))
    } catch (err) {
      console.error('Erro ao alternar status:', err)
    } finally {
      setTogglingCourseId(null)
    }
  }

  const filteredMentorships = useMemo(() => {
    return mentorships.filter((m) => {
      if (mentorshipFilter !== 'todas' && m.status !== mentorshipFilter) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const topic = (m.topic || '').toLowerCase()
        const student = (m.expand?.student?.name || '').toLowerCase()
        return topic.includes(q) || student.includes(q)
      }
      return true
    })
  }, [mentorships, mentorshipFilter, search])

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-[800px] py-12 text-center font-quicksand">
        <h2 className="text-xl font-bold text-[#1F3864]">Acesso Restrito</h2>
        <p className="mt-2 text-sm text-[#718096]">
          Apenas Administradores e Coordenadores têm permissão para acessar o painel integrado de
          Gestão.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 font-quicksand">
      <PageIntro
        eyebrow="Controle Estratégico"
        title="Painel Integrado de Gestão"
        description="Visão consolidada de todos os cursos, matrículas ativas, conclusão média e agendamentos de mentorias."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={openNewCourse}
              className="h-11 rounded-xl bg-[#6E9B1F] font-bold text-white shadow-md hover:bg-[#5C8619]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Novo Curso
            </Button>
            <Button
              onClick={() => navigate('/mentorias')}
              variant="outline"
              className="h-11 rounded-xl border-[#1F3864] font-bold text-[#1F3864] hover:bg-[#1F3864] hover:text-white dark:border-white/20 dark:text-white"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Agendar Mentoria
            </Button>
          </div>
        }
      />

      {/* 1. CARDS DE OVERVIEW CONSOLIDADOS */}
      <section aria-label="Overview da Gestão" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Cursos */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1F3864] text-white shadow-md">
              <GraduationCap className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-[#EAF0DF] px-2.5 py-0.5 text-[11px] font-bold text-[#527915]">
              {overviewStats.activeCourses} ativos
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-[#1F3864] dark:text-white">
            {overviewStats.totalCourses}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#718096] dark:text-white/60">
            Total de Cursos ·{' '}
            <span className="font-bold text-[#718096]">
              {overviewStats.inactiveCourses} inativos
            </span>
          </p>
        </div>

        {/* Card 2: Total Aulas */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6E9B1F] text-white shadow-md">
              <BookOpen className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-[#F4F5F3] px-2.5 py-0.5 text-[11px] font-bold text-[#1F3864] dark:bg-white/10 dark:text-white">
              Conteúdo gravado
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-[#1F3864] dark:text-white">
            {overviewStats.totalAulas}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#718096] dark:text-white/60">
            Total de Aulas cadastradas
          </p>
        </div>

        {/* Card 3: Matrículas e Alunos */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#334F68] text-white shadow-md">
              <Users className="h-6 w-6" />
            </span>
            {overviewStats.pendingEnrollments > 0 ? (
              <span className="rounded-full bg-[#FFF8E7] px-2.5 py-0.5 text-[11px] font-bold text-[#D97706]">
                {overviewStats.pendingEnrollments} pendentes
              </span>
            ) : (
              <span className="rounded-full bg-[#EAF0DF] px-2.5 py-0.5 text-[11px] font-bold text-[#527915]">
                100% em dia
              </span>
            )}
          </div>
          <p className="mt-4 text-3xl font-bold text-[#1F3864] dark:text-white">
            {overviewStats.activeEnrollments}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#718096] dark:text-white/60">
            Matrículas Ativas ({overviewStats.totalEnrollments} no total)
          </p>
        </div>

        {/* Card 4: Mentorias por Status */}
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="flex items-center justify-between">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E67E22] text-white shadow-md">
              <Calendar className="h-6 w-6" />
            </span>
            <span className="rounded-full bg-[#EAF2F8] px-2.5 py-0.5 text-[11px] font-bold text-[#2980B9]">
              {overviewStats.scheduledMentorships} agendadas
            </span>
          </div>
          <p className="mt-4 text-3xl font-bold text-[#1F3864] dark:text-white">
            {overviewStats.totalMentorships}
          </p>
          <p className="mt-1 text-xs font-semibold text-[#718096] dark:text-white/60">
            {overviewStats.completedMentorships} concluídas · {overviewStats.cancelledMentorships}{' '}
            canceladas
          </p>
        </div>
      </section>

      {/* Navegação entre Visão de Treinamentos e Mentorias */}
      <div className="flex items-center gap-2 border-b border-[#EDF0EA] pb-3 dark:border-white/10">
        <button
          onClick={() => setActiveTab('treinamentos')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition',
            activeTab === 'treinamentos'
              ? 'bg-[#1F3864] text-white'
              : 'bg-white text-[#5A6B7E] hover:bg-[#F4F5F3] dark:bg-white/5 dark:text-white/70',
          )}
        >
          <GraduationCap className="h-4 w-4" />
          Treinamentos & Cursos ({courses.length})
        </button>
        <button
          onClick={() => setActiveTab('mentorias')}
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition',
            activeTab === 'mentorias'
              ? 'bg-[#1F3864] text-white'
              : 'bg-white text-[#5A6B7E] hover:bg-[#F4F5F3] dark:bg-white/5 dark:text-white/70',
          )}
        >
          <Calendar className="h-4 w-4" />
          Mentorias Individuais ({mentorships.length})
        </button>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-[#1A334C] sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'treinamentos'
                ? 'Buscar curso por título...'
                : 'Buscar mentoria por aluno ou tema...'
            }
            className="h-10 rounded-xl border-[#EDF0EA] pl-10 text-xs font-medium dark:border-white/10 dark:bg-white/5"
          />
        </div>

        {activeTab === 'mentorias' && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(['todas', 'agendada', 'concluida', 'cancelada'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setMentorshipFilter(st)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition',
                  mentorshipFilter === st
                    ? 'bg-[#6E9B1F] text-white'
                    : 'bg-[#F4F5F3] text-[#5A6B7E] hover:bg-[#EAF0DF] dark:bg-white/10 dark:text-white/70',
                )}
              >
                {st === 'todas'
                  ? 'Todas'
                  : st === 'agendada'
                    ? 'Agendadas'
                    : st === 'concluida'
                      ? 'Concluídas'
                      : 'Canceladas'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ABA 1: TREINAMENTOS */}
      {activeTab === 'treinamentos' && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="hidden grid-cols-[minmax(240px,2fr)_120px_130px_160px_110px_110px] items-center gap-4 border-b border-[#EDF0EA] bg-[#F8F9F7] px-5 py-3 text-[11px] font-bold uppercase tracking-[.1em] text-[#718096] dark:border-white/10 dark:bg-white/5 dark:text-white/60 md:grid">
            <span>Treinamento</span>
            <span>Status</span>
            <span>Aulas</span>
            <span>Alunos Matriculados</span>
            <span>Conclusão Média</span>
            <span className="text-right">Ação</span>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#EDF0EA] dark:divide-white/10">
              {filteredCourses.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#718096] dark:text-white/60">
                  Nenhum treinamento encontrado.
                </div>
              ) : (
                filteredCourses.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col gap-2 p-4 transition hover:bg-[#F9FAF8] dark:hover:bg-white/5 md:grid md:grid-cols-[minmax(240px,2fr)_120px_130px_160px_110px_110px] md:items-center md:gap-4 md:px-5"
                  >
                    <div>
                      <p className="font-bold text-[#1F3864] dark:text-white">{c.title}</p>
                      <p className="line-clamp-1 text-xs text-[#718096] dark:text-white/60">
                        {c.description}
                      </p>
                    </div>

                    <div>
                      <StatusBadge status={c.status} />
                    </div>

                    <div className="text-xs font-semibold text-[#1F3864] dark:text-white">
                      {c.lessonsCount} aulas
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3864] dark:text-white">
                      <Users className="h-3.5 w-3.5 text-[#6E9B1F]" />
                      <span>{c.studentsEnrolled} alunos</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-bold text-[#1F3864] dark:text-white mb-1">
                        <span>{c.avgCompletion}%</span>
                      </div>
                      <div className="h-2 w-20 overflow-hidden rounded-full bg-[#EDF0EA] dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-[#6E9B1F]"
                          style={{ width: `${c.avgCompletion}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={togglingCourseId === c.id}
                        onClick={() => void handleToggleCourseStatus(c)}
                        className="h-8 rounded-xl px-2.5 text-xs font-bold text-[#1F3864] hover:bg-[#EDF0EA] dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                        title={c.status === 'ativo' ? 'Desativar curso' : 'Ativar curso'}
                      >
                        <Power className="mr-1 h-3.5 w-3.5 text-[#6E9B1F]" />
                        {c.status === 'ativo' ? 'Pausar' : 'Ativar'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditCourse(c)}
                        className="h-8 rounded-xl px-2.5 text-xs font-bold text-[#1F3864] hover:bg-[#EDF0EA] dark:text-white dark:hover:bg-white/10"
                        title="Editar treinamento"
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate(`/cursos/${c.id}`)}
                        className="h-8 rounded-xl px-2 text-xs font-bold text-[#1F3864] hover:bg-[#EDF0EA] dark:text-white dark:hover:bg-white/10"
                        title="Ver página completa do curso"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: MENTORIAS */}
      {activeTab === 'mentorias' && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="hidden grid-cols-[minmax(200px,1.5fr)_minmax(180px,1.5fr)_140px_130px_120px] items-center gap-4 border-b border-[#EDF0EA] bg-[#F8F9F7] px-5 py-3 text-[11px] font-bold uppercase tracking-[.1em] text-[#718096] dark:border-white/10 dark:bg-white/5 dark:text-white/60 md:grid">
            <span>Aluno & Contato</span>
            <span>Tema da Mentoria</span>
            <span>Data e Hora</span>
            <span>Status</span>
            <span className="text-right">Ação</span>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[#EDF0EA] dark:divide-white/10">
              {filteredMentorships.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#718096] dark:text-white/60">
                  Nenhuma mentoria encontrada.
                </div>
              ) : (
                filteredMentorships.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-2 p-4 transition hover:bg-[#F9FAF8] dark:hover:bg-white/5 md:grid md:grid-cols-[minmax(200px,1.5fr)_minmax(180px,1.5fr)_140px_130px_120px] md:items-center md:gap-4 md:px-5"
                  >
                    <div>
                      <p className="font-bold text-[#1F3864] dark:text-white">
                        {m.expand?.student?.name || 'Aluno'}
                      </p>
                      <p className="text-[11px] text-[#718096] dark:text-white/60">
                        {m.expand?.student?.email}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-xs text-[#1F3864] dark:text-white line-clamp-1">
                        {m.topic}
                      </p>
                      {m.resumo && (
                        <p className="text-[11px] text-[#527915] font-semibold line-clamp-1">
                          ✓ Resumo registrado
                        </p>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-[#5A6B7E] dark:text-white/70">
                      {new Date(m.scheduled_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>

                    <div>
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize',
                          m.status === 'concluida'
                            ? 'bg-[#EAF0DF] text-[#527915]'
                            : m.status === 'agendada'
                              ? 'bg-[#EAF2F8] text-[#2980B9]'
                              : 'bg-[#FADBD8] text-[#C0392B]',
                        )}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => navigate('/mentorias')}
                        className="h-8 text-xs font-bold text-[#1F3864] hover:bg-[#EDF0EA] dark:text-white dark:hover:bg-white/10"
                      >
                        Ver histórico
                        <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
