import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { RecordAuthResponse } from 'pocketbase'

import pb from '@/lib/pocketbase/client'
import { loginWithPassword } from '@/services/auth'
import type { UserRecord } from '@/types/backoffice'

interface AuthContextValue {
  user: UserRecord | null
  loading: boolean
  login: (email: string, password: string) => Promise<RecordAuthResponse<UserRecord>>
  logout: () => void
  syncUser: (user: UserRecord) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(
    () => (pb.authStore.record as UserRecord | null) ?? null,
  )
  const [loading, setLoading] = useState(Boolean(pb.authStore.token))

  useEffect(() => {
    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser((record as UserRecord | null) ?? null)
    }, true)

    if (!pb.authStore.token) {
      setLoading(false)
    } else {
      pb.collection<UserRecord>('users')
        .authRefresh()
        .catch(() => pb.authStore.clear())
        .finally(() => setLoading(false))
    }

    return unsubscribe
  }, [])

  const login = useCallback(
    (email: string, password: string) => loginWithPassword(email, password),
    [],
  )
  const logout = useCallback(() => pb.authStore.clear(), [])
  const syncUser = useCallback((record: UserRecord) => {
    pb.authStore.save(pb.authStore.token, record)
    setUser(record)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, logout, syncUser }),
    [user, loading, login, logout, syncUser],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return context
}
