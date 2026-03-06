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

      setTimeout(() => {
        onDataLoaded(data)
      }, 800)
    } catch (error) {
      setIsProcessing(false)
      alert(error.message)
    }
  }

  const { isDragging, error, clearError, handlers, handleFileInput } = useFileDrop(handleFile)

  const handleClick = () => {
    if (!isProcessing) {
      fileInputRef.current?.click()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <motion.div
        {...handlers}
        onClick={handleClick}
        className={`
          relative overflow-hidden rounded-2xl cursor-pointer
          transition-all duration-300 ease-out
          ${isDragging
            ? 'scale-[1.02] ring-2 ring-primary-500/50'
            : 'hover:scale-[1.01]'
          }
        `}
        whileHover={{ boxShadow: '0 25px 50px -12px rgba(99, 91, 255, 0.25)' }}
      >
        {/* Background */}
        <div className={`
          absolute inset-0 glass
          ${isDragging ? 'bg-primary-500/10' : 'bg-white/[0.03]'}
          transition-colors duration-300
        `} />

        {/* Animated border */}
        <motion.div
          className="absolute inset-0 rounded-2xl"
          style={{
            background: isDragging
              ? 'linear-gradient(90deg, rgba(99, 91, 255, 0.5) 0%, rgba(0, 212, 255, 0.5) 50%, rgba(255, 107, 157, 0.5) 100%)'
              : 'linear-gradient(90deg, rgba(99, 91, 255, 0.2) 0%, rgba(0, 212, 255, 0.2) 50%, rgba(255, 107, 157, 0.2) 100%)',
            padding: '1px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />

        {/* Content */}
        <div className="relative p-12">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10 }}
                  className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4"
                >
                  <CheckCircle className="w-10 h-10 text-green-400" />
                </motion.div>
                <p className="text-xl font-semibold text-white">Planilha carregada!</p>
                <p className="text-gray-400 mt-2">Processando dados...</p>
              </motion.div>
            ) : isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-full bg-primary-500/20 flex items-center justify-center mb-4"
                >
                  <Loader2 className="w-10 h-10 text-primary-400" />
                </motion.div>
                <p className="text-xl font-semibold text-white">Processando planilha...</p>
                <p className="text-gray-400 mt-2">Analisando seus dados</p>
              </motion.div>
            ) : (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center text-center"
              >
                <motion.div
                  animate={isDragging ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 15 }}
                  className={`
                    w-20 h-20 rounded-2xl mb-6 flex items-center justify-center
                    ${isDragging
                      ? 'bg-primary-500/30'
                      : 'bg-gradient-to-br from-primary-500/20 to-cyan-500/20'
                    }
                    transition-colors duration-300
                  `}
                >
                  {isDragging ? (
                    <FileSpreadsheet className="w-10 h-10 text-primary-400" />
                  ) : (
                    <Upload className="w-10 h-10 text-primary-400" />
                  )}
                </motion.div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  {isDragging ? 'Solte o arquivo aqui' : 'Arraste sua planilha'}
                </h3>

                <p className="text-gray-400 mb-4">
                  ou{' '}
                  <span className="text-primary-400 hover:text-primary-300 transition-colors">
                    clique para selecionar
                  </span>
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="w-4 h-4" />
                    Excel (.xlsx, .xls)
                  </span>
                  <span className="flex items-center gap-1">
                    <FileSpreadsheet className="w-4 h-4" />
                    CSV
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="hidden"
        />
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3"
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
    </motion.div>
  )
}

export default FileUpload
