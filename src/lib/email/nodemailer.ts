import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"

// Lazy-load transporter to ensure environment variables are loaded
let transporter: Transporter | null = null

function getTransporter() {
  if (!transporter) {

    // Create reusable transporter
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return transporter
}

// Verify transporter configuration
export async function verifyEmailConfig() {
  console.log("Verifying email server connection...")
  try {
    const transport = getTransporter()
    await transport.verify()
    console.log("Email server is ready to send messages")
    return true
  } catch (error) {
    console.error("Email server connection failed:")
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

  try {
    const transport = getTransporter()
    const info = await transport.sendMail({
      from: fromString,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    })

    console.log("Email sent successfully to " + to + " with response: " + info.response)
    
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
      
    }
    
    console.error("---\n")
    return { success: false, error }
  }
}
