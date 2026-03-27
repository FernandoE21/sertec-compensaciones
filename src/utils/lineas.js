export const LINEAS_DISPONIBLES = [
  'CIL',
  'CELSA',
  'INSPECCION',
  'NESTLE',
  'CAD',
  'CPEI',
  'SERTEC',
  'PPL LINDLEY',
  'SPSA',
  'BACKUS'
]

export function escapeRegExp(text) {
  if (!text) return ''
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function normalizarTexto(value) {
  if (!value) return ''
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function obtenerLineaDesdeSeccion(seccionRaw) {
  const seccion = normalizarTexto(seccionRaw)
  if (!seccion) return ''

  // Agrupar variantes (p.ej. "SPSA CORRECTIVO") bajo la línea "SPSA"
  if (seccion.includes('SPSA')) return 'SPSA'
  if (seccion.includes('LINDLEY')) return 'PPL LINDLEY'

  for (const linea of LINEAS_DISPONIBLES) {
    const lineaNorm = normalizarTexto(linea)

    if (lineaNorm.includes(' ')) {
      if (seccion.includes(lineaNorm)) return linea
      continue
    }

    const re = new RegExp(`\\b${escapeRegExp(lineaNorm)}\\b`)
    if (re.test(seccion)) return linea
  }

  return ''
}
