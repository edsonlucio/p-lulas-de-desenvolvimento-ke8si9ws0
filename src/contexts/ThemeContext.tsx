import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

function getStorageKey(userId?: string | null) {
  return userId ? `pilulas_theme_${userId}` : 'pilulas_theme'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const userSaved = userId
      ? (localStorage.getItem(`pilulas_theme_${userId}`) as Theme | null)
      : null
    const globalSaved = localStorage.getItem('pilulas_theme') as Theme | null
    const saved = userSaved || globalSaved
    if (saved === 'dark' || saved === 'light') return saved
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
    return 'light'
  })

  // Sincroniza se o usuário mudar (ex.: login de outro usuário ou logout)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = getStorageKey(userId)
    const saved = localStorage.getItem(key) as Theme | null
    if (saved === 'dark' || saved === 'light') {
      setThemeState(saved)
    }
  }, [userId])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    // Salva na chave global e na chave específica do usuário atual
    localStorage.setItem('pilulas_theme', theme)
    if (userId) {
      localStorage.setItem(getStorageKey(userId), theme)
    }
  }, [theme, userId])

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const setTheme = (t: Theme) => {
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
