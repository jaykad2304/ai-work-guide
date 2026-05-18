import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import axios from 'axios'
import { ChevronDown, FolderOpen } from 'lucide-react'
import PageShell from './PageShell'
import SessionDigestCard from './SessionDigestCard'
import WindowSelect from './WindowSelect'

const TONES = ['blue', 'green', 'amber', 'violet', 'cyan']

export default function ProjectsView({ days, onDaysChange, theme = 'light', onThemeChange }) {
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
    <PageShell
      theme={theme}
      onThemeChange={onThemeChange}
      title="Projects"
      eyebrow="Project map"
      description="Sessions grouped by workspace, with token burn and recent work visible at a glance."
      icon={FolderOpen}
      tone="green"
      actions={<WindowSelect days={days} onDaysChange={onDaysChange} />}
    >
      {projects.length === 0 && (
        <div className="page-empty-state">
          <div className="page-empty-icon">
            <FolderOpen style={{ width: 34, height: 34 }} />
          </div>
          <h3>No projects yet</h3>
          <p>Start using Claude or Codex CLI and project activity will appear here.</p>
        </div>
      )}

      <div className="page-list">
        {projects.map((project, idx) => {
          const tone = TONES[idx % TONES.length]
          const isOpen = expanded[project.name]
          return (
            <motion.div key={project.name}
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx*0.06 }}>

              <motion.button whileHover={{ y:-2 }} whileTap={{ scale:0.99 }}
                onClick={() => toggle(project.name)}
                className={`ops-row ops-row--${tone}`}>
                <div className="ops-row-main">
                  <div className="ops-row-icon">
                    <FolderOpen style={{ width:20, height:20 }} />
                  </div>
                  <div className="text-left">
                    <h3>{project.name}</h3>
                    <p>
                      {project.total_sessions} sessions · {(project.total_tokens||0).toLocaleString()} tokens
                    </p>
                  </div>
                </div>
                <div className="ops-row-side">
                  <span className="ops-count">
                    {project.total_sessions}
                  </span>
                  <motion.div animate={{ rotate: isOpen?180:0 }} transition={{ duration:0.25 }}>
                    <ChevronDown style={{ width: 16, height: 16 }} />
                  </motion.div>
                </div>
              </motion.button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
                    exit={{ opacity:0, height:0 }} transition={{ duration:0.3, ease:'easeInOut' }}
                    className="overflow-hidden mt-1">
                    <div className="nested-session-list">
                      {project.sessions.map((session, sIdx) => (
                        <SessionDigestCard key={session.session_id || sIdx} event={{ ...session, topics: session.topics?.length ? session.topics : [project.name] }} index={sIdx} variant={theme} compact />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </PageShell>
  )
}
