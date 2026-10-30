import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { History, ChevronLeft, ChevronRight, LogOut, Store, ShoppingCart, Trash2, AlertCircle, CheckCircle2, ClipboardCheck, Lock, FileSpreadsheet } from 'lucide-react'
import { observarUsuario, usuarioDe, entrar, sair, observarRegistros, salvarRegistros, excluirRegistro, removerDoMes } from '../lib/sacolasCloud'
import { parseSacolasFile, analisaSacolas } from '../utils/parseSpreadsheet'
import { useFileDrop } from '../hooks/useFileDrop'
import {
  JANELA_MESES, mesAtual, somaMes, nomeMes, idRegistro,
  indexa, registroDe, agrupaAnalise, saldoMes, metaProximoMes, totaisDoMes, temDados,
} from '../utils/sacolasHistorico'

const chave = (mes, loja) => `${mes}|${loja}`
const fmt = (v) => (v === null || v === undefined ? '—' : v.toLocaleString('pt-BR'))
const limpa = (v) => v.replace(/[^\d]/g, '').replace(/^0+(?=\d)/, '')

const MARGEM_KEY = 'sacolas.margem'
function lerMargem() {
  try { const v = parseInt(localStorage.getItem(MARGEM_KEY), 10); return Number.isFinite(v) ? v : 10 } catch { return 10 }
}

const SENHA_ERRADA = 'Usuário ou senha incorretos.'
const MSG_LOGIN = {
  'auth/invalid-credential': SENHA_ERRADA,
  'auth/invalid-login-credentials': SENHA_ERRADA,
  'auth/wrong-password': SENHA_ERRADA,
  'auth/user-not-found': SENHA_ERRADA,
  'auth/invalid-email': SENHA_ERRADA,
  'auth/user-disabled': 'Este usuário está desativado.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet.',
  'auth/operation-not-allowed': 'O login por usuário e senha não está ativado no Firebase (Authentication → Sign-in method → E-mail/senha).',
}

const campoLogin = `w-full px-3 py-2 text-sm text-white bg-[#0f1a14] border border-white/10 rounded-lg
  placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50`

// ---------- telas de acesso ----------
function TelaLogin({ onEntrar, erro, entrando }) {
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const enviar = (e) => {
    e.preventDefault()
    onEntrar(usuario.trim().toLowerCase(), senha)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 max-w-md">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-5 h-5 text-gold-400" />
        <h3 className="text-lg font-semibold text-white">Histórico de sacolas</h3>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        Saldo de sacolas por loja, mês a mês: a planilha de itens diz quantas foram usadas pela regra,
        você lança as compradas, e o app calcula a sobra e quantas comprar no mês seguinte.
      </p>
      <form onSubmit={enviar} className="space-y-3">
        <label className="block">
          <span className="block text-xs text-gray-400 mb-1">Usuário</span>
          <input value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required className={campoLogin} />
        </label>
        <label className="block">
          <span className="block text-xs text-gray-400 mb-1">Senha</span>
          <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required className={campoLogin} />
        </label>
        <button
          type="submit"
          disabled={entrando}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-60"
        >
          <Lock className="w-4 h-4" /> {entrando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      {erro && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span className="text-sm text-red-300">{erro}</span>
        </div>
      )}
    </motion.div>
  )
}

function TelaSemAcesso({ usuario, onSair }) {
  return (
    <div className="glass rounded-2xl p-6 max-w-xl">
      <div className="flex items-center gap-2 mb-2">
        <Lock className="w-5 h-5 text-amber-400" />
        <h3 className="text-lg font-semibold text-white">Sem acesso ao histórico</h3>
      </div>
      <p className="text-sm text-gray-400 mb-5">
        O usuário <b className="text-gray-200">{usuario}</b> entrou, mas ainda não está liberado. Peça para quem administra o
        Firebase criar o documento <code className="text-gray-300">{usuario}</code> na coleção <code className="text-gray-300">permitidos</code>.
      </p>
      <button onClick={onSair} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-colors">
        <LogOut className="w-4 h-4" /> Entrar com outro usuário
      </button>
    </div>
  )
}

