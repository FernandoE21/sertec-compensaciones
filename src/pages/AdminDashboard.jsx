import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { Search, UserPlus, Settings, Save, CheckCircle, X, ExternalLink, Pencil, KeyRound, Trash2, ShieldAlert } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

import { obtenerLineaDesdeSeccion, LINEAS_DISPONIBLES } from '../utils/lineas'

function AdminDashboard() {
  const navigate = useNavigate()
  const [personal, setPersonal] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroLinea, setFiltroLinea] = useState('')
  const [fechaCorte, setFechaCorte] = useState('')
  const [fechaCorteOriginal, setFechaCorteOriginal] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)
  const [showConfig, setShowConfig] = useState(false)

  const PROJECT_URL = "https://pwzogtzcgcxiondlcfeo.supabase.co"
  const STORAGE_URL = `${PROJECT_URL}/storage/v1/object/public/fotos%20personal/`

  const rolActual = sessionStorage.getItem('admin_rol') || 'admin'
  const esSuperAdmin = rolActual === 'super_admin'
  const esSupervisor = rolActual === 'supervisor'
  const lineasSupervisor = esSupervisor
    ? (JSON.parse(sessionStorage.getItem('admin_lineas') || '[]'))
    : []

  useEffect(() => {
    const fetchPersonal = async () => {
      setLoading(true)
      const { data: horarios } = await supabase.from('grupos_horarios').select('*')
      const horariosMap = horarios ? horarios.reduce((acc, h) => ({...acc, [h.id]: h.nombre}), {}) : {}

      const { data, error } = await supabase.from('personal').select('*').order('apellidos', { ascending: true })
      if (!error) {
        const dataConHorario = data.map(p => ({
          ...p,
          nombre_horario: p.id_grupo_horario ? (horariosMap[p.id_grupo_horario] || 'N/A') : 'Sin Asignar'
        }))
        setPersonal(dataConHorario)
      }
      setLoading(false)
    }
    fetchPersonal()
    const fetchConfig = async () => {
      const { data } = await supabase.from('configuracion').select('valor').eq('clave', 'onomastico_fecha_corte').single()
      if (data) { setFechaCorte(data.valor); setFechaCorteOriginal(data.valor) }
    }
    fetchConfig()
  }, [])

  const personalFiltrado = personal.filter(p => {
    const term = busqueda.toLowerCase()
    const nombreCompleto = `${p.nombres} ${p.apellidos}`.toLowerCase()
    const matchTexto = nombreCompleto.includes(term) || p.codigo.includes(term) || p.cargo.toLowerCase().includes(term)
    const linea = obtenerLineaDesdeSeccion(p.seccion)
    const matchLinea = filtroLinea ? linea === filtroLinea : true
    const matchSupervisor = esSupervisor ? lineasSupervisor.includes(linea) : true
    return matchTexto && matchLinea && matchSupervisor
  })

  const limpiarFiltros = () => { setBusqueda(''); setFiltroLinea('') }

  const guardarFechaCorte = async () => {
    if (!fechaCorte) return
    setGuardandoConfig(true)
    const { error } = await supabase.from('configuracion').update({ valor: fechaCorte, updated_at: new Date().toISOString() }).eq('clave', 'onomastico_fecha_corte')
    setGuardandoConfig(false)
    if (error) { Swal.fire('Error', error.message, 'error') }
    else {
      const adminUsuario = sessionStorage.getItem('adminUser') || 'admin'
      logBitacora({ usuario: adminUsuario, tipo_usuario: 'admin', accion: 'config', modulo: 'configuracion', descripcion: `Cambió fecha corte onomástico de ${fechaCorteOriginal} a ${fechaCorte}`, datos_anteriores: { fecha_corte: fechaCorteOriginal }, datos_nuevos: { fecha_corte: fechaCorte } })
      setFechaCorteOriginal(fechaCorte)
      Swal.fire({ title: '¡Actualizado!', text: `Fecha de corte cambiada a ${new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, icon: 'success', timer: 2000, showConfirmButton: false })
    }
  }

  const verificarAdminPassword = async () => {
    const adminUser = sessionStorage.getItem('admin_usuario');
    if (!adminUser) {
      Swal.fire('Error', 'Sesión de administrador no válida.', 'error');
      return false;
    }

    const { value: password } = await Swal.fire({
      html: `
        <div class="bg-corporate-blue rounded-t-2xl p-6 text-center">
          <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-corporate-green"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h3 class="text-xl font-black text-white">Verificación de Seguridad</h3>
          <p class="text-white/50 text-sm mt-1">Ingrese su contraseña de administrador</p>
        </div>
      `,
      input: 'password',
      inputPlaceholder: 'Contraseña de administrador',
      showCancelButton: true,
      confirmButtonText: 'Verificar',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      padding: '0',
      customClass: {
        popup: '!rounded-2xl shadow-2xl border-none !overflow-hidden m-0 !p-0',
        htmlContainer: '!m-0 !p-0',
        input: '!w-[85%] !mx-auto !mt-6 !mb-2 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all text-center flex',
        actions: '!w-[85%] !mx-auto !mb-6 !mt-2 flex-col gap-2',
        confirmButton: 'w-full py-3 bg-corporate-blue text-white font-bold text-sm rounded-xl border-none cursor-pointer m-0',
        cancelButton: 'w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl border-none cursor-pointer m-0'
      },
      inputValidator: (value) => {
        if (!value) return '¡Debe ingresar su contraseña!';
      }
    });

    if (!password) return false;

    const { data, error } = await supabase
      .from('administradores')
      .select('password')
      .eq('usuario', adminUser)
      .single();

    if (error || !data || data.password !== password) {
      Swal.fire('Error', 'Contraseña incorrecta', 'error');
      return false;
    }
    return true;
  };

  const handleCambiarPassword = async (p) => {
    if (!esSuperAdmin) {
      Swal.fire('Acceso restringido', 'Solo el Super Admin puede cambiar contraseñas de usuarios.', 'warning')
      return
    }

    const isVerified = await verificarAdminPassword();
    if (!isVerified) return;

    const { value: newPassword } = await Swal.fire({
      html: `
        <div class="bg-corporate-blue rounded-t-2xl p-6 text-center">
          <div class="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-corporate-green"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          </div>
          <h3 class="text-xl font-black text-white">Cambiar Contraseña</h3>
          <p class="text-white/50 text-sm mt-1">Nueva contraseña para <br/> <strong>${p.nombres} ${p.apellidos}</strong></p>
        </div>
      `,
      input: 'password',
      inputPlaceholder: 'Ingresa la nueva contraseña',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      padding: '0',
      customClass: {
        popup: '!rounded-2xl shadow-2xl border-none !overflow-hidden m-0 !p-0',
        htmlContainer: '!m-0 !p-0',
        input: '!w-[85%] !mx-auto !mt-6 !mb-2 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all text-center flex',
        actions: '!w-[85%] !mx-auto !mb-6 !mt-2 flex-col gap-2',
        confirmButton: 'w-full py-3 bg-corporate-blue text-white font-bold text-sm rounded-xl border-none cursor-pointer m-0',
        cancelButton: 'w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl border-none cursor-pointer m-0'
      },
      inputValidator: (value) => {
        if (!value) return '¡La contraseña no puede estar vacía!';
        if (value.length < 6) return '¡La contraseña debe tener al menos 6 caracteres!';
      }
    });

    if (!newPassword) return;

    const { error } = await supabase
      .from('personal')
      .update({ password: newPassword })
      .eq('codigo', p.codigo);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      const adminUsuario = sessionStorage.getItem('admin_usuario') || 'admin';
      logBitacora({
        usuario: adminUsuario,
        tipo_usuario: 'admin',
        accion: 'update',
        modulo: 'personal',
        descripcion: `Cambio de contraseña del usuario ${p.apellidos}, ${p.nombres} (${p.codigo})`,
        datos_anteriores: null,
        datos_nuevos: { codigo: p.codigo }
      });
      Swal.fire('¡Actualizado!', 'La contraseña ha sido cambiada de forma segura.', 'success');
    }
  };

  const handleEliminarUsuario = async (p) => {
    if (!esSuperAdmin) {
      Swal.fire('Acceso restringido', 'Solo el Super Admin puede eliminar usuarios.', 'warning')
      return
    }

    const isVerified = await verificarAdminPassword();
    if (!isVerified) return;

    const result = await Swal.fire({
      html: `
        <div class="bg-red-500 rounded-t-2xl p-6 text-center">
          <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </div>
          <h3 class="text-xl font-black text-white">Eliminar Usuario</h3>
          <p class="text-white/90 text-sm mt-1">Se eliminará permanentemente a</p>
          <p class="text-white font-bold text-sm mt-1">${p.nombres} ${p.apellidos} (${p.codigo})</p>
        </div>
        <div class="px-6 py-6 text-center text-gray-600 text-sm font-medium">
          ¡Esta acción no se puede deshacer!
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      buttonsStyling: false,
      padding: '0',
      customClass: {
        popup: '!rounded-2xl shadow-2xl border-none !overflow-hidden m-0 !p-0',
        htmlContainer: '!m-0 !p-0',
        actions: '!w-[85%] !mx-auto !mb-6 !mt-0 flex-col gap-2',
        confirmButton: 'w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl border-none cursor-pointer m-0',
        cancelButton: 'w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl border-none cursor-pointer m-0'
      }
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase
      .from('personal')
      .delete()
      .eq('codigo', p.codigo);

    if (error) {
      Swal.fire('Error', error.message, 'error');
    } else {
      setPersonal(prev => prev.filter(user => user.codigo !== p.codigo));
      const adminUsuario = sessionStorage.getItem('admin_usuario') || 'admin';
      logBitacora({
        usuario: adminUsuario,
        tipo_usuario: 'admin',
        accion: 'delete',
        modulo: 'personal',
        descripcion: `Eliminó al usuario ${p.apellidos}, ${p.nombres} (${p.codigo})`,
        datos_anteriores: { codigo: p.codigo, nombres: p.nombres, apellidos: p.apellidos },
        datos_nuevos: null
      });
      Swal.fire('¡Eliminado!', 'El usuario ha sido eliminado exitosamente.', 'success');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-corporate-blue">Directorio de Personal</h2>
            <p className="text-sm text-gray-500 mt-1">Gestión de usuarios y asistencia</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                showConfig ? 'bg-corporate-blue text-white border-corporate-blue' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <Settings size={14} /> Configuración
            </button>
            <button
              onClick={() => navigate('/admin/nuevo-personal')}
              className="flex items-center gap-1.5 px-3 py-2 bg-corporate-green text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-95 transition-all border-none cursor-pointer"
            >
              <UserPlus size={14} /> Nuevo
            </button>
          </div>
        </div>
      </div>

      {/* Config panel */}
      {showConfig && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={18} className="text-corporate-blue" />
            <h3 className="text-base font-bold text-gray-800">Configuración del Sistema</h3>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wider block mb-1">Fecha de corte para Onomástico</label>
            <p className="text-xs text-gray-500 mb-3">Solo el personal con fecha de ingreso <strong>igual o anterior</strong> a esta fecha será elegible.</p>
            <div className="flex flex-wrap items-center gap-3">
              <input type="date" value={fechaCorte} onChange={e => setFechaCorte(e.target.value)} style={{ colorScheme: 'light' }} className="px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" />
              {fechaCorte !== fechaCorteOriginal && (
                <button onClick={guardarFechaCorte} disabled={guardandoConfig} className="flex items-center gap-1.5 bg-corporate-green text-white px-4 py-2 rounded-xl text-xs font-bold border-none cursor-pointer hover:brightness-95 transition-all">
                  <Save size={14} /> {guardandoConfig ? 'Guardando...' : 'Guardar'}
                </button>
              )}
              {fechaCorte === fechaCorteOriginal && fechaCorte && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-bold">
                  <CheckCircle size={14} /> Vigente: {new Date(fechaCorte + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>  
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
          <div className="flex flex-col gap-1 flex-[2] min-w-0 w-full">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Buscar</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Nombre, código o cargo..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all" />
            </div>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-0 w-full sm:max-w-64">
            <label className="text-[10px] font-bold text-corporate-blue uppercase tracking-wider">Línea</label>
            <select value={filtroLinea} onChange={e => setFiltroLinea(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all">
              <option value="">Seleccionar...</option>
              {LINEAS_DISPONIBLES.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
            {(busqueda || filtroLinea) && (
              <button onClick={limpiarFiltros} className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 cursor-pointer whitespace-nowrap w-full sm:w-auto">
                <X size={14} /> Limpiar
              </button>
            )}
            <span className="text-xs text-gray-400 whitespace-nowrap self-end sm:self-auto"><strong>{personalFiltrado.length}</strong> encontrados</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100 bg-white">
        <table className="w-full text-sm min-w-[550px]">
          <thead>
            <tr className="bg-corporate-blue text-white">
              <th className="py-3 px-4 text-left text-xs font-bold">Colaborador</th>
              <th className="py-3 px-4 text-left text-xs font-bold">Cargo / Sección</th>                <th className="py-3 px-4 text-left text-xs font-bold hidden md:table-cell">Horario</th>              <th className="py-3 px-4 text-center text-xs font-bold w-36">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="3" className="text-center py-8 text-gray-400">Cargando directorio...</td></tr>
            ) : personalFiltrado.length === 0 ? (
              <tr><td colSpan="3" className="text-center py-8 text-gray-400">No se encontraron colaboradores.</td></tr>
            ) : personalFiltrado.map((p) => (
              <tr key={p.codigo} className="hover:bg-gray-50/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.foto ? `${STORAGE_URL}${p.foto}` : ''}
                      onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${p.nombres}+${p.apellidos}&background=random`}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
                      alt=""
                    />
                    <div>
                      <div className="font-bold text-sm text-gray-800">{p.apellidos}, {p.nombres}</div>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{p.codigo}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-xs leading-relaxed">
                    <strong className="text-gray-600">{p.cargo}</strong><br />
                    <span className="text-indigo-500 text-[11px]">{p.seccion}</span>
                  </div>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold ${p.nombre_horario === 'Sin Asignar' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-corporate-green'}`}>
                    {p.nombre_horario}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <div className="flex gap-2 justify-center">
                    {(esSuperAdmin || esSupervisor) && (
                      <button
                        onClick={() => navigate(`/admin/editar-personal/${p.codigo}`)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer"
                      >
                        <Pencil size={12} /> Editar
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/admin/registros/${p.codigo}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-50 text-gray-600 hover:bg-indigo-500 hover:text-white rounded-lg text-[11px] font-semibold transition-all border border-gray-200 hover:border-transparent cursor-pointer"
                    >
                      Registros <ExternalLink size={12} />
                    </button>
                    {(esSuperAdmin || esSupervisor) && (
                      <button
                        onClick={() => handleCambiarPassword(p)}
                        title="Cambiar Contraseña"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer"
                      >
                        <KeyRound size={12} />
                      </button>
                    )}
                    {esSuperAdmin && (
                      <button
                        onClick={() => handleEliminarUsuario(p)}
                        title="Eliminar Usuario"
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminDashboard

