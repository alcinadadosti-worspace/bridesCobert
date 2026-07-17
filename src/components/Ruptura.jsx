import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { AlertOctagon, TrendingDown, Truck } from 'lucide-react'
import DataTable from './DataTable'

function StatTile({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color.bg} shrink-0`}>
        <Icon className={`w-5 h-5 ${color.text}`} />
      </div>
      <div className="min-w-0">
        <span className={`text-2xl font-bold ${color.text}`}>{value}</span>
        <p className="text-xs text-gray-400">{label}</p>
        {sub && <p className="text-[11px] text-gray-500">{sub}</p>}
      </div>
    </div>
  )
}

function Ruptura({ items, targetCoverage }) {
  // Ruptura = tem previsão de venda (DDV) mas está sem estoque em mãos
  const ruptura = useMemo(
    () => items.filter(i => i.ddvPrevisto > 0 && i.estoqueAtual <= 0),
    [items]
  )

  // Total de SKUs por loja (denominador do "% do mix")
  const storeTotals = useMemo(() => {
    const t = {}
    items.forEach(i => { t[i.loja] = (t[i.loja] || 0) + 1 })
    return t
  }, [items])

  // DDV/dia total parado por ruptura (demanda que não está sendo atendida)
  const totalDDV = useMemo(
    () => Math.round(ruptura.reduce((a, i) => a + i.ddvPrevisto, 0) * 10) / 10,
    [ruptura]
  )

  // Ruptura crítica: sem nada em trânsito nem pendente para repor
  const semReposicao = useMemo(
    () => ruptura.filter(i => i.estoqueTransito <= 0 && i.pedidoPendente <= 0).length,
    [ruptura]
  )

  const ranking = useMemo(() => {
    const acc = {}
    ruptura.forEach(i => {
      if (!acc[i.loja]) acc[i.loja] = { loja: i.loja, count: 0, ddv: 0 }
      acc[i.loja].count++
      acc[i.loja].ddv += i.ddvPrevisto
    })
    return Object.values(acc)
      .map(r => ({
        ...r,
        ddv: Math.round(r.ddv * 10) / 10,
        pct: storeTotals[r.loja] ? Math.round((r.count / storeTotals[r.loja]) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.count - a.count)
  }, [ruptura, storeTotals])

  const maxCount = Math.max(1, ...ranking.map(r => r.count))

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-1">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <h3 className="text-lg font-semibold text-white">Ruptura de Estoque</h3>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Itens com previsão de venda (DDV) mas sem estoque em mãos — venda que está sendo perdida agora.
        </p>

        {ruptura.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">
            Nenhum item em ruptura — todo item com previsão de venda tem estoque em mãos. 🎉
          </p>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatTile
                icon={AlertOctagon}
                label="Itens em ruptura"
                value={ruptura.length.toLocaleString('pt-BR')}
                color={{ bg: 'bg-red-500/20', text: 'text-red-400' }}
              />
              <StatTile
                icon={TrendingDown}
                label="DDV/dia em risco"
                value={totalDDV.toLocaleString('pt-BR')}
                sub="demanda diária não atendida"
                color={{ bg: 'bg-amber-500/20', text: 'text-amber-400' }}
              />
              <StatTile
                icon={Truck}
                label="Sem reposição a caminho"
                value={semReposicao.toLocaleString('pt-BR')}
                sub="nada em trânsito nem pendente"
                color={{ bg: 'bg-red-500/20', text: 'text-red-400' }}
              />
            </div>

            {/* Ranking por loja */}
            <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Ruptura por loja</p>
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
                      <span className="text-xs text-gray-500">{r.pct}% do mix · {r.ddv} DDV</span>
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

            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-gray-600">
                Barra = itens em ruptura · % do mix = ruptura ÷ total de SKUs da loja · DDV = demanda diária parada
              </span>
            </div>
          </>
        )}
      </motion.div>

      {/* Tabela dos itens em ruptura (reusa a tabela com filtros, ordenação e export) */}
      {ruptura.length > 0 && (
        <DataTable items={ruptura} targetCoverage={targetCoverage} />
      )}
    </div>
  )
}

export default Ruptura
