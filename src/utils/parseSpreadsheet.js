import * as XLSX from 'xlsx'

// Mapeamento de possíveis nomes de colunas para os campos esperados
const columnMappings = {
  sku: ['sku', 'codigo', 'código', 'cod', 'code', 'id', 'produto_id', 'product_id'],
  descricao: ['descricao', 'descrição', 'description', 'nome', 'name', 'produto', 'product'],
  categoria: ['categoria', 'category', 'cat', 'tipo', 'type', 'grupo', 'group'],
  estoqueAtual: ['estoque atual', 'estoque_atual', 'estoqueatual', 'stock', 'current_stock', 'qtd', 'quantidade', 'qty'],
  estoqueTransito: ['estoque em transito', 'estoque_em_transito', 'estoque em trânsito', 'em transito', 'transito', 'transit', 'in_transit'],
  pedidoPendente: ['pedido pendente', 'pedido_pendente', 'pedidopendente', 'pending', 'pendente', 'pending_order', 'pedidos'],
  coberturaAtual: ['cobertura atual', 'cobertura_atual', 'coberturaatual', 'coverage', 'current_coverage', 'dias_cobertura'],
  coberturaProjetada: ['cobertura projetada', 'cobertura_projetada', 'coberturaprojetada', 'projected_coverage', 'projecao', 'projeção']
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

        // Converte para JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

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
          estoqueAtual: findColumnIndex(headers, columnMappings.estoqueAtual),
          estoqueTransito: findColumnIndex(headers, columnMappings.estoqueTransito),
          pedidoPendente: findColumnIndex(headers, columnMappings.pedidoPendente),
          coberturaAtual: findColumnIndex(headers, columnMappings.coberturaAtual),
          coberturaProjetada: findColumnIndex(headers, columnMappings.coberturaProjetada)
        }

        // Verifica se encontrou as colunas essenciais
        const essentialColumns = ['sku', 'estoqueAtual', 'coberturaAtual']
        const missingColumns = essentialColumns.filter(col => columnIndices[col] === -1)

        if (missingColumns.length > 0) {
          reject(new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}. Verifique se sua planilha contém as colunas: SKU, Estoque Atual, Cobertura Atual`))
          return
        }

        // Processa os dados
        const processedData = []

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i]

          // Pula linhas vazias
          if (!row || row.length === 0 || !row[columnIndices.sku]) continue

          const estoqueAtual = parseNumber(row[columnIndices.estoqueAtual])
          const estoqueTransito = columnIndices.estoqueTransito !== -1
            ? parseNumber(row[columnIndices.estoqueTransito])
            : 0
          const pedidoPendente = columnIndices.pedidoPendente !== -1
            ? parseNumber(row[columnIndices.pedidoPendente])
            : 0
          const coberturaAtual = parseNumber(row[columnIndices.coberturaAtual])

          // Se não tiver cobertura projetada, calcula baseado na velocidade de venda
          let coberturaProjetada
          if (columnIndices.coberturaProjetada !== -1) {
            coberturaProjetada = parseNumber(row[columnIndices.coberturaProjetada])
          } else {
            // Calcula a cobertura projetada
            // Velocidade de venda = Estoque Atual / Cobertura Atual (itens por dia)
            // Cobertura Projetada = (Estoque Atual + Transito + Pendente) / Velocidade de venda
            if (coberturaAtual > 0 && estoqueAtual > 0) {
              const velocidadeVenda = estoqueAtual / coberturaAtual
              const estoqueTotal = estoqueAtual + estoqueTransito + pedidoPendente
              coberturaProjetada = estoqueTotal / velocidadeVenda
            } else {
              coberturaProjetada = coberturaAtual
            }
          }

          processedData.push({
            id: i,
            sku: row[columnIndices.sku]?.toString() || '',
            descricao: columnIndices.descricao !== -1
              ? row[columnIndices.descricao]?.toString() || 'Sem descrição'
              : 'Sem descrição',
            categoria: columnIndices.categoria !== -1
              ? row[columnIndices.categoria]?.toString() || 'Sem categoria'
              : 'Sem categoria',
            estoqueAtual,
            estoqueTransito,
            pedidoPendente,
            coberturaAtual: Math.round(coberturaAtual * 10) / 10,
            coberturaProjetada: Math.round(coberturaProjetada * 10) / 10
          })
        }

        if (processedData.length === 0) {
          reject(new Error('Nenhum dado válido encontrado na planilha'))
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
    categories: [...new Set(analyzed.map(item => item.categoria))],
    avgCoverage: Math.round((analyzed.reduce((acc, item) => acc + item.coberturaProjetada, 0) / analyzed.length) * 10) / 10
  }

  return { items: analyzed, summary }
}
