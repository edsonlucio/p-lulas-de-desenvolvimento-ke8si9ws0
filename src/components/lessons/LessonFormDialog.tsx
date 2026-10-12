import { useEffect, useState, type FormEvent } from 'react'
import { Clock3, Loader2, PlayCircle } from 'lucide-react'

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
import { useBackoffice } from '@/contexts/BackofficeContext'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError, getPortugueseFieldErrors } from '@/lib/pocketbase/translated-errors'
import { createLesson, updateLesson } from '@/services/lessons'
import type { Course, Lesson } from '@/types/backoffice'

export function LessonFormDialog({
  open,
  onOpenChange,
  lesson,
  initialCourseId,
  courses,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson?: Lesson | null
  initialCourseId?: string
  courses: Course[]
}) {
  const [title, setTitle] = useState('')
  const [course, setCourse] = useState('')
  const [duration, setDuration] = useState('30')
  const [order, setOrder] = useState('1')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const { refreshLessons } = useBackoffice()
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    setTitle(lesson?.title ?? '')
    setCourse(lesson?.course ?? initialCourseId ?? courses[0]?.id ?? '')
    setDuration(String(lesson?.duration_min ?? 30))
    setOrder(String(lesson?.order ?? 1))
    setErrors({})
  }, [open, lesson, initialCourseId, courses])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Informe o título da aula.'
    if (!course) next.course = 'Selecione o curso.'
    if (!duration || Number(duration) < 0) next.duration_min = 'Informe uma duração válida.'
    if (!order || Number(order) < 0) next.order = 'Informe uma ordem válida.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      const input = { title, course, durationMin: Number(duration), order: Number(order) }
      if (lesson) await updateLesson(lesson.id, input)
      else await createLesson(input)
      await refreshLessons()
      onOpenChange(false)
      toast({
        title: lesson ? 'Aula atualizada' : 'Aula criada com sucesso',
        description: 'A grade do curso já foi atualizada.',
      })
    } catch (error) {
      const fieldErrors = getPortugueseFieldErrors(error)
      setErrors({
        ...fieldErrors,
        form: Object.keys(fieldErrors).length ? '' : getPortugueseError(error),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl border-0 font-quicksand shadow-2xl sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#6E9B1F]">
              <PlayCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#1F3864]">
              {lesson ? 'Editar Aula' : 'Nova Aula'}
            </DialogTitle>
            <DialogDescription className="font-medium text-[#5A6B7E]">
              Organize o conteúdo com uma sequência clara e objetiva.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lesson-title" className="font-bold text-[#1F3864]">
                Título *
              </Label>
              <Input
                id="lesson-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Comunicação assertiva"
                className="h-12 rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
              />
              {errors.title ? (
                <p className="text-xs font-semibold text-[#C0392B]">{errors.title}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-[#1F3864]">Curso *</Label>
              <Select value={course} onValueChange={setCourse} disabled={Boolean(initialCourseId)}>
                <SelectTrigger className="h-12 rounded-xl border-[#D9D9D9] font-semibold focus:ring-[#6E9B1F]">
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent className="font-quicksand">
                  {courses.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course ? (
                <p className="text-xs font-semibold text-[#C0392B]">{errors.course}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lesson-duration" className="font-bold text-[#1F3864]">
                  Duração (min)
                </Label>
                <div className="relative">
                  <Clock3 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718096]" />
                  <Input
                    id="lesson-duration"
                    type="number"
                    min="0"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    className="h-12 rounded-xl border-[#D9D9D9] pl-10 font-medium focus-visible:ring-[#6E9B1F]"
                  />
                </div>
                {errors.duration_min ? (
                  <p className="text-xs font-semibold text-[#C0392B]">{errors.duration_min}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-order" className="font-bold text-[#1F3864]">
                  Ordem
                </Label>
                <Input
                  id="lesson-order"
                  type="number"
                  min="0"
                  value={order}
                  onChange={(event) => setOrder(event.target.value)}
                  className="h-12 rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
                />
                {errors.order ? (
                  <p className="text-xs font-semibold text-[#C0392B]">{errors.order}</p>
                ) : null}
              </div>
            </div>
            {errors.form ? (
              <p className="rounded-xl bg-[#C0392B]/10 px-4 py-3 text-sm font-semibold text-[#C0392B]">
                {errors.form}
              </p>
            ) : null}
          </div>
          <DialogFooter className="mt-7 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl font-bold text-[#5A6B7E]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-11 rounded-xl bg-[#6E9B1F] px-6 font-bold text-white hover:bg-[#5C8619]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {lesson ? 'Salvar alterações' : 'Criar aula'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
