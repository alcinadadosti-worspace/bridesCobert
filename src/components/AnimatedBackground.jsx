import { motion } from 'framer-motion'

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div className="absolute inset-0 bg-[#0a0a0f]" />

      {/* Animated mesh gradients */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(at 0% 0%, hsla(228, 100%, 74%, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(189, 100%, 56%, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(340, 100%, 76%, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(269, 100%, 77%, 0.1) 0px, transparent 50%)',
            'radial-gradient(at 100% 0%, hsla(228, 100%, 74%, 0.15) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(189, 100%, 56%, 0.1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(340, 100%, 76%, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(269, 100%, 77%, 0.1) 0px, transparent 50%)',
            'radial-gradient(at 50% 100%, hsla(228, 100%, 74%, 0.15) 0px, transparent 50%), radial-gradient(at 50% 0%, hsla(189, 100%, 56%, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(340, 100%, 76%, 0.1) 0px, transparent 50%), radial-gradient(at 100% 50%, hsla(269, 100%, 77%, 0.1) 0px, transparent 50%)',
            'radial-gradient(at 0% 0%, hsla(228, 100%, 74%, 0.15) 0px, transparent 50%), radial-gradient(at 100% 0%, hsla(189, 100%, 56%, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(340, 100%, 76%, 0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(269, 100%, 77%, 0.1) 0px, transparent 50%)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Floating orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(99, 91, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
          left: '10%',
          top: '20%',
        }}
        animate={{
          x: [0, 100, 50, 0],
          y: [0, 50, 100, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(60px)',
          right: '10%',
          top: '10%',
        }}
        animate={{
          x: [0, -80, -40, 0],
          y: [0, 80, 40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 157, 0.3) 0%, transparent 70%)',
          filter: 'blur(60px)',
          left: '50%',
          bottom: '10%',
        }}
        animate={{
          x: [0, 60, -60, 0],
          y: [0, -60, -30, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
      />

      {/* Noise overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}

export default AnimatedBackground
