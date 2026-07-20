import { motion } from 'framer-motion'
import { BarChart2, ShoppingCart, AlertOctagon, ArrowLeftRight, PackageX, ShoppingBag, ArrowRight } from 'lucide-react'
import FileUpload from './FileUpload'
import logoUrl from '../assets/logo.png'

const capacidades = [
  { icon: BarChart2, nome: 'Cobertura', desc: 'por loja e por classe, em dias' },
  { icon: ShoppingCart, nome: 'Sugestão de compra', desc: 'quanto comprar, meta por classe' },
  { icon: AlertOctagon, nome: 'Ruptura', desc: 'venda prevista, mas sem estoque' },
  { icon: ArrowLeftRight, nome: 'Transferências', desc: 'remanejar excesso entre lojas' },
  { icon: PackageX, nome: 'Estoque parado', desc: 'giro lento por loja' },
  { icon: ShoppingBag, nome: 'Sacolas', desc: 'conferência da regra por loja' },
]

function Hero({ onDataLoaded, onGoToSacolas }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen flex flex-col"
    >
      {/* Header */}
      <header className="w-full px-6 lg:px-10 py-5 border-b border-white/5">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <img src={logoUrl} alt="Logo" className="h-11 w-auto object-contain" />
          <div className="leading-tight">
            <div className="text-base font-semibold text-white">Supply Flow</div>
            <div className="text-xs text-gray-500">Análise de estoque e compras</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 w-full flex items-center px-6 lg:px-10 py-12">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Esquerda — o que a ferramenta faz */}
          <div>
            <p className="text-2xl md:text-3xl font-semibold leading-snug tracking-tight text-white max-w-xl mb-8">
              Suba a consulta de estoque e veja, por loja e por classe:{' '}
              <span className="text-gold-300">cobertura</span>,{' '}
              <span className="text-gold-300">o que comprar</span>,{' '}
              <span className="text-gold-300">transferências entre lojas</span>,{' '}
              <span className="text-gold-300">itens em ruptura</span> e{' '}
              <span className="text-gold-300">estoque parado</span>
              <span className="font-normal text-gray-400"> — tudo no navegador.</span>
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {capacidades.map((c) => (
                <div key={c.nome} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <c.icon className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{c.nome}</div>
                    <div className="text-xs text-gray-500">{c.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Direita — subir arquivo (ação principal) */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">Comece subindo a consulta de estoque</p>
            <FileUpload onDataLoaded={onDataLoaded} />
            <div className="mt-5">
              <button
                onClick={onGoToSacolas}
                className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-gold-400" />
                Conferir sacolas de uma planilha de vendas
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 lg:px-10 py-5 border-t border-white/5">
        <div className="max-w-6xl mx-auto text-xs text-gray-500">
          Processamento 100% local. Seus dados nunca saem do navegador.
        </div>
      </footer>
    </motion.div>
  )
}

export default Hero
