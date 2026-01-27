import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import './App.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [registros, setRegistros] = useState([]) 
  const [loading, setLoading] = useState(true)

  // --- LÓGICA DE FECHAS ---
  const getFechasDefault = () => {
    const hoy = new Date()
    const dia = hoy.getDate()
    const mes = hoy.getMonth()
    const anio = hoy.getFullYear()
    let inicio, fin
    if (dia <= 21) {
        inicio = new Date(anio, mes - 1, 22)
        fin = new Date(anio, mes, 21)
    } else {
        inicio = new Date(anio, mes, 22)
        fin = new Date(anio, mes + 1, 21)
    }
    const offset = inicio.getTimezoneOffset()
    const i = new Date(inicio.getTime() - (offset*60*1000)).toISOString().split('T')[0]
    const f = new Date(fin.getTime() - (offset*60*1000)).toISOString().split('T')[0]
    return { inicio: i, fin: f }
  }

  const defaultFechas = getFechasDefault()
  const [fechaDesde, setFechaDesde] = useState(defaultFechas.inicio)
  const [fechaHasta, setFechaHasta] = useState(defaultFechas.fin)
  
  // Filtros
  const [filtroCargo, setFiltroCargo] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [listaCargos, setListaCargos] = useState([])
  const [listaSecciones, setListaSecciones] = useState([])

  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos%20personal/`

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      const { data: personalData } = await supabase.from('personal').select('codigo, cargo, seccion, foto') 
      
      let query = supabase.from('registro_horas').select('*').order('fecha_hora_inicio', { ascending: false })
      if (fechaDesde) query = query.gte('fecha_hora_inicio', fechaDesde)
      if (fechaHasta) query = query.lte('fecha_hora_inicio', fechaHasta + ' 23:59:59')
      const { data: horasData } = await query

      const personalMap = {}
      personalData.forEach(p => { personalMap[p.codigo] = { cargo: p.cargo, seccion: p.seccion, foto: p.foto } })

      const dataUnida = horasData.map(reg => {
        const infoExtra = personalMap[reg.codigo_trabajador] || {}
        return {
          ...reg,
          seccion_real: infoExtra.seccion || 'Sin Sección',
          cargo_real: infoExtra.cargo || reg.cargo,
          foto_real: infoExtra.foto,
          estado_real: reg.estado || 'Pendiente' 
        }
      })
      setRegistros(dataUnida)

      const cargosUnicos = [...new Set(personalData.map(p => p.cargo).filter(Boolean))].sort()
      const seccionesUnicas = [...new Set(personalData.map(p => p.seccion).filter(Boolean))].sort()
      setListaCargos(cargosUnicos)
      setListaSecciones(seccionesUnicas)
      setLoading(false)
    }
    fetchData()
  }, [fechaDesde, fechaHasta])

  // --- CAMBIAR ESTADO (Vía Select) ---
  const handleEstadoChange = async (id, nuevoEstado) => {
    // Confirmación solo si se rechaza
    if (nuevoEstado === 'Rechazado') {
        const confirm = await Swal.fire({
            title: '¿Rechazar?', text: "Se marcará como rechazado.", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Sí, rechazar'
        })
        if (!confirm.isConfirmed) return // Si cancela, no hacemos nada (el select volverá a su estado visualmente al refrescar o forzando update)
    }

    // Actualizamos BD
    const { error } = await supabase.from('registro_horas').update({ estado: nuevoEstado }).eq('id', id)

    if (error) {
        Swal.fire('Error', 'No se pudo actualizar', 'error')
    } else {
        // Actualizamos localmente
        const nuevosRegistros = registros.map(r => r.id === id ? { ...r, estado_real: nuevoEstado } : r)
        setRegistros(nuevosRegistros)
        
        // Feedback sutil
        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 })
        Toast.fire({ icon: 'success', title: `Estado: ${nuevoEstado}` })
    }
  }

  // Filtrado
  const registrosFiltrados = registros.filter(r => {
    const cumpleCargo = filtroCargo ? r.cargo_real === filtroCargo : true
    const cumpleSeccion = filtroSeccion ? r.seccion_real === filtroSeccion : true
    const term = busqueda.toLowerCase()
    const cumpleBusqueda = busqueda ? (r.nombre_empleado.toLowerCase().includes(term) || r.codigo_trabajador.includes(term)) : true
    return cumpleCargo && cumpleSeccion && cumpleBusqueda
  })

  const exportarExcel = () => {
    const dataClean = registrosFiltrados.map(reg => ({
      Codigo: reg.codigo_trabajador, Empleado: reg.nombre_empleado, Cargo: reg.cargo_real, Seccion: reg.seccion_real,
      Estado: reg.estado_real, Solicitud: reg.tipo_solicitud,
      Fecha: new Date(reg.fecha_hora_inicio).toLocaleDateString(),
      Inicio: new Date(reg.fecha_hora_inicio).toLocaleTimeString(), Fin: new Date(reg.fecha_hora_fin).toLocaleTimeString(),
      Motivo: reg.motivo
    }))
    const ws = XLSX.utils.json_to_sheet(dataClean)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_Admin")
    XLSX.writeFile(wb, `Reporte_Admin_${fechaDesde}_al_${fechaHasta}.xlsx`)
  }

  return (
    <div className="container container-wide">
      <div className="header-profile-bar">
        <div><h2 className="heading" style={{textAlign:'left', margin:0}}>📊 Panel General</h2><p className="profile-meta">Administración y Aprobaciones</p></div>
        <button onClick={() => navigate('/')} className="btn-back">Cerrar Sesión</button>
      </div>

      <div className="filters-bar" style={{flexWrap: 'wrap', gap: '15px'}}>
        <div className="filter-group"><label>Desde:</label><input type="date" className="input-filter" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}/></div>
        <div className="filter-group"><label>Hasta:</label><input type="date" className="input-filter" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}/></div>
        <div className="filter-group" style={{flex: 1, minWidth: '200px'}}><label>Buscar (Nombre/Código):</label><input type="text" className="input-filter" placeholder="Escriba..." value={busqueda} onChange={e => setBusqueda(e.target.value)}/></div>
      </div>

      <div className="filters-bar" style={{marginTop: '0', paddingTop: '0', borderTop: 'none', background: 'transparent'}}>
         <div className="filters-inputs" style={{flex: 1}}>
            <div className="filter-group" style={{minWidth: '150px'}}><label>Cargo:</label><select className="input-filter" value={filtroCargo} onChange={e => setFiltroCargo(e.target.value)}><option value="">-- Todos --</option>{listaCargos.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="filter-group" style={{minWidth: '150px'}}><label>Sección:</label><select className="input-filter" value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)}><option value="">-- Todas --</option>{listaSecciones.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
         </div>
         <button onClick={exportarExcel} className="btn-excel">📥 Descargar Reporte</button>
      </div>

      <div className="table-container">
        <p style={{textAlign: 'right', fontSize: '12px', color: '#666', marginBottom: '5px'}}>Mostrando {registrosFiltrados.length} registros del <b>{fechaDesde}</b> al <b>{fechaHasta}</b></p>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Estado</th> {/* ¡AHORA SOLO HAY UNA COLUMNA DE ESTADO! */}
              <th>Detalle</th>
              <th>Solicitud</th>
              <th>Horas</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="5" style={{textAlign:'center', padding: '30px'}}>Cargando data...</td></tr> : 
             registrosFiltrados.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding: '30px'}}>No hay registros en este rango.</td></tr> :
             registrosFiltrados.map(reg => (
              <tr key={reg.id} style={{background: reg.estado_real === 'Rechazado' ? '#fff1f2' : 'white'}}>
                <td data-label="Empleado">
                    <div className="employee-cell">
                        <img src={reg.foto_real ? `${STORAGE_URL}${reg.foto_real}` : ''} onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${reg.nombre_empleado}&background=random`} className="avatar-table" alt="foto"/>
                        <div><b>{reg.nombre_empleado}</b><br/><small style={{color:'#64748b'}}>{reg.codigo_trabajador}</small></div>
                    </div>
                </td>
                
                {/* --- AQUÍ ESTÁ LA MAGIA: UN SELECTOR DE COLORES --- */}
                <td data-label="Estado">
                    <select 
                        className={`select-status ${
                            reg.estado_real === 'Aprobado' ? 'bg-aprobado' : 
                            reg.estado_real === 'Rechazado' ? 'bg-rechazado' : 'bg-pendiente'
                        }`}
                        value={reg.estado_real}
                        onChange={(e) => handleEstadoChange(reg.id, e.target.value)}
                    >
                        <option value="Pendiente">⏳ Pendiente</option>
                        <option value="Aprobado">✅ Aprobado</option>
                        <option value="Rechazado">❌ Rechazado</option>
                    </select>
                </td>

                <td data-label="Detalle"><div style={{fontSize: '11px', lineHeight: '1.4'}}><strong>{reg.cargo_real}</strong><br/><span style={{color: '#6366f1'}}>{reg.seccion_real}</span></div></td>
                <td data-label="Solicitud" style={{fontSize: '11px'}}>{reg.tipo_solicitud}</td>
                <td data-label="Horas" style={{whiteSpace: 'nowrap'}}>{new Date(reg.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - {new Date(reg.fecha_hora_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard