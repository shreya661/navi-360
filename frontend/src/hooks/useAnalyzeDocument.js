import { useCallback, useState } from 'react'
import { analyzeDocument } from '../lib/api'

const stages = ['Reading your evidence', 'Checking important details', 'Preparing your next steps']

export function useAnalyzeDocument() {
  const [status, setStatus] = useState('idle')
  const [stage, setStage] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const analyze = useCallback(async (files, textInput, language, apiKey = null) => {
    setStatus('loading')
    setStage(0)
    setError(null)
    setResult(null)
    const timer = window.setInterval(() => setStage((value) => Math.min(value + 1, stages.length - 1)), 800)
    try {
      const response = await analyzeDocument(files, textInput, language, apiKey)
      setResult(response)
      setStatus('complete')
      return response
    } catch (requestError) {
      setError(requestError.message)
      setStatus('error')
      throw requestError
    } finally {
      window.clearInterval(timer)
    }
  }, [])

  const loadResult = useCallback((pastResult) => {
    setResult(pastResult)
    setStatus('complete')
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setStage(0)
    setResult(null)
    setError(null)
  }, [])

  return { status, stage, stages, result, error, analyze, reset, loadResult }
}
