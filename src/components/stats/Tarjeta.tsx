import type { ReactNode } from 'react'

interface Props {
  icon: ReactNode
  label: string
  value: string | number
  accent?: string
}

export default function Tarjeta({ icon, label, value, accent = 'text-black' }: Props) {
  return (
    <div className="minimal-card p-3 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 font-medium uppercase tracking-wide text-xs">{label}</p>
          <p className="text-2xl font-bold text-black mt-1">{value}</p>
        </div>
        <div className={`p-3 bg-gray-50 border border-black ${accent}`}>{icon}</div>
      </div>
    </div>
  )
}
