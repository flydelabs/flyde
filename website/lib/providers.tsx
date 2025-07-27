'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Disable PostHog in development
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      defaults: '2025-05-24',
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}