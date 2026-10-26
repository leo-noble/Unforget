import { motion } from 'framer-motion'
import { snappy } from './motion'

// UISwitch at its real size (51×31), green when on like the system one.
// The knob stretches a little while pressed, the way the real one does.
export default function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      whileTap="pressed"
      className={`relative flex w-[51px] h-[31px] shrink-0 rounded-full p-[2px] transition-colors duration-200 disabled:opacity-40 ${
        checked ? 'bg-green' : 'bg-fill-2'
      }`}
    >
      <motion.span
        layout
        transition={snappy}
        variants={{ pressed: { width: 33 } }}
        className="block h-[27px] w-[27px] rounded-full bg-white"
        style={{
          marginLeft: checked ? 'auto' : 0,
          boxShadow: '0 3px 8px rgba(0,0,0,0.15), 0 3px 1px rgba(0,0,0,0.06)',
        }}
      />
    </motion.button>
  )
}
