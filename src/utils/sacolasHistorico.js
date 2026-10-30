import { STORE_NAMES, normalizeString } from './parseSpreadsheet'

// ==================== HISTÓRICO DE SACOLAS ====================
// Saldo de sacolas por loja, mês a mês:
//   usadas  = sacolas pela regra da conferência (planilha de itens do mês)
//   compradas = digitado pelo usuário
//   início  = sobra do mês anterior (no primeiro mês da loja, o estoque inicial digitado)
//   sobra   = início + compradas − usadas (se der negativo, faltaram sacolas; o mês
//             seguinte começa com 0)
// Meta do mês seguinte: média das usadas nos últimos 3 meses × (1 + margem) − sobra

export const JANELA_MESES = 3

// ---- meses no formato 'AAAA-MM' ----
export function mesAtual(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function somaMes(mes, n) {
  const [a, m] = mes.split('-').map(Number)
  return mesAtual(new Date(a, m - 1 + n, 1))
}

export function nomeMes(mes, { curto = false } = {}) {
  const [a, m] = mes.split('-').map(Number)
  const s = new Date(a, m - 1, 1).toLocaleDateString('pt-BR', curto ? { month: 'short', year: 'numeric' } : { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1).replace('.', '')
}

// "Vd Palmeira" (itens_month) e "VD Palmeira" (presencial) viram o mesmo nome
export function canonLoja(nome) {
  const n = normalizeString(nome).trim()
  return Object.values(STORE_NAMES).find((v) => normalizeString(v) === n) || nome.toString().trim()
}

export function idRegistro(mes, loja) {
  return `${mes}__${normalizeString(loja).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
}

const chave = (mes, loja) => `${mes}|${loja}`
const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

// registro com algum dado deste modelo (versões antigas do app gravaram registros só com
// estoque/usadas, que agora são ignorados)
export const temDados = (r) => num(r?.necessarias) !== null || num(r?.compradas) !== null || num(r?.inicial) !== null

export function indexa(registros) {
  const map = new Map()
  for (const r of registros) map.set(chave(r.mes, r.loja), r)
  return map
}

export const registroDe = (idx, mes, loja) => idx.get(chave(mes, loja)) || null

// Soma as necessárias da conferência por loja canônica (dois nomes podem cair na mesma loja)
export function agrupaAnalise(analise) {
  const out = new Map()
  for (const u of analise) {
    const loja = canonLoja(u.unidade)
    out.set(loja, (out.get(loja) || 0) + u.necessarias)
  }
  return [...out].map(([loja, necessarias]) => ({ loja, necessarias }))
}

// Saldo de uma loja num mês. inicioHerdado = veio da sobra do mês anterior.
// sobra null quando falta a planilha do mês (ou de um mês anterior da sequência).
export function saldoMes(idx, mes, loja) {
  const reg = registroDe(idx, mes, loja)
  const ant = registroDe(idx, somaMes(mes, -1), loja)
  let inicio
  if (ant) {
    const s = saldoMes(idx, somaMes(mes, -1), loja).sobra
    inicio = s === null ? null : Math.max(0, s)
  } else {
    inicio = num(reg?.inicial) || 0
  }
  const compradas = num(reg?.compradas) || 0
  const usadas = num(reg?.necessarias)
  const sobra = inicio === null || usadas === null ? null : inicio + compradas - usadas
  return { existe: !!reg, inicioHerdado: !!ant, inicio, compradas, usadas, sobra }
}

// Meta para o mês seguinte a `mes`: média das usadas pela regra nos últimos 3 meses + margem,
// menos a sobra do mês. motivo: 'sem-itens' (nenhuma planilha nos últimos 3 meses) |
// 'sem-sobra' (falta a planilha do mês para saber a sobra)
export function metaProximoMes(idx, mes, loja, margemPct) {
  const comRegra = Array.from({ length: JANELA_MESES }, (_, i) => registroDe(idx, somaMes(mes, -i), loja)).filter((r) => num(r?.necessarias) !== null)
  if (comRegra.length === 0) return { meses: 0, meta: null, motivo: 'sem-itens' }
  const media = comRegra.reduce((a, r) => a + r.necessarias, 0) / comRegra.length
  // toFixed tira o ruído de ponto flutuante (200 × 1,1 = 220,00000000000003 → 220, não 221)
  const alvo = Math.ceil(+(media * (1 + (margemPct || 0) / 100)).toFixed(6))
  const { sobra } = saldoMes(idx, mes, loja)
  const base = { meses: comRegra.length, media, alvo }
  if (sobra === null) return { ...base, sobra: null, meta: null, motivo: 'sem-sobra' }
  const disponivel = Math.max(0, sobra)
  return { ...base, sobra: disponivel, meta: Math.max(0, alvo - disponivel), motivo: null }
}

// Totais de um mês somando lojas (tabela mês a mês); null onde nenhuma loja tem o dado.
// A falta de uma loja não desconta da sobra das outras: sobra soma só o que sobrou de fato
// e faltaram soma as sacolas que faltaram para cumprir a regra.
export function totaisDoMes(idx, mes, lojas) {
  const saldos = lojas.map((l) => saldoMes(idx, mes, l)).filter((s) => s.existe)
  if (saldos.length === 0) return null
  const soma = (vals) => (vals.length ? vals.reduce((a, v) => a + v, 0) : null)
  const sobras = saldos.map((s) => s.sobra).filter((v) => v !== null)
  return {
    inicio: soma(saldos.map((s) => s.inicio).filter((v) => v !== null)),
    compradas: soma(saldos.map((s) => s.compradas)),
    usadas: soma(saldos.map((s) => s.usadas).filter((v) => v !== null)),
    sobra: soma(sobras.map((v) => Math.max(0, v))),
    faltaram: sobras.reduce((a, v) => a + Math.max(0, -v), 0),
  }
}
