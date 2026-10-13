import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { ImagePlus, Loader2, UploadCloud, X } from 'lucide-react'

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
import { useToast } from '@/hooks/use-toast'
import { useBackoffice } from '@/contexts/BackofficeContext'
import { createCourse, getCourseCoverUrl, updateCourse } from '@/services/courses'
import { getPortugueseError, getPortugueseFieldErrors } from '@/lib/pocketbase/translated-errors'
import type { Course, CourseStatus } from '@/types/backoffice'
import { cn } from '@/lib/utils'

interface FormState {
  title: string
  description: string
  status: CourseStatus
  thumbnail: File | null
}

const emptyForm: FormState = { title: '', description: '', status: 'ativo', thumbnail: null }

export function CourseFormDialog({
  open,
  onOpenChange,
  course,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course | null
}) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { refreshCourses } = useBackoffice()
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    setErrors({})
    setForm(
      course
        ? {
            title: course.title,
            description: course.description,
            status: course.status,
            thumbnail: null,
          }
        : emptyForm,
    )
    setPreview(course ? getCourseCoverUrl(course) : null)
  }, [open, course])

  useEffect(() => {
    return () => {
      if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const acceptFile = (file?: File) => {
    if (!file) return
    const nextErrors: Record<string, string> = {}
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
      nextErrors.thumbnail = 'Use uma imagem PNG, JPG ou WEBP.'
    if (file.size > 5 * 1024 * 1024) nextErrors.thumbnail = 'A imagem deve ter no máximo 5 MB.'
    setErrors((current) => ({ ...current, ...nextErrors }))
    if (Object.keys(nextErrors).length) return
    if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview)
    setForm((current) => ({ ...current, thumbnail: file }))
    setPreview(URL.createObjectURL(file))
    setErrors((current) => ({ ...current, thumbnail: '' }))
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files[0])
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.title.trim()) next.title = 'Informe o título do curso.'
    if (!form.description.trim()) next.description = 'Informe uma descrição curta.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    setErrors({})
    try {
      const input = {
        title: form.title,
        description: form.description,
        status: form.status,
        thumbnail: form.thumbnail,
      }
      if (course) await updateCourse(course, input)
      else await createCourse(input)
      await refreshCourses()
      onOpenChange(false)
      toast({
        title: course ? 'Curso atualizado com sucesso' : 'Curso criado com sucesso',
        description: 'As informações já estão disponíveis.',
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
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-0 font-quicksand shadow-2xl sm:max-w-xl">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#6E9B1F]">
              <ImagePlus className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#1F3864]">
              {course ? 'Editar Curso' : 'Novo Curso'}
            </DialogTitle>
            <DialogDescription className="font-medium text-[#5A6B7E]">
              {course
                ? 'Atualize as informações exibidas aos administradores.'
                : 'Cadastre uma nova experiência de desenvolvimento.'}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="course-title" className="font-bold text-[#1F3864]">
                Título *
              </Label>
              <Input
                id="course-title"
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
                placeholder="Ex.: Liderança Humanizada"
                className="h-12 rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
                aria-invalid={Boolean(errors.title)}
              />
              {errors.title ? (
                <p className="text-xs font-semibold text-[#C0392B]">{errors.title}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-description" className="font-bold text-[#1F3864]">
                Descrição curta *
              </Label>
              <Textarea
                id="course-description"
                value={form.description}
                maxLength={500}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                placeholder="Conte em poucas palavras o principal resultado deste curso..."
                className="min-h-28 resize-none rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
                aria-invalid={Boolean(errors.description)}
              />
              <div className="flex justify-between gap-3">
                {errors.description ? (
                  <p className="text-xs font-semibold text-[#C0392B]">{errors.description}</p>
                ) : (
                  <span />
                )}
                <span className="text-xs font-medium text-[#8290A0]">
                  {form.description.length}/500
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[#1F3864]">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: CourseStatus) =>
                  setForm((current) => ({ ...current, status: value }))
                }
              >
                <SelectTrigger className="h-12 rounded-xl border-[#D9D9D9] font-semibold focus:ring-[#6E9B1F]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="font-quicksand">
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-[#1F3864]">Thumbnail</Label>
              <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => acceptFile(event.target.files?.[0])}
              />
              {preview ? (
                <div className="group relative aspect-video overflow-hidden rounded-2xl bg-[#1F3864]">
                  <img
                    src={preview}
                    alt="Prévia da thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setPreview(null)
                      setForm((current) => ({ ...current, thumbnail: null }))
                    }}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1F3864] shadow transition hover:scale-105"
                    aria-label="Remover nova imagem"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="absolute inset-x-3 bottom-3 rounded-xl bg-[#1F3864]/85 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-[#1F3864]"
                  >
                    Trocar imagem
                  </button>
                </div>
              ) : (
                <div
                  onDragOver={(event) => {
                    event.preventDefault()
                    setDragging(true)
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-8 text-center transition',
                    dragging
                      ? 'border-[#6E9B1F] bg-[#EAF0DF]'
                      : 'border-[#CDD4CA] bg-[#F8F9F7] hover:border-[#6E9B1F] hover:bg-[#F3F7ED]',
                  )}
                >
                  <UploadCloud className="mb-3 h-8 w-8 text-[#6E9B1F]" />
                  <p className="text-sm font-bold text-[#1F3864]">
                    Arraste uma imagem ou clique para escolher
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#5A6B7E]">
                    PNG, JPG ou WEBP · até 5 MB
                  </p>
                </div>
              )}
              {errors.thumbnail ? (
                <p className="text-xs font-semibold text-[#C0392B]">{errors.thumbnail}</p>
              ) : null}
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
              {course ? 'Salvar alterações' : 'Criar curso'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
