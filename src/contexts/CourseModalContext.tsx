import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import { CourseFormDialog } from '@/components/courses/CourseFormDialog'
import type { Course } from '@/types/backoffice'

interface CourseModalContextValue {
  openNewCourse: () => void
  openEditCourse: (course: Course) => void
}

const CourseModalContext = createContext<CourseModalContextValue | null>(null)

export function CourseModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [course, setCourse] = useState<Course | null>(null)

  const openNewCourse = useCallback(() => {
    setCourse(null)
    setOpen(true)
  }, [])

  const openEditCourse = useCallback((item: Course) => {
    setCourse(item)
    setOpen(true)
  }, [])

  const value = useMemo(() => ({ openNewCourse, openEditCourse }), [openNewCourse, openEditCourse])

  return (
    <CourseModalContext.Provider value={value}>
      {children}
      <CourseFormDialog open={open} onOpenChange={setOpen} course={course} />
    </CourseModalContext.Provider>
  )
}

export function useCourseModal() {
  const context = useContext(CourseModalContext)
  if (!context) throw new Error('useCourseModal deve ser usado dentro de CourseModalProvider')
  return context
}
