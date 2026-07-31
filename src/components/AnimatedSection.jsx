import { useEffect, useRef } from 'react'
import { motion, useAnimation, useInView } from 'framer-motion'

export default function AnimatedSection({ children, staggerChildren = 0 }) {
  const ref = useRef(null)
  const controls = useAnimation()
  const inView = useInView(ref, { amount: 0.2 })

  useEffect(() => {
    controls.start(
      inView
        ? {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
          }
        : {
            opacity: 0,
            y: 50,
            scale: 0.98,
            transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
          }
    )
  }, [controls, inView])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      animate={controls}
      variants={staggerChildren > 0 ? { visible: { transition: { staggerChildren } } } : undefined}
    >
      {children}
    </motion.div>
  )
}
