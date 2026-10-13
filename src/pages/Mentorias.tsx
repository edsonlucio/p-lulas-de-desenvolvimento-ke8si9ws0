import { useCallback, useEffect, useState } from 'react'
import {
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  Link2,
  Loader2,
  NotebookPen,
  Pencil,
  Plus,
  Users,
  Video,
} from 'lucide-react'

import { PageIntro } from '@/components/PageIntro'
import { UserAvatar } from '@/components/UserAvatar'
import { MentorshipFormDialog } from '@/components/mentorships/MentorshipFormDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { getPortugueseError } from '@/lib/pocketbase/translated-errors'
import { getUserRole } from '@/lib/roles'
import { cn } from '@/lib/utils'
import {
  getMentorshipMaterialUrl,
  listMentorships,
  removeMentorship,
  updateMentorship,
} from '@/services/mentorships'
import { FileText, Download, BookMarked } from 'lucide-react'
import type { Mentorship, MentorshipStatus } from '@/types/backoffice'

const STATUS_STYLES: Record<MentorshipStatus, { label: string; classes: string; dot: string }> = {
  agendada: {
    label: 'Agendada',
    classes: 'bg-[#EAF0DF] text-[#527915] border border-[#C9DCB0]',
    dot: 'bg-[#6E9B1F]',
  },
  concluida: {
    label: 'Concluída',
    classes: 'bg-[#1F3864] text-white',
    dot: 'bg-white',
  },
  cancelada: {
    label: 'Cancelada',
    classes: 'bg-[#E4E6E3] text-[#718096]',
    dot: 'bg-[#718096]',
  },
}

function MentorshipStatusBadge({ status }: { status: MentorshipStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.agendada
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-sm',
        style.classes,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  )
}

