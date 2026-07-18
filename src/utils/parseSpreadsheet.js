import * as XLSX from 'xlsx'

// Mapeamento de PDV para nomes de lojas
export const STORE_NAMES = {
  24669: 'Loja Penedo',
  24668: 'Loja Palmeira dos Índios',
  24670: 'Loja Coruripe',
  24671: 'Loja Teotonio Vilela',
  24303: 'Loja São Sebastião',
  24617: 'Loja Sustentável Palmeira',
  1515: 'VD Palmeira dos Índios',
  13707: 'VD Penedo',
  13706: 'VD Palmeira'
}

// Categorias a serem excluídas
const EXCLUDED_CATEGORIES = ['SUPORTE À VENDA', 'SUPORTE A VENDA']

// Ciclo de vendas Boticário (dias). Usado para derivar o DDV a partir da "Projeção ciclo atual"
// quando a planilha não traz DDV PREVISTO (formato DRAFT de reposição).
const CICLO_DIAS = 21

// Mapeamento de possíveis nomes de colunas para os campos esperados.
// Obs.: 'projecao'/'projeção' foram removidos de coberturaProjetada e 'ciclo' de faseProduto
// para não casarem por engano com "Projeção ciclo atual" / "Histórico ... Ciclo" do formato DRAFT.
const columnMappings = {
  sku: ['sku', 'codigo', 'código', 'cod', 'code', 'id', 'produto_id', 'product_id'],
  descricao: ['descricao', 'descrição', 'description', 'nome', 'name', 'produto', 'product'],
  categoria: ['categoria', 'category', 'cat', 'tipo', 'type', 'grupo', 'group'],
  classe: ['classe', 'class', 'classificacao', 'classificação'],
  faseProduto: ['fases produto', 'fase produto', 'fases_produto', 'fase', 'phase'],
  pdv: ['pdv', 'loja', 'store', 'filial', 'unidade'],
  estoqueAtual: ['estoque atual', 'estoque_atual', 'estoqueatual', 'stock', 'current_stock', 'qtd', 'quantidade', 'qty'],
  estoqueTransito: ['estoque em transito', 'estoque_em_transito', 'estoque em trânsito', 'em transito', 'transito', 'transit', 'in_transit'],
  pedidoPendente: ['pedido pendente', 'pedido_pendente', 'pedidopendente', 'pending', 'pendente', 'pending_order', 'pedidos'],
  coberturaAtual: ['cobertura atual', 'cobertura_atual', 'coberturaatual', 'coverage', 'current_coverage', 'dias_cobertura'],
  coberturaProjetada: ['cobertura projetada', 'cobertura_projetada', 'coberturaprojetada', 'projected_coverage'],
  ddvPrevisto: ['ddv previsto', 'ddv_previsto', 'ddv', 'demanda_diaria', 'demanda diaria'],
  // Formato DRAFT (reposição do sistema)
  projecaoCiclo: ['projecao ciclo atual', 'projeção ciclo atual'],
  compraInteligente: ['compra inteligente semanal']
}

