import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import AnimatedBackground from './components/AnimatedBackground'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'

function App() {
  const [data, setData] = useState(null)
  const [targetCoverage, setTargetCoverage] = useState(90)

  const handleDataLoaded = (parsedData) => {
    setData(parsedData)
  }

  const handleReset = () => {
    setData(null)
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {!data ? (
            <Hero
              key="hero"
              onDataLoaded={handleDataLoaded}
              targetCoverage={targetCoverage}
              setTargetCoverage={setTargetCoverage}
            />
          ) : (
            <Dashboard
              key="dashboard"
              data={data}
              targetCoverage={targetCoverage}
              setTargetCoverage={setTargetCoverage}
              onReset={handleReset}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App
