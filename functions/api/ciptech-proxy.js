// Cloudflare Pages Function - Proxy para fotos de Ciptech
// Se despliega automáticamente en: /api/ciptech-proxy
// Maneja autenticación ASP.NET MVC + descarga de fotos

const CIPTECH_BASE = 'https://ciptech.com.pe/ciptech'
const CIPTECH_USER = 'FESPINOZA'
const CIPTECH_PASS = 'Ciptech2020@'

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}

// --- UTILIDADES ---

// Extraer cookies de Set-Cookie headers
function extractCookies(response) {
  const cookies = []
  // Cloudflare Workers: headers.getAll may not exist, use raw approach
  const raw = response.headers.get('set-cookie')
  if (raw) {
    // Split multiple Set-Cookie values (they may be comma-separated or separate)
    raw.split(/,(?=[^ ]+=)/).forEach(c => {
      const name_value = c.split(';')[0].trim()
      if (name_value.includes('=')) cookies.push(name_value)
    })
  }
  return cookies.join('; ')
}

// Combinar cookies existentes con nuevas
function mergeCookies(existing, newCookies) {
  const all = new Map()
  const parse = (str) => {
    str.split(';').forEach(c => {
      const [k, ...v] = c.trim().split('=')
      if (k && v.length) all.set(k.trim(), v.join('='))
    })
  }
  if (existing) parse(existing)
  if (newCookies) parse(newCookies)
  return Array.from(all.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
}

// Extraer __RequestVerificationToken del HTML
function extractVerificationToken(html) {
  const match = html.match(/name="__RequestVerificationToken"[^>]*value="([^"]+)"/)
  if (match) return match[1]
  // Intentar formato alternativo
  const match2 = html.match(/value="([^"]+)"[^>]*name="__RequestVerificationToken"/)
  if (match2) return match2[1]
  return null
}

// Login en ciptech.com.pe - devuelve cookies de sesión
async function loginCiptech() {
  // Paso 1: GET login page → obtener token y cookies
  const loginPageRes = await fetch(`${CIPTECH_BASE}/Account/Login`, {
    redirect: 'manual',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
  })
  const loginHtml = await loginPageRes.text()
  const initialCookies = extractCookies(loginPageRes)
  const token = extractVerificationToken(loginHtml)

  if (!token) {
    return { ok: false, error: 'No se encontró __RequestVerificationToken en login page', html: loginHtml.substring(0, 2000) }
  }

  // Paso 2: POST login
  const formBody = new URLSearchParams({
    'UserName': CIPTECH_USER,
    'Password': CIPTECH_PASS,
    '__RequestVerificationToken': token,
  })

  const loginRes = await fetch(`${CIPTECH_BASE}/Account/Login`, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': initialCookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': `${CIPTECH_BASE}/Account/Login`,
    },
    body: formBody.toString()
  })

  const postCookies = extractCookies(loginRes)
  const sessionCookies = mergeCookies(initialCookies, postCookies)

  // Verificar si el login fue exitoso (302 redirect al home, o 200 sin error)
  const status = loginRes.status
  if (status === 302 || status === 301) {
    // Login exitoso - redirect
    return { ok: true, cookies: sessionCookies }
  }

  // Si fue 200, verificar que no sea la misma página de login con error
  const responseHtml = await loginRes.text()
  if (responseHtml.includes('Log Off') || responseHtml.includes('Cerrar sesión') || responseHtml.includes('Personal')) {
    return { ok: true, cookies: sessionCookies }
  }

  return { ok: false, error: `Login respondió con status ${status}`, cookies: sessionCookies, html: responseHtml.substring(0, 2000) }
}

// Fetch autenticado
async function fetchAuth(url, cookies) {
  return fetch(url, {
    redirect: 'manual',
    headers: {
      'Cookie': cookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
  })
}

// Buscar URLs de foto de un empleado en el HTML de Personal
function findPhotoUrl(html, codigo) {
  // Estrategia 1: Buscar <img> cerca del código del empleado
  // Buscar en un bloque de ±500 chars alrededor del código
  const codigoClean = codigo.replace(/^0+/, '') // sin leading zeros también
  const patterns = [codigo, codigoClean]

  for (const code of patterns) {
    const idx = html.indexOf(code)
    if (idx === -1) continue

    // Buscar img src en el contexto (500 chars antes y después)
    const start = Math.max(0, idx - 1000)
    const end = Math.min(html.length, idx + 1000)
    const context = html.substring(start, end)

    // Buscar todas las img src en el contexto
    const imgMatches = [...context.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/gi)]
    for (const m of imgMatches) {
      const src = m[1]
      // Ignorar iconos pequeños, logos, etc.
      if (src.includes('logo') || src.includes('icon') || src.includes('Content/images/usuario')) continue
      return src
    }
  }

  return null
}

