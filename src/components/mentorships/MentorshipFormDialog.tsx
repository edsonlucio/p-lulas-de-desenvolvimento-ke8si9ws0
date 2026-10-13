import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { GraduationCap, Loader2, Users } from 'lucide-react'

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
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { createMentorship, listStudents, updateMentorship } from '@/services/mentorships'
import type { Mentorship, MentorshipStatus, UserRecord } from '@/types/backoffice'

function toLocalInputValue(value?: string): string {
  const date = value ? new Date(value) : new Date()
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

export function MentorshipFormDialog({
  open,
  onOpenChange,
  mentorship,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  mentorship?: Mentorship | null
  onSaved: () => void | Promise<void>
}) {
  const [students, setStudents] = useState<UserRecord[]>([])
  const [student, setStudent] = useState('')
  const [topic, setTopic] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [status, setStatus] = useState<MentorshipStatus>('agendada')
  const [meetingLink, setMeetingLink] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!open) return
    setStudent(mentorship?.student ?? '')
    setTopic(mentorship?.topic ?? '')
    setScheduledAt(toLocalInputValue(mentorship?.scheduled_at))
    setStatus(mentorship?.status ?? 'agendada')
    setMeetingLink(mentorship?.meeting_link ?? '')
    setNotes(mentorship?.notes ?? '')
    setErrors({})
  }, [open, mentorship])

  useEffect(() => {
    if (!open) return
    let active = true
    setLoadingStudents(true)
    listStudents()
      .then((rows) => {
        if (active) setStudents(rows)
      })
      .catch(() => {
        if (active) setStudents([])
      })
      .finally(() => {
        if (active) setLoadingStudents(false)
      })
    return () => {
      active = false
    }
  }, [open])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!student) next.student = 'Selecione o aluno.'
    if (!topic.trim()) next.topic = 'Informe o tema da mentoria.'
    if (!scheduledAt) next.scheduled_at = 'Informe a data e a hora.'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    try {
      const payload = {
        student,
        topic,
        scheduledAt: new Date(scheduledAt).toISOString(),
        status,
        meetingLink,
        notes,
      }
      if (mentorship) {
        await updateMentorship(mentorship.id, payload)
        toast({
          title: 'Mentoria atualizada',
          description: 'As informações da sessão foram salvas.',
        })
      } else {
        await createMentorship(payload)
        toast({
          title: 'Mentoria agendada',
          description: 'A sessão individual foi criada com sucesso.',
        })
      }
      await onSaved()
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: mentorship ? 'Não foi possível salvar' : 'Não foi possível agendar',
        description: getPortugueseError(error),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl border-0 font-quicksand shadow-2xl sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#6E9B1F]">
              {mentorship ? <Users className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
            </div>
            <DialogTitle className="text-2xl font-bold text-[#1F3864]">
              {mentorship ? 'Editar Mentoria' : 'Agendar Mentoria'}
            </DialogTitle>
            <DialogDescription className="font-medium text-[#5A6B7E]">
              Defina o aluno, o tema e o horário da sessão individual.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label className="font-bold text-[#1F3864]">Aluno *</Label>
              <Select
                value={student}
                onValueChange={setStudent}
                disabled={loadingStudents || students.length === 0}
              >
                <SelectTrigger className="h-12 rounded-xl border-[#D9D9D9] font-semibold focus:ring-[#6E9B1F]">
                  <SelectValue
                    placeholder={loadingStudents ? 'Carregando alunos...' : 'Selecione o aluno'}
                  />
                </SelectTrigger>
                <SelectContent className="font-quicksand">
                  {students.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.name || person.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.student ? (
                <p className="text-xs font-semibold text-[#C0392B]">{errors.student}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentorship-topic" className="font-bold text-[#1F3864]">
                Tema *
              </Label>
              <Input
                id="mentorship-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Ex.: Plano de carreira e comunicação assertiva"
                className="h-12 rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
              />
              {errors.topic ? (
                <p className="text-xs font-semibold text-[#C0392B]">{errors.topic}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mentorship-date" className="font-bold text-[#1F3864]">
                  Data e hora *
                </Label>
                <Input
                  id="mentorship-date"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  className="h-12 rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
                />
                {errors.scheduled_at ? (
                  <p className="text-xs font-semibold text-[#C0392B]">{errors.scheduled_at}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-[#1F3864]">Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setStatus(value as MentorshipStatus)}
                >
                  <SelectTrigger className="h-12 rounded-xl border-[#D9D9D9] font-semibold focus:ring-[#6E9B1F]">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="font-quicksand">
                    <SelectItem value="agendada">Agendada</SelectItem>
                    <SelectItem value="concluida">Concluída</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentorship-link" className="font-bold text-[#1F3864]">
                Link da reunião (opcional)
              </Label>
              <Input
                id="mentorship-link"
                value={meetingLink}
                onChange={(event) => setMeetingLink(event.target.value)}
                placeholder="https://meet.google.com/..."
                className="h-12 rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mentorship-notes" className="font-bold text-[#1F3864]">
                Observações (opcional)
              </Label>
              <textarea
                id="mentorship-notes"
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contexto, objetivos ou combinados da sessão..."
                className="w-full rounded-xl border border-[#D9D9D9] p-3 text-sm font-medium text-[#1F3864] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E9B1F]"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border-[#D9D9D9] font-bold text-[#5A6B7E] hover:bg-[#F4F5F3]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#6E9B1F] font-bold text-white hover:bg-[#5C8619]"
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {mentorship ? 'Salvar' : 'Agendar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
