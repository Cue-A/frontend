import { IconHeart, IconMessageCircle } from '@tabler/icons-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Badge from '@/shared/ui/Badge'
import Button from '@/shared/ui/Button'
import Card from '@/shared/ui/Card'

import { useCommunityPosts } from '../hooks/useCommunityPosts'
import type { CommunityTab, InfoPost, StudyPost } from '../types/community'

const TAB_CLASS = 'border-b-2 px-1 pb-3 text-body-md font-semibold transition-colors'
const TAB_ON = 'border-primary-500 text-neutral-900'
const TAB_OFF = 'border-transparent text-neutral-400 hover:text-neutral-700'

const ROW_CLASS = 'flex items-center justify-between gap-4 p-5'

function StudyRow({ post }: { post: StudyPost }) {
  return (
    <div className={ROW_CLASS}>
      <div>
        <p className="text-body-md font-semibold text-neutral-900">{post.title}</p>
        <p className="text-body-sm text-neutral-500">
          모집인원 {post.currentCount}/{post.capacity}명 · 마감 {post.deadlineLabel}
        </p>
      </div>
      <Badge tone={post.status === 'RECRUITING' ? 'success' : 'neutral'}>
        {post.status === 'RECRUITING' ? '모집중' : '마감'}
      </Badge>
    </div>
  )
}

function InfoRow({ post }: { post: InfoPost }) {
  return (
    <div className={ROW_CLASS}>
      <div>
        <p className="text-body-md font-semibold text-neutral-900">{post.title}</p>
        <p className="text-body-sm text-neutral-500">
          {post.author} · {post.postedAtLabel}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3 text-body-sm text-neutral-500">
        <span className="flex items-center gap-1">
          <IconMessageCircle size={16} stroke={2} aria-hidden />
          {post.commentCount}
        </span>
        <span className="flex items-center gap-1">
          <IconHeart size={16} stroke={2} aria-hidden />
          {post.likeCount}
        </span>
      </div>
    </div>
  )
}

/**
 * 커뮤니티 (B-04 시안). 정보공유 · 스터디모집 두 탭입니다.
 *
 * API 명세서에 이 도메인이 아예 없어서(기능명세서에도 없음) 전부 목업입니다. "글쓰기" 는 작성
 * 화면 시안이 없어 다른 화면의 "준비 중" 규칙대로 비활성 버튼으로 둡니다 (이슈 #32).
 *
 * 로그인 화면의 탭 분기와 같은 방식으로 `?tab=study` 쿼리를 읽어 초기 탭을 정합니다.
 */
export default function CommunityPage() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState<CommunityTab>(searchParams.get('tab') === 'study' ? 'study' : 'info')
  const { info, study } = useCommunityPosts()

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-h1 text-neutral-900">커뮤니티</h1>
        <Button variant="primary" disabled title="글쓰기 화면은 준비 중이에요">
          글쓰기
        </Button>
      </header>

      <div className="flex gap-6 border-b border-neutral-200">
        <button type="button" onClick={() => setTab('info')} className={`${TAB_CLASS} ${tab === 'info' ? TAB_ON : TAB_OFF}`}>
          정보공유
        </button>
        <button type="button" onClick={() => setTab('study')} className={`${TAB_CLASS} ${tab === 'study' ? TAB_ON : TAB_OFF}`}>
          스터디모집
        </button>
      </div>

      <Card padding="none" label={tab === 'info' ? '정보공유' : '스터디모집'} className="divide-y divide-neutral-200">
        {tab === 'info' && info.status === 'loading' && <p className="p-5 text-body-md text-neutral-500">불러오는 중…</p>}
        {tab === 'info' && info.status === 'error' && (
          <p role="alert" className="p-5 text-body-md text-neutral-500">
            {info.error}
          </p>
        )}
        {tab === 'info' && info.status === 'ready' && info.posts.map((post) => <InfoRow key={post.postId} post={post} />)}

        {tab === 'study' && study.status === 'loading' && <p className="p-5 text-body-md text-neutral-500">불러오는 중…</p>}
        {tab === 'study' && study.status === 'error' && (
          <p role="alert" className="p-5 text-body-md text-neutral-500">
            {study.error}
          </p>
        )}
        {tab === 'study' && study.status === 'ready' && study.posts.map((post) => <StudyRow key={post.postId} post={post} />)}
      </Card>
    </div>
  )
}
