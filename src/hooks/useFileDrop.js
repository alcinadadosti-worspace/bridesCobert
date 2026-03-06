import { useState, useCallback } from 'react'

export function useFileDrop(onFileAccepted) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()

    // Verifica se o mouse realmente saiu da área de drop
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false)
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const validateFile = useCallback((file) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv',
      'application/csv',
    ]

    const validExtensions = ['.xlsx', '.xls', '.csv']
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()

    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      return 'Formato inválido. Use arquivos Excel (.xlsx, .xls) ou CSV'
    }

    // 10MB limite
    if (file.size > 10 * 1024 * 1024) {
      return 'Arquivo muito grande. Máximo de 10MB'
    }

    return null
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    setError(null)

    const files = e.dataTransfer?.files || e.target?.files
    if (!files || files.length === 0) return

    const file = files[0]
    const validationError = validateFile(file)

    if (validationError) {
      setError(validationError)
      return
    }

    onFileAccepted(file)
  }, [onFileAccepted, validateFile])

  const handleFileInput = useCallback((e) => {
    setError(null)
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const validationError = validateFile(file)

    if (validationError) {
      setError(validationError)
      return
    }

    onFileAccepted(file)
  }, [onFileAccepted, validateFile])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isDragging,
    error,
    clearError,
    handlers: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
    handleFileInput,
  }
}
