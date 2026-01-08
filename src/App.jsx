import { useState } from 'react'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
  // Estados para el formulario
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]) // Fecha de hoy por defecto
  const [inicio, setInicio] = useState('18:00') // Sugerimos 6:00 PM por defecto
  const [fin, setFin] = useState('19:00')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validacion basica
    if (!nombre || !motivo) {
      alert('Por favor completa nombre y motivo')
      setLoading(false)
      return
    }

    // Insertar en Supabase
    const { data, error } = await supabase
      .from('registros_extras')
      .insert([
        { 
          nombre_empleado: nombre,
          fecha_actividad: fecha,
          hora_inicio: inicio,
          hora_fin: fin,
          motivo: motivo
        },
      ])

    if (error) {
      console.error('Error:', error)
      alert('Error al guardar: ' + error.message)
    } else {
      alert('✅ Hora extra registrada correctamente')
      // Limpiar formulario
      setMotivo('')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🌙 Registro de Horas Extras</h1>
      <p style={{ color: '#666' }}>El horario estándar termina a las 18:00. Registra tu sobretiempo aquí.</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <div className="campo">
          <label>Colaborador:</label>
          <input 
            type="text" 
            placeholder="Ej. Juan Pérez" 
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div className="campo">
          <label>Fecha:</label>
          <input 
            type="date" 
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <label>Hora Inicio:</label>
            <input 
              type="time" 
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Hora Fin:</label>
            <input 
              type="time" 
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            />
          </div>
        </div>

        <div className="campo">
          <label>Motivo / Proyecto:</label>
          <textarea 
            placeholder="Ej. Despliegue a producción urgente..." 
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            rows="3"
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '12px', 
            backgroundColor: loading ? '#ccc' : '#2e7d32', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? 'Guardando...' : 'Registrar Horas'}
        </button>

      </form>
    </div>
  )
}

export default App