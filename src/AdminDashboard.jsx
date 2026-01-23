import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import * as XLSX from 'xlsx'
import './App.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [registrosCompletos, setRegistrosCompletos] = useState([]) // Data original mezclada
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]) // Data que se ve en pantalla
  const [loading, setLoading] = useState(true)

  // Filtros
  const [filtroCargo, setFiltroCargo] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('')
  const [busqueda, setBusqueda] = useState('')

  // Listas para los Selects (Combobox)
  const [listaCargos, setListaCargos] = useState([])
  const [listaSecciones, setListaSecciones] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // 1. Traer TODOS los registros de horas
      const { data: horasData } = await supabase
        .from('registro_horas')
        .select('*')
        .order('fecha_hora_inicio', { ascending: false })

      // 2. Traer TODO el personal (para saber sus secciones)
      const { data: personalData } = await supabase
        .from('personal')
        .select('codigo, cargo, seccion')

      // 3. MEZCLAR LA DATA (JOIN en Javascript)
      // Creamos un diccionario para buscar rápido por código
      const personalMap = {}
      personalData.forEach(p => {
        personalMap[p.codigo] = { cargo: p.cargo, seccion: p.seccion }
      })

      // Unimos la info: Al registro de hora le pegamos la sección del personal
      const dataUnida = horasData.map(reg => {
        const infoExtra = personalMap[reg.codigo_trabajador] || {}
        return {
          ...reg,
          seccion_real: infoExtra.seccion || 'Sin Sección', // Dato traído de personal
          cargo_real: infoExtra.cargo || reg.cargo // Preferimos el de personal, si no el del registro
        }
      })

      setRegistrosCompletos(dataUnida)
      setRegistrosFiltrados(dataUnida)

      // 4. Extraer listas únicas para los filtros (Cargos y Secciones únicos)
      const cargosUnicos = [...new Set(personalData.map(p => p.cargo).filter(Boolean))].sort()
      const seccionesUnicas = [...new Set(personalData.map(p => p.seccion).filter(Boolean))].sort()
      
      setListaCargos(cargosUnicos)
      setListaSecciones(seccionesUnicas)
      
      setLoading(false)
    }

    fetchData()
  }, [])

  // Efecto para filtrar cuando cambian los inputs
  useEffect(() => {
    let resultado = registrosCompletos

    if (filtroCargo) {
      resultado = resultado.filter(r => r.cargo_real === filtroCargo)
    }
    if (filtroSeccion) {
      resultado = resultado.filter(r => r.seccion_real === filtroSeccion)
    }
    if (busqueda) {
      const term = busqueda.toLowerCase()
      resultado = resultado.filter(r => 
        r.nombre_empleado.toLowerCase().includes(term) || 
        r.codigo_trabajador.includes(term)
      )
    }

    setRegistrosFiltrados(resultado)
  }, [filtroCargo, filtroSeccion, busqueda, registrosCompletos])

  // Exportar Excel del Admin
  const exportarExcel = () => {
    const dataClean = registrosFiltrados.map(reg => ({
      Codigo: reg.codigo_trabajador,
      Empleado: reg.nombre_empleado,
      Cargo: reg.cargo_real,
      Seccion: reg.seccion_real,
      Solicitud: reg.tipo_solicitud,
      Fecha: new Date(reg.fecha_hora_inicio).toLocaleDateString(),
      Inicio: new Date(reg.fecha_hora_inicio).toLocaleTimeString(),
      Fin: new Date(reg.fecha_hora_fin).toLocaleTimeString(),
      Motivo: reg.motivo
    }))
    const ws = XLSX.utils.json_to_sheet(dataClean)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Reporte_Admin")
    XLSX.writeFile(wb, "Reporte_General.xlsx")
  }

  return (
    <div className="container container-wide">
      <div className="header-profile-bar">
        <div>
           <h2 className="heading" style={{textAlign:'left', margin:0}}>📊 Panel General</h2>
           <p className="profile-meta">Administración de Registros</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-back">Cerrar Sesión</button>
      </div>

      {/* ZONA DE FILTROS AVANZADOS */}
      <div className="filters-bar" style={{flexWrap: 'wrap'}}>
        <div className="filters-inputs" style={{flex: 1}}>
            <div className="filter-group" style={{minWidth: '200px'}}>
                <label>Buscar (Nombre/Código):</label>
                <input type="text" className="input-filter" placeholder="Escriba..." value={busqueda} onChange={e => setBusqueda(e.target.value)}/>
            </div>
            
            <div className="filter-group" style={{minWidth: '150px'}}>
                <label>Filtrar por Cargo:</label>
                <select className="input-filter" value={filtroCargo} onChange={e => setFiltroCargo(e.target.value)}>
                    <option value="">-- Todos --</option>
                    {listaCargos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>

            <div className="filter-group" style={{minWidth: '150px'}}>
                <label>Filtrar por Sección:</label>
                <select className="input-filter" value={filtroSeccion} onChange={e => setFiltroSeccion(e.target.value)}>
                    <option value="">-- Todas --</option>
                    {listaSecciones.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        </div>
        <button onClick={exportarExcel} className="btn-excel" style={{marginTop: '10px'}}>📥 Descargar Todo</button>
      </div>

      <div className="table-container">
        <p style={{textAlign: 'right', fontSize: '12px', color: '#666'}}>Mostrando {registrosFiltrados.length} registros</p>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Empleado</th>
              <th>Cargo</th>
              <th>Sección</th>
              <th>Fecha</th>
              <th>Solicitud</th>
              <th>Horas</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" style={{textAlign:'center'}}>Cargando data...</td></tr> : 
             registrosFiltrados.map(reg => (
              <tr key={reg.id}>
                <td data-label="Empleado">
                    <b>{reg.nombre_empleado}</b><br/>
                    <small>{reg.codigo_trabajador}</small>
                </td>
                <td data-label="Cargo">{reg.cargo_real}</td>
                <td data-label="Sección"><span className="badge-table" style={{background: '#e0e7ff', color:'#3730a3'}}>{reg.seccion_real}</span></td>
                <td data-label="Fecha">{new Date(reg.fecha_hora_inicio).toLocaleDateString()}</td>
                <td data-label="Solicitud">{reg.tipo_solicitud}</td>
                <td data-label="Horas">
                    {new Date(reg.fecha_hora_inicio).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - 
                    {new Date(reg.fecha_hora_fin).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
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