import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Swal from 'sweetalert2'
import './App.css'

function NewRequest() {
  const { codigo, nroRegistro } = useParams()
  const navigate = useNavigate()
  const esEdicion = !!nroRegistro

  // --- ESTADOS ---
  const [trabajador, setTrabajador] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(esEdicion)

  const [tipoSolicitud, setTipoSolicitud] = useState('')
  const [requerimiento, setRequerimiento] = useState('')
  const [motivo, setMotivo] = useState('') 
  const [lugarTrabajo, setLugarTrabajo] = useState('')
  const [tipoMarcacion, setTipoMarcacion] = useState('')
  
  const [configUI, setConfigUI] = useState({ lugarDisabled: false, lugarOpciones: [], reqDisabled: false })

  const [fechaDia, setFechaDia] = useState('') 
  const [progInicio, setProgInicio] = useState('') 
  const [progFin, setProgFin] = useState('')
  const [turnoInfo, setTurnoInfo] = useState('-- : --') 
  const [realInicio, setRealInicio] = useState('')
  const [realFin, setRealFin] = useState('')

  const opcionesSolicitud = [
    "COMPENSACIÓN POR TRASLADO DE VIAJE", 
    "COMPENSACIÓN A FAVOR DE CIPSA", 
    "POR SALIDAS ANTES DE HORARIO", 
    "SOBRETIEMPO EN CLIENTE", 
    "SOBRETIEMPO EN CIPSA"
  ]

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const cargarUsuario = async () => {
        const { data } = await supabase.from('personal').select('*').eq('codigo', codigo).single()
        setTrabajador(data)
    }
    cargarUsuario()
  }, [codigo])

  // Lógica de Bloqueos
  useEffect(() => {
      if (!cargandoDatos) {
          switch (tipoSolicitud) {
              case "COMPENSACIÓN POR TRASLADO DE VIAJE":
                  setLugarTrabajo("CLIENTE"); 
                  setConfigUI({ lugarDisabled: true, lugarOpciones: ["CLIENTE"], reqDisabled: false }); 
                  break;
              case "COMPENSACIÓN A FAVOR DE CIPSA":
                  setLugarTrabajo(""); 
                  setConfigUI({ lugarDisabled: false, lugarOpciones: ["CIPSA", "CLIENTE"], reqDisabled: false }); 
                  break;
              case "POR SALIDAS ANTES DE HORARIO":
                  setLugarTrabajo("N/A"); 
                  setConfigUI({ lugarDisabled: true, lugarOpciones: ["N/A"], reqDisabled: false }); 
                  break;
              case "SOBRETIEMPO EN CLIENTE":
                  setLugarTrabajo("CLIENTE"); 
                  setConfigUI({ lugarDisabled: true, lugarOpciones: ["CLIENTE"], reqDisabled: false }); 
                  break;
              case "SOBRETIEMPO EN CIPSA":
                  setLugarTrabajo("CIPSA"); 
                  setConfigUI({ lugarDisabled: true, lugarOpciones: ["CIPSA"], reqDisabled: false }); 
                  break;
              default:
                  setConfigUI({ lugarDisabled: false, lugarOpciones: [], reqDisabled: false }); 
                  break;
          }
      }
  }, [tipoSolicitud])

  // Carga Edición
  useEffect(() => {
    if (!esEdicion) return
    const cargarRegistro = async () => {
        const { data, error } = await supabase.from('registro_horas').select('*').eq('nro_registro', nroRegistro).single()
        if (error || !data) { navigate(`/registros/${codigo}`); return; }
        
        setTipoSolicitud(data.tipo_solicitud); setLugarTrabajo(data.lugar_trabajo); setTipoMarcacion(data.tipo_de_marcacion)
        setRequerimiento(data.requerimiento || ''); setMotivo(data.motivo || '')
        
        if (data.ingreso) {
            const d = new Date(data.ingreso); const offset = d.getTimezoneOffset()
            setFechaDia(new Date(d.getTime() - (offset*60*1000)).toISOString().split('T')[0])
            setRealInicio(d.toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit', hour12: false}))
        }
        if (data.salida) setRealFin(new Date(data.salida).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit', hour12: false}))
        
        setCargandoDatos(false)
    }
    cargarRegistro()
  }, [nroRegistro, esEdicion, codigo])

  // Detectar Horario
  useEffect(() => {
    if (!fechaDia || !codigo) return
    const consultarHorario = async () => {
        const { data } = await supabase.rpc('obtener_horario_por_fecha', { p_codigo: codigo, p_fecha: fechaDia })
        if (data && data.length > 0) {
            const t = data[0]
            setProgInicio(t.hora_entrada.slice(0,5))
            setProgFin(t.hora_salida.slice(0,5))
            setTurnoInfo(`${t.hora_entrada.slice(0,5)} - ${t.hora_salida.slice(0,5)}`)
        } else {
            setProgInicio(''); setProgFin('')
            setTurnoInfo('Día Libre')
        }
    }
    if (!cargandoDatos) consultarHorario()
  }, [fechaDia, codigo, cargandoDatos])

  // Cálculo
  const previewCalculo = useMemo(() => {
    if (!realInicio || !realFin) return null
    if (!tipoSolicitud) return { texto: 'Seleccione solicitud...', color: 'gray' }

    const getMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    let minsTotal = 0; let detalles = []
    const rIn = getMins(realInicio); const rOut = getMins(realFin)
    const pIn = progInicio ? getMins(progInicio) : 0; const pOut = progFin ? getMins(progFin) : 0

    const gruposSumar = ["COMPENSACIÓN POR TRASLADO DE VIAJE", "SOBRETIEMPO EN CLIENTE", "SOBRETIEMPO EN CIPSA"]
    const gruposRestar = ["COMPENSACIÓN A FAVOR DE CIPSA", "POR SALIDAS ANTES DE HORARIO"]

    if (gruposSumar.includes(tipoSolicitud)) {
        if (pOut > 0) {
            if (rIn < pIn) { minsTotal += (pIn - rIn); detalles.push(`${pIn - rIn}m antes`) }
            if (rOut > pOut) { minsTotal += (rOut - pOut); detalles.push(`${rOut - pOut}m después`) }
            if (minsTotal === 0) return { texto: 'SIN DIFERENCIA', color: '#64748b', bg: '#f1f5f9', icon: '⚖️' }
        } else {
            minsTotal = rOut - rIn; detalles.push("Día libre")
        }
        return { texto: `+${Math.floor(minsTotal/60)}h ${minsTotal%60}m A FAVOR`, subtexto: detalles.join(' + '), color: '#15803d', bg: '#dcfce7', icon: '💰', border: '#34d399', mins: minsTotal }
    } 
    else if (gruposRestar.includes(tipoSolicitud)) {
        if (pOut > 0) {
             if (rIn > pIn) { minsTotal += (rIn - pIn); detalles.push(`${rIn - pIn}m tarde`) }
             if (rOut < pOut) { minsTotal += (pOut - rOut); detalles.push(`${pOut - rOut}m antes`) }
             if (minsTotal === 0) return { texto: 'CUMPLIÓ HORARIO', color: '#78350f', bg: '#fef3c7', icon: '✅' }
        }
        return { texto: `-${Math.floor(minsTotal/60)}h ${minsTotal%60}m A DESCONTAR`, subtexto: detalles.join(' + '), color: '#7f1d1d', bg: '#fee2e2', icon: '📉', border: '#f87171', mins: minsTotal }
    }
    return null
  }, [realInicio, realFin, progInicio, progFin, tipoSolicitud])

  // Guardar
  const guardarRegistro = async (e) => {
    e.preventDefault()
    if (!fechaDia || !realInicio || !realFin) return Swal.fire('Faltan datos', 'Completa fecha y horas', 'warning')
    setEnviando(true)

    let fInicio, fFin
    if (previewCalculo && previewCalculo.mins > 0) {
        const base = progFin || "12:00"
        fInicio = new Date(`${fechaDia}T${base}:00`)
        fFin = new Date(fInicio.getTime() + (previewCalculo.mins * 60000))
    } else {
        fInicio = new Date(`${fechaDia}T${realInicio}:00`)
        fFin = new Date(`${fechaDia}T${realFin}:00`)
    }

    const payload = { 
        nombre_empleado: trabajador ? `${trabajador.nombres} ${trabajador.apellidos}` : '', 
        codigo_trabajador: codigo, area: trabajador?.area, cargo: trabajador?.cargo, 
        tipo_solicitud: tipoSolicitud, requerimiento: requerimiento, motivo: motivo, 
        lugar_trabajo: lugarTrabajo, tipo_de_marcacion: tipoMarcacion, 
        fecha_hora_inicio: fInicio, fecha_hora_fin: fFin, 
        ingreso: new Date(`${fechaDia}T${realInicio}:00`), salida: new Date(`${fechaDia}T${realFin}:00`), 
        estado: 'Pendiente' 
    }
    
    const { error } = esEdicion ? await supabase.from('registro_horas').update(payload).eq('nro_registro', nroRegistro) : await supabase.from('registro_horas').insert([payload])
    
    setEnviando(false)
    if (error) Swal.fire('Error', error.message, 'error')
    else { 
        Swal.fire({ title: '¡Procesado!', text: 'Registro guardado correctamente', icon: 'success', timer: 1500, showConfirmButton: false })
        navigate(`/registros/${codigo}`)
    }
  }

  if (cargandoDatos || !trabajador) return <div className="container"><p style={{textAlign:'center'}}>Cargando...</p></div>

  // ESTILOS COMUNES PARA INPUTS REDONDEADOS
  const roundedInputStyle = {
      borderRadius: '12px', // Curva suave para inputs
      border: '1px solid #e2e8f0',
      padding: '8px 12px'
  }

  return (
    <div className="container container-wide" style={{
        maxWidth:'800px', 
        borderTop: '6px solid #7db100', 
        borderRadius: '24px', // --- CONTENEDOR MUY REDONDO ---
        boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
    }}>
        <div className="header-profile-bar" style={{paddingBottom:'15px', marginBottom:'15px', borderBottom:'1px dashed #e2e8f0'}}>
            <div style={{display:'flex', flexDirection:'column'}}>
                <h2 className="heading" style={{margin:0, textAlign:'left', fontSize:'22px', display:'flex', alignItems:'center', gap:'8px'}}>
                    <span style={{color:'#7db100', fontSize:'24px'}}>📝</span> 
                    {esEdicion ? 'Editar Registro' : 'Nueva Solicitud'}
                </h2>
                {esEdicion && <span style={{fontSize:'12px', color:'#64748b', marginLeft:'36px'}}>Folio Nro. <strong>{String(nroRegistro).padStart(6,'0')}</strong></span>}
            </div>
            <button onClick={() => navigate(`/registros/${codigo}`)} className="btn-back" style={{borderRadius: '20px'}}>✕ Cancelar</button>
        </div>

        {/* FICHA USUARIO REDONDEADA */}
        <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            background:'#fff', 
            borderLeft:'5px solid #7db100', 
            boxShadow: '0 4px 15px -3px rgba(0,0,0,0.05)',
            borderRadius:'16px', // --- TARJETA REDONDA ---
            padding:'15px 25px', marginBottom:'25px'
        }}>
             <div>
                 <div style={{fontSize:'16px', fontWeight:'800', color:'#193b48'}}>{trabajador.nombres} {trabajador.apellidos}</div>
                 <div style={{fontSize:'12px', color:'#64748b', display:'flex', gap:'15px', marginTop:'4px'}}>
                     <span style={{display:'flex', alignItems:'center', gap:'4px'}}>🆔 <strong>{codigo}</strong></span>
                     <span style={{display:'flex', alignItems:'center', gap:'4px'}}>🛠️ {trabajador.cargo}</span>
                 </div>
             </div>
             <div style={{textAlign:'right'}}>
                 <span style={{fontSize:'10px', background:'#f0fdf4', color:'#15803d', padding:'6px 12px', borderRadius:'20px', border:'1px solid #bbf7d0', fontWeight:'bold'}}>
                    {trabajador.area}
                 </span>
             </div>
        </div>

        <form onSubmit={guardarRegistro}>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'20px'}}>
                
                {/* FILA 1 */}
                <div style={{gridColumn:'span 2', display:'grid', gridTemplateColumns:'2fr 1fr', gap:'20px'}}>
                    <div>
                        <label className="label">Tipo de Solicitud</label>
                        <select className="input" value={tipoSolicitud} onChange={(e) => setTipoSolicitud(e.target.value)} required disabled={esEdicion} style={{...roundedInputStyle, fontWeight:'500'}}>
                            <option value="">Seleccione el tipo...</option>
                            {opcionesSolicitud.map(op => <option key={op} value={op}>{op}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Requerimiento</label>
                        <input className="input" type="text" placeholder={configUI.reqDisabled ? "N/A" : "Ej. 202*******"} value={requerimiento} onChange={(e) => setRequerimiento(e.target.value)} disabled={configUI.reqDisabled} style={{...roundedInputStyle, background: configUI.reqDisabled ? '#f1f5f9' : 'white'}} />
                    </div>
                </div>

                {/* FILA 2 */}
                <div>
                    <label className="label">Lugar</label>
                    <select className="input" value={lugarTrabajo} onChange={(e) => setLugarTrabajo(e.target.value)} required disabled={configUI.lugarDisabled && configUI.lugarOpciones.length === 1} style={{...roundedInputStyle, background: configUI.lugarDisabled ? '#f8fafc' : 'white'}}>
                        {configUI.lugarOpciones.length > 0 ? configUI.lugarOpciones.map(op => <option key={op} value={op}>{op}</option>) : <><option value="">Elegir...</option><option value="CIPSA">CIPSA</option><option value="CLIENTE">CLIENTE</option></>}
                    </select>
                </div>
                <div>
                    <label className="label">Marcación</label>
                    <select className="input" value={tipoMarcacion} onChange={(e) => setTipoMarcacion(e.target.value)} required style={roundedInputStyle}>
                        <option value="">Elegir...</option><option value="TRAKKER">TRAKKER</option><option value="APP">APP</option>
                    </select>
                </div>
                
                <div style={{gridColumn:'span 2'}}>
                    <label className="label">Detalles / Motivo <span style={{fontSize:'11px', color:'#94a3b8', fontWeight:'normal'}}>(Opcional)</span></label>
                    <input className="input" type="text" placeholder="Describe brevemente la actividad..." value={motivo} onChange={e => setMotivo(e.target.value)} style={roundedInputStyle} />
                </div>

                <div style={{gridColumn:'span 2', height:'1px', background:'#e2e8f0', margin:'10px 0'}}></div>

                {/* FILA 3: HORARIO REDONDEADO */}
                <div style={{gridColumn:'span 2', display:'flex', gap:'20px', alignItems:'flex-start'}}>
                    <div style={{flex: 1.3}}>
                        <label className="label">Fecha y Turno</label>
                        <div style={{display:'flex', gap:'10px', alignItems: 'stretch'}}>
                            <input type="date" className="input" value={fechaDia} onChange={e => setFechaDia(e.target.value)} required style={{...roundedInputStyle, flex:1}} />
                            
                            <div style={{
                                background: '#193b48', color: 'white', 
                                borderBottom: '4px solid #7db100', 
                                borderRadius:'12px', // --- TICKET REDONDO ---
                                padding:'0 15px', 
                                display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', 
                                minWidth:'130px', boxShadow: '0 4px 10px -2px rgba(0,0,0,0.2)'
                            }}>
                                <span style={{fontSize:'10px', color: '#7db100', fontWeight:'bold', letterSpacing:'1px', marginTop:'5px'}}>HORARIO</span>
                                <div style={{fontSize:'15px', fontWeight:'bold', marginBottom:'5px'}}>{turnoInfo === 'Día Libre' ? 'LIBRE' : turnoInfo}</div>
                            </div>
                        </div>
                    </div>
                    <div style={{flex:1, display:'flex', gap:'10px'}}>
                        <div style={{flex:1}}>
                            <label className="label" style={{color:'#193b48'}}>Ingreso Real</label>
                            <input type="time" className="input" value={realInicio} onChange={(e) => setRealInicio(e.target.value)} required style={{...roundedInputStyle, borderColor:'#cbd5e1', background:'#f8fafc'}} />
                        </div>
                        <div style={{flex:1}}>
                            <label className="label" style={{color:'#193b48'}}>Salida Real</label>
                            <input type="time" className="input" value={realFin} onChange={(e) => setRealFin(e.target.value)} required style={{...roundedInputStyle, borderColor:'#cbd5e1', background:'#f8fafc'}} />
                        </div>
                    </div>
                </div>

                {/* FILA 4: RESULTADO REDONDEADO */}
                <div style={{gridColumn:'span 2', marginTop:'10px'}}>
                    {previewCalculo ? (
                        <div style={{
                            background: previewCalculo.bg, 
                            borderLeft: `5px solid ${previewCalculo.color}`, 
                            borderRadius: '16px', // --- RESULTADO REDONDO ---
                            padding: '15px 25px', 
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            boxShadow: '0 4px 10px -2px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                                <div style={{fontSize:'28px'}}>{previewCalculo.icon}</div>
                                <div>
                                    <strong style={{fontSize:'16px', color: previewCalculo.color, display:'block', textTransform:'uppercase'}}>{previewCalculo.texto}</strong>
                                    <span style={{fontSize:'12px', color:'#475569'}}>{previewCalculo.subtexto}</span>
                                </div>
                            </div>
                            {previewCalculo.mins !== 0 && (
                                <div style={{textAlign:'right'}}>
                                    <div style={{fontSize:'9px', color:'#64748b', fontWeight:'bold', textTransform:'uppercase'}}>Diferencia</div>
                                    <div style={{fontSize:'20px', fontWeight:'800', color: previewCalculo.color}}>{Math.abs(previewCalculo.mins)} min</div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{textAlign:'center', padding:'15px', background:'#f1f5f9', color:'#94a3b8', borderRadius:'12px', fontSize:'13px', border:'1px dashed #cbd5e1'}}>
                            ⏳ Ingresa las horas reales para calcular el balance
                        </div>
                    )}
                </div>
            </div>

            <button 
                type="submit" 
                className="login-button" 
                disabled={enviando} 
                style={{
                    marginTop: '30px', 
                    width: '100%',
                    padding:'14px', 
                    fontSize:'16px', 
                    fontWeight:'bold', 
                    textTransform:'uppercase', 
                    letterSpacing:'1px', 
                    borderRadius:'50px', // --- BOTÓN PÍLDORA (MUY REDONDO) ---
                    background: enviando ? '#ccc' : '#7db100', // VERDE DE INICIO
                    color: 'white',
                    border: 'none',
                    cursor: enviando ? 'not-allowed' : 'pointer',
                    boxShadow: '0 8px 20px -5px rgba(125, 177, 0, 0.4)', // SOMBRA VERDE
                    transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => !enviando && (e.target.style.background = '#193b48')} 
                onMouseOut={(e) => !enviando && (e.target.style.background = '#7db100')}
            >
              {enviando ? 'Guardando...' : esEdicion ? 'ACTUALIZAR SOLICITUD' : 'CONFIRMAR SOLICITUD'}
            </button>
        </form>
    </div>
  )
}
export default NewRequest   