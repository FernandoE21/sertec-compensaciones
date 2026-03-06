import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ClipboardList, PlusCircle, LogOut, Headset, Phone, Mail, KeyRound, Lock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { logBitacora } from '../utils/bitacora'

function UserSidebar({ codigo }) {
  const [open, setOpen] = useState(false)
  const [showSoporte, setShowSoporte] = useState(false)
  const [showCambiarPass, setShowCambiarPass] = useState(false)
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [passConfirmar, setPassConfirmar] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const links = [
    { label: 'Mis Registros', icon: ClipboardList, path: `/registros/${codigo}` },
    { label: 'Nueva Solicitud', icon: PlusCircle, path: `/nuevo-registro/${codigo}` },
  ]

  const handleNavigate = (path) => {
    navigate(path)
    setOpen(false)
  }

  const handleCambiarPassword = async (e) => {
    e.preventDefault()
    if (passNueva !== passConfirmar) {
      Swal.fire('Error', 'Las contraseñas no coinciden', 'error')
      return
    }
    if (passNueva.length < 6) {
      Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }
    setCambiandoPass(true)

    // Verify current password (check password field first, then DNI)
    const { data: user } = await supabase.from('personal').select('dni, password').eq('codigo', codigo).single()
    if (!user) {
      Swal.fire('Error', 'No se encontró el usuario', 'error')
      setCambiandoPass(false)
      return
    }
    const validPass = (user.password && user.password === passActual) || user.dni === passActual
    if (!validPass) {
      Swal.fire('Error', 'La contraseña actual es incorrecta', 'error')
      setCambiandoPass(false)
      return
    }

    const { error } = await supabase.from('personal').update({ password: passNueva }).eq('codigo', codigo)
    setCambiandoPass(false)
    if (error) {
      Swal.fire('Error', error.message, 'error')
    } else {
      logBitacora({ usuario: codigo, tipo_usuario: 'empleado', accion: 'cambiar_password', modulo: 'personal', descripcion: `Empleado ${codigo} cambió su contraseña` })
      Swal.fire({ title: '¡Contraseña Actualizada!', text: 'Tu nueva contraseña ya está activa', icon: 'success', timer: 2000, showConfirmButton: false })
      setPassActual('')
      setPassNueva('')
      setPassConfirmar('')
      setShowCambiarPass(false)
    }
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-corporate-blue text-white shadow-md">
        <div className="flex items-center justify-between px-4 h-14 max-w-7xl mx-auto">
          <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-white/10 transition-colors border-none bg-transparent text-white cursor-pointer md:hidden">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
          <span className="text-sm font-bold tracking-wide uppercase">Portal de Horas — SERTEC</span>
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border-none text-white cursor-pointer">
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-56 bg-corporate-blue flex-col z-40 shadow-lg">
        <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path ||
              (link.path.includes('/registros/') && location.pathname.includes('/registros/') && !location.pathname.includes('/admin'))
            return (
              <button
                key={link.label}
                onClick={() => handleNavigate(link.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${
                  isActive
                    ? 'bg-corporate-green text-white shadow-md'
                    : 'text-white/70 hover:bg-white/10 hover:text-white bg-transparent'
                }`}
              >
                <link.icon size={18} />
                {link.label}
              </button>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <button
            onClick={() => setShowCambiarPass(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer text-white/70 hover:bg-white/10 hover:text-white bg-transparent w-full"
          >
            <KeyRound size={18} />
            Cambiar Contraseña
          </button>
          <button
            onClick={() => setShowSoporte(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer text-white/70 hover:bg-white/10 hover:text-white bg-transparent w-full"
          >
            <Headset size={18} />
            Soporte TI
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-corporate-blue shadow-2xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
              <span className="text-white font-bold text-sm">Menú</span>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 border-none bg-transparent cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
              {links.map((link) => {
                const isActive = location.pathname === link.path ||
                  (link.path.includes('/registros/') && location.pathname.includes('/registros/') && !location.pathname.includes('/admin'))
                return (
                  <button
                    key={link.label}
                    onClick={() => handleNavigate(link.path)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${
                      isActive
                        ? 'bg-corporate-green text-white'
                        : 'text-white/70 hover:bg-white/10 hover:text-white bg-transparent'
                    }`}
                  >
                    <link.icon size={18} />
                    {link.label}
                  </button>
                )
              })}
            </nav>
            <div className="p-3 border-t border-white/10 space-y-1">
              <button
                onClick={() => { setOpen(false); setShowCambiarPass(true) }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer text-white/70 hover:bg-white/10 hover:text-white bg-transparent w-full"
              >
                <KeyRound size={18} />
                Cambiar Contraseña
              </button>
              <button
                onClick={() => { setOpen(false); setShowSoporte(true) }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer text-white/70 hover:bg-white/10 hover:text-white bg-transparent w-full"
              >
                <Headset size={18} />
                Soporte TI
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Cambiar Contraseña Modal */}
      {showCambiarPass && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCambiarPass(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-corporate-blue rounded-t-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <KeyRound size={28} className="text-corporate-green" />
              </div>
              <h3 className="text-xl font-black text-white">Cambiar Contraseña</h3>
              <p className="text-white/50 text-sm mt-1">Código: {codigo}</p>
            </div>
            <form onSubmit={handleCambiarPassword} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Contraseña Actual</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" value={passActual} onChange={e => setPassActual(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" placeholder="DNI o contraseña actual" required />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Nueva Contraseña</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" value={passNueva} onChange={e => setPassNueva(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" placeholder="Mínimo 6 caracteres" required minLength={6} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Confirmar Contraseña</label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="password" value={passConfirmar} onChange={e => setPassConfirmar(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" placeholder="Repite la contraseña" required />
                </div>
                {passNueva && passConfirmar && passNueva !== passConfirmar && (
                  <p className="text-[11px] text-red-500 mt-1 font-semibold">Las contraseñas no coinciden</p>
                )}
              </div>
              <button type="submit" disabled={cambiandoPass || !passActual || !passNueva || passNueva !== passConfirmar} className="w-full py-3 bg-corporate-green text-white font-bold text-sm rounded-xl transition-all border-none cursor-pointer hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {cambiandoPass ? 'Cambiando...' : 'Cambiar Contraseña'}
              </button>
              <button type="button" onClick={() => setShowCambiarPass(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-xl transition-colors border-none cursor-pointer">
                Cancelar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Soporte TI Modal */}
      {showSoporte && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowSoporte(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-corporate-blue rounded-t-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                <Headset size={28} className="text-corporate-green" />
              </div>
              <h3 className="text-xl font-black text-white">Soporte SERTEC TI</h3>
              <p className="text-white/50 text-sm mt-1">¿Necesitas ayuda? Contáctanos</p>
            </div>
            <div className="p-6 space-y-2">
              {[
                { nombre: 'Luis Vilchez', cargo: 'Jefe de SERTEC TI', tel: '+51 998 390 232', wa: '51998390232', email: 'lvilchez@cipsa.com.pe' },
                { nombre: 'Fernando Espinoza', cargo: 'SERTEC TI', tel: '+51 949 598 482', wa: '51949598482', email: 'fespinoza@cipsa.com.pe' },
                { nombre: 'Alfredo Quispe', cargo: 'SERTEC TI', tel: '+51 998 193 548', wa: '51998193548', email: 'jaquispe@cipsa.com.pe' },
                { nombre: 'Jorge Amaya', cargo: 'SERTEC TI', tel: '+51 964 836 207', wa: '51964836207', email: 'jamaya@cipsa.com.pe' },
              ].map((p) => (
                <div key={p.wa} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4 hover:bg-gray-50 hover:border-corporate-green/30 hover:shadow-sm transition-all cursor-default">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{p.nombre}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{p.cargo}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{p.tel}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`mailto:${p.email}`} className="flex items-center justify-center w-9 h-9 bg-corporate-blue/10 hover:bg-corporate-blue hover:text-white text-corporate-blue rounded-lg transition-colors no-underline" title={p.email}>
                      <Mail size={15} />
                    </a>
                    <a href={`https://wa.me/${p.wa}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-9 h-9 bg-green-50 hover:bg-green-500 hover:text-white text-green-600 rounded-lg transition-colors no-underline" title="WhatsApp">
                      <Phone size={15} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setShowSoporte(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm rounded-xl transition-colors border-none cursor-pointer">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UserSidebar
