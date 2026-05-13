import { motion } from 'framer-motion'
import { Brain, BarChart3, FolderOpen, Calendar, Search, Lightbulb } from 'lucide-react'

const NAV = [
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard', accent: '#6366f1' },
  { id: 'projects',  icon: FolderOpen,  label: 'Projects',  accent: '#8b5cf6' },
  { id: 'timeline',  icon: Calendar,    label: 'Timeline',  accent: '#f59e0b' },
  { id: 'search',    icon: Search,      label: 'Search',    accent: '#10b981' },
  { id: 'insights',  icon: Lightbulb,   label: 'Insights',  accent: '#f43f5e' },
]

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <motion.aside
      initial={{ x: -240 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 shadow-sm"
    >
      {/* Logo */}
      <div className="px-6 py-7 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none">AI Observer</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">Usage Intelligence</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest px-3 mb-3">Navigation</p>
        {NAV.map((item, idx) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.07 }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onNavigate(item.id)}
              className={`relative w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
              style={isActive ? { background: `linear-gradient(135deg, ${item.accent}, ${item.accent}cc)`, boxShadow: `0 4px 14px ${item.accent}40` } : {}}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" style={{ width: 18, height: 18 }} />
              <span className="text-base">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="navDot"
                  className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white/70"
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100">
        <div className="text-xs text-slate-400 font-medium text-center">Real-time AI observability</div>
      </div>
    </motion.aside>
  )
}
