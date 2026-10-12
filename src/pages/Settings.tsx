import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  UserRound,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { PageIntro } from '@/components/PageIntro'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { getPortugueseError, getPortugueseFieldErrors } from '@/lib/pocketbase/translated-errors'
import { requestEmailChange } from '@/services/auth'
import type { UserRecord } from '@/types/backoffice'

const values = [
  'Clareza e Simplicidade',
  'Impacto e Contribuição',
  'Ética e Transparência',
  'Melhoria Contínua',
  'Protagonismo',
]

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
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
        className="h-12 rounded-xl border-[#D9D9D9] pr-11 font-medium focus-visible:ring-[#6E9B1F]"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#718096] hover:bg-[#F4F5F3]"
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function Settings() {
  const { user, syncUser, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const avatarInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user?.name ?? '')
  const [avatar, setAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({})
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<'profile' | 'email' | 'password' | null>(null)

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user])

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    },
    [avatarPreview],
  )

  const selectAvatar = (file?: File) => {
    if (!file) return
    const errors: Record<string, string> = {}
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
      errors.avatar = 'Use uma imagem PNG, JPG ou WEBP.'
    if (file.size > 5 * 1024 * 1024) errors.avatar = 'A imagem deve ter no máximo 5 MB.'
    setProfileErrors(errors)
    if (Object.keys(errors).length) return
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatar(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    if (!name.trim()) {
      setProfileErrors({ name: 'Informe seu nome.' })
      return
    }
    setSaving('profile')
    try {
      const data = new FormData()
      data.append('name', name.trim())
      if (avatar) data.append('avatar', avatar)
      const updated = await pb.collection<UserRecord>('users').update(user.id, data)
      syncUser(updated)
      setAvatar(null)
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      })
    } catch (error) {
      setProfileErrors({ ...getPortugueseFieldErrors(error), form: getPortugueseError(error) })
    } finally {
      setSaving(null)
    }
  }

  const changeEmail = async (event: FormEvent) => {
    event.preventDefault()
    const next: Record<string, string> = {}
    if (!email.trim()) next.email = 'Informe o novo e-mail.'
    if (email.trim() === user?.email) next.email = 'Informe um e-mail diferente do atual.'
    setEmailErrors(next)
    if (Object.keys(next).length) return
    setSaving('email')
    try {
      await requestEmailChange(email)
      logout()
      navigate('/login', { replace: true })
      toast({
        title: 'Confira o novo e-mail',
        description:
          'Enviamos um link para confirmar a alteração. Sua sessão foi encerrada por segurança.',
      })
    } catch (error) {
      setEmailErrors({ ...getPortugueseFieldErrors(error), form: getPortugueseError(error) })
    } finally {
      setSaving(null)
    }
  }

  const changePassword = async (event: FormEvent) => {
    event.preventDefault()
    if (!user) return
    const next: Record<string, string> = {}
    if (!currentPassword) next.oldPassword = 'Informe sua senha atual.'
    if (newPassword.length < 8) next.password = 'A nova senha deve ter pelo menos 8 caracteres.'
    if (newPassword !== confirmPassword) next.passwordConfirm = 'As senhas não coincidem.'
    setPasswordErrors(next)
    if (Object.keys(next).length) return
    setSaving('password')
    try {
      const updated = await pb
        .collection<UserRecord>('users')
        .update(user.id, {
          oldPassword: currentPassword,
          password: newPassword,
          passwordConfirm: confirmPassword,
        })
      syncUser(updated)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast({
        title: 'Senha atualizada',
        description: 'Sua conta está protegida com a nova senha.',
      })
    } catch (error) {
      setPasswordErrors({ ...getPortugueseFieldErrors(error), form: getPortugueseError(error) })
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="mx-auto max-w-[1300px] space-y-7">
      <PageIntro
        eyebrow="Sua conta"
        title="Configurações"
        description="Mantenha seus dados de acesso atualizados e conheça os pilares da nossa marca."
      />
      <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-6">
          <form
            onSubmit={saveProfile}
            className="rounded-2xl bg-white p-5 shadow-[0_4px_18px_rgba(31,56,100,.07)] sm:p-7"
          >
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF0DF] text-[#6E9B1F]">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#1F3864]">Perfil</h2>
                <p className="text-xs font-medium text-[#718096]">
                  Nome e imagem exibidos no backoffice
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
              <div className="relative shrink-0">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Prévia do avatar"
                    className="h-24 w-24 rounded-3xl object-cover shadow-md"
                  />
                ) : (
                  <UserAvatar user={user} className="h-24 w-24 rounded-3xl border-4" />
                )}
                <button
                  type="button"
                  onClick={() => avatarInput.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#6E9B1F] text-white shadow-lg transition hover:scale-105"
                  aria-label="Alterar avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={avatarInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(event) => selectAvatar(event.target.files?.[0])}
                />
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1F3864]">Sua foto de perfil</p>
                <p className="mt-1 text-sm font-medium text-[#718096]">
                  PNG, JPG ou WEBP, com até 5 MB.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => avatarInput.current?.click()}
                  className="mt-3 rounded-xl border-[#D9D9D9] font-bold text-[#1F3864]"
                >
                  <UploadCloud className="mr-2 h-4 w-4" />
                  Escolher imagem
                </Button>
                {profileErrors.avatar ? (
                  <p className="mt-2 text-xs font-semibold text-[#C0392B]">
                    {profileErrors.avatar}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <Label htmlFor="profile-name" className="font-bold text-[#1F3864]">
                Nome
              </Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-12 rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
              />
              {profileErrors.name ? (
                <p className="text-xs font-semibold text-[#C0392B]">{profileErrors.name}</p>
              ) : null}
            </div>
            {profileErrors.form ? (
              <p className="mt-3 rounded-xl bg-[#C0392B]/10 p-3 text-sm font-semibold text-[#C0392B]">
                {profileErrors.form}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end">
              <Button
                disabled={saving === 'profile'}
                className="h-11 rounded-xl bg-[#6E9B1F] px-6 font-bold text-white hover:bg-[#5C8619]"
              >
                {saving === 'profile' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar perfil
              </Button>
            </div>
          </form>

          <form
            onSubmit={changeEmail}
            className="rounded-2xl bg-white p-5 shadow-[0_4px_18px_rgba(31,56,100,.07)] sm:p-7"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E9EEF4] text-[#44546A]">
                <Mail className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#1F3864]">Alterar e-mail</h2>
                <p className="text-xs font-medium text-[#718096]">
                  Você receberá um link de confirmação no novo endereço
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email" className="font-bold text-[#1F3864]">
                Novo e-mail
              </Label>
              <Input
                id="new-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-xl border-[#D9D9D9] font-medium focus-visible:ring-[#6E9B1F]"
              />
              {emailErrors.email ? (
                <p className="text-xs font-semibold text-[#C0392B]">{emailErrors.email}</p>
              ) : null}
            </div>
            {emailErrors.form ? (
              <p className="mt-3 rounded-xl bg-[#C0392B]/10 p-3 text-sm font-semibold text-[#C0392B]">
                {emailErrors.form}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end">
              <Button
                disabled={saving === 'email'}
                variant="outline"
                className="h-11 rounded-xl border-[#1F3864] px-6 font-bold text-[#1F3864] hover:bg-[#1F3864] hover:text-white"
              >
                {saving === 'email' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enviar confirmação
              </Button>
            </div>
          </form>

          <form
            onSubmit={changePassword}
            className="rounded-2xl bg-white p-5 shadow-[0_4px_18px_rgba(31,56,100,.07)] sm:p-7"
          >
            <div className="mb-5 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1F3864]/10 text-[#1F3864]">
                <KeyRound className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-[#1F3864]">Alterar senha</h2>
                <p className="text-xs font-medium text-[#718096]">Use pelo menos 8 caracteres</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="font-bold text-[#1F3864]">
                  Senha atual
                </Label>
                <PasswordInput
                  id="current-password"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  placeholder="Sua senha atual"
                />
                {passwordErrors.oldPassword ? (
                  <p className="text-xs font-semibold text-[#C0392B]">
                    {passwordErrors.oldPassword}
                  </p>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="font-bold text-[#1F3864]">
                    Nova senha
                  </Label>
                  <PasswordInput
                    id="new-password"
                    value={newPassword}
                    onChange={setNewPassword}
                    placeholder="Mínimo de 8 caracteres"
                  />
                  {passwordErrors.password ? (
                    <p className="text-xs font-semibold text-[#C0392B]">
                      {passwordErrors.password}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="font-bold text-[#1F3864]">
                    Confirmar senha
                  </Label>
                  <PasswordInput
                    id="confirm-password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    placeholder="Repita a nova senha"
                  />
                  {passwordErrors.passwordConfirm ? (
                    <p className="text-xs font-semibold text-[#C0392B]">
                      {passwordErrors.passwordConfirm}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
            {passwordErrors.form ? (
              <p className="mt-3 rounded-xl bg-[#C0392B]/10 p-3 text-sm font-semibold text-[#C0392B]">
                {passwordErrors.form}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end">
              <Button
                disabled={saving === 'password'}
                className="h-11 rounded-xl bg-[#1F3864] px-6 font-bold text-white hover:bg-[#172E43]"
              >
                {saving === 'password' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Atualizar senha
              </Button>
            </div>
          </form>
        </div>

        <aside className="h-fit overflow-hidden rounded-3xl bg-gradient-to-br from-[#1F3864] via-[#203D51] to-[#1E3A12] p-6 text-white shadow-[0_14px_38px_rgba(31,56,100,.18)] sm:p-8 xl:sticky xl:top-24">
          <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/10 text-[#A8D052]">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-[#A8D052]">
            Nossa essência
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Desenvolver pessoas para transformar resultados.
          </h2>
          <div className="mt-7 space-y-5">
            <div>
              <p className="text-sm font-bold text-[#A8D052]">Missão</p>
              <p className="mt-1 text-sm font-medium leading-6 text-white/70">
                Promover desenvolvimento humano com clareza, acolhimento e aplicação prática.
              </p>
            </div>
            <div>
              <p className="text-sm font-bold text-[#A8D052]">Visão</p>
              <p className="mt-1 text-sm font-medium leading-6 text-white/70">
                Ser referência em comportamento estratégico, liderança e vendas em Natal e no
                Brasil.
              </p>
            </div>
          </div>
          <div className="my-7 h-px bg-white/10" />
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#A8D052]" />
            <h3 className="font-bold">Nossos valores</h3>
          </div>
          <ul className="mt-4 space-y-3">
            {values.map((value) => (
              <li
                key={value}
                className="flex items-center gap-3 text-sm font-semibold text-white/80"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#A8D052]" />
                {value}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  )
}
