import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import { ChevronDown, FileSpreadsheet, FilterX, Info, Pencil, Trash2, X } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function AdminUserRecords() {
  const { codigo } = useParams()

  const [registros, setRegistros] = useState([])
  const [trabajadorInfo, setTrabajadorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [registroDetalle, setRegistroDetalle] = useState(null)
  const [estadoMenu, setEstadoMenu] = useState(null)
  const estadoMenuRef = useRef(null)

  const ESTADOS = ['Pendiente', 'Aprobado', 'Rechazado', 'Observado']

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

    combined.sort((a, b) => new Date(b.fecha_hora_inicio).getTime() - new Date(a.fecha_hora_inicio).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    setRegistros(combined)
    setLoading(false)
  }

  useEffect(() => {
    const fetchTrabajador = async () => {
      const { data } = await supabase.from('personal').select('*').eq('codigo', codigo).single()
      if (data) setTrabajadorInfo(data)
    }

    fetchTrabajador()
  }, [codigo])

  useEffect(() => {
    fetchRegistros()
  }, [codigo, desde, hasta])

  const limpiarFechas = () => { setDesde(''); setHasta('') }

  const handleEstadoChange = async (reg, nuevoEstado) => {
    if (nuevoEstado === 'Rechazado') {
      const confirm = await Swal.fire({ title: '¿Rechazar?', text: "Se marcará como rechazado.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, rechazar' })
      if (!confirm.isConfirmed) return
    }
    const dbTable = reg?._origen === 'registro' ? 'nuevo_registro_horas' : 'registro_horas'
    const moduleId = dbTable
    const { error } = await supabase.from(dbTable).update({ estado: nuevoEstado }).eq('id', reg.id)
    if (!error) {
      setRegistros(registros.map(r => (r._origen === reg._origen && r.id === reg.id) ? { ...r, estado: nuevoEstado } : r))
      if (registroDetalle && registroDetalle._origen === reg._origen && registroDetalle.id === reg.id) setRegistroDetalle({ ...registroDetalle, estado: nuevoEstado })
      const adminUsuario = sessionStorage.getItem('admin_usuario') || 'admin'
      logBitacora({
        usuario: adminUsuario,
        tipo_usuario: 'admin',
        accion: nuevoEstado === 'Aprobado' ? 'aprobar' : nuevoEstado === 'Rechazado' ? 'rechazar' : 'editar',
        modulo: moduleId,
        descripcion: `${nuevoEstado === 'Aprobado' ? 'Aprobó' : nuevoEstado === 'Rechazado' ? 'Rechazó' : nuevoEstado === 'Observado' ? 'Marcó como observado' : 'Cambió estado de'} ${reg?._origen === 'registro' ? 'registro' : 'solicitud'} de ${codigo} (${reg?.tipo_solicitud || ''})`,
        registro_id: String(reg?.nro_registro ?? reg?.id),
        datos_anteriores: { estado: reg?.estado },
        datos_nuevos: { estado: nuevoEstado }
      })
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
      Toast.fire({ icon: 'success', title: `Estado: ${nuevoEstado}` })
    }
  }

  const openEstadoMenu = (reg, buttonEl) => {
    const key = `${reg._origen}-${reg.id}`
    if (estadoMenu?.key === key) {
      setEstadoMenu(null)
      return
    }

    const rect = buttonEl.getBoundingClientRect()
    const gutter = 8
    const initialLeft = Math.max(gutter, Math.min(rect.right - 176, window.innerWidth - 176 - gutter))
    const initialTop = Math.min(window.innerHeight - gutter, rect.bottom + gutter)

    setEstadoMenu({
      key,
      reg,
      left: initialLeft,
      top: initialTop,
      anchor: { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom },
    })
  }

  useLayoutEffect(() => {
    if (!estadoMenu || !estadoMenuRef.current) return

    const gutter = 8
    const menuEl = estadoMenuRef.current
    const menuWidth = menuEl.offsetWidth || 176
    const menuHeight = menuEl.offsetHeight || 0
    const a = estadoMenu.anchor
    if (!a) return

    let left = Math.max(gutter, Math.min(a.right - menuWidth, window.innerWidth - menuWidth - gutter))
    let top = a.bottom + gutter

    if (menuHeight && top + menuHeight > window.innerHeight - gutter) {
      top = a.top - menuHeight - gutter
    }
    if (menuHeight && top < gutter) {
      top = gutter
    }

    setEstadoMenu((prev) => {
      if (!prev) return prev
      if (prev.left === left && prev.top === top) return prev
      return { ...prev, left, top }
    })
  }, [estadoMenu?.key])

  const resumenHoras = useMemo(() => {
    let minutosFavor = 0, minutosContra = 0
    const tiposContra = ["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO", "COMPENSAR HORAS"]
    const tiposFavor = ["POR TRASLADO DE VIAJE", "POR TRASLADO DE EQUIPOS", "SOBRETIEMPO"]
    registros.forEach(reg => {
      // Misma regla que en vista usuario:
      // - Nunca sumar si está Rechazado
      // - Si es solicitud, solo sumar si está Aprobado
      if (reg.estado === 'Rechazado') return
      if (reg._origen === 'solicitud' && reg.estado !== 'Aprobado') return
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
    const tiposContra = ["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO", "COMPENSAR HORAS"]
    const tiposFavor = ["POR TRASLADO DE VIAJE", "POR TRASLADO DE EQUIPOS", "SOBRETIEMPO"]

    if (tiposFavor.includes(reg.tipo_solicitud)) return <span className="inline-block bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">+{texto}</span>
    if (tiposContra.includes(reg.tipo_solicitud)) return <span className="inline-block bg-red-50 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">-{texto}</span>
    return <span className="text-gray-500 text-xs">{texto}</span>
  }

  const exportarExcel = () => {
    const d = registros.map(r => ({
      Nro: r.nro_registro,
      Fecha_Evento: new Date(r.fecha_hora_inicio).toLocaleDateString(),
      Hora_Registro: new Date(r.created_at).toLocaleString(),
      Tipo: r._origen === 'registro' ? 'Registro' : 'Solicitud',
      Solicitud: r.tipo_solicitud,
      Requerimiento: r.requerimiento,
      Estado: r.estado,
      Detalle: r.motivo
    }))
    const ws = XLSX.utils.json_to_sheet(d); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Reporte"); XLSX.writeFile(wb, `Reporte_Admin_${codigo}.xlsx`)
  }

  const statusColor = (e) => {
    if (e === 'Aprobado') return 'bg-green-50 text-green-700'
    if (e === 'Rechazado') return 'bg-red-50 text-red-700'
    if (e === 'Observado') return 'bg-sky-50 text-sky-700'
    return 'bg-amber-50 text-amber-700'
  }

  const statusSelectCls = (e) => {
    if (e === 'Aprobado') return 'bg-green-50 text-green-700 border-green-300'
    if (e === 'Rechazado') return 'bg-red-50 text-red-700 border-red-300'
    if (e === 'Observado') return 'bg-sky-50 text-sky-700 border-sky-300'
    return 'bg-amber-50 text-amber-700 border-amber-300'
  }

  return (
    <div className="space-y-5">
      {/* Profile header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          {trabajadorInfo && (
            <>
              <img src={trabajadorInfo.foto ? `${STORAGE_URL}${trabajadorInfo.foto}` : ''} alt="Perfil" className="w-14 h-14 rounded-full object-cover border-3 border-white shadow-md" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${trabajadorInfo.nombres}`} />
              <div>
                <h2 className="text-lg md:text-xl font-black text-corporate-blue">{trabajadorInfo.nombres} {trabajadorInfo.apellidos}</h2>
                <p className="text-sm text-gray-500">Código: <strong>{codigo}</strong> · {trabajadorInfo.cargo}</p>
                <span className="inline-block mt-1 text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold uppercase">Vista de Admin</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Balance */}
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
          <div className={`text-2xl md:text-3xl font-black mt-1 ${resumenHoras.neto >= 0 ? 'text-blue-600' : 'text-red-700'}`}>{resumenHoras.neto >= 0 ? '+' : '-'}{fmt(resumenHoras.neto)}</div>
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
          {desde && hasta ? <span>Mostrando del <b>{new Date(desde + 'T00:00:00').toLocaleDateString()}</b> al <b>{new Date(hasta + 'T00:00:00').toLocaleDateString()}</b></span> : <span>Historial completo · {registros.length} registros</span>}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Cargando...</div>
      ) : registros.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">No hay registros.</div>
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
                <tr key={`${reg._origen}-${reg.id}`} className={`hover:bg-gray-50/50 transition-colors ${reg.estado === 'Rechazado' ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-3 text-center font-mono text-xs text-gray-500">{String(reg.nro_registro).padStart(6, '0')}</td>
                  <td className="py-3 px-3 text-gray-700">{new Date(reg.fecha_hora_inicio).toLocaleDateString()}</td>
                  <td className="py-3 px-3 text-xs text-gray-400">{new Date(reg.created_at).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-3 px-3 text-xs text-gray-700">
                    <div className="flex flex-col gap-1 items-start">
                      <span>{reg.tipo_solicitud}</span>
                      {reg._origen === 'solicitud' ? (
                        <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Solicitud</span>
                      ) : (
                        <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Registro</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">{calcularHorasFila(reg)}</td>
                  <td className="py-3 px-3 text-xs text-gray-500">{reg.requerimiento || '-'}</td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEstadoMenu(reg, e.currentTarget)
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border border-gray-200 ${statusColor(reg.estado || 'Pendiente')}`}
                      title="Cambiar estado"
                    >
                      <span>{reg.estado || 'Pendiente'}</span>
                      <ChevronDown size={14} />
                    </button>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1.5 justify-center">
                      <button onClick={() => setRegistroDetalle(reg)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-50 text-sky-600 hover:bg-sky-100 transition-colors border-none cursor-pointer" title="Ver detalle">
                        <Info size={15} />
                      </button>

                      {reg.estado === 'Pendiente' && (
                        <>
                          <button
                            type="button"
                            disabled
                            title="Solo el usuario puede editar"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors border-none opacity-40 cursor-not-allowed"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            disabled
                            title="Solo el usuario puede eliminar"
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 transition-colors border-none opacity-40 cursor-not-allowed"
                          >
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

      {/* Estado dropdown (fixed overlay to avoid clipping in scroll containers) */}
      {estadoMenu && (
        <div
          className="fixed inset-0 z-[1500]"
          onClick={() => setEstadoMenu(null)}
        >
          <div
            className="fixed rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden"
            style={{ left: estadoMenu.left, top: estadoMenu.top, width: 176 }}
            ref={estadoMenuRef}
            onClick={(e) => e.stopPropagation()}
          >
            {ESTADOS.map((estado) => {
              const currentEstado = estadoMenu.reg?.estado || 'Pendiente'
              const seleccionado = currentEstado === estado
              return (
                <button
                  key={estado}
                  type="button"
                  disabled={seleccionado}
                  onClick={async () => {
                    const reg = estadoMenu.reg
                    setEstadoMenu(null)
                    if (!reg || seleccionado) return
                    await handleEstadoChange(reg, estado)
                  }}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-gray-50 ${seleccionado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${statusColor(estado)}`}>{estado}</span>
                  {seleccionado && <span className="text-[10px] font-bold text-gray-400">Actual</span>}
                </button>
              )
            })}
          </div>
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
                  Detalle (Admin)
                </h3>
                <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">#{String(registroDetalle.nro_registro).padStart(6, '0')}</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusColor(registroDetalle.estado)}`}>{registroDetalle.estado}</span>
                  {registroDetalle._origen === 'solicitud' ? (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">Solicitud</span>
                  ) : (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider">Registro</span>
                  )}
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
                      <div className="text-sm font-extrabold text-corporate-blue">{trabajadorInfo.nombres} {trabajadorInfo.apellidos}</div>
                      <div className="text-xs text-gray-500">Código: <strong>{codigo}</strong> · {trabajadorInfo.cargo}</div>
                      <span className="inline-block mt-1 text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-bold uppercase">Vista de Admin</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Estado</div>
                    <select className={`mt-1 px-3 py-2 rounded-xl text-sm font-bold border outline-none cursor-pointer ${statusSelectCls(registroDetalle.estado)}`} value={registroDetalle.estado} onChange={(e) => handleEstadoChange(registroDetalle, e.target.value)}>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Aprobado">Aprobado</option>
                      <option value="Rechazado">Rechazado</option>
                      <option value="Observado">Observado</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Datos */}
              <div className="bg-white border border-gray-100 rounded-2xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider">Solicitud</div>
                    <div className="mt-1 text-sm font-semibold text-gray-800">{registroDetalle.tipo_solicitud}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-extrabold text-corporate-blue uppercase tracking-wider">Fecha</div>
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
                <div className="mt-2 text-sm bg-white p-3 rounded-xl border border-gray-200 text-gray-700">{registroDetalle.motivo || 'Sin detalles'}</div>
                <div className="mt-3 text-xs text-gray-400">
                  <span className="font-bold">Creado:</span> {new Date(registroDetalle.created_at).toLocaleString()}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t border-gray-200 pt-4">
                <button onClick={() => setRegistroDetalle(null)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer transition-colors">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUserRecords
