import { env } from '@andji/internal'

export const siteConfig = {
  title: 'andji',
  description:
    'Code faster with AI using andji. Edit your codebase and run terminal commands via natural language instruction.',
  keywords: () => [
    'Manicode',
    'andji',
    'Coding Assistant',
    'Coding Assistant',
    'Agent',
    'AI',
    'Next.js',
    'React',
    'TypeScript',
  ],
  url: () => env.NEXT_PUBLIC_andji_APP_URL,
  googleSiteVerificationId: () =>
    env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID || '',
}
