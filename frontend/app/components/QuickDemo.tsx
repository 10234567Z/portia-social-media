'use client'

import { useState } from 'react'
import { Sparkles, User, Code, Coffee, Briefcase, Heart, Lightbulb } from 'lucide-react'

interface DemoPrompt {
  title: string
  prompt: string
  icon: React.ReactNode
  category: string
  color: string
}

const demoPrompts: DemoPrompt[] = [
  {
    title: "Tech Startup Founder",
    prompt: "I'm a 25-year-old tech entrepreneur who just launched an AI-powered productivity app. I want to introduce myself and my company on LinkedIn to attract investors and potential customers.",
    icon: <Code className="w-5 h-5" />,
    category: "Business",
    color: "blue"
  },
  {
    title: "Fitness Influencer",
    prompt: "I'm a certified personal trainer who specializes in home workouts without equipment. I want to create content that motivates people to start their fitness journey and promotes my online coaching.",
    icon: <Heart className="w-5 h-5" />,
    category: "Lifestyle",
    color: "red"
  },
  {
    title: "UI/UX Designer",
    prompt: "I'm a UI/UX designer with 3 years of experience, passionate about creating accessible and beautiful digital experiences. I want to showcase my work and connect with other designers.",
    icon: <User className="w-5 h-5" />,
    category: "Creative",
    color: "purple"
  },
  {
    title: "Coffee Shop Owner",
    prompt: "I just opened a specialty coffee shop in downtown that focuses on ethically sourced beans and latte art. I want to attract local customers and coffee enthusiasts to visit.",
    icon: <Coffee className="w-5 h-5" />,
    category: "Local Business",
    color: "orange"
  },
  {
    title: "Career Coach",
    prompt: "I'm a career transition specialist who helps people switch industries and find their dream jobs. I want to share success stories and offer valuable career advice.",
    icon: <Briefcase className="w-5 h-5" />,
    category: "Professional",
    color: "green"
  },
  {
    title: "Innovation Speaker",
    prompt: "I'm a keynote speaker who talks about emerging technologies and their impact on business. I want to promote my upcoming TED talk and share insights about the future of work.",
    icon: <Lightbulb className="w-5 h-5" />,
    category: "Speaking",
    color: "yellow"
  }
]

interface QuickDemoProps {
  onSelectPrompt: (prompt: string) => void
  disabled?: boolean
}

export function QuickDemo({ onSelectPrompt, disabled = false }: QuickDemoProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)

  const handlePromptClick = (prompt: string) => {
    setSelectedPrompt(prompt)
    onSelectPrompt(prompt)
  }

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800",
      red: "border-red-200 bg-red-50 hover:bg-red-100 text-red-800",
      purple: "border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-800",
      orange: "border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-800",
      green: "border-green-200 bg-green-50 hover:bg-green-100 text-green-800",
      yellow: "border-yellow-200 bg-yellow-50 hover:bg-yellow-100 text-yellow-800"
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-4">
        <Sparkles className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-gray-800">
          Quick Demo Examples
        </h2>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Click to try instantly
        </span>
      </div>
      
      <p className="text-gray-600 mb-6">
        Get started instantly with these proven content ideas. Each example generates a complete social media post, 
        YouTube script, and content analysis in under 30 seconds.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {demoPrompts.map((demo, index) => (
          <button
            key={index}
            onClick={() => handlePromptClick(demo.prompt)}
            disabled={disabled}
            className={`
              text-left p-4 rounded-lg border-2 transition-all duration-200
              ${getColorClasses(demo.color)}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer transform hover:scale-105'}
              ${selectedPrompt === demo.prompt ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}
            `}
          >
            <div className="flex items-center gap-3 mb-3">
              {demo.icon}
              <div>
                <h3 className="font-semibold">{demo.title}</h3>
                <span className="text-xs opacity-75">{demo.category}</span>
              </div>
            </div>
            <p className="text-sm leading-relaxed">
              {demo.prompt.length > 120 
                ? `${demo.prompt.substring(0, 120)}...` 
                : demo.prompt}
            </p>
            <div className="mt-3 text-xs font-medium opacity-75">
              Click to generate →
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-blue-800">Pro Tip</span>
        </div>
        <p className="text-sm text-blue-700">
          These examples showcase different industries and content styles. Notice how each generates 
          unique social media posts, video scripts, and detailed analysis with improvement suggestions.
        </p>
      </div>
    </div>
  )
}
