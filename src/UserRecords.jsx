import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import './App.css'

function UserRecords() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  
  // ESTADOS
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
        const { data } = await supabase.from('personal').select('nombres, apellidos, foto, cargo').eq('codigo', codigo).single()
        if (data) setTrabajadorInfo(data)
    }
    fetchTrabajador()
    fetchRegistros()
  }, [codigo, desde, hasta])

  const limpiarFechas = () => {
      setDesde('')
      setHasta('')
  }

  // BALANCE GENERAL
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

  // --- NUEVA FUNCIÓN: CALCULAR HORAS POR FILA ---
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
          return <span style={{backgroundColor: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px'}}>+{texto}</span>
      } else if (tiposContra.includes(reg.tipo_solicitud)) {
          return <span style={{backgroundColor: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '12px'}}>-{texto}</span>
      } else {
          return <span>{texto}</span>
      }
  }

  const eliminarRegistro = async (nro) => { 
    const result = await Swal.fire({ title: '¿Eliminar?', text: "No se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar' })
    if (result.isConfirmed) {
        await supabase.from('registro_horas').delete().eq('nro_registro', nro)
        Swal.fire('Eliminado', '', 'success')
        setRegistroDetalle(null)
        fetchRegistros()
    }
  }

  const exportarExcel = () => {
    const dataFormateada = registros.map(reg => ({ Nro: reg.nro_registro, Fecha_Evento: new Date(reg.fecha_hora_inicio).toLocaleDateString(), Hora_Registro: new Date(reg.created_at).toLocaleString(), Solicitud: reg.tipo_solicitud, Requerimiento: reg.requerimiento, Estado: reg.estado, Detalle: reg.motivo }))
    const worksheet = XLSX.utils.json_to_sheet(dataFormateada); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Historial"); XLSX.writeFile(workbook, `Reporte_${codigo}.xlsx`)
  }

  return (
    <div className="container container-wide">
      <div className="header-profile-bar">
        <div className="profile-section">
          {trabajadorInfo && (
            <>
              <img src={trabajadorInfo.foto ? `${STORAGE_URL}${trabajadorInfo.foto}` : ''} alt="Perfil" className="avatar-large" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${trabajadorInfo.nombres}`} />
              <div><h2 className="profile-name">{trabajadorInfo.nombres.split(' ')[0]} {trabajadorInfo.apellidos.split(' ')[0]}</h2><p className="profile-meta">Código: <strong>{codigo}</strong> | {trabajadorInfo.cargo}</p></div>
            </>
          )}
        </div>
        <button onClick={() => navigate('/')} className="btn-back">Cerrar Sesión</button>
      </div>

      <div className="balance-grid">
        <div className="balance-card card-green"><span className="balance-label">A favor (+)</span><div className="balance-amount text-green">+{formatearSimple(resumenHoras.favor)}</div></div>
        <div className="balance-card card-red"><span className="balance-label">Por compensar (-)</span><div className="balance-amount text-red">-{formatearSimple(resumenHoras.contra)}</div></div>
        <div className="balance-card card-blue"><span className="balance-label">Saldo Total (=)</span><div className={`balance-amount ${resumenHoras.neto >= 0 ? 'text-blue' : 'text-red'}`}>{resumenHoras.neto >= 0 ? '+' : '-'}{formatearSimple(resumenHoras.neto)}</div></div>
      </div>

      <div className="filters-bar">
        <div className="filters-inputs">
            <div className="filter-group"><label>Desde Fer:</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input-filter"/></div>
            <div className="filter-group"><label>Hasta:</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input-filter"/></div>
            {(desde || hasta) && (
                <button onClick={limpiarFechas} className="btn-clear" style={{marginTop: '22px'}} title="Borrar filtros">🧹 Ver Todo</button>
            )}
            <div style={{alignSelf: 'center', fontSize: '12px', color: '#64748b', marginLeft: '10px', marginTop: '10px'}}>
                {desde && hasta ? <span>📅 Del <b>{new Date(desde+'T00:00:00').toLocaleDateString()}</b> al <b>{new Date(hasta+'T00:00:00').toLocaleDateString()}</b></span> : <span>🗂️ Historial Completo</span>}
            </div>
        </div>
        <button onClick={exportarExcel} className="btn-excel">📊 Excel</button>
      </div>

      {loading ? <p style={{textAlign: 'center'}}>Cargando...</p> : registros.length === 0 ? 
        <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}><p>No hay registros encontrados.</p></div> : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{textAlign:'center'}}>Nro</th>
                <th>Fecha Evento</th>
                <th>Hora Registro</th>
                <th>Solicitud</th>
                <th>Horas</th> {/* <--- NUEVA COLUMNA EN EL HEADER */}
                <th>Requerimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
                {registros.map((reg) => (
                    <tr key={reg.id} style={{opacity: reg.estado === 'Rechazado' ? 0.5 : 1}}>
                    <td className="col-id" style={{fontFamily: 'monospace', fontSize: '12px'}}>{String(reg.nro_registro).padStart(6, '0')}</td>
                    <td data-label="Fecha Evento">{new Date(reg.fecha_hora_inicio).toLocaleDateString()}</td>
                    <td data-label="Hora Registro" style={{fontSize:'11px', color:'#64748b'}}>{new Date(reg.created_at).toLocaleString([], {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}</td>
                    <td data-label="Solicitud"><span className="badge-table">{reg.tipo_solicitud}</span></td>
                    
                    {/* <--- NUEVA COLUMNA EN EL BODY (Llamamos a la función de cálculo) */}
                    <td data-label="Horas">
                        {calcularHorasFila(reg)}
                    </td>

                    <td data-label="Requerimiento" style={{fontSize:'12px'}}>{reg.requerimiento || '-'}</td>
                    <td data-label="Estado"><span style={{fontWeight:'bold', fontSize:'12px', padding: '4px 8px', borderRadius: '12px', backgroundColor: reg.estado === 'Aprobado' ? '#dcfce7' : reg.estado === 'Rechazado' ? '#fee2e2' : '#fffbeb', color: reg.estado === 'Aprobado' ? '#166534' : reg.estado === 'Rechazado' ? '#991b1b' : '#b45309'}}>{reg.estado || 'Pendiente'}</span></td>
                    <td data-label="Acciones">
                        <div style={{display:'flex', gap:'5px', justifyContent:'center'}}>
                            <button onClick={() => setRegistroDetalle(reg)} className="btn-icon info" title="Ver detalle">ⓘ</button>
                            {reg.estado === 'Pendiente' && (
                                <>
                                    <button onClick={() => navigate(`/editar-registro/${codigo}/${reg.nro_registro}`)} className="btn-icon edit" title="Editar">✏️</button>
                                    <button onClick={() => eliminarRegistro(reg.nro_registro)} className="btn-icon delete" title="Eliminar">🗑️</button>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <button className="btn-float" onClick={() => navigate(`/nuevo-registro/${codigo}`)} title="Nueva Solicitud">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      {registroDetalle && (
        <div className="modal-overlay" onClick={() => setRegistroDetalle(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header"><h3>Detalle del Registro</h3><button className="close-modal" onClick={() => setRegistroDetalle(null)}>×</button></div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                    <div className="detail-row"><span className="detail-label">Nro Registro</span><span className="detail-value" style={{fontFamily: 'monospace', fontSize: '16px'}}>{String(registroDetalle.nro_registro).padStart(6, '0')}</span></div>
                    <div className="detail-row"><span className="detail-label">Estado Actual</span><span className={`status-badge ${registroDetalle.estado === 'Aprobado' ? 'status-aprobado' : registroDetalle.estado === 'Rechazado' ? 'status-rechazado' : 'status-pendiente'}`} style={{alignSelf: 'flex-start'}}>{registroDetalle.estado}</span></div>
                    <div className="detail-row span-2"><span className="detail-label">Tipo de Solicitud</span><span className="detail-value">{registroDetalle.tipo_solicitud}</span></div>
                    <div className="detail-row"><span className="detail-label">Fecha del Evento</span><span className="detail-value">{new Date(registroDetalle.fecha_hora_inicio).toLocaleDateString()}</span></div>
                    <div className="detail-row"><span className="detail-label">Requerimiento</span><span className="detail-value">{registroDetalle.requerimiento || 'N/A'}</span></div>
                    <div className="detail-row"><span className="detail-label">Ingreso Registrado</span><span className="detail-value">{new Date(registroDetalle.ingreso || registroDetalle.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                    <div className="detail-row"><span className="detail-label">Salida Registrada</span><span className="detail-value">{new Date(registroDetalle.salida || registroDetalle.fecha_hora_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></div>
                    
                    {/* (Opcional) También podrías mostrar las horas aquí si quieres */}
                    <div className="detail-row span-2"><span className="detail-label">Tiempo Calculado</span><span className="detail-value">{calcularHorasFila(registroDetalle)}</span></div>

                    <div className="detail-row span-2"><span className="detail-label">Motivo / Cálculo Automático</span><span className="detail-value" style={{background: '#f8fafc', padding: '8px', borderRadius: '6px', fontSize: '13px', border: '1px solid #e2e8f0'}}>{registroDetalle.motivo || 'Sin detalles adicionales'}</span></div>
                    <div className="detail-row span-2"><span className="detail-label">Creado el</span><span className="detail-value" style={{fontSize: '11px', color: '#64748b'}}>{new Date(registroDetalle.created_at).toLocaleString()}</span></div>
                </div>
                
                {registroDetalle.estado === 'Pendiente' && (
                    <div style={{marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '15px'}}>
                        <button onClick={() => { setRegistroDetalle(null); navigate(`/editar-registro/${codigo}/${registroDetalle.nro_registro}`) }} className="login-button" style={{margin:0, width:'auto', background: '#f59e0b', padding: '8px 15px'}}>✏️ Editar</button>
                        <button onClick={() => eliminarRegistro(registroDetalle.nro_registro)} className="login-button" style={{margin:0, width:'auto', background: '#ef4444', padding: '8px 15px'}}>🗑️ Eliminar</button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  )
}
export default UserRecords