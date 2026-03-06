import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'
import { Lock, User, ArrowLeft, ShieldCheck, ArrowRight } from 'lucide-react'
import { supabase } from '../supabaseClient'
import { logBitacora } from '../utils/bitacora'

function AdminLogin() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setCargando(true)

    try {
      // Try DB-based auth first (via RPC or direct query)
      const { data } = await supabase.from('administradores').select('id, usuario, nombre_completo, rol').eq('usuario', usuario).eq('password', password).eq('activo', true).single()

      if (data) {
        // Store session
        sessionStorage.setItem('admin_usuario', data.usuario)
        sessionStorage.setItem('admin_nombre', data.nombre_completo)
        sessionStorage.setItem('admin_rol', data.rol)
        sessionStorage.setItem('admin_id', String(data.id))

        await logBitacora({
          usuario: data.usuario,
          tipo_usuario: 'admin',
          accion: 'login',
          modulo: 'auth',
          descripcion: `${data.nombre_completo} inició sesión (${data.rol})`,
        })

        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
        Toast.fire({ icon: 'success', title: `Bienvenido, ${data.nombre_completo}` })
        navigate('/admin/dashboard')
      } else {
        // Fallback: hardcoded for initial setup before DB table exists
        if (usuario === 'admin' && password === 'Cipsa419') {
          sessionStorage.setItem('admin_usuario', 'admin')
          sessionStorage.setItem('admin_nombre', 'Administrador')
          sessionStorage.setItem('admin_rol', 'super_admin')
          const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
          Toast.fire({ icon: 'success', title: 'Bienvenido Admin' })
          navigate('/admin/dashboard')
        } else {
          Swal.fire('Error', 'Usuario o contraseña incorrectos', 'error')
        }
      }
    } catch {
      // Table might not exist yet — use hardcoded fallback
      if (usuario === 'admin' && password === 'Cipsa419') {
        sessionStorage.setItem('admin_usuario', 'admin')
        sessionStorage.setItem('admin_nombre', 'Administrador')
        sessionStorage.setItem('admin_rol', 'super_admin')
        const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 })
        Toast.fire({ icon: 'success', title: 'Bienvenido Admin' })
        navigate('/admin/dashboard')
      } else {
        Swal.fire('Error', 'Usuario o contraseña incorrectos', 'error')
      }
    }

    setCargando(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-corporate-blue relative overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <ShieldCheck size={22} className="text-corporate-green" />
            </div>
            <span className="text-white/60 text-sm font-bold uppercase tracking-widest">SERTEC</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            Panel<br />
            <span className="text-corporate-green">Administrativo</span>
          </h1>
          <p className="text-white/50 text-base max-w-sm leading-relaxed">
            Gestiona el directorio de personal, aprueba solicitudes y supervisa las compensaciones del equipo.
          </p>
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-[10px] uppercase tracking-wider font-bold mb-1">Desarrollado por SERTEC TI</p>
          <p className="text-white/20 text-xs">&copy; {new Date().getFullYear()} SERTEC &mdash; Desarrollado por SERTEC TI</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-bg-soft px-4 py-8">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-corporate-blue flex items-center justify-center shadow-lg">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-corporate-blue uppercase tracking-wider">Panel Admin</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-corporate-blue flex items-center justify-center mb-4 shadow-lg">
                <Lock size={28} className="text-white" />
              </div>
              <h2 className="text-xl font-black text-corporate-blue uppercase tracking-wider">Acceso Administrativo</h2>
              <p className="text-sm text-gray-400 mt-1">Ingresa con tus credenciales de administrador</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wide">Usuario</label>
                <div className="relative mt-1.5">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    autoFocus
                    className="w-full pl-11 pr-5 py-3.5 bg-bg-soft border border-gray-200 rounded-2xl text-base text-gray-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 focus:bg-white transition-all"
                    placeholder="admin"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wide">Contraseña</label>
                <div className="relative mt-1.5">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-5 py-3.5 bg-bg-soft border border-gray-200 rounded-2xl text-base text-gray-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 focus:bg-white transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={cargando}
                className="w-full py-4 mt-2 bg-corporate-blue text-white font-bold uppercase text-sm tracking-wide rounded-2xl shadow-[0_12px_20px_-8px_rgba(25,59,72,0.4)] hover:shadow-[0_16px_25px_-8px_rgba(25,59,72,0.5)] hover:brightness-110 active:scale-[0.98] transition-all border-none cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <span>{cargando ? 'INGRESANDO...' : 'INGRESAR'}</span>{!cargando && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-corporate-blue bg-transparent border-none cursor-pointer transition-colors"
              >
                <ArrowLeft size={14} /> Volver al portal de empleados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
