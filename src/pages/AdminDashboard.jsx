import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { Search, UserPlus, Settings, Save, CheckCircle, X, ExternalLink, Pencil } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function AdminDashboard() {
  const navigate = useNavigate()
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('')
  const [listaSecciones, setListaSecciones] = useState([])
  const [fechaCorte, setFechaCorte] = useState('')
  const [fechaCorteOriginal, setFechaCorteOriginal] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos%20personal/`

  useEffect(() => {
    const fetchPersonal = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('personal').select('*').order('apellidos', { ascending: true })
      if (!error) {
        setPersonal(data)
        setListaSecciones([...new Set(data.map(p => p.seccion).filter(Boolean))].sort())
      }
      setLoading(false)
    }
    fetchPersonal()
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'onomastico_fecha_corte').single()
      if (data) { setFechaCorte(data.valor); setFechaCorteOriginal(data.valor) }
    }
    fetchConfig()
  }, [])

  const personalFiltrado = personal.filter(p => {
    const term = busqueda.toLowerCase()
    const nombreCompleto = `${p.nombres} ${p.apellidos}`.toLowerCase()
    const matchTexto = nombreCompleto.includes(term) || p.codigo.includes(term) || p.cargo.toLowerCase().includes(term)
    const matchSeccion = filtroSeccion ? p.seccion === filtroSeccion : true
    return matchTexto && matchSeccion
  })

  const limpiarFiltros = () => { setBusqueda(''); setFiltroSeccion('') }

  const guardarFechaCorte = async () => {
    if (!fechaCorte) return
    setGuardandoConfig(true)
    const { error } = await supabase.from('configuracion').update({ valor: fechaCorte, updated_at: new Date().toISOString() }).eq('clave', 'onomastico_fecha_corte')
    setGuardandoConfig(false)
    if (error) { Swal.fire('Error', error.message, 'error') }
    else {
      const adminUsuario = sessionStorage.getItem('admin_usuario') || 'admin'
      logBitacora({ usuario: adminUsuario, tipo_usuario: 'admin', accion: 'config', modulo: 'configuracion', descripcion: `Cambió fecha corte onomástico de ${fechaCorteOriginal} a ${fechaCorte}`, datos_anteriores: { fecha_corte: fechaCorteOriginal }, datos_nuevos: { fecha_corte: fechaCorte } })
      setFechaCorteOriginal(fechaCorte)
      Swal.fire({ title: '¡Actualizado!', text: `Fecha de corte cambiada a ${new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, icon: 'success', timer: 2000, showConfirmButton: false })
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-corporate-blue">Directorio de Personal</h2>
            <p className="text-sm text-gray-500 mt-1">Gestión de usuarios y asistencia</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showConfig ? 'bg-corporate-blue text-white border-corporate-blue' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Settings size={14} /> Configuración
            </button>
            <button
              onClick={() => navigate('/admin/nuevo-personal')}
              className="flex items-center gap-1.5 px-3 py-2 bg-corporate-green text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-95 transition-all border-none cursor-pointer"
            >
              <UserPlus size={14} /> Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={18} className="text-corporate-blue" />
            <h3 className="text-base font-bold text-gray-800">Configuración del Sistema</h3>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Fecha de corte para Onomástico</label>
            <p className="text-xs text-gray-500 mb-3">Solo el personal con fecha de ingreso <strong>igual o anterior</strong> a esta fecha será elegible.</p>
            <div className="flex flex-wrap items-center gap-3">
              <input type="date" value={fechaCorte} onChange={e => setFechaCorte(e.target.value)} style={{ colorScheme: 'light' }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" />
              {fechaCorte !== fechaCorteOriginal && (
                <button onClick={guardarFechaCorte} disabled={guardandoConfig} className="flex items-center gap-1.5 bg-corporate-green text-white px-4 py-2 rounded-xl text-xs font-bold border-none cursor-pointer hover:brightness-95 transition-all">
                  <Save size={14} /> {guardandoConfig ? 'Guardando...' : 'Guardar'}
                </button>
              )}
              {fechaCorte === fechaCorteOriginal && fechaCorte && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                  <CheckCircle size={14} /> Vigente: {new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex flex-col gap-1 flex-[2] min-w-0">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Buscar</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Nombre, código o cargo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" />
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Sección</label>
            <select value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all">
              <option value="">Todas</option>
              {listaSecciones.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {(busqueda || filtroSeccion) && (
            <button onClick={limpiarFiltros} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 cursor-pointer whitespace-nowrap">
              <X size={14} /> Limpiar
            </button>
          )}
          <span className="text-xs text-gray-400 whitespace-nowrap"><strong>{personalFiltrado.length}</strong> encontrados</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100 bg-white">
        <table className="w-full text-sm min-w-[550px]">
          <thead>
            <tr className="bg-corporate-blue text-white">
              <th className="py-3 px-4 text-left text-xs font-bold">Colaborador</th>
              <th className="py-3 px-4 text-left text-xs font-bold">Cargo / Sección</th>
              <th className="py-3 px-4 text-center text-xs font-bold w-36">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="3" className="text-center py-8 text-gray-400">Cargando directorio...</td></tr>
            ) : personalFiltrado.length === 0 ? (
              <tr><td colSpan="3" className="text-center py-8 text-gray-400">No se encontraron colaboradores.</td></tr>
            ) : personalFiltrado.map((p) => (
              <tr key={p.codigo} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.foto ? `${STORAGE_URL}${p.foto}` : ''}
                      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${p.nombres}+${p.apellidos}&background=random`}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                      alt=""
                    />
                    <div>
                      <div className="font-bold text-sm text-gray-800">{p.apellidos}, {p.nombres}</div>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{p.codigo}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-xs leading-relaxed">
                    <strong className="text-gray-600">{p.cargo}</strong><br />
                    <span className="text-indigo-500 text-[11px]">{p.seccion}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => navigate(`/admin/editar-personal/${p.codigo}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    <button
                      onClick={() => navigate(`/admin/registros/${p.codigo}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-600 hover:bg-indigo-500 hover:text-white rounded-lg text-[11px] font-semibold transition-all border border-gray-200 hover:border-transparent cursor-pointer"
                    >
                      Registros <ExternalLink size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard
