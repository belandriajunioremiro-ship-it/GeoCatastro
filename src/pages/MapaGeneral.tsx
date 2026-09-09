import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Building2, Layers, LocateFixed, Navigation, Plus, User } from 'lucide-react'
import MapaCatastral from '@/components/map/MapaCatastral'
import { db, initDbWithSeed } from '@/lib/mockDb'
import { useGeolocation } from '@/hooks/useGeolocation'
import { useOnlineStatus } from '@/hooks/useOnline'
import { formatCoord } from '@/lib/geo'
import type { Inmueble } from '@/types'

const tipoColores: Record<string, string> = {
  residencial: '#000000',
  comercial: '#333333',
  industrial: '#666666',
  rural: '#999999',
  mixto: '#CCCCCC',
}

const tipoIconos: Record<string, string> = {
  residencial: '🏠',
  comercial: '🏪',
  industrial: '🏭',
  rural: '🌾',
  mixto: '🏙️',
}

export default function MapaGeneral() {
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const geo = useGeolocation()
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([])
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      await initDbWithSeed()
      const data = await db.inmuebles.toArray()
      const props = await db.propietarios.toArray()
      const enriched = data.map((i) => ({
        ...i,
        propietario: props.find((p) => p.id === i.propietario_id),
      }))
      setInmuebles(enriched)
      setLoading(false)
    })()
  }, [])

  const filtered = inmuebles.filter((i) => {
    if (filterTipo && i.tipo_inmueble !== filterTipo) return false
    const q = search.toLowerCase()
    return (
      i.codigo_catastral.toLowerCase().includes(q) ||
      i.direccion.toLowerCase().includes(q) ||
      (i.barrio ?? '').toLowerCase().includes(q) ||
      (i.propietario?.nombre ?? '').toLowerCase().includes(q) ||
      (i.propietario?.apellido ?? '').toLowerCase().includes(q) ||
      (i.propietario?.cedula ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-5 sm:mb-6">
        <div>
          <h1 className="text-xl font-bold text-black">Mapa Catastral</h1>
          <p className="text-sm text-gray-600">
            {filtered.length} predios en el mapa
            {online ? (
              <span className="ml-2 text-black">· En línea</span>
            ) : (
              <span className="ml-2 text-gray-600">· Sin conexión</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, dirección, propietario..."
              className="input-minimal w-full sm:w-72 pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          <button
            onClick={() => navigate('/registrar')}
            className="btn-minimal flex items-center gap-2 px-4 py-2.5 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Nuevo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-auto lg:h-[calc(100vh-160px)]">
        {/* Map */}
        <div className="col-span-12 lg:col-span-8 h-[58vh] min-h-[360px] lg:h-auto minimal-card overflow-hidden relative">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="animate-pulse">Cargando mapa...</div>
            </div>
          ) : (
            <>
              <MapaCatastral
                inmuebles={filtered}
                onSelect={(id) => setSelectedId(id)}
                selectedId={selectedId}
                userPosition={geo.position}
              />
              {/* GPS button overlay */}
              <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2">
                <button
                  onClick={() => geo.requestPosition()}
                  disabled={geo.loading}
                  className="bg-white hover:bg-gray-50 text-black p-2.5 border border-black text-sm font-medium transition disabled:opacity-50 flex items-center gap-2"
                  title="Mi ubicación GPS"
                >
                  <LocateFixed className={`w-5 h-5 ${geo.loading ? 'animate-spin' : ''}`} />
                </button>
                {geo.position && (
                  <div className="bg-white border border-black px-3 py-2 text-xs">
                    <p className="font-mono font-semibold text-black">{formatCoord(geo.position[0], geo.position[1])}</p>
                    {geo.accuracy && <p className="text-gray-600 mt-0.5">±{geo.accuracy.toFixed(0)}m</p>}
                  </div>
                )}
              </div>
              {geo.error && (
                <div className="absolute top-3 left-16 z-[1000] bg-white border border-black px-3 py-2 text-xs text-black max-w-xs">
                  {geo.error}
                </div>
              )}
            </>
          )}
        </div>

        {/* List */}
        <div className="col-span-12 lg:col-span-4 h-[440px] lg:h-auto minimal-card overflow-y-auto flex flex-col">
          <div className="px-4 py-3 border-b border-black sticky top-0 bg-white z-10">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-black" />
              <h2 className="text-sm font-semibold text-black">Listado de Predios</h2>
            </div>
            {/* Type filter chips */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilterTipo(null)}
                className={filterTipo === null ? 'text-xs px-2.5 py-1 rounded-sm transition bg-black text-white' : 'text-xs px-2.5 py-1 rounded-sm transition bg-gray-100 text-gray-600 hover:bg-gray-200'}
              >
                Todos
              </button>
              {Object.entries(tipoColores).map(([tipo, color]) => (
                <button
                  key={tipo}
                  onClick={() => setFilterTipo(filterTipo === tipo ? null : tipo)}
                  className={filterTipo === tipo ? 'text-xs px-2.5 py-1 rounded-full transition capitalize text-white' : 'text-xs px-2.5 py-1 rounded-full transition capitalize bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  style={filterTipo === tipo ? { backgroundColor: color } : {}}
                >
                  {tipoIconos[tipo]} {tipo}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-200 flex-1">
            {filtered.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelectedId(i.id)}
                onDoubleClick={() => navigate(`/ficha/${i.id}`)}
                className={selectedId === i.id ? 'w-full text-left px-4 py-3 hover:bg-gray-50 transition bg-gray-100 border-l-4 border-black' : 'w-full text-left px-4 py-3 hover:bg-gray-50 transition'}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{tipoIconos[i.tipo_inmueble]}</span>
                      <p className="text-sm font-semibold text-black truncate">{i.codigo_catastral}</p>
                    </div>
                    <p className="text-xs text-gray-600 truncate">{i.direccion}</p>
                    <p className="text-xs text-gray-400">{i.barrio} — {i.zona}</p>
                  </div>
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0 mt-1 ring-2 ring-white shadow"
                    style={{ backgroundColor: tipoColores[i.tipo_inmueble] }}
                  />
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{i.superficie_gis_m2?.toFixed(0) ?? i.superficie_m2} m²</span>
                  {i.propietario && (
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{i.propietario.nombre} {i.propietario.apellido}</span>
                  )}
                  {i.estado_sync === 'pendiente' && (
                    <span className="flex items-center gap-1 text-gray-600"><Navigation className="w-3 h-3" />Pendiente</span>
                  )}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-gray-400">No se encontraron predios</p>
            )}
          </div>
          <div className="p-4 sticky bottom-0 bg-white border-t border-black">
            <p className="text-xs text-gray-400 mb-2">Doble clic para ver la ficha completa</p>
            {selectedId && (
              <button
                onClick={() => navigate(`/ficha/${selectedId}`)}
                className="btn-minimal w-full py-2 text-sm font-medium"
              >
                Ver ficha catastral
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-3 sm:gap-4 minimal-card px-4 py-3">
        <span className="text-xs font-semibold text-black">Leyenda:</span>
        {Object.entries(tipoColores).map(([tipo, color]) => (
          <div key={tipo} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full ring-2 ring-white shadow" style={{ backgroundColor: color }} />
            <span className="text-xs text-black capitalize">{tipoIconos[tipo]} {tipo}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-black ring-2 ring-white shadow" />
            <span className="text-xs text-black">Mi ubicación</span>
          </div>
        </div>
      </div>
    </div>
  )
}
