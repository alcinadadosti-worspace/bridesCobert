import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { History, ChevronLeft, ChevronRight, LogOut, Store, ShoppingCart, Trash2, Plus, Save, AlertCircle, CheckCircle2, ClipboardCheck, Lock } from 'lucide-react'
import { observarUsuario, entrar, sair, observarRegistros, salvarRegistros, excluirRegistro } from '../lib/sacolasCloud'
import { STORE_NAMES } from '../utils/parseSpreadsheet'
import {
  TAMANHOS, JANELA_MESES, mesAtual, somaMes, nomeMes, canonLoja, idRegistro,
  indexa, calculaMes, metaProximoMes, totaisDoMes,
} from '../utils/sacolasHistorico'

const CAMPOS = ['inicial', 'compradas', 'sobra']
const chave = (mes, loja) => `${mes}|${loja}`
const fmt = (v) => (v === null || v === undefined ? '—' : v.toLocaleString('pt-BR'))
const limpa = (v) => v.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '')
const paraNum = (mapa) => Object.fromEntries(TAMANHOS.map(([k]) => [k, mapa?.[k] === '' || mapa?.[k] == null ? null : parseInt(mapa[k], 10)]))
const paraTexto = (mapa) => Object.fromEntries(TAMANHOS.map(([k]) => [k, mapa?.[k] == null ? '' : String(mapa[k])]))
const rascunhoDe = (reg) => Object.fromEntries(CAMPOS.map((c) => [c, paraTexto(reg?.[c])]))
const mesmoValor = (rasc, reg) => CAMPOS.every((c) => TAMANHOS.every(([k]) => paraNum(rasc[c])[k] === (reg?.[c]?.[k] ?? null)))

const MARGEM_KEY = 'sacolas.margem'
function lerMargem() {
  try { const v = parseInt(localStorage.getItem(MARGEM_KEY), 10); return Number.isFinite(v) ? v : 10 } catch { return 10 }
}

const MSG_LOGIN = {
  'auth/unauthorized-domain': 'Este endereço do site ainda não está liberado no Firebase (Authentication → Settings → Authorized domains).',
  'auth/popup-blocked': 'O navegador bloqueou a janela de login. Libere pop-ups para este site e tente de novo.',
  'auth/operation-not-allowed': 'O login com Google não está ativado no Firebase (Authentication → Sign-in method).',
}

// ---------- telas de acesso ----------
function TelaLogin({ onEntrar, erro, entrando }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-gold-400" />
        <h3 className="text-lg font-semibold text-white">Histórico de sacolas</h3>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        Compras e sobras de cada mês ficam salvas na nuvem, por loja e tamanho. Com elas o app calcula
        quanto foi consumido e quanto comprar no mês seguinte. Entre com a conta Google cadastrada para acessar.
      </p>
      <button
        onClick={onEntrar}
        disabled={entrando}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60"
      >
        <Lock className="w-4 h-4" /> {entrando ? 'Abrindo login…' : 'Entrar com Google'}
      </button>
      {erro && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-sm text-red-300">{erro}</span>
        </div>
      )}
    </motion.div>
  )
}

function TelaSemAcesso({ email, onSair }) {
  return (
    <div className="glass rounded-2xl p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Sem acesso ao histórico</h3>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        A conta <b className="text-gray-200">{email}</b> ainda não está cadastrada. Peça para quem administra o
        Firebase criar um documento com este e-mail na coleção <code className="text-gray-300">permitidos</code>.
      </p>
      <button onClick={onSair} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
        <LogOut className="w-4 h-4" /> Entrar com outra conta
      </button>
    </div>
  )
}

// ---------- lançamento por loja ----------
function Celula({ valor, onChange, label }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={valor}
      onChange={(e) => onChange(limpa(e.target.value))}
      placeholder="—"
      className="w-full min-w-0 px-1 py-1.5 text-center text-sm text-white bg-[#0f1a14] border border-white/10 rounded-lg
        placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
    />
  )
}

