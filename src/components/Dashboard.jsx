import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RotateCcw, Download, FileSpreadsheet } from 'lucide-react'
import SummaryCards from './SummaryCards'
import DataTable from './DataTable'
import CoverageSlider from './CoverageSlider'
import { analyzeData } from '../utils/parseSpreadsheet'

function Dashboard({ data, targetCoverage, setTargetCoverage, onReset }) {
  const { items, summary } = useMemo(
    () => analyzeData(data, targetCoverage),
    [data, targetCoverage]
  )

  const handleExport = () => {
    // Criar CSV para download
    const headers = [
      'SKU',
      'Descrição',
      'Categoria',
      'Estoque Atual',
      'Em Trânsito',
      'Pedido Pendente',
      'Cobertura Atual',
      'Cobertura Projetada',
      'Status',
      'Gap de Cobertura',
      'Dias Excesso',
    ]

    const rows = items.map((item) => [
      item.sku,
      `"${item.descricao}"`,
      item.categoria,
      item.estoqueAtual,
      item.estoqueTransito,
      item.pedidoPendente,
      item.coberturaAtual,
      item.coberturaProjetada,
      item.status,
      item.coverageGap,
      item.excessDays || 0,
    ])

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `analise_estoque_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen"
    >
      {/* Header */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5">
        <div className="w-full px-4 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-cyan-400 flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-white">Coverage Dashboard</h1>
                <p className="text-sm text-gray-400">Análise de Decisão de Compras</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Coverage Slider */}
              <CoverageSlider
                value={targetCoverage}
                onChange={setTargetCoverage}
                compact
              />

              <div className="flex items-center gap-2">
                {/* Export Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl
                    bg-white/5 border border-white/10
                    text-sm font-medium text-white
                    hover:bg-white/10 transition-colors
                  "
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </motion.button>

                {/* Reset Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onReset}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl
                    bg-primary-500/20 border border-primary-500/30
                    text-sm font-medium text-primary-300
                    hover:bg-primary-500/30 transition-colors
                  "
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Nova Análise</span>
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 lg:px-8 py-8">
        {/* File info badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-emerald-500/10 border border-emerald-500/20"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-300">
              Planilha carregada com sucesso
            </span>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <section className="mb-8">
          <SummaryCards summary={summary} />
        </section>

        {/* Urgency and Excess breakdown */}
        {(summary.needToBuy > 0 || summary.hasExcess > 0) && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Urgency breakdown */}
            {summary.needToBuy > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Distribuição por Urgência de Compra
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div>
                      <span className="text-2xl font-bold text-red-400">{summary.highUrgency}</span>
                      <p className="text-sm text-gray-400">Alta urgência</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div>
                      <span className="text-2xl font-bold text-amber-400">{summary.mediumUrgency}</span>
                      <p className="text-sm text-gray-400">Média urgência</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-lime-500/10 border border-lime-500/20">
                    <div className="w-3 h-3 rounded-full bg-lime-500" />
                    <div>
                      <span className="text-2xl font-bold text-lime-400">{summary.lowUrgency}</span>
                      <p className="text-sm text-gray-400">Baixa urgência</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Excess breakdown */}
            {summary.hasExcess > 0 && (
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Excesso de Estoque (Transferir)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                    <div className="w-3 h-3 rounded-full bg-purple-500" />
                    <div>
                      <span className="text-2xl font-bold text-purple-400">{summary.excessHigh}</span>
                      <p className="text-sm text-gray-400">Excesso alto (&gt;3x meta)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <div>
                      <span className="text-2xl font-bold text-blue-400">{summary.excessModerate}</span>
                      <p className="text-sm text-gray-400">Excesso moderado (2-3x meta)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {/* Data Table */}
        <section>
          <DataTable items={items} targetCoverage={targetCoverage} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-12">
        <div className="w-full px-4 lg:px-8 py-6 text-center text-sm text-gray-500">
          Processamento 100% local. Seus dados nunca saem do navegador.
        </div>
      </footer>
    </motion.div>
  )
}

export default Dashboard
