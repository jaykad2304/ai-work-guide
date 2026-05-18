import { motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'

const fade = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } }

export default function PageShell({
  theme = 'light',
  onThemeChange,
  title,
  eyebrow,
  description,
  icon: Icon,
  tone = 'blue',
  actions,
  children,
  maxWidth = 'wide',
}) {
  return (
    <motion.div initial="hidden" animate="show" className={`dashboard-shell dashboard-shell--premium dashboard-shell--${theme} page-shell page-shell--${maxWidth} p-4 sm:p-6 lg:px-10 lg:py-8`}>
      <motion.section variants={fade} className={`page-hero page-hero--${tone}`}>
        <div className="page-hero-copy">
          <div className="dashboard-signal-row mb-3">
            <span className="dashboard-signal-pill">{eyebrow}</span>
            <span className="dashboard-signal-text">AI Observability</span>
          </div>
          <h1 className="page-title">{title}</h1>
          <p className="page-copy">{description}</p>
        </div>

        {Icon && (
          <div className="page-hero-mark" aria-hidden="true">
            <Icon style={{ width: 54, height: 54 }} />
            <span />
          </div>
        )}

        <div className="page-hero-actions">
          <div className="dashboard-theme-toggle" aria-label="Theme selector">
            <button className={theme === 'light' ? 'is-active' : ''} type="button" onClick={() => onThemeChange?.('light')} aria-pressed={theme === 'light'}>
              <Sun style={{ width: 13, height: 13 }} /> Light
            </button>
            <button className={theme === 'dark' ? 'is-active' : ''} type="button" onClick={() => onThemeChange?.('dark')} aria-pressed={theme === 'dark'}>
              <Moon style={{ width: 13, height: 13 }} /> Dark
            </button>
          </div>
          {actions}
        </div>
      </motion.section>

      <motion.div variants={fade} className="page-content">
        {children}
      </motion.div>
    </motion.div>
  )
}
