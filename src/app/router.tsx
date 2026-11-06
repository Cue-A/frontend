import { createBrowserRouter, Navigate } from 'react-router-dom'

import KakaoCallbackPage from '@/domain/auth/components/KakaoCallbackPage'
import LoginPage from '@/domain/auth/components/LoginPage'
import CompaniesPage from '@/domain/company/components/CompaniesPage'
import CompanyDetailPage from '@/domain/company/components/CompanyDetailPage'
import DeviceCheckPage from '@/domain/interview/components/DeviceCheckPage'
import InterviewPage from '@/domain/interview/components/InterviewPage'
import InterviewSessionPreview from '@/domain/interview/components/InterviewSessionPreview'
import LibraryDocumentsPage from '@/domain/document/components/LibraryDocumentsPage'
import GrowthPage from '@/domain/growth/components/GrowthPage'
import HomePage from '@/domain/home/components/HomePage'
import ReplaySetupPage from '@/domain/interview/components/ReplaySetupPage'
import SessionSetupPage from '@/domain/interview/components/SessionSetupPage'
import LandingPage from '@/domain/landing/components/LandingPage'
import PracticeRecordsPage from '@/domain/practice/components/PracticeRecordsPage'
import QuestionBankPage from '@/domain/question/components/QuestionBankPage'
import AnalyzingPage from '@/domain/report/components/AnalyzingPage'
import ReportPage from '@/domain/report/components/ReportPage'
import InterestsPage from '@/domain/user/components/InterestsPage'
import ProfilePage from '@/domain/user/components/ProfilePage'
import WithdrawPage from '@/domain/user/components/WithdrawPage'

import AppLayout, { type AppLayoutHandle } from './layout/AppLayout'
import NotFoundPage from './NotFoundPage'
import RedirectIfSignedIn from './RedirectIfSignedIn'
import RequireAuth from './RequireAuth'
import { MYPAGE_ACCOUNT_ID, MYPAGE_NOTIFICATIONS_ID, ROUTES, toMyPageProfile } from './routes'

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
          { path: ROUTES.REPLAY, element: <ReplaySetupPage /> },
          { path: ROUTES.LIBRARY_DOCUMENTS, element: <LibraryDocumentsPage /> },
          { path: ROUTES.LIBRARY_PRACTICE, element: <PracticeRecordsPage /> },
          { path: ROUTES.LIBRARY_QUESTIONS, element: <QuestionBankPage /> },
          { path: ROUTES.GROWTH, element: <GrowthPage /> },
          { path: ROUTES.COMPANIES, element: <CompaniesPage /> },
          { path: ROUTES.COMPANY, element: <CompanyDetailPage /> },
          // 마이페이지 메뉴 목록 · 계정 설정 · 알림 설정은 프로필 한 화면으로 합쳤습니다(이슈 #185). 옛 주소는 프로필의 그 칸으로 보냅니다
          { path: ROUTES.MYPAGE, element: <Navigate to={ROUTES.MYPAGE_PROFILE} replace /> },
          { path: ROUTES.MYPAGE_PROFILE, element: <ProfilePage /> },
          { path: ROUTES.MYPAGE_INTERESTS, element: <InterestsPage /> },
          {
            path: ROUTES.MYPAGE_NOTIFICATIONS,
            element: <Navigate to={toMyPageProfile(MYPAGE_NOTIFICATIONS_ID)} replace />,
          },
          { path: ROUTES.MYPAGE_ACCOUNT, element: <Navigate to={toMyPageProfile(MYPAGE_ACCOUNT_ID)} replace /> },
          { path: ROUTES.MYPAGE_WITHDRAW, element: <WithdrawPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
