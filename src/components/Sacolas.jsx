import { useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Upload, AlertCircle, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react'
import { useFileDrop } from '../hooks/useFileDrop'
import { parseSacolasFile, analisaSacolas } from '../utils/parseSpreadsheet'

const SIZES = [['pp', 'PP'], ['p', 'P'], ['m', 'M'], ['g', 'G']]

function Sacolas() {
  const fileRef = useRef(null)
  const [rows, setRows] = useState(null)
  const [fileName, setFileName] = useState('')
  const [bags, setBags] = useState({}) // { unidade: { pp, p, m, g } }
  const [processing, setProcessing] = useState(false)

  const handleFile = async (file) => {
    setProcessing(true)
    try {
      const r = await parseSacolasFile(file)
      setRows(r)
      setFileName(file.name)
      setBags({})
    } catch (e) {
      alert(e.message)
    } finally {
      setProcessing(false)
    }
  }
  const { isDragging, error, clearError, handlers, handleFileInput } = useFileDrop(handleFile)

  const analise = useMemo(() => (rows ? analisaSacolas(rows) : []), [rows])

  const setBag = (uni, size, val) =>
    setBags((prev) => ({
      ...prev,
      [uni]: { ...(prev[uni] || {}), [size]: val.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '') },
    }))
  const usadas = (uni) => SIZES.reduce((a, [k]) => a + (parseInt(bags[uni]?.[k], 10) || 0), 0)

  const totalNec = analise.reduce((a, u) => a + u.necessarias, 0)
  const totalUsadas = analise.reduce((a, u) => a + usadas(u.unidade), 0)
  const reset = () => { setRows(null); setBags({}); setFileName('') }

  // ---- Upload ----
  if (!rows) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Conferência de Sacolas</h3>
        </div>
        <p className="text-xs text-gray-500 mb-5">
          Regra: a cada <b className="text-gray-300">3 itens</b> = 1 sacola · suporte à venda não conta ·
          Kit/Combo/Estojo = 1 sacola por item. Suba a planilha de itens (formato <b className="text-gray-300">itens_month</b> ou <b className="text-gray-300">presencial</b>).
        </p>
        <div
          {...handlers}
          onClick={() => fileRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors
            ${isDragging ? 'border-primary-500/60 bg-primary-500/10' : 'border-white/15 hover:border-white/30 hover:bg-white/[0.03]'}`}
        >
          <Upload className="w-10 h-10 text-primary-400 mx-auto mb-3" />
          <p className="text-white font-medium">
            {processing ? 'Processando...' : 'Arraste a planilha ou clique para selecionar'}
          </p>
          <p className="text-xs text-gray-500 mt-1">.xlsx, .xls ou .csv</p>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
        </div>
        {error && (
          <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
            <button onClick={clearError} className="ml-auto text-red-400">&times;</button>
          </div>
        )}
      </motion.div>
    )
  }

  // ---- Resultado ----
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Conferência de Sacolas</h3>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4" /> Trocar planilha
        </button>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        {fileName} — informe quantas sacolas de cada tamanho (PP/P/M/G) foram usadas por loja; o app compara com o necessário pela regra.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="text-gray-400 text-xs uppercase">
              <th className="px-3 py-2 text-left">Unidade</th>
              <th className="px-3 py-2 text-right">Itens (÷3)</th>
              <th className="px-3 py-2 text-right">Especiais</th>
              <th className="px-3 py-2 text-right">Suporte</th>
              <th className="px-3 py-2 text-right">Necessárias</th>
              <th className="px-2 py-2 text-center">PP</th>
              <th className="px-2 py-2 text-center">P</th>
              <th className="px-2 py-2 text-center">M</th>
              <th className="px-2 py-2 text-center">G</th>
              <th className="px-3 py-2 text-right">Usadas</th>
              <th className="px-3 py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {analise.map((u) => {
              const usd = usadas(u.unidade)
              const dif = usd - u.necessarias
              const status = usd === u.necessarias ? 'ok' : usd < u.necessarias ? 'faltou' : 'excesso'
              return (
                <tr key={u.unidade} className="border-t border-white/5">
                  <td className="px-3 py-2 text-cyan-400 font-medium whitespace-nowrap">{u.unidade}</td>
                  <td className="px-3 py-2 text-right text-gray-300">
                    {u.regular.toLocaleString('pt-BR')} <span className="text-gray-600">→ {Math.floor(u.regular / 3)}</span>
                  </td>
                  <td className="px-3 py-2 text-right text-gray-300">{u.especial.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{u.suporte.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 text-right font-bold text-white">{u.necessarias.toLocaleString('pt-BR')}</td>
                  {SIZES.map(([k]) => (
                    <td key={k} className="px-1 py-2">
                      <input
                        type="text"
                        inputMode="numeric"
                        value={bags[u.unidade]?.[k] ?? ''}
                        onChange={(e) => setBag(u.unidade, k, e.target.value)}
                        placeholder="0"
                        className="w-12 px-1 py-1 text-center text-white bg-[#1a1a2e] border border-white/10 rounded
                          focus:outline-none focus:ring-1 focus:ring-primary-500/50"
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2 text-right font-semibold text-white">{usd.toLocaleString('pt-BR')}</td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {status === 'ok' ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" /> OK
                      </span>
                    ) : (
                      <span className={`inline-flex items-center gap-1 ${status === 'faltou' ? 'text-red-400' : 'text-amber-400'}`}>
                        <AlertTriangle className="w-4 h-4" /> {status === 'faltou' ? 'Faltou' : 'Excesso'} {dif > 0 ? '+' : ''}{dif}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 font-semibold">
              <td className="px-3 py-2 text-gray-300">Total</td>
              <td colSpan={3}></td>
              <td className="px-3 py-2 text-right text-white">{totalNec.toLocaleString('pt-BR')}</td>
              <td colSpan={4}></td>
              <td className="px-3 py-2 text-right text-white">{totalUsadas.toLocaleString('pt-BR')}</td>
              <td className="px-3 py-2 text-center whitespace-nowrap">
                {totalUsadas === totalNec ? (
                  <span className="text-emerald-400">OK</span>
                ) : (
                  <span className={totalUsadas < totalNec ? 'text-red-400' : 'text-amber-400'}>
                    {totalUsadas < totalNec ? 'Faltou' : 'Excesso'} {totalUsadas - totalNec > 0 ? '+' : ''}{totalUsadas - totalNec}
                  </span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-white/5">
        <span className="text-xs text-gray-600">
          Itens (÷3) = produtos regulares (floor da qtd ÷ 3) · Especiais = Kit/Combo/Estojo (1 sacola cada) · Suporte à venda fica fora do cálculo
        </span>
      </div>
    </motion.div>
  )
}

export default Sacolas
