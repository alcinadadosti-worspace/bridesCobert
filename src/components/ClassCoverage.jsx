import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Layers, Grid3x3 } from 'lucide-react'

// Cores por classe (mesmo padrão usado na tabela de dados)
const CLASS_COLORS = {
  A: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  B: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  C: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
}

function classBadgeColor(c) {
  return CLASS_COLORS[c] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

function coverageColor(value, target) {
  if (value === 0) return 'text-gray-600'
  if (value < target * 0.75) return 'text-red-400'
  if (value < target) return 'text-amber-400'
  if (value > target * 2) return 'text-purple-400'
  return 'text-emerald-400'
}

function CoverageBar({ value, target, max }) {
  const cappedValue = Math.min(value, max)
  const pct = max > 0 ? Math.round((cappedValue / max) * 100) : 0
  const targetPct = max > 0 ? Math.round((target / max) * 100) : 0
  const color = value === 0 ? 'bg-gray-600' :
    value < target * 0.75 ? 'bg-red-500' :
    value < target ? 'bg-amber-500' :
    value > target * 2 ? 'bg-purple-500' :
    'bg-emerald-500'

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
  const classData = useMemo(() => {
    const groups = {}
    items.forEach(item => {
      const key = item.classe || 'Sem classe'
      if (!groups[key]) {
        groups[key] = {
          classe: key,
          total: 0,
          needToBuy: 0,
          healthy: 0,
          hasExcess: 0,
          sumCov: 0,
          sumDDV: 0,
          ddvCount: 0,
        }
      }
      const g = groups[key]
      g.total++
      g.sumCov += item.coberturaProjetada
      if (item.ddvPrevisto > 0) {
        g.sumDDV += item.ddvPrevisto
        g.ddvCount++
      }
      if (item.needsToBuy) g.needToBuy++
      else if (item.hasExcess) g.hasExcess++
      else g.healthy++
    })

    return Object.values(groups)
      .map(g => ({
        ...g,
        avgCoverage: g.total ? Math.round((g.sumCov / g.total) * 10) / 10 : 0,
        avgDDV: g.ddvCount ? Math.round((g.sumDDV / g.ddvCount) * 100) / 100 : 0,
      }))
      .sort((a, b) => sortClasses(a.classe, b.classe))
  }, [items])

  const matrix = useMemo(() => {
    const stores = [...new Set(items.map(i => i.loja))].sort()
    const cells = {}
    items.forEach(item => {
      const c = item.classe || 'Sem classe'
      const key = `${c}|${item.loja}`
      if (!cells[key]) cells[key] = { sum: 0, count: 0 }
      cells[key].sum += item.coberturaProjetada
      cells[key].count++
    })
    const get = (c, loja) => {
      const cell = cells[`${c}|${loja}`]
      return cell ? Math.round((cell.sum / cell.count) * 10) / 10 : null
    }
    return { stores, get }
  }, [items])

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
        <div className="flex items-center gap-2 mb-5">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Cobertura por Classe</h3>
          <span className="text-xs text-gray-500 ml-1">(meta: {targetCoverage}d)</span>
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
                <span className="text-xs text-gray-500">Cobertura média</span>
                <span className={`text-2xl font-bold ${coverageColor(c.avgCoverage, targetCoverage)}`}>
                  {c.avgCoverage}d
                </span>
              </div>
              <CoverageBar value={c.avgCoverage} target={targetCoverage} max={maxCoverage} />

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
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> 75–100% da meta
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Dentro da meta
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Acima de 200% da meta
          </span>
          <span className="text-xs text-gray-500 ml-auto">Comprar / Saudável / Excesso</span>
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
                  <td className="sticky left-0 z-10 bg-[#1a1a2e] px-3 py-2">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded border ${classBadgeColor(c)}`}>
                      {c === 'Sem classe' ? '—' : c}
                    </span>
                  </td>
                  {matrix.stores.map(loja => {
                    const val = matrix.get(c, loja)
                    return (
                      <td key={loja} className="px-3 py-2 text-center">
                        {val === null ? (
                          <span className="text-gray-700">·</span>
                        ) : (
                          <span className={`text-sm font-medium ${coverageColor(val, targetCoverage)}`}>
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
