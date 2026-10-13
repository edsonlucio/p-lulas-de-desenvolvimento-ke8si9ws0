import { useEffect, useState } from 'react'
import {
  BookOpen,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  UsersRound,
  X,
  PlayCircle,
} from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

import { BrandLogo, BrandMark } from '@/components/BrandLogo'
import { RoleBadge } from '@/components/RoleBadge'
import { UserAvatar } from '@/components/UserAvatar'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { useCourseModal } from '@/contexts/CourseModalContext'
import { useToast } from '@/hooks/use-toast'
import { canManageCoursesAndLessons, getUserRole } from '@/lib/roles'
import { cn } from '@/lib/utils'

type NavItem = {
  label: string
  to: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const navigation: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard, end: true },
  { label: 'Cursos', to: '/cursos', icon: BookOpen },
  { label: 'Aulas', to: '/aulas', icon: PlayCircle },
  { label: 'Mentorias', to: '/mentorias', icon: UsersRound },
]
const adminNavigation: NavItem[] = [{ label: 'Dúvidas', to: '/duvidas', icon: HelpCircle }]
const settingsNavigation: NavItem[] = [
  { label: 'Configurações', to: '/configuracoes', icon: Settings },
]

function Sidebar({ mobile = false, close }: { mobile?: boolean; close?: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const role = getUserRole(user)
  const isAdmin = role === 'adm' || role === 'coordenador'

  const handleLogout = () => {
    logout()
    close?.()
    navigate('/login', { replace: true })
    toast({ title: 'Sessão encerrada', description: 'Até a próxima, sua jornada continua.' })
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col bg-[#172E43] text-white',
        mobile ? 'w-[286px]' : 'w-full',
      )}
    >
      <div className="relative flex h-[104px] items-center border-b border-white/10 px-6">
        <BrandLogo className="max-h-[72px] max-w-[205px] brightness-0 invert" />
        {mobile ? (
          <button
            onClick={close}
            className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <div className="px-5 pt-8">
        <p className="px-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
          Navegação
        </p>
        <nav className="mt-3 space-y-1.5">
          {[...navigation, ...(isAdmin ? adminNavigation : []), ...settingsNavigation].map(
            ({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={close}
                className={({ isActive }) =>
                  cn(
                    'group relative flex min-h-12 items-center gap-3 overflow-hidden rounded-xl px-3.5 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-[#6E9B1F] text-white shadow-[0_8px_20px_rgba(0,0,0,.16)]'
                      : 'text-white/65 hover:bg-white/8 hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white transition-transform duration-300',
                        isActive ? 'scale-y-100' : 'scale-y-0',
                      )}
                    />
                    <Icon className="h-[19px] w-[19px] shrink-0" />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ),
          )}
        </nav>
      </div>

      <div className="mx-5 mt-auto border-t border-white/10 py-5">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
          <UserAvatar user={user} className="h-9 w-9 shrink-0 border-white/10" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-bold">{user?.name || 'Usuário'}</p>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
              <RoleBadge user={user} size="sm" />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/55 transition hover:bg-white/10 hover:text-white"
            title="Sair"
            aria-label="Sair"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { user } = useAuth()
  const { openNewCourse } = useCourseModal()
  const location = useLocation()

  useEffect(() => setDrawerOpen(false), [location.pathname])

  return (
    <div className="min-h-screen bg-[#F4F5F3] font-quicksand text-[#1F3864]">
      <div className="fixed inset-y-0 left-0 z-40 hidden w-[248px] lg:block xl:w-[260px]">
        <Sidebar />
      </div>

      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!drawerOpen}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className={cn(
            'absolute inset-0 bg-[#102438]/60 backdrop-blur-[2px] transition-opacity duration-300',
            drawerOpen ? 'opacity-100' : 'opacity-0',
          )}
          aria-label="Fechar menu"
        />
        <div
          className={cn(
            'absolute inset-y-0 left-0 shadow-2xl transition-transform duration-300 ease-out',
            drawerOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar mobile close={() => setDrawerOpen(false)} />
        </div>
      </div>

      <div className="min-h-screen lg:pl-[248px] xl:pl-[260px]">
        <header className="fixed left-0 right-0 top-0 z-30 h-[72px] border-b border-[#1F3864]/[0.06] bg-white/95 shadow-[0_2px_14px_rgba(31,56,100,.05)] backdrop-blur-md lg:left-[248px] xl:left-[260px]">
          <div className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[#1F3864] hover:bg-[#F4F5F3] lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2.5">
                <BrandLogo className="h-9 w-auto max-w-[170px] sm:max-w-[200px]" />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              {canManageCoursesAndLessons(user) && (
                <Button
                  onClick={openNewCourse}
                  className="h-11 rounded-xl bg-[#6E9B1F] px-3 font-bold text-white shadow-[0_5px_14px_rgba(110,155,31,.22)] transition hover:scale-[1.02] hover:bg-[#5C8619] active:scale-[.98] sm:px-5"
                >
                  <Plus className="h-[18px] w-[18px] sm:mr-2" />
                  <span className="hidden sm:inline">Novo Curso</span>
                </Button>
              )}
              <div className="hidden sm:flex items-center gap-2 rounded-xl bg-[#F4F5F3] px-3 py-1.5 border border-[#1F3864]/[0.06]">
                <div className="text-right">
                  <p className="text-xs font-bold text-[#1F3864] leading-tight truncate max-w-[120px]">
                    {user?.name || 'Usuário'}
                  </p>
                  <RoleBadge user={user} size="sm" className="mt-0.5" />
                </div>
                <UserAvatar user={user} className="h-9 w-9" />
              </div>
              <div className="sm:hidden">
                <UserAvatar user={user} className="h-9 w-9" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex min-h-screen flex-col pt-[72px]">
          <main className="flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8 xl:px-10">
            <Outlet />
          </main>
          <footer className="border-t border-[#1F3864]/[0.07] bg-white/70 px-5 py-5 sm:px-8">
            <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 text-center text-xs font-medium text-[#718096] sm:flex-row sm:text-left">
              <p>
                <span className="font-bold text-[#1F3864]">Pílulas de Desenvolvimento</span> —
                Desenvolvimento humano e comportamento estratégico
              </p>
              <div className="flex items-center gap-4">
                <a
                  href="https://www.instagram.com/pilulasdedesenvolvimento"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold transition hover:text-[#6E9B1F]"
                >
                  Instagram <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://www.youtube.com/@pilulasdedesenvolvimento"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-bold transition hover:text-[#6E9B1F]"
                >
                  YouTube <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  )
}
