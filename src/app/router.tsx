import { createBrowserRouter } from 'react-router-dom'

import KakaoCallbackPage from '@/domain/auth/components/KakaoCallbackPage'
import LoginPage from '@/domain/auth/components/LoginPage'
import DeviceCheckPage from '@/domain/interview/components/DeviceCheckPage'
import InterviewPage from '@/domain/interview/components/InterviewPage'
import InterviewSessionPreview from '@/domain/interview/components/InterviewSessionPreview'
import LibraryDocumentsPage from '@/domain/document/components/LibraryDocumentsPage'
import HomePage from '@/domain/home/components/HomePage'
import SessionSetupPage from '@/domain/interview/components/SessionSetupPage'
import LandingPage from '@/domain/landing/components/LandingPage'
import AnalyzingPage from '@/domain/report/components/AnalyzingPage'
import ReportPage from '@/domain/report/components/ReportPage'
import AccountSettingsPage from '@/domain/user/components/AccountSettingsPage'
import MyPage from '@/domain/user/components/MyPage'
import WithdrawPage from '@/domain/user/components/WithdrawPage'

import AppLayout, { type AppLayoutHandle } from './layout/AppLayout'
import NotFoundPage from './NotFoundPage'
import RedirectIfSignedIn from './RedirectIfSignedIn'
import RequireAuth from './RequireAuth'
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
  // 랜딩은 로그인 여부와 관계없이 처음 들어오면 늘 보여줍니다. 서비스 첫 화면입니다.
  { path: ROUTES.LANDING, element: <LandingPage /> },
  {
    // 이미 로그인한 사람이 로그인 화면에 오면 홈으로 보냅니다. 랜딩의 "로그인" · "무료로 시작하기" 를
    // 눌러도 로그인 화면을 거치지 않고 홈으로 갑니다.
    path: ROUTES.LOGIN,
    element: (
      <RedirectIfSignedIn>
        <LoginPage />
      </RedirectIfSignedIn>
    ),
  },
  { path: ROUTES.KAKAO_CALLBACK, element: <KakaoCallbackPage /> },
  {
    // AUTH-4 보호 라우트 가드. refresh token 이 없으면 로그인 화면으로 보냅니다
    // (RequireAuth 주석 참고). 로그인 전 화면(랜딩 · 로그인 · 카카오 콜백)과
    // 404 는 이 가드 밖에 둡니다.
    element: <RequireAuth />,
    children: [
      { path: ROUTES.DEVICE_CHECK, element: <DeviceCheckPage /> },
      { path: ROUTES.INTERVIEW, element: <InterviewPage /> },
      // B-01 확인용 프리뷰. 프로덕션 번들에는 포함하지 않는다 (PR #31 리뷰).
      ...(import.meta.env.DEV
        ? [{ path: ROUTES.DEV_INTERVIEW_PREVIEW, element: <InterviewSessionPreview /> }]
        : []),
      { path: ROUTES.ANALYZING, element: <AnalyzingPage /> },
      { path: ROUTES.REPORT, element: <ReportPage /> },
      {
        element: <AppLayout />,
        children: [
          {
            path: ROUTES.HOME,
            element: <HomePage />,
            // 시안처럼 화면 전체에 워시 배경을 깔아야 해서 본문 여백을 화면이 직접 정합니다.
            handle: { fullBleed: true } satisfies AppLayoutHandle,
          },
          { path: ROUTES.SESSION_SETUP, element: <SessionSetupPage /> },
          { path: ROUTES.LIBRARY_DOCUMENTS, element: <LibraryDocumentsPage /> },
          { path: ROUTES.MYPAGE, element: <MyPage /> },
          { path: ROUTES.MYPAGE_ACCOUNT, element: <AccountSettingsPage /> },
          { path: ROUTES.MYPAGE_WITHDRAW, element: <WithdrawPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
