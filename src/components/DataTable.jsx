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
} from 'lucide-react'

const PAGE_SIZES = [10, 25, 50, 100]

function StatusBadge({ status, urgency }) {
  const needsToBuy = status === 'COMPRAR'

  const urgencyConfig = {
    high: {
      icon: AlertCircle,
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      label: 'Urgente',
    },
    medium: {
      icon: AlertTriangle,
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      label: 'Médio',
    },
    low: {
      icon: ShoppingCart,
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      label: 'Baixo',
    },
    none: {
      icon: CheckCircle2,
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      label: 'Saudável',
    },
  }

  const config = needsToBuy ? urgencyConfig[urgency] : urgencyConfig.none
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
        ${config.bg} ${config.border} border
        transition-all duration-200
      `}
    >
      <Icon className={`w-3.5 h-3.5 ${config.text}`} />
      <span className={`text-xs font-medium ${config.text}`}>
        {needsToBuy ? `Comprar (${config.label})` : config.label}
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

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (item) =>
          item.sku.toLowerCase().includes(term) ||
          item.descricao.toLowerCase().includes(term) ||
          item.categoria.toLowerCase().includes(term)
      )
    }

    // Filtro de status
    if (filterStatus !== 'all') {
      result = result.filter((item) =>
        filterStatus === 'buy' ? item.needsToBuy : !item.needsToBuy
      )
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
      return <ArrowUpDown className="w-4 h-4 text-gray-500" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-primary-400" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary-400" />
    )
  }

  const columns = [
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'descricao', label: 'Descrição', sortable: true },
    { key: 'categoria', label: 'Categoria', sortable: true },
    { key: 'estoqueAtual', label: 'Estoque', sortable: true },
    { key: 'estoqueTransito', label: 'Em Trânsito', sortable: true },
    { key: 'pedidoPendente', label: 'Pendente', sortable: true },
    { key: 'coberturaAtual', label: 'Cobertura Atual', sortable: true },
    { key: 'coberturaProjetada', label: 'Cobertura Projetada', sortable: true },
    { key: 'status', label: 'Status', sortable: false },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Análise de Estoque</h2>
            <p className="text-sm text-gray-400 mt-1">
              {sortedItems.length} itens encontrados (Meta: {targetCoverage} dias)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar SKU, descrição..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-64 pl-10 pr-4 py-2 text-sm text-white
                  bg-white/5 border border-white/10 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                  placeholder-gray-500
                "
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-auto pl-10 pr-8 py-2 text-sm text-white
                  bg-white/5 border border-white/10 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                  appearance-none cursor-pointer
                "
              >
                <option value="all">Todos os status</option>
                <option value="buy">Precisa comprar</option>
                <option value="healthy">Estoque saudável</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`
                    px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider
                    ${col.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {col.sortable && getSortIcon(col.key)}
                  </div>
                </th>
              ))}
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
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className={`
                    border-b border-white/5
                    ${item.needsToBuy
                      ? item.urgency === 'high'
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : item.urgency === 'medium'
                          ? 'bg-amber-500/5 hover:bg-amber-500/10'
                          : 'bg-yellow-500/5 hover:bg-yellow-500/10'
                      : 'hover:bg-white/[0.02]'
                    }
                    transition-colors duration-200
                  `}
                >
                  <td className="px-6 py-4 text-sm font-mono text-white">
                    {item.sku}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300 max-w-[200px] truncate">
                    {item.descricao}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {item.categoria}
                  </td>
                  <td className="px-6 py-4 text-sm text-white font-medium">
                    {item.estoqueAtual}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {item.estoqueTransito}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {item.pedidoPendente}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {item.coberturaAtual} dias
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`
                        text-sm font-medium
                        ${item.coberturaProjetada < targetCoverage
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                        }
                      `}>
                        {item.coberturaProjetada} dias
                      </span>
                      {item.needsToBuy && (
                        <span className="text-xs text-gray-500">
                          (-{item.coverageGap})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} urgency={item.urgency} />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-6 border-t border-white/5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Itens por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-3 py-1 text-sm text-white
                bg-white/5 border border-white/10 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500/50
                cursor-pointer
              "
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-white/10 transition-colors
              "
            >
              <ChevronsLeft className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-white/10 transition-colors
              "
            >
              <ChevronLeft className="w-4 h-4 text-gray-400" />
            </button>

            <span className="px-4 text-sm text-gray-400">
              Página <span className="text-white font-medium">{currentPage}</span> de{' '}
              <span className="text-white font-medium">{totalPages || 1}</span>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg bg-white/5 border border-white/10
                disabled:opacity-30 disabled:cursor-not-allowed
                hover:bg-white/10 transition-colors
              "
            >
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 rounded-lg bg-white/5 border border-white/10
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
