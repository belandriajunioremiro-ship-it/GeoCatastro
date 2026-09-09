import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, MapPin, User, FileText, Building2, Ruler, AlertCircle, Check, Clock, Compass, Calendar, Hash } from 'lucide-react'
import { db, initDbWithSeed } from '@/lib/mockDb'
import { pdf } from '@react-pdf/renderer'
import FichaPDF from '@/components/pdf/FichaPDF'
import MapaFicha from '@/components/map/MapaFicha'
import type { Inmueble } from '@/types'

const tipoLabel: Record<string, string> = {
  residencial: 'Residencial',
  comercial: 'Comercial',
  industrial: 'Industrial',
  rural: 'Rural',
  mixto: 'Mixto',
}

export default function FichaCatastral() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [inmueble, setInmueble] = useState<Inmueble | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    (async () => {
      await initDbWithSeed()
      if (!id) return
      const data = await db.inmuebles.get(id)
      if (data) {
        const propietario = data.propietario_id ? await db.propietarios.get(data.propietario_id) : undefined
        setInmueble({ ...data, propietario })
      }
      setLoading(false)
    })()
  }, [id])

  const handleDownload = async () => {
    if (!inmueble) return
    setDownloading(true)
    try {
      const blob = await pdf(<FichaPDF inmueble={inmueble} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ficha_${inmueble.codigo_catastral}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      // El navegador puede bloquear la descarga si no hay interacción directa.
    } finally {
      setDownloading(false)
    }
  }

  if (loading) return <div className="p-4 sm:p-6 text-sm text-gray-400 animate-pulse">Cargando ficha...</div>

  if (!inmueble) {
    return <div className="p-4 sm:p-6"><div className="ficha-card p-8 text-center"><AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-sm text-gray-400">No se encontró el inmueble</p><button onClick={() => navigate('/mapa')} className="mt-4 text-sm font-medium underline">Volver al mapa</button></div></div>
  }

  const estadoInfo = {
    synced: { icon: Check, label: 'Sincronizado' },
    pendiente: { icon: Clock, label: 'Pendiente de sincronización' },
    conflicto: { icon: AlertCircle, label: 'Conflicto de sincronización' },
  }
  const EstadoIcon = estadoInfo[inmueble.estado_sync].icon
  const estadoLabel = estadoInfo[inmueble.estado_sync].label

  return (
    <main className="ficha-page min-h-screen p-0 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="bg-white border-b border-neutral-300 px-4 py-4 sm:px-0 sm:bg-transparent sm:border-0 sm:pb-5 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <button onClick={() => navigate('/mapa')} className="mt-0.5 p-2 border border-neutral-300 bg-white hover:bg-neutral-100 transition" aria-label="Volver">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Ficha catastral oficial</p>
              <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight truncate">{inmueble.codigo_catastral}</h1>
              <p className="text-sm text-gray-600 truncate">{inmueble.direccion}</p>
            </div>
          </div>
          <button onClick={handleDownload} disabled={downloading} className="btn-minimal shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">{downloading ? 'Generando...' : 'Descargar PDF'}</span><span className="sm:hidden">PDF</span>
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 sm:gap-5">
          <section className="lg:col-span-7 ficha-card p-4 sm:p-5">
            <div className="flex items-center justify-between border-b ficha-rule pb-3 mb-4">
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /><h2 className="text-sm font-semibold uppercase tracking-wider">Ubicación geográfica</h2></div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-500">Polígono registrado</span>
            </div>
            <MapaFicha inmueble={inmueble} />
          </section>

          <div className="lg:col-span-5 space-y-0 sm:space-y-5">
            <section className="ficha-card p-4 sm:p-5 border-t-0 sm:border-t">
              <div className="flex items-center gap-2 border-b ficha-rule pb-3 mb-4"><FileText className="w-4 h-4" /><h2 className="text-sm font-semibold uppercase tracking-wider">Identificación del predio</h2></div>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                <div><dt className="ficha-label">Código catastral</dt><dd className="ficha-value text-sm font-semibold mt-1 flex items-center gap-1"><Hash className="w-3 h-3 text-neutral-400" />{inmueble.codigo_catastral}</dd></div>
                <div><dt className="ficha-label">Tipo de inmueble</dt><dd className="ficha-value text-sm font-medium mt-1">{tipoLabel[inmueble.tipo_inmueble]}</dd></div>
                <div><dt className="ficha-label">Barrio</dt><dd className="ficha-value text-sm mt-1">{inmueble.barrio ?? '—'}</dd></div>
                <div><dt className="ficha-label">Zona</dt><dd className="ficha-value text-sm mt-1">{inmueble.zona ?? '—'}</dd></div>
                <div className="col-span-2"><dt className="ficha-label">Dirección</dt><dd className="ficha-value text-sm mt-1">{inmueble.direccion}</dd></div>
              </dl>
            </section>

            <section className="ficha-card p-4 sm:p-5 border-t-0 sm:border-t">
              <div className="flex items-center gap-2 border-b ficha-rule pb-3 mb-4"><Ruler className="w-4 h-4" /><h2 className="text-sm font-semibold uppercase tracking-wider">Mediciones</h2></div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="ficha-metric p-3 text-center"><p className="ficha-label">Declarada</p><p className="text-lg font-semibold mt-1">{inmueble.superficie_m2 ?? '—'}</p><p className="text-[10px] text-neutral-500">m²</p></div>
                <div className="ficha-metric p-3 text-center"><p className="ficha-label">Levantamiento</p><p className="text-lg font-semibold mt-1">{inmueble.superficie_gis_m2?.toFixed(2) ?? '—'}</p><p className="text-[10px] text-neutral-500">m²</p></div>
                <div className="ficha-metric p-3 text-center"><p className="ficha-label">Perímetro</p><p className="text-lg font-semibold mt-1">{inmueble.perimetro_gis_m?.toFixed(2) ?? '—'}</p><p className="text-[10px] text-neutral-500">m</p></div>
              </div>
              {inmueble.superficie_m2 && inmueble.superficie_gis_m2 && <p className="text-xs text-neutral-500 mt-3">Diferencia declarada / levantamiento: <strong className="text-black">{Math.abs(inmueble.superficie_m2 - inmueble.superficie_gis_m2).toFixed(2)} m²</strong></p>}
            </section>

            <section className="ficha-card p-4 sm:p-5 border-t-0 sm:border-t">
              <div className="flex items-center gap-2 border-b ficha-rule pb-3 mb-4"><Compass className="w-4 h-4" /><h2 className="text-sm font-semibold uppercase tracking-wider">Linderos</h2></div>
              <div className="grid grid-cols-2 gap-2">
                {[['Norte', inmueble.norte], ['Sur', inmueble.sur], ['Este', inmueble.este], ['Oeste', inmueble.oeste]].map(([label, value]) => <div key={label} className="border-l-2 border-black pl-3 py-1"><dt className="ficha-label">{label}</dt><dd className="text-xs text-neutral-800 mt-1 font-mono break-words">{value || '—'}</dd></div>)}
              </div>
            </section>

            {inmueble.propietario && <section className="ficha-card p-4 sm:p-5 border-t-0 sm:border-t">
              <div className="flex items-center gap-2 border-b ficha-rule pb-3 mb-4"><User className="w-4 h-4" /><h2 className="text-sm font-semibold uppercase tracking-wider">Titular registrado</h2></div>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4">
                <div><dt className="ficha-label">Cédula</dt><dd className="text-sm mt-1 font-mono">{inmueble.propietario.cedula}</dd></div>
                <div><dt className="ficha-label">Nombre completo</dt><dd className="text-sm mt-1">{inmueble.propietario.nombre} {inmueble.propietario.apellido}</dd></div>
                <div><dt className="ficha-label">Teléfono</dt><dd className="text-sm mt-1">{inmueble.propietario.telefono ?? '—'}</dd></div>
                <div><dt className="ficha-label">Correo</dt><dd className="text-sm mt-1 break-all">{inmueble.propietario.email ?? '—'}</dd></div>
                <div className="col-span-2"><dt className="ficha-label">Domicilio</dt><dd className="text-sm mt-1">{inmueble.propietario.direccion ?? '—'}</dd></div>
              </dl>
            </section>}

            <section className="ficha-status p-4 border-t-0 sm:border-t flex items-center gap-3">
              <EstadoIcon className="w-5 h-5" />
              <div className="flex-1"><p className="text-sm font-semibold">{estadoLabel}</p><p className="text-xs text-neutral-500 mt-1 flex flex-wrap gap-x-3"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{inmueble.created_at ? new Date(inmueble.created_at).toLocaleDateString('es-EC') : '—'}</span><span className="flex items-center gap-1"><Building2 className="w-3 h-3" />Registro local</span></p></div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
