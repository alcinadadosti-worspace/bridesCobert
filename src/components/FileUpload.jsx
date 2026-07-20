import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileSpreadsheet, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { useFileDrop } from '../hooks/useFileDrop'
import { parseSpreadsheet } from '../utils/parseSpreadsheet'

function FileUpload({ onDataLoaded }) {
  const fileInputRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleFile = async (file) => {
    setIsProcessing(true)
    try {
      const data = await parseSpreadsheet(file)
      setIsSuccess(true)
      setTimeout(() => onDataLoaded(data), 800)
    } catch (error) {
      setIsProcessing(false)
      alert(error.message)
    }
  }

  const { isDragging, error, clearError, handlers, handleFileInput } = useFileDrop(handleFile)

  const handleClick = () => {
    if (!isProcessing) fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        {...handlers}
        onClick={handleClick}
        className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-colors duration-200
          ${isDragging
            ? 'border-primary-500/70 bg-primary-500/[0.06]'
            : 'border-white/15 hover:border-primary-500/40 hover:bg-white/[0.03]'
          }`}
      >
        <div className="px-6 py-10">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mb-3">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-base font-semibold text-white">Planilha carregada</p>
                <p className="text-sm text-gray-400 mt-1">Processando dados…</p>
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-14 h-14 rounded-full bg-primary-500/15 flex items-center justify-center mb-3">
                  <Loader2 className="w-7 h-7 text-primary-400 animate-spin" />
                </div>
                <p className="text-base font-semibold text-white">Processando planilha…</p>
                <p className="text-sm text-gray-400 mt-1">Analisando seus dados</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center"
              >
                <div
                  className={`w-14 h-14 rounded-xl mb-4 flex items-center justify-center transition-colors
                    ${isDragging ? 'bg-primary-500/25' : 'bg-white/5 border border-white/10'}`}
                >
                  {isDragging ? (
                    <FileSpreadsheet className="w-7 h-7 text-primary-300" />
                  ) : (
                    <Upload className="w-7 h-7 text-primary-400" />
                  )}
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste a planilha ou clique para selecionar'}
                </h3>
                <p className="text-sm text-gray-500">
                  Consulta de estoque em Excel (.xlsx, .xls) ou CSV
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="ml-auto text-red-400 hover:text-red-300 transition-colors"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default FileUpload
