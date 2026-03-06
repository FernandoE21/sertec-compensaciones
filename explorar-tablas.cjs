// Script temporal para explorar tablas de la base MARCACION en PROMETEO
// Ejecutar con: node explorar-tablas.cjs

const sql = require('mssql')

const SQL_CONFIG = {
  server: 'PROMETEO',
  port: 1200,
  database: 'MARCACION',
  user: 'USERDESK',
  password: 'GPTY2K5',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  requestTimeout: 60000,
  connectionTimeout: 15000,
}

async function explorar() {
  let pool
  try {
    console.log('Conectando a PROMETEO...')
    pool = await sql.connect(SQL_CONFIG)
    console.log('Conexion OK\n')

    // 1. Listar TODAS las tablas
    console.log('=== TODAS LAS TABLAS ===')
    const tablas = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      ORDER BY TABLE_NAME
    `)
    tablas.recordset.forEach(t => console.log('  ' + t.TABLE_NAME))
    console.log(`\nTotal: ${tablas.recordset.length} tablas\n`)

    // 2. Buscar tablas con MOBILE, GPS, o MARCA en el nombre
    console.log('=== TABLAS RELEVANTES (MOBILE/GPS/MARCA) ===')
    const relevantes = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND (TABLE_NAME LIKE '%MOBILE%' OR TABLE_NAME LIKE '%GPS%' 
           OR TABLE_NAME LIKE '%MARCA%' OR TABLE_NAME LIKE '%MOVIL%'
           OR TABLE_NAME LIKE '%CELULAR%' OR TABLE_NAME LIKE '%APP%')
      ORDER BY TABLE_NAME
    `)
    if (relevantes.recordset.length > 0) {
      relevantes.recordset.forEach(t => console.log('  >> ' + t.TABLE_NAME))
    } else {
      console.log('  (ninguna encontrada con esos patrones)')
    }

    // 3. Para cada tabla relevante, mostrar columnas
    console.log('\n=== ESTRUCTURA DE TABLAS RELEVANTES ===')
    const tablasInteres = relevantes.recordset.map(t => t.TABLE_NAME)
    
    // También incluir MARCACION_BASE (la que ya usamos) para comparar
    if (!tablasInteres.includes('MARCACION_BASE')) tablasInteres.push('MARCACION_BASE')

    for (const tabla of tablasInteres) {
      console.log(`\n--- ${tabla} ---`)
      const cols = await pool.request().query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = '${tabla}'
        ORDER BY ORDINAL_POSITION
      `)
      cols.recordset.forEach(c => {
        const len = c.CHARACTER_MAXIMUM_LENGTH ? `(${c.CHARACTER_MAXIMUM_LENGTH})` : ''
        console.log(`  ${c.COLUMN_NAME} [${c.DATA_TYPE}${len}]`)
      })

      // Mostrar primeras 3 filas como ejemplo
      try {
        const ejemplo = await pool.request().query(`SELECT TOP 3 * FROM ${tabla} ORDER BY 1 DESC`)
        if (ejemplo.recordset.length > 0) {
          console.log(`  >> Ejemplo (${ejemplo.recordset.length} filas):`)
          ejemplo.recordset.forEach(row => console.log(`     ${JSON.stringify(row)}`))
        }
      } catch (e) {
        console.log(`  >> Error leyendo datos: ${e.message}`)
      }
    }

  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    if (pool) await pool.close()
  }
}

explorar()
