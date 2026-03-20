import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { X, Satellite, Smartphone, Cake, AlertTriangle, Ban, CalendarCheck, Scale, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function NewRequest() {
  const { codigo, nroRegistro } = useParams()
  const navigate = useNavigate()
  const esEdicion = !!nroRegistro

  const [trabajador, setTrabajador] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(esEdicion)

  const [tipoCompensacion, setTipoCompensacion] = useState('')
  const [tipoSolicitud, setTipoSolicitud] = useState('')
  const [requerimiento, setRequerimiento] = useState('')
  const [motivo, setMotivo] = useState('')
  const [lugarTrabajo, setLugarTrabajo] = useState('')
  const [tipoMarcacion, setTipoMarcacion] = useState('')
  const [diaACompensar, setDiaACompensar] = useState('')
  const [diaExtras, setDiaExtras] = useState('')
  const [dispositivoInicio, setDispositivoInicio] = useState('')
  const [dispositivoFin, setDispositivoFin] = useState('')
  const [configUI, setConfigUI] = useState({ lugarDisabled: false, lugarOpciones: [], reqDisabled: false })

  const [fechaDia, setFechaDia] = useState('')
  const [progInicio, setProgInicio] = useState('')
  const [progFin, setProgFin] = useState('')
  const [turnoInfo, setTurnoInfo] = useState('-- : --')
  const [realInicio, setRealInicio] = useState('')
  const [realFin, setRealFin] = useState('')
  const [marcaCargada, setMarcaCargada] = useState(false)
  const [marcasGPS, setMarcasGPS] = useState([])
  const [todasLasMarcas, setTodasLasMarcas] = useState([])

  const [diaLibreOnomastico, setDiaLibreOnomastico] = useState('')
  const [onomasticoInfo, setOnomasticoInfo] = useState(null)
  const [diaLibreEsLaboral, setDiaLibreEsLaboral] = useState(null)
  const [fechaCorteOnomastico, setFechaCorteOnomastico] = useState(null)

  const opcionesCipsa = [
    "POR SALIDA ANTES DE HORARIO",
    "POR INGRESO FUERA DE HORARIO",
    "COMPENSAR HORAS"
  ]

  const opcionesTecnico = [
    "POR TRASLADO DE VIAJE",
    "POR TRASLADO DE EQUIPOS",
    "SOBRETIEMPO",
    "ONOMÁSTICO"
  ]

  const opcionesActuales = useMemo(() => {
    if (tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA') return opcionesCipsa
    if (tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO') return opcionesTecnico
    return []
  }, [tipoCompensacion])

  // --- DATA LOADING ---
  useEffect(() => {
    const cargarUsuario = async () => {
      const { data } = await supabase.from('personal').select('*').eq('codigo', codigo).single()
      setTrabajador(data)
    }
    cargarUsuario()
    const cargarConfig = async () => {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'onomastico_fecha_corte').single()
      if (data) setFechaCorteOnomastico(data.valor)
    }
    cargarConfig()
  }, [codigo])

  // UI locks by solicitud type
  useEffect(() => {
    if (!cargandoDatos) {
      switch (tipoSolicitud) {
        case "POR TRASLADO DE VIAJE":
        case "POR TRASLADO DE EQUIPOS":
        case "SOBRETIEMPO":
          setLugarTrabajo(""); setConfigUI({ lugarDisabled: false, lugarOpciones: ["SERTEC", "CLIENTE"], reqDisabled: false }); break
        case "POR SALIDA ANTES DE HORARIO":
        case "POR INGRESO FUERA DE HORARIO":
        case "COMPENSAR HORAS":
          setLugarTrabajo("N/A"); setConfigUI({ lugarDisabled: true, lugarOpciones: ["N/A"], reqDisabled: false }); break
        case "ONOMÁSTICO":
          setLugarTrabajo("N/A"); setRequerimiento("N/A"); setTipoMarcacion("N/A")
          setConfigUI({ lugarDisabled: true, lugarOpciones: ["N/A"], reqDisabled: true }); break
        default:
          setConfigUI({ lugarDisabled: false, lugarOpciones: [], reqDisabled: false }); break
      }
    }
  }, [tipoSolicitud])

  // Onomástico logic
  useEffect(() => {
    if (tipoSolicitud !== "ONOMÁSTICO" || !trabajador || !fechaCorteOnomastico) {
      setOnomasticoInfo(null); setDiaLibreOnomastico(''); setDiaLibreEsLaboral(null); return
    }
    const cargarOnomastico = async () => {
      if (!trabajador.fecha_nacimiento) { setOnomasticoInfo({ error: 'No se encontró tu fecha de nacimiento en el sistema. Contacta al administrador.' }); return }
      if (!trabajador.fecha_ingreso || new Date(trabajador.fecha_ingreso + 'T00:00:00') > new Date(fechaCorteOnomastico + 'T00:00:00')) {
        const fechaTexto = new Date(fechaCorteOnomastico + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
        setOnomasticoInfo({ error: `Este beneficio solo aplica para personal con fecha de ingreso hasta el ${fechaTexto}.` }); return
      }
      const nacimiento = new Date(trabajador.fecha_nacimiento + 'T00:00:00')
      const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
      const mes = nacimiento.getMonth(), dia = nacimiento.getDate()
      const cumpleEsteAnio = new Date(hoy.getFullYear(), mes, dia)
      const cumpleFecha = cumpleEsteAnio.toISOString().split('T')[0]
      const esDomingo = cumpleEsteAnio.getDay() === 0
      const { data: horarioCumple } = await supabase.rpc('obtener_horario_por_fecha', { p_codigo: codigo, p_fecha: cumpleFecha })
      const cumpleEsLaboral = horarioCumple && horarioCumple.length > 0
      if (esDomingo || !cumpleEsLaboral) {
        const diaSemana = cumpleEsteAnio.toLocaleDateString('es-ES', { weekday: 'long' })
        setOnomasticoInfo({ noCorresponde: true, cumpleTexto: cumpleEsteAnio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }),
          motivoNoCorresponde: esDomingo ? `Tu cumpleaños (${cumpleEsteAnio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}) cae DOMINGO.` : `Tu cumpleaños (${cumpleEsteAnio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}) cae en día no laboral (${diaSemana}).`
        }); return
      }
      const primerDiaMes = new Date(hoy.getFullYear(), mes, 1)
      const ultimoDiaMes = new Date(hoy.getFullYear(), mes + 1, 0)
      const ventanaActiva = hoy.getMonth() === mes && hoy.getFullYear() === cumpleEsteAnio.getFullYear()
      const { data: registrosOnom } = await supabase.from('registro_horas').select('id, estado').eq('codigo_trabajador', codigo).eq('tipo_solicitud', 'ONOMÁSTICO').gte('fecha_hora_inicio', primerDiaMes.toISOString().split('T')[0]).lte('fecha_hora_inicio', ultimoDiaMes.toISOString().split('T')[0])
      const yaUsado = (registrosOnom?.filter(r => r.estado !== 'Rechazado') || []).length > 0
      const mesNombre = cumpleEsteAnio.toLocaleDateString('es-ES', { month: 'long' })
      setOnomasticoInfo({ cumpleTexto: cumpleEsteAnio.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }), rangoInicio: primerDiaMes.toISOString().split('T')[0], rangoFin: ultimoDiaMes.toISOString().split('T')[0], mesTexto: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1), ventanaActiva, yaUsado })
    }
    cargarOnomastico()
  }, [tipoSolicitud, trabajador, codigo, fechaCorteOnomastico])

  useEffect(() => {
    if (tipoSolicitud !== "ONOMÁSTICO" || !diaLibreOnomastico || !codigo) { setDiaLibreEsLaboral(null); return }
    const validar = async () => {
      const { data } = await supabase.rpc('obtener_horario_por_fecha', { p_codigo: codigo, p_fecha: diaLibreOnomastico })
      setDiaLibreEsLaboral(data && data.length > 0)
    }
    validar()
  }, [diaLibreOnomastico, tipoSolicitud, codigo])

  // Edit load
  useEffect(() => {
    if (!esEdicion) return
    const cargarRegistro = async () => {
      const { data, error } = await supabase.from('registro_horas').select('*').eq('nro_registro', nroRegistro).single()
      if (error || !data) { navigate(`/registros/${codigo}`); return }
      if (["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO", "COMPENSAR HORAS"].includes(data.tipo_solicitud)) {
        setTipoCompensacion("COMPENSACIÓN A FAVOR DE CIPSA")
      } else {
        setTipoCompensacion("COMPENSACIÓN A FAVOR DEL TÉCNICO")
      }
      setTipoSolicitud(data.tipo_solicitud); setLugarTrabajo(data.lugar_trabajo); setTipoMarcacion(data.tipo_de_marcacion)
      setDispositivoInicio(data.dispositivo_inicio || ''); setDispositivoFin(data.dispositivo_fin || '');
      setDiaACompensar(data.dia_a_compensar || ''); setDiaExtras(data.dia_extras_registradas || '');
      setRequerimiento(data.requerimiento || ''); setMotivo(data.motivo || '')
      if (data.tipo_solicitud === 'ONOMÁSTICO' && data.fecha_hora_inicio) {
        const d = new Date(data.fecha_hora_inicio); const offset = d.getTimezoneOffset()
        setDiaLibreOnomastico(new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0])
      } else if (data.ingreso) {
        const d = new Date(data.ingreso); const offset = d.getTimezoneOffset()
        setFechaDia(new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0])
        setRealInicio(d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }))
      }
      if (data.tipo_solicitud !== 'ONOMÁSTICO' && data.salida) setRealFin(new Date(data.salida).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }))
      setCargandoDatos(false)
    }
    cargarRegistro()
  }, [nroRegistro, esEdicion, codigo])

  // Schedule detection
  useEffect(() => {
    if (!fechaDia || !codigo) return
    const consultarHorario = async () => {
      try {
        const { data } = await supabase.rpc('obtener_horario_por_fecha', { p_codigo: codigo, p_fecha: fechaDia })
        if (data && data.length > 0) {
          const entrada = data[0].hora_entrada ? data[0].hora_entrada.slice(0, 5) : ''
          const salida = data[0].hora_salida ? data[0].hora_salida.slice(0, 5) : ''
          setProgInicio(entrada); setProgFin(salida)
          setTurnoInfo(entrada && salida ? `${entrada} - ${salida}` : 'Día Libre')
        } else { setProgInicio(''); setProgFin(''); setTurnoInfo('Día Libre') }
      } catch { setProgInicio(''); setProgFin(''); setTurnoInfo('Día Libre') }
    }
    if (!cargandoDatos) consultarHorario()
  }, [fechaDia, codigo, cargandoDatos])

  // Trakker and GPS marks combined
  useEffect(() => {
    if (!fechaDia || !codigo || cargandoDatos) return
    const cargarMarcas = async () => {
      try {
        let marcas = []
        // Trakker
        const { data: d1, error: e1 } = await supabase.from('marcaciones').select('hora_ingreso, hora_salida').eq('codigo_trabajador', codigo).eq('fecha', fechaDia).single()
        if (d1 && !e1) {
          if (d1.hora_ingreso) marcas.push({ hora: d1.hora_ingreso.slice(0, 5), dispositivo: 'TRAKKER' })
          if (d1.hora_salida && d1.hora_salida !== d1.hora_ingreso) marcas.push({ hora: d1.hora_salida.slice(0, 5), dispositivo: 'TRAKKER' })
          setMarcaCargada(true)
        } else {
          setMarcaCargada(false)
        }

        // GPS
        const { data: d2, error: e2 } = await supabase.from('marcaciones_gps').select('fecha_marca').eq('codigo_trabajador', codigo).gte('fecha_marca', `${fechaDia}T00:00:00`).lte('fecha_marca', `${fechaDia}T23:59:59`)
        if (d2 && !e2) {
          d2.forEach(m => {
            const h = new Date(m.fecha_marca).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
            marcas.push({ hora: h, dispositivo: 'APP' })
          })
        }

        // Sort and distinct
        marcas.sort((a, b) => a.hora.localeCompare(b.hora))
        const unicas = marcas.filter((m, index, self) => index === self.findIndex((t) => t.hora === m.hora && t.dispositivo === m.dispositivo))
        setTodasLasMarcas(unicas)

        if (!esEdicion) {
          if (unicas.length > 0) {
            setRealInicio(unicas[0].hora)
            setDispositivoInicio(unicas[0].dispositivo)
            if (unicas.length > 1) {
              setRealFin(unicas[unicas.length - 1].hora)
              setDispositivoFin(unicas[unicas.length - 1].dispositivo)
            } else {
              setRealFin('')
              setDispositivoFin('')
            }
          } else {
            setRealInicio('')
            setRealFin('')
            setDispositivoInicio('')
            setDispositivoFin('')
          }
        }
      } catch (e) {
        setMarcaCargada(false)
        setTodasLasMarcas([])
      }
    }
    cargarMarcas()
  }, [fechaDia, codigo, cargandoDatos, esEdicion])

  // Calculation preview
  const previewCalculo = useMemo(() => {
    if (!realInicio || !realFin) return null
    if (!tipoSolicitud) return { texto: 'Seleccione solicitud...', color: 'gray' }
    if (tipoSolicitud === "ONOMÁSTICO") return null
    const getMins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
    const rIn = getMins(realInicio), rOut = getMins(realFin)
    const pIn = progInicio ? getMins(progInicio) : 0, pOut = progFin ? getMins(progFin) : 0
    const pTotal = pOut > 0 ? (pOut > pIn ? pOut - pIn : (pOut + 1440) - pIn) : 0
    const rTotal = rOut >= rIn ? rOut - rIn : (rOut + 1440) - rIn
    const diffMins = rTotal - pTotal
    if (diffMins === 0) return { texto: 'TIEMPO EXACTO', subtexto: 'Cumplió la jornada sin diferencias', color: '#475569', bg: 'bg-gray-50', icon: Scale, border: 'border-gray-300', mins: 0 }
    if (diffMins > 0) return { texto: `+${Math.floor(diffMins / 60)}h ${diffMins % 60}m A FAVOR`, subtexto: pTotal === 0 ? 'Trabajó en día libre' : 'Excedente luego de descontar tardanzas', color: '#15803d', bg: 'bg-green-50', icon: TrendingUp, border: 'border-green-400', mins: diffMins }
    const absMins = Math.abs(diffMins)
    return { texto: `-${Math.floor(absMins / 60)}h ${absMins % 60}m A DESCONTAR`, subtexto: 'Déficit después de balancear horas', color: '#7f1d1d', bg: 'bg-red-50', icon: TrendingDown, border: 'border-red-400', mins: diffMins }
  }, [realInicio, realFin, progInicio, progFin, tipoSolicitud])

  // Save
  const guardarRegistro = async (e) => {
    e.preventDefault()
    if (tipoSolicitud === "ONOMÁSTICO") {
      if (!diaLibreOnomastico) return Swal.fire('Faltan datos', 'Selecciona el día libre', 'warning')
      if (onomasticoInfo?.yaUsado && !esEdicion) return Swal.fire('Ya registrado', 'Ya tienes un onomástico registrado para este periodo', 'warning')
      if (onomasticoInfo?.noCorresponde) return Swal.fire('No corresponde', 'Tu cumpleaños cae en día no laboral, no aplica el beneficio', 'warning')
      if (!onomasticoInfo?.ventanaActiva && !esEdicion) return Swal.fire('Fuera de plazo', 'Solo puedes registrar onomástico durante el mes de tu cumpleaños', 'warning')
      if (diaLibreEsLaboral === false) return Swal.fire('Día no laboral', 'Debes elegir un día que te toque trabajar', 'warning')
      if (diaLibreOnomastico < onomasticoInfo.rangoInicio || diaLibreOnomastico > onomasticoInfo.rangoFin) return Swal.fire('Fuera de rango', 'El día debe estar dentro del mes de tu cumpleaños', 'warning')
      setEnviando(true)
      const payload = { nombre_empleado: trabajador ? `${trabajador.nombres} ${trabajador.apellidos}` : '', codigo_trabajador: codigo, area: trabajador?.area, cargo: trabajador?.cargo, tipo_solicitud: 'ONOMÁSTICO', requerimiento: 'N/A', motivo: `Día libre por onomástico - Cumpleaños: ${onomasticoInfo.cumpleTexto}`, lugar_trabajo: 'N/A', tipo_de_marcacion: 'N/A', fecha_hora_inicio: new Date(`${diaLibreOnomastico}T00:00:00`), fecha_hora_fin: new Date(`${diaLibreOnomastico}T23:59:59`), ingreso: new Date(`${diaLibreOnomastico}T00:00:00`), salida: new Date(`${diaLibreOnomastico}T23:59:59`), estado: 'Pendiente' }
      const { error } = esEdicion ? await supabase.from('registro_horas').update(payload).eq('nro_registro', nroRegistro) : await supabase.from('registro_horas').insert([payload])
      setEnviando(false)
      if (error) Swal.fire('Error', error.message, 'error')
      else { logBitacora({ usuario: codigo, tipo_usuario: 'empleado', accion: esEdicion ? 'editar' : 'crear', modulo: 'registro_horas', descripcion: `${esEdicion ? 'Editó' : 'Creó'} solicitud ONOMÁSTICO`, registro_id: esEdicion ? String(nroRegistro) : null, datos_nuevos: { tipo_solicitud: 'ONOMÁSTICO', dia_libre: diaLibreOnomastico } }); Swal.fire({ title: '¡Registrado!', text: 'Solicitud de onomástico enviada', icon: 'success', timer: 1500, showConfirmButton: false }); navigate(`/registros/${codigo}`) }
      return
    }
    if (!fechaDia || !realInicio || !realFin) return Swal.fire('Faltan datos', 'Completa fecha y horas', 'warning')
    setEnviando(true)
    let fInicio, fFin
    if (previewCalculo && previewCalculo.mins !== 0) {
      const absMins = Math.abs(previewCalculo.mins)
      fInicio = new Date(`${fechaDia}T${realInicio}:00`); fFin = new Date(fInicio.getTime() + (absMins * 60000))
    } else { fInicio = new Date(`${fechaDia}T${realInicio}:00`); fFin = new Date(`${fechaDia}T${realInicio}:00`) }
    const payload = { nombre_empleado: trabajador ? `${trabajador.nombres} ${trabajador.apellidos}` : '', codigo_trabajador: codigo, area: trabajador?.area, cargo: trabajador?.cargo, tipo_solicitud: tipoSolicitud, requerimiento, motivo, lugar_trabajo: lugarTrabajo, tipo_de_marcacion: tipoMarcacion, dispositivo_inicio: dispositivoInicio, dispositivo_fin: dispositivoFin, dia_a_compensar: diaACompensar, dia_extras_registradas: diaExtras, fecha_hora_inicio: fInicio, fecha_hora_fin: fFin, ingreso: new Date(`${fechaDia}T${realInicio}:00`), salida: new Date(`${fechaDia}T${realFin}:00`), estado: 'Pendiente' }
    const { error } = esEdicion ? await supabase.from('registro_horas').update(payload).eq('nro_registro', nroRegistro) : await supabase.from('registro_horas').insert([payload])
    setEnviando(false)
    if (error) Swal.fire('Error', error.message, 'error')
    else { logBitacora({ usuario: codigo, tipo_usuario: 'empleado', accion: esEdicion ? 'editar' : 'crear', modulo: 'registro_horas', descripcion: `${esEdicion ? 'Editó' : 'Creó'} solicitud ${tipoSolicitud}`, registro_id: esEdicion ? String(nroRegistro) : null, datos_nuevos: { tipo_solicitud: tipoSolicitud, fecha: fechaDia, inicio: realInicio, fin: realFin } }); Swal.fire({ title: '¡Procesado!', text: 'Registro guardado correctamente', icon: 'success', timer: 1500, showConfirmButton: false }); navigate(`/registros/${codigo}`) }
  }

  if (cargandoDatos || !trabajador) return <div className="flex items-center justify-center min-h-[50vh] text-gray-400">Cargando...</div>

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
  const labelCls = "block text-[11px] font-extrabold text-corporate-blue uppercase tracking-wider mb-1"
  const disabledCls = "bg-gray-50 cursor-not-allowed"

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 border-t-4 border-t-corporate-green overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dashed border-gray-200">
          <div>
            <h2 className="text-lg md:text-xl font-black text-corporate-blue flex items-center gap-2">
              <span className="text-corporate-green text-xl">&#9998;</span>
              {esEdicion ? 'Editar Registro' : 'Nueva Solicitud'}
            </h2>
            {esEdicion && <span className="text-xs text-gray-500 ml-7">Folio Nro. <strong>{String(nroRegistro).padStart(6, '0')}</strong></span>}
          </div>
          <button onClick={() => navigate(`/registros/${codigo}`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-gray-500 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition-colors border-none cursor-pointer">
            <X size={16} /> Cancelar
          </button>
        </div>

        {/* Employee Card */}
        <div className="mx-5 mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white border-l-4 border-l-corporate-green rounded-xl p-4 shadow-sm">
          <div>
            <div className="text-base font-extrabold text-corporate-blue">{trabajador.nombres} {trabajador.apellidos}</div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">&#x1F194; <strong>{codigo}</strong></span>
              <span className="flex items-center gap-1">&#x1F6E0;&#xFE0F; {trabajador.cargo}</span>
            </div>
          </div>
          <span className="text-[10px] bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 font-bold self-start">{trabajador.area}</span>
        </div>

        {/* Form */}
        <form onSubmit={guardarRegistro} className="p-5 space-y-5">
          {/* Row 1: Type + Req */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className={labelCls}>Tipo de Solicitud</label>
              <select 
                className={`${inputCls} font-medium ${esEdicion ? disabledCls : ''} ${
                  tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA' ? '!text-red-700 !bg-red-50 !border-red-300' : 
                  tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO' ? '!text-emerald-700 !bg-emerald-50 !border-emerald-300' : 
                  ''
                }`} 
                value={tipoCompensacion} 
                onChange={(e) => { setTipoCompensacion(e.target.value); setTipoSolicitud(''); }} 
                required 
                disabled={esEdicion}
              >
                <option value="" className="bg-white text-gray-900">Seleccione...</option>
                <option value="COMPENSACIÓN A FAVOR DE CIPSA" className="bg-white text-gray-900">FAVOR DE CIPSA (RESTAR)</option>
                <option value="COMPENSACIÓN A FAVOR DEL TÉCNICO" className="bg-white text-gray-900">FAVOR DEL TÉCNICO (SUMAR)</option>
              </select>
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Caso</label>
              <select 
                className={`${inputCls} font-medium ${esEdicion ? disabledCls : ''} ${
                  tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA' ? '!text-red-700 !bg-red-50 !border-red-300' :
                  tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO' ? '!text-emerald-700 !bg-emerald-50 !border-emerald-300' :
                  ''
                }`} 
                value={tipoSolicitud} 
                onChange={(e) => setTipoSolicitud(e.target.value)} 
                required 
                disabled={esEdicion || !tipoCompensacion}
              >
                <option value="" className="bg-white text-gray-900">Seleccione el caso...</option>
                {opcionesActuales.map(op => (
                  <option 
                    key={op} 
                    value={op} 
                    className={`bg-white ${
                      tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA' ? 'text-red-700 font-semibold' : 
                      tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO' ? 'text-emerald-700 font-semibold' : 
                      'text-gray-900'
                    }`}
                  >
                    {op}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-1">
              <label className={labelCls}>Requerimiento</label>
              <input className={`${inputCls} ${configUI.reqDisabled ? disabledCls : ''}`} type="text" placeholder={configUI.reqDisabled ? "N/A" : "Ej. 202*******"} value={requerimiento} onChange={(e) => setRequerimiento(e.target.value)} disabled={configUI.reqDisabled} />
            </div>
          </div>

          {/* Row 2: Lugar + Marcación + Motivo (hidden for ONOMÁSTICO) */}
          {tipoSolicitud !== 'ONOMÁSTICO' && (
            <>
              {tipoSolicitud === 'COMPENSAR HORAS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelCls}>Día a Compensar (Faltó/Tarde)</label>
                    <input className={inputCls} type="date" value={diaACompensar} onChange={e => setDiaACompensar(e.target.value)} required style={{ colorScheme: 'light' }} />
                  </div>
                  <div>
                    <label className={labelCls}>Día que hizo las Extras</label>
                    <input className={inputCls} type="date" value={diaExtras} onChange={e => setDiaExtras(e.target.value)} required style={{ colorScheme: 'light' }} />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Lugar</label>
                  <select className={`${inputCls} ${configUI.lugarDisabled ? disabledCls : ''}`} value={lugarTrabajo} onChange={(e) => setLugarTrabajo(e.target.value)} required disabled={configUI.lugarDisabled && configUI.lugarOpciones.length === 1}>
                    {configUI.lugarOpciones.length > 0 ? configUI.lugarOpciones.map(op => <option key={op} value={op}>{op}</option>) : <><option value="">Elegir...</option><option value="SERTEC">SERTEC</option><option value="CLIENTE">CLIENTE</option></>}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Detalles / Motivo <span className="text-gray-400 font-normal normal-case">(Opcional)</span></label>
                <input className={inputCls} type="text" placeholder="Describe brevemente la actividad..." value={motivo} onChange={e => setMotivo(e.target.value)} />
              </div>
            </>
          )}

          <hr className="border-gray-200" />

          {/* === ONOMÁSTICO Section === */}
          {tipoSolicitud === 'ONOMÁSTICO' && (
            <div>
              {!onomasticoInfo ? (
                <div className="text-center py-5 text-gray-400">Cargando datos de onomástico...</div>
              ) : onomasticoInfo.error ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
                  <AlertTriangle size={32} className="text-red-500 shrink-0" />
                  <strong className="text-red-700">{onomasticoInfo.error}</strong>
                </div>
              ) : onomasticoInfo.noCorresponde ? (
                <div className="bg-gray-100 border border-gray-300 rounded-2xl p-5 flex items-center gap-4">
                  <Ban size={36} className="text-gray-500 shrink-0" />
                  <div>
                    <strong className="text-gray-700 text-base">No corresponde onomástico este año</strong>
                    <p className="text-sm text-gray-500 mt-1">{onomasticoInfo.motivoNoCorresponde} No le corresponde día libre por onomástico.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Birthday card */}
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-300 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
                    <Cake size={36} className="text-amber-600 shrink-0" />
                    <div>
                      <strong className="text-lg text-amber-800">Tu cumpleaños: {onomasticoInfo.cumpleTexto}</strong>
                      <p className="text-sm text-amber-700 mt-1">Puedes tomar tu día libre en cualquier día laboral del mes de <strong>{onomasticoInfo.mesTexto}</strong></p>
                    </div>
                  </div>
                  {onomasticoInfo.yaUsado && !esEdicion && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                      <strong className="text-red-700">Ya tienes un onomástico registrado para este periodo</strong>
                    </div>
                  )}
                  {!onomasticoInfo.ventanaActiva && !onomasticoInfo.yaUsado && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-600">
                      <Clock size={16} className="inline mr-1.5 -mt-0.5" />Tu onomástico es en el mes de <strong>{onomasticoInfo.mesTexto}</strong>. Podrás registrarlo cuando llegue ese mes.
                    </div>
                  )}
                  {(onomasticoInfo.ventanaActiva || esEdicion) && !(onomasticoInfo.yaUsado && !esEdicion) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div>
                        <label className={labelCls}><CalendarCheck size={12} className="inline mr-1 -mt-0.5" />Elige tu día libre en {onomasticoInfo.mesTexto}</label>
                        <input type="date" className={inputCls} value={diaLibreOnomastico} onChange={e => setDiaLibreOnomastico(e.target.value)} min={onomasticoInfo.rangoInicio} max={onomasticoInfo.rangoFin} required style={{ colorScheme: 'light' }} />
                      </div>
                      <div>
                        {diaLibreEsLaboral === true && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center"><strong className="text-green-700 text-sm">Día laboral válido</strong></div>}
                        {diaLibreEsLaboral === false && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center"><strong className="text-red-700 text-sm">No es día laboral - Elige otro</strong></div>}
                        {diaLibreEsLaboral === null && diaLibreOnomastico && <div className="bg-gray-50 rounded-xl p-3 text-center text-gray-400">Verificando...</div>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* === Normal schedule section === */}
          {tipoSolicitud !== 'ONOMÁSTICO' && (
            <>
              {/* Date + Shift */}
              <div>
                <label className={labelCls}>Fecha y Turno</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input type="date" className={`${inputCls} flex-1`} value={fechaDia} onChange={e => setFechaDia(e.target.value)} required style={{ colorScheme: 'light' }} />
                  <div className="bg-corporate-blue text-white rounded-xl px-5 py-2.5 flex flex-col items-center justify-center min-w-[130px] border-b-4 border-b-corporate-green shadow-md">
                    <span className="text-[10px] text-corporate-green font-bold tracking-widest">HORARIO</span>
                    <span className="text-sm font-bold">{turnoInfo === 'Día Libre' ? 'LIBRE' : turnoInfo}</span>
                  </div>
                </div>
              </div>

              {/* All Marks */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 border-l-4 border-l-corporate-blue rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={18} className="text-corporate-blue" />
                  <strong className="text-xs text-corporate-blue tracking-wider uppercase">Registro de Marcaciones</strong>
                  {todasLasMarcas.length > 0 && <span className="text-[10px] bg-corporate-blue text-white px-2 py-0.5 rounded-full font-bold">{todasLasMarcas.length}</span>}
                </div>
                
                {todasLasMarcas.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">No hay marcaciones registradas para este día.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span className="flex-1">Hora / Disp.</span>
                      <span className="w-16 text-center text-green-600">Inicio</span>
                      <span className="w-16 text-center text-red-600">Fin</span>
                    </div>
                    {todasLasMarcas.map((m, i) => {
                      const isInicio = realInicio === m.hora && dispositivoInicio === m.dispositivo;
                      const isFin = realFin === m.hora && dispositivoFin === m.dispositivo;

                      return (
                        <div key={i} className={`flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border text-sm transition-colors
                          ${isInicio && isFin ? 'border-purple-300 bg-purple-50' : isInicio ? 'border-green-300 bg-green-50' : isFin ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex items-center gap-3 flex-1">
                            <span className="font-mono font-extrabold text-gray-700 min-w-[45px]">{m.hora}</span>
                            <span className="text-gray-300">│</span>
                            <span className="font-semibold text-xs text-gray-500 truncate flex items-center gap-1">
                              {m.dispositivo === 'TRAKKER' ? <Satellite size={12} className="text-gray-400" /> : <Smartphone size={12} className="text-gray-400" />}
                              {m.dispositivo}
                            </span>
                          </div>
                          <div className="w-16 flex justify-center">
                            <input 
                              type="radio" 
                              name="marca_inicio" 
                              className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500 cursor-pointer"
                              checked={isInicio}
                              onChange={() => {
                                setRealInicio(m.hora);
                                setDispositivoInicio(m.dispositivo);
                              }}
                              disabled={esEdicion}
                            />
                          </div>
                          <div className="w-16 flex justify-center">
                            <input 
                              type="radio" 
                              name="marca_fin" 
                              className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500 cursor-pointer"
                              checked={isFin}
                              onChange={() => {
                                setRealFin(m.hora);
                                setDispositivoFin(m.dispositivo);
                              }}
                              disabled={esEdicion}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Calculation preview */}
              <div>
                {previewCalculo && previewCalculo.icon ? (
                  <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${previewCalculo.bg} border-l-4 ${previewCalculo.border} rounded-2xl p-4 shadow-sm`}>
                    <div className="flex items-center gap-3">
                      <previewCalculo.icon size={28} style={{ color: previewCalculo.color }} />
                      <div>
                        <strong className="block text-sm uppercase" style={{ color: previewCalculo.color }}>{previewCalculo.texto}</strong>
                        <span className="text-xs text-gray-600">{previewCalculo.subtexto}</span>
                      </div>
                    </div>
                    {previewCalculo.mins !== 0 && (
                      <div className="text-right">
                        <div className="text-[9px] text-gray-500 font-bold uppercase">Diferencia</div>
                        <div className="text-xl font-extrabold" style={{ color: previewCalculo.color }}>{Math.abs(previewCalculo.mins)} min</div>
                      </div>
                    )}
                  </div>
                ) : previewCalculo && !previewCalculo.icon ? (
                  <div className="text-center py-4 bg-amber-50 text-amber-600 rounded-xl text-sm border border-dashed border-amber-300 font-semibold">
                    <AlertTriangle size={16} className="inline mr-1.5 -mt-0.5" />{previewCalculo.texto}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-gray-50 text-gray-400 rounded-xl text-sm border border-dashed border-gray-300">
                    <Clock size={16} className="inline mr-1.5 -mt-0.5" />Ingresa las horas reales para calcular el balance
                  </div>
                )}
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={enviando}
            className="w-full py-4 bg-corporate-green hover:bg-corporate-blue text-white font-bold uppercase text-sm tracking-wider rounded-full shadow-[0_8px_20px_-5px_rgba(125,177,0,0.4)] hover:shadow-[0_8px_20px_-5px_rgba(25,59,72,0.4)] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed border-none cursor-pointer"
          >
            {enviando ? 'Guardando...' : esEdicion ? 'ACTUALIZAR SOLICITUD' : 'CONFIRMAR SOLICITUD'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default NewRequest
