import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'claude-haiku-app',
  description: 'Knowledge base and research platform',
  robots: {
    index: false,
    follow: false,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* Synchronous theme initialization to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()
            `.trim(),
          }}
        />
      </head>
      <body className="h-full">{children}</body>
    </html>
  )
}
