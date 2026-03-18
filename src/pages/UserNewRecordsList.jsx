import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import { Info, Pencil, Trash2, FileSpreadsheet, FilterX, X } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function UserNewRecordsList() {
  const { codigo } = useParams()
  const navigate = useNavigate()

  const [registros, setRegistros] = useState([])
  const [trabajadorInfo, setTrabajadorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [registroDetalle, setRegistroDetalle] = useState(null)

  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos personal/`

  const fetchRegistros = async () => {
    setLoading(true)
    let query = supabase.from('nuevo_registro_horas').select('*').eq('codigo_trabajador', codigo).order('id', { ascending: false })
    if (desde) query = query.gte('fecha_hora_inicio', desde)
    if (hasta) query = query.lte('fecha_hora_inicio', hasta + ' 23:59:59')
    const { data, error } = await query
    if (!error) setRegistros(data)
    setLoading(false)
  }

  useEffect(() => {
    const fetchTrabajador = async () => {
      const { data } = await supabase.from('personal').select('nombres, apellidos, foto, cargo').eq('codigo', codigo).single()
      if (data) setTrabajadorInfo(data)
    }
    fetchTrabajador()
    fetchRegistros()
  }, [codigo, desde, hasta])

  const limpiarFechas = () => { setDesde(''); setHasta('') }

  // Balance
  const resumenHoras = useMemo(() => {
    let minutosFavor = 0, minutosContra = 0
    const tiposFavor = ["COMPENSACIÓN POR TRASLADO DE VIAJE", "COMPENSACIÓN POR TRASLADO DE VIAJE - CONDUCTOR", "COMPENSACIÓN POR TRASLADO DE VIAJE - COPILOTO", "COMPENSACIÓN POR TRASLADO DE EQUIPOS", "SOBRETIEMPO EN CLIENTE", "SOBRETIEMPO EN SERTEC", "SOBRETIEMPO POR TRASLADO DE VIAJE"]
    const tiposContra = ["COMPENSACIÓN A FAVOR DE SERTEC", "POR SALIDAS ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO"]
    registros.forEach(reg => {
      if (reg.estado === 'Rechazado') return
      const minutos = (new Date(reg.fecha_hora_fin) - new Date(reg.fecha_hora_inicio)) / 60000
      if (tiposFavor.includes(reg.tipo_solicitud)) minutosFavor += minutos
      else if (tiposContra.includes(reg.tipo_solicitud)) minutosContra += minutos
    })
    return { favor: minutosFavor, contra: minutosContra, neto: minutosFavor - minutosContra }
  }, [registros])

  const fmt = (minutos) => {
    const h = Math.floor(Math.abs(minutos) / 60), m = Math.round(Math.abs(minutos) % 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const calcularHorasFila = (reg) => {
    const diffMins = (new Date(reg.fecha_hora_fin) - new Date(reg.fecha_hora_inicio)) / 60000
    const texto = fmt(diffMins)
    const tiposFavor = ["COMPENSACIÓN POR TRASLADO DE VIAJE", "COMPENSACIÓN POR TRASLADO DE VIAJE - CONDUCTOR", "COMPENSACIÓN POR TRASLADO DE VIAJE - COPILOTO", "COMPENSACIÓN POR TRASLADO DE EQUIPOS", "SOBRETIEMPO EN CLIENTE", "SOBRETIEMPO EN SERTEC", "SOBRETIEMPO POR TRASLADO DE VIAJE"]
    const tiposContra = ["COMPENSACIÓN A FAVOR DE SERTEC", "POR SALIDAS ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO"]
    if (tiposFavor.includes(reg.tipo_solicitud)) return <span className="inline-block bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">+{texto}</span>
    if (tiposContra.includes(reg.tipo_solicitud)) return <span className="inline-block bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">-{texto}</span>
    return <span className="text-gray-500 text-xs">{texto}</span>
  }

  const eliminarRegistro = async (nro) => {
    const result = await Swal.fire({ title: '¿Eliminar?', text: "No se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar' })
    if (result.isConfirmed) {
      const reg = registros.find(r => r.nro_registro === nro)
      await supabase.from('nuevo_registro_horas').delete().eq('nro_registro', nro)
      logBitacora({ usuario: codigo, tipo_usuario: 'empleado', accion: 'eliminar', modulo: 'nuevo_registro_horas', descripcion: `Eliminó solicitud #${nro} (${reg?.tipo_solicitud || ''})`, registro_id: String(nro), datos_anteriores: reg ? { tipo: reg.tipo_solicitud, estado: reg.estado, fecha: reg.fecha_solicitud } : null })
      Swal.fire('Eliminado', '', 'success')
      setRegistroDetalle(null)
      fetchRegistros()
    }
  }

  const exportarExcel = () => {
    const d = registros.map(r => ({ Nro: r.nro_registro, Fecha_Evento: new Date(r.fecha_hora_inicio).toLocaleDateString(), Hora_Registro: new Date(r.created_at).toLocaleString(), Solicitud: r.tipo_solicitud, Requerimiento: r.requerimiento, Estado: r.estado, Detalle: r.motivo }))
    const ws = XLSX.utils.json_to_sheet(d); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Historial"); XLSX.writeFile(wb, `Reporte_${codigo}.xlsx`)
  }

  const statusColor = (estado) => {
    if (estado === 'Aprobado') return 'bg-green-50 text-green-700'
    if (estado === 'Rechazado') return 'bg-red-50 text-red-700'
    return 'bg-amber-50 text-amber-700'
  }

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          {trabajadorInfo && (
            <>
              <img
                src={trabajadorInfo.foto ? `${STORAGE_URL}${trabajadorInfo.foto}` : ''}
                alt="Perfil"
                className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md"
                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${trabajadorInfo.nombres}`}
              />
              <div>
                <h2 className="text-lg md:text-xl font-black text-corporate-blue">{trabajadorInfo.nombres.split(' ')[0]} {trabajadorInfo.apellidos.split(' ')[0]}</h2>
                <p className="text-sm text-gray-500">Código: <strong>{codigo}</strong> · {trabajadorInfo.cargo}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-green-500">
          <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">A favor (+)</span>
          <div className="text-2xl md:text-3xl font-black text-green-700 mt-1">+{fmt(resumenHoras.favor)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-red-500">
          <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Por compensar (-)</span>
          <div className="text-2xl md:text-3xl font-black text-red-700 mt-1">-{fmt(resumenHoras.contra)}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-blue-500">
          <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Saldo Total (=)</span>
          <div className={`text-2xl md:text-3xl font-black mt-1 ${resumenHoras.neto >= 0 ? 'text-blue-600' : 'text-red-700'}`}>
            {resumenHoras.neto >= 0 ? '+' : '-'}{fmt(resumenHoras.neto)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} style={{ colorScheme: 'light' }} className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} style={{ colorScheme: 'light' }} className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" />
            </div>
            {(desde || hasta) && (
              <button onClick={limpiarFechas} className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 cursor-pointer self-end whitespace-nowrap">
                <FilterX size={14} /> Limpiar
              </button>
            )}
          </div>
          <div className="flex-1" />
          <button onClick={exportarExcel} className="flex items-center gap-2 bg-corporate-green hover:brightness-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap shadow-sm">
            <FileSpreadsheet size={16} /> Exportar
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {desde && hasta ? <span>Mostrando del <b>{new Date(desde+'T00:00:00').toLocaleDateString()}</b> al <b>{new Date(hasta+'T00:00:00').toLocaleDateString()}</b></span> : <span>Historial completo · {registros.length} registros</span>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : registros.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">No hay registros encontrados.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100 bg-white">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-corporate-blue text-white">
                <th className="py-3 px-3 text-center text-xs font-bold">Nro</th>
                <th className="py-3 px-3 text-left text-xs font-bold">Fecha</th>
                <th className="py-3 px-3 text-left text-xs font-bold">Registro</th>
                <th className="py-3 px-3 text-left text-xs font-bold">Solicitud</th>
                <th className="py-3 px-3 text-center text-xs font-bold">Horas</th>
                <th className="py-3 px-3 text-left text-xs font-bold">Req.</th>
                <th className="py-3 px-3 text-center text-xs font-bold">Estado</th>
                <th className="py-3 px-3 text-center text-xs font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {registros.map((reg) => (
                <tr key={reg.id} className={`hover:bg-gray-50/50 transition-colors ${reg.estado === 'Rechazado' ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-3 text-center font-mono text-xs text-gray-500">{String(reg.nro_registro).padStart(6, '0')}</td>
                  <td className="py-3 px-3 text-gray-700">{new Date(reg.fecha_hora_inicio).toLocaleDateString()}</td>
                  <td className="py-3 px-3 text-xs text-gray-400">{new Date(reg.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-3 px-3 text-xs text-gray-700">{reg.tipo_solicitud}</td>
                  <td className="py-3 px-3 text-center">{calcularHorasFila(reg)}</td>
                  <td className="py-3 px-3 text-xs text-gray-500">{reg.requerimiento || '-'}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${statusColor(reg.estado)}`}>
                      {reg.estado || 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1.5 justify-center">
                      <button onClick={() => setRegistroDetalle(reg)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors border-none cursor-pointer" title="Ver detalle">
                        <Info size={15} />
                      </button>
                      {reg.estado === 'Pendiente' && (
                        <>
                          <button onClick={() => navigate(`/editar-nuevo-registro/${codigo}/${reg.nro_registro}`)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors border-none cursor-pointer" title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => eliminarRegistro(reg.nro_registro)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border-none cursor-pointer" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail modal */}
      {registroDetalle && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setRegistroDetalle(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-in p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h3 className="text-lg font-bold text-gray-800">Detalle del Registro</h3>
              <button onClick={() => setRegistroDetalle(null)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 border-none bg-transparent cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><span className="text-[10px] font-bold uppercase text-gray-400">Nro Registro</span><p className="font-mono text-base font-bold text-gray-800">{String(registroDetalle.nro_registro).padStart(6, '0')}</p></div>
              <div><span className="text-[10px] font-bold uppercase text-gray-400">Estado</span><p className={`inline-block mt-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${statusColor(registroDetalle.estado)}`}>{registroDetalle.estado}</p></div>
              <div className="col-span-2"><span className="text-[10px] font-bold uppercase text-gray-400">Tipo de Solicitud</span><p className="text-sm font-medium text-gray-800">{registroDetalle.tipo_solicitud}</p></div>
              <div><span className="text-[10px] font-bold uppercase text-gray-400">Fecha Evento</span><p className="text-sm text-gray-700">{new Date(registroDetalle.fecha_hora_inicio).toLocaleDateString()}</p></div>
              <div><span className="text-[10px] font-bold uppercase text-gray-400">Requerimiento</span><p className="text-sm text-gray-700">{registroDetalle.requerimiento || 'N/A'}</p></div>
              <div><span className="text-[10px] font-bold uppercase text-gray-400">Ingreso</span><p className="text-sm text-gray-700">{new Date(registroDetalle.ingreso || registroDetalle.fecha_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
              <div><span className="text-[10px] font-bold uppercase text-gray-400">Salida</span><p className="text-sm text-gray-700">{new Date(registroDetalle.salida || registroDetalle.fecha_hora_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div>
              <div className="col-span-2"><span className="text-[10px] font-bold uppercase text-gray-400">Tiempo Calculado</span><p className="mt-1">{calcularHorasFila(registroDetalle)}</p></div>
              <div className="col-span-2"><span className="text-[10px] font-bold uppercase text-gray-400">Motivo</span><p className="text-sm bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-gray-700">{registroDetalle.motivo || 'Sin detalles adicionales'}</p></div>
              <div className="col-span-2"><span className="text-[10px] font-bold uppercase text-gray-400">Creado el</span><p className="text-xs text-gray-400">{new Date(registroDetalle.created_at).toLocaleString()}</p></div>
            </div>
            {registroDetalle.estado === 'Pendiente' && (
              <div className="mt-5 flex gap-3 justify-end border-t border-gray-200 pt-4">
                <button onClick={() => { setRegistroDetalle(null); navigate(`/editar-nuevo-registro/${codigo}/${registroDetalle.nro_registro}`) }} className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-amber-600 transition-colors">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={() => eliminarRegistro(registroDetalle.nro_registro)} className="flex items-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-red-600 transition-colors">
                  <Trash2 size={14} /> Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default UserNewRecordsList


