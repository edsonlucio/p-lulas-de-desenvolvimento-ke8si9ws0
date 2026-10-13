import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  GraduationCap,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  Users,
} from 'lucide-react'

import { PageIntro } from '@/components/PageIntro'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import pb from '@/lib/pocketbase/client'
import { getUserRole } from '@/lib/roles'
import { listMentorships } from '@/services/mentorships'
import { listStudentQuestions, type QuestionMessage } from '@/services/questions'
import type { Course, Enrollment, Lesson, LessonProgress, Mentorship } from '@/types/backoffice'
import { cn } from '@/lib/utils'

export default function Relatorios() {
  const { user } = useAuth()
  const { courses, lessons } = useBackoffice()
  const role = getUserRole(user)
  const canAccess = role === 'adm' || role === 'coordenador'

  const [loading, setLoading] = useState(true)
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [progressList, setProgressList] = useState<LessonProgress[]>([])
  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [questions, setQuestions] = useState<QuestionMessage[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)

    Promise.all([
      pb.collection<Enrollment>('enrollments').getFullList({ expand: 'user,course' }),
      pb.collection<LessonProgress>('lesson_progress').getFullList({ expand: 'lesson,user' }),
      listMentorships(),
      listStudentQuestions(),
    ])
      .then(([enrollRows, progRows, mentorRows, questionRows]) => {
        if (!active) return
        setEnrollments(enrollRows)
        setProgressList(progRows)
        setMentorships(mentorRows)
        setQuestions(questionRows)
      })
      .catch((err) => {
        console.error('Erro ao carregar dados de relatórios:', err)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // 1. Evolução de conclusão por curso
  const courseCompletionStats = useMemo(() => {
    return courses.map((course) => {
      const courseLessons = lessons.filter((l) => l.course === course.id)
      const courseEnrollments = enrollments.filter(
        (e) => e.course === course.id && e.status === 'ativo',
      )
      const totalStudents = courseEnrollments.length

      if (courseLessons.length === 0 || totalStudents === 0) {
        return {
          course,
          totalStudents,
          totalLessons: courseLessons.length,
          avgCompletion: 0,
          completedStudents: 0,
        }
      }

      const lessonIds = new Set(courseLessons.map((l) => l.id))
      let totalCompletedLessonsByStudents = 0
      let fullCompletedCount = 0

      for (const enr of courseEnrollments) {
        const studentProgress = progressList.filter(
          (p) => p.user === enr.user && p.completed && lessonIds.has(p.lesson),
        )
        totalCompletedLessonsByStudents += studentProgress.length
        if (studentProgress.length >= courseLessons.length) {
          fullCompletedCount += 1
        }
      }

      const totalPossible = totalStudents * courseLessons.length
      const avgCompletion = Math.round((totalCompletedLessonsByStudents / totalPossible) * 100)

      return {
        course,
        totalStudents,
        totalLessons: courseLessons.length,
        avgCompletion,
        completedStudents: fullCompletedCount,
      }
    })
  }, [courses, lessons, enrollments, progressList])

  // 2. Dúvidas mais frequentes: agrupar por aula e extrair termos mais comuns
  const topQuestionLessons = useMemo(() => {
    const counts: Record<string, { count: number; title: string; courseTitle: string }> = {}
    for (const q of questions) {
      const lessonTitle = q.expand?.lesson?.title || 'Aula não identificada'
      const courseTitle = q.expand?.['lesson.course']?.title || 'Curso'
      const key = q.lesson || lessonTitle
      if (!counts[key]) {
        counts[key] = { count: 0, title: lessonTitle, courseTitle }
      }
      counts[key].count += 1
    }
    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [questions])

  // Termos/Palavras-chave mais frequentes nas mensagens dos alunos
  const keywordStats = useMemo(() => {
    const stopwords = new Set([
      'de',
      'a',
      'o',
      'que',
      'e',
      'do',
      'da',
      'em',
      'um',
      'para',
      'com',
      'não',
      'uma',
      'os',
      'no',
      'se',
      'na',
      'por',
      'mais',
      'as',
      'dos',
      'como',
      'mas',
      'foi',
      'ao',
      'ele',
      'das',
      'tem',
      'à',
      'seu',
      'sua',
      'ou',
      'ser',
      'quando',
      'muito',
      'há',
      'nos',
      'já',
      'está',
      'eu',
      'também',
      'só',
      'pelo',
      'pela',
      'até',
      'isso',
      'ela',
      'entre',
      'era',
      'depois',
      'sem',
      'mesmo',
      'aos',
      'ter',
      'seus',
      'quem',
      'nas',
      'me',
      'esse',
      'eles',
      'estão',
      'você',
      'tinha',
      'foram',
      'essa',
      'num',
      'nem',
      'suas',
      'meu',
      'às',
      'minha',
      'têm',
      'numa',
      'pelos',
      'elas',
      'havia',
      'seja',
      'qual',
      'será',
      'nós',
      'tenho',
      'lhe',
      'deles',
      'essas',
      'esses',
      'pelas',
      'este',
      'fosse',
      'dele',
      'tu',
      'te',
      'vocês',
      'vos',
      'lhes',
      'meus',
      'minhas',
      'teu',
      'tua',
      'teus',
      'tuas',
      'nosso',
      'nossa',
      'nossos',
      'nossas',
      'dela',
      'delas',
      'esta',
      'estes',
      'estas',
      'aquele',
      'aquela',
      'aqueles',
      'aquelas',
      'isto',
      'aquilo',
      'estou',
      'está',
      'estamos',
      'estão',
      'estive',
      'olá',
      'ola',
      'bom',
      'dia',
      'tarde',
      'noite',
      'favor',
      'poderia',
      'ajudar',
      'dúvida',
      'duvida',
    ])

    const wordCounts: Record<string, number> = {}
    for (const q of questions) {
      const words = (q.message || '')
        .toLowerCase()
        .replace(/[^\w\sáéíóúãõâêîôûç]/g, ' ')
        .split(/\s+/)
      for (const w of words) {
        if (w.length >= 4 && !stopwords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1
        }
      }
    }

    return Object.entries(wordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
  }, [questions])

  // 3. Mentorship stats
  const mentorshipStats = useMemo(() => {
    const total = mentorships.length
    const concluidas = mentorships.filter((m) => m.status === 'concluida').length
    const agendadas = mentorships.filter((m) => m.status === 'agendada').length
    const canceladas = mentorships.filter((m) => m.status === 'cancelada').length
    const rate = total > 0 ? Math.round((concluidas / total) * 100) : 0
    return { total, concluidas, agendadas, canceladas, rate }
  }, [mentorships])

  if (!canAccess) {
    return (
      <div className="mx-auto max-w-[800px] py-12 text-center">
        <h2 className="text-xl font-bold text-[#1F3864]">Acesso Restrito</h2>
        <p className="mt-2 text-sm text-[#718096]">
          Apenas Administradores e Coordenadores têm permissão para acessar relatórios gerenciais.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-8 font-quicksand">
      <PageIntro
        eyebrow="Gestão e Desempenho"
        title="Relatórios & KPIs"
        description="Acompanhe em tempo real a evolução de conclusão por curso, métricas de dúvidas dos alunos e engajamento das mentorias."
      />

      {/* KPI Cards Topo */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096] dark:text-white/60">
              Total de Matrículas Ativas
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0DF] text-[#6E9B1F] dark:bg-white/10">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#1F3864] dark:text-white">
            {enrollments.filter((e) => e.status === 'ativo').length}
          </p>
          <p className="mt-1 text-xs text-[#5A6B7E] dark:text-white/70">
            {courses.length} cursos cadastrados
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096] dark:text-white/60">
              Dúvidas Registradas
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0DF] text-[#3498DB] dark:bg-white/10">
              <HelpCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#1F3864] dark:text-white">
            {questions.length}
          </p>
          <p className="mt-1 text-xs text-[#5A6B7E] dark:text-white/70">
            Enviadas no chat das aulas
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096] dark:text-white/60">
              Mentorias Realizadas
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0DF] text-[#1F3864] dark:bg-white/10">
              <CalendarCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#1F3864] dark:text-white">
            {mentorshipStats.concluidas}
          </p>
          <p className="mt-1 text-xs text-[#5A6B7E] dark:text-white/70">
            {mentorshipStats.agendadas} agendadas para acontecer
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)] dark:bg-[#1A334C]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#718096] dark:text-white/60">
              Aulas Concluídas no Total
            </span>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0DF] text-[#6E9B1F] dark:bg-white/10">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold text-[#1F3864] dark:text-white">
            {progressList.filter((p) => p.completed).length}
          </p>
          <p className="mt-1 text-xs text-[#5A6B7E] dark:text-white/70">
            Engajamento geral dos alunos
          </p>
        </div>
      </section>

      {/* 1. Evolução de conclusão por curso */}
      <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.07)] dark:bg-[#1A334C] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#6E9B1F]" />
              <h2 className="text-xl font-bold text-[#1F3864] dark:text-white">
                Evolução de Conclusão por Curso
              </h2>
            </div>
            <p className="mt-1 text-xs text-[#718096] dark:text-white/60">
              Percentual médio de aulas concluídas pelos alunos matriculados em cada treinamento.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {courseCompletionStats.map((item) => (
              <div
                key={item.course.id}
                className="rounded-2xl border border-[#EDF0EA] p-4 dark:border-white/10"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-bold text-[#1F3864] dark:text-white">
                      {item.course.title}
                    </h3>
                    <p className="text-xs text-[#718096] dark:text-white/60">
                      {item.totalStudents} aluno{item.totalStudents === 1 ? '' : 's'} matriculado
                      {item.totalStudents === 1 ? '' : 's'} · {item.totalLessons} aulas ·{' '}
                      <span className="font-semibold text-[#6E9B1F]">
                        {item.completedStudents} certificado
                        {item.completedStudents === 1 ? '' : 's'} emitido
                        {item.completedStudents === 1 ? '' : 's'} (100%)
                      </span>
                    </p>
                  </div>
                  <span className="text-lg font-bold text-[#1F3864] dark:text-white">
                    {item.avgCompletion}%
                  </span>
                </div>

                {/* CSS Bar Chart */}
                <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#EDF0EA] dark:bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#1F3864] to-[#6E9B1F] transition-all duration-700"
                    style={{ width: `${item.avgCompletion}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Dúvidas Mais Frequentes e Palavras-chave */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.07)] dark:bg-[#1A334C] sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#3498DB]" />
            <h2 className="text-lg font-bold text-[#1F3864] dark:text-white">
              Aulas com Maior Volume de Dúvidas
            </h2>
          </div>
          {topQuestionLessons.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#718096] dark:text-white/60">
              Nenhuma dúvida registrada ainda no chat das aulas.
            </p>
          ) : (
            <div className="space-y-3">
              {topQuestionLessons.map((item, index) => (
                <div
                  key={item.title + index}
                  className="flex items-center justify-between rounded-xl bg-[#F8F9F7] p-3 dark:bg-white/5"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="truncate text-xs font-bold text-[#1F3864] dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[#718096] dark:text-white/60">
                      {item.courseTitle}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#3498DB]/15 px-2.5 py-1 text-xs font-bold text-[#2980B9] dark:text-[#3498DB]">
                    {item.count} pergunta{item.count === 1 ? '' : 's'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.07)] dark:bg-[#1A334C] sm:p-8">
          <div className="mb-5 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#6E9B1F]" />
            <h2 className="text-lg font-bold text-[#1F3864] dark:text-white">
              Termos Mais Recorrentes dos Alunos
            </h2>
          </div>
          {keywordStats.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#718096] dark:text-white/60">
              Sem dados suficientes para termos recorrentes.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {keywordStats.map(([word, count]) => (
                <span
                  key={word}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#EDF0EA] bg-[#FDFDFD] px-3 py-1.5 text-xs font-bold text-[#1F3864] shadow-xs dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <span className="text-[#6E9B1F]">#{word}</span>
                  <span className="rounded-full bg-[#6E9B1F]/20 px-1.5 py-0.2 text-[10px] text-[#527915] dark:text-white/70">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* 3. Indicadores de Mentorias */}
      <section className="rounded-3xl bg-white p-6 shadow-[0_4px_20px_rgba(31,56,100,.07)] dark:bg-[#1A334C] sm:p-8">
        <div className="mb-5 flex items-center gap-2">
          <CalendarCheck className="h-5 w-5 text-[#1F3864] dark:text-white" />
          <h2 className="text-lg font-bold text-[#1F3864] dark:text-white">
            Performance das Mentorias Individuais
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl bg-[#F8F9F7] p-4 text-center dark:bg-white/5">
            <p className="text-2xl font-bold text-[#1F3864] dark:text-white">
              {mentorshipStats.total}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#718096] dark:text-white/60">
              Total Agendadas
            </p>
          </div>
          <div className="rounded-2xl bg-[#EAF0DF] p-4 text-center dark:bg-[#6E9B1F]/20">
            <p className="text-2xl font-bold text-[#527915] dark:text-white">
              {mentorshipStats.concluidas}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#527915] dark:text-white/70">
              Concluídas com Sucesso
            </p>
          </div>
          <div className="rounded-2xl bg-[#F8F9F7] p-4 text-center dark:bg-white/5">
            <p className="text-2xl font-bold text-[#3498DB] dark:text-[#3498DB]">
              {mentorshipStats.agendadas}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#718096] dark:text-white/60">
              Aguardando Sessão
            </p>
          </div>
          <div className="rounded-2xl bg-[#F8F9F7] p-4 text-center dark:bg-white/5">
            <p className="text-2xl font-bold text-[#6E9B1F] dark:text-[#88B82B]">
              {mentorshipStats.rate}%
            </p>
            <p className="mt-1 text-xs font-semibold text-[#718096] dark:text-white/60">
              Taxa de Efetivação
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
