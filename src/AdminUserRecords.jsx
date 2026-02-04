import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import './App.css'

function AdminUserRecords() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  
  // ESTADOS (Vacíos por defecto)
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
      let query = supabase.from('registro_horas').select('*').eq('codigo_trabajador', codigo).order('id', { ascending: false })
      if (desde) query = query.gte('fecha_hora_inicio', desde)
      if (hasta) query = query.lte('fecha_hora_inicio', hasta + ' 23:59:59')
      const { data, error } = await query
      if (!error) setRegistros(data)
      setLoading(false)
  }

  useEffect(() => {
    const fetchTrabajador = async () => {
        const { data } = await supabase.from('personal').select('*').eq('codigo', codigo).single()
        if (data) setTrabajadorInfo(data)
    }
    fetchTrabajador()
    fetchRegistros()
  }, [codigo, desde, hasta])

  // --- FUNCIÓN NUEVA: LIMPIAR ---
  const limpiarFechas = () => {
      setDesde('')
      setHasta('')
  }

  const handleEstadoChange = async (id, nuevoEstado) => {
    if (nuevoEstado === 'Rechazado') {
        const confirm = await Swal.fire({ title: '¿Rechazar?', text: "Se marcará como rechazado.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, rechazar' })
        if (!confirm.isConfirmed) return 
    }
    const { error } = await supabase.from('registro_horas').update({ estado: nuevoEstado }).eq('id', id)
    if (!error) {
        const nuevosRegistros = registros.map(r => r.id === id ? { ...r, estado: nuevoEstado } : r)
        setRegistros(nuevosRegistros)
        if (registroDetalle && registroDetalle.id === id) {
            setRegistroDetalle({ ...registroDetalle, estado: nuevoEstado })
        }
        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
        Toast.fire({ icon: 'success', title: `Estado: ${nuevoEstado}` })
    }
  }

  // BALANCE
  const resumenHoras = useMemo(() => {
      let minutosFavor = 0, minutosContra = 0
      registros.forEach(reg => {
          if (reg.estado === 'Rechazado') return
          const inicio = new Date(reg.fecha_hora_inicio); const fin = new Date(reg.fecha_hora_fin); const minutos = (fin - inicio) / (1000 * 60) 
          switch (reg.tipo_solicitud) {
              case "COMPENSACIÓN POR TRASLADO DE VIAJE": case "SOBRETIEMPO EN CLIENTE": case "SOBRETIEMPO EN CIPSA": minutosFavor += minutos; break;
              case "COMPENSACIÓN A FAVOR DE CIPSA": case "POR SALIDAS ANTES DE HORARIO": minutosContra += minutos; break;
          }
      })
      return { favor: minutosFavor, contra: minutosContra, neto: minutosFavor - minutosContra }
  }, [registros])
  
  const formatearSimple = (minutos) => {
      const horas = Math.floor(Math.abs(minutos) / 60); const mins = Math.round(Math.abs(minutos) % 60);
      return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // --- NUEVA LÓGICA PARA MOSTRAR EL TIEMPO EN CADA FILA ---
  const calcularHorasFila = (reg) => {
      const inicio = new Date(reg.fecha_hora_inicio)
      const fin = new Date(reg.fecha_hora_fin)
      const diffMins = (fin - inicio) / 60000 // Diferencia en minutos
      
      const horas = Math.floor(Math.abs(diffMins) / 60)
      const mins = Math.round(Math.abs(diffMins) % 60)
      const texto = `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`

      // Lógica de colores según tipo
      const tiposFavor = ["COMPENSACIÓN POR TRASLADO DE VIAJE", "SOBRETIEMPO EN CLIENTE", "SOBRETIEMPO EN CIPSA"]
      const tiposContra = ["COMPENSACIÓN A FAVOR DE CIPSA", "POR SALIDAS ANTES DE HORARIO"]

      if (tiposFavor.includes(reg.tipo_solicitud)) {
          return <span style={{backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px'}}>+{texto}</span>
      } else if (tiposContra.includes(reg.tipo_solicitud)) {
          return <span style={{backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '11px'}}>-{texto}</span>
      } else {
          return <span style={{color: '#64748b', fontSize: '11px'}}>{texto}</span>
      }
  }

  const exportarExcel = () => {
      const dataFormateada = registros.map(reg => ({ Nro: reg.nro_registro, Fecha_Evento: new Date(reg.fecha_hora_inicio).toLocaleDateString(), Hora_Registro: new Date(reg.created_at).toLocaleString(), Solicitud: reg.tipo_solicitud, Requerimiento: reg.requerimiento, Estado: reg.estado, Detalle: reg.motivo }))
      const worksheet = XLSX.utils.json_to_sheet(dataFormateada); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte"); XLSX.writeFile(workbook, `Reporte_Admin_${codigo}.xlsx`)
  }

  return (
    <div className="container container-wide">
      <div className="header-profile-bar">
        <div className="profile-section">
          {trabajadorInfo && (
            <>
              <img src={trabajadorInfo.foto ? `${STORAGE_URL}${trabajadorInfo.foto}` : ''} alt="Perfil" className="avatar-large" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${trabajadorInfo.nombres}`} />
              <div><h2 className="profile-name">{trabajadorInfo.nombres} {trabajadorInfo.apellidos}</h2><p className="profile-meta">Código: <strong>{codigo}</strong> | {trabajadorInfo.cargo}</p><span className="badge-table" style={{background: '#e0f2fe', color: '#0369a1', marginTop:'5px'}}>VISTA DE ADMIN</span></div>
            </>
          )}
        </div>
        <button onClick={() => navigate('/admin-panel')} className="btn-back">⬅ Volver al Directorio</button>
      </div>

      <div className="balance-grid">
        <div className="balance-card card-green"><span className="balance-label">A favor (+)</span><div className="balance-amount text-green">+{formatearSimple(resumenHoras.favor)}</div></div>
        <div className="balance-card card-red"><span className="balance-label">Por compensar (-)</span><div className="balance-amount text-red">-{formatearSimple(resumenHoras.contra)}</div></div>
        <div className="balance-card card-blue"><span className="balance-label">Saldo Total (=)</span><div className={`balance-amount ${resumenHoras.neto >= 0 ? 'text-blue' : 'text-red'}`}>{resumenHoras.neto >= 0 ? '+' : '-'}{formatearSimple(resumenHoras.neto)}</div></div>
      </div>

      <div className="filters-bar">
        <div className="filters-inputs">
            <div className="filter-group"><label>Desde:</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input-filter"/></div>
            <div className="filter-group"><label>Hasta:</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input-filter"/></div>
            
            {/* BOTÓN LIMPIAR */}
            {(desde || hasta) && (
                <button onClick={limpiarFechas} className="btn-clear" style={{marginTop: '22px'}} title="Borrar filtros">
                    🧹 Ver Todo
                </button>
            )}

            <div style={{alignSelf: 'center', fontSize: '12px', color: '#64748b', marginLeft: '10px', marginTop: '10px'}}>
                {desde && hasta ? <span>📅 Del <b>{new Date(desde+'T00:00:00').toLocaleDateString()}</b> al <b>{new Date(hasta+'T00:00:00').toLocaleDateString()}</b></span> : <span>🗂️ Historial Completo</span>}
            </div>
        </div>
        <button onClick={exportarExcel} className="btn-excel">📊 Excel</button>
      </div>

      {loading ? <p style={{textAlign: 'center'}}>Cargando...</p> : registros.length === 0 ? 
        <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}><p>No hay registros.</p></div> : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{textAlign:'center'}}>Nro</th>
                <th>Fecha Evento</th>
                <th>Hora Registro</th>
                <th>Solicitud</th>
                <th>Horas</th> {/* <--- NUEVA COLUMNA */}
                <th>Requerimiento</th>
                <th>Estado (Acción)</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
                {registros.map((reg) => (
                    <tr key={reg.id} style={{background: reg.estado === 'Rechazado' ? '#fff1f2' : 'white'}}>
                    <td className="col-id" style={{fontFamily: 'monospace', fontSize: '12px'}}>{String(reg.nro_registro).padStart(6, '0')}</td>
                    <td data-label="Fecha Evento">{new Date(reg.fecha_hora_inicio).toLocaleDateString()}</td>
                    <td data-label="Hora Registro" style={{fontSize:'11px', color:'#64748b'}}>{new Date(reg.created_at).toLocaleString([], {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}</td>
                    <td data-label="Solicitud"><span className="badge-table">{reg.tipo_solicitud}</span></td>
                    
                    {/* <--- NUEVA COLUMNA EN EL BODY */}
                    <td data-label="Horas">
                        {calcularHorasFila(reg)}
                    </td>

                    <td data-label="Requerimiento" style={{fontSize:'12px'}}>{reg.requerimiento || '-'}</td>
                    <td data-label="Estado">
                        <select className={`select-status ${reg.estado === 'Aprobado' ? 'bg-aprobado' : reg.estado === 'Rechazado' ? 'bg-rechazado' : 'bg-pendiente'}`} value={reg.estado || 'Pendiente'} onChange={(e) => handleEstadoChange(reg.id, e.target.value)}>
                            <option value="Pendiente">⏳ Pendiente</option>
                            <option value="Aprobado">✅ Aprobado</option>
                            <option value="Rechazado">❌ Rechazado</option>
                        </select>
                    </td>
                    <td data-label="Detalle" style={{textAlign:'center'}}>
                        <button onClick={() => setRegistroDetalle(reg)} className="btn-icon info" title="Ver detalle">ⓘ</button>
                    </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {registroDetalle && (
        <div className="modal-overlay" onClick={() => setRegistroDetalle(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header"><h3>Detalle del Registro (Admin)</h3><button className="close-modal" onClick={() => setRegistroDetalle(null)}>×</button></div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                    <div className="detail-row"><span className="detail-label">Nro Registro</span><span className="detail-value" style={{fontFamily: 'monospace', fontSize: '16px'}}>{String(registroDetalle.nro_registro).padStart(6, '0')}</span></div>
                    <div className="detail-row"><span className="detail-label">Estado</span>
                        <select className="input" style={{padding: '5px', fontSize: '14px', marginTop: '0', borderColor: '#cbd5e1'}} value={registroDetalle.estado} onChange={(e) => handleEstadoChange(registroDetalle.id, e.target.value)}>
                             <option value="Pendiente">⏳ Pendiente</option><option value="Aprobado">✅ Aprobado</option><option value="Rechazado">❌ Rechazado</option>
                        </select>
                    </div>
                    <div className="detail-row span-2"><span className="detail-label">Tipo de Solicitud</span><span className="detail-value">{registroDetalle.tipo_solicitud}</span></div>
                    <div className="detail-row"><span className="detail-label">Fecha Evento</span><span className="detail-value">{new Date(registroDetalle.fecha_hora_inicio).toLocaleDateString()}</span></div>
                    <div className="detail-row"><span className="detail-label">Requerimiento</span><span className="detail-value">{registroDetalle.requerimiento || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Ingreso Real</span><span className="detail-value">{new Date(registroDetalle.ingreso || registroDetalle.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                    <div className="detail-row"><span className="detail-label">Salida Real</span><span className="detail-value">{new Date(registroDetalle.salida || registroDetalle.fecha_hora_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                    <div className="detail-row span-2"><span className="detail-label">Motivo / Cálculo</span><span className="detail-value" style={{background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0'}}>{registroDetalle.motivo}</span></div>
                    <div className="detail-row span-2"><span className="detail-label">Creado el</span><span className="detail-value" style={{fontSize: '11px', color: '#64748b'}}>{new Date(registroDetalle.created_at).toLocaleString()}</span></div>
                </div>
                <div style={{marginTop: '20px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '15px'}}>
                    <button onClick={() => setRegistroDetalle(null)} className="btn-clear">Cerrar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
export default AdminUserRecords