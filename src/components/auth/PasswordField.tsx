import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { Input } from '@/components/ui/input'

export function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  autoComplete = 'current-password',
  invalid = false,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  autoComplete?: string
  invalid?: boolean
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={invalid}
        className="h-12 rounded-xl border-[#D9D9D9] pr-12 font-medium focus-visible:ring-[#6E9B1F]"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#718096] transition hover:bg-[#F4F5F3] hover:text-[#1F3864]"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}
