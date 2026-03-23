import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { UserPlus, X, Camera, IdCard, Wrench, ClipboardList, CalendarDays, CheckCircle, Clock } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function AdminAddPersonal() {
  const navigate = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fechaCorteOnomastico, setFechaCorteOnomastico] = useState('2024-11-30'); const [grupoHorarioId, setGrupoHorarioId] = useState(''); const [gruposHorarios, setGruposHorarios] = useState([]);

  const normalizarEmail = (value) => (value || '').trim().toLowerCase()
  const esEmailValido = (value) => {
    const v = normalizarEmail(value)
    if (!v) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  }

  useEffect(() => {
    const cargarConfig = async () => {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'onomastico_fecha_corte').single()
      if (data) setFechaCorteOnomastico(data.valor)
    }
      const cargarHorarios = async () => {
        const { data } = await supabase.from('grupos_horarios').select('*').order('id')
        if (data) setGruposHorarios(data)
      }
      cargarConfig()
      cargarHorarios()
    }, [])

    const [codigo, setCodigo] = useState('')
    const [dni, setDni] = useState('')
    const [email, setEmail] = useState('')
    const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [cargo, setCargo] = useState('')
  const [seccion, setSeccion] = useState('')
  const [area, setArea] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [fechaIngreso, setFechaIngreso] = useState('')
  // removed, setGrupoHorarioId] = useState('')
  // removed, setGruposHorarios] = useState([])

  const seccionesDisponibles = [
    'CIL', 'CELSA', 'INSPECCION', 'NESTLE', 'CAD', 'CPEI',
    'SERTEC', 'PPL LINDLEY', 'SPSA', 'BACKUS'
  ]

  const cargosDisponibles = [
    'TÉCNICO ELECTRÓNICO', 'SUPERVISOR DE LÍNEA', 'GESTOR DE PROYECTOS',
    'GESTOR DE CONTRATOS', 'ASISTENTE ADMNISTRATIVO LÍNEA CPEI',
    'ASISTENTE ADMNISTRATIVO LÍNEA CIL', 'ASISTENTE ADMNISTRATIVO LÍNEA INSPECCION',
    'ASISTENTE ADMNISTRATIVO LÍNEA CAD', 'ASISTENTE ADMINISTRATIVO',
    'ASISTENTE ADMNISTRATIVO DE CONTRATO',
    'ASISTENTE DE RUTA TECNICA 1', 'ASISTENTE DE RUTA TECNICA 2',
    'COORDINADOR DE SERVICIOS', 'COORDINADOR DE CONTRATO',
    'JEFE DE SERVICIO TECNICO', 'TRAINEE PROFESIONAL', 'PRACTICANTE'
  ]

  const areasDisponibles = [
    'SERTEC - TECNICO', 'SERTEC - ADM', 'SERTEC - SUPERVISOR TECNICO',
    'CONTRATO LINDLEY PUCUSANA', 'CONTRATO NESTLE', 'CONTRATO BACKUS',
    'CONTRATO SPSA LIMA', 'CONTRATO SPSA - AREQUIPA', 'CONTRATO SPSA - CHICLAYO'
  ]

  const handleFotoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire('Archivo muy grande', 'La foto debe ser menor a 2MB', 'warning')
      return
    }
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!codigo.trim() || !dni.trim() || !nombres.trim() || !apellidos.trim()) {
      return Swal.fire('Campos requeridos', 'Código, DNI, Nombres y Apellidos son obligatorios', 'warning')
    }

    if (!esEmailValido(email)) {
      return Swal.fire('Email inválido', 'Ingresa un correo válido (ej: usuario@empresa.com)', 'warning')
    }

    const { data: existe } = await supabase.from('personal').select('codigo').eq('codigo', codigo.trim()).single()
    if (existe) {
      return Swal.fire('Código duplicado', `El código ${codigo} ya está registrado en el sistema`, 'error')
    }

    const { data: dniExiste } = await supabase.from('personal').select('dni').eq('dni', dni.trim()).single()
    if (dniExiste) {
      return Swal.fire('DNI duplicado', `El DNI ${dni} ya está registrado en el sistema`, 'error')
    }

    setEnviando(true)

    let fotoNombre = null

    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop()
      fotoNombre = `${codigo.trim()}_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('fotos personal')
        .upload(fotoNombre, fotoFile, { upsert: true })
      if (uploadError) {
        console.error('Error subiendo foto:', uploadError)
        fotoNombre = null
      }
    }

    const payload = {
      codigo: codigo.trim(),
      dni: dni.trim(),
      email: normalizarEmail(email) || null,
      nombres: nombres.trim().toUpperCase(),
      apellidos: apellidos.trim().toUpperCase(),
      cargo: cargo || null,
      seccion: seccion || null,
      area: area || null,
      fecha_nacimiento: fechaNacimiento || null,
      fecha_ingreso: fechaIngreso || null,
      foto: fotoNombre, id_grupo_horario: grupoHorarioId || null
    }

    let { error } = await supabase.from('personal').insert([payload])

    // Compatibilidad: si aún no se ha agregado la columna email en BD.
    if (error && /column\s+"?email"?\s+does not exist/i.test(error.message || '')) {
      const { email: _omit, ...payloadSinEmail } = payload
      const retry = await supabase.from('personal').insert([payloadSinEmail])
      error = retry.error
      if (!error) {
        Swal.fire('Aviso', 'El campo Email aún no existe en la base de datos. Ejecuta el SQL de migración para guardar correos.', 'info')
      }
    }
    setEnviando(false)

    if (error) {
      Swal.fire('Error', error.message, 'error')
    } else {
      const adminUsuario = sessionStorage.getItem('admin_usuario') || 'admin'
      logBitacora({ usuario: adminUsuario, tipo_usuario: 'admin', accion: 'crear', modulo: 'personal', descripcion: `Creó colaborador: ${nombres} ${apellidos} (${codigo})`, registro_id: codigo, datos_nuevos: payload })
      Swal.fire({
        title: '¡Registrado!',
        text: `${nombres} ${apellidos} ha sido agregado al sistema`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      })
      navigate('/admin-panel')
    }
  }

  const elegibleOnomastico = fechaIngreso && new Date(fechaIngreso) <= new Date(fechaCorteOnomastico)

  return (
    <div className="max-w-[850px] mx-auto bg-gradient-to-b from-slate-50 to-white rounded-3xl border-t-[6px] border-t-corporate-green shadow-xl overflow-hidden p-6 md:p-10 my-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-dashed border-slate-200 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-corporate-blue flex items-center gap-2 uppercase tracking-wide">
            <UserPlus size={24} className="text-corporate-green" />
            Registrar Nuevo Personal
          </h2>
          <span className="text-xs text-slate-500 ml-8">Completa los datos del nuevo colaborador</span>
        </div>
        <button onClick={() => navigate('/admin-panel')} className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-bold transition-colors">
          <X size={14} /> Cancelar
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Foto + Datos principales */}
        <div className="flex flex-col sm:flex-row gap-6 md:gap-8 mb-6 items-start">
          {/* Foto */}
          <div className="flex flex-col items-center gap-2 mx-auto sm:mx-0 shrink-0">
            <div
              className="w-[120px] h-[120px] rounded-2xl border-3 border-dashed border-slate-300 overflow-hidden flex items-center justify-center bg-slate-50 cursor-pointer hover:border-corporate-green transition-colors"
              onClick={() => document.getElementById('foto-input').click()}
            >
              {fotoPreview ? (
                <img src={fotoPreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-400">
                  <Camera size={32} className="mx-auto mb-1" />
                  <div className="text-[10px]">Click para subir</div>
                </div>
              )}
            </div>
            <input id="foto-input" type="file" accept="image/*" onChange={handleFotoChange} className="hidden" />
            <span className="text-[10px] text-slate-400">Máx. 2MB</span>
          </div>

          {/* Datos principales */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 block">Código *</label>
              <input type="text" placeholder="Ej. 01002500" value={codigo} onChange={e => setCodigo(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 block">DNI *</label>
              <input type="text" placeholder="8 dígitos" value={dni} onChange={e => setDni(e.target.value)} maxLength={8} required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 block">Email</label>
              <input
                type="email"
                placeholder="usuario@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 block">Nombres *</label>
              <input type="text" placeholder="Ej. JUAN CARLOS" value={nombres} onChange={e => setNombres(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 block">Apellidos *</label>
              <input type="text" placeholder="Ej. GARCIA PEREZ" value={apellidos} onChange={e => setApellidos(e.target.value)} required
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all" />
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="h-px bg-slate-200 my-5" />

                {/* Datos laborales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 block">Cargo</label>
            <select value={cargo} onChange={e => setCargo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all bg-white">
              <option value="">Seleccionar...</option>
              {cargosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 block">Sección</label>
            <select value={seccion} onChange={e => setSeccion(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all bg-white">
              <option value="">Seleccionar...</option>
              {seccionesDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 block">Ubicación</label>
            <select value={area} onChange={e => setArea(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all bg-white">
              <option value="">Seleccionar...</option>
              {areasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1"><Clock size={12} /> Horario</label>
            <select value={grupoHorarioId} onChange={e => setGrupoHorarioId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all bg-white">
              <option value="">Seleccionar...</option>
              {gruposHorarios.map(h => <option key={h.id} value={h.id}>{h.nombre}</option>)}
            </select>
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1 ">
              <CalendarDays size={12} /> Fecha de Nacimiento
            </label>
            <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} style={{ colorScheme: 'light' }}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1 flex items-center gap-1">
              <CalendarDays size={12} /> Fecha de Ingreso
            </label>
            <input type="date" value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)} style={{ colorScheme: 'light' }}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/20 transition-all" />
          </div>
        </div>

          {/* Preview del nuevo colaborador */}
        {(nombres || apellidos || codigo) && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <IdCard size={24} className="text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <strong className="text-green-700 text-sm">{nombres || '---'} {apellidos || '---'}</strong>
              <div className="text-xs text-slate-600 flex flex-wrap gap-3 mt-1">
                {codigo && <span className="flex items-center gap-1"><IdCard size={10} /> {codigo}</span>}
                {cargo && <span className="flex items-center gap-1"><Wrench size={10} /> {cargo}</span>}
                {seccion && <span className="flex items-center gap-1"><ClipboardList size={10} /> {seccion}</span>}
              </div>
            </div>
            {fechaIngreso && (
              <span className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 ${
                elegibleOnomastico
                  ? 'bg-green-100 text-green-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {elegibleOnomastico ? <><CheckCircle size={10} className="inline mr-1" />Elegible Onomástico</> : <><Clock size={10} className="inline mr-1" />Sin Onomástico</>}
              </span>
            )}
          </div>
        )}

        {/* Botón */}
        <button
          type="submit"
          disabled={enviando}
          className={`w-full py-3.5 rounded-full text-white font-bold uppercase tracking-wider text-base transition-all duration-300 shadow-lg ${
            enviando
              ? 'bg-slate-300 cursor-not-allowed'
              : 'bg-corporate-green hover:bg-corporate-blue cursor-pointer shadow-corporate-green/40 hover:shadow-corporate-blue/40'
          }`}
        >
          {enviando ? 'Registrando...' : 'Registrar Nuevo Personal'}
        </button>
      </form>
    </div>
  )
}

export default AdminAddPersonal






