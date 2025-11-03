import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

// Lazy-load transporter to ensure environment variables are loaded
let transporter: Transporter | null = null

function getTransporter() {
  if (!transporter) {
    // Log SMTP configuration (without password for security)
    console.log("📧 Email Configuration Loaded:")
    console.log("  SMTP_HOST:", process.env.SMTP_HOST || "smtp.gmail.com")
    console.log("  SMTP_PORT:", process.env.SMTP_PORT || "587")
    console.log("  SMTP_SECURE:", process.env.SMTP_SECURE === "true")
    console.log("  SMTP_USER:", process.env.SMTP_USER || "NOT SET")
    console.log("  SMTP_PASS:", process.env.SMTP_PASS ? "✓ SET (hidden)" : "❌ NOT SET")
    console.log("  EMAIL_FROM_NAME:", process.env.EMAIL_FROM_NAME || "CredVault")
    console.log("  EMAIL_FROM_ADDRESS:", process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER || "NOT SET")
    console.log("---")

    // Create reusable transporter
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      debug: true, // Enable debug output
      logger: true, // Log information to console
    })
  }
  return transporter
}

// Verify transporter configuration
export async function verifyEmailConfig() {
  console.log("🔍 Verifying email server connection...")
  try {
    const transport = getTransporter()
    await transport.verify()
    console.log("✅ Email server is ready to send messages")
    return true
  } catch (error) {
    console.error("❌ Email server connection failed:")
    console.error("  Error:", error)
    if (error && typeof error === "object") {
      if ("code" in error) console.error("  Error Code:", error.code)
      if ("command" in error) console.error("  Command:", error.command)
      if ("response" in error) console.error("  Response:", error.response)
      if ("responseCode" in error) console.error("  Response Code:", error.responseCode)
    }
    return false
  }
}

interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  const fromName = process.env.EMAIL_FROM_NAME || "CredVault"
  const fromAddress = process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER
  const fromString = `"${fromName}" <${fromAddress}>`

  console.log("\n📨 Attempting to send email:")
  console.log("  From:", fromString)
  console.log("  To:", to)
  console.log("  Subject:", subject)
  console.log("  Auth User:", process.env.SMTP_USER)
  console.log("  From Address:", fromAddress)
  console.log("  HTML Length:", html.length, "characters")
  console.log("---")

  try {
    const transport = getTransporter()
    const info = await transport.sendMail({
      from: fromString,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    })

    console.log("✅ Email sent successfully!")
    console.log("  Message ID:", info.messageId)
    console.log("  Response:", info.response)
    console.log("  Accepted:", info.accepted)
    console.log("  Rejected:", info.rejected)
    console.log("  Envelope:", JSON.stringify(info.envelope, null, 2))
    console.log("---\n")
    
    return { success: true, messageId: info.messageId, info }
  } catch (error) {
    console.error("\n❌ Email sending failed!")
    console.error("  Error Type:", error?.constructor?.name)
    console.error("  Error Message:", error && typeof error === "object" && "message" in error ? error.message : error)
    
    if (error && typeof error === "object") {
      if ("code" in error) console.error("  Error Code:", error.code)
      if ("command" in error) console.error("  SMTP Command:", error.command)
      if ("response" in error) console.error("  Server Response:", error.response)
      if ("responseCode" in error) console.error("  Response Code:", error.responseCode)
      if ("errno" in error) console.error("  Error Number:", error.errno)
      if ("syscall" in error) console.error("  System Call:", error.syscall)
      
      // Additional iCloud-specific debugging
      console.error("\n🔍 Debugging Info:")
      console.error("  Configuration Check:")
      console.error("    - Auth user matches from address?", process.env.SMTP_USER === fromAddress ? "✓ YES" : "✗ NO (MISMATCH!)")
      console.error("    - Using custom from address?", process.env.EMAIL_FROM_ADDRESS ? "✓ YES" : "✗ NO")
      console.error("    - From:", fromString)
      console.error("    - Auth:", process.env.SMTP_USER)
    }
    
    console.error("---\n")
    return { success: false, error }
  }
}
