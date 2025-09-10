'use client'

import { Suspense } from 'react'

import { SignInCardFooter } from '@/components/sign-in/sign-in-card-footer'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'

export function LoginCard({ authCode }: { authCode?: string | null }) {
  return (
    <main className="container mx-auto flex flex-col items-center relative z-10">
      <div className="w-full sm:w-1/2 md:w-1/3">
        <Suspense>
          <Card>
            <CardHeader>
              <CardTitle className="mb-2">
                {authCode ? 'Login' : 'Login'}
              </CardTitle>
              <CardDescription>
                {authCode
                  ? 'Continue to sign in to the andji CLI.'
                  : 'Increased rate limits, priority support, and more!'}
              </CardDescription>
            </CardHeader>
            <SignInCardFooter />
          </Card>
        </Suspense>
      </div>
    </main>
  )
}
