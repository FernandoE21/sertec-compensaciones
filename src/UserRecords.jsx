import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import * as XLSX from 'xlsx'
import Swal from 'sweetalert2'
import './App.css'

function UserRecords() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  
  // --- ESTADOS ---
  const [registros, setRegistros] = useState([])
  const [trabajadorInfo, setTrabajadorInfo] = useState(null) // Nuevo estado para la foto y nombre
  const [loading, setLoading] = useState(true)
  
  // Filtros y Edición
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [editando, setEditando] = useState(null)

  // CONSTANTES
  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos personal/`

  useEffect(() => {
    // 1. Buscar datos del trabajador (Foto y Nombre)
    const fetchTrabajador = async () => {
        const { data } = await supabase
            .from('personal')
            .select('nombres, apellidos, foto, cargo')
            .eq('codigo', codigo)
            .single()
        if (data) setTrabajadorInfo(data)
    }

    // 2. Buscar sus registros (Con filtros)
    const fetchRegistros = async () => {
      setLoading(true)
      let query = supabase
        .from('registro_horas')
        .select('*')
        .eq('codigo_trabajador', codigo)
        .order('fecha_hora_inicio', { ascending: false })

      if (desde) query = query.gte('fecha_hora_inicio', desde)
      if (hasta) query = query.lte('fecha_hora_inicio', hasta + ' 23:59:59')

      const { data, error } = await query
      if (error) console.error(error)
      else setRegistros(data)
      setLoading(false)
    }

    fetchTrabajador() // Ejecutamos la búsqueda del trabajador
    fetchRegistros()  // Ejecutamos la búsqueda de registros
  }, [codigo, desde, hasta])

  // --- FUNCIONES DE ACCIÓN (Exportar, Eliminar, Editar) ---
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
    XLSX.writeFile(workbook, `Reporte_${codigo}_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  const eliminarRegistro = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar registro?', text: "Esta acción no se puede deshacer", icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Sí, eliminar'
    })
    if (result.isConfirmed) {
        await supabase.from('registro_horas').delete().eq('id', id)
        Swal.fire('Eliminado', '', 'success')
        // Recargar la página actual para reflejar cambios
        window.location.reload()
    }
  }

  const guardarEdicion = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('registro_horas').update({
        tipo_solicitud: editando.tipo_solicitud,
        fecha_hora_inicio: editando.fecha_hora_inicio,
        fecha_hora_fin: editando.fecha_hora_fin,
        motivo: editando.motivo
      }).eq('id', editando.id)

    if (!error) {
      Swal.fire('Actualizado', 'Registro modificado correctamente', 'success')
      setEditando(null)
      window.location.reload() // Recargar para ver cambios
    }
  }

  return (
    <div className="container container-wide">
      
      {/* ENCABEZADO PROFESIONAL CON FOTO */}
      <div className="header-profile-bar">
        <div className="profile-section">
          {trabajadorInfo ? (
            <>
              <img 
                src={trabajadorInfo.foto ? `${STORAGE_URL}${trabajadorInfo.foto}` : ''} 
                alt="Perfil" 
                className="avatar-large"
                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${trabajadorInfo.nombres}`}
              />
              <div>
                <h2 className="profile-name">{trabajadorInfo.nombres.split(' ')[0]} {trabajadorInfo.apellidos.split(' ')[0]}</h2>
                <p className="profile-meta">Código: <strong>{codigo}</strong> | {trabajadorInfo.cargo}</p>
              </div>
            </>
          ) : (
            <h2 className="heading" style={{margin: 0, textAlign:'left'}}>Historial del Código: {codigo}</h2>
          )}
        </div>
        <button onClick={() => navigate('/')} className="btn-back">← Volver al inicio</button>
      </div>

      {/* BARRA DE FILTROS Y EXCEL */}
      <div className="filters-bar">
        <div className="filters-inputs">
            <div className="filter-group">
                <label>Desde:</label>
                <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="input-filter"/>
            </div>
            <div className="filter-group">
                <label>Hasta:</label>
                <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} className="input-filter"/>
            </div>
        </div>
        <button onClick={exportarExcel} className="btn-excel">📊 Descargar Excel</button>
      </div>

      {/* TABLA DE REGISTROS */}
      {loading ? <p style={{textAlign: 'center', marginTop: '20px'}}>Cargando historial...</p> : registros.length === 0 ? 
        <div style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>
            <p style={{fontSize: '18px', fontWeight: 'bold'}}>No se encontraron registros</p>
            <p>Prueba cambiando el rango de fechas.</p>
        </div> : (
        <div className="table-container animate-fade-in">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Fecha</th><th>Solicitud</th><th>Inicio</th><th>Fin</th><th style={{width:'25%'}}>Motivo</th><th>Acciones</th>
              </tr>
            </thead>
            <tbody>
                {registros.map((reg) => (
                    <tr key={reg.id}>
                    <td data-label="Fecha">{new Date(reg.fecha_hora_inicio).toLocaleDateString()}</td>
                    <td data-label="Solicitud"><span className="badge-table">{reg.tipo_solicitud}</span></td>
                    <td data-label="Inicio">{new Date(reg.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                    <td data-label="Fin">{new Date(reg.fecha_hora_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                    <td data-label="Motivo" className="cell-truncate" title={reg.motivo}>{reg.motivo}</td>
                    <td data-label="Acciones">
                        <button onClick={() => setEditando(reg)} className="btn-icon edit" title="Editar">✏️</button>
                        <button onClick={() => eliminarRegistro(reg.id)} className="btn-icon delete" title="Eliminar">🗑️</button>
                    </td>
                    </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL DE EDICIÓN (Mismo código anterior, solo aseguramos que esté) */}
      {editando && (
        <div className="modal-overlay">
          <div className="modal-content bounce-in">
            <h3 style={{color: 'var(--corporate-blue)', marginTop: 0}}>Editar Registro</h3>
            <form onSubmit={guardarEdicion}>
              <label className="label">Tipo Solicitud</label>
              <select className="input" value={editando.tipo_solicitud} onChange={e => setEditando({...editando, tipo_solicitud: e.target.value})}>
                 {/* Opciones resumidas por espacio, asegúrate de tener las mismas de App.jsx */}
                 <option value="COMPENSACIÓN POR TRASLADO DE VIAJE">COMPENSACIÓN POR TRASLADO DE VIAJE</option>
                 <option value="SOBRETIEMPO EN CLIENTE">SOBRETIEMPO EN CLIENTE</option>
                 <option value="SOBRETIEMPO EN CIPSA">SOBRETIEMPO EN CIPSA</option>
                 {/* ... Agrega el resto de tus opciones aquí ... */}
              </select>
              <div className="row">
                <div className="col"><label className="label">Inicio</label><input type="datetime-local" className="input" value={new Date(editando.fecha_hora_inicio).toISOString().slice(0, 16)} onChange={e => setEditando({...editando, fecha_hora_inicio: e.target.value})}/></div>
                <div className="col"><label className="label">Fin</label><input type="datetime-local" className="input" value={new Date(editando.fecha_hora_fin).toISOString().slice(0, 16)} onChange={e => setEditando({...editando, fecha_hora_fin: e.target.value})}/></div>
              </div>
              <label className="label">Motivo</label>
              <textarea className="input" rows="3" value={editando.motivo || ''} onChange={e => setEditando({...editando, motivo: e.target.value})}/>
              <div style={{display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end'}}>
                <button type="button" onClick={() => setEditando(null)} className="login-button" style={{margin: 0, background: '#e2e8f0', color: '#334155', width: 'auto', paddingInline: '20px', boxShadow:'none'}}>Cancelar</button>
                <button type="submit" className="login-button" style={{margin: 0, width: 'auto', paddingInline: '30px'}}>Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
export default UserRecords