import { useEffect, useState } from 'react'
import { Map, Ruler, Building2, Layers, PieChart as PieIcon } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import Tarjeta from '@/components/stats/Tarjeta'
import GraficoBarras from '@/components/stats/GraficoBarras'
import { db, initDbWithSeed } from '@/lib/mockDb'
import type { Inmueble } from '@/types'

const tipoColores: Record<string, string> = {
  residencial: '#000000',
  comercial: '#333333',
  industrial: '#666666',
  rural: '#999999',
  mixto: '#CCCCCC',
}

export default function Estadisticas() {
  const [inmuebles, setInmuebles] = useState<Inmueble[]>([])

  useEffect(() => {
    (async () => {
      await initDbWithSeed()
      const data = await db.inmuebles.toArray()
      setInmuebles(data)
    })()
  }, [])

  const totalPredios = inmuebles.length
  const superficieTotal = inmuebles.reduce((sum, i) => sum + (i.superficie_gis_m2 ?? i.superficie_m2 ?? 0), 0)

  // Por tipo
  const porTipoMap = inmuebles.reduce<Record<string, number>>((acc, i) => {
    acc[i.tipo_inmueble] = (acc[i.tipo_inmueble] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(porTipoMap).map(([name, value]) => ({ name, value, color: tipoColores[name] }))

  // Por zona
  const porZonaMap = inmuebles.reduce<Record<string, number>>((acc, i) => {
    const z = i.zona ?? 'Sin zona'
    acc[z] = (acc[z] ?? 0) + 1
    return acc
  }, {})

  // Por barrio
  const porBarrio = inmuebles.reduce<Record<string, { predios: number; superficie: number }>>((acc, i) => {
    const b = i.barrio ?? 'Sin barrio'
    if (!acc[b]) acc[b] = { predios: 0, superficie: 0 }
    acc[b].predios++
    acc[b].superficie += i.superficie_gis_m2 ?? i.superficie_m2 ?? 0
    return acc
  }, {})
  const barData = Object.entries(porBarrio).map(([name, v]) => ({
    name,
    predios: v.predios,
    superficie: Math.round(v.superficie),
  }))

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl font-bold text-black mb-1">Estadísticas Catastrales</h1>
      <p className="text-sm text-gray-600 mb-6">Resumen general del catastro municipal</p>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <Tarjeta icon={<Map className="w-6 h-6" />} label="Total Predios" value={totalPredios} accent="text-black" />
        <Tarjeta icon={<Ruler className="w-6 h-6" />} label="Superficie Total" value={`${(superficieTotal / 1000).toFixed(1)}K m²`} accent="text-black" />
        <Tarjeta icon={<Building2 className="w-6 h-6" />} label="Zonas" value={Object.keys(porZonaMap).length} accent="text-black" />
        <Tarjeta icon={<Layers className="w-6 h-6" />} label="Barrios" value={Object.keys(porBarrio).length} accent="text-black" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie por tipo */}
        <div className="minimal-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-4 h-4 text-black" />
            <h2 className="text-sm font-semibold text-black">Distribución por Tipo</h2>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '0', border: '1px solid #000', fontSize: '13px', backgroundColor: '#fff' }} />
              <Legend wrapperStyle={{ fontSize: '13px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Barras por barrio */}
        <div className="minimal-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-black" />
            <h2 className="text-sm font-semibold text-black">Predios por Barrio</h2>
          </div>
          <GraficoBarras data={barData} />
        </div>
      </div>

      {/* Tabla resumen por zona */}
      <div className="mt-6 minimal-card overflow-hidden">
        <div className="px-5 py-3 border-b border-black">
          <h2 className="text-sm font-semibold text-black">Resumen por Zona</h2>
        </div>
        <table className="w-full min-w-[420px] text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-2.5 font-medium text-black">Zona</th>
              <th className="text-right px-5 py-2.5 font-medium text-black">N° Predios</th>
              <th className="text-right px-5 py-2.5 font-medium text-black">% del Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Object.entries(porZonaMap).map(([zona, count]) => (
              <tr key={zona} className="hover:bg-gray-50">
                <td className="px-5 py-2.5 text-black">{zona}</td>
                <td className="px-5 py-2.5 text-right text-black">{count}</td>
                <td className="px-5 py-2.5 text-right text-gray-600">{((count / totalPredios) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
