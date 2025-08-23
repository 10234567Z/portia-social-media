'use client'

import { useState } from 'react'
import { ContentGenerator } from './components/ContentGenerator'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 text-black">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Content Utopia
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Generate. Analyze. Improve. Regenerate
          </p>
        </header>
        
        <ContentGenerator />
      </div>
    </div>
  )
}
