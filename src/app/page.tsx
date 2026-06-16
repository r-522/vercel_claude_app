import { ChatInterface } from '@/components/chat/ChatInterface'
import { APP_NAME } from '@/lib/constants'

// Proxy guarantees this page is only reachable by authenticated users
export default function HomePage() {
  return (
    <main className="h-full">
      <ChatInterface appName={APP_NAME} />
    </main>
  )
}
