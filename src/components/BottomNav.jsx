import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, ClipboardList, PlusCircle, LogOut, Headset, Phone, Mail, KeyRound, Lock, UserCircle, Info } from 'lucide-react'
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
  const [userData, setUserData] = useState(null)
  const [tooltipAbierto, setTooltipAbierto] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    sessionStorage.removeItem('empleado_codigo')
    sessionStorage.removeItem('empleado_nombre')
    navigate('/', { replace: true })
  }

  useEffect(() => {
    if (codigo) {
      supabase.from('personal').select('*').eq('codigo', codigo).single().then(({data}) => {
        if (data) setUserData(data)
      })
    }
  }, [codigo])

  const mostrarFotocheck = async () => {
    if (!userData) return
    const STORAGE_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co/storage/v1/object/public/fotos%20personal/"
    const fotoUrl = userData.foto ? `${STORAGE_URL}${userData.foto}` : null

    const diasSemana = [
      { iso: 1, corto: 'Lun', largo: 'Lunes' },
      { iso: 2, corto: 'Mar', largo: 'Martes' },
      { iso: 3, corto: 'Mié', largo: 'Miércoles' },
      { iso: 4, corto: 'Jue', largo: 'Jueves' },
      { iso: 5, corto: 'Vie', largo: 'Viernes' },
      { iso: 6, corto: 'Sáb', largo: 'Sábado' },
      { iso: 7, corto: 'Dom', largo: 'Domingo' },
    ]

    const fmtHora = (t) => (t ? String(t).slice(0, 5) : '')

    const diasEntre = (fechaA, fechaB) => {
      const a = new Date(`${fechaA}T12:00:00Z`)
      const b = new Date(`${fechaB}T12:00:00Z`)
      return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000))
    }

    const hoyISO = () => {
      const now = new Date()
      const off = now.getTimezoneOffset()
      return new Date(now.getTime() - off * 60 * 1000).toISOString().slice(0, 10)
    }

    const calcularSemanaActual = (fechaInicioCiclo, totalSemanas) => {
      const total = Math.max(1, Number(totalSemanas || 1))
      const inicio = fechaInicioCiclo || '2024-01-01'
      const dias = diasEntre(inicio, hoyISO())
      let diasNorm = dias
      if (diasNorm < 0) {
        const ciclo = total * 7
        diasNorm = ciclo + (diasNorm % ciclo)
      }
      return ((Math.floor(diasNorm / 7) % total) + 1)
    }

    const buildTurnoIndex = (reglas) => {
      const m = new Map()
      ;(reglas || []).forEach(r => {
        const w = Number(r.semana_del_ciclo || 1)
        const d = Number(r.dia_semana)
        if (!d) return
        m.set(`${w}-${d}`, { entrada: fmtHora(r.hora_entrada), salida: fmtHora(r.hora_salida) })
      })
      return m
    }

    const addDays = (iso, delta) => {
      const d = new Date(`${iso}T12:00:00Z`)
      d.setUTCDate(d.getUTCDate() + delta)
      return d.toISOString().slice(0, 10)
    }

    let horarioGrupo = null
    let horarioReglas = []
    if (userData.id_grupo_horario) {
      const [{ data: g }, { data: reglas, error: reglasError }] = await Promise.all([
        supabase.from('grupos_horarios').select('id, nombre, total_semanas_ciclo').eq('id', userData.id_grupo_horario).single(),
        supabase.from('reglas_turnos').select('semana_del_ciclo, dia_semana, hora_entrada, hora_salida').eq('grupo_id', userData.id_grupo_horario).order('semana_del_ciclo', { ascending: true }).order('dia_semana', { ascending: true }),
      ])

      if (g) horarioGrupo = g

      if (!reglasError && reglas) {
        horarioReglas = reglas
      } else {
        // Fallback si reglas_turnos no es legible por RLS: reconstruir ciclo vía RPC.
        const total = Math.max(1, Number(g?.total_semanas_ciclo || 1))
        const inicio = userData.fecha_inicio_ciclo || '2024-01-01'
        const jobs = []
        for (let w = 1; w <= total; w++) {
          for (let di = 0; di < 7; di++) {
            const fecha = addDays(inicio, (w - 1) * 7 + di)
            jobs.push(
              supabase.rpc('obtener_horario_por_fecha', { p_codigo: userData.codigo, p_fecha: fecha })
                .then(({ data }) => ({ w, fecha, data }))
            )
          }
        }
        const res = await Promise.all(jobs)
        horarioReglas = res
          .map(r => {
            const day = (new Date(`${r.fecha}T12:00:00Z`).getUTCDay() + 6) % 7 + 1
            const row = (r.data && r.data[0]) ? r.data[0] : null
            if (!row) return null
            return { semana_del_ciclo: r.w, dia_semana: day, hora_entrada: row.hora_entrada, hora_salida: row.hora_salida }
          })
          .filter(Boolean)
      }
    }

    const renderHorarioHtml = () => {
      if (!userData.id_grupo_horario) {
        return `
          <div class="flex flex-col pt-1">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Horario</span>
            <span class="text-sm font-semibold text-amber-700 text-left">Sin horario asignado</span>
          </div>
        `
      }

      const total = Math.max(1, Number(horarioGrupo?.total_semanas_ciclo || 1))
      const semanaActual = calcularSemanaActual(userData.fecha_inicio_ciclo, total)
      const idx = buildTurnoIndex(horarioReglas)

      const renderSemana = (w) => {
        const rows = diasSemana.map(d => {
          const t = idx.get(`${w}-${d.iso}`)
          const texto = t?.entrada && t?.salida ? `${t.entrada} - ${t.salida}` : 'LIBRE'
          const color = texto === 'LIBRE' ? 'text-slate-400' : 'text-slate-700'
          return `
            <div class="flex items-center justify-between gap-2">
              <div class="text-[11px] text-slate-600 font-bold">
                <span class="sm:hidden">${d.corto}</span>
                <span class="hidden sm:inline">${d.largo}</span>
              </div>
              <div class="text-[11px] font-mono font-extrabold ${color}">${texto}</div>
            </div>
          `
        }).join('')

        const header = total > 1
          ? `
            <div class="flex items-center justify-between mb-2">
              <div class="text-[11px] font-black text-corporate-blue uppercase tracking-wider">Semana ${w}</div>
              ${w === semanaActual ? '<span class="text-[10px] font-extrabold uppercase tracking-wider bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-200">Actual</span>' : ''}
            </div>
          `
          : ''

        const wrapCls = (w === semanaActual && total > 1) ? 'bg-white border-green-200' : 'bg-white/70 border-slate-200'
        return `
          <div class="rounded-xl border p-3 ${wrapCls}">
            ${header}
            <div class="space-y-1">${rows}</div>
          </div>
        `
      }

      return `
        <div class="flex flex-col pt-1">
          <div class="flex items-center justify-between gap-2">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Horario</span>
            ${horarioGrupo ? `<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">${horarioGrupo.nombre}</span>` : ''}
          </div>
          <div class="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div class="flex items-center justify-between">
              <div class="text-xs font-bold text-slate-700">${total > 1 ? `Rotativo · ${total} semanas` : 'Semana fija'}</div>
              ${total > 1 ? `<div class="text-[11px] text-slate-500">Actual: <b>${semanaActual}</b> / ${total}</div>` : ''}
            </div>
            <div class="mt-2 ${total > 1 ? 'space-y-2' : ''} max-h-60 overflow-auto pr-1">
              ${Array.from({ length: total }, (_, i) => renderSemana(i + 1)).join('')}
            </div>
          </div>
        </div>
      `
    }

    Swal.fire({
      html: `
        <div class="bg-corporate-blue rounded-t-2xl p-6 text-center relative overflow-hidden">
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-corporate-green/20 rounded-full blur-xl"></div>
          
          <div class="relative z-10 w-24 h-24 rounded-full border-4 border-white/20 mx-auto mb-4 overflow-hidden bg-corporate-blue flex items-center justify-center shadow-lg">
            ${fotoUrl ? `<img src="${fotoUrl}" class="w-full h-full object-cover" />` : `<span class="text-3xl font-bold text-white">${userData.nombres.charAt(0)}${userData.apellidos.charAt(0)}</span>`}
          </div>
          <h3 class="text-xl font-black text-white relative z-10 mb-1">${userData.nombres.split(' ')[0]} <br/> <span class="font-normal text-white/80">${userData.apellidos.split(' ')[0]}</span></h3>
          <span class="inline-block bg-corporate-green text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest relative z-10 mt-2">${userData.cargo}</span>
        </div>
        <div class="p-6 bg-white space-y-4">
          <div class="flex flex-col border-b border-gray-100 pb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Código</span>
            <span class="text-sm font-bold text-corporate-blue text-left flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-corporate-green"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> ${userData.codigo}</span>
          </div>
          <div class="flex flex-col border-b border-gray-100 pb-3">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">Sección / Área</span>
            <span class="text-sm font-semibold text-gray-700 text-left">${userData.seccion || 'No especificada'}</span>
          </div>
          <div class="flex flex-col pb-2">
            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-left">DNI Identificación</span>
            <span class="text-sm font-semibold text-gray-700 text-left">${userData.dni || 'No registrado'}</span>
          </div>
          ${renderHorarioHtml()}
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Cerrar Fotocheck',
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

  const links = [
    { label: 'Panel General', icon: ClipboardList, path: `/registros/${codigo}`, info: null },
    {
      label: 'Nuevo Registro',
      icon: PlusCircle,
      path: `/crear-registro/${codigo}`,
      info: {
        titulo: '¿Qué es un Registro?',
        descripcion: 'Registra horas en tu contra (horas déficit). Úsalo cuando saliste antes de tu horario, llegaste tarde o necesitas compensar tiempo no trabajado.',
        color: 'emerald',
      }
    },
    {
      label: 'Nueva Solicitud',
      icon: PlusCircle,
      path: `/nuevo-registro/${codigo}`,
      info: {
        titulo: '¿Qué es una Solicitud?',
        descripcion: 'Solicita el uso de tus horas a favor (sobretiempos, traslados, etc.), pide autorizar una ausencia o salida anticipada que luego compensarás, o solicita tu día libre por onomástico. Queda pendiente de aprobación.',
        color: 'purple',
      }
    },
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
              <div className="text-sm font-black tracking-wide leading-none truncate">Portal de Horas</div>
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
            const isActive = location.pathname === link.path ||
              (link.path.includes('/registros/') && location.pathname.includes('/registros/') && !location.pathname.includes('/admin'))
            return (
              <div key={link.label} className="relative">
                <div className={`flex items-center gap-2 rounded-xl transition-all ${
                  isActive ? 'bg-corporate-green shadow-md' : 'hover:bg-white/10'
                }`}>
                  <button
                    onClick={() => handleNavigate(link.path)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer flex-1 ${
                      isActive ? 'text-white bg-transparent' : 'text-white/70 hover:text-white bg-transparent'
                    }`}
                  >
                    <link.icon size={18} />
                    <span className="leading-tight text-left">{link.label}</span>
                  </button>
                  {link.info && (
                    <div className="relative pr-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setTooltipAbierto(tooltipAbierto === link.label ? null : link.label) }}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
                        title="Saber más"
                      >
                        <Info size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {link.info && tooltipAbierto === link.label && (
                  <div className="absolute left-full top-0 ml-2 z-50 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 animate-slide-in" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setTooltipAbierto(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0.5"><X size={14} /></button>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${
                      link.info.color === 'emerald' ? 'bg-emerald-100' : 'bg-purple-100'
                    }`}>
                      <Info size={16} className={link.info.color === 'emerald' ? 'text-emerald-600' : 'text-purple-600'} />
                    </div>
                    <p className={`text-xs font-bold mb-1 ${
                      link.info.color === 'emerald' ? 'text-emerald-700' : 'text-purple-700'
                    }`}>{link.info.titulo}</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{link.info.descripcion}</p>
                  </div>
                )}
              </div>
            )
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          {userData && (
            <div 
              onClick={mostrarFotocheck}
              className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer hover:bg-white/10 mb-2 group w-full text-left"
            >
              <div className="w-9 h-9 rounded-full bg-corporate-green/20 overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-corporate-green transition-all shrink-0">
                {userData.foto ? (
                  <img src={`https://pwzogtzcgcxiondlcfeo.supabase.co/storage/v1/object/public/fotos%20personal/${userData.foto}`} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-corporate-green font-bold text-xs">{userData.nombres.charAt(0)}{userData.apellidos.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{userData.nombres.split(' ')[0]} {userData.apellidos.split(' ')[0]}</p>
                <p className="text-[10px] text-white/50 truncate uppercase tracking-wider">{userData.cargo}</p>
              </div>
            </div>
          )}
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
                  <div key={link.label}>
                    <div className={`flex items-center rounded-xl transition-all ${
                      isActive ? 'bg-corporate-green shadow-md' : 'hover:bg-white/10'
                    }`}>
                      <button
                        onClick={() => handleNavigate(link.path)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer flex-1 ${
                          isActive ? 'text-white bg-transparent' : 'text-white/70 hover:text-white bg-transparent'
                        }`}
                      >
                        <link.icon size={18} />
                        {link.label}
                      </button>
                      {link.info && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setTooltipAbierto(tooltipAbierto === `m-${link.label}` ? null : `m-${link.label}`) }}
                          className="w-8 h-8 mr-2 flex items-center justify-center rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors border-none bg-transparent cursor-pointer"
                        >
                          <Info size={14} />
                        </button>
                      )}
                    </div>
                    {link.info && tooltipAbierto === `m-${link.label}` && (
                      <div className={`mx-3 mt-1 mb-2 p-3 rounded-xl border ${
                        link.info.color === 'emerald'
                          ? 'bg-emerald-50 border-emerald-200'
                          : 'bg-purple-50 border-purple-200'
                      }`}>
                        <p className={`text-xs font-bold mb-1 ${
                          link.info.color === 'emerald' ? 'text-emerald-700' : 'text-purple-700'
                        }`}>{link.info.titulo}</p>
                        <p className="text-[11px] text-gray-600 leading-relaxed">{link.info.descripcion}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
            <div className="p-3 border-t border-white/10 space-y-1">                {userData && (
                  <div 
                    onClick={() => { setOpen(false); mostrarFotocheck(); }}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer hover:bg-white/10 mb-2 group w-full text-left border-none"
                  >
                    <div className="w-9 h-9 rounded-full bg-corporate-green/20 overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-corporate-green transition-all shrink-0">
                      {userData.foto ? (
                        <img src={`https://pwzogtzcgcxiondlcfeo.supabase.co/storage/v1/object/public/fotos%20personal/${userData.foto}`} alt="avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-corporate-green font-bold text-xs">{userData.nombres.charAt(0)}{userData.apellidos.charAt(0)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{userData.nombres.split(' ')[0]} {userData.apellidos.split(' ')[0]}</p>
                      <p className="text-[10px] text-white/50 truncate uppercase tracking-wider">{userData.cargo}</p>
                    </div>
                  </div>
                )}              <button
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
