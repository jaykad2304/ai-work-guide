import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ProjectsView({ days }) {
  const [projects, setProjects] = useState([])
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    axios
      .get(`http://localhost:8000/timeline/by-project?days=${days}`)
      .then(r => {
        setProjects(r.data.projects || [])
        if (r.data.projects?.[0]) {
          setExpanded({ [r.data.projects[0].name]: true })
        }
      })
  }, [days])

  const toggle = name => setExpanded(p => ({ ...p, [name]: !p[name] }))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Projects</h1>
      <p className="text-slate-500 text-sm mb-8">Sessions grouped by project directory</p>

      {projects.length === 0 && (
        <div className="text-center py-20 text-slate-400">
          No sessions found. Start using Claude or Codex CLI!
        </div>
      )}

      <div className="space-y-3">
        {projects.map(project => (
          <div
            key={project.name}
            className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden"
          >
            <button
              onClick={() => toggle(project.name)}
              className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📁</span>
                <div className="text-left">
                  <div className="font-semibold text-slate-800">{project.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {project.total_sessions} sessions · {(project.total_tokens || 0).toLocaleString()} tokens
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-full">
                  {project.total_sessions}
                </span>
                <span className="text-slate-400 text-xs">{expanded[project.name] ? '▲' : '▼'}</span>
              </div>
            </button>

            {expanded[project.name] && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {project.sessions.map(session => (
                  <div
                    key={session.session_id}
                    className="p-4 pl-14 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 truncate">
                          {session.title || 'Untitled'}
                        </div>
                        {session.summary && (
                          <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {session.summary}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(session.topics || []).slice(0, 4).map(t => (
                            <span
                              key={t}
                              className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0 text-xs text-slate-400">
                        <div>{session.timestamp?.slice(0, 10)}</div>
                        <div className="mt-1">{(session.tokens_used || 0).toLocaleString()} tok</div>
                        <div className="mt-1">{session.duration_minutes}m</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
