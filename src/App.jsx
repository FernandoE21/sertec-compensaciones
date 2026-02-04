import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './supabaseClient'
import Swal from 'sweetalert2'
import './App.css'

function App() {
  const navigate = useNavigate()
  
  // Estados
  const [codigoInput, setCodigoInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('') 
  const [showPassword, setShowPassword] = useState(false) // <--- NUEVO ESTADO PARA EL OJO
  
  const [buscando, setBuscando] = useState(false)
  const [textoCierre, setTextoCierre] = useState('')

  // Lógica de fecha (se mantiene igual)
  useEffect(() => {
    const hoy = new Date(); const dia = hoy.getDate(); const mes = hoy.getMonth(); const anio = hoy.getFullYear();
    let fc; if (dia <= 21) { fc = new Date(anio, mes, 21) } else { fc = new Date(anio, mes + 1, 21) }
    setTextoCierre(fc.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }).toUpperCase())
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    const codigoLimpio = codigoInput.trim()
    const passLimpio = passwordInput.trim()

    if (!codigoLimpio || !passLimpio) {
        return Swal.fire({ title: 'Datos incompletos', text: 'Ingresa Código y DNI', icon: 'warning', confirmButtonColor: '#193b48'})
    }
    
    setBuscando(true)
    const { data, error } = await supabase.from('personal').select('*').eq('codigo', codigoLimpio).eq('dni', passLimpio).single()
    setBuscando(false)

    if (error || !data) {
      Swal.fire({ title: 'Acceso Denegado', text: 'Código o Contraseña incorrectos', icon: 'error', confirmButtonColor: '#d33' })
    } else {
      const nom = data.nombres.split(' ')[0]; const nomBonito = nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase()
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true, didOpen: (t) => { t.addEventListener('mouseenter', Swal.stopTimer); t.addEventListener('mouseleave', Swal.resumeTimer) } })
      Toast.fire({ icon: 'success', title: `¡Hola, ${nomBonito}!` })
      setTimeout(() => { navigate(`/registros/${codigoLimpio}`) }, 800)
    }
  }

  return (
    <div className="container" style={{maxWidth: '400px', textAlign: 'center'}}>
      <h1 className="heading">Portal de Horas</h1>
      
      <div className="info-banner" style={{textAlign: 'left', marginBottom: '30px'}}>
        <span className="info-icon">📢</span>
        <div><strong>IMPORTANTE: CIERRE DE MES {textoCierre}</strong><br/>Recuerda registrar y validar tus horas extras.</div>
      </div>

      <form onSubmit={handleLogin} className="input-group" style={{flexDirection: 'column', gap: '15px'}}>
        
        {/* INPUT CÓDIGO */}
        <div style={{width: '100%', textAlign:'left'}}>
            <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', marginLeft:'5px'}}>CÓDIGO</label>
            <input 
                className="input" type="text" placeholder="Ej. 0100xxxx" 
                value={codigoInput} onChange={(e) => setCodigoInput(e.target.value)} 
                autoFocus 
                style={{marginTop: '5px', textAlign: 'center', fontSize: '16px', letterSpacing: '1px'}}
            />
        </div>

        {/* INPUT PASSWORD CON OJITO */}
        <div style={{width: '100%', textAlign:'left'}}>
            <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', marginLeft:'5px'}}>CONTRASEÑA</label>
            
            <div className="password-wrapper">
                <input 
                    className="input" 
                    // AQUÍ LA MAGIA: Si showPassword es true, es 'text', si no 'password'
                    type={showPassword ? "text" : "password"}  
                    placeholder="Digíte su contraseña" 
                    value={passwordInput} 
                    onChange={(e) => setPasswordInput(e.target.value)} 
                    style={{marginTop: '5px', textAlign: 'center', fontSize: '16px', letterSpacing: '2px'}}
                />
                
                {/* BOTÓN TOGGLE (Ojo) */}
                <button 
                    type="button" // Importante: type="button" para que no envíe el formulario
                    className="btn-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                    {showPassword ? (
                        /* ÍCONO OJO TACHADO (Hide) */
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                    ) : (
                        /* ÍCONO OJO ABIERTO (Show) */
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    )}
                </button>
            </div>
        </div>

        <button type="submit" className="login-button" disabled={buscando} style={{marginTop: '20px'}}>
            {buscando ? 'Verificando...' : 'INGRESAR AL PORTAL'}
        </button>
      </form>

      <div style={{marginTop: '40px'}}>
        <button type="button" onClick={() => navigate('/admin')} style={{ background: 'transparent', color: '#94a3b8', border: 'none', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
             Acceso Administrativo
        </button>
      </div>
    </div>
  )
}

export default App