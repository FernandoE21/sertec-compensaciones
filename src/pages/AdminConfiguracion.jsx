import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { Settings, Save, CheckCircle, Lock, KeyRound } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function AdminConfiguracion() {
  const [fechaCorte, setFechaCorte] = useState('')
  const [fechaCorteOriginal, setFechaCorteOriginal] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  // Password change
  const [passActual, setPassActual] = useState('')
  const [passNueva, setPassNueva] = useState('')
  const [passConfirmar, setPassConfirmar] = useState('')
  const [cambiandoPass, setCambiandoPass] = useState(false)

  const adminUsuario = sessionStorage.getItem('admin_usuario') || 'admin'
  const rolActual = sessionStorage.getItem('admin_rol') || 'admin'
  const esSupervisor = rolActual === 'supervisor'

  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'onomastico_fecha_corte').single()
      if (data) { setFechaCorte(data.valor); setFechaCorteOriginal(data.valor) }
    }
    fetchConfig()
  }, [])

  const guardarFechaCorte = async () => {
    if (!fechaCorte) return
    setGuardandoConfig(true)
    const { error } = await supabase.from('configuracion').update({ valor: fechaCorte, updated_at: new Date().toISOString() }).eq('clave', 'onomastico_fecha_corte')
    setGuardandoConfig(false)
    if (error) {
      Swal.fire('Error', error.message, 'error')
    } else {
      await logBitacora({
        usuario: adminUsuario,
        tipo_usuario: 'admin',
        accion: 'config',
        modulo: 'configuracion',
        descripcion: `Cambió fecha de corte onomástico de ${fechaCorteOriginal} a ${fechaCorte}`,
        datos_anteriores: { fecha_corte: fechaCorteOriginal },
        datos_nuevos: { fecha_corte: fechaCorte },
      })
      setFechaCorteOriginal(fechaCorte)
      Swal.fire({ title: '¡Actualizado!', text: `Fecha de corte cambiada a ${new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, icon: 'success', timer: 2000, showConfirmButton: false })
    }
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

    // Verify current password
    const { data: adminData } = await supabase.from('administradores').select('id, password').eq('usuario', adminUsuario).single()

    if (!adminData || adminData.password !== passActual) {
      Swal.fire('Error', 'La contraseña actual es incorrecta', 'error')
      setCambiandoPass(false)
      return
    }

    // Update password
    const { error } = await supabase.from('administradores').update({ password: passNueva, updated_at: new Date().toISOString() }).eq('id', adminData.id)

    if (error) {
      Swal.fire('Error', error.message, 'error')
    } else {
      await logBitacora({
        usuario: adminUsuario,
        tipo_usuario: 'admin',
        accion: 'cambiar_password',
        modulo: 'administradores',
        descripcion: `${adminUsuario} cambió su contraseña`,
        registro_id: String(adminData.id),
      })
      Swal.fire({ title: '¡Contraseña Actualizada!', icon: 'success', timer: 2000, showConfirmButton: false })
      setPassActual('')
      setPassNueva('')
      setPassConfirmar('')
    }
    setCambiandoPass(false)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-corporate-blue flex items-center justify-center">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-corporate-blue">Configuración</h2>
            <p className="text-sm text-gray-500 mt-0.5">Ajustes del sistema y cuenta</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Onomástico Config — solo para admin/super_admin */}
        {!esSupervisor ? (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Settings size={18} className="text-corporate-blue" />
              <h3 className="text-base font-bold text-gray-800">Fecha de Corte — Onomástico</h3>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-3">Solo el personal con fecha de ingreso <strong>igual o anterior</strong> a esta fecha será elegible para el onomástico.</p>
              <div className="flex flex-col gap-3">
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={e => setFechaCorte(e.target.value)}
                  style={{ colorScheme: 'light' }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
                />
                {fechaCorte !== fechaCorteOriginal ? (
                  <button onClick={guardarFechaCorte} disabled={guardandoConfig} className="flex items-center justify-center gap-1.5 bg-corporate-green text-white px-4 py-2.5 rounded-xl text-xs font-bold border-none cursor-pointer hover:brightness-95 transition-all w-full">
                    <Save size={14} /> {guardandoConfig ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                ) : fechaCorte && (
                  <span className="flex items-center gap-1 text-xs text-green-600 font-bold justify-center">
                    <CheckCircle size={14} /> Vigente: {new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5 flex items-center gap-3">
            <Settings size={20} className="text-violet-400 shrink-0" />
            <p className="text-sm text-violet-600 font-medium">Como <strong>Supervisor</strong>, solo puedes cambiar tu contraseña. La configuración del sistema está reservada para administradores.</p>
          </div>
        )}

        {/* Change Password */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <KeyRound size={18} className="text-corporate-blue" />
            <h3 className="text-base font-bold text-gray-800">Cambiar Contraseña</h3>
          </div>
          <form onSubmit={handleCambiarPassword} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Contraseña Actual</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={passActual}
                  onChange={e => setPassActual(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Nueva Contraseña</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={passNueva}
                  onChange={e => setPassNueva(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Confirmar Contraseña</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={passConfirmar}
                  onChange={e => setPassConfirmar(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
                  placeholder="Repite la contraseña"
                  required
                />
              </div>
              {passNueva && passConfirmar && passNueva !== passConfirmar && (
                <p className="text-[11px] text-red-500 mt-1 font-semibold">Las contraseñas no coinciden</p>
              )}
            </div>
            <button
              type="submit"
              disabled={cambiandoPass || !passActual || !passNueva || passNueva !== passConfirmar}
              className="w-full flex items-center justify-center gap-1.5 bg-corporate-blue text-white px-4 py-2.5 rounded-xl text-xs font-bold border-none cursor-pointer hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock size={14} /> {cambiandoPass ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>

      {/* System info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Información del Sistema</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Sesión actual</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">{adminUsuario}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Versión</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">1.0.0</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-400 uppercase">Desarrollado por</p>
            <p className="text-sm font-bold text-gray-800 mt-0.5">SERTEC TI</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminConfiguracion
