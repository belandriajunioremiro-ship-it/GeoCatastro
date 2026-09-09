import Dexie, { Table } from 'dexie'
import type { Inmueble, Propietario } from '@/types'

export class CatastroDB extends Dexie {
  inmuebles!: Table<Inmueble, string>
  propietarios!: Table<Propietario, string>

  constructor() {
    super('catastro_municipal')
    this.version(1).stores({
      inmuebles: 'id, codigo_catastral, propietario_id, estado_sync, tipo_inmueble, zona, barrio',
      propietarios: 'id, cedula',
    })
  }
}

export const db = new CatastroDB()

export async function initDbWithSeed(): Promise<void> {
  const count = await db.inmuebles.count()
  if (count > 0) return
  await db.transaction('rw', db.inmuebles, db.propietarios, async () => {
    for (const p of propietariosSeed) await db.propietarios.put(p)
    for (const i of inmueblesSeed) await db.inmuebles.put(i)
  })
}

// ── Seed data (simula datos provenientes del servidor) ──────────────────────

const propietariosSeed: Propietario[] = [
  { id: 'p1', cedula: '1101234567', nombre: 'Carlos', apellido: 'Mendoza', telefono: '099112233', email: 'carlos@mail.com', direccion: 'Av. Amazonas 123' },
  { id: 'p2', cedula: '1107654321', nombre: 'María', apellido: 'Vargas', telefono: '098887766', email: 'maria@mail.com', direccion: 'Calle Boyacá 45' },
  { id: 'p3', cedula: '0902345678', nombre: 'Jorge', apellido: 'Quiroga', telefono: '099334455', email: 'jorge@mail.com', direccion: 'Av. 6 de Diciembre N34' },
  { id: 'p4', cedula: '1105554444', nombre: 'Ana', apellido: 'Salazar', telefono: '097778899', email: 'ana@mail.com', direccion: 'Calle 10 de Agosto 890' },
  { id: 'p5', cedula: '1712345678', nombre: 'Luis', apellido: 'Tapia', telefono: '096554433', email: 'luis@mail.com', direccion: 'Av. Mariscal Sucre 12' },
]

// Centro: Quito (-0.1807, -78.4678)
function makePolygon(cx: number, cy: number, sizeDeg: number): GeoJSON.Polygon {
  const s = sizeDeg
  return {
    type: 'Polygon',
    coordinates: [[
      [cx, cy],
      [cx + s, cy],
      [cx + s, cy + s],
      [cx, cy + s],
      [cx, cy],
    ]],
  }
}

