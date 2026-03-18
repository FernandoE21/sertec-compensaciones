// replacing_instructions.js

// 1. New State definitions to add to NewRequest.jsx
const [todasLasMarcas, setTodasLasMarcas] = useState([]);
const [marcaInicioSeleccionada, setMarcaInicioSeleccionada] = useState(null);
const [marcaFinSeleccionada, setMarcaFinSeleccionada] = useState(null);

// 2. Logic to replace/unify `cargarMarcacion` and `cargarMarcasGPS`
const cargarTodasLasMarcas = async (fecha) => {
  try {
    // This assumes existing functions return arrays of objects with a time property (`hora` or similar)
    // Replace with actual data fetching logic from the original `cargarMarcacion` and `cargarMarcasGPS`
    
    const marcacionesNormales = await fetchMarcacionesNormales(fecha); // Extracted from cargarMarcacion
    const marcacionesGPS = await fetchMarcacionesGPS(fecha); // Extracted from cargarMarcasGPS
    
    // Normalize and combine data
    const combinadas = [
      ...marcacionesNormales.map(m => ({ hora: m.hora, tipo: 'Reloj/Biométrico', original: m })),
      ...marcacionesGPS.map(m => ({ hora: m.hora, tipo: 'GPS', original: m }))
    ];
    
    // Sort chronologically by time
    combinadas.sort((a, b) => {
      if (a.hora < b.hora) return -1;
      if (a.hora > b.hora) return 1;
      return 0;
    });
    
    setTodasLasMarcas(combinadas);
  } catch (error) {
    console.error("Error cargando todas las marcas:", error);
  }
};

// 3. Draft JSX to render inside the form
// Render this block where the user selects the start and end times for their request
const marcasJSX = (
  <div className="mt-4 mb-6">
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Seleccione Hora de Inicio y Fin de las Marcaciones del Día
    </label>
    
    {todasLasMarcas.length > 0 ? (
      <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Inicio</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Fin</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {todasLasMarcas.map((marca, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {marca.hora}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {marca.tipo}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="radio"
                    name="marcaInicio"
                    value={marca.hora}
                    checked={marcaInicioSeleccionada === marca.hora}
                    onChange={() => setMarcaInicioSeleccionada(marca.hora)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <input
                    type="radio"
                    name="marcaFin"
                    value={marca.hora}
                    checked={marcaFinSeleccionada === marca.hora}
                    onChange={() => setMarcaFinSeleccionada(marca.hora)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="p-4 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
        No se encontraron marcaciones para la fecha seleccionada.
      </div>
    )}
  </div>
);
