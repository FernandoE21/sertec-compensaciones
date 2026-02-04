import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import './App.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [personal, setPersonal] = useState([]) 
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('') // Nuevo Estado
  const [listaSecciones, setListaSecciones] = useState([]) // Lista para el select

  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos%20personal/`

  useEffect(() => {
    const fetchPersonal = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('personal')
        .select('*')
        .order('apellidos', { ascending: true })
      
      if (!error) {
          setPersonal(data)
          // Extraer secciones únicas para el filtro
          const seccionesUnicas = [...new Set(data.map(p => p.seccion).filter(Boolean))].sort()
          setListaSecciones(seccionesUnicas)
      }
      setLoading(false)
    }
    fetchPersonal()
  }, [])

  // --- LÓGICA DE FILTRADO DOBLE (Texto + Sección) ---
  const personalFiltrado = personal.filter(p => {
    const term = busqueda.toLowerCase()
    const nombreCompleto = `${p.nombres} ${p.apellidos}`.toLowerCase()
    
    // Coincidencia de texto
    const matchTexto = nombreCompleto.includes(term) || p.codigo.includes(term) || p.cargo.toLowerCase().includes(term)
    
    // Coincidencia de sección
    const matchSeccion = filtroSeccion ? p.seccion === filtroSeccion : true

    return matchTexto && matchSeccion
  })

  // Función para limpiar
  const limpiarFiltros = () => {
      setBusqueda('')
      setFiltroSeccion('')
  }

  return (
    <div className="container container-wide">
      <div className="header-profile-bar">
        <div>
           <h2 className="heading" style={{textAlign:'left', margin:0}}>👥 Directorio de Personal</h2>
           <p className="profile-meta">Gestión de usuarios y asistencia</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-back">Cerrar Sesión</button>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="filters-bar">
        <div className="filters-inputs" style={{width: '100%', alignItems: 'flex-end'}}>
            
            {/* Buscador de Texto */}
            <div className="filter-group" style={{flex: 2, minWidth: '200px'}}>
                <label>Buscar (Nombre/Código):</label>
                <input 
                    type="text" 
                    className="input-filter" 
                    placeholder="Escribe para buscar..." 
                    value={busqueda} 
                    onChange={e => setBusqueda(e.target.value)}
                />
            </div>

            {/* Filtro de Sección */}
            <div className="filter-group" style={{flex: 1, minWidth: '200px'}}>
                <label>Filtrar por Sección:</label>
                <select 
                    className="input-filter" 
                    value={filtroSeccion} 
                    onChange={e => setFiltroSeccion(e.target.value)}
                >
                    <option value="">-- Todas las Secciones --</option>
                    {listaSecciones.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Botón Limpiar */}
            {(busqueda || filtroSeccion) && (
                <button onClick={limpiarFiltros} className="btn-clear" style={{marginBottom: '2px'}}>
                    🧹 Limpiar
                </button>
            )}

            <div className="filter-group" style={{paddingBottom: '10px', color: '#94a3b8', fontSize: '12px', marginLeft: 'auto'}}>
                <strong>{personalFiltrado.length}</strong> encontrados
            </div>
        </div>
      </div>

      {/* LISTA DE USUARIOS */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Colaborador</th>
              <th>Cargo / Sección</th>
              <th style={{textAlign: 'center', width: '120px'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="3" style={{textAlign:'center', padding:'30px'}}>Cargando directorio...</td></tr> : 
             personalFiltrado.length === 0 ? <tr><td colSpan="3" style={{textAlign:'center', padding:'30px'}}>No se encontraron colaboradores con estos filtros.</td></tr> :
             personalFiltrado.map((p) => (
              <tr key={p.codigo}>
                <td data-label="Colaborador">
                    <div className="employee-cell">
                        <img 
                            src={p.foto ? `${STORAGE_URL}${p.foto}` : ''} 
                            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${p.nombres}+${p.apellidos}&background=random`} 
                            className="avatar-table" 
                            alt="foto"
                        />
                        <div>
                            <b style={{fontSize:'14px', color:'#1e293b'}}>{p.apellidos}, {p.nombres}</b><br/>
                            <span className="badge-table" style={{background: '#f1f5f9', color: '#64748b', fontSize: '10px', fontWeight:'bold'}}>
                                {p.codigo}
                            </span>
                        </div>
                    </div>
                </td>
                <td data-label="Detalles">
                    <div style={{fontSize: '12px', lineHeight: '1.5'}}>
                        <strong style={{color:'#475569'}}>{p.cargo}</strong><br/>
                        <span style={{color: '#6366f1', fontSize:'11px'}}>{p.seccion}</span>
                    </div>
                </td>
                
                {/* BOTÓN NUEVO Y ELEGANTE */}
                <td data-label="Acción" style={{textAlign: 'center'}}>
                    <button 
                        onClick={() => navigate(`/admin/registros/${p.codigo}`)}
                        className="btn-view-profile"
                        title="Ver historial de registros"
                    >
                        <span>Ver Registros</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                            <polyline points="15 3 21 3 21 9"></polyline>
                            <line x1="10" y1="14" x2="21" y2="3"></line>
                        </svg>
                    </button>
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