import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import {
  Clock3,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Film,
  ImagePlus,
  Loader2,
  PlayCircle,
  Presentation,
  UploadCloud,
  X,
  Youtube,
} from 'lucide-react'

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
import { createLesson, getLessonFileUrl, updateLesson } from '@/services/lessons'
import type { Course, Lesson } from '@/types/backoffice'
import { cn } from '@/lib/utils'

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
  const [description, setDescription] = useState('')

  // Materiais
  const [videoUrl, setVideoUrl] = useState('')

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [removeThumbnail, setRemoveThumbnail] = useState(false)

  const [videoUploadFile, setVideoUploadFile] = useState<File | null>(null)
  const [videoUploadName, setVideoUploadName] = useState<string | null>(null)
  const [removeVideoUpload, setRemoveVideoUpload] = useState(false)

  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const [removePdfFile, setRemovePdfFile] = useState(false)
  const [pdfUrl, setPdfUrl] = useState('')

  const [pptFile, setPptFile] = useState<File | null>(null)
  const [pptFileName, setPptFileName] = useState<string | null>(null)
  const [removePptFile, setRemovePptFile] = useState(false)
  const [pptUrl, setPptUrl] = useState('')

  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [excelFileName, setExcelFileName] = useState<string | null>(null)
  const [removeExcelFile, setRemoveExcelFile] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const pptInputRef = useRef<HTMLInputElement>(null)
  const excelInputRef = useRef<HTMLInputElement>(null)

  const { refreshLessons } = useBackoffice()
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    setTitle(lesson?.title ?? '')
    setCourse(lesson?.course ?? initialCourseId ?? courses[0]?.id ?? '')
    setDuration(String(lesson?.duration_min ?? 30))
    setOrder(String(lesson?.order ?? 1))
    setDescription(lesson?.description ?? '')

    setVideoUrl(lesson?.video_url ?? '')

    setThumbnailFile(null)
    setRemoveThumbnail(false)
    setThumbnailPreview(lesson?.thumbnail ? getLessonFileUrl(lesson, lesson.thumbnail) : null)

    setVideoUploadFile(null)
    setRemoveVideoUpload(false)
    setVideoUploadName(lesson?.video_upload ? lesson.video_upload : null)

    setPdfFile(null)
    setRemovePdfFile(false)
    setPdfFileName(lesson?.pdf_file ? lesson.pdf_file : null)
    setPdfUrl(lesson?.pdf_url ?? '')

    setPptFile(null)
    setRemovePptFile(false)
    setPptFileName(lesson?.ppt_file ? lesson.ppt_file : null)
    setPptUrl(lesson?.ppt_url ?? '')

    setExcelFile(null)
    setRemoveExcelFile(false)
    setExcelFileName(lesson?.excel_file ? lesson.excel_file : null)

    setErrors({})
  }, [open, lesson, initialCourseId, courses])

  useEffect(() => {
    return () => {
      if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview)
    }
  }, [thumbnailPreview])

  const handleThumbnailSelect = (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrors((prev) => ({ ...prev, thumbnail: 'Use uma imagem PNG, JPG ou WEBP.' }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, thumbnail: 'A imagem deve ter no máximo 5 MB.' }))
      return
    }
    if (thumbnailPreview?.startsWith('blob:')) URL.revokeObjectURL(thumbnailPreview)
    setThumbnailFile(file)
    setThumbnailPreview(URL.createObjectURL(file))
    setRemoveThumbnail(false)
    setErrors((prev) => ({ ...prev, thumbnail: '' }))
  }

  const handleVideoSelect = (file?: File) => {
    if (!file) return
    const valid = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska']
    if (!valid.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
      setErrors((prev) => ({
        ...prev,
        video_upload: 'Formato inválido. Use MP4, WebM, MOV ou MKV.',
      }))
      return
    }
    if (file.size > 250 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, video_upload: 'O vídeo gravado deve ter no máximo 250 MB.' }))
      return
    }
    setVideoUploadFile(file)
    setVideoUploadName(file.name)
    setRemoveVideoUpload(false)
    setErrors((prev) => ({ ...prev, video_upload: '' }))
  }

  const handlePdfSelect = (file?: File) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setErrors((prev) => ({ ...prev, pdf_file: 'Arquivo inválido. Selecione um documento PDF.' }))
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, pdf_file: 'O arquivo PDF deve ter no máximo 50 MB.' }))
      return
    }
    setPdfFile(file)
    setPdfFileName(file.name)
    setRemovePdfFile(false)
    setErrors((prev) => ({ ...prev, pdf_file: '' }))
  }

  const handlePptSelect = (file?: File) => {
    if (!file) return
    const isPpt =
      file.name.endsWith('.ppt') ||
      file.name.endsWith('.pptx') ||
      file.type === 'application/vnd.ms-powerpoint' ||
      file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    if (!isPpt) {
      setErrors((prev) => ({
        ...prev,
        ppt_file: 'Arquivo inválido. Selecione uma apresentação PPT ou PPTX.',
      }))
      return
    }
    if (file.size > 100 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, ppt_file: 'O arquivo PPT deve ter no máximo 100 MB.' }))
      return
    }
    setPptFile(file)
    setPptFileName(file.name)
    setRemovePptFile(false)
    setErrors((prev) => ({ ...prev, ppt_file: '' }))
  }

  const handleExcelSelect = (file?: File) => {
    if (!file) return
    const isExcel =
      file.name.endsWith('.xlsx') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.csv') ||
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'text/csv' ||
      file.type === 'application/csv'
    if (!isExcel) {
      setErrors((prev) => ({
        ...prev,
        excel_file: 'Arquivo inválido. Selecione uma planilha Excel (.xlsx, .xls) ou CSV.',
      }))
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        excel_file: 'A planilha Excel deve ter no máximo 5 MB.',
      }))
      return
    }
    setExcelFile(file)
    setExcelFileName(file.name)
    setRemoveExcelFile(false)
    setErrors((prev) => ({ ...prev, excel_file: '' }))
  }

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
      const input = {
        title,
        course,
        durationMin: Number(duration),
        order: Number(order),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        thumbnail: thumbnailFile,
        removeThumbnail,
        videoUpload: videoUploadFile,
        removeVideoUpload,
        pdfFile,
        removePdfFile,
        pdfUrl: pdfUrl.trim(),
        pptFile,
        removePptFile,
        pptUrl: pptUrl.trim(),
        excelFile,
        removeExcelFile,
      }
      if (lesson) await updateLesson(lesson.id, input)
      else await createLesson(input)
      await refreshLessons()
      onOpenChange(false)
      toast({
        title: lesson ? 'Aula atualizada' : 'Aula criada com sucesso',
        description: 'A grade do curso e materiais foram atualizados.',
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
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-0 font-quicksand shadow-2xl sm:max-w-2xl">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#6E9B1F]">
              <PlayCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-2xl font-bold text-[#1F3864]">
              {lesson ? 'Editar Aula' : 'Nova Aula'}
            </DialogTitle>
            <DialogDescription className="font-medium text-[#5A6B7E]">
              Adicione os materiais desejados para esta aula (vídeo, arquivos PDF/PPT e capa).
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6E9B1F]">
                1. Informações Básicas
              </h3>

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
                <Select
                  value={course}
                  onValueChange={setCourse}
                  disabled={Boolean(initialCourseId)}
                >
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

              <div className="space-y-2">
                <Label htmlFor="lesson-description" className="font-bold text-[#1F3864]">
                  Descrição da Aula
                </Label>
                <textarea
                  id="lesson-description"
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Breve resumo ou objetivos de aprendizagem desta aula..."
                  className="w-full rounded-xl border border-[#D9D9D9] p-3 text-sm font-medium text-[#1F3864] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E9B1F]"
                />
              </div>
            </div>

            {/* Thumbnail / Capa da Aula */}
            <div className="space-y-3 rounded-2xl bg-[#F8F9F7] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-[#6E9B1F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864]">
                  Thumbnail / Capa da Aula (opcional)
                </h3>
              </div>
              <p className="text-xs text-[#718096]">
                Imagem em destaque nos cards e listas de aulas (PNG, JPG, WEBP até 5MB).
              </p>

              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => handleThumbnailSelect(e.target.files?.[0])}
              />

              {thumbnailPreview ? (
                <div className="group relative aspect-video max-w-sm overflow-hidden rounded-2xl bg-[#1F3864]">
                  <img
                    src={thumbnailPreview}
                    alt="Prévia da thumbnail"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (thumbnailPreview?.startsWith('blob:'))
                        URL.revokeObjectURL(thumbnailPreview)
                      setThumbnailPreview(null)
                      setThumbnailFile(null)
                      setRemoveThumbnail(true)
                    }}
                    className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#1F3864] shadow transition hover:scale-105"
                    title="Remover thumbnail"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="absolute inset-x-3 bottom-3 rounded-xl bg-[#1F3864]/85 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-[#1F3864]"
                  >
                    Trocar imagem
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#CDD4CA] bg-white px-4 py-6 text-center transition hover:border-[#6E9B1F] hover:bg-[#F3F7ED]"
                >
                  <UploadCloud className="mb-2 h-6 w-6 text-[#6E9B1F]" />
                  <p className="text-xs font-bold text-[#1F3864]">
                    Clique para selecionar thumbnail com preview
                  </p>
                  <p className="text-[11px] text-[#718096]">PNG, JPG ou WEBP · até 5 MB</p>
                </div>
              )}
              {errors.thumbnail ? (
                <p className="text-xs font-semibold text-[#C0392B]">{errors.thumbnail}</p>
              ) : null}
            </div>

            {/* Materiais: Vídeos */}
            <div className="space-y-4 rounded-2xl bg-[#F8F9F7] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-[#6E9B1F]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864]">
                  Vídeo da Aula (YouTube ou Gravado)
                </h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lesson-video" className="text-xs font-bold text-[#1F3864]">
                  Link do YouTube (embed)
                </Label>
                <Input
                  id="lesson-video"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... ou https://youtu.be/..."
                  className="h-11 rounded-xl border-[#D9D9D9] bg-white font-medium focus-visible:ring-[#6E9B1F]"
                />
              </div>

              <div className="space-y-2 border-t border-[#E5E9E0] pt-3">
                <Label className="text-xs font-bold text-[#1F3864]">
                  Vídeo Gravado (Upload direto de arquivo)
                </Label>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,video/x-matroska"
                  className="hidden"
                  onChange={(e) => handleVideoSelect(e.target.files?.[0])}
                />
                {videoUploadName ? (
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#E0E5DC]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Film className="h-5 w-5 shrink-0 text-[#6E9B1F]" />
                      <span className="truncate text-xs font-bold text-[#1F3864]">
                        {videoUploadName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => videoInputRef.current?.click()}
                        className="h-8 rounded-lg text-xs font-bold text-[#1F3864]"
                      >
                        Substituir
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoUploadFile(null)
                          setVideoUploadName(null)
                          setRemoveVideoUpload(true)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10"
                        title="Remover vídeo"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => videoInputRef.current?.click()}
                    className="h-10 w-full rounded-xl border-dashed border-[#CDD4CA] bg-white text-xs font-bold text-[#1F3864] hover:border-[#6E9B1F]"
                  >
                    <Film className="mr-2 h-4 w-4 text-[#6E9B1F]" />
                    Fazer upload de vídeo gravado (MP4, WebM, MOV até 250MB)
                  </Button>
                )}
                {errors.video_upload ? (
                  <p className="text-xs font-semibold text-[#C0392B]">{errors.video_upload}</p>
                ) : null}
              </div>
            </div>

            {/* Materiais: PDF */}
            <div className="space-y-4 rounded-2xl bg-[#F8F9F7] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#C0392B]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864]">
                  Material em PDF (opcional)
                </h3>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1F3864]">Arquivo PDF (Upload)</Label>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handlePdfSelect(e.target.files?.[0])}
                />
                {pdfFileName ? (
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#E0E5DC]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="h-5 w-5 shrink-0 text-[#C0392B]" />
                      <span className="truncate text-xs font-bold text-[#1F3864]">
                        {pdfFileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => pdfInputRef.current?.click()}
                        className="h-8 rounded-lg text-xs font-bold text-[#1F3864]"
                      >
                        Substituir
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setPdfFile(null)
                          setPdfFileName(null)
                          setRemovePdfFile(true)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10"
                        title="Remover arquivo PDF"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pdfInputRef.current?.click()}
                    className="h-10 w-full rounded-xl border-dashed border-[#CDD4CA] bg-white text-xs font-bold text-[#1F3864] hover:border-[#6E9B1F]"
                  >
                    <FileText className="mr-2 h-4 w-4 text-[#C0392B]" />
                    Selecionar arquivo PDF para upload (até 50MB)
                  </Button>
                )}
                {errors.pdf_file ? (
                  <p className="text-xs font-semibold text-[#C0392B]">{errors.pdf_file}</p>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-[#E5E9E0] pt-3">
                <Label htmlFor="lesson-pdf-url" className="text-xs font-bold text-[#1F3864]">
                  Ou Link de PDF online (URL externa)
                </Label>
                <Input
                  id="lesson-pdf-url"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                  placeholder="https://exemplo.com/apostila.pdf"
                  className="h-11 rounded-xl border-[#D9D9D9] bg-white font-medium focus-visible:ring-[#6E9B1F]"
                />
              </div>
            </div>

            {/* Materiais: Apresentação PPT */}
            <div className="space-y-4 rounded-2xl bg-[#F8F9F7] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <Presentation className="h-4 w-4 text-[#D35400]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864]">
                  Apresentação PPT / PPTX (opcional)
                </h3>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#1F3864]">
                  Arquivo PowerPoint (Upload .ppt / .pptx)
                </Label>
                <input
                  ref={pptInputRef}
                  type="file"
                  accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                  className="hidden"
                  onChange={(e) => handlePptSelect(e.target.files?.[0])}
                />
                {pptFileName ? (
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#E0E5DC]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Presentation className="h-5 w-5 shrink-0 text-[#D35400]" />
                      <span className="truncate text-xs font-bold text-[#1F3864]">
                        {pptFileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => pptInputRef.current?.click()}
                        className="h-8 rounded-lg text-xs font-bold text-[#1F3864]"
                      >
                        Substituir
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setPptFile(null)
                          setPptFileName(null)
                          setRemovePptFile(true)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10"
                        title="Remover arquivo PPT"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => pptInputRef.current?.click()}
                    className="h-10 w-full rounded-xl border-dashed border-[#CDD4CA] bg-white text-xs font-bold text-[#1F3864] hover:border-[#6E9B1F]"
                  >
                    <Presentation className="mr-2 h-4 w-4 text-[#D35400]" />
                    Selecionar apresentação PPT/PPTX (até 100MB)
                  </Button>
                )}
                {errors.ppt_file ? (
                  <p className="text-xs font-semibold text-[#C0392B]">{errors.ppt_file}</p>
                ) : null}
              </div>

              <div className="space-y-2 border-t border-[#E5E9E0] pt-3">
                <Label htmlFor="lesson-ppt-url" className="text-xs font-bold text-[#1F3864]">
                  Ou Link de Apresentação online (ex.: Google Slides ou OneDrive)
                </Label>
                <Input
                  id="lesson-ppt-url"
                  value={pptUrl}
                  onChange={(e) => setPptUrl(e.target.value)}
                  placeholder="https://docs.google.com/presentation/..."
                  className="h-11 rounded-xl border-[#D9D9D9] bg-white font-medium focus-visible:ring-[#6E9B1F]"
                />
              </div>
            </div>

            {/* Materiais: Planilha Excel como fonte externa */}
            <div className="space-y-4 rounded-2xl bg-[#F8F9F7] p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-[#1E7145]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F3864]">
                  Planilha Excel / Fonte Externa (opcional)
                </h3>
              </div>
              <p className="text-xs text-[#718096]">
                Anexe planilhas (.xlsx, .xls, .csv) como material de apoio e fonte externa da aula.
              </p>

              <div className="space-y-2">
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                  className="hidden"
                  onChange={(e) => handleExcelSelect(e.target.files?.[0])}
                />
                {excelFileName ? (
                  <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#E0E5DC]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className="h-5 w-5 shrink-0 text-[#1E7145]" />
                      <span className="truncate text-xs font-bold text-[#1F3864]">
                        {excelFileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => excelInputRef.current?.click()}
                        className="h-8 rounded-lg text-xs font-bold text-[#1F3864]"
                      >
                        Substituir
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setExcelFile(null)
                          setExcelFileName(null)
                          setRemoveExcelFile(true)
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#C0392B] hover:bg-[#C0392B]/10"
                        title="Remover planilha"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => excelInputRef.current?.click()}
                    className="h-10 w-full rounded-xl border-dashed border-[#CDD4CA] bg-white text-xs font-bold text-[#1F3864] hover:border-[#1E7145]"
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4 text-[#1E7145]" />
                    Selecionar planilha Excel (.xlsx, .xls, .csv até 5MB)
                  </Button>
                )}
                {errors.excel_file ? (
                  <p className="text-xs font-semibold text-[#C0392B]">{errors.excel_file}</p>
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
