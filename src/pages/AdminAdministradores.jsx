import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Swal from 'sweetalert2'
import { ShieldCheck, UserPlus, Eye, EyeOff, Pencil, Trash2, Save, X, Crown } from 'lucide-react'
import { logBitacora } from '../utils/bitacora'

function AdminAdministradores() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ usuario: '', password: '', nombre_completo: '', rol: 'admin' })
  const [showPasswords, setShowPasswords] = useState({})
  const [guardando, setGuardando] = useState(false)

  const adminActual = sessionStorage.getItem('admin_usuario') || 'admin'
  const rolActual = sessionStorage.getItem('admin_rol') || 'super_admin'

  useEffect(() => { fetchAdmins() }, [])

  const fetchAdmins = async () => {
    setLoading(true)
    const { data } = await supabase.from('administradores').select('*').order('created_at', { ascending: true })
    setAdmins(data || [])
    setLoading(false)
  }

  const resetForm = () => {
    setForm({ usuario: '', password: '', nombre_completo: '', rol: 'admin' })
    setEditId(null)
    setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.usuario.trim() || !form.nombre_completo.trim()) {
      Swal.fire('Error', 'Usuario y nombre completo son requeridos', 'error')
      return
    }

    setGuardando(true)

    if (editId) {
      // Update
      const updateData = { usuario: form.usuario, nombre_completo: form.nombre_completo, rol: form.rol, updated_at: new Date().toISOString() }
      if (form.password) updateData.password = form.password

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
    setForm({ usuario: admin.usuario, password: '', nombre_completo: admin.nombre_completo, rol: admin.rol })
    setEditId(admin.id)
    setShowForm(true)
  }

  const handleDelete = async (admin) => {
    if (admin.rol === 'super_admin' && admins.filter(a => a.rol === 'super_admin' && a.activo).length <= 1) {
      Swal.fire('No permitido', 'Debe existir al menos un Super Admin activo', 'warning')
      return
    }

    const result = await Swal.fire({
      title: '¿Eliminar administrador?',
      text: `Se desactivará a ${admin.nombre_completo}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
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
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const rolBadge = {
    super_admin: 'bg-amber-100 text-amber-700',
    admin: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
  }
  const rolLabel = { super_admin: 'Super Admin', admin: 'Admin', viewer: 'Solo Lectura' }

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
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-corporate-green text-white rounded-xl text-xs font-bold shadow-sm hover:brightness-95 transition-all border-none cursor-pointer"
          >
            <UserPlus size={14} /> Nuevo Admin
          </button>
        </div>
      </div>

      {/* Roles info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Roles Disponibles</h3>
        <div className="grid sm:grid-cols-3 gap-3">
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
            <p className="text-[11px] text-blue-600">Gestiona personal, aprueba solicitudes y ve bitácora.</p>
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

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-800">{editId ? 'Editar Administrador' : 'Nuevo Administrador'}</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer"><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Usuario</label>
              <input
                type="text"
                value={form.usuario}
                onChange={e => setForm({ ...form, usuario: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
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
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
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
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
                placeholder="ej: Juan Pérez García"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Rol</label>
              <select
                value={form.rol}
                onChange={e => setForm({ ...form, rol: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-corporate-green focus:ring-2 focus:ring-corporate-green/10 transition-all"
              >
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="viewer">Solo Lectura</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 cursor-pointer transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="flex items-center gap-1.5 px-4 py-2 bg-corporate-green text-white rounded-xl text-xs font-bold border-none cursor-pointer hover:brightness-95 transition-all disabled:opacity-50">
                <Save size={14} /> {guardando ? 'Guardando...' : editId ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
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
              <th className="py-3 px-4 text-center text-xs font-bold">Contraseña</th>
              <th className="py-3 px-4 text-center text-xs font-bold w-32">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-8 text-gray-400">No hay administradores registrados.</td></tr>
            ) : admins.map(admin => (
              <tr key={admin.id} className={`hover:bg-gray-50/50 transition-colors ${!admin.activo ? 'opacity-50' : ''}`}>
                <td className="py-3 px-4">
                  <span className="font-bold text-gray-800">{admin.usuario}</span>
                </td>
                <td className="py-3 px-4 text-gray-600">{admin.nombre_completo}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${rolBadge[admin.rol]}`}>
                    {rolLabel[admin.rol]}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${admin.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {admin.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminAdministradores
