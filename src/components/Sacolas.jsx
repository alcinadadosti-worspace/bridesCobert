import { useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Upload, AlertCircle, CheckCircle2, AlertTriangle, RotateCcw, Store, Package, BarChart3 } from 'lucide-react'
import { useFileDrop } from '../hooks/useFileDrop'
import { parseSacolasFile, analisaSacolas } from '../utils/parseSpreadsheet'

const SIZES = [['pp', 'PP'], ['p', 'P'], ['m', 'M'], ['g', 'G']]

// status a partir de (usadas x necessárias)
function statusDe(usadas, necessarias) {
  const dif = usadas - necessarias
  if (usadas === necessarias) return { key: 'ok', dif, label: 'Regra OK', text: 'text-emerald-400', bar: 'bg-emerald-500', badge: 'bg-emerald-500/15 border-emerald-500/30', ring: 'ring-emerald-500/25', Icon: CheckCircle2 }
  if (usadas < necessarias) return { key: 'faltou', dif, label: `Faltou ${Math.abs(dif).toLocaleString('pt-BR')}`, text: 'text-red-400', bar: 'bg-red-500', badge: 'bg-red-500/15 border-red-500/30', ring: 'ring-red-500/25', Icon: AlertTriangle }
  return { key: 'excesso', dif, label: `Excesso +${dif.toLocaleString('pt-BR')}`, text: 'text-amber-400', bar: 'bg-amber-500', badge: 'bg-amber-500/15 border-amber-500/30', ring: 'ring-amber-500/25', Icon: AlertTriangle }
}

function SummaryTile({ label, value, icon: Icon, tone }) {
  const map = {
    gold: ['text-gold-400', 'bg-gold-500/15'],
    green: ['text-primary-400', 'bg-primary-500/15'],
  }
  const [tc, bc] = map[tone] || ['text-gray-300', 'bg-white/10']
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${bc}`}>
        <Icon className={`w-5 h-5 ${tc}`} />
      </div>
      <div className="min-w-0">
        <span className={`text-2xl font-bold ${tc}`}>{value.toLocaleString('pt-BR')}</span>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  )
}

function StatusTile({ usadas, necessarias }) {
  const s = statusDe(usadas, necessarias)
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.badge} border`}>
        <s.Icon className={`w-5 h-5 ${s.text}`} />
      </div>
      <div className="min-w-0">
        <span className={`text-lg font-bold ${s.text}`}>{s.key === 'ok' ? 'Tudo certo' : s.label}</span>
        <p className="text-xs text-gray-400">Status geral (usadas × necessárias)</p>
      </div>
    </div>
  )
}

