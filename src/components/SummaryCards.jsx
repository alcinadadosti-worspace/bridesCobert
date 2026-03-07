import { motion } from 'framer-motion'
import { Package, AlertTriangle, CheckCircle, TrendingUp, PackagePlus } from 'lucide-react'

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
}

function SummaryCards({ summary }) {
  const cards = [
    {
      title: 'Total de SKUs',
      value: summary.totalSKUs,
      subtitle: `${summary.categories.length} categorias`,
      icon: Package,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-cyan-400',
    },
    {
      title: 'Precisam de Compra',
      value: summary.needToBuy,
      subtitle: `${((summary.needToBuy / summary.totalSKUs) * 100).toFixed(1)}% do total`,
      icon: AlertTriangle,
      gradient: 'from-amber-500/20 to-orange-500/20',
      iconColor: 'text-amber-400',
      highlight: summary.needToBuy > 0,
      highlightColor: 'ring-amber-500/30',
      badgeColor: 'bg-amber-500/20 text-amber-400',
      badgeText: 'Atenção',
    },
    {
      title: 'Estoque Saudável',
      value: summary.healthy,
      subtitle: `${((summary.healthy / summary.totalSKUs) * 100).toFixed(1)}% do total`,
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 to-green-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Excesso de Estoque',
      value: summary.hasExcess,
      subtitle: `${((summary.hasExcess / summary.totalSKUs) * 100).toFixed(1)}% do total`,
      icon: TrendingUp,
      gradient: 'from-purple-500/20 to-blue-500/20',
      iconColor: 'text-purple-400',
      highlight: summary.hasExcess > 0,
      highlightColor: 'ring-purple-500/30',
      badgeColor: 'bg-purple-500/20 text-purple-400',
      badgeText: 'Transferir',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          custom={index}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover={{ scale: 1.02, y: -4 }}
          className={`
            relative overflow-hidden rounded-2xl
            glass p-6
            ${card.highlight ? `ring-2 ${card.highlightColor || 'ring-amber-500/30'}` : ''}
            transition-shadow duration-300
            hover:shadow-xl hover:shadow-primary-500/10
          `}
        >
          {/* Gradient background */}
          <div className={`
            absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50
          `} />

          {/* Content */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                bg-white/5 backdrop-blur-sm
              `}>
                <card.icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>

              {card.highlight && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.5 }}
                  className={`px-2 py-1 rounded-full text-xs font-medium ${card.badgeColor || 'bg-amber-500/20 text-amber-400'}`}
                >
                  {card.badgeText || 'Atenção'}
                </motion.div>
              )}
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <h3 className="text-3xl font-bold text-white mb-1">
                {card.value}
              </h3>
              <p className="text-sm text-gray-400">{card.title}</p>
              <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
            </motion.div>
          </div>

          {/* Decorative element */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full
            bg-gradient-to-br from-white/5 to-transparent blur-2xl" />
        </motion.div>
      ))}
    </div>
  )
}

export default SummaryCards