function normalizeString(str) {
  if (!str) return ''
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function findColumnIndex(headers, possibleNames) {
  const normalizedHeaders = headers.map(h => normalizeString(h))

  for (const name of possibleNames) {
    const normalizedName = normalizeString(name)
    const index = normalizedHeaders.findIndex(h => h.includes(normalizedName) || normalizedName.includes(h))
    if (index !== -1) return index
  }

  return -1
}

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return value

  let s = value.toString().trim().replace(/[^\d.,\-]/g, '')
  if (s === '' || s === '-') return 0

  const hasDot = s.includes('.')
  const hasComma = s.includes(',')
  if (hasDot && hasComma) {
    // Formato pt-BR "1.234,56": ponto = separador de milhar, vírgula = decimal
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (hasComma) {
    // "1234,56": vírgula = decimal
    s = s.replace(',', '.')
  }
  // Só ponto: mantém como está (assume decimal, ex.: "1.5")
  const parsed = parseFloat(s)
  return isNaN(parsed) ? 0 : parsed
}

function getStoreName(pdv) {
  return STORE_NAMES[pdv] || `PDV ${pdv}`
}

export function processSheet(jsonData, sheetIndex) {
  if (jsonData.length < 2) return []

  const headers = jsonData[0]

  const columnIndices = {
    sku: findColumnIndex(headers, columnMappings.sku),
    descricao: findColumnIndex(headers, columnMappings.descricao),
    categoria: findColumnIndex(headers, columnMappings.categoria),
    classe: findColumnIndex(headers, columnMappings.classe),
    faseProduto: findColumnIndex(headers, columnMappings.faseProduto),
    pdv: findColumnIndex(headers, columnMappings.pdv),
    estoqueAtual: findColumnIndex(headers, columnMappings.estoqueAtual),
    estoqueTransito: findColumnIndex(headers, columnMappings.estoqueTransito),
    pedidoPendente: findColumnIndex(headers, columnMappings.pedidoPendente),
    coberturaAtual: findColumnIndex(headers, columnMappings.coberturaAtual),
    coberturaProjetada: findColumnIndex(headers, columnMappings.coberturaProjetada),
    ddvPrevisto: findColumnIndex(headers, columnMappings.ddvPrevisto),
    projecaoCiclo: findColumnIndex(headers, columnMappings.projecaoCiclo),
    compraInteligente: findColumnIndex(headers, columnMappings.compraInteligente)
  }

  const essentialColumns = ['sku', 'estoqueAtual']
  const missingColumns = essentialColumns.filter(col => columnIndices[col] === -1)
  if (missingColumns.length > 0) return []

  const processedData = []

  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i]

    if (!row || row.length === 0 || !row[columnIndices.sku]) continue

    const categoria = columnIndices.categoria !== -1
      ? row[columnIndices.categoria]?.toString() || 'Sem categoria'
      : 'Sem categoria'

    const normalizedCategoria = normalizeString(categoria)
    if (EXCLUDED_CATEGORIES.some(exc => normalizeString(exc) === normalizedCategoria)) {
      continue
    }

    const estoqueAtual = parseNumber(row[columnIndices.estoqueAtual])
    const estoqueTransito = columnIndices.estoqueTransito !== -1
      ? parseNumber(row[columnIndices.estoqueTransito])
      : 0
    const pedidoPendente = columnIndices.pedidoPendente !== -1
      ? parseNumber(row[columnIndices.pedidoPendente])
      : 0
    const coberturaAtual = columnIndices.coberturaAtual !== -1
      ? parseNumber(row[columnIndices.coberturaAtual])
      : 0

    // DDV previsto: usa a coluna direta; no formato DRAFT (sem DDV) deriva da projeção do ciclo
    let ddvPrevisto = columnIndices.ddvPrevisto !== -1
      ? parseNumber(row[columnIndices.ddvPrevisto])
      : 0
    const projecaoCiclo = columnIndices.projecaoCiclo !== -1
      ? parseNumber(row[columnIndices.projecaoCiclo])
      : 0
    if (columnIndices.ddvPrevisto === -1 && projecaoCiclo > 0) {
      ddvPrevisto = projecaoCiclo / CICLO_DIAS
    }

    // Sugestão de compra externa (formato DRAFT): "Compra inteligente semanal" já pronta do sistema.
    // null quando a coluna não existe (formato CONSULTA) -> o app calcula pela cobertura da classe.
    const compraInteligente = columnIndices.compraInteligente !== -1
      ? Math.round(parseNumber(row[columnIndices.compraInteligente]))
      : null

    // Cobertura = (estoque atual + trânsito) / DDV. O pedido pendente NÃO entra —
    // não é estoque disponível para vender (mesma regra da cobertura de loja/classe).
    const estoqueDisponivel = estoqueAtual + estoqueTransito
    let coberturaProjetada
    if (ddvPrevisto > 0) {
      coberturaProjetada = estoqueDisponivel / ddvPrevisto
    } else if (coberturaAtual > 0 && estoqueAtual > 0) {
      // Sem DDV: deriva da velocidade implícita na cobertura atual
      const velocidadeVenda = estoqueAtual / coberturaAtual
      coberturaProjetada = estoqueDisponivel / velocidadeVenda
    } else {
      coberturaProjetada = coberturaAtual
    }

    const pdv = columnIndices.pdv !== -1
      ? parseNumber(row[columnIndices.pdv])
      : 0
    const loja = getStoreName(pdv)

    const classe = columnIndices.classe !== -1
      ? row[columnIndices.classe]?.toString() || ''
      : ''
    const faseProduto = columnIndices.faseProduto !== -1
      ? row[columnIndices.faseProduto]?.toString() || ''
      : ''

    processedData.push({
      id: `${sheetIndex}-${i}`,
      sku: row[columnIndices.sku]?.toString() || '',
      descricao: columnIndices.descricao !== -1
        ? row[columnIndices.descricao]?.toString() || 'Sem descrição'
        : 'Sem descrição',
      categoria,
      classe,
      faseProduto,
      pdv,
      loja,
      estoqueAtual,
      estoqueTransito,
      pedidoPendente,
      ddvPrevisto: Math.round(ddvPrevisto * 100) / 100,
      coberturaAtual: Math.round(coberturaAtual * 10) / 10,
      coberturaProjetada: Math.round(coberturaProjetada * 10) / 10,
      compraInteligente
    })
  }

  return processedData
}

