import { BookOpen, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { CourseActions } from '@/components/courses/CourseActions'
import { StatusBadge } from '@/components/StatusBadge'
import { getCourseCoverUrl } from '@/services/courses'
import type { Course } from '@/types/backoffice'

export function CourseCard({
  course,
  lessonCount,
  index,
  onEdit,
  onToggle,
  onDelete,
  canManage = true,
  completedLessons = 0,
}: {
  course: Course
  lessonCount: number
  index: number
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
  canManage?: boolean
  completedLessons?: number
}) {
  const navigate = useNavigate()
  const cover = getCourseCoverUrl(course)
  const percent =
    lessonCount > 0 ? Math.min(100, Math.round((completedLessons / lessonCount) * 100)) : 0

  return (
    <article
      onClick={() => navigate(`/cursos/${course.id}`)}
      style={{ animationDelay: `${index * 80}ms` }}
      className="group animate-fade-in-up cursor-pointer overflow-hidden rounded-2xl bg-white opacity-0 shadow-[0_4px_16px_rgba(31,56,100,.08)] transition-all duration-200 ease-out [animation-fill-mode:forwards] hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(31,56,100,.14)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#1F3864] via-[#334F68] to-[#1E3A12]">
        {cover ? (
          <img
            src={cover}
            alt={`Capa do curso ${course.title}`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl font-bold text-white/90">
            P<span className="text-[#9CC747]">.</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#102438]/35 via-transparent to-transparent" />
        <StatusBadge status={course.status} className="absolute right-3 top-3" />
      </div>
      <div className="p-5">
        <div className="flex items-start gap-2">
          <h3 className="min-w-0 flex-1 text-[19px] font-bold leading-snug text-[#1F3864] transition group-hover:text-[#527915]">
            {course.title}
          </h3>
          {canManage && (
            <CourseActions
              course={course}
              onEdit={onEdit}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          )}
        </div>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm font-medium leading-5 text-[#5A6B7E]">
          {course.description}
        </p>
        <div className="mt-5 flex items-center gap-4 border-t border-[#EEF0EC] pt-4 text-xs font-bold text-[#718096]">
          <span className="inline-flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-[#6E9B1F]" />
            {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <UsersRound className="h-4 w-4 text-[#44546A]" />
            {course.students_count} alunos
          </span>
        </div>
        <div className="mt-4">
          {lessonCount > 0 ? (
            <>
              <div className="flex items-center justify-between gap-2 text-xs font-bold">
                <span className="text-[#718096]">
                  {completedLessons} de {lessonCount} {lessonCount === 1 ? 'aula' : 'aulas'}{' '}
                  concluídas
                </span>
                <span className="text-[#1F3864]">{percent}%</span>
              </div>
              <div
                className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[#E4E6E3]"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Progresso do curso ${course.title}`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1F3864] to-[#6E9B1F] transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </>
          ) : (
            <p className="text-xs font-semibold text-[#718096]">
              Nenhuma aula cadastrada neste curso ainda.
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
