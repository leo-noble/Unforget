import { Switch as GlassSwitch } from 'glisse'

// Apple's Liquid Glass switch (from Glisse): the thumb lifts into a lens while
// held. Same props as before, so every caller keeps working.
export default function Switch({ checked, onChange, label, disabled = false }) {
  return <GlassSwitch aria-label={label} checked={checked} onCheckedChange={(v) => onChange?.(v)} disabled={disabled} />
}
