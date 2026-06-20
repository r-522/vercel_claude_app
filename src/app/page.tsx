'use client'

import { useState } from 'react'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { CodeInterface } from '@/components/code/CodeInterface'
import { TabNavigation } from '@/components/layout/TabNavigation'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat')

  return (
    <main className="h-full flex flex-col">
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 min-h-0">
        {activeTab === 'chat' ? <ChatInterface /> : <CodeInterface />}
      </div>
    </main>
  )
}
