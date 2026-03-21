import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Clock, Users } from 'lucide-react'

function AdminHorarios() {
  const [horarios, setHorarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHorarios = async () => {
      setLoading(true)

      // Get schedules
      const { data: horariosData, error: horariosError } = await supabase.from('grupos_horarios').select('*').order('id')
      
      // Get all personnel to count how many are assigned to each schedule
      const { data: personalData } = await supabase.from('personal').select('id_grupo_horario')

      if (!horariosError && horariosData) {
        // Map counts
        const counted = horariosData.map(h => {
          const encount = personalData ? personalData.filter(p => String(p.id_grupo_horario) === String(h.id)).length : 0
          return { ...h, cantidad_usuarios: encount }
        })
        setHorarios(counted)
      }
      setLoading(false)
    }
    fetchHorarios()
  }, [])

  return (
    <div className="max-w-[1000px] mx-auto bg-gradient-to-b from-slate-50 to-white rounded-3xl border-t-[6px] border-t-corporate-green shadow-xl overflow-hidden p-6 md:p-10 my-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-dashed border-slate-200 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-corporate-blue flex items-center gap-2 uppercase tracking-wide">
            <Clock size={24} className="text-corporate-green" />
            Grupos y Horarios
          </h2>
          <span className="text-xs text-slate-500 ml-8">Visualiza y gestiona los horarios del personal</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-8 text-gray-400">
            Cargando horarios...
          </div>
        ) : (
          horarios.map(h => (
            <div key={h.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-green-50 to-green-100/50 rounded-bl-full -z-0 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-corporate-green">
                    <Clock size={20} />
                  </div>
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md">ID: {h.id}</span>
                </div>
                
                <h3 className="font-bold text-gray-800 text-sm mb-1 line-clamp-2 min-h-[40px]">{h.nombre}</h3>
                
                {h.total_semanas_ciclo && (
                  <p className="text-xs text-slate-500 mb-4 inline-flex items-center gap-1">
                    Ciclo: <strong>{h.total_semanas_ciclo} {h.total_semanas_ciclo == 1 ? 'semana' : 'semanas'}</strong>
                  </p>
                )}
                
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-corporate-blue">
                    <Users size={14} />
                    <span className="text-xs font-bold">{h.cantidad_usuarios}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Asignados</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default AdminHorarios
