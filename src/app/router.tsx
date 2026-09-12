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
 * 껍데기(사이드바·헤더) 밖에서 그리는 화면입니다.
 * 랜딩·로그인은 로그인 전 화면이고, 면접 진행·분석 중은 8/5 회의에서
 * "화면을 꽉 차게, 사이드바 제거"로 정해졌습니다.
 * 장치 테스트는 면접 진행 직전 흐름이라 이탈을 막고 웹캠·마이크 UI 를
 * 넓게 쓰기 위해 함께 밖에 둡니다. (PR #4 리뷰)
 * 리포트는 C-01 시안에 사이드바가 없고 자체 상단바를 씁니다.
 */
export const router = createBrowserRouter([
  { path: ROUTES.LANDING, element: <LandingPage /> },
  { path: ROUTES.LOGIN, element: <LoginPage /> },
  { path: ROUTES.DEVICE_CHECK, element: <DeviceCheckPage /> },
  { path: ROUTES.INTERVIEW, element: <InterviewPage /> },
  { path: ROUTES.ANALYZING, element: <AnalyzingPage /> },
  { path: ROUTES.REPORT, element: <ReportPage /> },
  {
    element: <AppLayout />,
    children: [{ path: ROUTES.SESSION_SETUP, element: <SessionSetupPage /> }],
  },
  { path: '*', element: <NotFoundPage /> },
])
