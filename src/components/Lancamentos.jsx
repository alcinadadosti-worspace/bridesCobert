import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket, ChevronDown, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const THRESHOLDS = [1, 3, 6, 12]
const PAGE_SIZE = 25

function normFase(f) {
  return (f || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

function fmtMesAno(yyyymm) {
  if (!yyyymm) return '—'
  const y = Math.floor(yyyymm / 100)
  const m = yyyymm % 100
  return `${String(m).padStart(2, '0')}/${y}`
}

function plural(n) {
  return n === 1 ? 'mês' : 'meses'
}

function Lancamentos({ items }) {
  const [threshold, setThreshold] = useState(1)
  const [page, setPage] = useState(1)

  // Mês de referência (hoje), em índice ano*12+mês
  const now = new Date()
  const nowYM = now.getFullYear() * 12 + (now.getMonth() + 1)

  // Lançamentos com estoque + idade em meses desde o lançamento
  const base = useMemo(() => {
    return items
      .filter(i => normFase(i.faseProduto).includes('lanc') && i.estoqueAtual > 0)
      .map(i => {
        let meses = null
        if (i.dataLancamento) {
          const y = Math.floor(i.dataLancamento / 100)
          const m = i.dataLancamento % 100
          meses = nowYM - (y * 12 + m)
        }
        return { ...i, meses }
      })
  }, [items, nowYM])

  const rows = useMemo(() => {
    return base
      .map(i => {
        let situacao
        if (i.meses === null) situacao = 'Sem data'
        else if (i.meses < 0) situacao = 'A lançar'
        else if (i.meses >= threshold) situacao = 'Encalhado'
        else situacao = 'Recém-lançado'
        return { ...i, situacao }
      })
      .sort((a, b) => (b.meses ?? -999) - (a.meses ?? -999))
  }, [base, threshold])

  const encalhados = rows.filter(r => r.situacao === 'Encalhado')
  const semData = rows.filter(r => r.situacao === 'Sem data')

  const ranking = useMemo(() => {
    const c = {}
    encalhados.forEach(r => { c[r.loja] = (c[r.loja] || 0) + 1 })
    return Object.entries(c).map(([loja, count]) => ({ loja, count })).sort((a, b) => b.count - a.count)
  }, [encalhados])
  const maxCount = Math.max(1, ...ranking.map(r => r.count))

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const pageRows = rows.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  function exportar() {
    const headers = ['SKU', 'Produto', 'Loja', 'Classe', 'Estoque', 'Lançado em', 'Meses desde lançamento', 'Situação']
    const data = rows.map(r => [
      r.sku, r.descricao, r.loja, r.classe, r.estoqueAtual,
      fmtMesAno(r.dataLancamento), r.meses ?? '', r.situacao,
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Lançamentos')
    XLSX.writeFile(wb, 'lancamentos-parados.xlsx')
  }

  const situacaoStyle = {
    'Encalhado': 'bg-red-500/20 text-red-400',
    'Recém-lançado': 'bg-emerald-500/20 text-emerald-400',
    'A lançar': 'bg-blue-500/20 text-blue-400',
    'Sem data': 'bg-gray-500/20 text-gray-400',
  }

  return (
    <div className="space-y-6">
      {/* Ranking + controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 text-pink-400" />
            <h3 className="text-lg font-semibold text-white">Lançamentos parados no estoque</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Encalhado a partir de</span>
            <div className="relative">
              <select
                value={threshold}
                onChange={(e) => { setThreshold(Number(e.target.value)); setPage(1) }}
                className="pl-3 pr-9 py-2 text-sm text-white
                  bg-[#1a1a2e] border border-white/10 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                  appearance-none cursor-pointer
                  [&>option]:bg-[#1a1a2e] [&>option]:text-white [&>option]:py-2
                "
              >
                {THRESHOLDS.map(t => (
                  <option key={t} value={t}>{t} {plural(t)}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <button
              onClick={exportar}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                bg-emerald-500/20 border border-emerald-500/30 text-emerald-300
                hover:bg-emerald-500/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          {base.length} lançamentos com estoque ·{' '}
          <span className="text-red-400">{encalhados.length} encalhados</span> (≥ {threshold} {plural(threshold)}) ·{' '}
          <span className="text-gray-400">{semData.length} sem data de lançamento</span>
        </p>

        {ranking.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            Nenhum lançamento encalhado com esse critério.
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Encalhados por loja</p>
            {ranking.map((r, idx) => (
              <div key={r.loja}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-gray-300 truncate">{r.loja}</span>
                    {idx === 0 && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-red-500/20 text-red-400 shrink-0">
                        MAIOR
                      </span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold w-12 text-right ${idx === 0 ? 'text-red-400' : 'text-pink-400'}`}>
                    {r.count}
                  </span>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? 'bg-red-500' : 'bg-pink-500'}`}
                    style={{ width: `${Math.round((r.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        {base.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Nenhum item em fase de lançamento com estoque na planilha.
          </p>
        ) : (
          <>
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[760px] table-fixed">
                <thead>
                  <tr className="border-b border-white/5 text-xs font-semibold text-gray-400 uppercase">
                    <th className="w-[10%] px-3 py-3 text-left">SKU</th>
                    <th className="w-[26%] px-3 py-3 text-left">Produto</th>
                    <th className="w-[16%] px-3 py-3 text-left">Loja</th>
                    <th className="w-[7%] px-3 py-3 text-left">Classe</th>
                    <th className="w-[9%] px-3 py-3 text-right">Estoque</th>
                    <th className="w-[10%] px-3 py-3 text-center">Lançado</th>
                    <th className="w-[10%] px-3 py-3 text-center">Há</th>
                    <th className="w-[12%] px-3 py-3 text-left">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(r => (
                    <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="px-3 py-3 text-sm font-mono text-white truncate" title={r.sku}>{r.sku}</td>
                      <td className="px-3 py-3 text-sm text-gray-300 truncate" title={r.descricao}>{r.descricao}</td>
                      <td className="px-3 py-3 text-sm text-cyan-400 truncate" title={r.loja}>{r.loja}</td>
                      <td className="px-3 py-3 text-sm text-gray-400">{r.classe || '—'}</td>
                      <td className="px-3 py-3 text-sm text-white font-medium text-right">{r.estoqueAtual}</td>
                      <td className="px-3 py-3 text-sm text-gray-400 text-center">{fmtMesAno(r.dataLancamento)}</td>
                      <td className="px-3 py-3 text-sm text-center">
                        {r.meses === null ? (
                          <span className="text-gray-600">—</span>
                        ) : r.meses < 0 ? (
                          <span className="text-blue-400">a lançar</span>
                        ) : r.meses === 0 ? (
                          <span className="text-emerald-400">este mês</span>
                        ) : (
                          <span className={r.meses >= threshold ? 'text-red-400 font-medium' : 'text-gray-300'}>
                            {r.meses} {plural(r.meses)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${situacaoStyle[r.situacao]}`}>
                          {r.situacao}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-gray-500">
                {rows.length} itens · página {pageClamped} de {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={pageClamped <= 1}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-gray-300
                    hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={pageClamped >= totalPages}
                  className="px-3 py-1.5 text-sm rounded-lg bg-white/5 text-gray-300
                    hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}

export default Lancamentos