// ---------- envio da planilha do mês ----------
function EnvioPlanilha({ titulo, ajuda, arquivo, onArquivo, onRemover, ocupado }) {
  const ref = useRef(null)
  const { isDragging, error, clearError, handlers, handleFileInput } = useFileDrop(onArquivo)
  return (
    <div
      {...handlers}
      className={`p-4 rounded-xl border transition-colors ${isDragging ? 'border-primary-500/60 bg-primary-500/10' : 'bg-white/5 border-white/10'}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <FileSpreadsheet className="w-5 h-5 text-primary-400 shrink-0" />
        <div className="flex-1 min-w-[180px]">
          <p className="text-sm font-medium text-white">{titulo}</p>
          {arquivo ? (
            <p className="flex items-center gap-1 text-xs text-emerald-400 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> <span className="truncate" title={arquivo}>{arquivo}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-500">{ajuda}</p>
          )}
        </div>
        {arquivo && !ocupado && (
          <button
            onClick={onRemover}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Remover
          </button>
        )}
        <button
          onClick={() => ref.current?.click()}
          disabled={ocupado}
          className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-colors disabled:opacity-60"
        >
          {ocupado ? 'Aguarde…' : arquivo ? 'Trocar planilha' : 'Subir planilha'}
        </button>
        <input
          ref={ref}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => { handleFileInput(e); e.target.value = '' }} // permite reenviar o mesmo arquivo
          className="hidden"
        />
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-300">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
          <button onClick={clearError} className="ml-1 text-red-400">&times;</button>
        </p>
      )}
    </div>
  )
}

// ---------- campo numérico que salva ao sair (Tab, Enter ou clique fora) ----------
function CampoNumero({ valor, onSalvar, label }) {
  const [texto, setTexto] = useState(valor == null ? '' : String(valor))
  const focado = useRef(false)
  useEffect(() => { if (!focado.current) setTexto(valor == null ? '' : String(valor)) }, [valor])
  const salvar = () => {
    focado.current = false
    const n = texto === '' ? null : parseInt(texto, 10)
    if (n !== (valor ?? null)) onSalvar(n)
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      aria-label={label}
      value={texto}
      placeholder="0"
      onFocus={() => { focado.current = true }}
      onChange={(e) => setTexto(limpa(e.target.value))}
      onBlur={salvar}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
      className="w-28 px-2.5 py-1.5 text-right text-sm text-white bg-[#0f1a14] border border-white/10 rounded-lg
        placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary-500/50"
    />
  )
}

// ---------- quanto comprar no mês seguinte ----------
function TabelaMeta({ lojas, idx, mes, margem, setMargem }) {
  const prox = nomeMes(somaMes(mes, 1))
  const linhas = lojas.map((loja) => ({ loja, m: metaProximoMes(idx, mes, loja, margem), s: saldoMes(idx, mes, loja) }))
  const soma = (campo) => {
    const vals = linhas.map((l) => l.m[campo]).filter((v) => v !== null && v !== undefined)
    return vals.length ? vals.reduce((a, v) => a + v, 0) : null
  }
  const inteiro = (v) => (v === null || v === undefined ? '—' : Math.round(v).toLocaleString('pt-BR'))
  const motivo = (l) => (l.m.motivo === 'sem-itens'
    ? `sem planilha de itens nos últimos ${JANELA_MESES} meses`
    : l.s.usadas === null ? `suba a planilha de ${nomeMes(mes)} para saber a sobra` : 'falta a planilha de um mês anterior')
  const dica = (m) => `Média de ${m.media.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} sacolas/mês pela regra (${m.meses} ${m.meses === 1 ? 'mês' : 'meses'}) + ${margem}% = ${fmt(m.alvo)} − sobra ${fmt(m.sobra)}`

  return (
    <div className="glass rounded-2xl p-6 ring-1 ring-gold-500/20">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-gold-400" />
          <h4 className="text-base font-semibold text-white">Comprar para {prox}</h4>
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
        Necessárias = média das usadas pela regra nos últimos {JANELA_MESES} meses + margem. Comprar = necessárias − sobra do fim de {nomeMes(mes)}.
      </p>

      {linhas.length === 0 ? (
        <p className="text-sm text-gray-400">Sem dados em {nomeMes(mes)}. Suba a planilha de itens do mês.</p>
      ) : (
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-sm min-w-[380px]">
            <thead>
              <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="text-left font-medium pb-2">Loja</th>
                <th className="text-right font-medium pb-2" title={`Média das usadas pela regra nos últimos ${JANELA_MESES} meses`}>Média/mês</th>
                <th className="text-right font-medium pb-2">Necessárias (+{margem}%)</th>
                <th className="text-right font-medium pb-2">− Sobra</th>
                <th className="text-right font-medium pb-2">Comprar</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.loja} className="border-t border-white/5" title={l.m.meta === null ? undefined : dica(l.m)}>
                  <td className="py-2 text-gray-300 max-w-[220px]">
                    <div className="truncate">{l.loja}</div>
                    {l.m.meta === null && <div className="text-[11px] text-amber-400/90">{motivo(l)}</div>}
                  </td>
                  <td className="py-2 text-right tabular-nums text-gray-300">{inteiro(l.m.media)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-200">{fmt(l.m.alvo)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-300">{fmt(l.m.sobra)}</td>
                  <td className="py-2 text-right tabular-nums font-semibold text-gold-300">{fmt(l.m.meta)}</td>
                </tr>
              ))}
            </tbody>
            {linhas.length > 1 && (
              <tfoot>
                <tr className="border-t border-white/15">
                  <td className="pt-2 text-gray-400 text-xs uppercase tracking-wide">Total</td>
                  <td className="pt-2 text-right tabular-nums text-gray-200">{inteiro(soma('media'))}</td>
                  <td className="pt-2 text-right tabular-nums text-gray-200">{fmt(soma('alvo'))}</td>
                  <td className="pt-2 text-right tabular-nums text-gray-200">{fmt(soma('sobra'))}</td>
                  <td className="pt-2 text-right tabular-nums font-bold text-gold-300">{fmt(soma('meta'))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}

// ---------- saldo do mês por loja ----------
function CartaoLoja({ loja, mes, s, reg, onSalvar, onExcluir }) {
  const mesAnt = nomeMes(somaMes(mes, -1))
  const faltaram = s.sobra !== null && s.sobra < 0 ? -s.sobra : 0

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="w-4 h-4 text-gold-400 shrink-0" />
          <span className="text-white font-semibold truncate">{loja}</span>
        </div>
        {reg && (
          <button onClick={onExcluir} title={`Apagar os dados de ${nomeMes(mes)} desta loja`} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 items-center text-sm">
        <dt className="text-gray-400">
          Estoque no início
          <span className="block text-[11px] text-gray-600">{s.inicioHerdado ? `sobra de ${mesAnt}` : 'primeiro mês: digite o que a loja tinha'}</span>
        </dt>
        <dd className="text-right tabular-nums text-gray-200">
          {s.inicioHerdado ? fmt(s.inicio) : <CampoNumero label={`Estoque no início ${loja}`} valor={reg?.inicial ?? null} onSalvar={(v) => onSalvar('inicial', v)} />}
        </dd>

        <dt className="text-gray-400">+ Compradas no mês</dt>
        <dd className="text-right"><CampoNumero label={`Compradas ${loja}`} valor={reg?.compradas ?? null} onSalvar={(v) => onSalvar('compradas', v)} /></dd>

        <dt className="text-gray-400">− Usadas pela regra</dt>
        <dd className="text-right tabular-nums text-gray-200">
          {s.usadas === null ? <span className="text-xs text-gray-600">suba a planilha do mês</span> : fmt(s.usadas)}
        </dd>

        <dt className="pt-2.5 border-t border-white/10 text-white font-medium">= Sobra no fim</dt>
        <dd className="pt-2.5 border-t border-white/10 text-right tabular-nums">
          {s.sobra === null ? <span className="text-gray-600">—</span> : (
            <span className={faltaram ? 'text-red-400 font-semibold' : 'text-gold-300 font-semibold'}>{fmt(Math.max(0, s.sobra))}</span>
          )}
        </dd>
      </dl>
      {faltaram > 0 && (
        <p className="mt-2 text-xs text-red-400">Faltaram {fmt(faltaram)} sacolas para cumprir a regra neste mês.</p>
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
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="text-left font-medium pb-2">Mês</th>
                <th className="text-right font-medium pb-2">Início</th>
                <th className="text-right font-medium pb-2">+ Compradas</th>
                <th className="text-right font-medium pb-2">− Usadas (regra)</th>
                <th className="text-right font-medium pb-2">= Sobra</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ mes, t }) => (
                <tr
                  key={mes}
                  onClick={() => onSelecionar(mes)}
                  className={`border-t border-white/5 cursor-pointer hover:bg-white/[0.03] ${mes === mesSel ? 'bg-primary-500/10' : ''}`}
                >
                  <td className="py-2 text-gray-200">{nomeMes(mes)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-300">{fmt(t.inicio)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-300">{fmt(t.compradas)}</td>
                  <td className="py-2 text-right tabular-nums text-gray-300">{fmt(t.usadas)}</td>
                  <td className="py-2 text-right tabular-nums font-medium text-white">
                    {fmt(t.sobra)}
                    {t.faltaram > 0 && <span className="ml-1.5 text-xs font-normal text-red-400">(faltaram {fmt(t.faltaram)})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {linhas.some((l) => l.t.faltaram > 0) && (
            <p className="mt-3 text-xs text-gray-500">Faltaram = sacolas que a regra pedia além do estoque; a loja começa o mês seguinte com 0.</p>
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
  const [margem, setMargemState] = useState(lerMargem)
  const [ocupado, setOcupado] = useState(null) // 'itens' | 'conferencia'
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

  // abre no mês mais recente com dados (até o mês atual)
  useEffect(() => {
    if (!registros || mesEscolhido.current) return
    mesEscolhido.current = true
    const hoje = mesAtual()
    const ult = registros.filter(temDados).map((r) => r.mes).filter((m) => m <= hoje).sort().pop()
    if (ult) setMes(ult)
  }, [registros])

  const setMargem = (v) => {
    setMargemState(v)
    try { localStorage.setItem(MARGEM_KEY, String(v)) } catch { /* sem storage: só não lembra */ }
  }

  const porChave = useMemo(() => new Map((registros || []).map((r) => [chave(r.mes, r.loja), r])), [registros])
  // cálculos só com registros deste modelo; porChave/doMes usam todos (ids e limpeza)
  const validos = useMemo(() => (registros || []).filter(temDados), [registros])
  const idx = useMemo(() => indexa(validos), [validos])
  const lojas = useMemo(() => [...new Set(validos.map((r) => r.loja))].sort((a, b) => a.localeCompare(b, 'pt-BR')), [validos])
  const meses = useMemo(() => [...new Set(validos.map((r) => r.mes))].sort().reverse(), [validos])
  const doMes = (registros || []).filter((r) => r.mes === mes)
  const arquivoItens = doMes.find((r) => r.arquivoItens)?.arquivoItens || null

  const avisar = (tipo, texto) => {
    setAviso({ tipo, texto })
    clearTimeout(avisoTimer.current)
    avisoTimer.current = setTimeout(() => setAviso(null), 4000)
  }

  const handleEntrar = async (usuario, senha) => {
    setErroLogin('')
    if (!/^[a-z0-9._-]+$/.test(usuario)) {
      setErroLogin('Digite só o nome de usuário: letras, números, ponto, hífen ou _ (sem espaços e sem @).')
      return
    }
    setEntrando(true)
    try {
      await entrar(usuario, senha)
    } catch (e) {
      setErroLogin(MSG_LOGIN[e.code] || `Não foi possível entrar (${e.code || e.message}).`)
    } finally {
      setEntrando(false)
    }
  }

  const handleSair = () => {
    mesEscolhido.current = false
    sair()
  }

  const idDe = (loja) => porChave.get(chave(mes, loja))?.id || idRegistro(mes, loja)

  // grava as necessárias da planilha no mês; lojas que estavam na planilha anterior e não
  // vieram na nova perdem esse dado (compradas e estoque inicial digitados ficam; se não
  // sobrar nada, o registro é apagado)
  const salvarItens = async (analise, arquivo) => {
    if (arquivoItens && !window.confirm(`${nomeMes(mes)} já tem a planilha "${arquivoItens}". Substituir por "${arquivo}"?`)) return false
    const grupos = agrupaAnalise(analise)
    const gravar = grupos.map((g) => ({ id: idDe(g.loja), dados: { mes, loja: g.loja, necessarias: g.necessarias, arquivoItens: arquivo } }))
    const novas = new Set(grupos.map((g) => g.loja))
    const apagar = []
    for (const r of doMes) {
      if (novas.has(r.loja) || (r.necessarias == null && !r.arquivoItens)) continue
      if (r.compradas != null || r.inicial != null) gravar.push({ id: r.id, dados: { necessarias: null, arquivoItens: null } })
      else apagar.push(r.id)
    }
    await removerDoMes(gravar, apagar, usuarioDe(user))
    return true
  }

  const enviarItens = async (file) => {
    setOcupado('itens')
    try {
      const analise = analisaSacolas(await parseSacolasFile(file))
      if (await salvarItens(analise, file.name)) avisar('ok', `Planilha salva em ${nomeMes(mes)}.`)
    } catch (e) {
      avisar('erro', e.message)
    } finally {
      setOcupado(null)
    }
  }

  const usarConferencia = async () => {
    setOcupado('conferencia')
    try {
      if (await salvarItens(conferencia.analise, conferencia.fileName)) avisar('ok', `Planilha da conferência salva em ${nomeMes(mes)}.`)
    } catch (e) {
      avisar('erro', `Não salvou: ${e.code || e.message}`)
    } finally {
      setOcupado(null)
    }
  }

  // tira a planilha do mês; compradas/estoque inicial digitados ficam (lojas sem nada são apagadas)
  const removerPlanilha = async () => {
    if (!window.confirm(`Remover a planilha "${arquivoItens}" de ${nomeMes(mes)}? As compradas digitadas continuam.`)) return
    const limpar = [], apagar = []
    for (const r of doMes) {
      if (r.necessarias == null && !r.arquivoItens) continue
      if (r.compradas != null || r.inicial != null) limpar.push({ id: r.id, dados: { necessarias: null, arquivoItens: null } })
      else apagar.push(r.id)
    }
    setOcupado('itens')
    try {
      await removerDoMes(limpar, apagar, usuarioDe(user))
      avisar('ok', `Planilha removida de ${nomeMes(mes)}.`)
    } catch (e) {
      avisar('erro', `Não removeu: ${e.code || e.message}`)
    } finally {
      setOcupado(null)
    }
  }

  const salvarCampo = async (loja, campo, valor) => {
    try {
      await salvarRegistros([{ id: idDe(loja), dados: { mes, loja, [campo]: valor } }], usuarioDe(user))
      avisar('ok', 'Salvo.')
    } catch (e) {
      avisar('erro', `Não salvou: ${e.code || e.message}`)
    }
  }

  const excluir = async (loja) => {
    const reg = porChave.get(chave(mes, loja))
    if (!reg || !window.confirm(`Apagar os dados de ${loja} em ${nomeMes(mes)} (planilha e compradas)?`)) return
    try {
      await excluirRegistro(reg.id)
    } catch (e) {
      avisar('erro', `Não apagou: ${e.code || e.message}`)
    }
  }

  // ---- acesso ----
  if (user === undefined) return <p className="text-sm text-gray-500">Verificando acesso…</p>
  if (user === null) return <TelaLogin onEntrar={handleEntrar} erro={erroLogin} entrando={entrando} />
  if (erroDados === 'permission-denied') return <TelaSemAcesso usuario={usuarioDe(user)} onSair={handleSair} />
  if (erroDados) {
    return (
      <div className="glass rounded-2xl p-6 max-w-xl flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <span className="text-sm text-red-300">Não foi possível carregar o histórico ({erroDados}).</span>
      </div>
    )
  }
  if (!registros) return <p className="text-sm text-gray-500">Carregando histórico…</p>

  // lojas com dados no mês ou no anterior (para continuar o saldo); as outras não aparecem no mês
  const lojasDoMes = lojas.filter((l) => registroDe(idx, mes, l) || registroDe(idx, somaMes(mes, -1), l))
  const totais = totaisDoMes(idx, mes, lojas)
  const confNoMes = conferencia && arquivoItens === conferencia.fileName

  return (
    <div className="space-y-6 pb-16">
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
            <span className="truncate max-w-[200px]">{usuarioDe(user)}</span>
            <button onClick={handleSair} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {[['Estoque no início', totais?.inicio], ['+ Compradas', totais?.compradas], ['− Usadas pela regra', totais?.usadas], ['= Sobra no fim', totais?.sobra]].map(([l, v], i) => (
            <div key={l} className="p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-xl font-bold tabular-nums text-white">{fmt(v ?? null)}</span>
              <p className="text-xs text-gray-400">{l}</p>
              {i === 3 && totais?.faltaram > 0 && <p className="text-[11px] text-red-400">faltaram {fmt(totais.faltaram)}</p>}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Planilha do mês */}
      <div className="glass rounded-2xl p-6">
        <h4 className="text-base font-semibold text-white mb-1">Planilha de {nomeMes(mes)}</h4>
        <p className="text-xs text-gray-500 mb-4">
          A mesma da conferência (itens_month ou presencial), com as vendas do mês. Ela dá quantas sacolas cada loja usou pela regra.
          Pode arrastar o arquivo para cima do quadro.
        </p>
        <EnvioPlanilha
          titulo="Planilha de itens"
          ajuda="itens_month ou presencial"
          arquivo={arquivoItens}
          onArquivo={enviarItens}
          onRemover={removerPlanilha}
          ocupado={ocupado === 'itens'}
        />
        {conferencia?.analise?.length > 0 && !confNoMes && (
          <div className="flex flex-wrap items-center gap-3 mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
            <ClipboardCheck className="w-4 h-4 text-gold-400 shrink-0" />
            <span className="text-sm text-gray-300 flex-1 min-w-[200px]">
              Há uma planilha aberta na Conferência{conferencia.fileName ? ` (${conferencia.fileName})` : ''}.
            </span>
            <button
              onClick={usarConferencia}
              disabled={ocupado === 'conferencia'}
              className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/10 text-sm text-white hover:bg-white/15 transition-colors disabled:opacity-60"
            >
              Usar em {nomeMes(mes)}
            </button>
          </div>
        )}
      </div>

      {lojasDoMes.length > 0 && (
        <div>
          <h4 className="text-base font-semibold text-white mb-1">Saldo por loja em {nomeMes(mes)}</h4>
          <p className="text-xs text-gray-500 mb-3">Digite as sacolas compradas no mês; salva sozinho ao sair do campo.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lojasDoMes.map((loja) => (
              <CartaoLoja
                key={loja}
                loja={loja}
                mes={mes}
                s={saldoMes(idx, mes, loja)}
                reg={registroDe(idx, mes, loja)}
                onSalvar={(campo, v) => salvarCampo(loja, campo, v)}
                onExcluir={() => excluir(loja)}
              />
            ))}
          </div>
        </div>
      )}

      <TabelaMeta lojas={lojasDoMes} idx={idx} mes={mes} margem={margem} setMargem={setMargem} />

      <TabelaHistorico meses={meses} lojas={lojas} idx={idx} mesSel={mes} onSelecionar={setMes} />

      {aviso && (
        <div className="fixed bottom-4 inset-x-4 z-50 flex justify-center pointer-events-none">
          <div className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl glass-dark shadow-glass text-sm max-w-full ${aviso.tipo === 'ok' ? 'text-emerald-400' : 'text-red-400'}`}>
            {aviso.tipo === 'ok' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />} {aviso.texto}
          </div>
        </div>
      )}
    </div>
  )
}

export default SacolasHistorico
