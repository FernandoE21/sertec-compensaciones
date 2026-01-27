import { useEffect, useState, useMemo } from 'react' // Importamos useMemo
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import './App.css'

function UserRecords() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  
  // --- LÓGICA DE FECHAS AUTOMÁTICAS ---
  const getFechasIniciales = () => {
    const hoy = new Date()
    const dia = hoy.getDate()
    const mes = hoy.getMonth()
    const anio = hoy.getFullYear()
    let inicio, fin, textoCierre

    if (dia <= 21) {
        inicio = new Date(anio, mes - 1, 22)
        fin = new Date(anio, mes, 21)
    } else {
        inicio = new Date(anio, mes, 22)
        fin = new Date(anio, mes + 1, 21)
    }
    const offset = inicio.getTimezoneOffset()
    const inicioLocal = new Date(inicio.getTime() - (offset*60*1000)).toISOString().split('T')[0]
    const finLocal = new Date(fin.getTime() - (offset*60*1000)).toISOString().split('T')[0]
    textoCierre = fin.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }).toUpperCase()
    return { inicio: inicioLocal, fin: finLocal, texto: textoCierre }
  }

  const fechasDefault = getFechasIniciales()
  
  // Estados
  const [registros, setRegistros] = useState([])
  const [trabajadorInfo, setTrabajadorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState(fechasDefault.inicio)
  const [hasta, setHasta] = useState(fechasDefault.fin)
  const [textoCierre] = useState(fechasDefault.texto)
  const [editando, setEditando] = useState(null)

  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos personal/`

  useEffect(() => {
    const fetchTrabajador = async () => {
        const { data } = await supabase.from('personal').select('nombres, apellidos, foto, cargo').eq('codigo', codigo).single()
        if (data) setTrabajadorInfo(data)
    }
    const fetchRegistros = async () => {
      setLoading(true)
      let query = supabase.from('registro_horas').select('*').eq('codigo_trabajador', codigo).order('fecha_hora_inicio', { ascending: false })
      if (desde) query = query.gte('fecha_hora_inicio', desde)
      if (hasta) query = query.lte('fecha_hora_inicio', hasta + ' 23:59:59')
      const { data, error } = await query
      if (!error) setRegistros(data)
      setLoading(false)
    }
    fetchTrabajador()
    fetchRegistros()
  }, [codigo, desde, hasta])

  // --- 🧮 LÓGICA DE CÁLCULO SEPARADO (Favor vs Contra) ---
  const resumenHoras = useMemo(() => {
    let minutosFavor = 0
    let minutosContra = 0

    registros.forEach(reg => {
        // 1. Ignoramos si está rechazado
        if (reg.estado === 'Rechazado') return

        // 2. Calculamos duración en minutos
        const inicio = new Date(reg.fecha_hora_inicio)
        const fin = new Date(reg.fecha_hora_fin)
        const diferenciaMs = fin - inicio
        const minutos = diferenciaMs / (1000 * 60) 

        // 3. SEPARAMOS EN DOS BOLSAS
        switch (reg.tipo_solicitud) {
            // --- GRUPO QUE SUMA (Horas Extras) ---
            case "COMPENSACIÓN POR TRASLADO DE VIAJE":
            case "SOBRETIEMPO EN CLIENTE":
            case "SOBRETIEMPO EN CIPSA":
                minutosFavor += minutos
                break
            
            // --- GRUPO QUE RESTA (Deudas/Consumos) ---
            case "COMPENSACIÓN A FAVOR DE CIPSA":
            case "POR SALIDAS ANTES DE HORARIO":
                minutosContra += minutos 
                break
                
            default:
                break
        }
    })

    return { favor: minutosFavor, contra: minutosContra }
  }, [registros])

  // Formateador simple (siempre positivo visualmente, el color indica el signo)
  const formatearSimple = (minutos) => {
    const horas = Math.floor(minutos / 60)
    const mins = Math.round(minutos % 60)
    return `${horas.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  // Función para formatear minutos a "HH:mm" (Maneja negativos)
  const formatearHoras = (minutosTotales) => {
    const esNegativo = minutosTotales < 0
    const minutosAbs = Math.abs(minutosTotales)
    const horas = Math.floor(minutosAbs / 60)
    const minutos = Math.round(minutosAbs % 60)
    
    // Formato 00:00
    const texto = `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')} hrs`
    return esNegativo ? `-${texto}` : `+${texto}`
  }

  // --- FIN LÓGICA CÁLCULO ---

  const exportarExcel = () => {
    const dataFormateada = registros.map(reg => ({
      ID: reg.id, Empleado: reg.nombre_empleado, Codigo: reg.codigo_trabajador,
      Solicitud: reg.tipo_solicitud, Area: reg.area,
      Inicio: new Date(reg.fecha_hora_inicio).toLocaleString(),
      Fin: new Date(reg.fecha_hora_fin).toLocaleString(), Motivo: reg.motivo
    }))
    const worksheet = XLSX.utils.json_to_sheet(dataFormateada)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial")
    XLSX.writeFile(workbook, `Reporte_${codigo}_${desde}_al_${hasta}.xlsx`)
  }

  const eliminarRegistro = async (id) => {
    const result = await Swal.fire({ title: '¿Eliminar?', text: "No se puede deshacer", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar' })
    if (result.isConfirmed) {
        await supabase.from('registro_horas').delete().eq('id', id)
        Swal.fire('Eliminado', '', 'success')
        window.location.reload()
    }
  }

  const guardarEdicion = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('registro_horas').update({ tipo_solicitud: editando.tipo_solicitud, fecha_hora_inicio: editando.fecha_hora_inicio, fecha_hora_fin: editando.fecha_hora_fin, motivo: editando.motivo }).eq('id', editando.id)
    if (!error) { Swal.fire('Actualizado', '', 'success'); setEditando(null); window.location.reload(); }
  }

  return (
    <div className="container container-wide">
      
      <div className="header-profile-bar">
        <div className="profile-section">
          {trabajadorInfo && (
            <>
              <img src={trabajadorInfo.foto ? `${STORAGE_URL}${trabajadorInfo.foto}` : ''} alt="Perfil" className="avatar-large" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${trabajadorInfo.nombres}`} />
              <div>
                <h2 className="profile-name">{trabajadorInfo.nombres.split(' ')[0]} {trabajadorInfo.apellidos.split(' ')[0]}</h2>
                <p className="profile-meta">Código: <strong>{codigo}</strong> | {trabajadorInfo.cargo}</p>
              </div>
            </>
          )}
        </div>
        <button onClick={() => navigate('/')} className="btn-back">Cerrar Sesión</button>
      </div>

      <div className="info-banner">
        <span className="info-icon">📅</span>
        <div><strong>PERIODO ACTUAL: CIERRE {textoCierre}</strong><br/>Revisando ciclo del {new Date(desde + 'T00:00:00').getDate()} de {new Date(desde + 'T00:00:00').toLocaleString('es-ES', {month:'long'})} al {new Date(hasta + 'T00:00:00').getDate()} de {new Date(hasta + 'T00:00:00').toLocaleString('es-ES', {month:'long'})}.</div>
      </div>

      {/* --- TARJETAS DE BALANCE SEPARADAS --- */}
      <div className="balance-grid">
        
        {/* TARJETA 1: HORAS A FAVOR (EXTRAS) */}
        <div className="balance-card card-green">
            <span className="balance-label">Horas Extras Generadas</span>
            <div className="balance-amount text-green">
                +{formatearSimple(resumenHoras.favor)} <span style={{fontSize:'14px'}}>hrs</span>
            </div>
            <span className="balance-icon-bg">📈</span>
        </div>

        {/* TARJETA 2: HORAS EN CONTRA (DEUDA) */}
        <div className="balance-card card-red">
            <span className="balance-label">Horas por Compensar</span>
            <div className="balance-amount text-red">
                -{formatearSimple(resumenHoras.contra)} <span style={{fontSize:'14px'}}>hrs</span>
            </div>
            <span className="balance-icon-bg">📉</span>
        </div>

      </div>

      <div className="filters-bar">
        <div className="filters-inputs">
            <div className="filter-group"><label>Desde:</label><input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input-filter"/></div>
            <div className="filter-group"><label>Hasta:</label><input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input-filter"/></div>
        </div>
        <button onClick={exportarExcel} className="btn-excel">📊 Excel</button>
      </div>

      {loading ? <p style={{textAlign: 'center'}}>Cargando registros...</p> : registros.length === 0 ? 
        <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}><p>No hay registros en este periodo.</p></div> : (
        <div className="table-container">
          <table className="custom-table">
            <thead><tr><th>Fecha</th><th>Solicitud</th><th>Inicio</th><th>Fin</th><th>Motivo</th><th>Acciones</th></tr></thead>
            <tbody>
                {registros.map((reg) => (
                    <tr key={reg.id} style={{opacity: reg.estado === 'Rechazado' ? 0.5 : 1}}> {/* Opacidad visual si está rechazado */}
                    <td data-label="Fecha">{new Date(reg.fecha_hora_inicio).toLocaleDateString()}</td>
                    <td data-label="Solicitud">
                        <span className="badge-table">{reg.tipo_solicitud}</span>
                        {/* Indicador pequeño de si sumó o restó */}
                        {["COMPENSACIÓN POR TRASLADO DE VIAJE", "SOBRETIEMPO EN CLIENTE", "SOBRETIEMPO EN CIPSA"].includes(reg.tipo_solicitud) && <span style={{color:'green', fontWeight:'bold', marginLeft:'5px'}}> (+)</span>}
                        {["COMPENSACIÓN A FAVOR DE CIPSA", "POR SALIDAS ANTES DE HORARIO"].includes(reg.tipo_solicitud) && <span style={{color:'red', fontWeight:'bold', marginLeft:'5px'}}> (-)</span>}
                    </td>
                    <td data-label="Inicio">{new Date(reg.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                    <td data-label="Fin">{new Date(reg.fecha_hora_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                    <td data-label="Motivo" className="cell-truncate">{reg.motivo}</td>
                    <td data-label="Acciones">
                        <button onClick={() => setEditando(reg)} className="btn-icon edit">✏️</button>
                        <button onClick={() => eliminarRegistro(reg.id)} className="btn-icon delete">🗑️</button>
                    </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <button className="btn-float" onClick={() => navigate(`/nuevo-registro/${codigo}`)} title="Nueva Solicitud">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      {editando && (
        <div className="modal-overlay">
          <div className="modal-content">
             <h3>Editar Registro</h3>
             <form onSubmit={guardarEdicion}>
                  <label className="label">Tipo Solicitud</label>
                  <select className="input" value={editando.tipo_solicitud} onChange={e => setEditando({...editando, tipo_solicitud: e.target.value})}>
                      <option value="COMPENSACIÓN POR TRASLADO DE VIAJE">COMPENSACIÓN POR TRASLADO DE VIAJE</option>
                      <option value="SOBRETIEMPO EN CLIENTE">SOBRETIEMPO EN CLIENTE</option>
                      <option value="SOBRETIEMPO EN CIPSA">SOBRETIEMPO EN CIPSA</option>
                      <option value="COMPENSACIÓN A FAVOR DE CIPSA">COMPENSACIÓN A FAVOR DE CIPSA</option>
                      <option value="POR SALIDAS ANTES DE HORARIO">POR SALIDAS ANTES DE HORARIO</option>
                  </select>
                   <div className="row">
                    <div className="col"><label className="label">Inicio</label><input type="datetime-local" className="input" value={new Date(editando.fecha_hora_inicio).toISOString().slice(0, 16)} onChange={e => setEditando({...editando, fecha_hora_inicio: e.target.value})}/></div>
                    <div className="col"><label className="label">Fin</label><input type="datetime-local" className="input" value={new Date(editando.fecha_hora_fin).toISOString().slice(0, 16)} onChange={e => setEditando({...editando, fecha_hora_fin: e.target.value})}/></div>
                  </div>
                  <label className="label">Motivo</label>
                  <textarea className="input" rows="3" value={editando.motivo || ''} onChange={e => setEditando({...editando, motivo: e.target.value})}/>
                  <div style={{display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end'}}>
                    <button type="button" onClick={() => setEditando(null)} className="btn-small" style={{border: 'none', background:'#e2e8f0'}}>Cancelar</button>
                    <button type="submit" className="login-button" style={{margin: 0, width: 'auto', paddingInline: '20px'}}>Guardar</button>
                  </div>
             </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default UserRecords