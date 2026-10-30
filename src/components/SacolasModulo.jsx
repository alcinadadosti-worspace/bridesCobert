import { useState, lazy, Suspense } from 'react'
import { ClipboardCheck, History } from 'lucide-react'
import Sacolas from './Sacolas'

// O histórico usa o Firebase; carrega só quando a aba é aberta, para não pesar o resto do app
const SacolasHistorico = lazy(() => import('./SacolasHistorico'))

const ABAS = [
  ['conferencia', 'Conferência', ClipboardCheck],
  ['historico', 'Histórico e meta de compra', History],
]

// Sacolas: conferência da regra (planilha local) + histórico mensal (nuvem).
// As duas abas ficam montadas depois de abertas, para não perder planilha nem o que foi digitado.
function SacolasModulo() {
  const [aba, setAba] = useState('conferencia')
  const [abriuHistorico, setAbriuHistorico] = useState(false)
  const [conferencia, setConferencia] = useState(null) // { analise, fileName } da conferência carregada

  const ir = (a) => {
    setAba(a)
    if (a === 'historico') setAbriuHistorico(true)
  }

  return (
    <div className="space-y-6">
      <div className="inline-flex flex-wrap gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
        {ABAS.map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => ir(id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${aba === id ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            <Icon className={`w-4 h-4 ${aba === id ? 'text-gold-400' : ''}`} />
            {label}
          </button>
        ))}
      </div>

      <div className={aba === 'conferencia' ? '' : 'hidden'}>
        <Sacolas onAnalise={setConferencia} />
      </div>
      {abriuHistorico && (
        <div className={aba === 'historico' ? '' : 'hidden'}>
          <Suspense fallback={<p className="text-sm text-gray-500">Carregando histórico…</p>}>
            <SacolasHistorico conferencia={conferencia} />
          </Suspense>
        </div>
      )}
    </div>
  )
}

export default SacolasModulo
