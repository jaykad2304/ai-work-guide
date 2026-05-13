import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, BarChart3, FolderOpen, Calendar, Search, Lightbulb } from 'lucide-react'

const NAV = [
  { id: 'dashboard', icon: BarChart3,  label: 'Dashboard', color: '#818cf8' },
  { id: 'projects',  icon: FolderOpen, label: 'Projects',  color: '#c084fc' },
  { id: 'timeline',  icon: Calendar,   label: 'Timeline',  color: '#fb923c' },
  { id: 'search',    icon: Search,     label: 'Search',    color: '#2dd4bf' },
  { id: 'insights',  icon: Lightbulb,  label: 'Insights',  color: '#f472b6' },
]

function fmt(d) {
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function Topbar({ activeView, onNavigate }) {
  const [timeStr, setTimeStr] = useState(fmt(new Date()))
  useEffect(() => {
    const iv = setInterval(() => setTimeStr(fmt(new Date())), 1000)
    return () => clearInterval(iv)
  }, [])
  const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()

  return (
    <header className="glass-nav shrink-0 px-6 flex items-center justify-between h-14 z-50">
      {/* Left — logo */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 14px rgba(99,102,241,0.5)' }}
        >
          <Brain style={{ width: 15, height: 15, color: '#fff' }} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-black text-white tracking-tight">AI Observer</span>
          <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest hidden sm:block">
            {dateStr}
          </span>
        </div>
      </motion.div>

      {/* Center — nav links */}
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1"
      >
        {NAV.map((item, idx) => {
          const Icon = item.icon
          const active = activeView === item.id
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 + 0.15 }}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onNavigate(item.id)}
              className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-200"
              style={active ? {
                color: item.color,
                background: `${item.color}18`,
                border: `1px solid ${item.color}30`,
              } : {
                color: 'rgba(148,163,184,0.8)',
                border: '1px solid transparent',
              }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              <span className="hidden md:block">{item.label}</span>
              {active && (
                <motion.div
                  layoutId="topbar-active"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                  style={{ background: item.color }}
                  transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
                />
              )}
            </motion.button>
          )
        })}
      </motion.nav>

      {/* Right — live status */}
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3"
      >
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-400"
          />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block">Live</span>
        </div>
        <span className="font-mono text-xs text-slate-500 tabular-nums hidden sm:block">{timeStr}</span>
      </motion.div>
    </header>
  )
}
