import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  Edit3,
  GraduationCap,
  MoreVertical,
  Plus,
  Trash2,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { EmptyState } from '@/components/EmptyState'
import { LessonFormDialog } from '@/components/lessons/LessonFormDialog'
import { StatusBadge } from '@/components/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useCourseModal } from '@/contexts/CourseModalContext'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { canManageCoursesAndLessons, canEditLesson } from '@/lib/roles'
import { getCourseCoverUrl } from '@/services/courses'
import type { Lesson } from '@/types/backoffice'

export default function CourseDetail() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { courses, lessons, loading, updateCourseStatus, deleteCourse, deleteLesson } =
    useBackoffice()
  const { openEditCourse } = useCourseModal()
  const { toast } = useToast()
  const [lessonDialog, setLessonDialog] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null)
  const [deleteCourseOpen, setDeleteCourseOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const canManage = canManageCoursesAndLessons(user)
  const canEdit = canEditLesson(user)

  const course = courses.find((item) => item.id === id)
  const courseLessons = useMemo(
    () => lessons.filter((lesson) => lesson.course === id).sort((a, b) => a.order - b.order),
    [lessons, id],
  )
  const cover = course ? getCourseCoverUrl(course) : null

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (loading)
    return (
      <div className="mx-auto max-w-[1400px] space-y-5">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-[360px] rounded-3xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    )
  if (!course)
    return (
      <div className="mx-auto max-w-[1000px]">
        <EmptyState
          title="Curso não encontrado"
          description="Este curso pode ter sido excluído ou o endereço está incorreto."
          actionLabel="Voltar aos cursos"
          onAction={() => navigate('/cursos')}
        />
      </div>
    )

  const toggleStatus = async () => {
    const next = course.status === 'ativo' ? 'inativo' : 'ativo'
    try {
      await updateCourseStatus(course, next)
      toast({
        title: next === 'ativo' ? 'Curso ativado' : 'Curso desativado',
        description: 'O status foi atualizado com sucesso.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar',
        description: getPortugueseError(error),
      })
    }
  }

  const confirmCourseDelete = async () => {
    setDeleting(true)
    try {
      await deleteCourse(course)
      toast({ title: 'Curso excluído', description: `${course.title} foi removido.` })
      navigate('/cursos', { replace: true })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: getPortugueseError(error),
      })
    } finally {
      setDeleting(false)
    }
  }

  const confirmLessonDelete = async () => {
    if (!deletingLesson) return
    setDeleting(true)
    try {
      await deleteLesson(deletingLesson)
      toast({ title: 'Aula excluída', description: 'A grade do curso foi atualizada.' })
      setDeletingLesson(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: getPortugueseError(error),
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-7">
      <Link
        to="/cursos"
        className="inline-flex min-h-10 items-center gap-2 rounded-xl pr-3 text-sm font-bold text-[#5A6B7E] transition hover:text-[#1F3864]"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos cursos
      </Link>

      <section className="animate-fade-in-up overflow-hidden rounded-3xl bg-white shadow-[0_8px_28px_rgba(31,56,100,.09)] md:grid md:grid-cols-[minmax(320px,.85fr)_1.15fr]">
        <div className="relative min-h-64 bg-gradient-to-br from-[#1F3864] via-[#334F68] to-[#1E3A12] md:min-h-[390px]">
          {cover ? (
            <img
              src={cover}
              alt={`Capa de ${course.title}`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center text-8xl font-bold text-white">
              P<span className="text-[#9CC747]">.</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#102438]/45 via-transparent to-transparent" />
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
          <div className="flex items-center justify-between gap-3">
            <StatusBadge status={course.status} />
            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl font-quicksand">
                  <DropdownMenuItem
                    onSelect={() => openEditCourse(course)}
                    className="font-semibold"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Editar curso
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void toggleStatus()} className="font-semibold">
                    {course.status === 'ativo' ? 'Desativar curso' : 'Ativar curso'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDeleteCourseOpen(true)}
                    className="font-semibold text-[#C0392B]"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir curso
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#1F3864] sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] font-medium leading-7 text-[#5A6B7E]">
            {course.description}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#F4F5F3] px-4 py-3 text-sm font-bold text-[#1F3864]">
              <BookOpen className="h-4 w-4 text-[#6E9B1F]" />
              {courseLessons.length} aulas
            </span>
            <span className="inline-flex items-center gap-2 rounded-xl bg-[#F4F5F3] px-4 py-3 text-sm font-bold text-[#1F3864]">
              <GraduationCap className="h-4 w-4 text-[#44546A]" />
              {course.students_count} alunos
            </span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            {canManage && (
              <>
                <Button
                  onClick={() => openEditCourse(course)}
                  variant="outline"
                  className="h-11 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864]"
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar informações
                </Button>
                <Button
                  onClick={() => {
                    setEditingLesson(null)
                    setLessonDialog(true)
                  }}
                  className="h-11 rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Aula
                </Button>
              </>
            )}
            {courseLessons[0] && (
              <Button
                onClick={() => navigate(`/aulas/${courseLessons[0].id}`)}
                className="h-11 rounded-xl bg-[#1F3864] font-bold text-white hover:bg-[#172E43]"
              >
                Começar a assistir
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-[0_4px_18px_rgba(31,56,100,.07)] sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1F3864]">Grade de aulas</h2>
            <p className="mt-1 text-sm font-medium text-[#718096]">
              Conteúdo organizado na ordem de exibição
            </p>
          </div>
          {canManage && (
            <Button
              onClick={() => {
                setEditingLesson(null)
                setLessonDialog(true)
              }}
              variant="outline"
              className="hidden rounded-xl border-[#D9D9D9] font-bold text-[#1F3864] sm:flex"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Aula
            </Button>
          )}
        </div>
        {courseLessons.length ? (
          <div className="divide-y divide-[#EDF0EA]">
            {courseLessons.map((lesson, index) => (
              <div key={lesson.id} className="group flex items-center gap-3 py-4 sm:gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0DF] text-sm font-bold text-[#6E9B1F]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Link
                  to={`/aulas/${lesson.id}`}
                  className="min-w-0 flex-1 group-hover:text-[#6E9B1F] transition"
                >
                  <p className="font-bold text-[#1F3864] transition group-hover:text-[#6E9B1F]">
                    {lesson.title}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#8290A0]">
                    <Clock3 className="h-3.5 w-3.5" />
                    {lesson.duration_min} minutos · Ordem {lesson.order}
                  </p>
                </Link>
                <div className="flex items-center gap-1">
                  <Link
                    to={`/aulas/${lesson.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#F4F5F3] px-3 text-xs font-bold text-[#1F3864] transition hover:bg-[#EAF0DF] hover:text-[#6E9B1F]"
                  >
                    Assistir
                  </Link>
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingLesson(lesson)
                        setLessonDialog(true)
                      }}
                      className="rounded-xl text-[#44546A]"
                      aria-label="Editar aula"
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                  {canManage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingLesson(lesson)}
                      className="rounded-xl text-[#C0392B] hover:bg-[#C0392B]/10 hover:text-[#C0392B]"
                      aria-label="Excluir aula"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Este curso ainda não tem aulas"
            description={
              canManage
                ? 'Crie a primeira aula para montar a jornada de aprendizagem.'
                : 'Ainda não há aulas publicadas para este curso.'
            }
            actionLabel={canManage ? 'Nova Aula' : undefined}
            onAction={
              canManage
                ? () => {
                    setEditingLesson(null)
                    setLessonDialog(true)
                  }
                : undefined
            }
          />
        )}
      </section>

      <LessonFormDialog
        open={lessonDialog}
        onOpenChange={setLessonDialog}
        lesson={editingLesson}
        initialCourseId={course.id}
        courses={courses}
      />
      <ConfirmDeleteDialog
        open={Boolean(deletingLesson)}
        onOpenChange={(open) => !open && setDeletingLesson(null)}
        title="Excluir aula?"
        description={
          deletingLesson
            ? `“${deletingLesson.title}” será removida da grade. Esta ação não pode ser desfeita.`
            : undefined
        }
        onConfirm={() => void confirmLessonDelete()}
        loading={deleting}
      />
      <ConfirmDeleteDialog
        open={deleteCourseOpen}
        onOpenChange={setDeleteCourseOpen}
        title="Excluir curso?"
        description={`“${course.title}” e todas as suas aulas serão removidos. Esta ação não pode ser desfeita.`}
        onConfirm={() => void confirmCourseDelete()}
        loading={deleting}
      />
    </div>
  )
}
