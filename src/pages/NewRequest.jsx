import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { X, Satellite, Smartphone, Cake, AlertTriangle, Ban, CalendarCheck, Scale, TrendingUp, TrendingDown, Clock, MapPin } from 'lucide-react'
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
  const [tipoTraslado, setTipoTraslado] = useState('VIAJE')
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
  const [marcasDiaSiguiente, setMarcasDiaSiguiente] = useState([])
  const [marcasExtraVisibles, setMarcasExtraVisibles] = useState(0)
  const [finOffsetDias, setFinOffsetDias] = useState(0)
  const [gpsLatInicio, setGpsLatInicio] = useState(null)
  const [gpsLngInicio, setGpsLngInicio] = useState(null)
  const [gpsLatFin, setGpsLatFin] = useState(null)
  const [gpsLngFin, setGpsLngFin] = useState(null)

  const [diaLibreOnomastico, setDiaLibreOnomastico] = useState('')
  const [onomasticoInfo, setOnomasticoInfo] = useState(null)
  const [diaLibreEsLaboral, setDiaLibreEsLaboral] = useState(null)
  const [fechaCorteOnomastico, setFechaCorteOnomastico] = useState(null)

  const opcionesCipsa = [
    "POR SALIDA ANTES DE HORARIO",
    "POR INGRESO FUERA DE HORARIO"
  ]

  const opcionesTecnico = [
    "TRASLADO",
    "SOBRETIEMPO"
  ]

  const opcionesActuales = useMemo(() => {
    if (tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA') return opcionesCipsa
    if (tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO') return opcionesTecnico
    if (tipoCompensacion === 'ONOMÁSTICO') return []
    if (tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR') return []
    return []
  }, [tipoCompensacion])

  const casosEspecificos = useMemo(() => {
    if (tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR') return ["PERMISO PERSONAL"]
    return opcionesActuales
  }, [opcionesActuales, tipoCompensacion])

  const marcasVisibles = useMemo(() => {
    return [...todasLasMarcas, ...marcasDiaSiguiente.slice(0, marcasExtraVisibles)]
  }, [todasLasMarcas, marcasDiaSiguiente, marcasExtraVisibles])

  const addDaysISO = (dateStr, days) => {
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    dt.setUTCDate(dt.getUTCDate() + days)
    return dt.toISOString().slice(0, 10)
  }

  const habilitaMarcasSiguienteDia = tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO'

  useEffect(() => {
    setMarcasExtraVisibles(0)
    setFinOffsetDias(0)
    setMarcasDiaSiguiente([])
  }, [fechaDia])

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
      if (tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR' || tipoSolicitud === 'PERMISO PERSONAL') {
        setLugarTrabajo("N/A"); setConfigUI({ lugarDisabled: true, lugarOpciones: ["N/A"], reqDisabled: true })
      } else if (tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA') {
        setLugarTrabajo("N/A"); setConfigUI({ lugarDisabled: true, lugarOpciones: ["N/A"], reqDisabled: true })
      } else {
        switch (tipoSolicitud) {
          case "TRASLADO":
            setLugarTrabajo("N/A"); setConfigUI({ lugarDisabled: true, lugarOpciones: ["N/A"], reqDisabled: false }); break
          case "SOBRETIEMPO":
            setLugarTrabajo(""); setConfigUI({ lugarDisabled: false, lugarOpciones: ["SERTEC", "CLIENTE", "FUERA DE OFICINA"], reqDisabled: false }); break
          case "ONOMÁSTICO":
            setLugarTrabajo("N/A"); setRequerimiento("N/A"); setTipoMarcacion("N/A")
            setConfigUI({ lugarDisabled: true, lugarOpciones: ["N/A"], reqDisabled: true }); break
          default:
            setConfigUI({ lugarDisabled: false, lugarOpciones: [], reqDisabled: false }); break
        }
      }
    }
  }, [tipoSolicitud, tipoCompensacion, cargandoDatos])

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
      if (data.tipo_solicitud === 'ONOMÁSTICO') {
        setTipoCompensacion('ONOMÁSTICO')
      } else if (data.tipo_solicitud === 'PERMISO PERSONAL') {
        setTipoCompensacion('SOLICITAR DÍA A COMPENSAR')
        setTipoSolicitud('PERMISO PERSONAL')
      } else if (["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO"].includes(data.tipo_solicitud)) {
        setTipoCompensacion("COMPENSACIÓN A FAVOR DE CIPSA")
      } else {
        setTipoCompensacion("COMPENSACIÓN A FAVOR DEL TÉCNICO")
      }
      if (data.tipo_solicitud === 'POR TRASLADO DE VIAJE') {
        setTipoSolicitud('TRASLADO')
        setTipoTraslado('VIAJE')
      } else if (data.tipo_solicitud === 'POR TRASLADO DE EQUIPOS') {
        setTipoSolicitud('TRASLADO')
        setTipoTraslado('TRASLADO DE EQUIPOS')
      } else if (data.tipo_solicitud !== 'PERMISO PERSONAL') {
        setTipoSolicitud(data.tipo_solicitud)
      }
      setLugarTrabajo(data.lugar_trabajo); setTipoMarcacion(data.tipo_de_marcacion)
      setDispositivoInicio(data.dispositivo_inicio || ''); setDispositivoFin(data.dispositivo_fin || '');
      setRequerimiento(data.requerimiento || ''); setMotivo(data.motivo || '')
      if (data.tipo_solicitud === 'ONOMÁSTICO' && data.fecha_hora_inicio) {
        const d = new Date(data.fecha_hora_inicio); const offset = d.getTimezoneOffset()
        setDiaLibreOnomastico(new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0])
      } else if (data.ingreso) {
        const d = new Date(data.ingreso); const offset = d.getTimezoneOffset()
        const ingresoDia = new Date(d.getTime() - (offset * 60 * 1000)).toISOString().split('T')[0]
        setFechaDia(ingresoDia)
        setRealInicio(d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }))
      }
      if (data.tipo_solicitud !== 'ONOMÁSTICO' && data.salida) {
        const sd = new Date(data.salida)
        const soff = sd.getTimezoneOffset()
        const salidaDia = new Date(sd.getTime() - (soff * 60 * 1000)).toISOString().split('T')[0]
        setRealFin(sd.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }))
        if (data.ingreso) {
          const id = new Date(data.ingreso)
          const ioff = id.getTimezoneOffset()
          const ingresoDia = new Date(id.getTime() - (ioff * 60 * 1000)).toISOString().split('T')[0]
          if (salidaDia > ingresoDia) setFinOffsetDias(1)
        }
      }
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

  // Auto-set hours for Permiso Personal
  useEffect(() => {
    if (tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR' && progInicio && progFin && !esEdicion) {
      setRealInicio(progInicio)
      setRealFin(progFin)
      setTipoMarcacion('N/A')
    }
  }, [tipoCompensacion, progInicio, progFin, esEdicion])

  // Trakker and GPS marks combined
  useEffect(() => {
    if (!fechaDia || !codigo || cargandoDatos) return
    const cargarMarcas = async () => {
      try {
        let marcas = []
        // Trakker
        const { data: dNew, error: eNew } = await supabase
          .from('marcaciones_individuales')
          .select('hora, tipo')
          .eq('codigo_trabajador', codigo)
          .eq('fecha', fechaDia)
          .order('hora', { ascending: true })

        if (dNew && dNew.length > 0) {
          dNew.forEach(m => {
            marcas.push({ hora: m.hora.slice(0, 5), dispositivo: m.tipo, offsetDias: 0 })
          })
          setMarcaCargada(true)
        } else {
          // Fallback histórico a tabla antigua (antes de 21-ene-2026)
          const { data: d1, error: e1 } = await supabase.from('marcaciones').select('hora_ingreso, hora_salida').eq('codigo_trabajador', codigo).eq('fecha', fechaDia).single()
          if (d1 && !e1) {
            if (d1.hora_ingreso) marcas.push({ hora: d1.hora_ingreso.slice(0, 5), dispositivo: 'TRAKKER', offsetDias: 0 })
            if (d1.hora_salida && d1.hora_salida !== d1.hora_ingreso) marcas.push({ hora: d1.hora_salida.slice(0, 5), dispositivo: 'TRAKKER', offsetDias: 0 })
            setMarcaCargada(true)
          } else {
            setMarcaCargada(false)
          }
        }

        // GPS (APP)
        const { data: d2, error: e2 } = await supabase
          .from('marcaciones_gps')
          .select('id_marca, fecha_marca, cliente, otr_referencia, observacion, latitud, longitud')
          .eq('codigo_trabajador', codigo)
          .gte('fecha_marca', `${fechaDia}T00:00:00`)
          .lte('fecha_marca', `${fechaDia}T23:59:59`)
        if (d2 && !e2) {
          d2.forEach(m => {
            const h = new Date(m.fecha_marca).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
            marcas.push({
              hora: h,
              dispositivo: 'APP',
              offsetDias: 0,
              idMarca: m.id_marca,
              cliente: m.cliente,
              otrosDatosReq: m.otr_referencia,
              observacion: m.observacion,
              lat: m.latitud ?? null,
              lng: m.longitud ?? null,
            })
          })
        }

        const unicasMap = new Map()
        marcas.forEach(m => {
          const key = `${m.offsetDias ?? 0}|${m.hora}`
          if (!unicasMap.has(key) || m.idMarca) {
            unicasMap.set(key, m)
          }
        })
        const unicas = Array.from(unicasMap.values()).sort((a, b) => a.offsetDias - b.offsetDias || a.hora.localeCompare(b.hora))
        setTodasLasMarcas(unicas)

        if (habilitaMarcasSiguienteDia) {
          const fechaSiguiente = addDaysISO(fechaDia, 1)
          let marcasNext = []

          const { data: ndNew } = await supabase
            .from('marcaciones_individuales')
            .select('hora, tipo')
            .eq('codigo_trabajador', codigo)
            .eq('fecha', fechaSiguiente)
            .order('hora', { ascending: true })

          if (ndNew && ndNew.length > 0) {
            ndNew.forEach(m => {
              marcasNext.push({ hora: m.hora.slice(0, 5), dispositivo: m.tipo, offsetDias: 1 })
            })
          } else {
            const { data: nd1, error: ne1 } = await supabase.from('marcaciones').select('hora_ingreso, hora_salida').eq('codigo_trabajador', codigo).eq('fecha', fechaSiguiente).single()
            if (nd1 && !ne1) {
              if (nd1.hora_ingreso) marcasNext.push({ hora: nd1.hora_ingreso.slice(0, 5), dispositivo: 'TRAKKER', offsetDias: 1 })
              if (nd1.hora_salida && nd1.hora_salida !== nd1.hora_ingreso) marcasNext.push({ hora: nd1.hora_salida.slice(0, 5), dispositivo: 'TRAKKER', offsetDias: 1 })
            }
          }

          const { data: nd2, error: ne2 } = await supabase
            .from('marcaciones_gps')
            .select('id_marca, fecha_marca, cliente, otr_referencia, observacion')
            .eq('codigo_trabajador', codigo)
            .gte('fecha_marca', `${fechaSiguiente}T00:00:00`)
            .lte('fecha_marca', `${fechaSiguiente}T23:59:59`)
          if (nd2 && !ne2) {
            nd2.forEach(m => {
              const h = new Date(m.fecha_marca).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' })
              marcasNext.push({
                hora: h,
                dispositivo: 'APP',
                offsetDias: 1,
                idMarca: m.id_marca,
                cliente: m.cliente,
                otrosDatosReq: m.otr_referencia,
                observacion: m.observacion,
              })
            })
          }

          const unicasNextMap = new Map()
          marcasNext.forEach(m => {
            const key = `${m.offsetDias ?? 1}|${m.hora}`
            if (!unicasNextMap.has(key) || m.idMarca) {
              unicasNextMap.set(key, m)
            }
          })
          const unicasSiguiente = Array.from(unicasNextMap.values()).sort((a, b) => a.offsetDias - b.offsetDias || a.hora.localeCompare(b.hora))
          setMarcasDiaSiguiente(unicasSiguiente)
        } else {
          setMarcasDiaSiguiente([])
          setMarcasExtraVisibles(0)
          setFinOffsetDias(0)
        }

        if (!esEdicion) {
          if (unicas.length > 0) {
            setRealInicio(unicas[0].hora)
            setDispositivoInicio(unicas[0].dispositivo)
            if (unicas.length > 1) {
              setRealFin(unicas[unicas.length - 1].hora)
              setDispositivoFin(unicas[unicas.length - 1].dispositivo)
              setFinOffsetDias(unicas[unicas.length - 1].offsetDias || 0)
            } else {
              setRealFin('')
              setDispositivoFin('')
              setFinOffsetDias(0)
            }
          } else {
            setRealInicio('')
            setRealFin('')
            setDispositivoInicio('')
            setDispositivoFin('')
            setFinOffsetDias(0)
          }
        }
      } catch (e) {
        console.error("Error al cargar marcas:", e)
        setMarcaCargada(false)
        setTodasLasMarcas([])
        setMarcasDiaSiguiente([])
      }
    }
    cargarMarcas()
  }, [fechaDia, codigo, cargandoDatos, esEdicion, habilitaMarcasSiguienteDia])

  useEffect(() => {
    if (!esEdicion) return
    if (finOffsetDias !== 1) return
    if (!realFin || !dispositivoFin) return
    const idx = marcasDiaSiguiente.findIndex(m => m.hora === realFin && m.dispositivo === dispositivoFin)
    if (idx >= 0 && marcasExtraVisibles < idx + 1) setMarcasExtraVisibles(idx + 1)
  }, [esEdicion, finOffsetDias, realFin, dispositivoFin, marcasDiaSiguiente, marcasExtraVisibles])

  // Calculation preview
  const previewCalculo = useMemo(() => {
    if (tipoSolicitud === "ONOMÁSTICO") return null
    if (tipoSolicitud !== "PERMISO PERSONAL" && (!realInicio || !realFin)) return null
    if (!tipoSolicitud) return { texto: 'Seleccione solicitud...', color: 'gray' }
    
    // Nueva regla: "SOLICITAR DIA A COMPENSAR" no puede tener marcaciones en el día
    if (tipoSolicitud === "PERMISO PERSONAL" && todasLasMarcas && todasLasMarcas.length > 0 && !esEdicion) {
      return {
        texto: 'DÍA CON MARCACIONES',
        subtexto: 'No puedes usar esta opción porque asististe a trabajar este día.',
        color: '#b45309', bg: 'bg-amber-50', icon: AlertTriangle, border: 'border-amber-400',
        mins: 0,
        invalido: true,
      }
    }

    const getMins = (t) => {
      if (!t) return 0
      const [h, m] = t.split(':').map(Number); return h * 60 + m 
    }
    const rIn = getMins(realInicio), rOut = getMins(realFin)
    const finOffset = finOffsetDias || 0

    // Validar orden y duplicidad (No aplica a Permiso Personal que se auto-rellena)
    if (tipoSolicitud !== 'PERMISO PERSONAL') {
      if (finOffset === 0 && realInicio === realFin && dispositivoInicio === dispositivoFin) {
        return {
          texto: 'MARCACIONES IDÉNTICAS',
          subtexto: 'La hora de inicio y fin no pueden ser el mismo registro.',
          color: '#b45309', bg: 'bg-amber-50', icon: AlertTriangle, border: 'border-amber-400',
          mins: 0,
          invalido: true,
        }
      }

      if (finOffset === 0 && rIn > rOut) {
        return {
          texto: 'ORDEN INCORRECTO',
          subtexto: 'La hora de fin debe ser posterior a la hora de inicio.',
          color: '#b45309', bg: 'bg-amber-50', icon: AlertTriangle, border: 'border-amber-400',
          mins: 0,
          invalido: true,
        }
      }
    }

    const pIn = progInicio ? getMins(progInicio) : 0, pOut = progFin ? getMins(progFin) : 0
    const pTotal = pOut > 0 ? (pOut > pIn ? pOut - pIn : (pOut + 1440) - pIn) : 0
    const rTotal = (rOut + (finOffset * 1440)) - rIn
    const esDescuento = ["POR SALIDA ANTES DE HORARIO", "POR INGRESO FUERA DE HORARIO", "PERMISO PERSONAL"].includes(tipoSolicitud)
    const esAumento = ["TRASLADO", "SOBRETIEMPO"].includes(tipoSolicitud)

    // Cálculo:
    // - TRASLADO: duración entre INICIO y FIN
    // - SOBRETIEMPO: extra del tramo seleccionado fuera de horario, aplicando flex (compensa tardanza/salida temprana)
    // - CIPSA (descuento): diferencia vs jornada programada
    const calcularExtraConFlex = () => {
      if (!progInicio || !progFin || pOut === 0) {
        // Día libre o sin horario: todo el rango cuenta como extra
        return rTotal
      }

      const selStart = rIn
      const selEnd = rOut + (finOffset * 1440)
      const schedStart = pIn
      const schedEnd = pOut > pIn ? pOut : (pOut + 1440)

      const tramoTotalmenteFuera = selEnd <= schedStart || selStart >= schedEnd
      if (tramoTotalmenteFuera) {
        return Math.max(0, selEnd - selStart)
      }

      const extraAntes = Math.max(0, Math.min(selEnd, schedStart) - selStart)
      const extraDespues = Math.max(0, selEnd - Math.max(selStart, schedEnd))
      const extraFueraHorario = extraAntes + extraDespues

      // Flexibilidad basada en marcaciones del día base (offset 0)
      let baseStart = null
      let baseEnd = null
      if (todasLasMarcas && todasLasMarcas.length > 0) {
        const mins = todasLasMarcas
          .filter(m => (m?.offsetDias ?? 0) === 0)
          .map(m => getMins(m.hora))
          .filter(v => Number.isFinite(v))
        if (mins.length > 0) {
          baseStart = Math.min(...mins)
          baseEnd = Math.max(...mins)
        }
      }

      const tardanza = baseStart == null ? 0 : Math.max(0, baseStart - schedStart)
      const salidaTemprana = baseEnd == null ? 0 : Math.max(0, schedEnd - baseEnd)

      return Math.max(0, extraFueraHorario - tardanza - salidaTemprana)
    }

    let diffMins
    if (tipoSolicitud === 'TRASLADO') {
      diffMins = calcularExtraConFlex()
    } else if (tipoSolicitud === 'SOBRETIEMPO') {
      diffMins = calcularExtraConFlex()
    } else if (tipoSolicitud === 'PERMISO PERSONAL') {
      diffMins = -pTotal
    } else {
      diffMins = rTotal - pTotal
    }

    if (tipoSolicitud === 'SOBRETIEMPO' && diffMins <= 0) {
      return {
        texto: 'SIN SOBRETIEMPO',
        subtexto: 'No excedes tu jornada programada (flexibilidad aplicada).',
        color: '#475569', bg: 'bg-gray-50', icon: Scale, border: 'border-gray-300',
        mins: 0,
        invalido: true,
      }
    }

    if (esDescuento && diffMins >= 0 && tipoSolicitud !== 'PERMISO PERSONAL') {
      return {
        texto: 'NO APLICA PARA ESTA SOLICITUD',
        subtexto: diffMins === 0
          ? 'Has cumplido tu jornada exacta, no hay tiempo que justificar o descontar.'
          : 'Tienes horas extra, esta opción es solo cuando no cumples la jornada.',
        color: '#b45309', bg: 'bg-amber-50', icon: AlertTriangle, border: 'border-amber-400',
        mins: diffMins,
        invalido: true,
      }
    }

    if (esAumento && diffMins <= 0) {
      return {
        texto: 'NO APLICA PARA ESTA SOLICITUD',
        subtexto: diffMins === 0
          ? 'No hay diferencia entre inicio y fin.'
          : 'Selecciona una marcación de fin posterior al inicio.',
        color: '#b45309', bg: 'bg-amber-50', icon: AlertTriangle, border: 'border-amber-400',
        mins: diffMins,
        invalido: true,
      }
    }

    if (diffMins > 0 && diffMins < 30) {
      return {
        texto: 'MÍNIMO 30 MINUTOS',
        subtexto: 'Si el registro es a favor, debe ser de al menos 30 minutos.',
        color: '#b45309', bg: 'bg-amber-50', icon: AlertTriangle, border: 'border-amber-400',
        mins: diffMins,
        invalido: true,
      }
    }

    if (diffMins === 0 && tipoSolicitud !== 'PERMISO PERSONAL') return { texto: 'TIEMPO EXACTO', subtexto: 'Cumplió la jornada sin diferencias', color: '#475569', bg: 'bg-gray-50', icon: Scale, border: 'border-gray-300', mins: 0 }
    if (diffMins > 0) {
      const sub = tipoSolicitud === 'SOBRETIEMPO'
        ? (pTotal === 0 ? 'Trabajó en día libre' : 'Tiempo extra neto (flexibilidad aplicada)')
        : esAumento
          ? 'Duración registrada entre marcaciones'
          : (pTotal === 0 ? 'Trabajó en día libre' : 'Excedente luego de descontar tardanzas')
      return { texto: `+${Math.floor(diffMins / 60)}h ${diffMins % 60}m A FAVOR`, subtexto: sub, color: '#15803d', bg: 'bg-green-50', icon: TrendingUp, border: 'border-green-400', mins: diffMins }
    }
    const absMins = Math.abs(diffMins)
    const textoDéficit = tipoSolicitud === 'PERMISO PERSONAL' ? 'Tiempo total del turno a descontar' : 'Déficit después de balancear horas'
    return { texto: `-${Math.floor(absMins / 60)}h ${absMins % 60}m A DESCONTAR`, subtexto: textoDéficit, color: '#7f1d1d', bg: 'bg-red-50', icon: TrendingDown, border: 'border-red-400', mins: diffMins }
  }, [realInicio, realFin, progInicio, progFin, tipoSolicitud, dispositivoInicio, dispositivoFin, finOffsetDias, todasLasMarcas])

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
    if (tipoSolicitud !== 'PERMISO PERSONAL') {
      if (!fechaDia || !realInicio || !realFin) return Swal.fire('Faltan datos', 'Completa fecha y horas', 'warning')
    } else {
      if (!fechaDia) return Swal.fire('Faltan datos', 'Selecciona el día', 'warning')
      if (!progInicio || !progFin) return Swal.fire('Día no laboral', 'El día seleccionado no tiene horario programado. Por favor, elige un día laborable.', 'warning')
    }

    if (previewCalculo && previewCalculo.invalido) {
      return Swal.fire('Registro no válido', previewCalculo.subtexto, 'warning')
    }

    const finalInicio = (tipoSolicitud === 'PERMISO PERSONAL' && progInicio) ? progInicio : realInicio
    const finalFin = (tipoSolicitud === 'PERMISO PERSONAL' && progFin) ? progFin : realFin

    // Evitar duplicidad: no permitir reutilizar las mismas marcaciones (hora+dispositivo)
    const fechaFinReal = finOffsetDias > 0 ? addDaysISO(fechaDia, finOffsetDias) : fechaDia
    const ingresoReal = new Date(`${fechaDia}T${finalInicio}:00`)
    const salidaReal = new Date(`${fechaFinReal}T${finalFin}:00`)

    try {
      const rangoInicio = new Date(`${fechaDia}T00:00:00`)
      const rangoFin = new Date(`${addDaysISO(fechaDia, 1)}T23:59:59`)
      const cols = 'nro_registro, estado, tipo_solicitud, ingreso, salida, dispositivo_inicio, dispositivo_fin'

      const [q1, q2] = await Promise.all([
        supabase.from('registro_horas').select(cols).eq('codigo_trabajador', codigo).gte('ingreso', rangoInicio.toISOString()).lte('ingreso', rangoFin.toISOString()),
        supabase.from('nuevo_registro_horas').select(cols).eq('codigo_trabajador', codigo).gte('ingreso', rangoInicio.toISOString()).lte('ingreso', rangoFin.toISOString()),
      ])

      const filas = [
        ...(q1?.data || []).map(r => ({ ...r, _tabla: 'registro_horas' })),
        ...(q2?.data || []).map(r => ({ ...r, _tabla: 'nuevo_registro_horas' })),
      ]

      if (tipoSolicitud !== 'PERMISO PERSONAL') {
        const miInicioKey = `${ingresoReal.toISOString()}|${dispositivoInicio || ''}`
        const miFinKey = `${salidaReal.toISOString()}|${dispositivoFin || ''}`

        const duplicado = filas.find(r => {
          if (r?.estado === 'Rechazado') return false
          if (esEdicion && r?._tabla === 'registro_horas' && String(r?.nro_registro) === String(nroRegistro)) return false
          const inicioKey = `${new Date(r.ingreso).toISOString()}|${r.dispositivo_inicio || ''}`
          const finKey = `${new Date(r.salida).toISOString()}|${r.dispositivo_fin || ''}`
          return inicioKey === miInicioKey || finKey === miFinKey
        })

        if (duplicado) {
          return Swal.fire(
            'Duplicado detectado',
            `Ya existe un registro (${duplicado._tabla === 'registro_horas' ? 'solicitud' : 'registro'}) #${duplicado.nro_registro} (${duplicado.tipo_solicitud}) que usa estas mismas marcaciones.`,
            'warning'
          )
        }
      }
    } catch {
      // Si falla la consulta, no bloqueamos al usuario (evita falso positivo)
    }

    setEnviando(true)
    let fInicio, fFin
    if (previewCalculo && previewCalculo.mins !== 0) {
      const absMins = Math.abs(previewCalculo.mins)
      fInicio = new Date(`${fechaDia}T${finalInicio}:00`); fFin = new Date(fInicio.getTime() + (absMins * 60000))
    } else { fInicio = new Date(`${fechaDia}T${finalInicio}:00`); fFin = new Date(`${fechaDia}T${finalInicio}:00`) }

    let finalTipoSolicitud = tipoSolicitud
    if (tipoSolicitud === 'TRASLADO') {
      if (tipoTraslado === 'VIAJE') finalTipoSolicitud = 'POR TRASLADO DE VIAJE'
      else if (tipoTraslado === 'TRASLADO DE EQUIPOS') finalTipoSolicitud = 'POR TRASLADO DE EQUIPOS'
    }

    const payload = { 
      nombre_empleado: trabajador ? `${trabajador.nombres} ${trabajador.apellidos}` : '', 
      codigo_trabajador: codigo, 
      area: trabajador?.area, 
      cargo: trabajador?.cargo, 
      tipo_solicitud: finalTipoSolicitud, 
      requerimiento, 
      motivo, 
      lugar_trabajo: lugarTrabajo, 
      tipo_de_marcacion: tipoMarcacion, 
      dispositivo_inicio: dispositivoInicio, 
      dispositivo_fin: dispositivoFin, 
      dia_a_compensar: null, 
      dia_extras_registradas: null, 
      fecha_hora_inicio: fInicio, 
      fecha_hora_fin: fFin, 
      ingreso: new Date(`${fechaDia}T${finalInicio}:00`), 
      salida: new Date(`${fechaFinReal}T${finalFin}:00`),
      latitud: gpsLatInicio ?? gpsLatFin ?? null,
      longitud: gpsLngInicio ?? gpsLngFin ?? null,
      estado: 'Pendiente' 
    }
    const { error } = esEdicion ? await supabase.from('registro_horas').update(payload).eq('nro_registro', nroRegistro) : await supabase.from('registro_horas').insert([payload])
    setEnviando(false)
    if (error) Swal.fire('Error', error.message, 'error')
    else { logBitacora({ usuario: codigo, tipo_usuario: 'empleado', accion: esEdicion ? 'editar' : 'crear', modulo: 'registro_horas', descripcion: `${esEdicion ? 'Editó' : 'Creó'} solicitud ${tipoSolicitud}`, registro_id: esEdicion ? String(nroRegistro) : null, datos_nuevos: { tipo_solicitud: finalTipoSolicitud, fecha: fechaDia, inicio: realInicio, fin: realFin } }); Swal.fire({ title: '¡Procesado!', text: 'Registro guardado correctamente', icon: 'success', timer: 1500, showConfirmButton: false }); navigate(`/registros/${codigo}`) }
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
          {/* --- SECCIÓN 1: DATOS DEL CASO --- */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 mb-6 shadow-sm">
            <h3 className="text-[10px] font-black tracking-widest text-corporate-blue uppercase mb-4 flex items-center gap-2">
              <span className="bg-corporate-blue text-white w-4 h-4 rounded-full flex justify-center items-center text-[10px]">1</span> 
              CLASIFICACIÓN
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className={labelCls}>Tipo de Solicitud</label>
                <select 
                  className={`${inputCls} font-medium ${
                    tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA' ? '!text-red-700 !bg-red-50 !border-red-300' : 
                    tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO' ? '!text-emerald-700 !bg-emerald-50 !border-emerald-300' : 
                    tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR' ? '!text-purple-700 !bg-purple-50 !border-purple-300' : 
                    ''
                  }`} 
                  value={tipoCompensacion} 
                  onChange={(e) => { 
                    const v = e.target.value
                    setTipoCompensacion(v)
                    if (v === 'ONOMÁSTICO') setTipoSolicitud('ONOMÁSTICO')
                    else if (v === 'SOLICITAR DÍA A COMPENSAR') setTipoSolicitud('PERMISO PERSONAL')
                    else setTipoSolicitud('')
                  }} 
                  required 
                >
                  <option value="" className="bg-white text-gray-900">Seleccione...</option>
                  <option value="COMPENSACIÓN A FAVOR DE CIPSA" className="bg-white text-gray-900">FAVOR DE CIPSA (RESTAR)</option>
                  <option value="COMPENSACIÓN A FAVOR DEL TÉCNICO" className="bg-white text-gray-900">FAVOR DEL TÉCNICO (SUMAR)</option>
                  <option value="SOLICITAR DÍA A COMPENSAR" className="bg-white text-gray-900">SOLICITAR DÍA A COMPENSAR (RESTAR)</option>
                  <option value="ONOMÁSTICO" className="bg-white text-gray-900">ONOMÁSTICO (DÍA LIBRE)</option>
                </select>
              </div>
              {tipoCompensacion !== 'ONOMÁSTICO' && (
              <div>
                <label className={labelCls}>Caso Específico</label>
                <select 
                  className={`${inputCls} font-medium ${
                    tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA' ? '!text-red-700 !bg-red-50 !border-red-300' :
                    tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO' ? '!text-emerald-700 !bg-emerald-50 !border-emerald-300' :
                    tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR' ? '!text-purple-700 !bg-purple-50 !border-purple-300' :
                    ''
                  }`} 
                  value={tipoSolicitud} 
                  onChange={(e) => setTipoSolicitud(e.target.value)} 
                  required 
                  disabled={!tipoCompensacion || tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR'}
                >
                  <option value="" className="bg-white text-gray-900">Seleccione el caso...</option>
                  {casosEspecificos.map(op => (
                    <option 
                      key={op} 
                      value={op} 
                      className={`bg-white ${
                        tipoCompensacion === 'COMPENSACIÓN A FAVOR DE CIPSA' ? 'text-red-700 font-semibold' : 
                        tipoCompensacion === 'COMPENSACIÓN A FAVOR DEL TÉCNICO' ? 'text-emerald-700 font-semibold' : 
                        tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR' ? 'text-purple-700 font-semibold' : 
                        'text-gray-900'
                      }`}
                    >
                      {op}
                    </option>
                  ))}
                </select>
              </div>
              )}
            </div>
          </div>

          {/* --- SECCIÓN 2: DETALLES DE LA ACTIVIDAD --- */}
          {tipoSolicitud !== 'ONOMÁSTICO' && (
            <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 mb-6 shadow-sm">
              <h3 className="text-[10px] font-black tracking-widest text-corporate-blue uppercase mb-4 flex items-center gap-2">
                <span className="bg-corporate-blue text-white w-4 h-4 rounded-full flex justify-center items-center text-[10px]">2</span> 
                INFORMACIÓN ADICIONAL
              </h3>
              
              <div className={`grid grid-cols-1 ${tipoSolicitud === 'TRASLADO' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-5 mb-5`}>
                <div className={configUI.reqDisabled && requerimiento === 'N/A' || tipoSolicitud === 'PERMISO PERSONAL' ? 'hidden md:block opacity-50' : ''}>
                  <label className={labelCls}>Nro. Requerimiento</label>
                  <input className={`${inputCls} ${configUI.reqDisabled || tipoSolicitud === 'PERMISO PERSONAL' ? disabledCls : ''}`} type="text" placeholder={configUI.reqDisabled || tipoSolicitud === 'PERMISO PERSONAL' ? "N/A" : "Ej. 202*******"} value={requerimiento} onChange={(e) => setRequerimiento(e.target.value)} disabled={configUI.reqDisabled || tipoSolicitud === 'PERMISO PERSONAL'} />
                </div>
                
                <div className={tipoSolicitud === 'PERMISO PERSONAL' ? 'hidden md:block opacity-50' : ''}>
                  <label className={labelCls}>Lugar de Trabajo</label>
                  <select className={`${inputCls} ${configUI.lugarDisabled || tipoSolicitud === 'PERMISO PERSONAL' ? disabledCls : ''}`} value={lugarTrabajo} onChange={(e) => setLugarTrabajo(e.target.value)} required disabled={(configUI.lugarDisabled && configUI.lugarOpciones.length === 1) || tipoSolicitud === 'PERMISO PERSONAL'}>
                    {configUI.lugarOpciones.length > 0 ? configUI.lugarOpciones.map(op => <option key={op} value={op}>{op}</option>) : <><option value="">Elegir...</option><option value="SERTEC">SERTEC</option><option value="CLIENTE">CLIENTE</option><option value="FUERA DE OFICINA">FUERA DE OFICINA</option></>}
                  </select>
                </div>
                
                {tipoSolicitud === 'TRASLADO' && (
                  <div>
                    <label className={labelCls}>Tipo de Traslado</label>
                    <select className={inputCls} value={tipoTraslado} onChange={e => setTipoTraslado(e.target.value)} required>
                      <option value="VIAJE">VIAJE</option>
                      <option value="TRASLADO DE EQUIPOS">TRASLADO DE EQUIPOS</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className={labelCls}>Detalles / Motivo <span className="text-gray-400 font-normal normal-case">(Opcional)</span></label>
                <input className={inputCls} type="text" placeholder="Describe brevemente la actividad o motivo..." value={motivo} onChange={e => setMotivo(e.target.value)} />
              </div>
            </div>
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
              {tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4 text-center">
                  <p className="text-xs text-purple-700 font-bold">Las horas se completarán automáticamente según tu horario y no son editables.</p>
                </div>
              )}
              <div className={`bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 border-l-4 border-l-corporate-blue rounded-2xl p-4 ${tipoCompensacion === 'SOLICITAR DÍA A COMPENSAR' ? 'opacity-70 pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-corporate-blue" />
                    <strong className="text-xs text-corporate-blue tracking-wider uppercase">Registro de Marcaciones</strong>
                    {marcasVisibles.length > 0 && <span className="text-[10px] bg-corporate-blue text-white px-2 py-0.5 rounded-full font-bold">{marcasVisibles.length}</span>}
                  </div>
                  {habilitaMarcasSiguienteDia && (
                    <button
                      type="button"
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        marcasDiaSiguiente.length === 0 || marcasExtraVisibles >= marcasDiaSiguiente.length
                          ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                          : 'bg-white text-corporate-blue border-gray-200 hover:bg-gray-50'
                      }`}
                      disabled={marcasDiaSiguiente.length === 0 || marcasExtraVisibles >= marcasDiaSiguiente.length}
                      onClick={() => setMarcasExtraVisibles(v => Math.min(v + 1, marcasDiaSiguiente.length))}
                      title="Muestra una marcación adicional del día siguiente"
                    >
                      Ver siguiente marca
                    </button>
                  )}
                </div>
                
                {marcasVisibles.length === 0 ? (
                  <div className="text-center py-4 text-sm text-gray-500">No hay marcaciones registradas para este día.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Header */}
                    <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <span className="flex-1">Hora / Disp.</span>
                      <span className="w-16 text-center text-green-600">Inicio</span>
                      <span className="w-16 text-center text-red-600">Fin</span>
                      <span className="w-8"></span>
                    </div>
                    {marcasVisibles.map((m, i) => {
                      const isInicio = realInicio === m.hora && dispositivoInicio === m.dispositivo;
                      const isFin = realFin === m.hora && dispositivoFin === m.dispositivo;

                      return (
                        <div key={i} className={`flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border text-sm transition-colors
                          ${isInicio && isFin ? 'border-purple-300 bg-purple-50' : isInicio ? 'border-green-300 bg-green-50' : isFin ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono font-extrabold text-gray-700 min-w-[45px] flex items-center gap-1">
                                {m.hora}
                                {m.offsetDias === 1 && <span className="text-[10px] font-black text-gray-400">+1D</span>}
                              </span>
                              <span className="text-gray-300">│</span>
                              <span className="font-semibold text-xs text-gray-500 truncate flex items-center gap-1 min-w-0">
                                {m.dispositivo === 'TRAKKER' ? <Satellite size={12} className="text-gray-400" /> : <Smartphone size={12} className="text-gray-400" />}
                                {m.dispositivo}
                              </span>
                            </div>
                            {m.dispositivo === 'APP' && (m.cliente || m.otrosDatosReq || m.observacion || (m.lat && m.lng)) && (
                              <div className="mt-1 text-[10px] leading-4 text-gray-500 min-w-0">
                                {m.cliente && <span className="mr-3"><span className="font-bold">CLIENTE:</span> {m.cliente}</span>}
                                {m.otrosDatosReq && <span className="mr-3"><span className="font-bold">OTROS DATOS (REQ):</span> {m.otrosDatosReq}</span>}
                                {m.observacion && <span className="mr-3"><span className="font-bold">OBSERVACIÓN:</span> {m.observacion}</span>}
                              </div>
                            )}
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
                                setGpsLatInicio(m.lat ?? null);
                                setGpsLngInicio(m.lng ?? null);
                              }}
                              disabled={m.offsetDias === 1}
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
                                setFinOffsetDias(m.offsetDias || 0);
                                setGpsLatFin(m.lat ?? null);
                                setGpsLngFin(m.lng ?? null);
                              }}
                              disabled={false}
                            />
                          </div>
                          <div className="w-8 flex justify-center">
                            {m.lat && m.lng && (
                              <a
                                href={`https://maps.google.com/?q=${m.lat},${m.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 transition-colors bg-blue-50 p-1.5 rounded-full hover:bg-blue-100"
                                onClick={e => e.stopPropagation()}
                                title="Ver ubicación exacta"
                              >
                                <MapPin size={16} strokeWidth={2.5} />
                              </a>
                            )}
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
                        <div className="text-xl font-extrabold" style={{ color: previewCalculo.color }}>
                          {previewCalculo.mins > 0 ? `+${previewCalculo.mins}` : previewCalculo.mins} min
                        </div>
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
