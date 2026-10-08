import { useEffect, useState } from 'react'

import { ApiError } from '@/shared/api/apiError'
import { toUserMessage } from '@/shared/api/errorMessage'

import { getInfoPosts, getStudyPosts } from '../api/communityApi'
import type { InfoPost, StudyPost } from '../types/community'

export type PostsState<T> = { status: 'loading' } | { status: 'error'; error: string } | { status: 'ready'; posts: T[] }

function usePosts<T>(fetcher: () => Promise<T[]>): PostsState<T> {
  const [state, setState] = useState<PostsState<T>>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetcher()
      .then((posts) => {
        if (!cancelled) setState({ status: 'ready', posts })
      })
      .catch((cause: unknown) => {
        if (cancelled) return
        const code = cause instanceof ApiError ? cause.code : 'UNKNOWN'
        console.error('커뮤니티 목록 조회 실패 code=%s', code)
        setState({ status: 'error', error: toUserMessage(code) })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}

/** 정보공유 · 스터디모집 두 탭의 목록을 한 번씩만 불러옵니다. 탭을 오갈 때 다시 안 부릅니다. */
export function useCommunityPosts() {
  const info = usePosts<InfoPost>(getInfoPosts)
  const study = usePosts<StudyPost>(getStudyPosts)
  return { info, study }
}
