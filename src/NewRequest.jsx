import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Swal from 'sweetalert2'
import './App.css'

function NewRequest() {
  const { codigo } = useParams()
  const navigate = useNavigate()

  // --- ESTADOS ---
  const [trabajador, setTrabajador] = useState(null)
  const [horarioSemana, setHorarioSemana] = useState([])
  const [enviando, setEnviando] = useState(false)

  // Estados del Formulario
  const [tipoSolicitud, setTipoSolicitud] = useState('')
  const [lugarTrabajo, setLugarTrabajo] = useState('')
  const [tipoMarcacion, setTipoMarcacion] = useState('')
  const [requerimiento, setRequerimiento] = useState('')

  // --- FECHAS Y HORAS ---
  const [fechaDia, setFechaDia] = useState('') 
  
  // Horario Programado
  const [progInicio, setProgInicio] = useState('') 
  const [progFin, setProgFin] = useState('')
  const [turnoInfo, setTurnoInfo] = useState('Selecciona una fecha')

  // Horario Real
  const [realInicio, setRealInicio] = useState('')
  const [realFin, setRealFin] = useState('')

  const opcionesSolicitud = [
    "COMPENSACIÓN POR TRASLADO DE VIAJE", "COMPENSACIÓN A FAVOR DE CIPSA", 
    "POR SALIDAS ANTES DE HORARIO", "VACACIONES", "ONOMASTICO", 
    "SOBRETIEMPO EN CLIENTE", "SOBRETIEMPO EN CIPSA"
  ]

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const cargarDatos = async () => {
        const { data: dataTrabajador } = await supabase.from('personal').select('*').eq('codigo', codigo).single()
        setTrabajador(dataTrabajador)
        const { data: dataSemana } = await supabase.rpc('obtener_horario_semana', { codigo_user: codigo })
        if (dataSemana) setHorarioSemana(dataSemana)
    }
    cargarDatos()
  }, [codigo])

  // --- DETECTAR HORARIO PROGRAMADO ---
  useEffect(() => {
    if (!fechaDia || horarioSemana.length === 0) return
    const fechaObj = new Date(fechaDia + 'T00:00:00')
    let diaNum = fechaObj.getDay()
    if (diaNum === 0) diaNum = 7 

    const horarioDia = horarioSemana.find(h => h.dia_semana === diaNum)
    if (horarioDia) {
        setProgInicio(horarioDia.hora_entrada.slice(0,5))
        setProgFin(horarioDia.hora_salida.slice(0,5))
        setTurnoInfo(`Horario Regular: ${horarioDia.hora_entrada.slice(0,5)} - ${horarioDia.hora_salida.slice(0,5)}`)
    } else {
        setProgInicio('')
        setProgFin('')
        setTurnoInfo('Día Libre / Sin turno asignado')
    }
  }, [fechaDia, horarioSemana])

  // --- 🧮 CÁLCULO INTELIGENTE (INICIO + FIN) ---
  const previewCalculo = useMemo(() => {
    if (!realInicio || !realFin) return null
    if (!tipoSolicitud) return { texto: 'Selecciona tipo solicitud', color: 'gray' }

    const getMins = (time) => {
        const [h, m] = time.split(':').map(Number)
        return h * 60 + m
    }

    let minutosTotales = 0
    let detalles = [] // Para explicarle al usuario de dónde salen los minutos
    
    const rIn = getMins(realInicio)
    const rOut = getMins(realFin)
    const pIn = progInicio ? getMins(progInicio) : 0
    const pOut = progFin ? getMins(progFin) : 0

    // GRUPO QUE SUMA (SOBRETIEMPO)
    if (["SOBRETIEMPO EN CLIENTE", "SOBRETIEMPO EN CIPSA", "COMPENSACIÓN POR TRASLADO DE VIAJE"].includes(tipoSolicitud)) {
        if (pOut > 0) {
            // 1. ¿Entró antes? (Ganancia al inicio)
            if (rIn < pIn) {
                const extraInicio = pIn - rIn
                minutosTotales += extraInicio
                detalles.push(`${extraInicio}m antes del ingreso`)
            }
            // 2. ¿Salió después? (Ganancia al final)
            if (rOut > pOut) {
                const extraFin = rOut - pOut
                minutosTotales += extraFin
                detalles.push(`${extraFin}m después de salida`)
            }

            if (minutosTotales === 0) return { texto: 'No hay tiempo extra registrado', color: 'red' }
        } else {
            // Día libre: Cuenta todo
            minutosTotales = rOut - rIn
            detalles.push("Día libre (Total)")
        }
    } 
    // GRUPO QUE RESTA (DEUDAS)
    else if (["COMPENSACIÓN A FAVOR DE CIPSA", "POR SALIDAS ANTES DE HORARIO"].includes(tipoSolicitud)) {
        if (pOut > 0) {
             // 1. ¿Llegó tarde?
             if (rIn > pIn) {
                 const deudaInicio = rIn - pIn
                 minutosTotales += deudaInicio
                 detalles.push(`${deudaInicio}m tardanza`)
             }
             // 2. ¿Salió antes?
             if (rOut < pOut) {
                 const deudaFin = pOut - rOut
                 minutosTotales += deudaFin
                 detalles.push(`${deudaFin}m salida anticipada`)
             }
             if (minutosTotales === 0) return { texto: 'Cumpliste tu horario (Sin deuda)', color: 'orange' }
        }
    } else {
        return { texto: 'Informativo', color: 'blue', subtexto: 'No calcula balance' }
    }

    const h = Math.floor(minutosTotales / 60)
    const m = minutosTotales % 60
    
    return { 
        texto: `${h}h ${m}m`, 
        subtexto: detalles.join(' + '), // Ej: "30m antes + 30m despues"
        color: 'green',
        minutos: minutosTotales
    }

  }, [realInicio, realFin, progInicio, progFin, tipoSolicitud])


  // --- GUARDADO ---
  const guardarRegistro = async (e) => {
    e.preventDefault()
    if (!fechaDia || !realInicio || !realFin) return Swal.fire('Faltan datos', 'Completa la fecha y horas reales', 'warning')
    
    setEnviando(true)

    let fechaInicioGuardar, fechaFinGuardar

    // Si hay un cálculo matemático válido (Sobretiempo o Deuda), construimos fechas virtuales
    if (previewCalculo && previewCalculo.minutos > 0) {
        // Truco: Usamos la hora de salida programada como base
        // Inicio = Salida Programada
        // Fin = Salida Programada + Minutos Totales
        // Así la diferencia matemática es exacta.
        
        // Base: Hora salida programada (o una hora X si es dia libre)
        const baseTimeStr = progFin || "12:00" 
        
        fechaInicioGuardar = new Date(`${fechaDia}T${baseTimeStr}:00`)
        fechaFinGuardar = new Date(fechaInicioGuardar.getTime() + (previewCalculo.minutos * 60000))
        
    } else {
        // Si no hay cálculo (ej: vacaciones o sin diferencia), guardamos las fechas reales tal cual
        fechaInicioGuardar = new Date(`${fechaDia}T${realInicio}:00`)
        fechaFinGuardar = new Date(`${fechaDia}T${realFin}:00`)
    }

    const datosParaGuardar = { 
        nombre_empleado: `${trabajador.nombres} ${trabajador.apellidos}`, 
        codigo_trabajador: trabajador.codigo, 
        area: trabajador.area, 
        cargo: trabajador.cargo, 
        tipo_solicitud: tipoSolicitud, 
        requerimiento: requerimiento, 
        lugar_trabajo: lugarTrabajo, 
        tipo_de_marcacion: tipoMarcacion, 
        
        // FECHAS MATEMÁTICAS (Para que el balance sume/reste bien)
        fecha_hora_inicio: fechaInicioGuardar, 
        fecha_hora_fin: fechaFinGuardar,
        
        // FECHAS REALES (Para que se vea en el detalle qué pasó realmente)
        ingreso: new Date(`${fechaDia}T${realInicio}:00`),
        salida: new Date(`${fechaDia}T${realFin}:00`)
    }
    
    const { error } = await supabase.from('registro_horas').insert([datosParaGuardar])
    
    setEnviando(false)
    if (error) {
        Swal.fire('Error', error.message, 'error')
    } else { 
        Swal.fire({ title: '¡Listo!', text: 'Registro procesado correctamente', icon: 'success', confirmButtonColor: '#7db100' })
        navigate(`/registros/${codigo}`)
    }
  }

  if (!trabajador) return <div className="container"><p style={{textAlign:'center'}}>Cargando información...</p></div>

  return (
    <div className="container container-wide">
        <div className="header-profile-bar">
            <h2 className="heading" style={{margin: 0, textAlign:'left'}}>📝 Nueva Solicitud</h2>
            <button onClick={() => navigate(`/registros/${codigo}`)} className="btn-back">❌ Cancelar</button>
        </div>

        <form onSubmit={guardarRegistro}>
            <h4 className="section-title">1. Detalles</h4>
            <div className="form-grid-4">
              <div className="span-2">
                <label className="label">Tipo de Solicitud *</label>
                <select className="input" value={tipoSolicitud} onChange={(e) => setTipoSolicitud(e.target.value)} required>
                  <option value="">Selecciona una opción</option>
                  {opcionesSolicitud.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </div>
              <div><label className="label">Lugar *</label><select className="input" value={lugarTrabajo} onChange={(e) => setLugarTrabajo(e.target.value)} required><option value="">Elegir</option><option value="CIPSA">CIPSA</option><option value="CLIENTE">CLIENTE</option></select></div>
              <div><label className="label">Marcación *</label><select className="input" value={tipoMarcacion} onChange={(e) => setTipoMarcacion(e.target.value)} required><option value="">Elegir</option><option value="TRAKKER">TRAKKER</option><option value="APP">APP</option></select></div>
              <div className="span-4"><label className="label">Requerimiento</label><input className="input" type="text" placeholder="Ej. REQ-001" value={requerimiento} onChange={(e) => setRequerimiento(e.target.value)} /></div>
            </div>

            <h4 className="section-title">2. Cálculo Automático</h4>
            
            <div className="form-grid-4" style={{alignItems: 'center', marginBottom: '15px'}}>
                 <div className="span-2"><label className="label">Fecha del Evento *</label><input type="date" className="input" value={fechaDia} onChange={e => setFechaDia(e.target.value)} required /></div>
                 <div className="span-2">
                    <div style={{background: '#f1f5f9', padding: '10px', borderRadius: '10px', marginTop: '15px', borderLeft: '4px solid #193b48'}}>
                        <small style={{display:'block', fontWeight:'bold', color: '#64748b'}}>HORARIO PROGRAMADO</small>
                        <span style={{color: '#193b48', fontWeight: 'bold'}}>{turnoInfo}</span>
                    </div>
                 </div>
            </div>

            <div className="form-grid-4">
              <div><label className="label">Ingreso Real (Trakker) *</label><input type="time" className="input" value={realInicio} onChange={(e) => setRealInicio(e.target.value)} required /></div>
              <div><label className="label">Salida Real (Trakker) *</label><input type="time" className="input" value={realFin} onChange={(e) => setRealFin(e.target.value)} required /></div>

              {/* CARD DE RESULTADO CALCULADO */}
              <div className="span-2">
                 {previewCalculo ? (
                    <div className="input" style={{textAlign: 'center', background: '#f8fafc', border: `2px dashed ${previewCalculo.color === 'green' ? '#22c55e' : previewCalculo.color === 'orange' ? '#f59e0b' : '#e2e8f0'}`}}>
                        <span style={{fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: '#64748b'}}>
                            {previewCalculo.subtexto || "Total a computar"}
                        </span>
                        <br/>
                        <strong style={{fontSize: '24px', color: previewCalculo.color === 'green' ? '#15803d' : previewCalculo.color === 'orange' ? '#d97706' : '#334155'}}>
                            {previewCalculo.texto}
                        </strong>
                    </div>
                 ) : (
                    <div style={{textAlign:'center', marginTop: '25px', color: '#94a3b8', fontSize: '12px'}}>Completa los campos</div>
                 )}
              </div>
            </div>

            <button type="submit" className="login-button" disabled={enviando} style={{marginTop: '30px'}}>
              {enviando ? 'Procesando...' : 'GUARDAR SOLICITUD'}
            </button>
        </form>
    </div>
  )
}
export default NewRequest