import { useCallback, useEffect, useState } from 'react'
import {
  Bell,
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  CreditCard,
  ExternalLink,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/contexts/AuthContext'
import {
  listUserNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/services/notifications'
import type { AppNotification } from '@/types/backoffice'
import { cn } from '@/lib/utils'

function getNotificationIcon(type: string) {
  switch (type) {
    case 'aula':
      return <BookOpen className="h-4 w-4 text-[#6E9B1F]" />
    case 'clube':
      return <MessageSquare className="h-4 w-4 text-[#3498DB]" />
    case 'mentoria':
      return <Calendar className="h-4 w-4 text-[#E67E22]" />
    case 'matricula':
      return <CreditCard className="h-4 w-4 text-[#9B59B6]" />
    default:
      return <Sparkles className="h-4 w-4 text-[#6E9B1F]" />
  }
}

export function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user?.id) return
    try {
      const items = await listUserNotifications(user.id)
      setNotifications(items)
    } catch {
      // silently fallback
    }
  }, [user?.id])

  useEffect(() => {
    void load()
    // Poll a cada 30 segundos
    const timer = setInterval(() => void load(), 30000)
    return () => clearInterval(timer)
  }, [load])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      await markAllNotificationsAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } finally {
      setLoading(false)
    }
  }

  const handleClickItem = async (item: AppNotification) => {
    if (!item.read) {
      void markNotificationAsRead(item.id)
      setNotifications((prev) => prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)))
    }
    if (item.link) {
      setOpen(false)
      navigate(item.link)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#1F3864]/10 bg-white/90 text-[#1F3864] transition hover:bg-[#F4F5F3] dark:border-white/10 dark:bg-[#1A334C] dark:text-white dark:hover:bg-[#203D5B]"
          aria-label="Notificações"
          title="Notificações"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E74C3C] px-1 text-[10px] font-bold text-white shadow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 rounded-2xl border border-[#EDF0EA] bg-white p-2 font-quicksand shadow-2xl dark:border-white/10 dark:bg-[#152B40] dark:text-white sm:w-96"
      >
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1F3864] dark:text-white">Notificações</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-[#6E9B1F]/15 px-2 py-0.5 text-[11px] font-bold text-[#6E9B1F]">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={handleMarkAllRead}
              className="h-7 text-xs font-bold text-[#6E9B1F] hover:bg-[#6E9B1F]/10 dark:hover:bg-white/10"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Marcar todas
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="bg-[#EDF0EA] dark:bg-white/10" />

        <div className="max-h-80 overflow-y-auto divide-y divide-[#EDF0EA] dark:divide-white/5">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-[#718096] dark:text-white/60">
              Nenhuma notificação recente.
            </div>
          ) : (
            notifications.slice(0, 15).map((n) => (
              <div
                key={n.id}
                onClick={() => void handleClickItem(n)}
                className={cn(
                  'flex cursor-pointer items-start gap-3 p-3 transition hover:bg-[#F9FAF8] dark:hover:bg-white/5',
                  !n.read && 'bg-[#F4F7EF]/70 dark:bg-[#6E9B1F]/10',
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#F4F5F3] dark:bg-white/10">
                  {getNotificationIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-bold text-[#1F3864] dark:text-white">
                      {n.title}
                    </p>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-[#6E9B1F]" />}
                  </div>
                  <p className="mt-0.5 text-xs text-[#5A6B7E] dark:text-white/70 line-clamp-2">
                    {n.message}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-[#8C9BAE] dark:text-white/40">
                    {new Date(n.created).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
