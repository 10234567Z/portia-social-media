'use client'

import { useState, useEffect } from 'react'
import { Send, Loader2, CheckCircle, AlertCircle, FileText, Video, Copy, Check, BarChart3 } from 'lucide-react'

interface GenerationOutput {
  post?: string
  script?: string
  analysis?: string
  timestamp?: string
  originalPrompt?: string
}

interface StatusResponse {
  plan_id: string
  status: string
  logs: string[]
  outputs: GenerationOutput
  error?: string
  plan?: string
}

export function ContentGenerator() {
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [planId, setPlanId] = useState<string | null>(null)
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [savedOutputs, setSavedOutputs] = useState<GenerationOutput[]>([])
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({}) // Track copy states

  // Load saved outputs from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('contentOutputs')
    if (saved) {
      try {
        setSavedOutputs(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading saved outputs:', error)
      }
    }
  }, [])

  // Function to extract post and script from logs
  const extractOutputsFromLogs = (logs: string[]): GenerationOutput => {
    const outputs: GenerationOutput = {}
    let stepOutputCount = 0

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i]
      
      if (log.includes("Step output -")) {
        stepOutputCount++
        
        // Extract content after "Step output - "
        const stepOutputStart = log.indexOf("Step output - ") + "Step output - ".length
        let content = log.substring(stepOutputStart)
        
        // Collect subsequent lines until we hit next "INFO"
        for (let j = i + 1; j < logs.length; j++) {
          if (logs[j].includes("INFO")) {
            break
          }
          content += "\n" + logs[j]
        }
        
        // Assign based on step count
        if (stepOutputCount === 1) {
          outputs.post = content.trim()
        } else if (stepOutputCount === 2) {
          outputs.script = content.trim()
        } else if (stepOutputCount === 3) {
          outputs.analysis = content.trim()
        }
      }
    }
    
    return outputs
  }  // Enhanced copy function with visual feedback
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [id]: true }))
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [id]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const generateContent = async () => {
    if (!content.trim()) return

    setIsGenerating(true)
    setLogs([])
    setStatus(null)

    try {
      // Start generation
      const response = await fetch('http://localhost:8000/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to start generation')
      }

      const result = await response.json()
      setPlanId(result.plan_id)

      // Start polling for status
      pollStatus(result.plan_id)
    } catch (error) {
      console.error('Error:', error)
      setIsGenerating(false)
    }
  }

  const pollStatus = async (planId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/status/${planId}`)
        if (!response.ok) {
          throw new Error('Failed to get status')
        }

        const statusData: StatusResponse = await response.json()
        setStatus(statusData)
        setLogs(statusData.logs)
        console.log(statusData.logs)

        if (statusData.status === 'completed' || statusData.status === 'error') {
          clearInterval(pollInterval)
          setIsGenerating(false)
          
          // Extract outputs from logs if completed successfully
          if (statusData.status === 'completed') {
            const extractedOutputs = extractOutputsFromLogs(statusData.logs)
            
            // Update the status with extracted outputs
            const updatedStatusData = {
              ...statusData,
              outputs: extractedOutputs
            }
            setStatus(updatedStatusData)
            
            // Save to localStorage if we have content
            if (extractedOutputs.post || extractedOutputs.script || extractedOutputs.analysis) {
              const newOutput = {
                ...extractedOutputs,
                timestamp: new Date().toISOString(),
                originalPrompt: content
              }
              
              const currentSaved = JSON.parse(localStorage.getItem('contentOutputs') || '[]')
              const updatedSaved = [newOutput, ...currentSaved].slice(0, 10) // Keep only last 10
              
              localStorage.setItem('contentOutputs', JSON.stringify(updatedSaved))
              setSavedOutputs(updatedSaved)
            }
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
        clearInterval(pollInterval)
        setIsGenerating(false)
      }
    }, 2000) // Poll every 2 seconds instead of 1 second since no streaming
  }

  const getStatusIcon = () => {
    if (!status) return <Loader2 className="w-5 h-5 animate-spin" />
    
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Loader2 className="w-5 h-5 animate-spin" />
    }
  }

  const getStatusText = () => {
    if (!status) return 'Initializing...'
    
    switch (status.status) {
      case 'planning':
        return 'Creating plan...'
      case 'executing':
        return 'Generating content...'
      case 'completed':
        return 'Content generated successfully!'
      case 'error':
        return 'Generation failed'
      default:
        return status.status
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          What would you like to create content about?
        </h2>
        
        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your content idea here... (e.g., 'I am a UI/UX designer about to make intro in the public world, give me a dope 100-200 words intro for me')"
            className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={isGenerating}
          />
          
          <button
            onClick={generateContent}
            disabled={isGenerating || !content.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      </div>

      {/* Status Section */}
      {isGenerating && (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            {getStatusIcon()}
            <h3 className="text-lg font-semibold text-gray-800">
              {getStatusText()}
            </h3>
          </div>

          {/* Plan Display */}
          {status?.plan && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">Execution Plan:</h4>
              <pre className="bg-gray-50 p-3 rounded text-sm text-gray-600 whitespace-pre-wrap">
                {status.plan}
              </pre>
            </div>
          )}

          {/* Logs Display */}
          {logs.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Progress Logs:</h4>
              <div className="bg-gray-50 p-3 rounded max-h-40 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm text-gray-600 py-1">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Output Section */}
      {status?.status === 'completed' && (status.outputs?.post || status.outputs?.script) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Social Media Post */}
          {status.outputs.post && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Social Media Post
                </h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-gray-700">
                  {status.outputs.post}
                </pre>
              </div>
              <button
                onClick={() => copyToClipboard(status.outputs.post || '', 'current-post')}
                className={`mt-3 flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                  copiedStates['current-post'] 
                    ? 'text-green-600 bg-green-50 px-3 py-1 rounded-md' 
                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded-md'
                }`}
              >
                {copiedStates['current-post'] ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          )}

          {/* YouTube Script */}
          {status.outputs.script && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  YouTube Script
                </h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-gray-700">
                  {status.outputs.script}
                </pre>
              </div>
              <button
                onClick={() => copyToClipboard(status.outputs.script || '', 'current-script')}
                className={`mt-3 flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                  copiedStates['current-script'] 
                    ? 'text-green-600 bg-green-50 px-3 py-1 rounded-md' 
                    : 'text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md'
                }`}
              >
                {copiedStates['current-script'] ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>
          )}

          {/* Content Analysis */}
          {status.outputs.analysis && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-800">
                  Content Analysis
                </h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg max-h-80 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-gray-700">
                  {status.outputs.analysis}
                </pre>
              </div>
              <button
                onClick={() => copyToClipboard(status.outputs.analysis || '', 'current-analysis')}
                className={`mt-3 flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                  copiedStates['current-analysis'] 
                    ? 'text-green-600 bg-green-50 px-3 py-1 rounded-md' 
                    : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-3 py-1 rounded-md'
                }`}
              >
                {copiedStates['current-analysis'] ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Analysis
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Section */}
      {status?.status === 'error' && status.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">
              Generation Failed
            </h3>
          </div>
          <p className="text-red-700">{status.error}</p>
        </div>
      )}
      {/* Saved Outputs Section */}
      {savedOutputs.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            Previous Generations
          </h2>
          
          <div className="space-y-6">
            {savedOutputs.map((output, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {output.timestamp ? new Date(output.timestamp).toLocaleString() : 'Unknown time'}
                    </p>
                    {output.originalPrompt && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Prompt:</strong> {output.originalPrompt.slice(0, 100)}...
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      const updated = savedOutputs.filter((_, i) => i !== index)
                      setSavedOutputs(updated)
                      localStorage.setItem('contentOutputs', JSON.stringify(updated))
                    }}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {output.post && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <h4 className="font-medium text-gray-800">Social Media Post</h4>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-sm">
                        <pre className="whitespace-pre-wrap text-gray-700">
                          {output.post.slice(0, 200)}...
                        </pre>
                      </div>
                      <button
                        onClick={() => copyToClipboard(output.post || '', `history-post-${index}`)}
                        className={`mt-2 flex items-center gap-1 text-xs font-medium transition-all duration-200 ${
                          copiedStates[`history-post-${index}`] 
                            ? 'text-green-600 bg-green-50 px-2 py-1 rounded' 
                            : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded'
                        }`}
                      >
                        {copiedStates[`history-post-${index}`] ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Post
                          </>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {output.script && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4 text-red-600" />
                        <h4 className="font-medium text-gray-800">YouTube Script</h4>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-gray-700">
                          {output.script.slice(0, 200)}...
                        </pre>
                      </div>
                      <button
                        onClick={() => copyToClipboard(output.script || '', `history-script-${index}`)}
                        className={`mt-2 flex items-center gap-1 text-xs font-medium transition-all duration-200 ${
                          copiedStates[`history-script-${index}`] 
                            ? 'text-green-600 bg-green-50 px-2 py-1 rounded' 
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded'
                        }`}
                      >
                        {copiedStates[`history-script-${index}`] ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Script
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {output.analysis && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-purple-600" />
                        <h4 className="font-medium text-gray-800">Content Analysis</h4>
                      </div>
                      <div className="bg-gray-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-gray-700">
                          {output.analysis.slice(0, 200)}...
                        </pre>
                      </div>
                      <button
                        onClick={() => copyToClipboard(output.analysis || '', `history-analysis-${index}`)}
                        className={`mt-2 flex items-center gap-1 text-xs font-medium transition-all duration-200 ${
                          copiedStates[`history-analysis-${index}`] 
                            ? 'text-green-600 bg-green-50 px-2 py-1 rounded' 
                            : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded'
                        }`}
                      >
                        {copiedStates[`history-analysis-${index}`] ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy Analysis
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {savedOutputs.length > 0 && (
            <div className="text-center mt-6">
              <button
                onClick={() => {
                  setSavedOutputs([])
                  localStorage.removeItem('contentOutputs')
                }}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Clear All Saved Outputs
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
