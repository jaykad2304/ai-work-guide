const NAV = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'projects', icon: '📁', label: 'Projects' },
  { id: 'timeline', icon: '📅', label: 'Timeline' },
  { id: 'search', icon: '🔍', label: 'Search' },
  { id: 'insights', icon: '💡', label: 'Insights' },
]

export default function Sidebar({ activeView, onNavigate }) {
  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0">
      <div className="p-5 border-b border-slate-100">
        <div className="text-xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          🧠 AI Observer
        </div>
        <p className="text-xs text-slate-400 mt-1">Your AI journey, visualized</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(item => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeView === item.id
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
