'use client'

import { useState, useEffect } from 'react'
import { Activity, Cpu, HardDrive, Zap, TrendingUp, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

interface AnalyticsData {
  performance_metrics: {
    total_generations: number
    average_time: number
    fastest_time: number
    slowest_time: number
    success_rate: number
    errors: number
  }
  system_info: {
    cpu_count: number
    memory_total: number
    python_version: string
  }
  real_time: {
    cpu_usage: number
    memory_usage: number
    active_generations: number
    queue_size: number
  }
}

export function PerformanceAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/analytics')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnalytics()
    const interval = setInterval(fetchAnalytics, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="w-5 h-5" />
          <span>Unable to load performance metrics</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-6 h-6 text-blue-600" />
        <h2 className="text-xl font-bold text-gray-800">
          Real-Time Performance Analytics
        </h2>
        <div className="flex items-center gap-1 text-green-600 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Generated</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {analytics.performance_metrics.total_generations}
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">Avg Time</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {analytics.performance_metrics.average_time.toFixed(1)}s
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {analytics.performance_metrics.success_rate.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">System Resources</h3>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {analytics.real_time.cpu_usage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.real_time.cpu_usage}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {analytics.real_time.memory_usage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${analytics.real_time.memory_usage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-3">System Info</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">CPU Cores:</span>
              <span className="font-medium">{analytics.system_info.cpu_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Memory:</span>
              <span className="font-medium">{analytics.system_info.memory_total}GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Python Version:</span>
              <span className="font-medium">{analytics.system_info.python_version}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Jobs:</span>
              <span className="font-medium text-blue-600">
                {analytics.real_time.active_generations}
              </span>
            </div>
          </div>
        </div>
      </div>

      {analytics.performance_metrics.total_generations > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-600">Fastest Generation</div>
              <div className="font-bold text-green-600">
                {analytics.performance_metrics.fastest_time.toFixed(2)}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Slowest Generation</div>
              <div className="font-bold text-orange-600">
                {analytics.performance_metrics.slowest_time.toFixed(2)}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-600">Total Errors</div>
              <div className="font-bold text-red-600">
                {analytics.performance_metrics.errors}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
