import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import AnimatedBackground from './components/AnimatedBackground'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import SacolasPage from './components/SacolasPage'

function App() {
  const [data, setData] = useState(null)
  const [targetCoverage, setTargetCoverage] = useState(57)
  const [leadTime, setLeadTime] = useState(0)
  const [view, setView] = useState('home') // 'home' | 'sacolas'

  const handleDataLoaded = (parsedData) => {
    setData(parsedData)
    setView('home')
  }

  const handleReset = () => {
    setData(null)
    setView('home')
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {data ? (
            <Dashboard
              key="dashboard"
              data={data}
              targetCoverage={targetCoverage}
              setTargetCoverage={setTargetCoverage}
              leadTime={leadTime}
              setLeadTime={setLeadTime}
              onReset={handleReset}
            />
          ) : view === 'sacolas' ? (
            <SacolasPage key="sacolas" onBack={() => setView('home')} />
          ) : (
            <Hero
              key="hero"
              onDataLoaded={handleDataLoaded}
              targetCoverage={targetCoverage}
              setTargetCoverage={setTargetCoverage}
              leadTime={leadTime}
              setLeadTime={setLeadTime}
              onGoToSacolas={() => setView('sacolas')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
