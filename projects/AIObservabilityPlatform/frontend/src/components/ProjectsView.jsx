import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { FolderOpen, ChevronDown, ChevronUp, Zap, Clock, Tag } from 'lucide-react'

const PROJECT_COLORS = [
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-orange-500 to-red-500',
  'from-green-500 to-emerald-500',
  'from-yellow-500 to-orange-500',
  'from-indigo-500 to-violet-500',
]

export default function ProjectsView({ days }) {
  const [projects, setProjects] = useState([])
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    axios.get(`http://localhost:8000/timeline/by-project?days=${days}`).then(r => {
      const list = r.data.projects || []
      setProjects(list)
      if (list[0]) setExpanded({ [list[0].name]: true })
    })
  }, [days])

  const toggle = name => setExpanded(p => ({ ...p, [name]: !p[name] }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-5xl mx-auto"
      >
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-red-400 bg-clip-text text-transparent mb-2">
            Projects
          </h1>
          <p className="text-lg text-slate-400 font-medium">Sessions grouped by project directory</p>
        </div>

        {projects.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-32"
          >
            <FolderOpen className="w-24 h-24 text-slate-600 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-slate-400 mb-2">No projects yet</h3>
            <p className="text-slate-500 text-lg">Start using Claude or Codex CLI to see projects here</p>
          </motion.div>
        )}

        <div className="space-y-4">
          {projects.map((project, idx) => {
            const colorClass = PROJECT_COLORS[idx % PROJECT_COLORS.length]
            const isOpen = expanded[project.name]

            return (
              <motion.div
                key={project.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="group"
              >
                {/* Project Header */}
                <motion.button
                  whileHover={{ scale: 1.005 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => toggle(project.name)}
                  className={`relative w-full rounded-2xl overflow-hidden transition-all duration-300 ${
                    isOpen ? 'rounded-b-none' : ''
                  }`}
                >
                  {/* Gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${colorClass} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />
                  <div className="relative bg-slate-800/80 border border-slate-700/50 group-hover:border-slate-600/50 backdrop-blur-xl px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass}`}>
                        <FolderOpen className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-2xl font-black text-white">{project.name}</h3>
                        <p className="text-slate-400 text-sm font-medium mt-0.5">
                          {project.total_sessions} sessions · {(project.total_tokens || 0).toLocaleString()} tokens
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className={`px-4 py-2 rounded-xl bg-gradient-to-r ${colorClass} text-white font-black text-xl shadow-lg`}>
                        {project.total_sessions}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className="w-6 h-6 text-slate-300" />
                      </motion.div>
                    </div>
                  </div>
                </motion.button>

                {/* Sessions List */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                      className="bg-slate-900/50 border border-t-0 border-slate-700/50 rounded-b-2xl overflow-hidden"
                    >
                      {project.sessions.map((session, sIdx) => (
                        <motion.div
                          key={session.session_id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: sIdx * 0.04 }}
                          whileHover={{ x: 6, backgroundColor: 'rgba(99, 102, 241, 0.05)' }}
                          className="px-6 py-5 border-b border-slate-800/50 last:border-b-0 transition-colors duration-200 cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-3">
                                <div className={`w-1.5 mt-2 h-12 rounded-full bg-gradient-to-b ${colorClass} shrink-0`} />
                                <div>
                                  <h4 className="text-lg font-bold text-white">
                                    {session.title || 'Untitled'}
                                  </h4>
                                  {session.summary && (
                                    <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                                      {session.summary}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-2 mt-3">
                                    {(session.topics || []).slice(0, 4).map(t => (
                                      <span
                                        key={t}
                                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700/50"
                                      >
                                        <Tag className="w-3 h-3" />
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 text-right space-y-2">
                              <div className="flex items-center gap-1.5 justify-end">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm font-bold text-yellow-300">
                                  {(session.tokens_used || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-end text-slate-400">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-xs font-medium">{session.duration_minutes}m</span>
                              </div>
                              <p className="text-xs text-slate-500">{session.timestamp?.slice(0, 10)}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
