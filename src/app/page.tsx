import { ChatInterface } from '@/components/chat/ChatInterface'

// Proxy guarantees this page is only reachable by authenticated users
export default function HomePage() {
  return (
    <main className="h-full">
      <ChatInterface />
    </main>
  )
}
