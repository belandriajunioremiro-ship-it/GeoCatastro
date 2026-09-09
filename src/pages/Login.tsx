import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Building2, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTimeout(() => {
      if (username.trim() && password.trim()) {
        sessionStorage.setItem('catastro_session', JSON.stringify({ user: username, ts: Date.now() }))
        navigate('/mapa')
      } else {
        setError('Ingrese usuario y contraseña')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 bg-black mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-black tracking-tight">Sistema de Catastro</h1>
          <p className="text-sm text-gray-600 mt-1">Municipalidad — Gestión Predial Urbana</p>
        </div>

        {/* Login card */}
        <div className="bg-white border border-black p-8">
          <h2 className="text-lg font-semibold text-black mb-1">Iniciar Sesión</h2>
          <p className="text-xs text-gray-600 mb-6">Ingrese sus credenciales para acceder al sistema</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1.5">Usuario</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-minimal w-full pl-10 pr-3 py-2.5 text-sm"
                  placeholder="admin"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-black mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-minimal w-full pl-10 pr-10 py-2.5 text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-black animate-fade-in">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="btn-minimal w-full py-2.5 text-sm font-semibold"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-black">
            <p className="text-xs text-gray-600 text-center">
              Demo: cualquier usuario y contraseña funciona
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Sistema de Catastro Municipal v1.0 — Modo demostración
        </p>
      </div>
    </div>
  )
}
