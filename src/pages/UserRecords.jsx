import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import { Info, Pencil, Trash2, FileSpreadsheet, FilterX, X } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function UserRecords() {
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
    const query1 = supabase.from('registro_horas').select('*').eq('codigo_trabajador', codigo)
    const query2 = supabase.from('nuevo_registro_horas').select('*').eq('codigo_trabajador', codigo)
    
    const [res1, res2] = await Promise.all([query1, query2])
    
    let combined = []
    if (!res1.error && res1.data) {
      combined = [...combined, ...res1.data.map(d => ({ ...d, _origen: 'solicitud' }))]
    }
    if (!res2.error && res2.data) {
      combined = [...combined, ...res2.data.map(d => ({ ...d, _origen: 'registro' }))]
    }

    if (desde) {
      const desdeDate = new Date(desde + 'T00:00:00').getTime()
      combined = combined.filter(d => new Date(d.fecha_hora_inicio).getTime() >= desdeDate)
    }
    if (hasta) {
      const hastaDate = new Date(hasta + 'T23:59:59').getTime()
      combined = combined.filter(d => new Date(d.fecha_hora_inicio).getTime() <= hastaDate)
    }

    // Sort by fecha_hora_inicio descending, fallback to id descending
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setRegistros(combined)
    setLoading(false)
  }

  useEffect(() => {
    const fetchTrabajador = async () => {
      const { data } = await supabase.from('personal').select('nombres, apellidos, foto, cargo').eq('codigo', codigo).single()
      if (data) setTrabajadorInfo(data)
    }

    fetchTrabajador()
  }, [codigo])

  useEffect(() => {
    fetchRegistros()
  }, [codigo, desde, hasta])

  const limpiarFechas = () => { setDesde(''); setHasta('') }

  // Balance
  const resumenHoras = useMemo(() => {
    let minutosFavor = 0, minutosContra = 0
    const tiposContra = ["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO", "COMPENSAR HORAS", "PERMISO PERSONAL"]
    const tiposFavor = ["POR TRASLADO DE VIAJE", "POR TRASLADO DE EQUIPOS", "SOBRETIEMPO"]
    
    registros.forEach(reg => {
      // ONLY calculate if the record is either _origen === 'registro' (unless Rechazado) OR (_origen === 'solicitud' && estado === 'Aprobado')
      if (reg.estado === 'Rechazado') return
      if (reg._origen === 'solicitud' && reg.estado !== 'Aprobado') return

      const minutos = (new Date(reg.fecha_hora_fin) - new Date(reg.fecha_hora_inicio)) / 60000
      
      if (tiposFavor.includes(reg.tipo_solicitud)) minutosFavor += minutos
      else if (tiposContra.includes(reg.tipo_solicitud)) minutosContra += minutos
    })
    return { favor: minutosFavor, contra: minutosContra, neto: minutosFavor - minutosContra }
  }, [registros])

  const resumenIdeal = useMemo(() => {
    let minutosFavor = 0, minutosContra = 0
    const tiposContra = ["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO", "COMPENSAR HORAS", "PERMISO PERSONAL"]
    const tiposFavor = ["POR TRASLADO DE VIAJE", "POR TRASLADO DE EQUIPOS", "SOBRETIEMPO"]

    registros.forEach(reg => {
      if (!reg?.fecha_hora_inicio || !reg?.fecha_hora_fin) return

      const minutos = (new Date(reg.fecha_hora_fin) - new Date(reg.fecha_hora_inicio)) / 60000

      if (tiposFavor.includes(reg.tipo_solicitud)) minutosFavor += minutos
      else if (tiposContra.includes(reg.tipo_solicitud)) minutosContra += minutos
    })

    return { favor: minutosFavor, contra: minutosContra, neto: minutosFavor - minutosContra }
  }, [registros])

  const getTipoCompensacionLabel = (tipo) => {
    if (tipo === 'ONOMÁSTICO') return 'ONOMÁSTICO'
    if (tipo === 'PERMISO PERSONAL') return 'DÍA A COMPENSAR'
    if (["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO"].includes(tipo)) return 'FAVOR DE CIPSA'
    if (["TRASLADO", "SOBRETIEMPO", "POR TRASLADO DE VIAJE", "POR TRASLADO DE EQUIPOS"].includes(tipo)) return 'FAVOR DEL TÉCNICO'
    return 'OTRO'
  }

  const fmt = (minutos) => {
    const h = Math.floor(Math.abs(minutos) / 60), m = Math.round(Math.abs(minutos) % 60)
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const calcularHorasFila = (reg) => {
    const diffMins = (new Date(reg.fecha_hora_fin) - new Date(reg.fecha_hora_inicio)) / 60000
    const texto = fmt(diffMins)
    const tiposContra = ["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO", "COMPENSAR HORAS", "PERMISO PERSONAL"]
    const tiposFavor = ["POR TRASLADO DE VIAJE", "POR TRASLADO DE EQUIPOS", "SOBRETIEMPO"]
    
    if (tiposFavor.includes(reg.tipo_solicitud)) return <span className="inline-block bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">+{texto}</span>
    if (tiposContra.includes(reg.tipo_solicitud)) return <span className="inline-block bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">-{texto}</span>
    return <span className="text-gray-500 text-xs">{texto}</span>
  }

  const eliminarRegistro = async (nro, origen = 'solicitud') => {
    const result = await Swal.fire({ title: '¿Eliminar?', text: "No se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar' })
    if (result.isConfirmed) {
      const dbTable = origen === 'registro' ? 'nuevo_registro_horas' : 'registro_horas'
      const reg = registros.find(r => r.nro_registro === nro && r._origen === origen)
      await supabase.from(dbTable).delete().eq('nro_registro', nro)
      const moduleId = origen === 'registro' ? 'nuevo_registro_horas' : 'registro_horas'
      logBitacora({ usuario: codigo, tipo_usuario: 'empleado', accion: 'eliminar', modulo: moduleId, descripcion: `Eliminó ${origen} #${nro} (${reg?.tipo_solicitud || ''})`, registro_id: String(nro), datos_anteriores: reg ? { tipo: reg.tipo_solicitud, estado: reg.estado || null, fecha: reg.fecha_solicitud || null } : null })
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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
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
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 border-l-4 border-l-corporate-blue">
          <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Saldo Ideal (si aprueban todo)</span>
          <div className={`text-2xl md:text-3xl font-black mt-1 ${resumenIdeal.neto >= 0 ? 'text-blue-600' : 'text-red-700'}`}>
            {resumenIdeal.neto >= 0 ? '+' : '-'}{fmt(resumenIdeal.neto)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
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
          <div className="hidden sm:block flex-1" />
          <button onClick={exportarExcel} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-corporate-green hover:brightness-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer whitespace-nowrap shadow-sm">
            <FileSpreadsheet size={16} /> Exportar
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {desde && hasta ? <span>Mostrando del <b>{new Date(desde+'T00:00:00').toLocaleDateString()}</b> al <b>{new Date(hasta+'T00:00:00').toLocaleDateString()}</b></span> : <span>Historial completo · {registros.length} registros</span>}
        </div>
        {(desde || hasta) && (
          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-600 font-medium">
            <span className="mt-px leading-none">⚠</span>
            <span>Los registros y el balance de horas corresponden únicamente al período de fechas seleccionado.</span>
          </div>
        )}
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
                  <td className="py-3 px-3 text-xs text-gray-700">
                    <div className="flex flex-col gap-1 items-start">
                      <span className="font-semibold">{reg.tipo_solicitud}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold tracking-wider">{getTipoCompensacionLabel(reg.tipo_solicitud)}</span>
                        {reg._origen === 'solicitud' ? (
                          <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Solicitud</span>
                        ) : (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Registro</span>
                        )}
                      </div>
                    </div>
                  </td>
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
                          <button onClick={() => navigate(reg._origen === 'registro' ? `/editar-nuevo-registro/${codigo}/${reg.nro_registro}` : `/editar-registro/${codigo}/${reg.nro_registro}`)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors border-none cursor-pointer" title="Editar">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => eliminarRegistro(reg.nro_registro, reg._origen)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors border-none cursor-pointer" title="Eliminar">
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-in border border-gray-100 border-t-4 border-t-corporate-green overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-dashed border-gray-200">
              <div>
                <h3 className="text-lg font-black text-corporate-blue flex items-center gap-2">
                  <span className="text-corporate-green text-xl">&#9432;</span>
                  Detalle del Registro
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">#{String(registroDetalle.nro_registro).padStart(6, '0')}</span>
                  {registroDetalle._origen === 'solicitud' ? (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Solicitud</span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Registro</span>
                  )}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusColor(registroDetalle.estado)}`}>{registroDetalle.estado}</span>
                </div>
              </div>
              <button onClick={() => setRegistroDetalle(null)} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400 border border-gray-200 bg-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Fotocheck */}
              {trabajadorInfo && (
                <div className="flex items-center justify-between gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={trabajadorInfo.foto ? `${STORAGE_URL}${trabajadorInfo.foto}` : ''}
                      alt="Perfil"
                      className="w-12 h-12 rounded-full object-cover border-3 border-white shadow-md"
                      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${trabajadorInfo.nombres}`}
                    />
                    <div>
                      <div className="text-sm font-extrabold text-corporate-blue">{trabajadorInfo.nombres.split(' ')[0]} {trabajadorInfo.apellidos.split(' ')[0]}</div>
                      <div className="text-xs text-gray-500">Código: <strong>{codigo}</strong> · {trabajadorInfo.cargo}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Tiempo</div>
                    <div className="mt-1">{calcularHorasFila(registroDetalle)}</div>
                  </div>
                </div>
              )}

              {/* Datos */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider">Tipo de Solicitud</div>
                    <div className="mt-1 text-sm font-semibold text-gray-800">{registroDetalle.tipo_solicitud}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider">Fecha Evento</div>
                    <div className="mt-1 text-sm text-gray-700">{new Date(registroDetalle.fecha_hora_inicio).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider">Requerimiento</div>
                    <div className="mt-1 text-sm text-gray-700">{registroDetalle.requerimiento || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider">Ingreso</div>
                    <div className="mt-1 text-sm text-gray-700">{new Date(registroDetalle.ingreso || registroDetalle.fecha_hora_inicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider">Salida</div>
                    <div className="mt-1 text-sm text-gray-700">{new Date(registroDetalle.salida || registroDetalle.fecha_hora_fin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider">Motivo</div>
                <div className="mt-2 text-sm bg-white p-3 rounded-xl border border-gray-200 text-gray-700">{registroDetalle.motivo || 'Sin detalles adicionales'}</div>
                <div className="mt-3 text-xs text-gray-400">
                  <span className="font-bold">Creado:</span> {new Date(registroDetalle.created_at).toLocaleString()}
                </div>
              </div>

              {/* Ubicación GPS */}
              {registroDetalle.latitud && registroDetalle.longitud && (
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider mb-1">Ubicación GPS (Marca APP)</div>
                    <div className="text-xs text-gray-600">
                      Lat: <span className="font-mono font-bold">{registroDetalle.latitud}</span> · Lng: <span className="font-mono font-bold">{registroDetalle.longitud}</span>
                    </div>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${registroDetalle.latitud},${registroDetalle.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-colors whitespace-nowrap"
                  >
                    📍 Ver en Maps
                  </a>
                </div>
              )}

              {/* Acciones */}
              {registroDetalle.estado === 'Pendiente' && (
                <div className="flex flex-col sm:flex-row gap-3 justify-end border-t border-gray-200 pt-4">
                  <button onClick={() => { setRegistroDetalle(null); navigate(registroDetalle._origen === 'registro' ? `/editar-nuevo-registro/${codigo}/${registroDetalle.nro_registro}` : `/editar-registro/${codigo}/${registroDetalle.nro_registro}`) }} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-amber-600 transition-colors">
                    <Pencil size={14} /> Editar
                  </button>
                  <button onClick={() => eliminarRegistro(registroDetalle.nro_registro, registroDetalle._origen)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-500 text-white text-sm font-bold rounded-xl border-none cursor-pointer hover:bg-red-600 transition-colors">
                    <Trash2 size={14} /> Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserRecords
