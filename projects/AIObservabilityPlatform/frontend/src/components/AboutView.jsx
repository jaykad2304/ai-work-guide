import { motion } from 'framer-motion'
import { Brain, Zap, FolderOpen, Search, Lightbulb, Database, Clock, BarChart3, Github } from 'lucide-react'

const FEATURES = [
  { icon: BarChart3, color: '#818cf8', title: 'Dashboard',    desc: 'Real-time overview of your AI activity — sessions, tokens, active days, and daily charts.' },
  { icon: FolderOpen, color: '#c084fc', title: 'Projects',    desc: 'Sessions automatically grouped by the directory Claude was invoked from.' },
  { icon: Clock,      color: '#fb923c', title: 'Timeline',    desc: 'Every session in chronological order, grouped by day with token and activity scores.' },
  { icon: Search,     color: '#2dd4bf', title: 'Search',      desc: 'Full-text search across session titles, summaries, and topics instantly.' },
  { icon: Lightbulb, color: '#f472b6', title: 'Insights',    desc: 'Auto-detected usage patterns and recommendations based on your history.' },
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

export default function AboutView() {
  return (
    <div className="p-6 lg:p-10 min-h-screen">
      <div className="max-w-4xl mx-auto">

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
          <motion.div
            animate={{ scale: [1, 1.06, 1], boxShadow: ['0 0 24px rgba(99,102,241,0.4)', '0 0 56px rgba(139,92,246,0.6)', '0 0 24px rgba(99,102,241,0.4)'] }}
            transition={{ repeat: Infinity, duration: 2.8 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            <Brain className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl font-black text-white tracking-tight mb-3">AI Observer</h1>
          <p className="text-lg text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            A personal observability platform that tracks, visualizes, and makes sense of everything you do with AI tools.
          </p>
        </motion.div>

        {/* What it does */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="mb-10">
          <motion.h2 variants={fade} className="text-xl font-black text-white mb-5">What it does</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <motion.div key={f.title} variants={fade}
                  whileHover={{ y: -3, boxShadow: `0 12px 40px ${f.color}18` }}
                  className="glass rounded-2xl p-5 flex gap-4 transition-all duration-200">
                  <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                    style={{ background: `${f.color}18`, border: `1px solid ${f.color}28` }}>
                    <Icon style={{ width: 18, height: 18, color: f.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white mb-1">{f.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-7 mb-8">
          <h2 className="text-xl font-black text-white mb-5">How it works</h2>
          <div className="space-y-4">
            {[
              { n: '01', title: 'Reads your Claude CLI sessions', desc: 'Parses the JSONL files Claude writes to ~/.claude/projects/ after each conversation.' },
              { n: '02', title: 'Extracts metadata', desc: 'Pulls out session title, summary, topics, token count, duration, tool used, and the project directory.' },
              { n: '03', title: 'Stores in a local database', desc: 'All data lives in a SQLite file on your machine — nothing leaves your system.' },
              { n: '04', title: 'Serves a live dashboard', desc: 'FastAPI backend + React frontend give you real-time visibility into your AI usage patterns.' },
            ].map(step => (
              <div key={step.n} className="flex gap-5 items-start">
                <span className="text-2xl font-black shrink-0" style={{ color: 'rgba(99,102,241,0.4)', fontVariantNumeric: 'tabular-nums' }}>{step.n}</span>
                <div>
                  <p className="text-sm font-bold text-white">{step.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tech stack */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-7 mb-8">
          <div className="flex items-center gap-3 mb-5">
            <Database style={{ width: 18, height: 18, color: '#818cf8' }} />
            <h2 className="text-xl font-black text-white">Tech Stack</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STACK.map(s => (
              <div key={s.label} className="rounded-xl p-3.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1">{s.label}</p>
                <p className="text-xs font-semibold text-slate-300">{s.value}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Privacy note */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="rounded-2xl p-5 flex gap-4 items-start"
          style={{ background: 'rgba(45,212,191,0.07)', border: '1px solid rgba(45,212,191,0.2)' }}>
          <Zap style={{ width: 18, height: 18, color: '#2dd4bf', marginTop: 2, flexShrink: 0 }} />
          <div>
            <p className="text-sm font-black text-white mb-1">100% local &amp; private</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              All your session data stays on your machine. The SQLite database, the backend, and the frontend all run locally via Docker. Nothing is sent to any external server.
            </p>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
