// Cloudflare Pages Function - Envío de correo cuando un registro se marca como "Observado"
// Se despliega automáticamente en: /api/send-observacion-email
// Requiere variables de entorno en Cloudflare Pages:
// - RESEND_API_KEY
// - MAIL_FROM (ej: "Compensaciones <no-reply@tudominio.com>")
// - (opcional) MAIL_REPLY_TO

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}

function badRequest(message) {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status: 400,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export async function onRequestPost(context) {
  const { request, env } = context

  try {
    const apiKey = env?.RESEND_API_KEY
    const from = env?.MAIL_FROM
    const replyTo = env?.MAIL_REPLY_TO

    if (!apiKey) return badRequest('Falta RESEND_API_KEY en variables de entorno')
    if (!from) return badRequest('Falta MAIL_FROM en variables de entorno')

    const body = await request.json().catch(() => null)
    if (!body) return badRequest('Body inválido (se esperaba JSON)')

    const to = typeof body.to === 'string' ? body.to.trim() : ''
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    const text = typeof body.text === 'string' ? body.text : ''
    const html = typeof body.html === 'string' ? body.html : ''

    if (!to || !to.includes('@')) return badRequest('Campo "to" inválido')
    if (!subject) return badRequest('Campo "subject" es requerido')
    if (!text && !html) return badRequest('Se requiere "text" o "html"')

    const payload = {
      from,
      to,
      subject,
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const resendText = await resendRes.text()
    if (!resendRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Resend API error', details: resendText }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    return new Response(JSON.stringify({ ok: true, details: resendText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}