export function parseSpreadsheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        if (workbook.SheetNames.length === 0) {
          reject(new Error('Arquivo sem planilhas válidas'))
          return
        }

        // Processa todas as abas e combina os dados
        const allData = []
        for (let s = 0; s < workbook.SheetNames.length; s++) {
          const worksheet = workbook.Sheets[workbook.SheetNames[s]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
          const sheetData = processSheet(jsonData, s)
          allData.push(...sheetData)
        }

        if (allData.length === 0) {
          reject(new Error('Nenhum dado válido encontrado na planilha (verifique se há itens fora de SUPORTE À VENDA e se as colunas SKU e Estoque Atual existem)'))
          return
        }

        resolve(allData)
      } catch (error) {
        reject(new Error(`Erro ao processar planilha: ${error.message}`))
      }
    }

    reader.onerror = () => {
      reject(new Error('Erro ao ler o arquivo'))
    }

    reader.readAsArrayBuffer(file)
  })
}

// Meta de cobertura (dias) por classe de giro:
//   A  = maior giro        -> 57 dias
//   B  = giro médio/alto   -> 50 dias
//   C  = baixo giro        -> 30 dias
//   E  = giro mais baixo   -> 30 dias
// Itens cuja classe não está no mapa (ex.: "Sem classe") usam o padrão (targetCoverage global).
export const CLASS_TARGETS = { A: 57, B: 50, C: 30, E: 30 }

export function metaDaClasse(classe, padrao) {
  const key = (classe || '').toString().trim().toUpperCase()
  return CLASS_TARGETS[key] ?? padrao
}

// Pedido de abastecimento por quantidade.
// Cobre a demanda durante (meta da classe + prazo de entrega), descontando o estoque
// já disponível ou a caminho (atual + trânsito + pedido pendente), nunca negativo.
// Fórmula: Pedido = ceil(DDV × (meta + prazo) − (atual + trânsito + pendente)).
export function calcPedidoSugerido(item, targetCoverage, leadTime = 0, isDescontinuado = false) {
  // Descontinuados nunca geram compra; sem DDV não há como dimensionar a quantidade
  if (isDescontinuado) return 0
  if (!(item.ddvPrevisto > 0)) return 0

  const diasAlvo = targetCoverage + leadTime
  // Disponível = estoque em mãos + em trânsito. O pedido pendente NÃO entra (não conta
  // como estoque), igual à cobertura. Ainda desconta o trânsito para não recomprar o que já vem.
  const disponivel = item.estoqueAtual + item.estoqueTransito
  const pedido = item.ddvPrevisto * diasAlvo - disponivel
  return pedido > 0 ? Math.ceil(pedido) : 0
}

