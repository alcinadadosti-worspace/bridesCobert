import { STORE_NAMES, normalizeString } from './parseSpreadsheet'

// ==================== HISTÓRICO DE SACOLAS ====================
// Por mês × loja × tamanho:
//   início do mês = sobra do fim do mês anterior (ou digitado, no primeiro mês)
//   consumo       = início + compradas − sobra no fim do mês
// Meta de compra do mês seguinte (por tamanho):
//   média do consumo dos últimos 3 meses × (1 + margem) − sobra atual, nunca negativa
// Tamanho sem nenhum número no mês (ex.: loja que não usa PP) fica fora dos totais.

export const TAMANHOS = [['pp', 'PP'], ['p', 'P'], ['m', 'M'], ['g', 'G']]
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

export function indexa(registros) {
  const map = new Map()
  for (const r of registros) map.set(chave(r.mes, r.loja), r)
  return map
}

// soma dos tamanhos usados; null se algum tamanho usado estiver sem valor (ou nenhum usado)
function somaUsados(valores, usado) {
  const ks = TAMANHOS.map(([k]) => k).filter((k) => usado[k])
  if (ks.length === 0 || ks.some((k) => valores[k] === null)) return null
  return ks.reduce((a, k) => a + valores[k], 0)
}

// Visão calculada de uma loja num mês
export function calculaMes(idx, mes, loja) {
  const reg = idx.get(chave(mes, loja))
  const ant = idx.get(chave(somaMes(mes, -1), loja))
  const inicial = {}, inicialHerdado = {}, compradas = {}, sobra = {}, consumo = {}, usado = {}
  for (const [k] of TAMANHOS) {
    const herdado = num(ant?.sobra?.[k])
    inicialHerdado[k] = herdado !== null
    inicial[k] = herdado !== null ? herdado : num(reg?.inicial?.[k])
    compradas[k] = num(reg?.compradas?.[k])
    sobra[k] = num(reg?.sobra?.[k])
    usado[k] = inicial[k] !== null || compradas[k] !== null || sobra[k] !== null
    consumo[k] = inicial[k] !== null && sobra[k] !== null ? inicial[k] + (compradas[k] || 0) - sobra[k] : null
  }
  return {
    existe: !!reg,
    inicial, inicialHerdado, compradas, sobra, consumo, usado,
    necessarias: num(reg?.necessarias),
    total: {
      inicial: somaUsados(inicial, usado),
      compradas: TAMANHOS.reduce((a, [k]) => a + (compradas[k] || 0), 0),
      sobra: somaUsados(sobra, usado),
      consumo: somaUsados(consumo, usado),
    },
  }
}

// Meta de compra para o mês seguinte a `mes`, por tamanho.
// motivo quando não dá para calcular: 'sem-sobra' | 'sem-consumo' | 'sem-dados' (tamanho não usado)
export function metaProximoMes(idx, mes, loja, margemPct) {
  const meses = Array.from({ length: JANELA_MESES }, (_, i) => calculaMes(idx, somaMes(mes, -i), loja))
  const atual = meses[0]
  const out = {}
  for (const [k] of TAMANHOS) {
    const consumos = meses.map((c) => c.consumo[k]).filter((c) => c !== null).map((c) => Math.max(0, c))
    const sobra = atual.sobra[k]
    if (!atual.usado[k] && consumos.length === 0) out[k] = { meta: null, motivo: 'sem-dados' }
    else if (sobra === null) out[k] = { meta: null, motivo: 'sem-sobra' }
    else if (consumos.length === 0) out[k] = { meta: null, motivo: 'sem-consumo' }
    else {
      const media = consumos.reduce((a, b) => a + b, 0) / consumos.length
      // toFixed tira o ruído de ponto flutuante (200 × 1,1 = 220,00000000000003 → 220, não 221)
      const alvo = Math.ceil(+(media * (1 + (margemPct || 0) / 100)).toFixed(6))
      out[k] = { meta: Math.max(0, alvo - sobra), media, alvo, sobra, meses: consumos.length }
    }
  }
  const calc = TAMANHOS.map(([k]) => out[k]).filter((v) => v.motivo !== 'sem-dados')
  out.total = calc.length && calc.every((v) => v.meta !== null) ? calc.reduce((a, v) => a + v.meta, 0) : null
  out.pendente = calc.some((v) => v.meta === null)
  return out
}

// Totais de um mês somando lojas (tabela de histórico). `parcial` = alguma loja lançada
// ainda sem sobra/consumo completo; os valores somam só o que já dá para calcular.
export function totaisDoMes(idx, mes, lojas) {
  const r = { compradas: 0, sobra: 0, consumo: 0, necessarias: null, parcial: false, lojas: 0 }
  for (const loja of lojas) {
    const c = calculaMes(idx, mes, loja)
    if (!c.existe) continue
    r.lojas++
    r.compradas += c.total.compradas
    if (c.total.sobra === null || c.total.consumo === null) r.parcial = true
    r.sobra += c.total.sobra || 0
    r.consumo += c.total.consumo || 0
    if (c.necessarias !== null) r.necessarias = (r.necessarias || 0) + c.necessarias
  }
  return r.lojas ? r : null
}
