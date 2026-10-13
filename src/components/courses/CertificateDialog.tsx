import { useEffect, useState } from 'react'
import { Award, CheckCircle2, Download, ExternalLink, Printer, Sparkles, X } from 'lucide-react'

import { BrandLogo, BrandMark } from '@/components/BrandLogo'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Course, UserRecord } from '@/types/backoffice'

interface CertificateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student: UserRecord | null
  course: Course | null
  issuedAt?: string
  certificateCode?: string
}

export function CertificateDialog({
  open,
  onOpenChange,
  student,
  course,
  issuedAt,
  certificateCode,
}: CertificateDialogProps) {
  const [issueDate, setIssueDate] = useState('')

  useEffect(() => {
    if (open) {
      const dateToFormat = issuedAt ? new Date(issuedAt) : new Date()
      setIssueDate(
        dateToFormat.toLocaleDateString('pt-BR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      )
    }
  }, [open, issuedAt])

  const handlePrint = () => {
    window.print()
  }

  if (!course) return null

  const studentName = student?.name || student?.email?.split('@')[0] || 'Aluno(a)'
  const finalCode =
    certificateCode ||
    `PD-${(course.id || '000').slice(0, 6).toUpperCase()}-${(student?.id || '000').slice(0, 6).toUpperCase()}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] overflow-y-auto max-w-4xl p-0 font-quicksand border-0 shadow-2xl bg-white dark:bg-[#1A334C] print:border-0 print:shadow-none print:m-0 print:p-0 print:max-w-none">
        {/* Barra Superior com Ações de Impressão (oculta na impressão) */}
        <div className="flex items-center justify-between border-b border-[#EDF0EA] bg-[#F8F9F7] px-6 py-4 print:hidden dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-[#6E9B1F]" />
            <span className="font-bold text-[#1F3864] dark:text-white">
              Certificado de Conclusão
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="h-9 rounded-xl bg-[#6E9B1F] px-4 font-bold text-white shadow-sm hover:bg-[#5C8619]"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimir / Salvar em PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 rounded-xl font-bold dark:border-white/20 dark:text-white"
            >
              Fechar
            </Button>
          </div>
        </div>

        {/* ÁREA DO CERTIFICADO: MODELO LUXO COM BORDAS E BRANDING */}
        <div className="p-6 sm:p-10 print:p-8 bg-[#FAFAFA] dark:bg-[#102231]">
          <div className="relative mx-auto max-w-3xl rounded-3xl border-8 border-double border-[#1F3864]/20 bg-white p-8 sm:p-12 text-center shadow-lg dark:bg-[#152B40] dark:border-white/20 print:border-8 print:shadow-none">
            {/* Ornamento de Canto Superior */}
            <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-[#6E9B1F]" />
            <div className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-[#6E9B1F]" />
            <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-[#6E9B1F]" />
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-[#6E9B1F]" />

            {/* Cabeçalho com Logo */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center gap-3">
                <BrandMark className="h-10 w-10 text-[#6E9B1F]" />
                <span className="text-xl font-bold text-[#1F3864] tracking-tight dark:text-white">
                  Pílulas de Desenvolvimento
                </span>
              </div>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-[.25em] text-[#6E9B1F]">
                Certificado Oficial de Conclusão
              </p>
            </div>

            {/* Divisor Decorativo */}
            <div className="my-6 flex items-center justify-center gap-3">
              <div className="h-0.5 w-16 bg-[#6E9B1F]/40" />
              <Award className="h-6 w-6 text-[#6E9B1F]" />
              <div className="h-0.5 w-16 bg-[#6E9B1F]/40" />
            </div>

            {/* Texto Principal */}
            <p className="text-xs uppercase tracking-widest text-[#718096] dark:text-white/60">
              Certificamos com louvor que
            </p>

            <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1F3864] dark:text-white">
              {studentName}
            </h1>

            <p className="mt-4 text-sm font-medium leading-relaxed text-[#5A6B7E] dark:text-white/80 max-w-xl mx-auto">
              concluiu com êxito todas as aulas e atividades práticas do treinamento
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#6E9B1F]">"{course.title}"</h2>

            <p className="mt-3 text-xs font-medium text-[#718096] dark:text-white/60">
              Demonstrando dedicação, comprometimento e aproveitamento exemplar no ecossistema de
              capacitação profissional das Pílulas de Desenvolvimento.
            </p>

            {/* Assinaturas e Data */}
            <div className="mt-12 pt-8 border-t border-[#EDF0EA] dark:border-white/10 grid grid-cols-2 gap-8 items-end">
              <div className="text-center">
                <div className="mx-auto w-44 border-b-2 border-[#1F3864]/40 dark:border-white/30 pb-1 font-serif italic text-sm text-[#1F3864] dark:text-white">
                  JK Carvalho & Equipe
                </div>
                <p className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#1F3864] dark:text-white">
                  Coordenação Geral
                </p>
                <p className="text-[10px] text-[#718096] dark:text-white/50">
                  Pílulas de Desenvolvimento
                </p>
              </div>

              <div className="text-center">
                <p className="text-xs font-semibold text-[#1F3864] dark:text-white">
                  Emitido em {issueDate}
                </p>
                <p className="mt-1 text-[10px] text-[#718096] dark:text-white/50 font-mono font-semibold">
                  Código de Validação: {finalCode}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
