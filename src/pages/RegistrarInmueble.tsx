import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, MapPin, User, FileText, Check, AlertCircle, LocateFixed, Crosshair, Navigation, Ruler, Compass, MapPinned } from 'lucide-react'
import DibujarPoligono from '@/components/map/DibujarPoligono'
import { db, initDbWithSeed } from '@/lib/mockDb'
import { useOnlineStatus } from '@/hooks/useOnline'
import { useGeolocation } from '@/hooks/useGeolocation'
import { superficieM2Preview, perimetroMPreview, calcularLinderos, formatCoord, formatDMS, getVertices, resumenVertices } from '@/lib/geo'
import type { TipoInmueble } from '@/types'

const schema = z.object({
  codigo_catastral: z.string().min(1, 'Código requerido'),
  direccion: z.string().min(1, 'Dirección requerida'),
  barrio: z.string().optional(),
  zona: z.string().optional(),
  tipo_inmueble: z.enum(['residencial', 'comercial', 'industrial', 'rural', 'mixto']),
  superficie_m2: z.number().min(1, 'Superficie requerida'),
  norte: z.string().optional(),
  sur: z.string().optional(),
  este: z.string().optional(),
  oeste: z.string().optional(),
  cedula: z.string().min(1, 'Cédula requerida'),
  nombre: z.string().min(1, 'Nombre requerido'),
  apellido: z.string().min(1, 'Apellido requerido'),
  telefono: z.string().optional(),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
  direccion_propietario: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RegistrarInmueble() {
  const navigate = useNavigate()
  const online = useOnlineStatus()
  const geo = useGeolocation()
  const [geom, setGeom] = useState<GeoJSON.Polygon | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.1807, -78.4678])
  const [autoLinderos, setAutoLinderos] = useState(true)
  const [showCoordPanel, setShowCoordPanel] = useState(true)

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tipo_inmueble: 'residencial' },
  })

  useEffect(() => {
    initDbWithSeed()
  }, [])

  // GPS: actualizar centro del mapa
  useEffect(() => {
    if (geo.position) {
      setMapCenter(geo.position)
    }
  }, [geo.position])

  // Auto-calcular linderos cuando cambia el polígono
  useEffect(() => {
    if (geom && geom.coordinates.length > 0 && autoLinderos) {
      const linderos = calcularLinderos(geom)
      setValue('norte', linderos.norte)
      setValue('sur', linderos.sur)
      setValue('este', linderos.este)
      setValue('oeste', linderos.oeste)
    }
  }, [geom, autoLinderos, setValue])

  const handleGeo = () => {
    geo.requestPosition()
  }

  const handleWatch = () => {
    if (geo.watching) {
      geo.stopWatching()
    } else {
      geo.startWatching()
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!geom || geom.coordinates.length === 0) {
      setError('Debe dibujar el polígono del predio en el mapa')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const propId = `p_${Date.now()}`
      await db.propietarios.put({
        id: propId,
        cedula: data.cedula,
        nombre: data.nombre,
        apellido: data.apellido,
        telefono: data.telefono,
        email: data.email,
        direccion: data.direccion_propietario,
      })

      const inmuebleId = `i_${Date.now()}`
      const now = new Date().toISOString()
      await db.inmuebles.put({
        id: inmuebleId,
        codigo_catastral: data.codigo_catastral,
        direccion: data.direccion,
        barrio: data.barrio,
        zona: data.zona,
        tipo_inmueble: data.tipo_inmueble as TipoInmueble,
        superficie_m2: data.superficie_m2,
        superficie_gis_m2: superficieM2Preview(geom),
        perimetro_gis_m: perimetroMPreview(geom),
        norte: data.norte,
        sur: data.sur,
        este: data.este,
        oeste: data.oeste,
        geom,
        propietario_id: propId,
        estado_sync: online ? 'synced' : 'pendiente',
        created_at: now,
        updated_at: now,
      })

      setSaving(false)
      setSaved(true)
      reset()
      setGeom(null)
      setTimeout(() => {
        setSaved(false)
        navigate('/mapa')
      }, 1500)
    } catch {
      setSaving(false)
      setError('Error al guardar el registro')
    }
  }

  const inputClass = 'input-minimal w-full px-3 py-2 text-sm'
  const labelClass = 'block text-sm font-medium text-black mb-1'
  const errorClass = 'text-xs text-black mt-0.5'

  const vertices = geom && geom.coordinates.length > 0 ? getVertices(geom) : []
  const resumen = geom && geom.coordinates.length > 0 ? resumenVertices(geom) : []
  const linderos = geom && geom.coordinates.length > 0 ? calcularLinderos(geom) : null

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h1 className="text-xl font-bold text-black">Registrar Inmueble</h1>
        <div className="flex items-center gap-2">
          {online ? (
            <span className="flex items-center gap-1.5 text-xs text-black bg-gray-100 px-3 py-1.5 rounded-sm">
              <span className="w-2 h-2 bg-black rounded-full animate-pulse" /> En línea
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 px-3 py-1.5 rounded-sm">
              <span className="w-2 h-2 bg-gray-600 rounded-full" /> Sin conexión
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Complete los datos del predio y dibuje su polígono en el mapa
        {!online && <span className="ml-2 text-gray-600 font-medium">— El registro se guardará localmente y se sincronizará luego</span>}
      </p>

      {saved && (
        <div className="mb-4 bg-gray-100 border border-black px-4 py-3 flex items-center gap-2 text-black text-sm animate-fade-in">
          <Check className="w-5 h-5" /> Registro guardado exitosamente. Redirigiendo al mapa...
        </div>
      )}
      {error && (
        <div className="mb-4 bg-white border border-black px-4 py-3 flex items-center gap-2 text-black text-sm">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-6">
        {/* Map column */}
        <div className="col-span-12 lg:col-span-7 min-w-0">
          <div className="minimal-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-black" />
                <h2 className="text-sm font-semibold text-black">Polígono del Predio</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGeo}
                  disabled={geo.loading}
                  className="flex items-center gap-1.5 text-xs text-black hover:bg-gray-100 px-3 py-1.5 rounded-sm transition disabled:opacity-50"
                >
                  <LocateFixed className={`w-3.5 h-3.5 ${geo.loading ? 'animate-spin' : ''}`} /> {geo.loading ? 'Buscando...' : 'Mi ubicación'}
                </button>
                <button
                  type="button"
                  onClick={handleWatch}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm transition ${
                    geo.watching
                      ? 'bg-gray-200 text-black hover:bg-gray-300'
                      : 'text-black hover:bg-gray-100'
                  }`}
                >
                  <Crosshair className={`w-3.5 h-3.5 ${geo.watching ? 'animate-pulse' : ''}`} />
                  {geo.watching ? 'GPS activo' : 'Rastrear GPS'}
                </button>
              </div>
            </div>

            {/* GPS info bar */}
            {geo.position && (
              <div className="mb-3 bg-gray-100 border border-black px-3 py-2 flex items-center gap-3 text-xs">
                <Navigation className="w-4 h-4 text-black flex-shrink-0" />
                <div className="flex-1">
                  <span className="text-gray-600">GPS:</span>{' '}
                  <span className="font-mono font-semibold text-black">{formatCoord(geo.position[0], geo.position[1])}</span>
                  {geo.accuracy && (
                    <span className="text-gray-600 ml-2">(precisión: ±{geo.accuracy.toFixed(0)}m)</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowCoordPanel(!showCoordPanel)}
                  className="text-black hover:underline"
                >
                  {showCoordPanel ? 'Ocultar' : 'Mostrar'} coords
                </button>
              </div>
            )}
            {geo.error && (
              <div className="mb-3 bg-white border border-black px-3 py-2 flex items-center gap-2 text-xs text-black">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {geo.error}
              </div>
            )}

            <div className="h-[380px] sm:h-[450px]">
              <DibujarPoligono onPolygon={setGeom} center={mapCenter} userPosition={geo.position} />
            </div>

            {/* Coordinate panel */}
            {showCoordPanel && vertices.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-black p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <MapPinned className="w-3.5 h-3.5 text-black" />
                    <p className="text-xs font-semibold text-black">Vértices del Polígono</p>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {vertices.map((v) => (
                      <p key={v.index} className="text-xs text-gray-500 font-mono">
                        <span className="font-semibold text-gray-700">V{v.index + 1}:</span> {formatDMS(v.lat, v.lon)}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-50 border border-black p-3">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Compass className="w-3.5 h-3.5 text-black" />
                    <p className="text-xs font-semibold text-black">Linderos (distancia / rumbo)</p>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {resumen.map((r) => (
                      <p key={r.index} className="text-xs text-gray-500 font-mono">
                        <span className="font-semibold text-gray-700">V{r.index + 1}→V{r.index + 2 > vertices.length ? 1 : r.index + 2}:</span> {r.distancia.toFixed(1)}m — {r.azimut.toFixed(0)}° {r.cardinal}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Measurements */}
            {geom && geom.coordinates.length > 0 && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-100 border border-black px-3 py-2.5 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-black" />
                  <div>
                    <p className="text-xs text-gray-600">Superficie GIS</p>
                    <p className="font-bold text-black text-sm">{superficieM2Preview(geom).toFixed(2)} m²</p>
                  </div>
                </div>
                <div className="bg-gray-100 border border-black px-3 py-2.5 flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-black" />
                  <div>
                    <p className="text-xs text-gray-600">Perímetro GIS</p>
                    <p className="font-bold text-black text-sm">{perimetroMPreview(geom).toFixed(2)} m</p>
                  </div>
                </div>
                <div className="bg-gray-100 border border-black px-3 py-2.5 flex items-center gap-2">
                  <MapPinned className="w-4 h-4 text-black" />
                  <div>
                    <p className="text-xs text-gray-600">Vértices</p>
                    <p className="font-bold text-black text-sm">{vertices.length}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Form column */}
        <div className="col-span-12 lg:col-span-5 min-w-0 space-y-4">
          {/* Datos del predio */}
          <div className="minimal-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-black" />
              <h2 className="text-sm font-semibold text-black">Datos del Predio</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={labelClass}>Código Catastral *</label>
                <input {...register('codigo_catastral')} className={inputClass} placeholder="QUITO-009" />
                {errors.codigo_catastral && <p className={errorClass}>{errors.codigo_catastral.message}</p>}
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Dirección *</label>
                <input {...register('direccion')} className={inputClass} placeholder="Av. Amazonas N40-100" />
                {errors.direccion && <p className={errorClass}>{errors.direccion.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Barrio</label>
                <input {...register('barrio')} className={inputClass} placeholder="Iñaquito" />
              </div>
              <div>
                <label className={labelClass}>Zona</label>
                <input {...register('zona')} className={inputClass} placeholder="Norte" />
              </div>
              <div>
                <label className={labelClass}>Tipo de Inmueble *</label>
                <select {...register('tipo_inmueble')} className={inputClass}>
                  <option value="residencial">🏠 Residencial</option>
                  <option value="comercial">🏪 Comercial</option>
                  <option value="industrial">🏭 Industrial</option>
                  <option value="rural">🌾 Rural</option>
                  <option value="mixto">🏙️ Mixto</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Superficie Declarada (m²) *</label>
                <input type="number" step="0.01" {...register('superficie_m2', { valueAsNumber: true })} className={inputClass} placeholder="250" />
                {errors.superficie_m2 && <p className={errorClass}>{errors.superficie_m2.message}</p>}
              </div>
            </div>
          </div>

          {/* Linderos */}
          <div className="minimal-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-black" />
                <h2 className="text-sm font-semibold text-black">Linderos</h2>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoLinderos}
                  onChange={(e) => setAutoLinderos(e.target.checked)}
                  className="rounded text-black focus:ring-black"
                />
                Calcular automáticamente
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Norte</label>
                <textarea {...register('norte')} className={`${inputClass} resize-none h-16 text-xs`} placeholder="Se calcula del polígono" />
              </div>
              <div>
                <label className={labelClass}>Sur</label>
                <textarea {...register('sur')} className={`${inputClass} resize-none h-16 text-xs`} placeholder="Se calcula del polígono" />
              </div>
              <div>
                <label className={labelClass}>Este</label>
                <textarea {...register('este')} className={`${inputClass} resize-none h-16 text-xs`} placeholder="Se calcula del polígono" />
              </div>
              <div>
                <label className={labelClass}>Oeste</label>
                <textarea {...register('oeste')} className={`${inputClass} resize-none h-16 text-xs`} placeholder="Se calcula del polígono" />
              </div>
            </div>
            {linderos && autoLinderos && (
              <p className="text-xs text-black mt-2 flex items-center gap-1">
                <Check className="w-3 h-3" /> Linderos calculados desde los vértices extremos del polígono
              </p>
            )}
          </div>

          {/* Propietario */}
          <div className="minimal-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-black" />
              <h2 className="text-sm font-semibold text-black">Propietario</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Cédula *</label>
                <input {...register('cedula')} className={inputClass} placeholder="1101234567" />
                {errors.cedula && <p className={errorClass}>{errors.cedula.message}</p>}
              </div>
              <div></div>
              <div>
                <label className={labelClass}>Nombre *</label>
                <input {...register('nombre')} className={inputClass} placeholder="Carlos" />
                {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Apellido *</label>
                <input {...register('apellido')} className={inputClass} placeholder="Mendoza" />
                {errors.apellido && <p className={errorClass}>{errors.apellido.message}</p>}
              </div>
              <div>
                <label className={labelClass}>Teléfono</label>
                <input {...register('telefono')} className={inputClass} placeholder="0991234567" />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input {...register('email')} className={inputClass} placeholder="correo@mail.com" />
                {errors.email && <p className={errorClass}>{errors.email.message}</p>}
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Dirección del Propietario</label>
                <input {...register('direccion_propietario')} className={inputClass} placeholder="Av. Amazonas 123" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-minimal w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Inmueble'}
          </button>
        </div>
      </form>
    </div>
  )
}
