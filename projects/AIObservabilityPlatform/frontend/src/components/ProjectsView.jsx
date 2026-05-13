import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { FolderOpen, ChevronDown, Zap, Clock, Tag } from 'lucide-react'

const ACCENTS = ['#818cf8','#c084fc','#fb923c','#2dd4bf','#f472b6','#60a5fa']

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
    <div className="p-6 lg:p-8 min-h-screen">
      <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }} className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight leading-none mb-1.5">Projects</h1>
          <p className="text-slate-500 text-sm font-medium">Sessions grouped by directory</p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full glass"
          style={{ color:'#c084fc', border:'1px solid rgba(192,132,252,0.25)' }}>
          {projects.length} projects
        </span>
      </motion.div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40">
          <div className="w-20 h-20 rounded-2xl glass flex items-center justify-center mb-5">
            <FolderOpen className="w-9 h-9 text-slate-500" />
          </div>
          <h3 className="text-xl font-black text-slate-400 mb-1">No projects yet</h3>
          <p className="text-slate-600 text-sm">Start using Claude or Codex CLI</p>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((project, idx) => {
          const color = ACCENTS[idx % ACCENTS.length]
          const isOpen = expanded[project.name]
          return (
            <motion.div key={project.name}
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx*0.06 }}>

              <motion.button whileHover={{ y:-2 }} whileTap={{ scale:0.99 }}
                onClick={() => toggle(project.name)}
                className="w-full glass rounded-2xl px-6 py-5 flex items-center justify-between transition-all duration-200"
                style={{ borderLeft: `3px solid ${color}60` }}>
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background:`${color}15`, border:`1px solid ${color}25` }}>
                    <FolderOpen style={{ width:20, height:20, color }} />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black text-white">{project.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {project.total_sessions} sessions · {(project.total_tokens||0).toLocaleString()} tokens
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black px-4 py-1 rounded-xl"
                    style={{ color, background:`${color}15`, border:`1px solid ${color}25` }}>
                    {project.total_sessions}
                  </span>
                  <motion.div animate={{ rotate: isOpen?180:0 }} transition={{ duration:0.25 }}>
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  </motion.div>
                </div>
              </motion.button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                    exit={{ opacity:0, height:0 }} transition={{ duration:0.3, ease:'easeInOut' }}
                    className="overflow-hidden mt-1">
                    <div className="glass rounded-2xl overflow-hidden divide-y"
                      style={{ divideColor:'rgba(255,255,255,0.04)' }}>
                      {project.sessions.map((session, sIdx) => (
                        <motion.div key={session.session_id}
                          initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                          transition={{ delay: sIdx*0.03 }}
                          whileHover={{ backgroundColor:'rgba(255,255,255,0.025)', x:4 }}
                          className="px-6 py-5 cursor-pointer transition-all duration-150"
                          style={{ borderLeft:`2px solid ${color}30` }}>
                          <div className="flex items-start justify-between gap-5">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-2xl font-bold text-slate-200">{session.title||'Untitled'}</h4>
                              {session.summary && <p className="text-lg text-slate-500 mt-1.5 line-clamp-2">{session.summary}</p>}
                              <div className="flex flex-wrap gap-2 mt-3">
                                {(session.topics||[]).slice(0,5).map(t => (
                                  <span key={t} className="flex items-center gap-1.5 text-base font-semibold px-3 py-1 rounded-full text-slate-300"
                                    style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)' }}>
                                    <Tag style={{width:12,height:12}} />{t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="shrink-0 text-right space-y-2">
                              <div className="flex items-center gap-2 justify-end">
                                <Zap style={{width:18,height:18,color:'#fbbf24'}} />
                                <span className="text-xl font-bold text-amber-400">{(session.tokens_used||0).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center gap-2 justify-end text-slate-500">
                                <Clock style={{width:16,height:16}} />
                                <span className="text-lg font-semibold">{session.duration_minutes}m</span>
                              </div>
                              <p className="text-base font-semibold text-slate-500">{session.timestamp?.slice(0,10)}</p>
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