// --- HANDLER PRINCIPAL ---
export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const action = url.searchParams.get('action')
  const codigo = url.searchParams.get('codigo')

  try {
    // ==== TEST DE LOGIN ====
    if (action === 'login-test') {
      const result = await loginCiptech()
      return new Response(JSON.stringify(result, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ==== DESCUBRIR ESTRUCTURA DE LA PÁGINA ====
    if (action === 'discover') {
      const login = await loginCiptech()
      if (!login.ok) {
        return new Response(JSON.stringify({ error: 'Login failed', details: login }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Intentar página de Personal
      const personalRes = await fetchAuth(`${CIPTECH_BASE}/Personal`, login.cookies)
      let html = await personalRes.text()

      // Si es redirect (session expired), seguir
      if (personalRes.status === 302) {
        const location = personalRes.headers.get('location')
        return new Response(JSON.stringify({
          message: 'Redirect detectado',
          redirectTo: location,
          status: personalRes.status
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Extraer todas las img src
      const allImages = [...html.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/gi)].map(m => m[1])
      const uniqueImages = [...new Set(allImages)]

      // Extraer todos los links
      const allLinks = [...html.matchAll(/<a[^>]*href="([^"]+)"[^>]*>/gi)].map(m => m[1])
        .filter(l => l.includes('Personal') || l.includes('Foto') || l.includes('foto'))

      // Buscar patrones de foto
      const fotoPatterns = html.match(/[Ff]oto[^"'\s]*/g) || []

      return new Response(JSON.stringify({
        status: personalRes.status,
        htmlLength: html.length,
        title: (html.match(/<title>([^<]+)<\/title>/i) || [])[1] || 'N/A',
        allImages: uniqueImages.slice(0, 50),
        personalLinks: allLinks.slice(0, 30),
        fotoPatterns: [...new Set(fotoPatterns)].slice(0, 20),
        // Primeros 5000 chars del body para inspeccionar
        htmlPreview: html.substring(0, 8000)
      }, null, 2), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // ==== BUSCAR FOTO POR CÓDIGO ====
    if (action === 'foto' && codigo) {
      const login = await loginCiptech()
      if (!login.ok) {
        return new Response(JSON.stringify({ error: 'Login failed', details: login.error }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Estrategia multi-paso para encontrar la foto

      // 1. Intentar obtener la página de Personal y buscar la foto del empleado
      const personalRes = await fetchAuth(`${CIPTECH_BASE}/Personal`, login.cookies)
      const personalHtml = await personalRes.text()

      let photoUrl = findPhotoUrl(personalHtml, codigo)

      // 2. Si no se encontró en la lista, intentar la ficha individual
      if (!photoUrl) {
        // Intentar endpoints comunes de ficha individual
        const editUrls = [
          `${CIPTECH_BASE}/Personal/Details/${codigo}`,
          `${CIPTECH_BASE}/Personal/Edit/${codigo}`,
          `${CIPTECH_BASE}/Personal/Detalle/${codigo}`,
          `${CIPTECH_BASE}/Personal/Editar/${codigo}`,
        ]

        for (const editUrl of editUrls) {
          const editRes = await fetchAuth(editUrl, login.cookies)
          if (editRes.status === 200) {
            const editHtml = await editRes.text()
            photoUrl = findPhotoUrl(editHtml, codigo)
            if (photoUrl) break

            // Buscar cualquier img que no sea icono
            const anyImg = [...editHtml.matchAll(/<img[^>]*src="([^"]+)"[^>]*>/gi)]
              .map(m => m[1])
              .filter(s => !s.includes('logo') && !s.includes('icon') && !s.includes('usuario') && !s.includes('Content/images/'))
            if (anyImg.length > 0) {
              photoUrl = anyImg[0]
              break
            }
          }
        }
      }

      // 3. Si aún no se encontró, intentar endpoints directos de foto
      if (!photoUrl) {
        const directUrls = [
          `${CIPTECH_BASE}/Personal/GetFoto/${codigo}`,
          `${CIPTECH_BASE}/Personal/GetFoto?codigo=${codigo}`,
          `${CIPTECH_BASE}/Personal/Foto/${codigo}`,
          `${CIPTECH_BASE}/Fotos/Personal/${codigo}.jpg`,
        ]

        for (const directUrl of directUrls) {
          const directRes = await fetchAuth(directUrl, login.cookies)
          if (directRes.status === 200) {
            const contentType = directRes.headers.get('content-type') || ''
            if (contentType.startsWith('image/')) {
              // ¡Encontrada! Devolver la imagen directamente
              const blob = await directRes.arrayBuffer()
              return new Response(blob, {
                headers: {
                  ...corsHeaders,
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=3600'
                }
              })
            }
          }
        }
      }

      if (!photoUrl) {
        return new Response(JSON.stringify({
          error: 'No se encontró la foto del empleado',
          codigo,
          suggestion: 'Usa action=discover para inspeccionar la estructura de la página'
        }), {
          status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Resolver URL relativa
      if (photoUrl.startsWith('/')) {
        photoUrl = `https://ciptech.com.pe${photoUrl}`
      } else if (!photoUrl.startsWith('http')) {
        photoUrl = `${CIPTECH_BASE}/${photoUrl}`
      }

      // Descargar la foto
      const photoRes = await fetchAuth(photoUrl, login.cookies)
      if (photoRes.status !== 200) {
        return new Response(JSON.stringify({ error: `Error descargando foto: ${photoRes.status}`, url: photoUrl }), {
          status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const contentType = photoRes.headers.get('content-type') || 'image/jpeg'
      const blob = await photoRes.arrayBuffer()

      return new Response(blob, {
        headers: {
          ...corsHeaders,
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

    // ==== AYUDA ====
    return new Response(JSON.stringify({
      endpoints: {
        'login-test': '/api/ciptech-proxy?action=login-test',
        'discover': '/api/ciptech-proxy?action=discover',
        'foto': '/api/ciptech-proxy?action=foto&codigo=01002044',
      },
      description: 'Proxy para importar fotos desde ciptech.com.pe'
    }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
