import { STORE_NAMES, normalizeString } from './parseSpreadsheet'

// ==================== HISTÓRICO DE SACOLAS ====================
// Um registro por mês × loja, alimentado por planilha:
//   necessarias = regra da conferência (planilha de itens)
//   usadas      = sacolas institucionais que saíram nos pedidos, por tamanho (planilha de itens)
//   estoque     = sacolas em estoque + trânsito, por tamanho (consulta de estoque)
// Meta do mês seguinte (total da loja, segue a regra):
//   média das necessárias nos últimos 3 meses × (1 + margem) [− estoque do mês, se enviado], nunca negativa

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
export const somaTamanhos = (obj) => (obj ? TAMANHOS.reduce((a, [k]) => a + (num(obj[k]) || 0), 0) : null)

export function indexa(registros) {
  const map = new Map()
  for (const r of registros) map.set(chave(r.mes, r.loja), r)
  return map
}

export const registroDe = (idx, mes, loja) => idx.get(chave(mes, loja)) || null

// Agrupa a análise da conferência por loja canônica (soma se dois nomes caírem na mesma loja)
export function agrupaAnalise(analise) {
  const out = new Map()
  for (const u of analise) {
    const loja = canonLoja(u.unidade)
    const atual = out.get(loja) || { loja, necessarias: 0, usadas: null }
    atual.necessarias += u.necessarias
    if (u.usadas) {
      atual.usadas = atual.usadas || { pp: 0, p: 0, m: 0, g: 0 }
      for (const [k] of TAMANHOS) atual.usadas[k] += u.usadas[k] || 0
    }
    out.set(loja, atual)
  }
  return [...out.values()]
}

// Meta para o mês seguinte a `mes` (total, sem separar tamanho — a regra vale para qualquer
// sacola): média das necessárias pela regra nos últimos 3 meses × (1 + margem). O estoque é
// opcional: com a consulta de estoque, desconta o total de sacolas que a loja já tem.
// meta null quando não há planilha de itens nos últimos 3 meses.
export function metaProximoMes(idx, mes, loja, margemPct) {
  const comRegra = Array.from({ length: JANELA_MESES }, (_, i) => registroDe(idx, somaMes(mes, -i), loja)).filter((r) => num(r?.necessarias) !== null)
  const estoqueReg = registroDe(idx, mes, loja)?.estoque || null
  const base = { meses: comRegra.length, comEstoque: !!estoqueReg }
  if (comRegra.length === 0) return { ...base, meta: null }
  const media = comRegra.reduce((a, r) => a + r.necessarias, 0) / comRegra.length
  // toFixed tira o ruído de ponto flutuante (200 × 1,1 = 220,00000000000003 → 220, não 221)
  const alvo = Math.ceil(+(media * (1 + (margemPct || 0) / 100)).toFixed(6))
  const estoque = estoqueReg ? somaTamanhos(estoqueReg) : 0
  return { ...base, media, alvo, estoque, meta: Math.max(0, alvo - estoque) }
}

// Totais de um mês somando lojas (tabela mês a mês); null onde nenhuma loja tem o dado
export function totaisDoMes(idx, mes, lojas) {
  const soma = (vals) => (vals.some((v) => v !== null) ? vals.reduce((a, v) => a + (v || 0), 0) : null)
  const regs = lojas.map((l) => registroDe(idx, mes, l)).filter(Boolean)
  if (regs.length === 0) return null
  // usadas − regra só nas lojas que têm os dois (presencial não traz sacolas usadas)
  const ambos = regs.filter((r) => r.usadas && num(r.necessarias) !== null)
  return {
    necessarias: soma(regs.map((r) => num(r.necessarias))),
    usadas: soma(regs.map((r) => somaTamanhos(r.usadas))),
    estoque: soma(regs.map((r) => somaTamanhos(r.estoque))),
    difRegra: ambos.length ? ambos.reduce((a, r) => a + somaTamanhos(r.usadas) - r.necessarias, 0) : null,
  }
}
