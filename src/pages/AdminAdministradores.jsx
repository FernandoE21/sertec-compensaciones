import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { ShieldCheck, UserPlus, Eye, EyeOff, Pencil, Trash2, Save, X, Crown, Network } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function AdminAdministradores() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ usuario: '', password: '', nombre_completo: '', rol: 'admin', lineas_asignadas: [] })

  const LINEAS_DISPONIBLES = ['CIL','CELSA','INSPECCION','NESTLE','CAD','CPEI','SERTEC','PPL LINDLEY','SPSA','BACKUS']
  const [showPasswords, setShowPasswords] = useState({})
  const [guardando, setGuardando] = useState(false)

  const adminActual = sessionStorage.getItem('admin_usuario') || 'admin'
  const rolActual = sessionStorage.getItem('admin_rol') || 'admin'
  const esSuperAdmin = rolActual === 'super_admin'

  useEffect(() => { fetchAdmins() }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    const selectCols = esSuperAdmin
      ? '*'
      : 'id, usuario, nombre_completo, rol, activo, created_at, updated_at'

    const { data } = await supabase.from('administradores').select(selectCols).order('created_at', { ascending: true })
    setAdmins(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ usuario: '', password: '', nombre_completo: '', rol: 'admin', lineas_asignadas: [] })
    setEditId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!esSuperAdmin) {
      Swal.fire('Acceso restringido', 'Solo el Super Admin puede crear o editar administradores.', 'warning')
      return
    }

    if (form.rol === 'super_admin' && !esSuperAdmin) {
      Swal.fire('Acceso restringido', 'No tiene permisos para crear Super Admin.', 'warning')
      return
    }

    if (!form.usuario.trim() || !form.nombre_completo.trim()) {
      Swal.fire('Error', 'Usuario y nombre completo son requeridos', 'error')
      return
    }

    setGuardando(true)

    if (editId) {
      // Update
      const updateData = { usuario: form.usuario, nombre_completo: form.nombre_completo, rol: form.rol, updated_at: new Date().toISOString() }
      if (form.password) updateData.password = form.password
      if (form.rol === 'supervisor') updateData.lineas_asignadas = form.lineas_asignadas

      const { error } = await supabase.from('administradores').update(updateData).eq('id', editId)
      if (error) {
        Swal.fire('Error', error.message, 'error')
      } else {
        await logBitacora({
          usuario: adminActual,
          tipo_usuario: 'admin',
          accion: 'editar',
          modulo: 'administradores',
          descripcion: `Editó administrador: ${form.usuario}`,
          registro_id: String(editId),
        })
        Swal.fire({ title: '¡Actualizado!', icon: 'success', timer: 1500, showConfirmButton: false })
        fetchAdmins()
        resetForm()
      }
    } else {
      // Create
      if (!form.password) {
        Swal.fire('Error', 'La contraseña es requerida para nuevos administradores', 'error')
        setGuardando(false)
        return
      }

      // Check duplicate
      const exists = admins.find(a => a.usuario === form.usuario)
      if (exists) {
        Swal.fire('Error', 'Ya existe un administrador con ese usuario', 'error')
        setGuardando(false)
        return
      }

      const { error } = await supabase.from('administradores').insert({
        usuario: form.usuario,
        password: form.password,
        nombre_completo: form.nombre_completo,
        rol: form.rol,
        lineas_asignadas: form.rol === 'supervisor' ? form.lineas_asignadas : [],
      })
      if (error) {
        Swal.fire('Error', error.message, 'error')
      } else {
        await logBitacora({
          usuario: adminActual,
          tipo_usuario: 'admin',
          accion: 'crear',
          modulo: 'administradores',
          descripcion: `Creó nuevo administrador: ${form.usuario} (${form.rol})`,
        })
        Swal.fire({ title: '¡Creado!', text: `Administrador ${form.usuario} creado correctamente`, icon: 'success', timer: 1500, showConfirmButton: false })
        fetchAdmins()
        resetForm()
      }
    }
    setGuardando(false)
  }

  const handleEdit = (admin) => {
    if (!esSuperAdmin) {
      Swal.fire('Acceso restringido', 'Solo el Super Admin puede editar administradores.', 'warning')
      return
    }
    setForm({ usuario: admin.usuario, password: '', nombre_completo: admin.nombre_completo, rol: admin.rol, lineas_asignadas: admin.lineas_asignadas || [] })
    setEditId(admin.id)
    setShowForm(true)
  }

  const handleDelete = async (admin) => {
    if (!esSuperAdmin) {
      Swal.fire('Acceso restringido', 'Solo el Super Admin puede eliminar/desactivar administradores.', 'warning')
      return
    }
    if (admin.rol === 'super_admin' && admins.filter(a => a.rol === 'super_admin' && a.activo).length <= 1) {
      Swal.fire('No permitido', 'Debe existir al menos un Super Admin activo', 'warning')
      return
    }

    const result = await Swal.fire({
      html: `
        <div class="bg-red-500 rounded-t-2xl p-6 text-center">
          <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
             <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
          </div>
          <h3 class="text-xl font-black text-white">¿Eliminar administrador?</h3>
          <p class="text-white/90 text-sm mt-1">Se desactivará el acceso a</p>
          <p class="text-white font-bold text-sm mt-1">${admin.nombre_completo} (${admin.usuario})</p>
        </div>
        <div class="px-6 py-6 text-center text-gray-600 text-sm font-medium">
          ¡Esta acción no se puede deshacer!
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
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
    })

    if (result.isConfirmed) {
      await supabase.from('administradores').update({ activo: false, updated_at: new Date().toISOString() }).eq('id', admin.id)
      await logBitacora({
        usuario: adminActual,
        tipo_usuario: 'admin',
        accion: 'eliminar',
        modulo: 'administradores',
        descripcion: `Desactivó administrador: ${admin.usuario}`,
        registro_id: String(admin.id),
      })
      Swal.fire({ title: 'Desactivado', icon: 'success', timer: 1500, showConfirmButton: false })
      fetchAdmins()
    }
  }

  const handleReactivar = async (admin) => {
    if (!esSuperAdmin) {
      Swal.fire('Acceso restringido', 'Solo el Super Admin puede reactivar administradores.', 'warning')
      return
    }
    await supabase.from('administradores').update({ activo: true, updated_at: new Date().toISOString() }).eq('id', admin.id)
    await logBitacora({
      usuario: adminActual,
      tipo_usuario: 'admin',
      accion: 'editar',
      modulo: 'administradores',
      descripcion: `Reactivó administrador: ${admin.usuario}`,
      registro_id: String(admin.id),
    })
    Swal.fire({ title: 'Reactivado', icon: 'success', timer: 1500, showConfirmButton: false })
    fetchAdmins()
  }

  const toggleShowPassword = (id) => {
    if (!esSuperAdmin) {
      Swal.fire('Acceso restringido', 'Solo el Super Admin puede ver contraseñas.', 'warning')
      return
    }
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const rolBadge = {
    super_admin: 'bg-amber-100 text-amber-700',
    admin: 'bg-blue-100 text-blue-700',
    supervisor: 'bg-violet-100 text-violet-700',
    viewer: 'bg-gray-100 text-gray-600',
  }
  const rolLabel = { super_admin: 'Super Admin', admin: 'Admin', supervisor: 'Supervisor', viewer: 'Solo Lectura' }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-corporate-blue flex items-center justify-center">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-corporate-blue">Administradores</h2>
              <p className="text-sm text-gray-500 mt-0.5">Gestión de usuarios administrativos y roles</p>
            </div>
          </div>
          {esSuperAdmin && (
            <button
              onClick={() => { resetForm(); setShowForm(true) }}
              className="flex items-center gap-1.5 px-4 py-2 bg-corporate-green text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-95 transition-all border-none cursor-pointer"
            >
              <UserPlus size={14} /> Nuevo Admin
            </button>
          )}
        </div>
      </div>

      {/* Roles info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Roles Disponibles</h3>
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Crown size={14} className="text-amber-600" />
              <span className="text-xs font-bold text-amber-700">Super Admin</span>
            </div>
            <p className="text-[11px] text-amber-600">Acceso total. Gestiona admins, configuración y todos los módulos.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={14} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700">Admin</span>
            </div>
            <p className="text-[11px] text-blue-600">Gestiona personal, aprueba solicitudes y ve actividad.</p>
          </div>
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Network size={14} className="text-violet-600" />
              <span className="text-xs font-bold text-violet-700">Supervisor</span>
            </div>
            <p className="text-[11px] text-violet-600">Ve y aprueba registros de sus líneas asignadas. Puede editar registros.</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Eye size={14} className="text-gray-500" />
              <span className="text-xs font-bold text-gray-600">Solo Lectura</span>
            </div>
            <p className="text-[11px] text-gray-500">Solo visualiza datos. No puede crear, editar ni aprobar.</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && esSuperAdmin && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={resetForm}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-slide-in" onClick={(e) => e.stopPropagation()}>
            <div className="bg-corporate-blue rounded-t-2xl p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-3">
                {editId ? <ShieldCheck size={28} className="text-corporate-green" /> : <UserPlus size={28} className="text-corporate-green" />}
              </div>
              <h3 className="text-xl font-black text-white">{editId ? 'Editar Administrador' : 'Nuevo Administrador'}</h3>
              <p className="text-white/50 text-sm mt-1">{editId ? 'Actualiza los datos del usuario' : 'Crea un nuevo usuario administrativo'}</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Usuario</label>
                <input
                  type="text"
                  value={form.usuario}
                  onChange={e => setForm({ ...form, usuario: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all text-center"
                  placeholder="ej: jperez"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                  Contraseña {editId && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all text-center"
                  placeholder="••••••••"
                  required={!editId}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={form.nombre_completo}
                  onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all text-center"
                  placeholder="ej: Juan Pérez García"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Rol</label>
                <select
                  value={form.rol}
                  onChange={e => setForm({ ...form, rol: e.target.value, lineas_asignadas: [] })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all text-center font-bold text-corporate-blue"
                >
                  {esSuperAdmin && <option value="super_admin">Super Admin</option>}
                  <option value="admin">Admin</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="viewer">Solo Lectura</option>
                </select>
              </div>

              {form.rol === 'supervisor' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Líneas Asignadas</label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-2 border border-gray-200 rounded-xl bg-gray-50">
                    {LINEAS_DISPONIBLES.map(linea => (
                      <label key={linea} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer text-xs font-semibold transition-colors ${
                        form.lineas_asignadas.includes(linea)
                          ? 'bg-violet-100 text-violet-700 border border-violet-300'
                          : 'bg-white text-gray-600 border border-gray-200 hover:border-violet-300'
                      }`}>
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 accent-violet-600 cursor-pointer"
                          checked={form.lineas_asignadas.includes(linea)}
                          onChange={() => {
                            const prev = form.lineas_asignadas
                            setForm({
                              ...form,
                              lineas_asignadas: prev.includes(linea)
                                ? prev.filter(l => l !== linea)
                                : [...prev, linea]
                            })
                          }}
                        />
                        {linea}
                      </label>
                    ))}
                  </div>
                  {form.lineas_asignadas.length === 0 && (
                    <p className="text-[11px] text-amber-600 mt-1.5">Selecciona al menos una línea</p>
                  )}
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button type="submit" disabled={guardando} className="w-full py-3 bg-corporate-blue hover:bg-corporate-blue/90 text-white font-bold text-sm rounded-xl border-none cursor-pointer transition-colors disabled:opacity-50">
                  {guardando ? 'Guardando...' : editId ? 'Actualizar' : 'Crear Admin'}
                </button>
                <button type="button" onClick={resetForm} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl border-none cursor-pointer transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl shadow-sm border border-gray-100 bg-white">
        <table className="w-full text-sm min-w-[550px]">
          <thead>
            <tr className="bg-corporate-blue text-white">
              <th className="py-3 px-4 text-left text-xs font-bold">Usuario</th>
              <th className="py-3 px-4 text-left text-xs font-bold">Nombre</th>
              <th className="py-3 px-4 text-center text-xs font-bold">Rol</th>
              <th className="py-3 px-4 text-center text-xs font-bold">Estado</th>
              {esSuperAdmin && <th className="py-3 px-4 text-center text-xs font-bold">Contraseña</th>}
              {esSuperAdmin && <th className="py-3 px-4 text-center text-xs font-bold w-32">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan={esSuperAdmin ? 6 : 4} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan={esSuperAdmin ? 6 : 4} className="text-center py-8 text-gray-400">No hay administradores registrados.</td></tr>
            ) : admins.map(admin => (
              <tr key={admin.id} className={`hover:bg-gray-50/50 transition-colors ${!admin.activo ? 'opacity-50' : ''}`}>
                <td className="py-3 px-4">
                  <span className="font-bold text-gray-800">{admin.usuario}</span>
                </td>
                <td className="py-3 px-4 text-gray-600">{admin.nombre_completo}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${rolBadge[admin.rol] || 'bg-gray-100 text-gray-600'}`}>
                    {rolLabel[admin.rol] || admin.rol}
                  </span>
                  {admin.rol === 'supervisor' && admin.lineas_asignadas && admin.lineas_asignadas.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mt-1">
                      {admin.lineas_asignadas.map(l => (
                        <span key={l} className="text-[9px] bg-violet-50 text-violet-600 border border-violet-200 px-1.5 py-0.5 rounded font-bold">{l}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${admin.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {admin.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {esSuperAdmin && (
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-mono text-gray-500">
                        {showPasswords[admin.id] ? admin.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => toggleShowPassword(admin.id)}
                        className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer p-0.5"
                      >
                        {showPasswords[admin.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </td>
                )}
                {esSuperAdmin && (
                  <td className="py-3 px-4 text-center">
                    <div className="flex gap-1.5 justify-center">
                      <button
                        onClick={() => handleEdit(admin)}
                        className="flex items-center gap-1 px-2 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer"
                      >
                        <Pencil size={12} />
                      </button>
                      {admin.activo ? (
                        <button
                          onClick={() => handleDelete(admin)}
                          className="flex items-center gap-1 px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivar(admin)}
                          className="px-2 py-1.5 bg-green-50 text-green-600 hover:bg-green-500 hover:text-white rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer"
                        >
                          Activar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminAdministradores
