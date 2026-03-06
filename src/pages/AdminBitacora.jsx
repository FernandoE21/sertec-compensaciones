import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { ScrollText, Search, X, Download, RefreshCw } from 'lucide-react'

function AdminBitacora() {
  const [registros, setRegistros] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroAccion, setFiltroAccion] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [pagina, setPagina] = useState(0)
  const POR_PAGINA = 50

  useEffect(() => {
    fetchBitacora()
  }, [pagina])

  const fetchBitacora = async () => {
    setLoading(true)
    let query = supabase
      .from('bitacora')
      .select('*', { count: 'exact' })
      .order('fecha', { ascending: false })
      .range(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA - 1)

    const { data, error, count } = await query
    if (!error) {
      setRegistros(data || [])
    }
    setLoading(false)
  }

  const filtrados = registros.filter(r => {
    const term = busqueda.toLowerCase()
    const matchTexto = !term || r.usuario.toLowerCase().includes(term) || r.descripcion.toLowerCase().includes(term) || (r.modulo || '').toLowerCase().includes(term)
    const matchAccion = !filtroAccion || r.accion === filtroAccion
    const matchTipo = !filtroTipo || r.tipo_usuario === filtroTipo
    const matchDesde = !fechaDesde || r.fecha >= fechaDesde
    const matchHasta = !fechaHasta || r.fecha <= fechaHasta + 'T23:59:59'
    return matchTexto && matchAccion && matchTipo && matchDesde && matchHasta
  })

  const limpiarFiltros = () => {
    setBusqueda('')
    setFiltroAccion('')
    setFiltroTipo('')
    setFechaDesde('')
    setFechaHasta('')
  }

  const accionColor = {
    login: 'bg-blue-100 text-blue-700',
    crear: 'bg-green-100 text-green-700',
    editar: 'bg-amber-100 text-amber-700',
    eliminar: 'bg-red-100 text-red-700',
    aprobar: 'bg-emerald-100 text-emerald-700',
    rechazar: 'bg-rose-100 text-rose-700',
    cambiar_password: 'bg-purple-100 text-purple-700',
    config: 'bg-indigo-100 text-indigo-700',
  }

  const formatFecha = (fecha) => {
    if (!fecha) return '-'
    const d = new Date(fecha)
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const exportarExcel = async () => {
    const XLSX = await import('xlsx')
    const rows = filtrados.map(r => ({
      Fecha: formatFecha(r.fecha),
      Usuario: r.usuario,
      'Tipo Usuario': r.tipo_usuario,
      Acción: r.accion,
      Módulo: r.modulo || '',
      Descripción: r.descripcion,
      'Registro ID': r.registro_id || '',
      'Datos Anteriores': r.datos_anteriores ? JSON.stringify(r.datos_anteriores) : '',
      'Datos Nuevos': r.datos_nuevos ? JSON.stringify(r.datos_nuevos) : '',
    }))
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Bitácora')
    XLSX.writeFile(wb, `bitacora_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-corporate-blue flex items-center justify-center">
              <ScrollText size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-corporate-blue">Bitácora</h2>
              <p className="text-sm text-gray-500 mt-0.5">Registro de todas las acciones del sistema</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchBitacora} className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-xl text-xs font-bold transition-colors border border-gray-200 cursor-pointer">
              <RefreshCw size={14} /> Actualizar
            </button>
            <button onClick={exportarExcel} className="flex items-center gap-1.5 px-3 py-2 bg-corporate-green text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-95 transition-all border-none cursor-pointer">
              <Download size={14} /> Exportar
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
          <div className="flex flex-col gap-1 flex-[2] min-w-0">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Buscar</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Usuario, descripción..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" />
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Acción</label>
            <select value={filtroAccion} onChange={e => setFiltroAccion(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all">
              <option value="">Todas</option>
              <option value="login">Login</option>
              <option value="crear">Crear</option>
              <option value="editar">Editar</option>
              <option value="eliminar">Eliminar</option>
              <option value="aprobar">Aprobar</option>
              <option value="rechazar">Rechazar</option>
              <option value="cambiar_password">Cambiar Password</option>
              <option value="config">Configuración</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Tipo</label>
            <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all">
              <option value="">Todos</option>
              <option value="admin">Admin</option>
              <option value="empleado">Empleado</option>
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ colorScheme: 'light' }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all sm:w-36" />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ colorScheme: 'light' }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all sm:w-36" />
          </div>
          {(busqueda || filtroAccion || filtroTipo || fechaDesde || fechaHasta) && (
            <button onClick={limpiarFiltros} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 cursor-pointer whitespace-nowrap">
              <X size={14} /> Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100 bg-white">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="bg-corporate-blue text-white">
              <th className="py-3 px-4 text-left text-xs font-bold">Fecha / Hora</th>
              <th className="py-3 px-4 text-left text-xs font-bold">Usuario</th>
              <th className="py-3 px-4 text-center text-xs font-bold">Acción</th>
              <th className="py-3 px-4 text-left text-xs font-bold">Módulo</th>
              <th className="py-3 px-4 text-left text-xs font-bold">Descripción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-400">Cargando bitácora...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan="5" className="text-center py-8 text-gray-400">No se encontraron registros en la bitácora.</td></tr>
            ) : filtrados.map(r => (
              <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-2.5 px-4">
                  <p className="text-xs font-mono text-gray-600">{formatFecha(r.fecha)}</p>
                </td>
                <td className="py-2.5 px-4">
                  <p className="text-xs font-bold text-gray-800">{r.usuario}</p>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${r.tipo_usuario === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'}`}>
                    {r.tipo_usuario}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${accionColor[r.accion] || 'bg-gray-100 text-gray-600'}`}>
                    {r.accion}
                  </span>
                </td>
                <td className="py-2.5 px-4 text-xs text-gray-500">{r.modulo || '-'}</td>
                <td className="py-2.5 px-4 text-xs text-gray-600 max-w-[250px] truncate">{r.descripcion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <button
          onClick={() => setPagina(p => Math.max(0, p - 1))}
          disabled={pagina === 0}
          className="px-4 py-2 text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Anterior
        </button>
        <span className="text-xs font-bold text-gray-500">Página {pagina + 1}</span>
        <button
          onClick={() => setPagina(p => p + 1)}
          disabled={registros.length < POR_PAGINA}
          className="px-4 py-2 text-xs font-bold bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-200 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}

export default AdminBitacora
