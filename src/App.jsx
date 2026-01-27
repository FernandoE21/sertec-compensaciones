import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Swal from 'sweetalert2'
import './App.css'

function App() {
  const navigate = useNavigate()
  const [codigoInput, setCodigoInput] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [textoCierre, setTextoCierre] = useState('')

  // Lógica para calcular la fecha de cierre (Día 21)
  useEffect(() => {
    const hoy = new Date()
    const dia = hoy.getDate()
    const mes = hoy.getMonth()
    const anio = hoy.getFullYear()
    
    let fechaCierre
    // Si estamos antes o igual al 21, el cierre es ESTE mes.
    // Si estamos después del 21 (ej. 22), el cierre es el PRÓXIMO mes.
    if (dia <= 21) {
        fechaCierre = new Date(anio, mes, 21)
    } else {
        fechaCierre = new Date(anio, mes + 1, 21)
    }

    // Formateamos la fecha a texto (Ej: "21 de Enero")
    const opciones = { day: 'numeric', month: 'long' }
    setTextoCierre(fechaCierre.toLocaleDateString('es-ES', opciones).toUpperCase())
  }, [])

  const handleLogin = async () => {
    const codigoLimpio = codigoInput.trim()
    if (!codigoLimpio) return Swal.fire({title: '¡Ups!', text: 'Ingresa un código', icon: 'warning', confirmButtonColor: '#193b48'})
    
    setBuscando(true)
    const { data, error } = await supabase.from('personal').select('*').eq('codigo', codigoLimpio).single()
    setBuscando(false)

    if (error || !data) {
      Swal.fire({title: 'No encontrado', text: 'Verifica el código', icon: 'error', confirmButtonColor: '#d33'})
    } else {
      navigate(`/registros/${codigoLimpio}`)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleLogin(); }
  }

  return (
    <div className="container" style={{maxWidth: '400px', textAlign: 'center'}}>
      <h1 className="heading">Portal de Horas</h1>
      
      {/* --- NUEVO AVISO / TOOLTIP --- */}
      <div className="info-banner" style={{textAlign: 'left', marginBottom: '30px'}}>
        <span className="info-icon">📢</span>
        <div>
            <strong>IMPORTANTE: CIERRE DE MES {textoCierre}</strong><br/>
            Recuerda registrar y validar tus horas extras, permisos y vacaciones antes de la fecha indicada para asegurar el pago correcto.
        </div>
      </div>

      <div className="input-group" style={{flexDirection: 'column'}}>
        <input 
            className="input" type="text" placeholder="Código de Colaborador" 
            value={codigoInput} onChange={(e) => setCodigoInput(e.target.value)} 
            onKeyDown={handleKeyDown} autoFocus 
            style={{marginTop: 0, textAlign: 'center', fontSize: '18px', letterSpacing: '2px'}}
        />
        <button type="button" className="login-button" onClick={handleLogin} disabled={buscando} style={{marginTop: '20px'}}>
            {buscando ? 'Verificando...' : 'INGRESAR AL PORTAL'}
        </button>
      </div>

      <div style={{marginTop: '40px'}}>
        <button onClick={() => navigate('/admin')} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
             Acceso Administrativo
        </button>
      </div>
    </div>
  )
}

export default App