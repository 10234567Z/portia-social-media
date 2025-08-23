'use client'

import { useState, useEffect, useRef } from 'react'

interface TypewriterProps {
  text: string
  speed?: number
  onComplete?: () => void
  className?: string
}

export function Typewriter({ text, speed = 30, onComplete, className = '' }: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTyping, setIsTyping] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (text && text !== displayedText) {
      setDisplayedText('')
      setCurrentIndex(0)
      setIsTyping(true)
    }
  }, [text])

  useEffect(() => {
    if (isTyping && currentIndex < text.length) {
      intervalRef.current = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => {
        if (intervalRef.current) {
          clearTimeout(intervalRef.current)
        }
      }
    } else if (currentIndex >= text.length && isTyping) {
      setIsTyping(false)
      onComplete?.()
    }
  }, [currentIndex, text, speed, isTyping, onComplete])

  return (
    <div className={`relative ${className}`}>
      {displayedText}
      {isTyping && (
        <span className="animate-pulse text-blue-500 font-bold">|</span>
      )}
    </div>
  )
}

interface AnimatedOutputProps {
  title: string
  content: string
  isVisible: boolean
  delay?: number
  onComplete?: () => void
  icon?: React.ReactNode
}

export function AnimatedOutput({ 
  title, 
  content, 
  isVisible, 
  delay = 0, 
  onComplete,
  icon
}: AnimatedOutputProps) {
  const [shouldStart, setShouldStart] = useState(false)
  const [titleComplete, setTitleComplete] = useState(false)

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        setShouldStart(true)
      }, delay)

      return () => clearTimeout(timer)
    } else {
      setShouldStart(false)
      setTitleComplete(false)
    }
  }, [isVisible, delay])

  return (
    <div className={`
      transform transition-all duration-500 
      ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
    `}>
      <div className="flex items-center gap-2 mb-3">
        {icon && <span className="text-blue-600">{icon}</span>}
        {shouldStart && (
          <Typewriter
            text={title}
            speed={20}
            onComplete={() => setTitleComplete(true)}
            className="font-semibold text-lg text-gray-800"
          />
        )}
      </div>
      
      {titleComplete && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <Typewriter
            text={content}
            speed={15}
            onComplete={onComplete}
            className="text-gray-700 whitespace-pre-wrap leading-relaxed"
          />
        </div>
      )}
    </div>
  )
}
