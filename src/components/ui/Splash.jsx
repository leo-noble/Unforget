import { motion } from 'framer-motion'
import AppIcon from './AppIcon'

// Shown only while the stored session is being read. It fades in after a beat,
// so on the usual instant check the user never sees it at all.
export default function Splash() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-canvas">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
      >
        <AppIcon size={84} />
      </motion.div>
    </div>
  )
}
