import { motion } from 'framer-motion'
import { Sparkles, ArrowLeft } from 'lucide-react'
import Sacolas from './Sacolas'

// Página standalone da conferência de sacolas — acessível direto da tela inicial,
// sem precisar importar a planilha de estoque antes.
function SacolasPage({ onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5">
        <div className="w-full px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Supply Flow</h1>
                <p className="text-sm text-gray-400">Conferência de Sacolas</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl
                bg-white/5 border border-white/10
                text-sm font-medium text-gray-300
                hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="w-full px-4 lg:px-8 py-8 max-w-6xl mx-auto">
        <Sacolas />
      </main>
    </motion.div>
  )
}

export default SacolasPage
