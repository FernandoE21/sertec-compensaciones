// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts"

type Payload = {
  to: string
  subject: string
  body: string
  html?: string
  dry_run?: boolean
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

function json(status: number, data: unknown) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function readRequiredEnv(key: string) {
  const value = Deno.env.get(key)
  if (!value) throw new Error(`Missing env var: ${key}`)
  return value
}

function createLineReader(reader: ReadableStreamDefaultReader<Uint8Array>) {
  const decoder = new TextDecoder()
  let buffer = ""

  return async function readLine() {
    while (true) {
      const idx = buffer.indexOf("\r\n")
      if (idx !== -1) {
        const line = buffer.slice(0, idx)
        buffer = buffer.slice(idx + 2)
        return line
      }

      const { value, done } = await reader.read()
      if (done) return buffer
      buffer += decoder.decode(value, { stream: true })
    }
  }
}

async function smtpReadResponse(readLine: () => Promise<string>) {
  // Handles multi-line responses: 250-... then 250 ...
  let last = ""
  while (true) {
    const line = await readLine()
    last = line
    if (!line) break
    if (line.length >= 4 && line[3] !== "-") break
  }
  const code = parseInt(last.slice(0, 3), 10)
  return { code, line: last }
}

async function smtpWrite(writer: WritableStreamDefaultWriter<Uint8Array>, s: string) {
  const encoder = new TextEncoder()
  await writer.write(encoder.encode(s + "\r\n"))
}

function b64(s: string) {
  return btoa(s)
}

function parseMailbox(value: string): { email: string; name?: string } {
  const raw = String(value || "").trim()
  if (!raw) return { email: "" }

  // Supports:
  // - Name <email@domain>
  // - <email@domain>
  // - email@domain
  const match = raw.match(/^(.*?)(?:\s*)<\s*([^>]+)\s*>\s*$/)
  if (match) {
    const name = match[1].trim().replace(/[\r\n]+/g, " ").trim()
    const email = match[2].trim()
    return name ? { email, name } : { email }
  }

  const bare = raw.replace(/^<|>$/g, "").trim()
  return { email: bare }
}

function formatFromHeader(opts: { email: string; name?: string }) {
  const email = String(opts.email || "").trim()
  const name = String(opts.name || "").trim().replace(/[\r\n]+/g, " ").trim()
  if (!name) return `<${email}>`
  return `${name} <${email}>`
}

async function sendMailStartTls(opts: {
  hostname: string
  port: number
  username: string
  password: string
  fromEmail: string
  fromHeader: string
  to: string
  subject: string
  body: string
  html?: string
}) {
  const conn = await Deno.connect({ hostname: opts.hostname, port: opts.port })
  try {
    let reader = conn.readable.getReader()
    let writer = conn.writable.getWriter()
    let readLine = createLineReader(reader)

    const ready = await smtpReadResponse(readLine)
    if (ready.code !== 220) throw new Error(`SMTP not ready: ${ready.line}`)

    await smtpWrite(writer, `EHLO ${opts.hostname}`)
    const ehlo = await smtpReadResponse(readLine)
    if (ehlo.code !== 250) throw new Error(`EHLO failed: ${ehlo.line}`)

    await smtpWrite(writer, "STARTTLS")
    const starttls = await smtpReadResponse(readLine)
    if (starttls.code !== 220) throw new Error(`STARTTLS failed: ${starttls.line}`)

    // Upgrade the connection to TLS
    const tlsConn = await Deno.startTls(conn, { hostname: opts.hostname })
    reader.releaseLock()
    writer.releaseLock()

    reader = tlsConn.readable.getReader()
    writer = tlsConn.writable.getWriter()
    readLine = createLineReader(reader)

    await smtpWrite(writer, `EHLO ${opts.hostname}`)
    const ehlo2 = await smtpReadResponse(readLine)
    if (ehlo2.code !== 250) throw new Error(`EHLO after STARTTLS failed: ${ehlo2.line}`)

    // AUTH LOGIN
    await smtpWrite(writer, "AUTH LOGIN")
    const auth1 = await smtpReadResponse(readLine)
    if (auth1.code !== 334) throw new Error(`AUTH LOGIN failed: ${auth1.line}`)

    await smtpWrite(writer, b64(opts.username))
    const auth2 = await smtpReadResponse(readLine)
    if (auth2.code !== 334) throw new Error(`AUTH USER failed: ${auth2.line}`)

    await smtpWrite(writer, b64(opts.password))
    const auth3 = await smtpReadResponse(readLine)
    if (auth3.code !== 235) throw new Error(`AUTH PASS failed: ${auth3.line}`)

    await smtpWrite(writer, `MAIL FROM:<${opts.fromEmail}>`)
    const mailFrom = await smtpReadResponse(readLine)
    if (mailFrom.code !== 250) throw new Error(`MAIL FROM failed: ${mailFrom.line}`)

    await smtpWrite(writer, `RCPT TO:<${opts.to}>`)
    const rcpt = await smtpReadResponse(readLine)
    if (rcpt.code !== 250 && rcpt.code !== 251) throw new Error(`RCPT TO failed: ${rcpt.line}`)

    await smtpWrite(writer, "DATA")
    const dataResp = await smtpReadResponse(readLine)
    if (dataResp.code !== 354) throw new Error(`DATA failed: ${dataResp.line}`)

    const lines: string[] = []
    lines.push(`Subject: ${opts.subject}`)
    lines.push(`From: ${opts.fromHeader}`)
    lines.push(`To: <${opts.to}>`)
    lines.push(`Date: ${new Date().toUTCString()}`)
    if (opts.html) {
      const boundary = "AlternativeBoundary"
      lines.push("MIME-Version: 1.0")
      lines.push(`Content-Type: multipart/alternative; boundary=${boundary}`)
      lines.push("")
      lines.push(`--${boundary}`)
      lines.push('Content-Type: text/plain; charset="utf-8"')
      lines.push("")
      lines.push(opts.body)
      lines.push(`--${boundary}`)
      lines.push('Content-Type: text/html; charset="utf-8"')
      lines.push("")
      lines.push(opts.html)
      lines.push(`--${boundary}--`)
    } else {
      lines.push("MIME-Version: 1.0")
      lines.push('Content-Type: text/plain; charset="utf-8"')
      lines.push("")
      lines.push(opts.body)
    }

    const message = lines.join("\r\n") + "\r\n.\r\n"
    const encoder = new TextEncoder()
    await writer.write(encoder.encode(message))

    const finalResp = await smtpReadResponse(readLine)
    if (finalResp.code !== 250) throw new Error(`Message not accepted: ${finalResp.line}`)

    await smtpWrite(writer, "QUIT")
  } finally {
    try {
      conn.close()
    } catch {
      // ignore
    }
  }
}

async function sendMailViaDenoSmtp(opts: {
  hostname: string
  port: number
  username: string
  password: string
  fromEmail: string
  fromHeader: string
  to: string
  subject: string
  body: string
  html?: string
}) {
  const { SmtpClient } = await import("https://deno.land/x/smtp@v0.7.0/mod.ts")
  const client = new SmtpClient()

  if (opts.port === 465) {
    await client.connectTLS({
      hostname: opts.hostname,
      port: opts.port,
      username: opts.username,
      password: opts.password,
    })
  } else {
    await client.connect({
      hostname: opts.hostname,
      port: opts.port,
      username: opts.username,
      password: opts.password,
    })
  }

  try {
    await client.send({
      from: opts.fromHeader,
      to: opts.to,
      subject: opts.subject,
      content: opts.body,
      ...(opts.html ? { html: opts.html } : {}),
    })
  } finally {
    await client.close()
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }
  if (req.method !== "POST") {
    return json(405, { ok: false, error: "Method not allowed" })
  }

  try {
    const payload = (await req.json().catch(() => null)) as Payload | null
    if (!payload) return json(400, { ok: false, error: "Invalid JSON" })

    const to = String(payload.to || "").trim()
    const subject = String(payload.subject || "").trim()
    const body = String(payload.body || "").trim()
    const html = payload.html ? String(payload.html) : undefined
    const dryRun = Boolean(payload.dry_run)

    if (!to || !to.includes("@")) return json(400, { ok: false, error: "Invalid 'to'" })
    if (!subject) return json(400, { ok: false, error: "Missing 'subject'" })
    if (!body) return json(400, { ok: false, error: "Missing 'body'" })

    if (dryRun) {
      return json(200, {
        ok: true,
        dry_run: true,
        mail: { to, subject, has_html: Boolean(html), body_len: body.length },
      })
    }

    const smtpHost = readRequiredEnv("SMTP_HOST")
    const smtpPort = Number(readRequiredEnv("SMTP_PORT"))
    const smtpUser = readRequiredEnv("SMTP_USER")
    const smtpPass = readRequiredEnv("SMTP_PASS")
    const mailFromRaw = (Deno.env.get("MAIL_FROM") || smtpUser).trim()
    const mailFromName = (Deno.env.get("MAIL_FROM_NAME") || "").trim()
    const parsedFrom = parseMailbox(mailFromRaw)
    const fromEmail = parsedFrom.email
    const fromHeader = formatFromHeader({ email: fromEmail, name: parsedFrom.name || mailFromName || undefined })
    const tlsMode = (Deno.env.get("SMTP_TLS_MODE") || "auto").toLowerCase() // auto | starttls | plain | tls
    const timeoutMs = Number(Deno.env.get("SMTP_TIMEOUT_MS") || "15000")

    const opts = {
      hostname: smtpHost,
      port: smtpPort,
      username: smtpUser,
      password: smtpPass,
      fromEmail,
      fromHeader,
      to,
      subject,
      body,
      html,
    }

    // Prefer STARTTLS for 587 when requested/auto.
    const sendPromise = (tlsMode === "starttls" || (tlsMode === "auto" && smtpPort === 587))
      ? sendMailStartTls(opts)
      : sendMailViaDenoSmtp(opts)

    await Promise.race([
      sendPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(`SMTP timeout after ${timeoutMs}ms`)), timeoutMs)),
    ])

    return json(200, { ok: true })
  } catch (err) {
    return json(500, { ok: false, error: String(err?.message || err) })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send_smtp_email' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
