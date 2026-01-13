import { useState } from 'react'
import { supabase } from './supabaseClient'
import Swal from 'sweetalert2' // Importamos las alertas bonitas
import './App.css'

function App() {
  const [codigoInput, setCodigoInput] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [trabajador, setTrabajador] = useState(null)

  // Datos del formulario
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [inicio, setInicio] = useState('18:00')
  const [fin, setFin] = useState('19:00')
  const [motivo, setMotivo] = useState('')

  // CONFIGURACIÓN (Tus URLs)
  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  // Asegúrate de poner el nombre REAL de tu bucket aquí abajo si no es 'fotos-personal'
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos personal/`

  // --- BUSCAR TRABAJADOR ---
  const buscarTrabajador = async () => {
    if (!codigoInput) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo vacío',
        text: 'Por favor ingrese un código de trabajador.',
        confirmButtonColor: '#0f172a'
      })
      return
    }
    
    setBuscando(true)
    setTrabajador(null)

    const { data, error } = await supabase
      .from('personal')
      .select('*')
      .eq('codigo', codigoInput)
      .single()

    if (error || !data) {
      Swal.fire({
        icon: 'error',
        title: 'No encontrado',
        text: 'El código ingresado no existe en la base de datos.',
        confirmButtonColor: '#d33'
      })
    } else {
      // Éxito al encontrar (opcional mostrar alerta o solo mostrar la tarjeta)
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      })
      Toast.fire({
        icon: 'success',
        title: 'Trabajador identificado'
      })
      setTrabajador(data)
    }
    setBuscando(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      buscarTrabajador()
    }
  }

  // --- GUARDAR REGISTRO ---
  const guardarRegistro = async (e) => {
    e.preventDefault()
    if (!trabajador) return

    // Validación simple
    if (!motivo) {
        Swal.fire('Falta el motivo', 'Por favor describe la actividad realizada', 'warning')
        return
    }

    setEnviando(true)

    const datosParaGuardar = {
      nombre_empleado: `${trabajador.nombres} ${trabajador.apellidos}`,
      codigo_trabajador: trabajador.codigo,
      area: trabajador.area,
      cargo: trabajador.cargo,
      fecha_actividad: fecha,
      hora_inicio: inicio,
      hora_fin: fin,
      motivo: motivo
    }

    const { error } = await supabase
      .from('registro_horas') // Nombre corregido de tu tabla
      .insert([datosParaGuardar])

    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al guardar',
        text: error.message
      })
    } else {
      // Alerta de éxito profesional
      Swal.fire({
        title: '¡Registrado!',
        text: 'La hora extra ha sido guardada correctamente.',
        icon: 'success',
        confirmButtonColor: '#16a34a'
      })
      
      // Limpieza
      setMotivo('')
      setTrabajador(null)
      setCodigoInput('')
    }
    setEnviando(false)
  }

  return (
    <div className="container">
      <h1>⏰ Control de Horas Extras</h1>

      <form onSubmit={guardarRegistro}>
        
        {/* BUSCADOR */}
        <div className="search-box">
          <label className="search-label">Código del Colaborador</label>
          <div className="input-group">
            <input 
              type="text" 
              placeholder="Ej. 1045" 
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button 
              type="button" 
              className="btn-search"
              onClick={buscarTrabajador}
              disabled={buscando}
            >
              {buscando ? '...' : 'Buscar'}
            </button>
          </div>
        </div>

        {/* TARJETA DE EMPLEADO */}
        {trabajador && (
          <div className="employee-card">
            <img 
              src={trabajador.foto ? `${STORAGE_URL}${trabajador.foto}` : 'https://via.placeholder.com/150'} 
              alt="Perfil" 
              className="avatar"
              onError={(e) => e.target.src = 'https://ui-avatars.com/api/?name=' + trabajador.nombres}
            />
            <div className="employee-info">
              <h3>{trabajador.nombres} {trabajador.apellidos}</h3>
              <span className="badge badge-cargo">{trabajador.cargo}</span>
              <span className="badge badge-area">{trabajador.area}</span>
            </div>
          </div>
        )}

        {/* CAMPOS DEL FORMULARIO */}
        <fieldset disabled={!trabajador} style={{ border: 'none', padding: 0, margin: 0, opacity: trabajador ? 1 : 0.5 }}>
          
          <div className="form-grid">
            <div>
              <label className="form-label">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Inicio</label>
              <input type="time" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Fin</label>
              <input type="time" value={fin} onChange={(e) => setFin(e.target.value)} />
            </div>
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label className="form-label">Motivo de la actividad</label>
            <textarea 
              value={motivo} 
              onChange={(e) => setMotivo(e.target.value)} 
              placeholder="Describa brevemente la labor realizada..."
              rows="3" 
            />
          </div>

          <button 
            type="submit" 
            className="btn-submit"
            disabled={enviando}
          >
            {enviando ? 'Guardando...' : 'CONFIRMAR REGISTRO'}
          </button>
        </fieldset>

      </form>
    </div>
  )
}

export default App