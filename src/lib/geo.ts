export function centroide(geom: GeoJSON.Polygon): [number, number] {
  const anillo = geom.coordinates[0]
  let lat = 0, lon = 0
  anillo.forEach(([lo, la]) => { lat += la; lon += lo })
  const n = anillo.length
  return [lat / n, lon / n]
}

/** Aproximación rápida en m² — SOLO para preview mientras se dibuja */
export function superficieM2Preview(geom: GeoJSON.Polygon): number {
  const anillo = geom.coordinates[0]
  if (anillo.length < 4) return 0
  const latRef = anillo[0][1]
  const kx = 111320 * Math.cos((latRef * Math.PI) / 180)
  const ky = 110574
  let area = 0
  for (let i = 0; i < anillo.length - 1; i++) {
    const [x1, y1] = anillo[i]
    const [x2, y2] = anillo[i + 1]
    area += x1 * kx * y2 * ky - x2 * kx * y1 * ky
  }
  return Math.abs(area / 2)
}

export function perimetroMPreview(geom: GeoJSON.Polygon): number {
  const anillo = geom.coordinates[0]
  if (anillo.length < 2) return 0
  const latRef = anillo[0][1]
  const kx = 111320 * Math.cos((latRef * Math.PI) / 180)
  const ky = 110574
  let per = 0
  for (let i = 0; i < anillo.length - 1; i++) {
    const dx = (anillo[i + 1][0] - anillo[i][0]) * kx
    const dy = (anillo[i + 1][1] - anillo[i][1]) * ky
    per += Math.hypot(dx, dy)
  }
  return per
}

export function polygonToWKT(geom: GeoJSON.Polygon): string {
  const coords = geom.coordinates[0].map(([lo, la]) => `${lo} ${la}`).join(', ')
  return `POLYGON((${coords}))`
}

/** Formatea coordenadas a grados decimales con 6 decimales */
export function formatCoord(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(6)}° ${ns}, ${Math.abs(lon).toFixed(6)}° ${ew}`
}

/** Convierte grados decimales a formato DMS (grados, minutos, segundos) */
export function toDMS(decimal: number): string {
  const abs = Math.abs(decimal)
  const d = Math.floor(abs)
  const mFloat = (abs - d) * 60
  const m = Math.floor(mFloat)
  const s = ((mFloat - m) * 60).toFixed(2)
  return `${d}°${m}'${s}"`
}

export function formatDMS(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S'
  const ew = lon >= 0 ? 'E' : 'W'
  return `${toDMS(lat)} ${ns}, ${toDMS(lon)} ${ew}`
}

/** Obtiene los vértices del polígono con sus coordenadas */
export function getVertices(geom: GeoJSON.Polygon): { lat: number; lon: number; index: number }[] {
  const anillo = geom.coordinates[0]
  return anillo.slice(0, -1).map(([lo, la], index) => ({ lat: la, lon: lo, index }))
}

/** Calcula automáticamente los linderos (N/S/E/O) basándose en los vértices del polígono */
export function calcularLinderos(geom: GeoJSON.Polygon): { norte: string; sur: string; este: string; oeste: string } {
  const vertices = getVertices(geom)
  if (vertices.length < 3) {
    return { norte: '', sur: '', este: '', oeste: '' }
  }

  // Encontrar los vértices extremos
  let norteV = vertices[0], surV = vertices[0], esteV = vertices[0], oesteV = vertices[0]
  for (const v of vertices) {
    if (v.lat > norteV.lat) norteV = v
    if (v.lat < surV.lat) surV = v
    if (v.lon > esteV.lon) esteV = v
    if (v.lon < oesteV.lon) oesteV = v
  }

  return {
    norte: `Vértice ${norteV.index + 1} (${formatDMS(norteV.lat, norteV.lon)})`,
    sur: `Vértice ${surV.index + 1} (${formatDMS(surV.lat, surV.lon)})`,
    este: `Vértice ${esteV.index + 1} (${formatDMS(esteV.lat, esteV.lon)})`,
    oeste: `Vértice ${oesteV.index + 1} (${formatDMS(oesteV.lat, oesteV.lon)})`,
  }
}

/** Distancia en metros entre dos puntos GPS */
export function distanciaM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/** Azimut (rumbo) en grados entre dos puntos GPS */
export function azimut(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

/** Convierte azimut en grados a dirección cardinal */
export function azimutToCardinal(az: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']
  const idx = Math.round(az / 45) % 8
  return dirs[idx]
}

/** Genera un resumen de los vértices con distancia y azimut entre ellos */
export function resumenVertices(geom: GeoJSON.Polygon): { index: number; lat: number; lon: number; distancia: number; azimut: number; cardinal: string }[] {
  const vertices = getVertices(geom)
  if (vertices.length < 2) return []
  const resumen = vertices.map((v, i) => {
    const next = vertices[(i + 1) % vertices.length]
    const dist = distanciaM(v.lat, v.lon, next.lat, next.lon)
    const az = azimut(v.lat, v.lon, next.lat, next.lon)
    return {
      index: v.index,
      lat: v.lat,
      lon: v.lon,
      distancia: dist,
      azimut: az,
      cardinal: azimutToCardinal(az),
    }
  })
  return resumen
}
