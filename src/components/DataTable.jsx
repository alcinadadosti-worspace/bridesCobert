import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  SortAsc,
  PackagePlus,
  TrendingUp,
} from 'lucide-react'

const PAGE_SIZES = [10, 25, 50, 100]

function StatusBadge({ status, urgency, excessLevel }) {
  const statusConfig = {
    // Comprar
    'COMPRAR-high': {
      icon: AlertCircle,
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      label: 'Urgente',
    },
    'COMPRAR-medium': {
      icon: AlertTriangle,
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      label: 'Médio',
    },
    // Saudável
    'SAUDÁVEL': {
      icon: CheckCircle2,
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      label: 'OK',
    },
    // Excesso
    'EXCESSO-moderate': {
      icon: PackagePlus,
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      label: 'Excesso',
    },
    'EXCESSO-high': {
      icon: TrendingUp,
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      label: 'Excesso Alto',
    },
  }

  let configKey
  if (status === 'COMPRAR') {
    configKey = `COMPRAR-${urgency}`
  } else if (status === 'EXCESSO') {
    configKey = `EXCESSO-${excessLevel}`
  } else {
    configKey = 'SAUDÁVEL'
  }

  const config = statusConfig[configKey] || statusConfig['SAUDÁVEL']
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-1 px-2 py-1 rounded-full
        ${config.bg} ${config.border} border
        transition-all duration-200
      `}
    >
      <Icon className={`w-3 h-3 ${config.text}`} />
      <span className={`text-xs font-medium ${config.text} whitespace-nowrap`}>
        {config.label}
      </span>
    </motion.div>
  )
}

function DataTable({ items, targetCoverage }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [filterStatus, setFilterStatus] = useState('all')

  // Filtragem
  const filteredItems = useMemo(() => {
    let result = [...items]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (item) =>
          item.sku.toLowerCase().includes(term) ||
          item.descricao.toLowerCase().includes(term) ||
          item.categoria.toLowerCase().includes(term)
      )
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'buy') {
        result = result.filter((item) => item.needsToBuy)
      } else if (filterStatus === 'healthy') {
        result = result.filter((item) => !item.needsToBuy && !item.hasExcess)
      } else if (filterStatus === 'excess') {
        result = result.filter((item) => item.hasExcess)
      }
    }

    return result
  }, [items, searchTerm, filterStatus])

  // Ordenação
  const sortedItems = useMemo(() => {
    if (!sortConfig.key) return filteredItems

    return [...filteredItems].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()
      return sortConfig.direction === 'asc'
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr)
    })
  }, [filteredItems, sortConfig])

  // Paginação
  const totalPages = Math.ceil(sortedItems.length / pageSize)
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedItems.slice(start, start + pageSize)
  }, [sortedItems, currentPage, pageSize])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return <ArrowUpDown className="w-3 h-3 text-gray-500" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary-400" />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Análise de Estoque</h2>
            <p className="text-sm text-gray-400">
              {sortedItems.length} itens (Meta: {targetCoverage} dias)
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
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-48 pl-9 pr-3 py-2 text-sm text-white
                  bg-[#1a1a2e] border border-white/10 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                  placeholder-gray-500
                "
              />
            </div>

            {/* Filter Status */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-auto pl-9 pr-6 py-2 text-sm text-white
                  bg-[#1a1a2e] border border-white/10 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                  appearance-none cursor-pointer
                  [&>option]:bg-[#1a1a2e] [&>option]:text-white [&>option]:py-2
                "
              >
                <option value="all">Todos</option>
                <option value="buy">Comprar</option>
                <option value="healthy">Saudável</option>
                <option value="excess">Excesso</option>
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <select
                value={sortConfig.key ? `${sortConfig.key}-${sortConfig.direction}` : ''}
                onChange={(e) => {
                  const value = e.target.value
                  if (!value) {
                    setSortConfig({ key: null, direction: 'asc' })
                  } else {
                    const [key, direction] = value.split('-')
                    setSortConfig({ key, direction })
                  }
                  setCurrentPage(1)
                }}
                className="w-full sm:w-auto pl-9 pr-6 py-2 text-sm text-white
                  bg-[#1a1a2e] border border-white/10 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                  appearance-none cursor-pointer
                  [&>option]:bg-[#1a1a2e] [&>option]:text-white [&>option]:py-2
                "
              >
                <option value="">Ordenar por...</option>
                <option value="estoqueAtual-asc">Estoque: Menor → Maior</option>
                <option value="estoqueAtual-desc">Estoque: Maior → Menor</option>
                <option value="coberturaProjetada-asc">Cobertura: Menor → Maior</option>
                <option value="coberturaProjetada-desc">Cobertura: Maior → Menor</option>
                <option value="sku-asc">SKU: A → Z</option>
                <option value="sku-desc">SKU: Z → A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full">
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-white/5">
              <th
                onClick={() => handleSort('sku')}
                className="w-[12%] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  SKU {getSortIcon('sku')}
                </div>
              </th>
              <th
                onClick={() => handleSort('descricao')}
                className="w-[22%] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Produto {getSortIcon('descricao')}
                </div>
              </th>
              <th
                onClick={() => handleSort('estoqueAtual')}
                className="w-[10%] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Estoque {getSortIcon('estoqueAtual')}
                </div>
              </th>
              <th
                onClick={() => handleSort('estoqueTransito')}
                className="w-[10%] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Trâns. {getSortIcon('estoqueTransito')}
                </div>
              </th>
              <th
                onClick={() => handleSort('pedidoPendente')}
                className="w-[10%] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Pend. {getSortIcon('pedidoPendente')}
                </div>
              </th>
              <th
                onClick={() => handleSort('coberturaAtual')}
                className="w-[12%] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Cob. Atual {getSortIcon('coberturaAtual')}
                </div>
              </th>
              <th
                onClick={() => handleSort('coberturaProjetada')}
                className="w-[12%] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase cursor-pointer hover:text-white"
              >
                <div className="flex items-center gap-1">
                  Cob. Proj. {getSortIcon('coberturaProjetada')}
                </div>
              </th>
              <th className="w-[12%] px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {paginatedItems.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className={`
                    border-b border-white/5
                    ${item.needsToBuy
                      ? item.urgency === 'high'
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : 'bg-amber-500/5 hover:bg-amber-500/10'
                      : item.hasExcess
                        ? item.excessLevel === 'high'
                          ? 'bg-purple-500/5 hover:bg-purple-500/10'
                          : 'bg-blue-500/5 hover:bg-blue-500/10'
                        : 'hover:bg-white/[0.02]'
                    }
                    transition-colors duration-200
                  `}
                >
                  <td className="px-3 py-3 text-sm font-mono text-white truncate" title={item.sku}>
                    {item.sku}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-300 truncate" title={item.descricao}>
                    {item.descricao}
                  </td>
                  <td className="px-3 py-3 text-sm text-white font-medium">
                    {item.estoqueAtual}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-400">
                    {item.estoqueTransito}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-400">
                    {item.pedidoPendente}
                  </td>
                  <td className="px-3 py-3 text-sm text-gray-300">
                    {item.coberturaAtual}d
                  </td>
                  <td className="px-3 py-3">
                    <span className={`
                      text-sm font-medium
                      ${item.coberturaProjetada < targetCoverage
                        ? 'text-amber-400'
                        : item.hasExcess
                          ? item.excessLevel === 'high'
                            ? 'text-purple-400'
                            : 'text-blue-400'
                          : 'text-emerald-400'
                      }
                    `}>
                      {item.coberturaProjetada}d
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <StatusBadge status={item.status} urgency={item.urgency} excessLevel={item.excessLevel} />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-2 py-1 text-sm text-white
                bg-[#1a1a2e] border border-white/10 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500/50
                cursor-pointer
                [&>option]:bg-[#1a1a2e] [&>option]:text-white
              "
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-white/10 transition-colors
              "
            >
              <ChevronsLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-white/10 transition-colors
              "
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            <span className="px-3 text-sm text-gray-400">
              <span className="text-white font-medium">{currentPage}</span>
              <span className="mx-1">/</span>
              <span className="text-white font-medium">{totalPages || 1}</span>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-white/10 transition-colors
              "
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-white/10 transition-colors
              "
            >
              <ChevronsRight className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default DataTable
