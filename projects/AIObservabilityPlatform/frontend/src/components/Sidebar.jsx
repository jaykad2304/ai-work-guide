import { motion } from 'framer-motion'
import { Brain, BarChart3, FolderOpen, Calendar, Search, Lightbulb } from 'lucide-react'

const NAV = [
  { id: 'dashboard', icon: BarChart3,  label: 'Dashboard', color: '#818cf8' },
  { id: 'projects',  icon: FolderOpen, label: 'Projects',  color: '#c084fc' },
  { id: 'timeline',  icon: Calendar,   label: 'Timeline',  color: '#fb923c' },
  { id: 'search',    icon: Search,     label: 'Search',    color: '#2dd4bf' },
  { id: 'insights',  icon: Lightbulb,  label: 'Insights',  color: '#f43f5e' },
]

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <motion.aside
      initial={{ x: -260 }} animate={{ x: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-60 shrink-0 flex flex-col glass-strong border-r border-white/[0.07]"
      style={{ backdropFilter: 'blur(28px)' }}
    >
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center glow-indigo"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <Brain className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-tight leading-none">AI Observer</h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Usage Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-5 space-y-1">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.15em] px-3 mb-4">Navigation</p>
        {NAV.map((item, idx) => {
          const Icon = item.icon
          const active = activeView === item.id
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.06 }}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(item.id)}
              className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={active ? {
                background: `${item.color}18`,
                border: `1px solid ${item.color}35`,
                color: item.color,
              } : { color: 'rgba(148,163,184,0.9)', border: '1px solid transparent' }}
            >
              {active && (
                <motion.div layoutId="sidebar-pill" className="absolute inset-0 rounded-xl"
                  style={{ background: `${item.color}10`, border: `1px solid ${item.color}30` }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
              )}
              <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
              <span className="relative text-[15px]">{item.label}</span>
              {active && (
                <span className="relative ml-auto w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
              )}
            </motion.button>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-white/[0.06]">
        <p className="text-[10px] text-slate-600 text-center font-medium">Real-time AI observability</p>
      </div>
    </motion.aside>
  )
}
