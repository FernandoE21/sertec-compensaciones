import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { Users, ClipboardList, CheckCircle, XCircle, Clock, TrendingUp, ArrowRight, AlertTriangle } from 'lucide-react'

function AdminDashboardHome() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recientes, setRecientes] = useState([])
  const [porSeccion, setPorSeccion] = useState([])
  const [porEstado, setPorEstado] = useState({ Pendiente: 0, Aprobado: 0, Rechazado: 0 })
  const [porTipo, setPorTipo] = useState([])

  useEffect(() => {
    fetchAll()
  }, [])

  const fetchAll = async () => {
    setLoading(true)

    // Personal stats
    const { data: personal } = await supabase.from('personal').select('codigo, nombres, apellidos, seccion, cargo')
    const totalPersonal = personal?.length || 0

    // Group by section
    const seccionMap = {}
    personal?.forEach(p => {
      const s = p.seccion || 'Sin sección'
      seccionMap[s] = (seccionMap[s] || 0) + 1
    })
    setPorSeccion(Object.entries(seccionMap).sort((a, b) => b[1] - a[1]))

    // Registros stats
    const { data: registros } = await supabase.from('registro_horas').select('*').order('created_at', { ascending: false })
    const totalRegistros = registros?.length || 0

    // By status
    const estadoMap = { Pendiente: 0, Aprobado: 0, Rechazado: 0 }
    registros?.forEach(r => {
      if (estadoMap[r.estado] !== undefined) estadoMap[r.estado]++
    })
    setPorEstado(estadoMap)

    // By type
    const tipoMap = {}
    registros?.forEach(r => {
      const t = r.tipo_solicitud || 'Sin tipo'
      tipoMap[t] = (tipoMap[t] || 0) + 1
    })
    setPorTipo(Object.entries(tipoMap).sort((a, b) => b[1] - a[1]).slice(0, 8))

    // Recent 5
    const recentWithNames = (registros || []).slice(0, 8).map(r => {
      const p = personal?.find(pe => pe.codigo === r.codigo_trabajador)
      return { ...r, nombre: p ? `${p.apellidos}, ${p.nombres}` : r.codigo_trabajador }
    })
    setRecientes(recentWithNames)

    // This month stats
    const now = new Date()
    const mesActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const registrosMes = registros?.filter(r => r.fecha_solicitud?.startsWith(mesActual)) || []

    setStats({
      totalPersonal,
      totalRegistros,
      pendientes: estadoMap.Pendiente,
      aprobados: estadoMap.Aprobado,
      rechazados: estadoMap.Rechazado,
      registrosMes: registrosMes.length,
    })
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-corporate-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Personal', value: stats.totalPersonal, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: 'Total Solicitudes', value: stats.totalRegistros, icon: ClipboardList, color: 'bg-indigo-500', bg: 'bg-indigo-50' },
    { label: 'Pendientes', value: stats.pendientes, icon: Clock, color: 'bg-amber-500', bg: 'bg-amber-50', alert: stats.pendientes > 0 },
    { label: 'Aprobadas', value: stats.aprobados, icon: CheckCircle, color: 'bg-green-500', bg: 'bg-green-50' },
    { label: 'Rechazadas', value: stats.rechazados, icon: XCircle, color: 'bg-red-500', bg: 'bg-red-50' },
    { label: 'Este Mes', value: stats.registrosMes, icon: TrendingUp, color: 'bg-corporate-blue', bg: 'bg-sky-50' },
  ]

  const estadoColor = { Pendiente: 'bg-amber-100 text-amber-700', Aprobado: 'bg-green-100 text-green-700', Rechazado: 'bg-red-100 text-red-700' }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xl md:text-2xl font-black text-corporate-blue">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Resumen general del sistema de compensaciones</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(card => (
          <div key={card.label} className={`${card.bg} rounded-2xl p-4 border border-gray-100 relative overflow-hidden`}>
            {card.alert && (
              <div className="absolute top-2 right-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
              </div>
            )}
            <div className={`w-9 h-9 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon size={18} className="text-white" />
            </div>
            <p className="text-2xl font-black text-gray-800">{card.value}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {stats.pendientes > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-amber-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800">Tienes {stats.pendientes} solicitud(es) pendiente(s) por revisar</p>
            <p className="text-xs text-amber-600 mt-0.5">Revisa el directorio para gestionar las aprobaciones.</p>
          </div>
          <button
            onClick={() => navigate('/admin-panel')}
            className="flex items-center gap-1 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold border-none cursor-pointer hover:bg-amber-600 transition-colors shrink-0"
          >
            Ver <ArrowRight size={14} />
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* By Section */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-corporate-blue uppercase tracking-wider mb-4">Personal por Sección</h3>
          <div className="space-y-2.5">
            {porSeccion.map(([seccion, count]) => {
              const pct = Math.round((count / stats.totalPersonal) * 100)
              return (
                <div key={seccion}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700 truncate mr-2">{seccion}</span>
                    <span className="text-xs font-bold text-gray-500">{count} <span className="text-gray-400">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-corporate-green rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* By Request Type */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-corporate-blue uppercase tracking-wider mb-4">Solicitudes por Tipo</h3>
          <div className="space-y-2.5">
            {porTipo.map(([tipo, count]) => {
              const pct = Math.round((count / stats.totalRegistros) * 100)
              return (
                <div key={tipo}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700 truncate mr-2">{tipo}</span>
                    <span className="text-xs font-bold text-gray-500">{count} <span className="text-gray-400">({pct}%)</span></span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-corporate-blue rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-sm font-black text-corporate-blue uppercase tracking-wider mb-4">Distribución por Estado</h3>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(porEstado).map(([estado, count]) => {
            const pct = stats.totalRegistros > 0 ? Math.round((count / stats.totalRegistros) * 100) : 0
            return (
              <div key={estado} className="text-center p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-3xl font-black text-gray-800">{count}</p>
                <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${estadoColor[estado]}`}>{estado}</span>
                <p className="text-xs text-gray-400 mt-1">{pct}%</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-corporate-blue uppercase tracking-wider">Actividad Reciente</h3>
          <button
            onClick={() => navigate('/admin-panel')}
            className="text-xs text-corporate-green font-bold hover:underline bg-transparent border-none cursor-pointer"
          >
            Ver todo →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 text-[10px] font-bold text-gray-400 uppercase">Colaborador</th>
                <th className="text-left py-2 text-[10px] font-bold text-gray-400 uppercase">Tipo</th>
                <th className="text-left py-2 text-[10px] font-bold text-gray-400 uppercase">Fecha</th>
                <th className="text-center py-2 text-[10px] font-bold text-gray-400 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recientes.map(r => (
                <tr key={r.nro_registro} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-2.5">
                    <p className="text-xs font-bold text-gray-800 truncate max-w-[180px]">{r.nombre}</p>
                    <span className="text-[10px] text-gray-400">{r.codigo_trabajador}</span>
                  </td>
                  <td className="py-2.5 text-xs text-gray-600 truncate max-w-[140px]">{r.tipo_solicitud}</td>
                  <td className="py-2.5 text-xs text-gray-500">{r.fecha_solicitud}</td>
                  <td className="py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${estadoColor[r.estado] || 'bg-gray-100 text-gray-500'}`}>
                      {r.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboardHome
