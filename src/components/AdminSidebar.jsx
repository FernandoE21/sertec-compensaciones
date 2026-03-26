import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, Users, LogOut, Settings, Headset, Phone, Mail, LayoutDashboard, UserPlus, ScrollText, ShieldCheck, Clock } from 'lucide-react'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'

function AdminSidebar() {
  const [open, setOpen] = useState(false)
  const [showSoporte, setShowSoporte] = useState(false)
  const [adminData, setAdminData] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    sessionStorage.removeItem('admin_usuario')
    sessionStorage.removeItem('admin_rol')
    sessionStorage.removeItem('admin_nombre')
    navigate('/admin', { replace: true })
  }

  useEffect(() => {
    const adminUsuario = sessionStorage.getItem('admin_usuario')
    if (adminUsuario) {
      supabase.from('administradores').select('*').eq('usuario', adminUsuario).single().then(({data}) => {
        if (data) setAdminData(data)
      })
    }
  }, [])

  const mostrarFotocheckAdmin = () => {
    if (!adminData) return
    const rolLabel = adminData.rol === 'super_admin' ? 'Super Admin' : adminData.rol === 'viewer' ? 'Solo Lectura' : 'Administrador'
    
    Swal.fire({
      html: `
        <div class="bg-corporate-blue rounded-t-2xl p-6 text-center relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-corporate-green/20 rounded-full blur-xl"></div>
          
          <div class="relative z-10 w-24 h-24 rounded-full border-4 border-white/20 mx-auto mb-4 overflow-hidden bg-corporate-blue flex items-center justify-center shadow-lg">
            <span class="text-3xl font-bold text-white">${adminData.nombre_completo.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}</span>
          </div>
          <h3 class="text-xl font-black text-white relative z-10 mb-1 leading-tight">${adminData.nombre_completo}</h3>
          <span class="inline-block bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest relative z-10 mt-2">${rolLabel}</span>
        </div>
        <div class="p-6 bg-white space-y-4">
          <div class="flex flex-col border-b border-gray-100 pb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Usuario</span>
            <span class="text-sm font-bold text-corporate-blue text-left flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-amber-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> ${adminData.usuario}</span>
          </div>
          <div class="flex flex-col pb-2">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Nivel de Acceso</span>
            <span class="text-sm font-semibold text-gray-700 text-left capitalize">${adminData.rol.replace('_', ' ')}</span>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar',
      buttonsStyling: false,
      padding: '0',
      customClass: {
         popup: '!rounded-2xl shadow-2xl border-none !overflow-hidden m-0 !p-0 w-80',
         htmlContainer: '!m-0 !p-0',
         actions: '!w-[85%] !mx-auto !mb-6 !mt-2 flex-col gap-2',
         confirmButton: 'w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl border-none cursor-pointer m-0 transition-colors'
      }
    })
  }

  const rolActual = sessionStorage.getItem('admin_rol') || 'admin'
  const esSupervisor = rolActual === 'supervisor'

  const allLinks = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Directorio', icon: Users, path: '/admin-panel' },
    { label: 'Nuevo Personal', icon: UserPlus, path: '/admin/nuevo-personal' },
    { label: 'Horarios', icon: Clock, path: '/admin/horarios' },
    { label: 'Actividad', icon: ScrollText, path: '/admin/bitacora' },
    { label: 'Administradores', icon: ShieldCheck, path: '/admin/administradores', soloAdmin: true },
    { label: 'Configuración', icon: Settings, path: '/admin/configuracion' },
  ]

  const links = allLinks.filter(l => !l.soloAdmin || !esSupervisor)

  const handleNavigate = (path) => {
    navigate(path)
    setOpen(false)
  }

  return (
    <>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-corporate-blue text-white border-b border-white/10 shadow-sm">
        <div className="flex items-center justify-between px-4 md:pl-60 h-14 w-full">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setOpen(!open)}
              className="p-2 rounded-xl hover:bg-white/10 transition-colors border-none bg-transparent text-white cursor-pointer md:hidden"
              aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>

            <div className="min-w-0">
              <div className="text-sm font-black tracking-wide leading-none truncate">Portal Admin</div>
              <div className="text-[10px] text-white/60 font-bold uppercase tracking-widest leading-none truncate">SERTEC</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl transition-colors text-white bg-white/10 hover:bg-white/20 border border-white/10 cursor-pointer"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-14 bottom-0 w-56 bg-corporate-blue flex-col z-40 shadow-lg">
        <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path
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
          {adminData && (
            <div 
              onClick={mostrarFotocheckAdmin}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer hover:bg-white/10 mb-2 group w-full text-left border-none"
            >
              <div className="w-9 h-9 rounded-full bg-amber-500/20 overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-amber-500 transition-all shrink-0">
                <span className="text-amber-500 font-bold text-xs">{adminData.nombre_completo.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{adminData.nombre_completo.split(' ')[0]} {adminData.nombre_completo.split(' ').length > 1 ? adminData.nombre_completo.split(' ')[1] : ''}</p>
                <p className="text-[10px] text-white/50 truncate uppercase tracking-wider">{adminData.rol === 'super_admin' ? 'Super Admin' : adminData.rol === 'supervisor' ? 'Supervisor' : adminData.rol === 'viewer' ? 'Solo Lectura' : 'Admin'}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowSoporte(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer text-white/70 hover:bg-white/10 hover:text-white bg-transparent w-full"
          >
            <Headset size={18} />
            Soporte TI
          </button>
        </div>
      </aside>

      {/* Mobile drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-corporate-blue shadow-2xl animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
              <span className="text-white font-bold text-sm">Menú Admin</span>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 border-none bg-transparent cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-3 mt-2 flex-1">
              {links.map((link) => {
                const isActive = location.pathname === link.path
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
              {adminData && (
                <div 
                  onClick={() => { setOpen(false); mostrarFotocheckAdmin(); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer hover:bg-white/10 mb-2 group w-full text-left border-none"
                >
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-amber-500 transition-all shrink-0">
                    <span className="text-amber-500 font-bold text-xs">{adminData.nombre_completo.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{adminData.nombre_completo.split(' ')[0]} {adminData.nombre_completo.split(' ').length > 1 ? adminData.nombre_completo.split(' ')[1] : ''}</p>
                    <p className="text-[10px] text-white/50 truncate uppercase tracking-wider">{adminData.rol === 'super_admin' ? 'Super Admin' : adminData.rol === 'viewer' ? 'Solo Lectura' : 'Admin'}</p>
                  </div>
                </div>
              )}
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

export default AdminSidebar