function formatScheduled(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function StudentName({ mentorship }: { mentorship: Mentorship }) {
  const expanded = mentorship.expand?.student
  if (expanded?.name) return <>{expanded.name}</>
  if (expanded?.email) return <>{expanded.email}</>
  return <>Aluno</>
}

export default function Mentorias() {
  const { user } = useAuth()
  const { toast } = useToast()
  const role = getUserRole(user)
  const canManage = role === 'adm' || role === 'coordenador' || role === 'professor'

  const [mentorships, setMentorships] = useState<Mentorship[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Mentorship | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setMentorships(await listMentorships())
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar as mentorias',
        description: getPortugueseError(error),
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (mentorship: Mentorship) => {
    setEditing(mentorship)
    setDialogOpen(true)
  }

  const changeStatus = async (mentorship: Mentorship, next: MentorshipStatus) => {
    setSavingId(mentorship.id)
    try {
      await updateMentorship(mentorship.id, {
        student: mentorship.student,
        topic: mentorship.topic,
        scheduledAt: mentorship.scheduled_at,
        status: next,
        meetingLink: mentorship.meeting_link,
        notes: mentorship.notes,
      })
      await load()
      toast({
        title: 'Status atualizado',
        description: `A mentoria foi marcada como ${STATUS_STYLES[next].label.toLowerCase()}.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar',
        description: getPortugueseError(error),
      })
    } finally {
      setSavingId(null)
    }
  }

  const confirmCancel = async (mentorship: Mentorship) => {
    setSavingId(mentorship.id)
    try {
      await removeMentorship(mentorship.id)
      await load()
      toast({ title: 'Mentoria cancelada', description: 'O agendamento foi removido.' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível cancelar',
        description: getPortugueseError(error),
      })
    } finally {
      setSavingId(null)
    }
  }

  const totals = { agendada: 0, concluida: 0, cancelada: 0 }
  for (const item of mentorships) {
    if (item.status in totals) totals[item.status] += 1
  }
  const stats = [
    { label: 'Agendadas', value: totals.agendada, icon: CalendarClock, tone: 'text-[#6E9B1F]' },
    { label: 'Concluídas', value: totals.concluida, icon: CheckCircle2, tone: 'text-[#1F3864]' },
    { label: 'Canceladas', value: totals.cancelada, icon: CalendarX2, tone: 'text-[#718096]' },
  ]

  return (
    <div className="mx-auto max-w-[1600px] space-y-7">
      <PageIntro
        eyebrow="Mentoria"
        title="Mentorias Individuais"
        description={
          canManage
            ? 'Agende e acompanhe as sessões individuais entre mentores e alunos da plataforma.'
            : 'Acompanhe suas sessões individuais de mentoria agendadas pela equipe.'
        }
        action={
          canManage ? (
            <Button
              onClick={openNew}
              className="h-11 rounded-xl bg-[#6E9B1F] px-5 font-bold text-white shadow-[0_5px_14px_rgba(110,155,31,.22)] transition hover:scale-[1.02] hover:bg-[#5C8619] active:scale-[.98]"
            >
              <Plus className="mr-2 h-[18px] w-[18px]" />
              Agendar Mentoria
            </Button>
          ) : undefined
        }
      />

      <section aria-label="Resumo de mentorias" className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(31,56,100,.07)]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4F5F3]">
              <Icon className={cn('h-6 w-6', tone)} />
            </span>
            <div>
              <p className="text-2xl font-bold leading-none text-[#1F3864]">{value}</p>
              <p className="mt-1.5 text-sm font-semibold text-[#718096]">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : mentorships.length ? (
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_18px_rgba(31,56,100,.07)]">
          <div className="hidden grid-cols-[minmax(260px,1.6fr)_150px_140px_110px_170px] items-center gap-4 border-b border-[#EDF0EA] bg-[#F8F9F7] px-5 py-3 text-[11px] font-bold uppercase tracking-[.1em] text-[#718096] md:grid">
            <span>{canManage ? 'Aluno' : 'Mentoria'}</span>
            <span>Data / hora</span>
            <span>Status</span>
            <span>Link</span>
            <span className="text-right">Ações</span>
          </div>
          <div className="divide-y divide-[#EDF0EA]">
            {mentorships.map((mentorship, index) => {
              const link = (mentorship.meeting_link || '').trim()
              return (
                <div
                  key={mentorship.id}
                  style={{ animationDelay: `${index * 55}ms` }}
                  className="animate-fade-in-up px-4 py-4 opacity-0 [animation-fill-mode:forwards] hover:bg-[#F9FAF8] md:grid md:grid-cols-[minmax(260px,1.6fr)_150px_140px_110px_170px] md:items-center md:gap-4 md:px-5"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    {canManage ? (
                      <UserAvatar
                        user={mentorship.expand?.student ?? null}
                        className="h-10 w-10 shrink-0 border-white/60"
                      />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#6E9B1F]">
                        <ClipboardList className="h-5 w-5" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-bold text-[#1F3864]">{mentorship.topic}</p>
                      {canManage ? (
                        <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs font-medium text-[#718096]">
                          <GraduationCap className="h-3.5 w-3.5 shrink-0 text-[#6E9B1F]" />
                          <span className="truncate">
                            <StudentName mentorship={mentorship} />
                          </span>
                        </p>
                      ) : null}
                      {mentorship.notes ? (
                        <p className="mt-1 flex items-start gap-1.5 text-xs font-medium text-[#5A6B7E]">
                          <NotebookPen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#718096]" />
                          <span className="line-clamp-2">{mentorship.notes}</span>
                        </p>
                      ) : null}
                      {/* Materiais de estudo anexados à mentoria */}
                      {(mentorship.study_material || mentorship.study_material_file) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-[#F8F9F7] p-2 border border-[#EDF0EA]">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6E9B1F]">
                            <BookMarked className="h-3.5 w-3.5" />
                            Material de Estudo:
                          </span>
                          {mentorship.study_material && (
                            <span className="text-xs font-medium text-[#1F3864]">
                              {mentorship.study_material}
                            </span>
                          )}
                          {mentorship.study_material_file && (
                            <a
                              href={getMentorshipMaterialUrl(mentorship) ?? '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-[#EAF0DF] px-2 py-0.5 text-[11px] font-bold text-[#527915] hover:bg-[#d8e4c5]"
                            >
                              <FileText className="h-3 w-3" />
                              Baixar anexo
                              <Download className="h-3 w-3 ml-0.5" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3 md:mt-0 md:contents">
                    <span className="text-sm font-semibold text-[#5A6B7E]">
                      {formatScheduled(mentorship.scheduled_at)}
                    </span>
                    <MentorshipStatusBadge status={mentorship.status} />
                    <span className="min-w-0">
                      {link ? (
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-full bg-[#F4F5F3] px-2.5 py-1 text-xs font-bold text-[#1F3864] transition hover:bg-[#EAF0DF] hover:text-[#527915]"
                        >
                          <Video className="h-3.5 w-3.5 text-[#6E9B1F]" />
                          Entrar
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#718096]">
                          <Link2 className="h-3.5 w-3.5" />—
                        </span>
                      )}
                    </span>
                    {canManage ? (
                      <span className="flex flex-wrap items-center justify-end gap-2 md:justify-start">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(mentorship)}
                          className="h-8 rounded-lg border-[#D9D9D9] px-2.5 text-xs font-bold text-[#1F3864] hover:bg-[#F4F5F3]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>
                        {mentorship.status !== 'concluida' ? (
                          <Button
                            size="sm"
                            onClick={() => void changeStatus(mentorship, 'concluida')}
                            disabled={savingId === mentorship.id}
                            className="h-8 rounded-lg bg-[#1F3864] px-2.5 text-xs font-bold text-white hover:bg-[#17294a]"
                          >
                            {savingId === mentorship.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              'Concluir'
                            )}
                          </Button>
                        ) : null}
                        {mentorship.status !== 'cancelada' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void confirmCancel(mentorship)}
                            disabled={savingId === mentorship.id}
                            className="h-8 rounded-lg border-[#D9D9D9] px-2.5 text-xs font-bold text-[#718096] hover:border-[#C0392B] hover:text-[#C0392B]"
                          >
                            Cancelar
                          </Button>
                        ) : null}
                      </span>
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD3C3] bg-white/70 px-6 py-12 text-center">
          <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#EAF0DF] text-[#6E9B1F]">
            <div className="absolute -right-2 -top-2 h-7 w-7 rounded-full bg-[#1F3864]/10" />
            <Users className="h-9 w-9" />
          </div>
          <h3 className="text-lg font-bold text-[#1F3864]">Nenhuma mentoria agendada</h3>
          <p className="mt-1 max-w-md text-sm font-medium text-[#5A6B7E]">
            {canManage
              ? 'Agende a primeira sessão individual para começar a acompanhar os alunos.'
              : 'Quando a equipe agendar uma sessão para você, ela aparecerá aqui.'}
          </p>
        </div>
      )}

      <MentorshipFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mentorship={editing}
        onSaved={() => load()}
      />
    </div>
  )
}
