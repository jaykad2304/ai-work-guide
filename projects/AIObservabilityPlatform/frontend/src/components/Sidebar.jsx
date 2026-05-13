import { motion } from 'framer-motion'
import { Brain, BarChart3, FolderOpen, Calendar, Search, Lightbulb } from 'lucide-react'

const NAV = [
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard', color: 'from-blue-500 to-cyan-500' },
  { id: 'projects', icon: FolderOpen, label: 'Projects', color: 'from-purple-500 to-pink-500' },
  { id: 'timeline', icon: Calendar, label: 'Timeline', color: 'from-orange-500 to-red-500' },
  { id: 'search', icon: Search, label: 'Search', color: 'from-green-500 to-emerald-500' },
  { id: 'insights', icon: Lightbulb, label: 'Insights', color: 'from-yellow-500 to-orange-500' },
]

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-72 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-r border-slate-800/50 flex flex-col shrink-0 shadow-2xl"
    >
      {/* Header */}
      <motion.div
        className="p-8 border-b border-slate-800/50 backdrop-blur-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
        whileHover={{ backgroundColor: 'rgba(99, 102, 241, 0.15)' }}
      >
        <motion.div
          className="flex items-center gap-3 mb-2"
          whileHover={{ scale: 1.05 }}
        >
          <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI Observer
          </h1>
        </motion.div>
        <p className="text-sm text-slate-400 ml-11 font-medium">Your AI journey, visualized</p>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {NAV.map((item, idx) => {
          const Icon = item.icon
          const isActive = activeView === item.id

          return (
            <motion.button
              key={item.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.02, x: 8 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl font-semibold transition-all duration-300 group relative overflow-hidden ${
                isActive
                  ? `bg-gradient-to-r ${item.color} text-white shadow-lg shadow-indigo-500/50`
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              {/* Animated background glow for active */}
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 -z-10 rounded-xl"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}

              <motion.div
                whileHover={{ rotate: 12, scale: 1.2 }}
                className="relative"
              >
                <Icon className="w-5 h-5" />
              </motion.div>

              <span className="text-lg">{item.label}</span>

              {isActive && (
                <motion.div
                  layoutId="indicator"
                  className="absolute right-4 w-2 h-2 rounded-full bg-white"
                  transition={{ type: 'spring', bounce: 0.5 }}
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer Stats */}
      <motion.div
        className="p-4 border-t border-slate-800/50 bg-gradient-to-r from-slate-900/50 to-slate-950/50 backdrop-blur"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-xs text-slate-400 text-center py-2 font-medium">
          Real-time AI Observability
        </div>
      </motion.div>
    </motion.aside>
  )
}
