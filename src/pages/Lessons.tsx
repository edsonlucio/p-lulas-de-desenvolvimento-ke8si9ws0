import { useMemo, useState } from 'react'
import { Clock3, Edit3, PlayCircle, Plus, Search, Trash2 } from 'lucide-react'

import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { EmptyState } from '@/components/EmptyState'
import { LessonFormDialog } from '@/components/lessons/LessonFormDialog'
import { PageIntro } from '@/components/PageIntro'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { canManageCoursesAndLessons, canEditLesson } from '@/lib/roles'
import { getLessonFileUrl } from '@/services/lessons'
import type { Lesson } from '@/types/backoffice'

export default function Lessons() {
  const { user } = useAuth()
  const { courses, lessons, loading, deleteLesson, canAccessCourseContent } = useBackoffice()
  const { toast } = useToast()
  const [search, setSearch] = useState('')
  const [courseFilter, setCourseFilter] = useState('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Lesson | null>(null)
  const [deleting, setDeleting] = useState<Lesson | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const canManage = canManageCoursesAndLessons(user)
  const canEdit = canEditLesson(user)

  const grouped = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR')
    return courses
      .map((course) => ({
        course,
        lessons: lessons
          .filter(
            (lesson) =>
              lesson.course === course.id &&
              (courseFilter === 'todos' || lesson.course === courseFilter) &&
              (!term || lesson.title.toLocaleLowerCase('pt-BR').includes(term)),
          )
          .sort((a, b) => a.order - b.order),
      }))
      .filter((group) => group.lessons.length)
  }, [courses, lessons, search, courseFilter])

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteLoading(true)
    try {
      await deleteLesson(deleting)
      toast({ title: 'Aula excluída', description: 'A grade foi atualizada com sucesso.' })
      setDeleting(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: getPortugueseError(error),
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-7">
      <PageIntro
        eyebrow="Aprendizagem"
        title="Aulas"
        description="Encontre, organize e atualize as aulas de todos os cursos."
        action={
          canManage ? (
            <Button
              onClick={() => {
                setEditing(null)
                setDialogOpen(true)
              }}
              className="h-11 rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Aula
            </Button>
          ) : undefined
        }
      />
      <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_16px_rgba(31,56,100,.06)] sm:grid-cols-[1fr_280px]">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#718096]" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar pelo título da aula..."
            className="h-12 rounded-xl border-[#E2E5DF] pl-12 font-medium focus-visible:ring-[#6E9B1F]"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="h-12 rounded-xl border-[#E2E5DF] font-semibold focus:ring-[#6E9B1F]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="font-quicksand">
            <SelectItem value="todos">Todos os cursos</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-5">
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : grouped.length ? (
        <div className="space-y-5">
          {grouped.map(({ course, lessons: rows }) => (
            <section
              key={course.id}
              className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(31,56,100,.07)]"
            >
              <div className="flex items-center justify-between gap-3 bg-[#1F3864] px-5 py-4 text-white sm:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                    <PlayCircle className="h-5 w-5 text-[#A8D052]" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="truncate font-bold">{course.title}</h2>
                    <p className="text-xs font-semibold text-white/55">
                      {rows.length} {rows.length === 1 ? 'aula encontrada' : 'aulas encontradas'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-[#EDF0EA] px-4 sm:px-6">
                {rows.map((lesson, index) => (
                  <div key={lesson.id} className="group flex items-center gap-3 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F5EA] text-xs font-bold text-[#6E9B1F]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {lesson.thumbnail ? (
                      <div className="hidden h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-[#1F3864] sm:block">
                        <img
                          src={getLessonFileUrl(lesson, lesson.thumbnail) ?? ''}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : null}
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
                        className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition ${
                          canAccessCourseContent(lesson.course)
                            ? 'bg-[#F4F5F3] text-[#1F3864] hover:bg-[#EAF0DF] hover:text-[#6E9B1F]'
                            : 'bg-[#FFF8E7] text-[#B7791F] border border-[#F5B041]/40'
                        }`}
                      >
                        {canAccessCourseContent(lesson.course) ? (
                          <>
                            <PlayCircle className="h-4 w-4 text-[#6E9B1F]" />
                            <span className="hidden sm:inline">Assistir aula</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs">🔒</span>
                            <span className="hidden sm:inline">Bloqueada</span>
                          </>
                        )}
                      </Link>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditing(lesson)
                            setDialogOpen(true)
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
                          onClick={() => setDeleting(lesson)}
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
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Nenhuma aula encontrada"
          description="Ajuste os filtros ou crie uma nova aula para continuar."
          actionLabel={canManage ? 'Nova Aula' : undefined}
          onAction={
            canManage
              ? () => {
                  setEditing(null)
                  setDialogOpen(true)
                }
              : undefined
          }
        />
      )}

      <LessonFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        lesson={editing}
        courses={courses}
      />
      <ConfirmDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Excluir aula?"
        description={
          deleting
            ? `“${deleting.title}” será removida. Esta ação não pode ser desfeita.`
            : undefined
        }
        onConfirm={() => void confirmDelete()}
        loading={deleteLoading}
      />
    </div>
  )
}
