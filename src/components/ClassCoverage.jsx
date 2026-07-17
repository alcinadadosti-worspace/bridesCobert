import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Layers, Grid3x3, ChevronDown } from 'lucide-react'
import { metaDaClasse } from '../utils/parseSpreadsheet'

// Cores por classe (mesmo padrão usado na tabela de dados)
const CLASS_COLORS = {
  A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  C: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

function classBadgeColor(c) {
  return CLASS_COLORS[c] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

// Cores alinhadas ao status: acima da meta já é excesso (igual ao status/tabela).
function coverageColor(value, target) {
  if (value === 0) return 'text-gray-600'
  if (value < target * 0.75) return 'text-red-400'   // < 75% da meta (comprar)
  if (value <= target) return 'text-emerald-400'      // 75–100% (saudável)
  if (value <= target * 2) return 'text-blue-400'     // 100–200% (excesso)
  return 'text-purple-400'                             // > 200% (excesso alto)
}

function CoverageBar({ value, target, max }) {
  const cappedValue = Math.min(value, max)
  const pct = max > 0 ? Math.round((cappedValue / max) * 100) : 0
  const targetPct = max > 0 ? Math.round((target / max) * 100) : 0
  const color = value === 0 ? 'bg-gray-600' :
    value < target * 0.75 ? 'bg-red-500' :
    value <= target ? 'bg-emerald-500' :
    value <= target * 2 ? 'bg-blue-500' :
    'bg-purple-500'

  return (
    <div className="relative h-2 bg-white/10 rounded-full overflow-visible">
      <div
        className={`h-full rounded-full transition-all duration-700 ${color}`}
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white/40 rounded-full"
        style={{ left: `${targetPct}%` }}
      />
    </div>
  )
}

// Ordena classes A, B, C, ... e deixa "Sem classe" por último
function sortClasses(a, b) {
  if (a === 'Sem classe') return 1
  if (b === 'Sem classe') return -1
  return a.localeCompare(b)
}

function ClassCoverage({ items, targetCoverage }) {
  const [selectedStore, setSelectedStore] = useState('all')

  const stores = useMemo(
    () => [...new Set(items.map(i => i.loja))].sort(),
    [items]
  )

  // Cards reagem ao filtro de loja; a matriz abaixo sempre mostra todas as lojas
  const filteredItems = useMemo(
    () => selectedStore === 'all' ? items : items.filter(i => i.loja === selectedStore),
    [items, selectedStore]
  )

  // Cobertura por classe = (Σ estoque atual + Σ trânsito) / Σ DDV previsto (igual à planilha)
  const classData = useMemo(() => {
    const groups = {}
    filteredItems.forEach(item => {
      const key = item.classe || 'Sem classe'
      if (!groups[key]) {
        groups[key] = {
          classe: key,
          total: 0,
          needToBuy: 0,
          healthy: 0,
          hasExcess: 0,
          semPrevisao: 0, // itens sem DDV
          sumEstoque: 0, // Σ (estoque atual + trânsito) — numerador da cobertura
          sumDDV: 0,     // Σ DDV previsto — denominador da cobertura
          ddvCount: 0,
        }
      }
      const g = groups[key]
      g.total++
      g.sumEstoque += item.estoqueAtual + item.estoqueTransito
      if (item.ddvPrevisto > 0) {
        g.sumDDV += item.ddvPrevisto
        g.ddvCount++
      }
      if (item.needsToBuy) g.needToBuy++
      else if (item.hasExcess) g.hasExcess++
      else if (item.status === 'SEM PREVISÃO') g.semPrevisao++
      else g.healthy++
    })

    return Object.values(groups)
      .map(g => ({
        ...g,
        avgCoverage: g.sumDDV > 0 ? Math.round((g.sumEstoque / g.sumDDV) * 10) / 10 : 0,
        avgDDV: g.ddvCount ? Math.round((g.sumDDV / g.ddvCount) * 100) / 100 : 0,
        meta: metaDaClasse(g.classe, targetCoverage), // meta de cobertura desta classe
      }))
      .sort((a, b) => sortClasses(a.classe, b.classe))
  }, [filteredItems, targetCoverage])

  // Matriz classe × loja: mesma cobertura ponderada da planilha por célula
  const matrix = useMemo(() => {
    const cells = {}
    items.forEach(item => {
      const c = item.classe || 'Sem classe'
      const key = `${c}|${item.loja}`
      if (!cells[key]) cells[key] = { sumEstoque: 0, sumDDV: 0 }
      cells[key].sumEstoque += item.estoqueAtual + item.estoqueTransito
      cells[key].sumDDV += item.ddvPrevisto
    })
    const get = (c, loja) => {
      const cell = cells[`${c}|${loja}`]
      if (!cell) return null              // sem itens nessa classe/loja
      if (!(cell.sumDDV > 0)) return null  // tem estoque mas sem demanda: cobertura indefinida
      return Math.round((cell.sumEstoque / cell.sumDDV) * 10) / 10
    }
    return { stores, get }
  }, [items, stores])

  const maxCoverage = Math.max(
    targetCoverage * 2.5,
    ...classData.map(c => c.avgCoverage)
  )

  const classes = classData.map(c => c.classe)

  return (
    <div className="space-y-6">
      {/* Per-class cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Cobertura por Classe</h3>
            <span className="text-xs text-gray-500 ml-1">
              (meta por classe{selectedStore !== 'all' ? ` · ${selectedStore}` : ''})
            </span>
          </div>
          <div className="relative">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="pl-3 pr-9 py-2 text-sm text-white
                bg-[#1a1a2e] border border-white/10 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                appearance-none cursor-pointer
                [&>option]:bg-[#1a1a2e] [&>option]:text-white [&>option]:py-2
              "
            >
              <option value="all">Todas as lojas</option>
              {stores.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {classData.map(c => (
            <div
              key={c.classe}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-sm font-bold rounded border ${classBadgeColor(c.classe)}`}>
                    {c.classe === 'Sem classe' ? '—' : c.classe}
                  </span>
                  <span className="text-sm text-gray-300">
                    {c.classe === 'Sem classe' ? 'Sem classe' : `Classe ${c.classe}`}
                  </span>
                </div>
                <span className="text-xs text-gray-600">{c.total} SKUs</span>
              </div>

              <div className="flex items-end justify-between mb-2">
                <span className="text-xs text-gray-500">
                  Cobertura média <span className="text-gray-600">(meta {c.meta}d)</span>
                </span>
                <span className={`text-2xl font-bold ${coverageColor(c.avgCoverage, c.meta)}`}>
                  {c.avgCoverage}d
                </span>
              </div>
              <CoverageBar value={c.avgCoverage} target={c.meta} max={maxCoverage} />

              <div className="flex items-center justify-between mt-3 text-xs">
                <span className="text-gray-500">
                  DDV médio: <span className="text-violet-300 font-medium">{c.avgDDV || '—'}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-red-400" title="Comprar">{c.needToBuy}</span>
                  <span className="text-gray-700">·</span>
                  <span className="text-emerald-400" title="Saudável">{c.healthy}</span>
                  <span className="text-gray-700">·</span>
                  <span className="text-purple-400" title="Excesso">{c.hasExcess}</span>
                  {c.semPrevisao > 0 && (
                    <>
                      <span className="text-gray-700">·</span>
                      <span className="text-gray-500" title="Sem previsão (sem DDV)">{c.semPrevisao}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
          <span className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Abaixo de 75% da meta
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Saudável (75–100%)
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Excesso (100–200%)
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Excesso alto (&gt;200%)
          </span>
          <span className="text-xs text-gray-500 ml-auto">Comprar / Saudável / Excesso / Sem prev.</span>
        </div>
      </motion.div>

      {/* Class x Store matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-5">
          <Grid3x3 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Cobertura média: Classe × Loja</h3>
          <span className="text-xs text-gray-500 ml-1">(dias)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#1a1a2e] px-3 py-2 text-left text-xs font-semibold text-gray-400 uppercase">
                  Classe
                </th>
                {matrix.stores.map(loja => (
                  <th
                    key={loja}
                    className="px-3 py-2 text-center text-xs font-semibold text-gray-400 truncate max-w-[120px]"
                    title={loja}
                  >
                    {loja}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c} className="border-t border-white/5">
                  <td className="sticky left-0 z-10 bg-[#1a1a2e] px-3 py-2 whitespace-nowrap">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${classBadgeColor(c)}`}>
                      {c === 'Sem classe' ? '—' : c}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">meta {metaDaClasse(c, targetCoverage)}d</span>
                  </td>
                  {matrix.stores.map(loja => {
                    const val = matrix.get(c, loja)
                    return (
                      <td key={loja} className="px-3 py-2 text-center">
                        {val === null ? (
                          <span className="text-gray-700">·</span>
                        ) : (
                          <span className={`text-sm font-medium ${coverageColor(val, metaDaClasse(c, targetCoverage))}`}>
                            {val}d
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

export default ClassCoverage
