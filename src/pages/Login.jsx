import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { Eye, EyeOff, Megaphone, ShieldCheck, Clock, ArrowRight } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function Login() {
  const navigate = useNavigate()
  const [codigoInput, setCodigoInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [textoCierre, setTextoCierre] = useState('')

  useEffect(() => {
    const hoy = new Date()
    const dia = hoy.getDate(), mes = hoy.getMonth(), anio = hoy.getFullYear()
    const fc = dia <= 21 ? new Date(anio, mes, 21) : new Date(anio, mes + 1, 21)
    setTextoCierre(fc.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }).toUpperCase())
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    const codigoLimpio = codigoInput.trim()
    const passLimpio = passwordInput.trim()

    if (!codigoLimpio || !passLimpio) {
      return Swal.fire({ title: 'Datos incompletos', text: 'Ingresa Código y DNI', icon: 'warning', confirmButtonColor: '#193b48' })
    }

    setBuscando(true)
    // Try password field first, fallback to DNI
    let { data, error } = await supabase.from('personal').select('*').eq('codigo', codigoLimpio).eq('password', passLimpio).single()
    if (error || !data) {
      const res = await supabase.from('personal').select('*').eq('codigo', codigoLimpio).eq('dni', passLimpio).single()
      data = res.data; error = res.error
    }
    setBuscando(false)

    if (error || !data) {
      Swal.fire({ title: 'Acceso Denegado', text: 'Código o Contraseña incorrectos', icon: 'error', confirmButtonColor: '#d33' })
    } else {
      const nom = data.nombres.split(' ')[0]
      const nomBonito = nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase()
      logBitacora({ usuario: codigoLimpio, tipo_usuario: 'empleado', accion: 'login', modulo: 'auth', descripcion: `${data.nombres} ${data.apellidos} inició sesión` })
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, timerProgressBar: true })
      Toast.fire({ icon: 'success', title: `¡Hola, ${nomBonito}!` })
      setTimeout(() => navigate(`/registros/${codigoLimpio}`), 800)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[45%] bg-corporate-blue relative overflow-hidden flex-col justify-between p-12">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-corporate-green flex items-center justify-center shadow-lg">
              <Clock size={22} className="text-white" />
            </div>
            <span className="text-white/60 text-sm font-bold uppercase tracking-widest">SERTEC</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
            Portal de<br />
            <span className="text-corporate-green">Compensaciones</span>
          </h1>
          <p className="text-white/50 text-base max-w-sm leading-relaxed">
            Registra y gestiona tus horas extras, compensaciones y sobretiempos de forma rápida y transparente.
          </p>
          <div className="flex gap-6 pt-4">
            <div className="text-center">
              <div className="text-2xl font-black text-corporate-green">24/7</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">Disponible</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-black text-corporate-green">100%</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">Digital</div>
            </div>
            <div className="w-px bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-black text-corporate-green">PWA</div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold mt-1">Instalable</div>
            </div>
          </div>
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
              <Clock size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-black text-corporate-blue uppercase tracking-wider">Portal de Horas</h1>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-corporate-blue">Bienvenido</h2>
              <p className="text-sm text-gray-400 mt-1">Ingresa tus credenciales para continuar</p>
            </div>

            {/* Banner de cierre */}
            <div className="flex gap-3 items-start bg-amber-50 border-l-4 border-amber-400 text-amber-800 p-3.5 rounded-xl mb-7 text-sm leading-relaxed">
              <Megaphone size={18} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <strong className="text-amber-700 font-extrabold text-xs">CIERRE DE MES {textoCierre}</strong>
                <br /><span className="text-xs">Recuerda registrar y validar tus horas extras.</span>
              </div>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wide">Código de trabajador</label>
                <input
                  type="text"
                  placeholder="Ej. 0100xxxx"
                  value={codigoInput}
                  onChange={(e) => setCodigoInput(e.target.value)}
                  autoFocus
                  className="w-full mt-1.5 px-4 py-3.5 bg-bg-soft border border-gray-200 rounded-2xl text-center text-base tracking-wider text-gray-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 ml-1 uppercase tracking-wide">Contraseña</label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digíte su contraseña"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3.5 pr-12 bg-bg-soft border border-gray-200 rounded-2xl text-center text-base tracking-widest text-gray-700 focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-700 bg-transparent border-none cursor-pointer transition-colors"
                    title={showPassword ? 'Ocultar' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={buscando}
                className="w-full py-4 mt-2 bg-gradient-to-r from-corporate-green to-green-accent text-white font-bold uppercase text-sm tracking-wide rounded-2xl shadow-[0_12px_20px_-8px_rgba(125,177,0,0.4)] hover:shadow-[0_16px_25px_-8px_rgba(125,177,0,0.5)] hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed border-none cursor-pointer flex items-center justify-center gap-2"
              >
                {buscando ? 'Verificando...' : <><span>INGRESAR AL PORTAL</span><ArrowRight size={18} /></>}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-corporate-blue bg-transparent border-none cursor-pointer transition-colors font-semibold"
              >
                <ShieldCheck size={14} />
                Acceso Administrativo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
