import { motion } from 'framer-motion'
import { Target, Calendar, Truck } from 'lucide-react'
import { CLASS_TARGETS } from '../utils/parseSpreadsheet'

// "A 57 · B 50 · C 30 · E 30" — metas de cobertura por classe (geradas do mapa)
const METAS_LABEL = Object.entries(CLASS_TARGETS).map(([k, v]) => `${k} ${v}`).join(' · ')

function CoverageSlider({ value, onChange, leadTime = 0, onLeadTimeChange, compact = false }) {
  const handleSliderChange = (e) => {
    onChange(parseInt(e.target.value, 10))
  }

  const handleInputChange = (e) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 365) {
      onChange(newValue)
    }
  }

  const handleLeadChange = (e) => {
    const newValue = parseInt(e.target.value, 10)
    if (!isNaN(newValue) && newValue >= 0 && newValue <= 90) {
      onLeadTimeChange?.(newValue)
    }
  }

  const totalDias = value + leadTime

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {/* Cobertura desejada */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400">
            <Target className="w-4 h-4" />
            <span className="text-sm font-medium" title={`Metas por classe: ${METAS_LABEL}`}>Cobertura padrão:</span>
          </div>
          <input
            type="range"
            min="0"
            max="365"
            value={value}
            onChange={handleSliderChange}
            className="w-28 h-2 bg-white/10 rounded-full appearance-none cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary-500
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:shadow-primary-500/30
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
            "
          />
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={value}
              onChange={handleInputChange}
              min="0"
              max="365"
              className="w-14 px-2 py-1 text-center text-sm font-semibold text-white
                bg-white/5 border border-white/10 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
              "
            />
            <span className="text-sm text-gray-400">d</span>
          </div>
        </div>

        {/* Prazo de entrega */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-gray-400">
            <Truck className="w-4 h-4" />
            <span className="text-sm font-medium">Prazo:</span>
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              value={leadTime}
              onChange={handleLeadChange}
              min="0"
              max="90"
              className="w-14 px-2 py-1 text-center text-sm font-semibold text-white
                bg-white/5 border border-white/10 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50
              "
            />
            <span className="text-sm text-gray-400">d</span>
          </div>
        </div>

        {/* Horizonte do pedido */}
        <span className="text-xs text-gray-500">
          Pedido cobre <span className="text-gold-300 font-semibold">{totalDias}d</span>
        </span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="w-full max-w-md mx-auto mt-8"
    >
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Cobertura padrão</h3>
              <p className="text-xs text-gray-400">Metas reais por classe: {METAS_LABEL}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={handleInputChange}
              min="0"
              max="365"
              className="w-20 px-3 py-2 text-center text-lg font-bold text-white
                bg-white/5 border border-white/10 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                transition-all duration-200
              "
            />
            <div className="flex items-center gap-1 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">dias</span>
            </div>
          </div>
        </div>

        <div className="relative pt-2">
          {/* Track background */}
          <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 rounded-full bg-white/10" />

          {/* Filled track */}
          <motion.div
            className="absolute top-1/2 left-0 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-primary-500 to-gold-400"
            style={{ width: `${(value / 365) * 100}%` }}
            layoutId="slider-fill"
          />

          {/* Slider input */}
          <input
            type="range"
            min="0"
            max="365"
            value={value}
            onChange={handleSliderChange}
            className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-white
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:shadow-lg
              [&::-webkit-slider-thumb]:shadow-primary-500/30
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-primary-400
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
            "
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-3 text-xs text-gray-500">
          <span>0 dias</span>
          <span>90 dias</span>
          <span>180 dias</span>
          <span>365 dias</span>
        </div>

        {/* Prazo de entrega */}
        <div className="flex items-center justify-between mt-5 pt-5 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center">
              <Truck className="w-5 h-5 text-gold-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Prazo de entrega</h3>
              <p className="text-xs text-gray-400">Dias até a mercadoria chegar</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              value={leadTime}
              onChange={handleLeadChange}
              min="0"
              max="90"
              className="w-20 px-3 py-2 text-center text-lg font-bold text-white
                bg-white/5 border border-white/10 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50
                transition-all duration-200
              "
            />
            <div className="flex items-center gap-1 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">dias</span>
            </div>
          </div>
        </div>

        {/* Horizonte total do pedido */}
        <p className="text-xs text-gray-400 mt-4 text-center">
          O pedido de compra cobre{' '}
          <span className="text-gold-300 font-semibold">{totalDias} dias</span>{' '}
          (cobertura + prazo)
        </p>
      </div>
    </motion.div>
  )
}

export default CoverageSlider
