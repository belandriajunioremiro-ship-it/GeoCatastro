import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, GeoJSON as LeafletGeoJSON, useMap } from 'react-leaflet'
import type { Inmueble } from '@/types'
import { centroide, formatCoord } from '@/lib/geo'

interface Props {
  inmuebles: Inmueble[]
  onSelect?: (id: string) => void
  selectedId?: string
  userPosition?: [number, number] | null
  className?: string
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

function createCustomIcon(tipo: string, isSelected: boolean): L.DivIcon {
  const color = tipoColores[tipo] ?? '#000000'
  const icon = tipoIconos[tipo] ?? '📍'
  const size = isSelected ? 44 : 36
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 3px solid ${isSelected ? '#000000' : 'white'};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="transform: rotate(45deg); font-size: ${size * 0.5}px; line-height: 1;">${icon}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: 'user-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 20px;
          height: 20px;
          background: #000000;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.3), 0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 60px;
          border: 2px solid rgba(0, 0, 0, 0.4);
          border-radius: 50%;
          animation: pulse 2s ease-out infinite;
        "></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

function FitBounds({ inmuebles }: { inmuebles: Inmueble[] }) {
  const map = useMap()
  const done = useRef(false)
  useEffect(() => {
    if (done.current || inmuebles.length === 0) return
    const coords = inmuebles.flatMap((i) => i.geom.coordinates[0])
    const bounds = L.latLngBounds(coords.map(([lo, la]) => [la, lo] as [number, number]))
    map.fitBounds(bounds, { padding: [40, 40] })
    done.current = true
  }, [inmuebles, map])
  return null
}

function MapController({ inmuebles, onSelect, selectedId, userPosition }: {
  inmuebles: Inmueble[]
  onSelect?: (id: string) => void
  selectedId?: string
  userPosition?: [number, number] | null
}) {
  const map = useMap()
  const markersRef = useRef<L.Marker[]>([])
  const userMarkerRef = useRef<L.Marker | null>(null)
  const userCircleRef = useRef<L.Circle | null>(null)

  // Limpiar markers anteriores
  useEffect(() => {
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
  }, [inmuebles.length])

  // Crear markers para cada inmueble
  useEffect(() => {
    inmuebles.forEach((inm) => {
      const [lat, lon] = centroide(inm.geom)
      const isSelected = inm.id === selectedId
      const icon = createCustomIcon(inm.tipo_inmueble, isSelected)
      const marker = L.marker([lat, lon], { icon }).addTo(map)

      const prop = inm.propietario
      const propNombre = prop ? `${prop.nombre} ${prop.apellido}` : 'Sin propietario'
      const propCedula = prop ? prop.cedula : '—'
      const superficie = inm.superficie_gis_m2?.toFixed(1) ?? inm.superficie_m2?.toString() ?? '—'

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; min-width: 200px;">
          <div style="background: ${tipoColores[inm.tipo_inmueble]}; color: white; padding: 8px 12px; border-radius: 8px 8px 0 0; margin: -8px -8px 8px -8px; font-weight: 600; font-size: 14px;">
            ${tipoIconos[inm.tipo_inmueble]} ${inm.codigo_catastral}
          </div>
          <div style="font-size: 12px; line-height: 1.6;">
            <p style="font-weight: 600; margin: 0 0 4px;">${inm.direccion}</p>
            <p style="color: #6b7280; margin: 0 0 4px;">📍 ${inm.barrio ?? '—'} — ${inm.zona ?? '—'}</p>
            <p style="margin: 0 0 4px;">📐 <strong>${superficie} m²</strong></p>
            <p style="margin: 0 0 4px;">👤 ${propNombre}</p>
            <p style="color: #6b7280; margin: 0 0 4px;">🆔 ${propCedula}</p>
            <p style="color: #6b7280; margin: 0;">🧭 ${formatCoord(lat, lon)}</p>
          </div>
          <button onclick="window.__selectInmueble('${inm.id}')" style="
            width: 100%; margin-top: 8px; padding: 6px; background: #2563eb; color: white;
            border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;
          ">Ver ficha completa</button>
        </div>
      `)

      marker.on('click', () => onSelect?.(inm.id))
      markersRef.current.push(marker)
    })

    return () => {
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
    }
  }, [inmuebles, map, onSelect, selectedId])

  // Actualizar icono del seleccionado
  useEffect(() => {
    markersRef.current.forEach((m, idx) => {
      const inm = inmuebles[idx]
      if (!inm) return
      const isSelected = inm.id === selectedId
      const icon = createCustomIcon(inm.tipo_inmueble, isSelected)
      m.setIcon(icon)
    })
  }, [selectedId, inmuebles])

  // Marker de usuario
  useEffect(() => {
    if (userMarkerRef.current) {
      userMarkerRef.current.remove()
      userMarkerRef.current = null
    }
    if (userCircleRef.current) {
      userCircleRef.current.remove()
      userCircleRef.current = null
    }
    if (userPosition) {
      const icon = createUserIcon()
      const marker = L.marker(userPosition, { icon, zIndexOffset: 1000 }).addTo(map)
      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif;">
          <p style="font-weight: 600; margin: 0 0 4px;">📍 Mi ubicación</p>
          <p style="font-size: 12px; color: #6b7280; margin: 0;">${formatCoord(userPosition[0], userPosition[1])}</p>
        </div>
      `)
      userMarkerRef.current = marker
      map.setView(userPosition, 16, { animate: true })
    }
  }, [userPosition, map])

  return null
}

export default function MapaCatastral({ inmuebles, onSelect, selectedId, userPosition, className }: Props) {
  const geoData = inmuebles.map((i) => ({
    type: 'Feature' as const,
    geometry: i.geom,
    properties: {
      id: i.id,
      codigo: i.codigo_catastral,
      direccion: i.direccion,
      barrio: i.barrio ?? '',
      zona: i.zona ?? '',
      tipo: i.tipo_inmueble,
      superficie: i.superficie_gis_m2 ?? i.superficie_m2,
    },
  }))

  // Exponer función para el botón del popup
  useEffect(() => {
    if (onSelect) {
      window.__selectInmueble = (id: string) => onSelect(id)
    }
  }, [onSelect])

  return (
    <MapContainer
      center={[-0.1807, -78.4678]}
      zoom={13}
      className={className ?? 'h-full w-full rounded-xl z-0'}
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      <FitBounds inmuebles={inmuebles} />
      {geoData.map((feature) => {
        const isSelected = feature.properties.id === selectedId
        return (
          <LeafletGeoJSON
            key={feature.properties.id}
            data={feature}
            style={{
              color: isSelected ? '#fbbf24' : tipoColores[feature.properties.tipo] ?? '#6b7280',
              weight: isSelected ? 4 : 2,
              fillColor: tipoColores[feature.properties.tipo] ?? '#6b7280',
              fillOpacity: isSelected ? 0.5 : 0.2,
            }}
            eventHandlers={{
              click: () => onSelect?.(feature.properties.id),
            }}
          />
        )
      })}
      <MapController
        inmuebles={inmuebles}
        onSelect={onSelect}
        selectedId={selectedId}
        userPosition={userPosition}
      />
    </MapContainer>
  )
}
