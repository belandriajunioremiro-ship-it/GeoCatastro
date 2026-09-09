import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Map, Home, BarChart3, LogOut, Wifi, WifiOff, CloudUpload, Building2 } from 'lucide-react'
import { useOnlineStatus } from '@/hooks/useOnline'
import { syncPendientes } from '@/lib/sync'
import { useState } from 'react'

export default function Layout() {
  const online = useOnlineStatus()
  const navigate = useNavigate()
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const handleSync = async () => {
    setSyncing(true)
    setSyncMsg(null)
    try {
      const { synced, conflicts } = await syncPendientes()
      setSyncMsg(`${synced} registro(s) sincronizado(s)${conflicts > 0 ? `, ${conflicts} conflicto(s)` : ''}`)
    } catch {
      setSyncMsg('Error al sincronizar')
    } finally {
      setSyncing(false)
      setTimeout(() => setSyncMsg(null), 4000)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('catastro_session')
    navigate('/login')
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all border-l-2 ${
      isActive ? 'border-black bg-gray-50' : 'border-transparent text-gray-600 hover:bg-gray-50'
    }`

  const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition ${
      isActive ? 'text-black border-t-2 border-black' : 'text-neutral-500'
    }`

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="hidden md:flex w-64 bg-white border-r border-black flex-col fixed h-full z-50">
        <div className="px-5 py-5 border-b border-black">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-black">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-black">Catastro Municipal</h1>
              <p className="text-xs text-gray-600">Gestión Predial</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Navegación</p>
          <NavLink to="/mapa" className={linkClass}><Map className="w-4 h-4" /> Mapa General</NavLink>
          <NavLink to="/registrar" className={linkClass}><Home className="w-4 h-4" /> Registrar Inmueble</NavLink>
          <NavLink to="/estadisticas" className={linkClass}><BarChart3 className="w-4 h-4" /> Estadísticas</NavLink>
        </nav>
        <div className="px-3 py-4 border-t border-black space-y-2">
          <div className={`flex items-center gap-2 px-4 py-2 text-sm ${online ? 'text-black' : 'text-gray-600'}`}>
            {online ? <><Wifi className="w-4 h-4" /><span className="font-medium">En línea</span><span className="ml-auto w-2 h-2 bg-black rounded-full animate-pulse" /></> : <><WifiOff className="w-4 h-4" /><span className="font-medium">Sin conexión</span></>}
          </div>
          <button onClick={handleSync} disabled={syncing || !online} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50 border border-black">
            <CloudUpload className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} /> {syncing ? 'Sincronizando...' : 'Sincronizar datos'}
          </button>
          {syncMsg && <p className="px-4 text-xs text-gray-500 animate-fade-in">{syncMsg}</p>}
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition border border-black">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-0 md:ml-64 pb-16 md:pb-0">
        <header className="md:hidden h-14 bg-white border-b border-black px-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-black"><Building2 className="w-4 h-4 text-white" /></div>
            <span className="text-sm font-bold text-black">Catastro Municipal</span>
          </div>
          <div className="flex items-center gap-2">
            {online ? <Wifi className="w-4 h-4 text-black" /> : <WifiOff className="w-4 h-4 text-gray-600" />}
            <button onClick={handleSync} disabled={syncing || !online} className="p-2 text-black disabled:opacity-40" aria-label="Sincronizar">
              <CloudUpload className={`w-4 h-4 ${syncing ? 'animate-bounce' : ''}`} />
            </button>
          </div>
        </header>
        {syncMsg && <div className="fixed top-16 md:top-4 right-4 z-[1000] bg-white border border-black px-4 py-3 text-sm text-black animate-fade-in">{syncMsg}</div>}
        <Outlet />
      </div>

      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-white border-t border-black z-[1100] flex items-stretch px-2 safe-area-bottom">
        <NavLink to="/mapa" className={mobileLinkClass}><Map className="w-5 h-5" /><span>Mapa</span></NavLink>
        <NavLink to="/registrar" className={mobileLinkClass}><Home className="w-5 h-5" /><span>Registrar</span></NavLink>
        <NavLink to="/estadisticas" className={mobileLinkClass}><BarChart3 className="w-5 h-5" /><span>Resumen</span></NavLink>
        <button onClick={handleLogout} className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium text-neutral-500"><LogOut className="w-5 h-5" /><span>Salir</span></button>
      </nav>
    </div>
  )
}
