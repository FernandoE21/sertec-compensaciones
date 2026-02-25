import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Swal from 'sweetalert2'
import './App.css'

function AdminAddPersonal() {
  const navigate = useNavigate()
  const [enviando, setEnviando] = useState(false)
  const [fotoFile, setFotoFile] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
  const [fechaCorteOnomastico, setFechaCorteOnomastico] = useState('2024-11-30')

  useEffect(() => {
    const cargarConfig = async () => {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'onomastico_fecha_corte').single()
      if (data) setFechaCorteOnomastico(data.valor)
    }
    cargarConfig()
  }, [])

  // Campos del formulario
  const [codigo, setCodigo] = useState('')
  const [dni, setDni] = useState('')
  const [nombres, setNombres] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [cargo, setCargo] = useState('')
  const [seccion, setSeccion] = useState('')
  const [area, setArea] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [fechaIngreso, setFechaIngreso] = useState('')

  const seccionesDisponibles = [
    'CIL', 'CELSA', 'INSPECCION', 'NESTLE', 'CAD', 'CPEI', 
    'SERTEC', 'PPL LINDLEY', 'SPSA CORRECTIVO', 'BACKUS'
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
    'CIPSA - TECNICO', 'CIPSA - ADM', 'CIPSA - SUPERVISOR TECNICO',
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

    // Validaciones
    if (!codigo.trim() || !dni.trim() || !nombres.trim() || !apellidos.trim()) {
      return Swal.fire('Campos requeridos', 'Código, DNI, Nombres y Apellidos son obligatorios', 'warning')
    }

    // Validar código único
    const { data: existe } = await supabase.from('personal').select('codigo').eq('codigo', codigo.trim()).single()
    if (existe) {
      return Swal.fire('Código duplicado', `El código ${codigo} ya está registrado en el sistema`, 'error')
    }

    // Validar DNI único
    const { data: dniExiste } = await supabase.from('personal').select('dni').eq('dni', dni.trim()).single()
    if (dniExiste) {
      return Swal.fire('DNI duplicado', `El DNI ${dni} ya está registrado en el sistema`, 'error')
    }

    setEnviando(true)

    let fotoNombre = null

    // Subir foto si existe
    if (fotoFile) {
      const ext = fotoFile.name.split('.').pop()
      fotoNombre = `${codigo.trim()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('fotos personal')
        .upload(fotoNombre, fotoFile, { upsert: true })
      if (uploadError) {
        console.error('Error subiendo foto:', uploadError)
        // Continúa sin foto si falla
        fotoNombre = null
      }
    }

    const payload = {
      codigo: codigo.trim(),
      dni: dni.trim(),
      nombres: nombres.trim().toUpperCase(),
      apellidos: apellidos.trim().toUpperCase(),
      cargo: cargo || null,
      seccion: seccion || null,
      area: area || null,
      fecha_nacimiento: fechaNacimiento || null,
      fecha_ingreso: fechaIngreso || null,
      foto: fotoNombre
    }

    const { error } = await supabase.from('personal').insert([payload])
    setEnviando(false)

    if (error) {
      Swal.fire('Error', error.message, 'error')
    } else {
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

  const roundedInputStyle = {
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  }

  const labelStyle = {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  }

  return (
    <div className="container container-wide" style={{
      maxWidth: '850px',
      borderTop: '6px solid #7db100',
      borderRadius: '24px',
      boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div className="header-profile-bar" style={{ paddingBottom: '15px', marginBottom: '20px', borderBottom: '1px dashed #e2e8f0' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="heading" style={{ margin: 0, textAlign: 'left', fontSize: '22px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: '#7db100', fontSize: '24px' }}>➕</span>
            Registrar Nuevo Personal
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '36px' }}>Completa los datos del nuevo colaborador</span>
        </div>
        <button onClick={() => navigate('/admin-panel')} className="btn-back" style={{ borderRadius: '20px' }}>✕ Cancelar</button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Foto + Datos principales */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '25px', alignItems: 'flex-start' }}>
          
          {/* Foto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', minWidth: '140px' }}>
            <div style={{
              width: '120px', height: '120px', borderRadius: '20px',
              border: '3px dashed #cbd5e1', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#f8fafc', cursor: 'pointer', position: 'relative'
            }} onClick={() => document.getElementById('foto-input').click()}>
              {fotoPreview ? (
                <img src={fotoPreview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '32px' }}>📷</div>
                  <div style={{ fontSize: '10px', marginTop: '4px' }}>Click para subir</div>
                </div>
              )}
            </div>
            <input id="foto-input" type="file" accept="image/*" onChange={handleFotoChange} style={{ display: 'none' }} />
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Máx. 2MB</span>
          </div>

          {/* Datos principales */}
          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={labelStyle}>Código *</label>
              <input
                className="input" type="text" placeholder="Ej. 01002500"
                value={codigo} onChange={e => setCodigo(e.target.value)}
                required style={roundedInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>DNI *</label>
              <input
                className="input" type="text" placeholder="8 dígitos"
                value={dni} onChange={e => setDni(e.target.value)}
                maxLength={8} required style={roundedInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nombres *</label>
              <input
                className="input" type="text" placeholder="Ej. JUAN CARLOS"
                value={nombres} onChange={e => setNombres(e.target.value)}
                required style={roundedInputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Apellidos *</label>
              <input
                className="input" type="text" placeholder="Ej. GARCIA PEREZ"
                value={apellidos} onChange={e => setApellidos(e.target.value)}
                required style={roundedInputStyle}
              />
            </div>
          </div>
        </div>

        {/* Separador */}
        <div style={{ height: '1px', background: '#e2e8f0', margin: '10px 0 20px' }}></div>

        {/* Datos laborales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Cargo</label>
            <select className="input" value={cargo} onChange={e => setCargo(e.target.value)} style={roundedInputStyle}>
              <option value="">Seleccionar...</option>
              {cargosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Sección</label>
            <select className="input" value={seccion} onChange={e => setSeccion(e.target.value)} style={roundedInputStyle}>
              <option value="">Seleccionar...</option>
              {seccionesDisponibles.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Ubicación</label>
            <select className="input" value={area} onChange={e => setArea(e.target.value)} style={roundedInputStyle}>
              <option value="">Seleccionar...</option>
              {areasDisponibles.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Fechas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
          <div>
            <label style={labelStyle}>📅 Fecha de Nacimiento</label>
            <input
              type="date" className="input"
              value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)}
              style={roundedInputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>📅 Fecha de Ingreso</label>
            <input
              type="date" className="input"
              value={fechaIngreso} onChange={e => setFechaIngreso(e.target.value)}
              style={roundedInputStyle}
            />
          </div>
        </div>

        {/* Preview del nuevo colaborador */}
        {(nombres || apellidos || codigo) && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px',
            padding: '15px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px'
          }}>
            <span style={{ fontSize: '24px' }}>👤</span>
            <div>
              <strong style={{ color: '#15803d', fontSize: '14px' }}>{nombres || '---'} {apellidos || '---'}</strong>
              <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '15px', marginTop: '3px' }}>
                {codigo && <span>🆔 {codigo}</span>}
                {cargo && <span>🛠️ {cargo}</span>}
                {seccion && <span>📋 {seccion}</span>}
              </div>
            </div>
            {fechaIngreso && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <span style={{
                  fontSize: '10px',
                  background: new Date(fechaIngreso) <= new Date(fechaCorteOnomastico) ? '#dcfce7' : '#fef3c7',
                  color: new Date(fechaIngreso) <= new Date(fechaCorteOnomastico) ? '#15803d' : '#92400e',
                  padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold'
                }}>
                  {new Date(fechaIngreso) <= new Date(fechaCorteOnomastico) ? '✅ Elegible Onomástico' : '⏳ Sin Onomástico'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Botón */}
        <button
          type="submit"
          className="login-button"
          disabled={enviando}
          style={{
            width: '100%', padding: '14px', fontSize: '16px',
            fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px',
            borderRadius: '50px',
            background: enviando ? '#ccc' : '#7db100',
            color: 'white', border: 'none',
            cursor: enviando ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 20px -5px rgba(125, 177, 0, 0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => !enviando && (e.target.style.background = '#193b48')}
          onMouseOut={(e) => !enviando && (e.target.style.background = '#7db100')}
        >
          {enviando ? 'Registrando...' : '✅ REGISTRAR NUEVO PERSONAL'}
        </button>
      </form>
    </div>
  )
}

export default AdminAddPersonal
