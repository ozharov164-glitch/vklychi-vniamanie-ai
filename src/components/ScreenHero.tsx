import { motion } from 'framer-motion'

type Props = {
  image: string
  alt: string
  eyebrow?: string
  title: string
  subtitle: string
  compact?: boolean
}

export function ScreenHero({ image, alt, eyebrow, title, subtitle, compact }: Props) {
  return (
    <motion.header
      className="screen-hero"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className={`screen-hero__visual ${compact ? 'screen-hero__visual--compact' : ''}`}
        initial={{ scale: 0.96 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <img src={image} alt="" className="screen-hero__img" decoding="sync" aria-hidden />
        <div className="screen-hero__glow" />
      </motion.div>
      <div className="screen-hero__copy">
        {eyebrow && <p className="screen-hero__eyebrow">{eyebrow}</p>}
        <h1 className="screen-hero__title">{title}</h1>
        <p className="screen-hero__subtitle">{subtitle}</p>
      </div>
    </motion.header>
  )
}
