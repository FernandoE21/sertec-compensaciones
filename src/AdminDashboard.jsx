import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Swal from 'sweetalert2'
import './App.css'

function AdminDashboard() {
  const navigate = useNavigate()
  const [personal, setPersonal] = useState([]) 
  const [loading, setLoading] = useState(true)
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [filtroSeccion, setFiltroSeccion] = useState('') // Nuevo Estado
  const [listaSecciones, setListaSecciones] = useState([]) // Lista para el select

  // Configuración onomástico
  const [fechaCorte, setFechaCorte] = useState('')
  const [fechaCorteOriginal, setFechaCorteOriginal] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

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

    // Cargar configuración
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'onomastico_fecha_corte').single()
      if (data) { setFechaCorte(data.valor); setFechaCorteOriginal(data.valor) }
    }
    fetchConfig()
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

  // Guardar fecha de corte
  const guardarFechaCorte = async () => {
    if (!fechaCorte) return
    setGuardandoConfig(true)
    const { error } = await supabase.from('configuracion').update({ valor: fechaCorte, updated_at: new Date().toISOString() }).eq('clave', 'onomastico_fecha_corte')
    setGuardandoConfig(false)
    if (error) {
      Swal.fire('Error', error.message, 'error')
    } else {
      setFechaCorteOriginal(fechaCorte)
      Swal.fire({ title: '¡Actualizado!', text: `Fecha de corte cambiada a ${new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, icon: 'success', timer: 2000, showConfirmButton: false })
    }
  }

  return (
    <div className="container container-wide">
      <div className="header-profile-bar">
        <div>
           <h2 className="heading" style={{textAlign:'left', margin:0}}>👥 Directorio de Personal</h2>
           <p className="profile-meta">Gestión de usuarios y asistencia</p>
        </div>
        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
          <button 
            onClick={() => setShowConfig(!showConfig)} 
            style={{
              background: showConfig ? '#193b48' : '#f1f5f9', color: showConfig ? 'white' : '#475569', 
              border:'1px solid #e2e8f0', borderRadius:'12px',
              padding:'8px 14px', fontSize:'13px', fontWeight:'bold', cursor:'pointer',
              display:'flex', alignItems:'center', gap:'6px', transition:'all 0.3s ease'
            }}
          >
            ⚙️ Configuración
          </button>
          <button 
            onClick={() => navigate('/admin/nuevo-personal')} 
            style={{
              background:'#7db100', color:'white', border:'none', borderRadius:'12px',
              padding:'8px 16px', fontSize:'13px', fontWeight:'bold', cursor:'pointer',
              display:'flex', alignItems:'center', gap:'6px',
              boxShadow:'0 4px 10px -2px rgba(125,177,0,0.3)', transition:'all 0.3s ease'
            }}
            onMouseOver={e => e.target.style.background = '#6a9600'}
            onMouseOut={e => e.target.style.background = '#7db100'}
          >
            ➕ Nuevo Personal
          </button>
          <button onClick={() => navigate('/')} className="btn-back">Cerrar Sesión</button>
        </div>
      </div>

      {/* PANEL CONFIGURACIÓN */}
      {showConfig && (
        <div style={{
          background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:'16px',
          padding:'20px 25px', marginBottom:'20px',
          boxShadow:'0 4px 10px -2px rgba(0,0,0,0.05)'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
            <span style={{fontSize:'20px'}}>⚙️</span>
            <h3 style={{margin:0, fontSize:'16px', color:'#1e293b'}}>Configuración del Sistema</h3>
          </div>
          
          <div style={{
            background:'white', borderRadius:'12px', border:'1px solid #e2e8f0',
            padding:'15px 20px', display:'flex', alignItems:'center', gap:'20px', flexWrap:'wrap'
          }}>
            <div style={{flex:1, minWidth:'250px'}}>
              <label style={{fontSize:'12px', fontWeight:'bold', color:'#475569', textTransform:'uppercase', letterSpacing:'0.5px', display:'block', marginBottom:'6px'}}>
                🎂 Fecha de corte para Onomástico
              </label>
              <p style={{fontSize:'12px', color:'#64748b', margin:'0 0 8px'}}>
                Solo el personal con fecha de ingreso <strong>igual o anterior</strong> a esta fecha será elegible para el beneficio de onomástico.
              </p>
              <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                <input 
                  type="date" 
                  value={fechaCorte} 
                  onChange={e => setFechaCorte(e.target.value)}
                  style={{
                    borderRadius:'10px', border:'1px solid #cbd5e1', padding:'8px 12px',
                    fontSize:'14px', fontWeight:'500'
                  }}
                />
                {fechaCorte !== fechaCorteOriginal && (
                  <button
                    onClick={guardarFechaCorte}
                    disabled={guardandoConfig}
                    style={{
                      background:'#7db100', color:'white', border:'none', borderRadius:'10px',
                      padding:'8px 18px', fontSize:'13px', fontWeight:'bold', cursor:'pointer',
                      transition:'all 0.2s'
                    }}
                  >
                    {guardandoConfig ? 'Guardando...' : '💾 Guardar'}
                  </button>
                )}
                {fechaCorte === fechaCorteOriginal && fechaCorte && (
                  <span style={{fontSize:'12px', color:'#15803d', fontWeight:'bold'}}>
                    ✅ Vigente: {new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-ES', { day:'numeric', month:'long', year:'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                
                {/* BOTONES DE ACCIÓN */}
                <td data-label="Acción" style={{textAlign: 'center'}}>
                    <div style={{display:'flex', gap:'6px', justifyContent:'center'}}>
                      <button 
                          onClick={() => navigate(`/admin/editar-personal/${p.codigo}`)}
                          title="Editar datos del colaborador"
                          style={{
                            background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe',
                            borderRadius:'10px', padding:'6px 10px', fontSize:'12px',
                            fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px',
                            transition:'all 0.2s ease'
                          }}
                          onMouseOver={e => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.color = 'white' }}
                          onMouseOut={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#3b82f6' }}
                      >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                          Editar
                      </button>
                      <button 
                          onClick={() => navigate(`/admin/registros/${p.codigo}`)}
                          className="btn-view-profile"
                          title="Ver historial de registros"
                      >
                          <span>Registros</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                          </svg>
                      </button>
                    </div>
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