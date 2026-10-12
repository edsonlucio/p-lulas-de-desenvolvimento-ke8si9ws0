import { Edit3, MoreHorizontal, Power, Trash2 } from 'lucide-react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import type { Course } from '@/types/backoffice'

export function CourseActions({
  course,
  onEdit,
  onToggle,
  onDelete,
}: {
  course: Course
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={(event) => event.stopPropagation()}
          className="h-9 w-9 rounded-xl text-[#5A6B7E] hover:bg-[#F0F3EC] hover:text-[#1F3864]"
          aria-label={`Ações de ${course.title}`}
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-xl border-0 p-1.5 font-quicksand shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <DropdownMenuItem
          onSelect={onEdit}
          className="cursor-pointer rounded-lg font-semibold text-[#1F3864]"
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onToggle}
          className="cursor-pointer rounded-lg font-semibold text-[#1F3864]"
        >
          <Power className="mr-2 h-4 w-4" />
          {course.status === 'ativo' ? 'Desativar' : 'Ativar'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onDelete}
          className="cursor-pointer rounded-lg font-semibold text-[#C0392B] focus:bg-[#C0392B]/10 focus:text-[#C0392B]"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
