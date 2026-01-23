import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Swal from 'sweetalert2'
import './App.css'

function App() {
  const navigate = useNavigate()
  
  const [codigoInput, setCodigoInput] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [trabajador, setTrabajador] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [horarioHoy, setHorarioHoy] = useState(null)
  
  // NUEVO: Estado para guardar la semana completa
  const [horarioSemana, setHorarioSemana] = useState([]) 

  const [tipoSolicitud, setTipoSolicitud] = useState('')
  const [lugarTrabajo, setLugarTrabajo] = useState('')
  const [tipoMarcacion, setTipoMarcacion] = useState('')
  const [requerimiento, setRequerimiento] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [ingreso, setIngreso] = useState('')
  const [salida, setSalida] = useState('')

  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos%20personal/`

  const opcionesSolicitud = [
    "COMPENSACIÓN POR TRASLADO DE VIAJE", "COMPENSACIÓN A FAVOR DE CIPSA", 
    "POR SALIDAS ANTES DE HORARIO", "VACACIONES", "ONOMASTICO", 
    "SOBRETIEMPO EN CLIENTE", "SOBRETIEMPO EN CIPSA"
  ]

  // Array para traducir los números de día (1-7) a texto
  const diasSemana = [null, 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

  const buscarTrabajador = async () => {
    if (!codigoInput) return Swal.fire({title: '¡Ups!', text: 'Ingresa un código', icon: 'warning', confirmButtonColor: '#193b48'})
    
    setBuscando(true)
    setTrabajador(null)
    setHorarioHoy(null)
    setHorarioSemana([])

    const { data: dataTrabajador, error: errorTrabajador } = await supabase
      .from('personal').select('*').eq('codigo', codigoInput).single()

    if (errorTrabajador || !dataTrabajador) {
      Swal.fire({title: 'No encontrado', text: 'Verifica el código', icon: 'error', confirmButtonColor: '#d33'})
    } else {
      setTrabajador(dataTrabajador)
      
      // 1. Horario de Hoy
      const { data: dataHorario } = await supabase.rpc('obtener_horario_hoy', { codigo_user: codigoInput })
      if (dataHorario && dataHorario.length > 0) setHorarioHoy(dataHorario[0])

      // 2. NUEVO: Horario de la Semana Entera
      const { data: dataSemana } = await supabase.rpc('obtener_horario_semana', { codigo_user: codigoInput })
      if (dataSemana) setHorarioSemana(dataSemana)
    }
    setBuscando(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); buscarTrabajador(); }
  }

  const guardarRegistro = async (e) => {
    e.preventDefault()
    // ... (Tu misma lógica de guardado de siempre) ...
    setEnviando(true)
    const datosParaGuardar = { nombre_empleado: `${trabajador.nombres} ${trabajador.apellidos}`, codigo_trabajador: trabajador.codigo, area: trabajador.area, cargo: trabajador.cargo, tipo_solicitud: tipoSolicitud, requerimiento: requerimiento, lugar_trabajo: lugarTrabajo, tipo_de_marcacion: tipoMarcacion, fecha_hora_inicio: new Date(fechaInicio), fecha_hora_fin: new Date(fechaFin), ingreso: ingreso ? new Date(ingreso) : null, salida: salida ? new Date(salida) : null }
    const { error } = await supabase.from('registro_horas').insert([datosParaGuardar])
    if (error) Swal.fire('Error', error.message, 'error')
    else { Swal.fire({ title: '¡Listo!', text: 'Registro guardado', icon: 'success', confirmButtonColor: '#7db100' }); setRequerimiento(''); setTipoSolicitud(''); setFechaInicio(''); setFechaFin(''); setIngreso(''); setSalida(''); }
    setEnviando(false)
  }

  // Obtenemos el día actual (1=Lunes, 7=Domingo) para resaltarlo en la lista
  const diaHoyNum = new Date().getDay() === 0 ? 7 : new Date().getDay()

  return (
    <div className="container">
      <h1 className="heading">Portal de Horas</h1>

      <div className="input-group">
        <input className="input" type="text" placeholder="Código de Colaborador" value={codigoInput} onChange={(e) => setCodigoInput(e.target.value)} onKeyDown={handleKeyDown} autoFocus />
        <button type="button" className="login-button search-btn" onClick={buscarTrabajador} disabled={buscando}>{buscando ? '...' : '🔍'}</button>
      </div>

      {trabajador && (
        <div className="fade-in">
          <div className="employee-card" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '15px', width: '100%', alignItems: 'center' }}>
                <img src={trabajador.foto ? `${STORAGE_URL}${trabajador.foto}` : ''} alt="Avatar" className="avatar" onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${trabajador.nombres}`} />
                <div className="employee-info" style={{ flex: 1 }}>
                  <h3>{trabajador.nombres.split(' ')[0]} {trabajador.apellidos.split(' ')[0]}</h3>
                  <span className="badge badge-cargo">{trabajador.cargo}</span>
                </div>
                <button className="btn-small" onClick={() => navigate(`/registros/${trabajador.codigo}`)}>Historial</button>
            </div>

            {/* --- WIDGET DE HORARIO CON HOVER (TOOLTIP) --- */}
            {horarioHoy ? (
              <div className="schedule-widget hover-trigger">
                <span className="schedule-icon">⏰</span>
                <div className="schedule-details">
                  <span className="schedule-label">TURNO: {horarioHoy.tipo_turno}</span>
                  <span className="schedule-time">
                    {horarioHoy.hora_entrada.slice(0,5)} <span style={{color: '#94a3b8', fontWeight: 'normal'}}>a</span> {horarioHoy.hora_salida.slice(0,5)}
                  </span>
                </div>
                <div className="schedule-status-dot"></div>
                
                {/* CAJA OCULTA: Detalles de la semana */}
                <div className="weekly-tooltip">
                  <div className="weekly-header">
                    <span>📅 Horario Semanal</span>
                  </div>
                  <ul className="weekly-list">
                    {horarioSemana.map((dia) => (
                      <li key={dia.dia_semana} className={dia.dia_semana === diaHoyNum ? 'today' : ''}>
                        <span className="day-name">{diasSemana[dia.dia_semana]}</span>
                        <span className="day-time">
                          {dia.hora_entrada.slice(0,5)} - {dia.hora_salida.slice(0,5)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            ) : (
              <div className="schedule-widget empty">
                <span className="schedule-icon">🌴</span>
                <div className="schedule-details">
                  <span className="schedule-label" style={{color: '#64748b'}}>Sin turno asignado</span>
                  <span className="schedule-time" style={{color: '#94a3b8'}}>Día Libre</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={guardarRegistro}>
            <label className="label">Tipo de Solicitud *</label><select className="input" value={tipoSolicitud} onChange={(e) => setTipoSolicitud(e.target.value)} required><option value="">Selecciona una opción</option>{opcionesSolicitud.map(op => <option key={op} value={op}>{op}</option>)}</select>
            <div className="row"><div className="col"><label className="label">Lugar *</label><select className="input" value={lugarTrabajo} onChange={(e) => setLugarTrabajo(e.target.value)} required><option value="">Elegir</option><option value="CIPSA">CIPSA</option><option value="CLIENTE">CLIENTE</option></select></div><div className="col"><label className="label">Marcación *</label><select className="input" value={tipoMarcacion} onChange={(e) => setTipoMarcacion(e.target.value)} required><option value="">Elegir</option><option value="TRAKKER">TRAKKER</option><option value="APP">APP</option></select></div></div>
            <label className="label">Requerimiento (Opcional)</label><input className="input" type="text" placeholder="Ej. REQ-001" value={requerimiento} onChange={(e) => setRequerimiento(e.target.value)} />
            <label className="label">Sobretiempo (Inicio - Fin) *</label><div className="row"><input className="input" type="datetime-local" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} required /><input className="input" type="datetime-local" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} required /></div>
            <label className="label">Marcación Real (Ingreso - Salida)</label><div className="row"><input className="input" type="datetime-local" value={ingreso} onChange={(e) => setIngreso(e.target.value)} /><input className="input" type="datetime-local" value={salida} onChange={(e) => setSalida(e.target.value)} /></div>
            <button type="submit" className="login-button" disabled={enviando}>{enviando ? 'Guardando...' : 'REGISTRAR'}</button>
          </form>
        </div>
      )}

      <div style={{position: 'fixed', bottom: '20px', right: '20px'}}><button onClick={() => navigate('/admin')} style={{ background: '#193b48', color: 'white', border: 'none', borderRadius: '50px', padding: '10px 20px', fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>🔒 Soy Admin</button></div>
    </div>
  )
}

export default App