export function calculateDecision(item, targetCoverage, leadTime = 0) {
  // Meta de cobertura deste item = meta da sua classe (padrão = targetCoverage global)
  const meta = metaDaClasse(item.classe, targetCoverage)

  // Calcular estoque total (atual + trânsito + pendente)
  // Estoque disponível = em mãos + em trânsito. Pedido pendente NÃO conta como estoque.
  const estoqueDisponivel = item.estoqueAtual + item.estoqueTransito

  // Verificar se o produto está em descontinuação/descontinuado
  const faseNormalizada = item.faseProduto?.toLowerCase() || ''
  const isDescontinuado = faseNormalizada.includes('descontinua')

  // Quantidade sugerida de compra:
  // - Formato DRAFT: usa "Compra inteligente semanal" já pronta da planilha (número exato do sistema)
  // - Caso contrário: calcula pela cobertura da classe + prazo de entrega
  const pedidoSugerido = item.compraInteligente != null
    ? item.compraInteligente
    : calcPedidoSugerido(item, meta, leadTime, isDescontinuado)

  // Produtos descontinuados nunca devem ter sugestão de compra
  if (isDescontinuado) {
    const coverageRatio = item.coberturaProjetada / meta
    const hasExcess = coverageRatio > 1
    const excessLevel = coverageRatio > 2 ? 'high' : coverageRatio > 1 ? 'moderate' : 'none'
    const excessDays = hasExcess ? Math.round((item.coberturaProjetada - meta) * 10) / 10 : 0

    return {
      ...item,
      metaCobertura: meta,
      needsToBuy: false,
      hasExcess,
      excessLevel,
      excessDays,
      coverageGap: 0,
      pedidoSugerido,
      status: hasExcess ? 'EXCESSO' : 'SAUDÁVEL',
      urgency: 'none'
    }
  }

  // Sem DDV (sem previsão de venda): não dá para medir cobertura, urgência nem dimensionar compra.
  // Não deve entrar em "Precisam de Compra" nem em "Excesso" só porque a cobertura ficou 0.
  if (!(item.ddvPrevisto > 0)) {
    // Exceção: se veio um pedido concreto (Compra inteligente do DRAFT), respeita como compra.
    if (pedidoSugerido > 0) {
      return {
        ...item,
        metaCobertura: meta,
        needsToBuy: true,
        hasExcess: false,
        excessLevel: 'none',
        excessDays: 0,
        coverageGap: 0,
        pedidoSugerido,
        status: 'COMPRAR',
        urgency: 'medium'
      }
    }
    return {
      ...item,
      metaCobertura: meta,
      needsToBuy: false,
      hasExcess: false,
      excessLevel: 'none',
      excessDays: 0,
      coverageGap: 0,
      pedidoSugerido,
      status: 'SEM PREVISÃO',
      urgency: 'none'
    }
  }

  // DRAFT: a "Compra inteligente" é a decisão de compra autoritativa do sistema.
  // Ela manda no status (comprar ou não); a cobertura derivada só classifica quem NÃO é compra.
  // Sem isso, a cobertura aproximada marcava "Comprar/Urgente" itens que o sistema pede comprar 0.
  if (item.compraInteligente != null) {
    if (pedidoSugerido > 0) {
      const urgency = (estoqueDisponivel === 0 || item.coberturaProjetada < meta * 0.5) ? 'high' : 'medium'
      return {
        ...item,
        metaCobertura: meta,
        needsToBuy: true,
        hasExcess: false,
        excessLevel: 'none',
        excessDays: 0,
        coverageGap: Math.max(0, Math.round((meta - item.coberturaProjetada) * 10) / 10),
        pedidoSugerido,
        status: 'COMPRAR',
        urgency
      }
    }
    // Sistema não manda comprar: classifica por cobertura, sem sugerir compra
    const coverageRatio = item.coberturaProjetada / meta
    const hasExcess = coverageRatio > 1
    const excessLevel = coverageRatio > 2 ? 'high' : coverageRatio > 1 ? 'moderate' : 'none'
    const excessDays = hasExcess ? Math.round((item.coberturaProjetada - meta) * 10) / 10 : 0
    return {
      ...item,
      metaCobertura: meta,
      needsToBuy: false,
      hasExcess,
      excessLevel,
      excessDays,
      coverageGap: 0,
      pedidoSugerido: 0,
      status: hasExcess ? 'EXCESSO' : 'SAUDÁVEL',
      urgency: 'none'
    }
  }

  // Se estoque total é 0, forçar urgência máxima independente da cobertura projetada da planilha
  if (estoqueDisponivel === 0) {
    return {
      ...item,
      metaCobertura: meta,
      needsToBuy: true,
      hasExcess: false,
      excessLevel: 'none',
      excessDays: 0,
      coverageGap: meta,
      pedidoSugerido,
      status: 'COMPRAR',
      urgency: 'high'
    }
  }

  const coverageRatio = item.coberturaProjetada / meta
  const coverageGap = meta - item.coberturaProjetada

  // Determinar se precisa comprar (< 75% da meta)
  const needsToBuy = coverageRatio < 0.75

  // Verificar excesso de estoque (> 100% da meta)
  const hasExcess = coverageRatio > 1
  const excessLevel = coverageRatio > 2 ? 'high' : coverageRatio > 1 ? 'moderate' : 'none'
  const excessDays = hasExcess ? Math.round((item.coberturaProjetada - meta) * 10) / 10 : 0

  // Item em excesso não recebe sugestão de compra calculada (não se compra o que já sobra).
  // No formato DRAFT a "Compra inteligente" é autoritativa e é mantida como veio da planilha.
  const pedidoFinal = hasExcess && item.compraInteligente == null ? 0 : pedidoSugerido

  // Determinar status
  let status
  if (needsToBuy) {
    status = 'COMPRAR'
  } else if (hasExcess) {
    status = 'EXCESSO'
  } else {
    status = 'SAUDÁVEL'
  }

  // Determinar urgência de compra
  let urgency = 'none'
  if (needsToBuy) {
    if (coverageRatio < 0.5) {
      urgency = 'high'
    } else {
      urgency = 'medium'
    }
  }

  return {
    ...item,
    metaCobertura: meta,
    needsToBuy,
    hasExcess,
    excessLevel,
    excessDays,
    coverageGap: Math.max(0, Math.round(coverageGap * 10) / 10),
    pedidoSugerido: pedidoFinal,
    status,
    urgency
  }
}

