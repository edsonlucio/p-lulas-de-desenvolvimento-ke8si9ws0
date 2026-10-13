import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/contexts/AuthContext'
import { listCourses, removeCourse, setCourseStatus } from '@/services/courses'
import { listLessons, removeLesson } from '@/services/lessons'
import { listUserEnrollments } from '@/services/enrollments'
import { getUserRole } from '@/lib/roles'
import type { Course, CourseStatus, Lesson } from '@/types/backoffice'

interface BackofficeContextValue {
  courses: Course[]
  lessons: Lesson[]
  loading: boolean
  userEnrollments: string[]
  pendingEnrollments: string[]
  isEnrolledInCourse: (courseId: string) => boolean
  canAccessCourseContent: (courseId: string) => boolean
  refreshCourses: () => Promise<void>
  refreshLessons: () => Promise<void>
  refreshEnrollments: () => Promise<void>
  refreshAll: () => Promise<void>
  updateCourseStatus: (course: Course, status: CourseStatus) => Promise<void>
  deleteCourse: (course: Course) => Promise<void>
  deleteLesson: (lesson: Lesson) => Promise<void>
  lessonCount: (courseId: string) => number
}

const BackofficeContext = createContext<BackofficeContextValue | null>(null)

export function BackofficeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [userEnrollments, setUserEnrollments] = useState<string[]>([])
  const [pendingEnrollments, setPendingEnrollments] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const role = getUserRole(user)
  const isPrivileged = role === 'adm' || role === 'coordenador' || role === 'professor'

  const refreshCourses = useCallback(async () => {
    if (!user) return
    setCourses(await listCourses())
  }, [user])

  const refreshLessons = useCallback(async () => {
    if (!user) return
    setLessons(await listLessons())
  }, [user])

  const refreshEnrollments = useCallback(async () => {
    if (!user?.id) {
      setUserEnrollments([])
      setPendingEnrollments([])
      return
    }
    try {
      const records = await listUserEnrollments(user.id)
      const activeCourseIds = records.filter((r) => r.status === 'ativo').map((r) => r.course)
      const pendingCourseIds = records.filter((r) => r.status === 'pendente').map((r) => r.course)
      setUserEnrollments(activeCourseIds)
      setPendingEnrollments(pendingCourseIds)
    } catch {
      setUserEnrollments([])
      setPendingEnrollments([])
    }
  }, [user?.id])

  const isEnrolledInCourse = useCallback(
    (courseId: string) => {
      return userEnrollments.includes(courseId)
    },
    [userEnrollments],
  )

  const canAccessCourseContent = useCallback(
    (courseId: string) => {
      if (isPrivileged) return true
      return userEnrollments.includes(courseId)
    },
    [isPrivileged, userEnrollments],
  )

  const refreshAll = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [courseRows, lessonRows, enrollRows] = await Promise.all([
        listCourses(),
        listLessons(),
        listUserEnrollments(user.id).catch(() => []),
      ])
      setCourses(courseRows)
      setLessons(lessonRows)
      const activeCourseIds = enrollRows.filter((r) => r.status === 'ativo').map((r) => r.course)
      const pendingCourseIds = enrollRows
        .filter((r) => r.status === 'pendente')
        .map((r) => r.course)
      setUserEnrollments(activeCourseIds)
      setPendingEnrollments(pendingCourseIds)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) void refreshAll()
    else {
      setCourses([])
      setLessons([])
      setUserEnrollments([])
      setPendingEnrollments([])
      setLoading(false)
    }
  }, [user, refreshAll])

  useRealtime<Course>('courses', () => void refreshCourses(), Boolean(user))
  useRealtime<Lesson>('lessons', () => void refreshLessons(), Boolean(user))

  const updateCourseStatus = useCallback(async (course: Course, status: CourseStatus) => {
    setCourses((current) =>
      current.map((item) => (item.id === course.id ? { ...item, status } : item)),
    )
    try {
      const updated = await setCourseStatus(course.id, status)
      setCourses((current) => current.map((item) => (item.id === course.id ? updated : item)))
    } catch (error) {
      setCourses((current) => current.map((item) => (item.id === course.id ? course : item)))
      throw error
    }
  }, [])

  const deleteCourse = useCallback(async (course: Course) => {
    await removeCourse(course.id)
    setCourses((current) => current.filter((item) => item.id !== course.id))
    setLessons((current) => current.filter((item) => item.course !== course.id))
  }, [])

  const deleteLesson = useCallback(async (lesson: Lesson) => {
    await removeLesson(lesson.id)
    setLessons((current) => current.filter((item) => item.id !== lesson.id))
  }, [])

  const lessonCount = useCallback(
    (courseId: string) => lessons.filter((lesson) => lesson.course === courseId).length,
    [lessons],
  )

  const value = useMemo(
    () => ({
      courses,
      lessons,
      loading,
      userEnrollments,
      pendingEnrollments,
      isEnrolledInCourse,
      canAccessCourseContent,
      refreshCourses,
      refreshLessons,
      refreshEnrollments,
      refreshAll,
      updateCourseStatus,
      deleteCourse,
      deleteLesson,
      lessonCount,
    }),
    [
      courses,
      lessons,
      loading,
      userEnrollments,
      pendingEnrollments,
      isEnrolledInCourse,
      canAccessCourseContent,
      refreshCourses,
      refreshLessons,
      refreshEnrollments,
      refreshAll,
      updateCourseStatus,
      deleteCourse,
      deleteLesson,
      lessonCount,
    ],
  )

  return <BackofficeContext.Provider value={value}>{children}</BackofficeContext.Provider>
}

export function useBackoffice() {
  const context = useContext(BackofficeContext)
  if (!context) throw new Error('useBackoffice deve ser usado dentro de BackofficeProvider')
  return context
}
