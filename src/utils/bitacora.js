import { supabase } from '../supabaseClient'

/**
 * Registra una acción en la bitácora de auditoría.
 * @param {Object} params
 * @param {string} params.usuario - Código del trabajador o usuario admin
 * @param {string} params.tipo_usuario - 'admin' | 'empleado'
 * @param {string} params.accion - Ej: 'login', 'crear', 'editar', 'eliminar', 'aprobar', 'rechazar', 'cambiar_password', 'config'
 * @param {string} params.modulo - Ej: 'personal', 'registro_horas', 'administradores', 'configuracion'
 * @param {string} params.descripcion - Descripción legible de la acción
 * @param {Object} [params.datos_anteriores] - Datos antes del cambio (JSON)
 * @param {Object} [params.datos_nuevos] - Datos después del cambio (JSON)
 * @param {string} [params.registro_id] - ID o código del registro afectado
 */
export async function logBitacora({
  usuario,
  tipo_usuario,
  accion,
  modulo,
  descripcion,
  datos_anteriores = null,
  datos_nuevos = null,
  registro_id = null,
}) {
  try {
    await supabase.from('bitacora').insert({
      usuario,
      tipo_usuario,
      accion,
      modulo,
      descripcion,
      datos_anteriores,
      datos_nuevos,
      registro_id,
    })
  } catch (err) {
    console.error('Error al registrar en bitácora:', err)
  }
}
