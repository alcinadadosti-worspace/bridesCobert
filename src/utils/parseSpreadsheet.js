import * as XLSX from 'xlsx'

// Mapeamento de PDV para nomes de lojas
export const STORE_NAMES = {
  24669: 'Loja Penedo',
  24668: 'Loja Palmeira dos Índios',
  24670: 'Loja Coruripe',
  24671: 'Loja Teotonio Vilela',
  24303: 'Loja São Sebastião',
  1515: 'VD Palmeira dos Índios',
  1048: 'VD Penedo',
  13707: 'VD Penedo',
  13706: 'VD Palmeira'
}

// Categorias a serem excluídas
const EXCLUDED_CATEGORIES = ['SUPORTE À VENDA', 'SUPORTE A VENDA']

// Mapeamento de possíveis nomes de colunas para os campos esperados
const columnMappings = {
  sku: ['sku', 'codigo', 'código', 'cod', 'code', 'id', 'produto_id', 'product_id'],
  descricao: ['descricao', 'descrição', 'description', 'nome', 'name', 'produto', 'product'],
  categoria: ['categoria', 'category', 'cat', 'tipo', 'type', 'grupo', 'group'],
  classe: ['classe', 'class', 'classificacao', 'classificação'],
  faseProduto: ['fases produto', 'fase produto', 'fases_produto', 'fase', 'phase', 'ciclo'],
  pdv: ['pdv', 'loja', 'store', 'filial', 'unidade'],
  estoqueAtual: ['estoque atual', 'estoque_atual', 'estoqueatual', 'stock', 'current_stock', 'qtd', 'quantidade', 'qty'],
  estoqueTransito: ['estoque em transito', 'estoque_em_transito', 'estoque em trânsito', 'em transito', 'transito', 'transit', 'in_transit'],
  pedidoPendente: ['pedido pendente', 'pedido_pendente', 'pedidopendente', 'pending', 'pendente', 'pending_order', 'pedidos'],
  coberturaAtual: ['cobertura atual', 'cobertura_atual', 'coberturaatual', 'coverage', 'current_coverage', 'dias_cobertura'],
  coberturaProjetada: ['cobertura projetada', 'cobertura_projetada', 'coberturaprojetada', 'projected_coverage', 'projecao', 'projeção'],
  ddvPrevisto: ['ddv previsto', 'ddv_previsto', 'ddv', 'demanda_diaria', 'demanda diaria']
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

  const cleaned = value.toString().replace(/[^\d.,\-]/g, '').replace(',', '.')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

function getStoreName(pdv) {
  return STORE_NAMES[pdv] || `PDV ${pdv}`
}

export function parseSpreadsheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })

        // Pega a primeira planilha
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]

        // Converte para JSON com defval para garantir todas as colunas
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })

        if (jsonData.length < 2) {
          reject(new Error('A planilha deve ter pelo menos um cabeçalho e uma linha de dados'))
          return
        }

        const headers = jsonData[0]

        // Encontra os índices das colunas
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
          ddvPrevisto: findColumnIndex(headers, columnMappings.ddvPrevisto)
        }

        // Verifica se encontrou as colunas essenciais
        const essentialColumns = ['sku', 'estoqueAtual']
        const missingColumns = essentialColumns.filter(col => columnIndices[col] === -1)

        if (missingColumns.length > 0) {
          reject(new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}. Verifique se sua planilha contém as colunas: SKU, Estoque Atual`))
          return
        }

        // Processa os dados
        const processedData = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]

          // Pula linhas vazias
          if (!row || row.length === 0 || !row[columnIndices.sku]) continue

          // Pega a categoria
          const categoria = columnIndices.categoria !== -1
            ? row[columnIndices.categoria]?.toString() || 'Sem categoria'
            : 'Sem categoria'

          // Filtra categorias excluídas (SUPORTE À VENDA)
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

          // Cobertura projetada
          let coberturaProjetada
          if (columnIndices.coberturaProjetada !== -1) {
            coberturaProjetada = parseNumber(row[columnIndices.coberturaProjetada])
          } else if (coberturaAtual > 0 && estoqueAtual > 0) {
            const velocidadeVenda = estoqueAtual / coberturaAtual
            const estoqueTotal = estoqueAtual + estoqueTransito + pedidoPendente
            coberturaProjetada = estoqueTotal / velocidadeVenda
          } else {
            coberturaProjetada = coberturaAtual
          }

          // PDV / Loja
          const pdv = columnIndices.pdv !== -1
            ? parseNumber(row[columnIndices.pdv])
            : 0
          const loja = getStoreName(pdv)

          // Classe e Fase
          const classe = columnIndices.classe !== -1
            ? row[columnIndices.classe]?.toString() || ''
            : ''
          const faseProduto = columnIndices.faseProduto !== -1
            ? row[columnIndices.faseProduto]?.toString() || ''
            : ''

          // DDV
          const ddvPrevisto = columnIndices.ddvPrevisto !== -1
            ? parseNumber(row[columnIndices.ddvPrevisto])
            : 0

          processedData.push({
            id: i,
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
            coberturaProjetada: Math.round(coberturaProjetada * 10) / 10
          })
        }

        if (processedData.length === 0) {
          reject(new Error('Nenhum dado válido encontrado na planilha (verifique se há itens fora de SUPORTE À VENDA)'))
          return
        }

        resolve(processedData)
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

export function calculateDecision(item, targetCoverage) {
  // Calcular estoque total (atual + trânsito + pendente)
  const estoqueTotal = item.estoqueAtual + item.estoqueTransito + item.pedidoPendente

  // Se estoque total é 0, forçar urgência máxima independente da cobertura projetada da planilha
  if (estoqueTotal === 0) {
    return {
      ...item,
      needsToBuy: true,
      hasExcess: false,
      excessLevel: 'none',
      excessDays: 0,
      coverageGap: targetCoverage,
      status: 'COMPRAR',
      urgency: 'high'
    }
  }

  const coverageRatio = item.coberturaProjetada / targetCoverage
  const coverageGap = targetCoverage - item.coberturaProjetada

  // Determinar se precisa comprar (< 75% da meta)
  const needsToBuy = coverageRatio < 0.75

  // Verificar excesso de estoque (> 100% da meta)
  const hasExcess = coverageRatio > 1
  const excessLevel = coverageRatio > 2 ? 'high' : coverageRatio > 1 ? 'moderate' : 'none'
  const excessDays = hasExcess ? Math.round((item.coberturaProjetada - targetCoverage) * 10) / 10 : 0

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
    needsToBuy,
    hasExcess,
    excessLevel,
    excessDays,
    coverageGap: Math.max(0, Math.round(coverageGap * 10) / 10),
    status,
    urgency
  }
}

export function analyzeData(data, targetCoverage) {
  const analyzed = data.map(item => calculateDecision(item, targetCoverage))

  // Agrupar por loja
  const storeStats = {}
  analyzed.forEach(item => {
    if (!storeStats[item.loja]) {
      storeStats[item.loja] = {
        pdv: item.pdv,
        total: 0,
        needToBuy: 0,
        healthy: 0,
        hasExcess: 0
      }
    }
    storeStats[item.loja].total++
    if (item.needsToBuy) storeStats[item.loja].needToBuy++
    else if (item.hasExcess) storeStats[item.loja].hasExcess++
    else storeStats[item.loja].healthy++
  })

  // Encontrar lojas únicas
  const stores = [...new Set(analyzed.map(item => item.loja))].sort()

  // Encontrar classes e fases únicas
  const classes = [...new Set(analyzed.map(item => item.classe))].filter(Boolean).sort()
  const fases = [...new Set(analyzed.map(item => item.faseProduto))].filter(Boolean)

  const summary = {
    totalSKUs: analyzed.length,
    needToBuy: analyzed.filter(item => item.needsToBuy).length,
    healthy: analyzed.filter(item => !item.needsToBuy && !item.hasExcess).length,
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
    avgCoverage: Math.round((analyzed.reduce((acc, item) => acc + item.coberturaProjetada, 0) / analyzed.length) * 10) / 10
  }

  return { items: analyzed, summary }
}

// Função para analisar oportunidades de transferência
export function analyzeTransfers(data, targetCoverage) {
  const analyzed = data.map(item => calculateDecision(item, targetCoverage))

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
    skuGroups[item.sku].stores.push({
      loja: item.loja,
      pdv: item.pdv,
      estoqueAtual: item.estoqueAtual,
      coberturaProjetada: item.coberturaProjetada,
      status: item.status,
      needsToBuy: item.needsToBuy,
      hasExcess: item.hasExcess,
      excessLevel: item.excessLevel
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
