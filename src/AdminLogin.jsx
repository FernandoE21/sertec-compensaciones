import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import './App.css'

function AdminLogin() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleLogin = (e) => {
    e.preventDefault()
    // Validación "Hardcoded" (Sencilla para tu MVP)
    if (usuario === 'admin' && password === 'admin') {
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
      Toast.fire({ icon: 'success', title: 'Bienvenido Admin' })
      navigate('/admin-panel') // Te manda al dashboard
    } else {
      Swal.fire('Error', 'Usuario o contraseña incorrectos', 'error')
    }
  }

  return (
    <div className="container" style={{maxWidth: '400px', textAlign: 'center'}}>
      <h2 className="heading">🔐 Acceso Administrativo</h2>
      <form onSubmit={handleLogin}>
        <label className="label">Usuario</label>
        <input 
          type="text" className="input" 
          value={usuario} onChange={(e) => setUsuario(e.target.value)} 
          autoFocus
        />
        
        <label className="label">Contraseña</label>
        <input 
          type="password" className="input" 
          value={password} onChange={(e) => setPassword(e.target.value)} 
        />

        <button type="submit" className="login-button">INGRESAR</button>
        <button 
          type="button" 
          onClick={() => navigate('/')} 
          className="btn-small" 
          style={{marginTop: '20px', width: '100%', border: 'none'}}
        >
          ← Volver al inicio
        </button>
      </form>
    </div>
  )
}

export default AdminLogin