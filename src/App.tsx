import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Layout from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/contexts/AuthContext'
import { BackofficeProvider } from '@/contexts/BackofficeContext'
import { CourseModalProvider } from '@/contexts/CourseModalContext'
import CourseDetail from '@/pages/CourseDetail'
import Courses from '@/pages/Courses'
import Dashboard from '@/pages/Dashboard'
import Duvidas from '@/pages/Duvidas'
import Mentorias from '@/pages/Mentorias'
import LessonDetail from '@/pages/LessonDetail'
import Lessons from '@/pages/Lessons'
import NotFound from '@/pages/NotFound'
import Settings from '@/pages/Settings'
import ConfirmEmailChange from '@/pages/auth/ConfirmEmailChange'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Login from '@/pages/auth/Login'
import ResetPassword from '@/pages/auth/ResetPassword'
import SignUp from '@/pages/auth/SignUp'
import VerifyEmail from '@/pages/auth/VerifyEmail'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <BackofficeProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<SignUp />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/verificar-email" element={<VerifyEmail />} />
            <Route path="/confirmar-mudanca-email" element={<ConfirmEmailChange />} />

            <Route element={<ProtectedRoute />}>
              <Route
                element={
                  <CourseModalProvider>
                    <Layout />
                  </CourseModalProvider>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="/cursos" element={<Courses />} />
                <Route path="/cursos/:id" element={<CourseDetail />} />
                <Route path="/aulas" element={<Lessons />} />
                <Route path="/aulas/:id" element={<LessonDetail />} />
                <Route path="/mentorias" element={<Mentorias />} />
                <Route path="/duvidas" element={<Duvidas />} />
                <Route path="/configuracoes" element={<Settings />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </BackofficeProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
