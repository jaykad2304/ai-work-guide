import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, FolderOpen, Search, Lightbulb, Database, Clock, BarChart3, Cable } from 'lucide-react'
import PageShell from './PageShell'
import { connectorsAPI } from '../api'

const FEATURES = [
  { icon: BarChart3, tone: 'blue', title: 'Dashboard', desc: 'Real-time overview of AI activity, token burn, coverage, and quality signals.' },
  { icon: FolderOpen, tone: 'green', title: 'Projects', desc: 'Sessions grouped by workspace so project-level effort is easy to scan.' },
  { icon: Clock, tone: 'amber', title: 'Timeline', desc: 'Chronological session history grouped by day with tokens and activity context.' },
  { icon: Search, tone: 'cyan', title: 'Search', desc: 'Full-text lookup across titles, summaries, topics, and local session records.' },
  { icon: Lightbulb, tone: 'violet', title: 'Insights', desc: 'Usage patterns and recommendations extracted from your AI work history.' },
]

const STACK = [
  { label: 'Backend',   value: 'FastAPI + SQLAlchemy + SQLite' },
  { label: 'Frontend',  value: 'React 18 + Vite + Tailwind CSS v4' },
  { label: 'Charts',    value: 'Recharts' },
  { label: 'Animation', value: 'Framer Motion' },
  { label: 'Data',      value: 'Claude CLI JSONL session files' },
  { label: 'Deploy',    value: 'Docker Compose' },
]

const fade  = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }

export default function AboutView({ theme = 'light', onThemeChange }) {
  const [connectors, setConnectors] = useState([])

  useEffect(() => {
    connectorsAPI.list()
      .then(response => setConnectors(response.data.connectors || []))
      .catch(() => setConnectors([]))
  }, [])

  return (
    <PageShell
      theme={theme}
      onThemeChange={onThemeChange}
      title="AI Observer"
      eyebrow="About"
      description="A local observability platform for tracking, visualizing, and making sense of work done through AI tools."
      icon={Brain}
      tone="cyan"
      maxWidth="content"
    >
        <motion.div variants={stagger} initial="hidden" animate="show" className="mb-10">
          <motion.h2 variants={fade} className="section-title">What it does</motion.h2>
          <div className="feature-grid">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <motion.div key={f.title} variants={fade}
                  whileHover={{ y: -3 }}
                  className={`feature-card feature-card--${f.tone}`}>
                  <div className="feature-icon">
                    <Icon style={{ width: 18, height: 18 }} />
                  </div>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="ops-panel mb-8">
          <h2 className="section-title">How it works</h2>
          <div className="step-list">
            {[
              { n: '01', title: 'Reads your Claude CLI sessions', desc: 'Parses the JSONL files Claude writes to ~/.claude/projects/ after each conversation.' },
              { n: '02', title: 'Extracts metadata', desc: 'Pulls out session title, summary, topics, token count, duration, tool used, and the project directory.' },
              { n: '03', title: 'Stores in a local database', desc: 'All data lives in a SQLite file on your machine — nothing leaves your system.' },
              { n: '04', title: 'Serves a live dashboard', desc: 'FastAPI backend + React frontend give you real-time visibility into your AI usage patterns.' },
            ].map(step => (
              <div key={step.n} className="step-row">
                <span>{step.n}</span>
                <div>
                  <p>{step.title}</p>
                  <small>{step.desc}</small>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="ops-panel mb-8">
          <div className="ops-panel-heading">
            <div className="ops-panel-icon ops-panel-icon--blue">
              <Database style={{ width: 18, height: 18 }} />
            </div>
            <h2>Tech Stack</h2>
          </div>
          <div className="stack-grid">
            {STACK.map(s => (
              <div key={s.label} className="stack-item">
                <p>{s.label}</p>
                <strong>{s.value}</strong>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
          className="ops-panel mb-8">
          <div className="ops-panel-heading">
            <div className="ops-panel-icon ops-panel-icon--violet">
              <Cable style={{ width: 18, height: 18 }} />
            </div>
            <h2>Connector Coverage</h2>
          </div>
          <div className="connector-grid">
            {connectors.map(connector => (
              <div key={connector.name} className={`connector-card connector-card--${connector.status}`}>
                <div>
                  <span>{connector.status.replace('_', ' ')}</span>
                  <h3>{connector.display_name}</h3>
                  <p>{connector.description}</p>
                </div>
                <small>{connector.enabled ? 'Enabled' : connector.setup_hint}</small>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="privacy-note">
          <Zap style={{ width: 18, height: 18, marginTop: 2, flexShrink: 0 }} />
          <div>
            <p>100% local &amp; private</p>
            <small>
              All your session data stays on your machine. The SQLite database, the backend, and the frontend all run locally via Docker. Nothing is sent to any external server.
            </small>
          </div>
        </motion.div>
    </PageShell>
  )
}