const inmueblesSeed: Inmueble[] = [
  {
    id: 'i1', codigo_catastral: 'QUITO-001', direccion: 'Av. Amazonas N34-451', barrio: 'Mariscal', zona: 'Norte',
    tipo_inmueble: 'comercial', superficie_m2: 320, superficie_gis_m2: 318.5, perimetro_gis_m: 71.4,
    norte: 'Av. Amazonas', sur: 'Av. Eloy Alfaro', este: 'Calle Wallaby', oeste: 'Av. 10 de Agosto',
    geom: makePolygon(-78.4897, -0.1740, 0.0015), propietario_id: 'p1', estado_sync: 'synced',
    created_at: '2024-01-15T10:00:00Z', updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'i2', codigo_catastral: 'QUITO-002', direccion: 'Calle Boyacá E4-58', barrio: 'La Marín', zona: 'Centro',
    tipo_inmueble: 'residencial', superficie_m2: 180, superficie_gis_m2: 179.2, perimetro_gis_m: 53.6,
    norte: 'Calle Boyacá', sur: 'Av. Colón', este: 'Av. 10 de Agosto', oeste: 'Calle 12 de Octubre',
    geom: makePolygon(-78.4907, -0.2050, 0.0012), propietario_id: 'p2', estado_sync: 'synced',
    created_at: '2024-02-20T14:30:00Z', updated_at: '2024-02-20T14:30:00Z',
  },
  {
    id: 'i3', codigo_catastral: 'QUITO-003', direccion: 'Av. 6 de Diciembre N34-120', barrio: 'Iñaquito', zona: 'Norte',
    tipo_inmueble: 'residencial', superficie_m2: 240, superficie_gis_m2: 241.1, perimetro_gis_m: 62.0,
    norte: 'Av. 6 de Diciembre', sur: 'Calle Iñaquito', este: 'Av. 12 de Octubre', oeste: 'Av. Eloy Alfaro',
    geom: makePolygon(-78.4820, -0.1705, 0.0014), propietario_id: 'p3', estado_sync: 'synced',
    created_at: '2024-03-10T09:15:00Z', updated_at: '2024-03-10T09:15:00Z',
  },
  {
    id: 'i4', codigo_catastral: 'QUITO-004', direccion: 'Calle 10 de Agosto N18-345', barrio: 'El Ejido', zona: 'Centro',
    tipo_inmueble: 'mixto', superficie_m2: 450, superficie_gis_m2: 448.7, perimetro_gis_m: 84.7,
    norte: 'Calle 10 de Agosto', sur: 'Av. Colón', este: 'Av. 6 de Diciembre', oeste: 'Av. 10 de Agosto',
    geom: makePolygon(-78.4860, -0.1950, 0.0020), propietario_id: 'p4', estado_sync: 'synced',
    created_at: '2024-04-05T11:00:00Z', updated_at: '2024-04-05T11:00:00Z',
  },
  {
    id: 'i5', codigo_catastral: 'QUITO-005', direccion: 'Av. Mariscal Sucre 12-340', barrio: 'La Alameda', zona: 'Centro',
    tipo_inmueble: 'industrial', superficie_m2: 1200, superficie_gis_m2: 1198.4, perimetro_gis_m: 138.0,
    norte: 'Av. Mariscal Sucre', sur: 'Calle Yaguachi', este: 'Av. 10 de Agosto', oeste: 'Calle 10 de Agosto',
    geom: makePolygon(-78.4700, -0.2150, 0.0035), propietario_id: 'p5', estado_sync: 'synced',
    created_at: '2024-05-01T08:00:00Z', updated_at: '2024-05-01T08:00:00Z',
  },
  {
    id: 'i6', codigo_catastral: 'QUITO-006', direccion: 'Av. Eloy Alfaro N34-800', barrio: 'Iñaquito', zona: 'Norte',
    tipo_inmueble: 'residencial', superficie_m2: 160, superficie_gis_m2: 161.3, perimetro_gis_m: 50.8,
    norte: 'Av. Eloy Alfaro', sur: 'Calle Iñaquito', este: 'Av. 6 de Diciembre', oeste: 'Av. Amazonas',
    geom: makePolygon(-78.4870, -0.1690, 0.0011), propietario_id: 'p1', estado_sync: 'synced',
    created_at: '2024-06-12T15:45:00Z', updated_at: '2024-06-12T15:45:00Z',
  },
  {
    id: 'i7', codigo_catastral: 'QUITO-007', direccion: 'Calle 12 de Octubre N24-560', barrio: 'La Marín', zona: 'Centro',
    tipo_inmueble: 'comercial', superficie_m2: 280, superficie_gis_m2: 279.5, perimetro_gis_m: 66.9,
    norte: 'Calle 12 de Octubre', sur: 'Calle 10 de Agosto', este: 'Av. 10 de Agosto', oeste: 'Av. 6 de Diciembre',
    geom: makePolygon(-78.4850, -0.2020, 0.0013), propietario_id: 'p2', estado_sync: 'synced',
    created_at: '2024-07-08T13:20:00Z', updated_at: '2024-07-08T13:20:00Z',
  },
  {
    id: 'i8', codigo_catastral: 'QUITO-008', direccion: 'Av. Amazonas N40-125', barrio: 'Iñaquito', zona: 'Norte',
    tipo_inmueble: 'rural', superficie_m2: 5000, superficie_gis_m2: 4998.2, perimetro_gis_m: 282.8,
    norte: 'Av. Amazonas', sur: 'Calle Iñaquito', este: 'Av. Eloy Alfaro', oeste: 'Av. 6 de Diciembre',
    geom: makePolygon(-78.4890, -0.1650, 0.0050), propietario_id: 'p3', estado_sync: 'synced',
    created_at: '2024-08-03T10:30:00Z', updated_at: '2024-08-03T10:30:00Z',
  },
]
