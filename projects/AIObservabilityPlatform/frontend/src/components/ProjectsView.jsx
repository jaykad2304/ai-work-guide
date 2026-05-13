import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { FolderOpen, ChevronDown, Zap, Clock, Tag } from 'lucide-react'

const ACCENTS = [
  { color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe' },
  { color: '#8b5cf6', bg: '#f5f3ff', border: '#ddd6fe' },
  { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  { color: '#f43f5e', bg: '#fff1f2', border: '#fecdd3' },
  { color: '#0ea5e9', bg: '#f0f9ff', border: '#bae6fd' },
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
    <div className="p-8 lg:p-10 min-h-screen bg-slate-50">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Projects</h1>
          <p className="text-slate-500 mt-1 text-base font-medium">Sessions grouped by directory</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-violet-700 bg-violet-50 border border-violet-200 px-4 py-2 rounded-xl">
            {projects.length} projects
          </span>
        </div>
      </motion.div>

      {projects.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40">
          <div className="w-24 h-24 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-6">
            <FolderOpen className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black text-slate-700 mb-2">No projects yet</h3>
          <p className="text-slate-400 font-medium">Start using Claude or Codex CLI to see sessions here</p>
        </motion.div>
      )}

      <div className="space-y-4">
        {projects.map((project, idx) => {
          const accent = ACCENTS[idx % ACCENTS.length]
          const isOpen = expanded[project.name]

          return (
            <motion.div
              key={project.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.06 }}
            >
              {/* Project header card */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => toggle(project.name)}
                className="w-full bg-white border border-slate-100 shadow-sm rounded-2xl px-6 py-5 flex items-center justify-between hover:shadow-md transition-all duration-200"
                style={{ borderLeft: `4px solid ${accent.color}` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: accent.bg }}>
                    <FolderOpen style={{ color: accent.color, width: 22, height: 22 }} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-black text-slate-900">{project.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mt-0.5">
                      {project.total_sessions} sessions &nbsp;·&nbsp; {(project.total_tokens || 0).toLocaleString()} tokens
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black px-4 py-1.5 rounded-xl" style={{ color: accent.color, background: accent.bg }}>
                    {project.total_sessions}
                  </span>
                  <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  </motion.div>
                </div>
              </motion.button>

              {/* Sessions */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden divide-y divide-slate-50">
                      {project.sessions.map((session, sIdx) => (
                        <motion.div
                          key={session.session_id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: sIdx * 0.03 }}
                          whileHover={{ backgroundColor: '#f8faff', x: 4 }}
                          className="px-6 py-5 transition-all duration-150 cursor-pointer"
                          style={{ borderLeft: `3px solid ${accent.border}` }}
                        >
                          <div className="flex items-start justify-between gap-6">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-slate-900 truncate">{session.title || 'Untitled'}</h4>
                              {session.summary && (
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{session.summary}</p>
                              )}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {(session.topics || []).slice(0, 5).map(t => (
                                  <span key={t} className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                                    <Tag style={{ width: 10, height: 10 }} />{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="shrink-0 text-right space-y-1.5">
                              <div className="flex items-center gap-1.5 justify-end">
                                <Zap style={{ width: 14, height: 14, color: '#f59e0b' }} />
                                <span className="text-sm font-bold text-amber-600">{(session.tokens_used || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-1.5 justify-end text-slate-400">
                                <Clock style={{ width: 13, height: 13 }} />
                                <span className="text-xs font-semibold">{session.duration_minutes}m</span>
                              </div>
                              <p className="text-xs font-semibold text-slate-400">{session.timestamp?.slice(0, 10)}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
