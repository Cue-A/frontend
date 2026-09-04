import { createBrowserRouter } from 'react-router-dom'

import LoginPage from '@/domain/auth/components/LoginPage'
import DeviceCheckPage from '@/domain/interview/components/DeviceCheckPage'
import InterviewPage from '@/domain/interview/components/InterviewPage'
import SessionSetupPage from '@/domain/interview/components/SessionSetupPage'
import LandingPage from '@/domain/landing/components/LandingPage'
import AnalyzingPage from '@/domain/report/components/AnalyzingPage'
import ReportPage from '@/domain/report/components/ReportPage'

import AppLayout from './layout/AppLayout'
import NotFoundPage from './NotFoundPage'
import { ROUTES } from './routes'

/**
 * 랜딩과 로그인은 사이드바가 없어서 껍데기 밖에 둡니다.
 * 그 외 화면은 AppLayout 안에서 그립니다.
 */
export const router = createBrowserRouter([
  { path: ROUTES.LANDING, element: <LandingPage /> },
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: ROUTES.SESSION_SETUP, element: <SessionSetupPage /> },
      { path: ROUTES.DEVICE_CHECK, element: <DeviceCheckPage /> },
      { path: ROUTES.INTERVIEW, element: <InterviewPage /> },
      { path: ROUTES.ANALYZING, element: <AnalyzingPage /> },
      { path: ROUTES.REPORT, element: <ReportPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
