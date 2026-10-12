import { AlertTriangle, Loader2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description = 'Esta ação não pode ser desfeita.',
  onConfirm,
  loading = false,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  onConfirm: () => void
  loading?: boolean
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-2xl border-0 font-quicksand shadow-2xl sm:max-w-md">
        <AlertDialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#C0392B]/10 text-[#C0392B]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <AlertDialogTitle className="text-xl font-bold text-[#1F3864]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="font-medium text-[#5A6B7E]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xl font-bold">Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-[#C0392B] font-bold text-white hover:bg-[#A93226]"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