function StoreCard({ u, valores, onSet, usadas }) {
  const s = statusDe(usadas, u.necessarias)
  const max = Math.max(u.necessarias, usadas, 1)
  const fillPct = Math.round((usadas / max) * 100)
  const markPct = Math.round((u.necessarias / max) * 100)
  const regSac = Math.floor(u.regular / 3)

  return (
    <div className={`glass rounded-2xl p-5 ring-1 ${s.ring}`}>
      {/* header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="w-4 h-4 text-gold-400 shrink-0" />
          <span className="text-white font-semibold truncate">{u.unidade}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${s.badge} ${s.text}`}>
          <s.Icon className="w-3.5 h-3.5" /> {s.label}
        </span>
      </div>

      {/* números + barra */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <p className="text-[11px] text-gray-500 uppercase tracking-wide">Usadas / Necessárias</p>
          <p className="text-2xl font-bold text-white">
            {usadas.toLocaleString('pt-BR')}
            <span className="text-gray-500 text-lg font-medium"> / {u.necessarias.toLocaleString('pt-BR')}</span>
          </p>
        </div>
      </div>
      <div className="relative h-2.5 bg-white/10 rounded-full overflow-visible mb-1">
        <div className={`h-full rounded-full transition-all duration-500 ${s.bar}`} style={{ width: `${Math.min(fillPct, 100)}%` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-white/60 rounded-full" style={{ left: `${markPct}%` }} title="Necessárias (meta)" />
      </div>
      <p className="text-[11px] text-gray-600 mb-4">Barra = usadas · marca branca = necessárias</p>

      {/* detalhamento */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-300">
          Regulares <b className="text-white">{u.regular.toLocaleString('pt-BR')}</b> ÷3 → <b className="text-white">{regSac.toLocaleString('pt-BR')}</b>
        </span>
        <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-300">
          Especiais <b className="text-white">{u.especial.toLocaleString('pt-BR')}</b> ×1
        </span>
        {u.suporte > 0 && (
          <span className="px-2 py-1 rounded-lg bg-white/5 text-gray-500">
            Suporte {u.suporte.toLocaleString('pt-BR')} (fora)
          </span>
        )}
      </div>

      {/* inputs */}
      <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-2">Sacolas usadas por tamanho</p>
      <div className="grid grid-cols-4 gap-2">
        {SIZES.map(([k, label]) => (
          <div key={k}>
            <label className="block text-[10px] text-gray-500 mb-1 text-center">{label}</label>
            <input
              type="text"
              inputMode="numeric"
              value={valores?.[k] ?? ''}
              onChange={(e) => onSet(k, e.target.value)}
              placeholder="0"
              className="w-full px-2 py-1.5 text-center text-white bg-[#0f1a14] border border-white/10 rounded-lg
                focus:outline-none focus:ring-1 focus:ring-primary-500/50"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Cores da marca — verde nobre + ouro (validate_palette.js, modo dark).
// Visão normal e CVD OK com os rótulos diretos das barras; o ouro fica no limite da
// faixa de luminosidade de propósito, por ser cor de marca (contraste/separação preservados).
const COR = { necessarias: '#bd932e', usadas: '#3aa870', regulares: '#3aa870', especiais: '#bd932e' }

function LegItem({ cor, label }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-400">
      <span className="w-3 h-3 rounded-sm" style={{ background: cor }} /> {label}
    </span>
  )
}

// Gráfico: barras agrupadas comparando Necessárias x Usadas por loja
function GraficoNecUsadas({ analise, usadasFn }) {
  const max = Math.max(1, ...analise.map((u) => Math.max(u.necessarias, usadasFn(u.unidade))))
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <LegItem cor={COR.necessarias} label="Necessárias" />
        <LegItem cor={COR.usadas} label="Usadas" />
      </div>
      <div className="space-y-4">
        {analise.map((u) => {
          const usd = usadasFn(u.unidade)
          return (
            <div key={u.unidade}>
              <div className="text-xs text-gray-300 mb-1 truncate">{u.unidade}</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(u.necessarias / max) * 100}%`, background: COR.necessarias }} title={`Necessárias: ${u.necessarias.toLocaleString('pt-BR')}`} />
                </div>
                <span className="w-16 text-right text-xs text-gray-400 tabular-nums">{u.necessarias.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(usd / max) * 100}%`, background: COR.usadas }} title={`Usadas: ${usd.toLocaleString('pt-BR')}`} />
                </div>
                <span className="w-16 text-right text-xs text-gray-400 tabular-nums">{usd.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Gráfico: composição das sacolas necessárias (Regulares ÷3 + Especiais), empilhado por loja
function GraficoComposicao({ analise }) {
  const max = Math.max(1, ...analise.map((u) => u.necessarias))
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <LegItem cor={COR.regulares} label="Regulares (÷3)" />
        <LegItem cor={COR.especiais} label="Especiais (×1)" />
      </div>
      <div className="space-y-4">
        {analise.map((u) => {
          const reg = Math.floor(u.regular / 3)
          return (
            <div key={u.unidade}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-300 truncate">{u.unidade}</span>
                <span className="text-gray-400 tabular-nums">{u.necessarias.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex h-3 rounded-full overflow-hidden bg-white/5">
                <div className="h-full transition-all duration-500" style={{ width: `${(reg / max) * 100}%`, background: COR.regulares }} title={`Regulares: ${reg.toLocaleString('pt-BR')}`} />
                <div className="h-full transition-all duration-500" style={{ width: `${(u.especial / max) * 100}%`, background: COR.especiais, marginLeft: reg > 0 && u.especial > 0 ? '2px' : 0 }} title={`Especiais: ${u.especial.toLocaleString('pt-BR')}`} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

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
          <ShoppingBag className="w-5 h-5 text-gold-400" />
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
    <div className="space-y-6">
      {/* Resumo */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBag className="w-5 h-5 text-gold-400 shrink-0" />
            <h3 className="text-lg font-semibold text-white">Conferência de Sacolas</h3>
            <span className="text-xs text-gray-500 ml-1 truncate max-w-[220px]" title={fileName}>{fileName}</span>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Trocar planilha
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryTile label="Sacolas necessárias" value={totalNec} icon={ShoppingBag} tone="gold" />
          <SummaryTile label="Sacolas usadas (informadas)" value={totalUsadas} icon={Package} tone="green" />
          <StatusTile usadas={totalUsadas} necessarias={totalNec} />
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Regra: a cada 3 itens = 1 sacola · Kit/Combo/Estojo = 1 por item · suporte à venda fica fora. Informe as sacolas usadas por loja nos cards abaixo.
        </p>
      </motion.div>

      {/* Gráficos */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <BarChart3 className="w-5 h-5 text-gold-400" />
          <h4 className="text-base font-semibold text-white">Visão geral</h4>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-8">
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-3">Necessárias × Usadas por loja</p>
            <GraficoNecUsadas analise={analise} usadasFn={usadas} />
          </div>
          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-3">De onde vêm as sacolas necessárias</p>
            <GraficoComposicao analise={analise} />
          </div>
        </div>
      </motion.div>

      {/* Cards por loja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {analise.map((u) => (
          <StoreCard
            key={u.unidade}
            u={u}
            valores={bags[u.unidade]}
            usadas={usadas(u.unidade)}
            onSet={(size, val) => setBag(u.unidade, size, val)}
          />
        ))}
      </div>
    </div>
  )
}

export default Sacolas
