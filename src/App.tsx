import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import MapaGeneral from '@/pages/MapaGeneral'
import RegistrarInmueble from '@/pages/RegistrarInmueble'
import FichaCatastral from '@/pages/FichaCatastral'
import Estadisticas from '@/pages/Estadisticas'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = sessionStorage.getItem('catastro_session')
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Pequeño delay para que el CSS de leaflet cargue limpiamente
    const t = setTimeout(() => setReady(true), 100)
    return () => clearTimeout(t)
  }, [])

  if (!ready) return null

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/mapa" element={<MapaGeneral />} />
          <Route path="/registrar" element={<RegistrarInmueble />} />
          <Route path="/ficha/:id" element={<FichaCatastral />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