function CartaoLoja({ loja, mes, calc, valores, onSet, onExcluir, podeExcluir }) {
  const mesAnt = nomeMes(somaMes(mes, -1))
  const linha = 'grid grid-cols-[4.75rem_repeat(5,minmax(0,1fr))] gap-1.5 items-center'
  const consumoTotal = calc.total.consumo
  const difRegra = consumoTotal !== null && calc.necessarias !== null ? consumoTotal - calc.necessarias : null

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="w-4 h-4 text-gold-400 shrink-0" />
          <span className="text-white font-semibold truncate">{loja}</span>
        </div>
        {podeExcluir && (
          <button onClick={onExcluir} title={`Apagar o lançamento de ${nomeMes(mes)} desta loja`} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className={`${linha} mb-1.5`}>
        <span />
        {TAMANHOS.map(([k, l]) => <span key={k} className="text-[11px] text-gray-500 text-center">{l}</span>)}
        <span className="text-[11px] text-gray-500 text-center">Total</span>
      </div>

      {/* início do mês: herda a sobra do mês anterior; sem ela, digita */}
      <div className={`${linha} mb-1.5`}>
        <span className="text-xs text-gray-400 leading-tight">Início do mês</span>
        {TAMANHOS.map(([k, l]) => calc.inicialHerdado[k] ? (
          <span key={k} className="text-sm text-gray-300 text-center tabular-nums" title={`Sobra do fim de ${mesAnt}`}>{fmt(calc.inicial[k])}</span>
        ) : (
          <Celula key={k} label={`Início do mês ${l}`} valor={valores.inicial[k]} onChange={(v) => onSet('inicial', k, v)} />
        ))}
        <span className="text-sm text-gray-400 text-center tabular-nums">{fmt(calc.total.inicial)}</span>
      </div>

      <div className={`${linha} mb-1.5`}>
        <span className="text-xs text-gray-400 leading-tight">Compradas</span>
        {TAMANHOS.map(([k, l]) => <Celula key={k} label={`Compradas ${l}`} valor={valores.compradas[k]} onChange={(v) => onSet('compradas', k, v)} />)}
        <span className="text-sm text-gray-400 text-center tabular-nums">{fmt(calc.total.compradas)}</span>
      </div>

      <div className={`${linha} mb-3`}>
        <span className="text-xs text-gray-400 leading-tight">Sobra no fim</span>
        {TAMANHOS.map(([k, l]) => <Celula key={k} label={`Sobra no fim ${l}`} valor={valores.sobra[k]} onChange={(v) => onSet('sobra', k, v)} />)}
        <span className="text-sm text-gray-400 text-center tabular-nums">{fmt(calc.total.sobra)}</span>
      </div>

      <div className={`${linha} pt-3 border-t border-white/10`}>
        <span className="text-xs font-medium text-white">Consumo</span>
        {TAMANHOS.map(([k]) => {
          const c = calc.consumo[k]
          return (
            <span key={k} className={`text-sm font-semibold text-center tabular-nums ${c !== null && c < 0 ? 'text-red-400' : 'text-white'}`} title={c !== null && c < 0 ? 'Consumo negativo: confira os números' : undefined}>
              {fmt(c)}
            </span>
          )
        })}
        <span className="text-sm font-semibold text-gold-300 text-center tabular-nums">{fmt(consumoTotal)}</span>
      </div>

      {calc.necessarias !== null && (
        <p className="mt-3 text-xs text-gray-500">
          Regra da conferência: <b className="text-gray-300">{fmt(calc.necessarias)}</b> sacolas
          {difRegra !== null && (
            <span className={difRegra === 0 ? 'text-emerald-400' : difRegra > 0 ? 'text-amber-400' : 'text-red-400'}>
              {' · '}{difRegra === 0 ? 'consumo bateu com a regra' : difRegra > 0 ? `consumo ${fmt(difRegra)} acima da regra` : `consumo ${fmt(-difRegra)} abaixo da regra`}
            </span>
          )}
        </p>
      )}
    </div>
  )
}

// ---------- meta do mês seguinte ----------
const MOTIVO = { 'sem-sobra': 'falta a sobra do fim do mês', 'sem-consumo': 'ainda sem consumo calculado' }

function TabelaMeta({ lojas, idx, mes, margem, setMargem }) {
  const prox = nomeMes(somaMes(mes, 1))
  const linhas = lojas.map((loja) => ({ loja, meta: metaProximoMes(idx, mes, loja, margem) }))
  const totalTam = Object.fromEntries(TAMANHOS.map(([k]) => {
    const vals = linhas.map((l) => l.meta[k].meta).filter((v) => v !== null)
    return [k, vals.length ? vals.reduce((a, v) => a + v, 0) : null]
  }))
  const total = linhas.reduce((a, l) => a + (l.meta.total || 0), 0)
  const pendentes = linhas.filter((l) => l.meta.pendente)
  const temAlguma = linhas.some((l) => TAMANHOS.some(([k]) => l.meta[k].meta !== null))
  const dica = (m) => m.meta === null
    ? MOTIVO[m.motivo]
    : `Média de ${m.media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}/mês (${m.meses} ${m.meses === 1 ? 'mês' : 'meses'}) + ${margem}% = ${m.alvo} − sobra ${m.sobra}`

  return (
    <div className="glass rounded-2xl p-6 ring-1 ring-gold-500/20">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gold-400" />
          <h4 className="text-base font-semibold text-white">Comprar em {prox}</h4>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          Margem de segurança
          <input
            type="text"
            inputMode="numeric"
            value={margem}
            onChange={(e) => setMargem(Math.min(200, parseInt(limpa(e.target.value), 10) || 0))}
            className="w-12 px-1.5 py-1 text-center text-sm text-white bg-[#0f1a14] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500/50"
          />
          %
        </label>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        Média do consumo dos últimos {JANELA_MESES} meses + margem, menos a sobra do fim de {nomeMes(mes)}. Passe o mouse num número para ver a conta.
      </p>

      {!temAlguma ? (
        <p className="text-sm text-gray-400">
          Para calcular, lance nos cartões abaixo as compras e a sobra do fim de {nomeMes(mes)} (no primeiro mês, também o estoque do início).
        </p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm min-w-[420px]">
            <thead>
              <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="text-left font-medium pb-2">Loja</th>
                {TAMANHOS.map(([k, l]) => <th key={k} className="text-right font-medium pb-2 w-14">{l}</th>)}
                <th className="text-right font-medium pb-2 w-16">Total</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ loja, meta }) => (
                <tr key={loja} className="border-t border-white/5">
                  <td className="py-2 text-gray-300 truncate max-w-[180px]">{loja}</td>
                  {TAMANHOS.map(([k]) => (
                    <td key={k} className={`py-2 text-right tabular-nums ${meta[k].meta === null ? 'text-gray-600' : 'text-white'}`} title={meta[k].motivo === 'sem-dados' ? undefined : dica(meta[k])}>
                      {fmt(meta[k].meta)}
                    </td>
                  ))}
                  <td className="py-2 text-right tabular-nums font-semibold text-gold-300">{fmt(meta.total)}</td>
                </tr>
              ))}
            </tbody>
            {linhas.length > 1 && (
              <tfoot>
                <tr className="border-t border-white/15">
                  <td className="pt-2 text-gray-400 text-xs uppercase tracking-wide">Total</td>
                  {TAMANHOS.map(([k]) => <td key={k} className="pt-2 text-right tabular-nums text-gray-200">{fmt(totalTam[k])}</td>)}
                  <td className="pt-2 text-right tabular-nums font-bold text-gold-300">{fmt(total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {temAlguma && pendentes.length > 0 && (
        <p className="mt-4 text-xs text-amber-400/90">
          Incompleto em: {pendentes.map((l) => l.loja).join(', ')}. Falta a sobra do fim de {nomeMes(mes)} (ou o início do mês) em algum tamanho. O total soma só o que já dá para calcular.
        </p>
      )}
    </div>
  )
}

// ---------- histórico ----------
function TabelaHistorico({ meses, lojas, idx, mesSel, onSelecionar }) {
  const [filtro, setFiltro] = useState('')
  const lojasFiltro = filtro ? [filtro] : lojas
  const linhas = meses.map((m) => ({ mes: m, t: totaisDoMes(idx, m, lojasFiltro) })).filter((l) => l.t)

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gold-400" />
          <h4 className="text-base font-semibold text-white">Mês a mês</h4>
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="px-2.5 py-1.5 text-sm text-white bg-[#0f1a14] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500/50"
        >
          <option value="">Todas as lojas</option>
          {lojas.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {linhas.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhum mês lançado ainda.</p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="text-left font-medium pb-2">Mês</th>
                <th className="text-right font-medium pb-2">Compradas</th>
                <th className="text-right font-medium pb-2">Consumo</th>
                <th className="text-right font-medium pb-2">Sobra no fim</th>
                <th className="text-right font-medium pb-2" title="Sacolas necessárias pela regra da conferência">Regra</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ mes, t }) => {
                const dif = !t.parcial && t.necessarias !== null ? t.consumo - t.necessarias : null
                return (
                  <tr
                    key={mes}
                    onClick={() => onSelecionar(mes)}
                    className={`border-t border-white/5 cursor-pointer hover:bg-white/[0.03] ${mes === mesSel ? 'bg-primary-500/10' : ''}`}
                  >
                    <td className="py-2 text-gray-200">{nomeMes(mes)}</td>
                    <td className="py-2 text-right tabular-nums text-gray-300">{fmt(t.compradas)}</td>
                    <td className="py-2 text-right tabular-nums text-white font-medium">
                      {fmt(t.consumo)}{t.parcial && <span className="text-amber-400" title="Algum lançamento ainda sem sobra do fim do mês">*</span>}
                    </td>
                    <td className="py-2 text-right tabular-nums text-gray-300">{fmt(t.sobra)}{t.parcial && <span className="text-amber-400">*</span>}</td>
                    <td className="py-2 text-right tabular-nums text-gray-400">
                      {fmt(t.necessarias)}
                      {dif !== null && dif !== 0 && (
                        <span className={`ml-1.5 text-xs ${dif > 0 ? 'text-amber-400' : 'text-red-400'}`}>({dif > 0 ? '+' : ''}{fmt(dif)})</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {linhas.some((l) => l.t.parcial) && (
            <p className="mt-3 text-xs text-gray-500"><span className="text-amber-400">*</span> mês com loja ainda sem sobra do fim lançada: soma só o que já dá para calcular.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ---------- principal ----------
function SacolasHistorico({ conferencia }) {
  const [user, setUser] = useState(undefined) // undefined = verificando sessão
  const [entrando, setEntrando] = useState(false)
  const [erroLogin, setErroLogin] = useState('')
  const [registros, setRegistros] = useState(null)
  const [erroDados, setErroDados] = useState(null)
  const [mes, setMes] = useState(mesAtual())
  const mesEscolhido = useRef(false)
  const [rascunhos, setRascunhos] = useState({})
  const [lojasExtras, setLojasExtras] = useState([])
  const [margem, setMargemState] = useState(lerMargem)
  const [salvando, setSalvando] = useState(false)
  const [aviso, setAviso] = useState(null) // { tipo: 'ok' | 'erro', texto }
  const avisoTimer = useRef(null)

  useEffect(() => observarUsuario((u) => setUser(u)), [])

  useEffect(() => {
    if (!user) { setRegistros(null); setErroDados(null); return }
    return observarRegistros(
      (lista) => { setRegistros(lista); setErroDados(null) },
      (e) => setErroDados(e.code || e.message),
    )
  }, [user])

  // abre no mês mais recente com lançamento (até o mês atual) — no começo do mês
  // isso mostra o mês que acabou, onde se lança a sobra e sai a meta do mês novo
  useEffect(() => {
    if (!registros || mesEscolhido.current) return
    mesEscolhido.current = true
    const hoje = mesAtual()
    const ult = registros.map((r) => r.mes).filter((m) => m <= hoje).sort().pop()
    if (ult) setMes(ult)
  }, [registros])

  const setMargem = (v) => {
    setMargemState(v)
    try { localStorage.setItem(MARGEM_KEY, String(v)) } catch { /* sem storage: só não lembra */ }
  }

  const porChave = useMemo(() => new Map((registros || []).map((r) => [chave(r.mes, r.loja), r])), [registros])

  const sujos = useMemo(
    () => Object.keys(rascunhos).filter((key) => !mesmoValor(rascunhos[key], porChave.get(key))),
    [rascunhos, porChave],
  )

  useEffect(() => {
    if (sujos.length === 0) return
    const avisa = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', avisa)
    return () => window.removeEventListener('beforeunload', avisa)
  }, [sujos.length])

  // registros da nuvem + o que está sendo digitado (para a meta mudar ao vivo)
  const idx = useMemo(() => {
    const map = new Map(porChave)
    for (const [key, r] of Object.entries(rascunhos)) {
      const [m, loja] = key.split('|')
      map.set(key, { ...(map.get(key) || { mes: m, loja }), inicial: paraNum(r.inicial), compradas: paraNum(r.compradas), sobra: paraNum(r.sobra) })
    }
    return indexa([...map.values()])
  }, [porChave, rascunhos])

  const lojas = useMemo(() => {
    const s = new Set([...(registros || []).map((r) => r.loja), ...lojasExtras])
    return [...s].sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [registros, lojasExtras])

  const meses = useMemo(() => [...new Set((registros || []).map((r) => r.mes))].sort().reverse(), [registros])

  const lojasParaAdicionar = useMemo(() => {
    const daConf = (conferencia?.analise || []).map((u) => canonLoja(u.unidade))
    return [...new Set([...daConf, ...Object.values(STORE_NAMES)])].filter((l) => !lojas.includes(l))
  }, [conferencia, lojas])

  const handleEntrar = async () => {
    setErroLogin('')
    setEntrando(true)
    try {
      await entrar()
    } catch (e) {
      if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
        setErroLogin(MSG_LOGIN[e.code] || `Não foi possível entrar (${e.code || e.message}).`)
      }
    } finally {
      setEntrando(false)
    }
  }

  const handleSair = () => {
    if (sujos.length && !window.confirm('Há alterações não salvas. Sair mesmo assim?')) return
    setRascunhos({})
    mesEscolhido.current = false
    sair()
  }

  const setCampo = (loja, campo, k, valor) => {
    const key = chave(mes, loja)
    setRascunhos((prev) => {
      const atual = prev[key] || rascunhoDe(porChave.get(key))
      return { ...prev, [key]: { ...atual, [campo]: { ...atual[campo], [k]: valor } } }
    })
  }

  const avisar = (tipo, texto) => {
    setAviso({ tipo, texto })
    clearTimeout(avisoTimer.current)
    avisoTimer.current = setTimeout(() => setAviso(null), 4000)
  }

  const salvar = async () => {
    setSalvando(true)
    try {
      const lista = sujos.map((key) => {
        const [m, loja] = key.split('|')
        const r = rascunhos[key]
        return {
          id: porChave.get(key)?.id || idRegistro(m, loja),
          dados: { mes: m, loja, inicial: paraNum(r.inicial), compradas: paraNum(r.compradas), sobra: paraNum(r.sobra) },
        }
      })
      await salvarRegistros(lista, user.email)
      setRascunhos({})
      avisar('ok', 'Salvo.')
    } catch (e) {
      avisar('erro', `Não salvou: ${e.code || e.message}`)
    } finally {
      setSalvando(false)
    }
  }

  const excluir = async (loja) => {
    const reg = porChave.get(chave(mes, loja))
    if (!reg || !window.confirm(`Apagar o lançamento de ${loja} em ${nomeMes(mes)}?`)) return
    try {
      await excluirRegistro(reg.id)
      setRascunhos((prev) => { const n = { ...prev }; delete n[chave(mes, loja)]; return n })
    } catch (e) {
      avisar('erro', `Não apagou: ${e.code || e.message}`)
    }
  }

  // necessárias da conferência carregada → regra do mês selecionado
  const confLojas = (conferencia?.analise || []).map((u) => ({ loja: canonLoja(u.unidade), necessarias: u.necessarias }))
  const confJaGuardada = confLojas.length > 0 && confLojas.every((c) => porChave.get(chave(mes, c.loja))?.necessarias === c.necessarias)
  const guardarConferencia = async () => {
    try {
      await salvarRegistros(
        confLojas.map((c) => ({
          id: porChave.get(chave(mes, c.loja))?.id || idRegistro(mes, c.loja),
          dados: { mes, loja: c.loja, necessarias: c.necessarias },
        })),
        user.email,
      )
      avisar('ok', `Regra guardada em ${nomeMes(mes)}.`)
    } catch (e) {
      avisar('erro', `Não guardou: ${e.code || e.message}`)
    }
  }

  // ---- acesso ----
  if (user === undefined) return <p className="text-sm text-gray-500">Verificando acesso…</p>
  if (user === null) return <TelaLogin onEntrar={handleEntrar} erro={erroLogin} entrando={entrando} />
  if (erroDados === 'permission-denied') return <TelaSemAcesso email={user.email} onSair={handleSair} />
  if (erroDados) {
    return (
      <div className="glass rounded-2xl p-6 max-w-xl flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <span className="text-sm text-red-300">Não foi possível carregar o histórico ({erroDados}).</span>
      </div>
    )
  }
  if (!registros) return <p className="text-sm text-gray-500">Carregando histórico…</p>

  const calcs = lojas.map((loja) => ({ loja, calc: calculaMes(idx, mes, loja) }))
  const totalMes = (campo) => {
    const vals = calcs.map((c) => c.calc.total[campo])
    return vals.some((v) => v !== null) ? vals.reduce((a, v) => a + (v || 0), 0) : null
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Cabeçalho: mês + conta */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-1">
            <button onClick={() => setMes(somaMes(mes, -1))} aria-label="Mês anterior" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-white w-48 text-center">{nomeMes(mes)}</h3>
            <button onClick={() => setMes(somaMes(mes, 1))} aria-label="Próximo mês" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
            {mes !== mesAtual() && (
              <button onClick={() => setMes(mesAtual())} className="ml-1 text-xs text-gray-500 hover:text-gray-300">ir para o mês atual</button>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500 min-w-0">
            <span className="truncate max-w-[200px]" title={user.email}>{user.email}</span>
            <button onClick={handleSair} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          {[['Compradas', totalMes('compradas')], ['Consumo', totalMes('consumo')], ['Sobra no fim', totalMes('sobra')]].map(([l, v]) => (
            <div key={l} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xl font-bold text-white tabular-nums">{fmt(v)}</span>
              <p className="text-xs text-gray-400">{l}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Regra vinda da conferência */}
      {confLojas.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
          <ClipboardCheck className="w-4 h-4 text-gold-400 shrink-0" />
          <span className="text-sm text-gray-300 flex-1 min-w-[220px]">
            Conferência carregada{conferencia.fileName ? ` (${conferencia.fileName})` : ''}:{' '}
            <b className="text-white">{fmt(confLojas.reduce((a, c) => a + c.necessarias, 0))}</b> sacolas necessárias em {confLojas.length} {confLojas.length === 1 ? 'loja' : 'lojas'}.
            Guarde como regra de {nomeMes(mes)} para comparar com o consumo real.
          </span>
          {confJaGuardada ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400"><CheckCircle2 className="w-4 h-4" /> Guardada em {nomeMes(mes)}</span>
          ) : (
            <button onClick={guardarConferencia} className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-colors">
              Guardar em {nomeMes(mes)}
            </button>
          )}
        </div>
      )}

      <TabelaMeta lojas={lojas} idx={idx} mes={mes} margem={margem} setMargem={setMargem} />

      {/* Lançamentos do mês */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h4 className="text-base font-semibold text-white">Lançamentos de {nomeMes(mes)}</h4>
          {lojasParaAdicionar.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <Plus className="w-4 h-4" />
              <select
                value=""
                onChange={(e) => e.target.value && setLojasExtras((p) => [...p, e.target.value])}
                className="px-2.5 py-1.5 text-sm text-white bg-[#0f1a14] border border-white/10 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500/50"
              >
                <option value="">Adicionar loja…</option>
                {lojasParaAdicionar.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
          )}
        </div>
        {lojas.length === 0 ? (
          <div className="glass rounded-2xl p-6 text-sm text-gray-400">
            Nenhuma loja no histórico ainda. Use <b className="text-gray-200">Adicionar loja</b> para começar. Depois do primeiro mês, as lojas aparecem sozinhas nos meses seguintes.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {calcs.map(({ loja, calc }) => (
              <CartaoLoja
                key={loja}
                loja={loja}
                mes={mes}
                calc={calc}
                valores={rascunhos[chave(mes, loja)] || rascunhoDe(porChave.get(chave(mes, loja)))}
                onSet={(campo, k, v) => setCampo(loja, campo, k, v)}
                onExcluir={() => excluir(loja)}
                podeExcluir={porChave.has(chave(mes, loja))}
              />
            ))}
          </div>
        )}
      </div>

      <TabelaHistorico meses={meses} lojas={lojas} idx={idx} mesSel={mes} onSelecionar={setMes} />

      {/* Barra de salvar / avisos */}
      {(sujos.length > 0 || aviso) && (
        <div className="fixed bottom-4 inset-x-4 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto flex flex-wrap items-center gap-3 px-4 py-3 rounded-xl glass-dark shadow-glass max-w-full">
            {aviso && (
              <span className={`flex items-center gap-1.5 text-sm ${aviso.tipo === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
                {aviso.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {aviso.texto}
              </span>
            )}
            {sujos.length > 0 && (
              <>
                <span className="text-sm text-gray-300">
                  {sujos.length} {sujos.length === 1 ? 'lançamento' : 'lançamentos'} sem salvar
                </span>
                <button onClick={() => setRascunhos({})} className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white">Descartar</button>
                <button
                  onClick={salvar}
                  disabled={salvando}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-60"
                >
                  <Save className="w-4 h-4" /> {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SacolasHistorico
