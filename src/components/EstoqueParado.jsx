import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PackageX, ChevronDown } from 'lucide-react'
import DataTable from './DataTable'

const THRESHOLDS = [120, 180, 365]

function EstoqueParado({ items, targetCoverage }) {
  const [threshold, setThreshold] = useState(180)

  // Total de SKUs por loja (denominador do "% do mix")
  const storeTotals = useMemo(() => {
    const t = {}
    items.forEach(i => { t[i.loja] = (t[i.loja] || 0) + 1 })
    return t
  }, [items])

  // "Parado" = tem estoque e cobertura projetada acima do limite (giro muito lento)
  const parado = useMemo(
    () => items.filter(i => i.estoqueAtual > 0 && i.coberturaProjetada > threshold),
    [items, threshold]
  )

  const ranking = useMemo(() => {
    const counts = {}
    parado.forEach(i => { counts[i.loja] = (counts[i.loja] || 0) + 1 })
    return Object.entries(counts)
      .map(([loja, count]) => ({
        loja,
        count,
        total: storeTotals[loja] || 0,
        pct: storeTotals[loja] ? Math.round((count / storeTotals[loja]) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [parado, storeTotals])

  const maxCount = Math.max(1, ...ranking.map(r => r.count))

  return (
    <div className="space-y-6">
      {/* Store ranking */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <PackageX className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Lojas com mais estoque parado</h3>
          </div>
          <div className="relative">
            <select
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="pl-3 pr-9 py-2 text-sm text-white
                bg-[#1a1a2e] border border-white/10 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50
                appearance-none cursor-pointer
                [&>option]:bg-[#1a1a2e] [&>option]:text-white [&>option]:py-2
              "
            >
              {THRESHOLDS.map(t => (
                <option key={t} value={t}>Cobertura &gt; {t} dias</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          {parado.length} itens parados — estoque em mãos com cobertura acima de {threshold} dias (giro muito lento)
        </p>

        {ranking.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Nenhum item com cobertura acima de {threshold} dias.
          </p>
        ) : (
          <div className="space-y-3">
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
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs text-gray-500">{r.pct}% do mix</span>
                    <span className={`text-sm font-semibold w-12 text-right ${idx === 0 ? 'text-red-400' : 'text-amber-400'}`}>
                      {r.count}
                    </span>
                  </div>
                </div>
                <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${idx === 0 ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${Math.round((r.count / maxCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
          <span className="text-xs text-gray-600">
            Barra = quantidade de itens parados · % do mix = parados ÷ total de SKUs da loja
          </span>
        </div>
      </motion.div>

      {/* Items table (reuses the full table with sorting, filters and export) */}
      <DataTable items={parado} targetCoverage={targetCoverage} />
    </div>
  )
}

export default EstoqueParado
