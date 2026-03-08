import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Package,
  Store,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from 'lucide-react'

function TransferCard({ transfer, index }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`
        glass rounded-xl overflow-hidden
        ${transfer.priority === 'high'
          ? 'ring-2 ring-purple-500/30'
          : 'ring-1 ring-white/10'}
      `}
    >
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {transfer.priority === 'high' && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-500/20 text-purple-400">
                  Alta Prioridade
                </span>
              )}
              {transfer.classe && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-400">
                  Classe {transfer.classe}
                </span>
              )}
            </div>
            <h3 className="text-sm font-mono text-white truncate" title={transfer.sku}>
              {transfer.sku}
            </h3>
            <p className="text-sm text-gray-400 truncate" title={transfer.descricao}>
              {transfer.descricao}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-gray-500">Transferir de</p>
              <p className="text-sm font-medium text-purple-400">
                {transfer.from.length} loja{transfer.from.length > 1 ? 's' : ''}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-500" />
            <div className="text-left">
              <p className="text-xs text-gray-500">Para</p>
              <p className="text-sm font-medium text-amber-400">
                {transfer.to.length} loja{transfer.to.length > 1 ? 's' : ''}
              </p>
            </div>
            <button className="p-1 rounded-lg hover:bg-white/10 transition-colors ml-2">
              {expanded ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/5"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* From stores */}
              <div>
                <h4 className="text-xs font-semibold text-purple-400 uppercase mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Lojas com Excesso
                </h4>
                <div className="space-y-2">
                  {transfer.from.map((store, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-purple-500/10"
                    >
                      <span className="text-sm text-white">{store.loja}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-purple-400">
                          {store.estoqueAtual} un
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({store.coberturaProjetada}d)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* To stores */}
              <div>
                <h4 className="text-xs font-semibold text-amber-400 uppercase mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Lojas Precisando
                </h4>
                <div className="space-y-2">
                  {transfer.to.map((store, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10"
                    >
                      <span className="text-sm text-white">{store.loja}</span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-amber-400">
                          {store.estoqueAtual} un
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({store.coberturaProjetada}d)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TransferSuggestions({ transfers }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')

  const filteredTransfers = useMemo(() => {
    let result = [...transfers]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (t) =>
          t.sku.toLowerCase().includes(term) ||
          t.descricao.toLowerCase().includes(term) ||
          t.from.some((s) => s.loja.toLowerCase().includes(term)) ||
          t.to.some((s) => s.loja.toLowerCase().includes(term))
      )
    }

    if (filterPriority !== 'all') {
      result = result.filter((t) => t.priority === filterPriority)
    }

    return result
  }, [transfers, searchTerm, filterPriority])

  if (transfers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass rounded-2xl p-8 text-center"
      >
        <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Nenhuma oportunidade de transferência
        </h3>
        <p className="text-sm text-gray-400">
          Não há SKUs onde uma loja tem excesso e outra precisa comprar.
        </p>
      </motion.div>
    )
  }

  const highPriorityCount = transfers.filter((t) => t.priority === 'high').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Store className="w-5 h-5 text-cyan-400" />
              Oportunidades de Transferência
            </h2>
            <p className="text-sm text-gray-400">
              {transfers.length} SKUs podem ser transferidos entre lojas
              {highPriorityCount > 0 && (
                <span className="text-purple-400 ml-1">
                  ({highPriorityCount} alta prioridade)
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-3 py-2 text-sm text-white
                  bg-[#1a1a2e] border border-white/10 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                  placeholder-gray-500
                "
              />
            </div>

            {/* Filter Priority */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full sm:w-auto pl-9 pr-6 py-2 text-sm text-white
                  bg-[#1a1a2e] border border-white/10 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                  appearance-none cursor-pointer
                  [&>option]:bg-[#1a1a2e] [&>option]:text-white [&>option]:py-2
                "
              >
                <option value="all">Todas Prioridades</option>
                <option value="high">Alta Prioridade</option>
                <option value="medium">Média Prioridade</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer list */}
      <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {filteredTransfers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400">Nenhum resultado encontrado</p>
          </div>
        ) : (
          filteredTransfers.map((transfer, index) => (
            <TransferCard key={transfer.sku} transfer={transfer} index={index} />
          ))
        )}
      </div>
    </motion.div>
  )
}

export default TransferSuggestions
