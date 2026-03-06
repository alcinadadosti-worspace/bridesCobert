import { motion } from 'framer-motion'
import { Sparkles, TrendingUp, ShieldCheck, Zap } from 'lucide-react'
import FileUpload from './FileUpload'
import CoverageSlider from './CoverageSlider'

const features = [
  {
    icon: TrendingUp,
    title: 'Decisões Inteligentes',
    description: 'Analise cobertura e tome decisões baseadas em dados',
  },
  {
    icon: ShieldCheck,
    title: 'Evite Rupturas',
    description: 'Identifique SKUs que precisam de reposição urgente',
  },
  {
    icon: Zap,
    title: 'Instantâneo',
    description: 'Processamento local, rápido e seguro',
  },
]

function Hero({ onDataLoaded, targetCoverage, setTargetCoverage }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <header className="w-full px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">BRIDES</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-sm text-gray-400"
          >
            Assistente de Compras v1.0
          </motion.div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full
              bg-primary-500/10 border border-primary-500/20 mb-8"
          >
            <Sparkles className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-300">
              Powered by Data Intelligence
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6"
          >
            <span className="text-white">Decisões de compra </span>
            <span className="text-gradient">inteligentes</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12"
          >
            Faça upload da sua planilha de estoque e receba recomendações instantâneas
            sobre quais produtos precisam de reposição baseado na cobertura projetada.
          </motion.p>

          {/* File Upload */}
          <FileUpload onDataLoaded={onDataLoaded} />

          {/* Coverage Slider */}
          <CoverageSlider
            value={targetCoverage}
            onChange={setTargetCoverage}
          />
        </div>
      </main>

      {/* Features */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="w-full px-6 py-16 border-t border-white/5"
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
                className="group"
              >
                <div className="glass rounded-2xl p-6 h-full
                  transition-all duration-300 hover:bg-white/[0.08]
                  hover:shadow-xl hover:shadow-primary-500/5"
                >
                  <div className="w-12 h-12 rounded-xl mb-4 flex items-center justify-center
                    bg-gradient-to-br from-primary-500/20 to-cyan-500/20
                    group-hover:from-primary-500/30 group-hover:to-cyan-500/30
                    transition-all duration-300"
                  >
                    <feature.icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="w-full px-6 py-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-500">
          Processamento 100% local. Seus dados nunca saem do navegador.
        </div>
      </footer>
    </motion.div>
  )
}

export default Hero