// Cobertura agregada de um conjunto de itens (loja, classe ou geral), igual à
// planilha de referência "COBERTURA LOJAS":
//   Cobertura = (Σ estoque atual + Σ estoque em trânsito) / Σ DDV previsto
// É uma razão de somas ponderada pela demanda (NÃO a média das coberturas por
// item) e o pedido pendente NÃO entra no estoque — exatamente como a planilha.
export function coberturaAgregada(items) {
  let estoque = 0
  let ddv = 0
  for (const it of items) {
    estoque += (it.estoqueAtual || 0) + (it.estoqueTransito || 0)
    ddv += (it.ddvPrevisto || 0)
  }
  return ddv > 0 ? Math.round((estoque / ddv) * 10) / 10 : 0
}

export function analyzeData(data, targetCoverage, leadTime = 0) {
  const analyzed = data.map(item => calculateDecision(item, targetCoverage, leadTime))

  // Agrupar por loja
  const storeStats = {}
  analyzed.forEach(item => {
    if (!storeStats[item.loja]) {
      storeStats[item.loja] = {
        pdv: item.pdv,
        total: 0,
        needToBuy: 0,
        healthy: 0,
        hasExcess: 0,
        unidadesComprar: 0,
        semPrevisao: 0,  // itens sem DDV (status "SEM PREVISÃO")
        sumEstoque: 0,   // Σ (estoque atual + trânsito) — numerador da cobertura
        sumDDV: 0,       // Σ DDV previsto — denominador da cobertura
        sumMetaXDDV: 0,  // Σ (meta da classe × DDV) — para a meta ponderada da loja
        avgCoverage: 0,
        meta: 0
      }
    }
    const s = storeStats[item.loja]
    s.total++
    s.sumEstoque += item.estoqueAtual + item.estoqueTransito
    s.sumDDV += item.ddvPrevisto
    s.sumMetaXDDV += item.metaCobertura * item.ddvPrevisto
    s.unidadesComprar += item.pedidoSugerido
    if (item.needsToBuy) s.needToBuy++
    else if (item.hasExcess) s.hasExcess++
    else if (item.status === 'SEM PREVISÃO') s.semPrevisao++
    else s.healthy++
  })

  // Cobertura da loja = (Σ estoque atual + Σ trânsito) / Σ DDV previsto (igual à planilha)
  // Meta da loja = média das metas de classe ponderada pelo DDV (0 se a loja não tem demanda)
  Object.values(storeStats).forEach(s => {
    s.avgCoverage = s.sumDDV > 0 ? Math.round((s.sumEstoque / s.sumDDV) * 10) / 10 : 0
    s.meta = s.sumDDV > 0 ? Math.round(s.sumMetaXDDV / s.sumDDV) : targetCoverage
    delete s.sumEstoque
    delete s.sumDDV
    delete s.sumMetaXDDV
  })

  // Encontrar lojas únicas
  const stores = [...new Set(analyzed.map(item => item.loja))].sort()

  // Encontrar classes e fases únicas
  const classes = [...new Set(analyzed.map(item => item.classe))].filter(Boolean).sort()
  const fases = [...new Set(analyzed.map(item => item.faseProduto))].filter(Boolean)

  const summary = {
    totalSKUs: analyzed.length,
    needToBuy: analyzed.filter(item => item.needsToBuy).length,
    // Itens que efetivamente geram pedido de compra (> 0) — bate com "unidadesComprar"
    comPedido: analyzed.filter(item => item.pedidoSugerido > 0).length,
    unidadesComprar: analyzed.reduce((acc, item) => acc + item.pedidoSugerido, 0),
    healthy: analyzed.filter(item => item.status === 'SAUDÁVEL').length,
    // Itens sem DDV (sem base para decisão de compra/cobertura)
    semPrevisao: analyzed.filter(item => item.status === 'SEM PREVISÃO').length,
    highUrgency: analyzed.filter(item => item.urgency === 'high').length,
    mediumUrgency: analyzed.filter(item => item.urgency === 'medium').length,
    // Excesso
    hasExcess: analyzed.filter(item => item.hasExcess).length,
    excessHigh: analyzed.filter(item => item.excessLevel === 'high').length,
    excessModerate: analyzed.filter(item => item.excessLevel === 'moderate').length,
    // Metadados
    categories: [...new Set(analyzed.map(item => item.categoria))].sort(),
    stores,
    storeStats,
    classes,
    fases,
    // Fonte da sugestão de compra: true = "Compra inteligente" veio pronta na planilha (formato DRAFT)
    hasCompraInteligente: analyzed.some(i => i.compraInteligente != null),
    // Cobertura geral (todas as lojas) pela mesma regra da planilha
    avgCoverage: coberturaAgregada(analyzed),
    // Meta geral = média das metas de classe ponderada pelo DDV (para colorir a cobertura geral)
    meta: (() => {
      const totalDDV = analyzed.reduce((a, it) => a + it.ddvPrevisto, 0)
      return totalDDV > 0
        ? Math.round(analyzed.reduce((a, it) => a + it.metaCobertura * it.ddvPrevisto, 0) / totalDDV)
        : targetCoverage
    })()
  }

  return { items: analyzed, summary }
}

