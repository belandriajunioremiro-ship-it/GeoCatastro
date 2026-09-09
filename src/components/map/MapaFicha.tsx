import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, GeoJSON as LeafletGeoJSON, useMap } from 'react-leaflet'
import type { Inmueble } from '@/types'
import { centroide, formatCoord, formatDMS, getVertices, resumenVertices } from '@/lib/geo'

interface Props {
  inmueble: Inmueble
}

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

function FitToPolygon({ inmueble }: { inmueble: Inmueble }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current) return
    const coords = inmueble.geom.coordinates[0]
    const bounds = L.latLngBounds(coords.map(([lo, la]) => [la, lo] as [number, number]))
    map.fitBounds(bounds, { padding: [50, 50] })
    done.current = true
  }, [inmueble, map])
  return null
}

function VertexMarkers({ inmueble }: { inmueble: Inmueble }) {
  const map = useMap()
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const vertices = getVertices(inmueble.geom)
    vertices.forEach((v) => {
      const icon = L.divIcon({
        className: 'vertex-marker',
        html: `
          <div style="
            width: 24px; height: 24px;
            background: white;
            border: 2px solid ${tipoColores[inmueble.tipo_inmueble] ?? '#000000'};
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 10px; font-weight: bold; color: ${tipoColores[inmueble.tipo_inmueble] ?? '#000000'};
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          ">${v.index + 1}</div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
      const marker = L.marker([v.lat, v.lon], { icon }).addTo(map)
      marker.bindTooltip(`V${v.index + 1}: ${formatDMS(v.lat, v.lon)}`, { direction: 'top', offset: [0, -10] })
      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [inmueble, map])

  return null
}

export default function MapaFicha({ inmueble }: Props) {
  const [lat, lon] = centroide(inmueble.geom)
  const color = tipoColores[inmueble.tipo_inmueble] ?? '#000000'
  const icon = tipoIconos[inmueble.tipo_inmueble] ?? '📍'
  const vertices = getVertices(inmueble.geom)
  const resumen = resumenVertices(inmueble.geom)

  return (
    <div>
      <div className="h-[350px] rounded-lg overflow-hidden">
        <MapContainer
          center={[lat, lon]}
          zoom={16}
          className="h-full w-full z-0"
          style={{ minHeight: '350px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <LeafletGeoJSON
            data={{
              type: 'Feature',
              geometry: inmueble.geom,
              properties: {},
            } as GeoJSON.Feature<GeoJSON.Polygon>}
            style={{
              color: color,
              weight: 3,
              fillColor: color,
              fillOpacity: 0.2,
            }}
          />
          <FitToPolygon inmueble={inmueble} />
          <VertexMarkers inmueble={inmueble} />
        </MapContainer>
      </div>

      {/* Coordinate info */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Centroide del Predio</p>
          <p className="text-xs font-mono text-gray-900">{formatCoord(lat, lon)}</p>
          <p className="text-xs font-mono text-gray-500 mt-0.5">{formatDMS(lat, lon)}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 mb-1">Tipo de Inmueble</p>
          <p className="text-sm text-gray-900">{icon} <span className="capitalize">{inmueble.tipo_inmueble}</span></p>
        </div>
      </div>

      {/* Vertices table */}
      {vertices.length > 0 && (
        <div className="mt-3 bg-gray-50 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-600 mb-2">Vértices y Linderos del Polígono</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-1.5 px-2 font-medium text-gray-500">Vértice</th>
                  <th className="text-left py-1.5 px-2 font-medium text-gray-500">Coordenadas (DMS)</th>
                  <th className="text-right py-1.5 px-2 font-medium text-gray-500">Distancia</th>
                  <th className="text-right py-1.5 px-2 font-medium text-gray-500">Rumbo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vertices.map((v) => {
                  const r = resumen[v.index]
                  return (
                    <tr key={v.index} className="hover:bg-white">
                      <td className="py-1.5 px-2 font-semibold text-gray-700">V{v.index + 1}</td>
                      <td className="py-1.5 px-2 font-mono text-gray-600">{formatDMS(v.lat, v.lon)}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{r ? `${r.distancia.toFixed(1)} m` : '—'}</td>
                      <td className="py-1.5 px-2 text-right text-gray-600">{r ? `${r.azimut.toFixed(0)}° ${r.cardinal}` : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
