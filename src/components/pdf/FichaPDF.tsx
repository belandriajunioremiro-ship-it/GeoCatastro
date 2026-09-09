import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { Inmueble } from '@/types'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 11, fontFamily: 'Helvetica' },
  header: { marginBottom: 16, borderBottomWidth: 2, borderBottomColor: '#000000', paddingBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#000000' },
  subtitle: { fontSize: 10, color: '#666666', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#000000', marginBottom: 6, marginTop: 14 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 140, fontWeight: 'bold', color: '#666666' },
  value: { flex: 1, color: '#000000' },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 0, fontSize: 9, color: 'white', textAlign: 'center' },
})

interface Props {
  inmueble: Inmueble
}

export default function FichaPDF({ inmueble }: Props) {
  const prop = inmueble.propietario
  const estadoColor = inmueble.estado_sync === 'synced' ? '#000000' : inmueble.estado_sync === 'pendiente' ? '#666666' : '#999999'
  const estadoLabel = inmueble.estado_sync === 'synced' ? 'Sincronizado' : inmueble.estado_sync === 'pendiente' ? 'Pendiente' : 'Conflicto'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Ficha Catastral</Text>
          <Text style={styles.subtitle}>Municipalidad — Sistema de Catastro Urbano</Text>
        </View>

        <View style={styles.sectionTitle}>
          <Text>Datos del Predio</Text>
        </View>
        <View style={styles.row}><Text style={styles.label}>Código Catastral:</Text><Text style={styles.value}>{inmueble.codigo_catastral}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Dirección:</Text><Text style={styles.value}>{inmueble.direccion}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Barrio:</Text><Text style={styles.value}>{inmueble.barrio ?? '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Zona:</Text><Text style={styles.value}>{inmueble.zona ?? '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Tipo de Inmueble:</Text><Text style={styles.value}>{inmueble.tipo_inmueble}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Superficie (declarada):</Text><Text style={styles.value}>{inmueble.superficie_m2 ?? '—'} m²</Text></View>
        <View style={styles.row}><Text style={styles.label}>Superficie (GIS):</Text><Text style={styles.value}>{inmueble.superficie_gis_m2?.toFixed(2) ?? '—'} m²</Text></View>
        <View style={styles.row}><Text style={styles.label}>Perímetro (GIS):</Text><Text style={styles.value}>{inmueble.perimetro_gis_m?.toFixed(2) ?? '—'} m</Text></View>

        <View style={styles.sectionTitle}>
          <Text>Linderos</Text>
        </View>
        <View style={styles.row}><Text style={styles.label}>Norte:</Text><Text style={styles.value}>{inmueble.norte ?? '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Sur:</Text><Text style={styles.value}>{inmueble.sur ?? '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Este:</Text><Text style={styles.value}>{inmueble.este ?? '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Oeste:</Text><Text style={styles.value}>{inmueble.oeste ?? '—'}</Text></View>

        {prop && (
          <>
            <View style={styles.sectionTitle}>
              <Text>Propietario</Text>
            </View>
            <View style={styles.row}><Text style={styles.label}>Cédula:</Text><Text style={styles.value}>{prop.cedula}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Nombre:</Text><Text style={styles.value}>{prop.nombre} {prop.apellido}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Teléfono:</Text><Text style={styles.value}>{prop.telefono ?? '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{prop.email ?? '—'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Dirección:</Text><Text style={styles.value}>{prop.direccion ?? '—'}</Text></View>
          </>
        )}

        <View style={styles.sectionTitle}>
          <Text>Estado del Registro</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Sincronización:</Text>
          <View style={[styles.badge, { backgroundColor: estadoColor }]}>
            <Text>{estadoLabel}</Text>
          </View>
        </View>
        <View style={styles.row}><Text style={styles.label}>Creado:</Text><Text style={styles.value}>{inmueble.created_at ?? '—'}</Text></View>
        <View style={styles.row}><Text style={styles.label}>Actualizado:</Text><Text style={styles.value}>{inmueble.updated_at ?? '—'}</Text></View>
      </Page>
    </Document>
  )
}