// Função para analisar oportunidades de transferência
export function analyzeTransfers(data, targetCoverage, leadTime = 0) {
  const analyzed = data.map(item => calculateDecision(item, targetCoverage, leadTime))

  // Agrupar por SKU
  const skuGroups = {}
  analyzed.forEach(item => {
    if (!skuGroups[item.sku]) {
      skuGroups[item.sku] = {
        sku: item.sku,
        descricao: item.descricao,
        categoria: item.categoria,
        classe: item.classe,
        faseProduto: item.faseProduto,
        stores: []
      }
    }
    // Transferência: cobertura considera SÓ estoque em mãos + trânsito (pedido pendente NÃO entra).
    // Sem DDV não há demanda para decidir excesso/necessidade.
    const temDDV = item.ddvPrevisto > 0
    const cobTransfer = temDDV
      ? Math.round(((item.estoqueAtual + item.estoqueTransito) / item.ddvPrevisto) * 10) / 10
      : 0
    const ratio = temDDV ? cobTransfer / item.metaCobertura : 0
    const hasExcess = temDDV && ratio > 1
    const needsToBuy = temDDV && ratio < 0.75
    const excessLevel = ratio > 2 ? 'high' : ratio > 1 ? 'moderate' : 'none'

    skuGroups[item.sku].stores.push({
      loja: item.loja,
      pdv: item.pdv,
      estoqueAtual: item.estoqueAtual,
      coberturaProjetada: cobTransfer,
      status: item.status,
      needsToBuy,
      hasExcess,
      excessLevel
    })
  })

  // Encontrar oportunidades de transferência
  // Um SKU é candidato se: uma loja tem EXCESSO e outra loja precisa COMPRAR
  const transferOpportunities = []

  Object.values(skuGroups).forEach(group => {
    if (group.stores.length < 2) return // Precisa estar em pelo menos 2 lojas

    const excessStores = group.stores.filter(s => s.hasExcess)
    const needStores = group.stores.filter(s => s.needsToBuy)

    if (excessStores.length > 0 && needStores.length > 0) {
      // Ordenar por prioridade (excesso alto primeiro, urgência alta primeiro)
      excessStores.sort((a, b) => {
        if (a.excessLevel === 'high' && b.excessLevel !== 'high') return -1
        if (b.excessLevel === 'high' && a.excessLevel !== 'high') return 1
        return b.coberturaProjetada - a.coberturaProjetada
      })

      needStores.sort((a, b) => a.coberturaProjetada - b.coberturaProjetada)

      transferOpportunities.push({
        sku: group.sku,
        descricao: group.descricao,
        categoria: group.categoria,
        classe: group.classe,
        faseProduto: group.faseProduto,
        from: excessStores.map(s => ({
          loja: s.loja,
          estoqueAtual: s.estoqueAtual,
          coberturaProjetada: s.coberturaProjetada,
          excessLevel: s.excessLevel
        })),
        to: needStores.map(s => ({
          loja: s.loja,
          estoqueAtual: s.estoqueAtual,
          coberturaProjetada: s.coberturaProjetada
        })),
        priority: excessStores.some(s => s.excessLevel === 'high') ? 'high' : 'medium'
      })
    }
  })

  // Ordenar por prioridade
  transferOpportunities.sort((a, b) => {
    if (a.priority === 'high' && b.priority !== 'high') return -1
    if (b.priority === 'high' && a.priority !== 'high') return 1
    return 0
  })

  return transferOpportunities
}
