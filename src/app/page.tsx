import { ChatInterface } from '@/components/chat/ChatInterface'
import { DISPLAY_NAME } from '@/lib/constants'

// Middleware guarantees this page is only reachable by authenticated users
export default function HomePage() {
  return (
    <main className="h-full">
      <ChatInterface displayName={DISPLAY_NAME} />
    </main>
  )
}
