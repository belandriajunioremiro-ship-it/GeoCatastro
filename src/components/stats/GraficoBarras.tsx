import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface Props {
  data: { name: string; predios: number; superficie: number }[]
}

export default function GraficoBarras({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#000" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#000" />
        <YAxis tick={{ fontSize: 12 }} stroke="#000" />
        <Tooltip
          contentStyle={{ borderRadius: '0', border: '1px solid #000', fontSize: '13px', backgroundColor: '#fff' }}
        />
        <Legend wrapperStyle={{ fontSize: '13px' }} />
        <Bar dataKey="predios" fill="#000" radius={[0, 0, 0, 0]} name="N° Predios" />
        <Bar dataKey="superficie" fill="#666" radius={[0, 0, 0, 0]} name="Superficie (m²)" />
      </BarChart>
    </ResponsiveContainer>
  )
}
