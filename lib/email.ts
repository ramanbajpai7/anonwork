import nodemailer from "nodemailer"

// Create transporter - uses environment variables for configuration
// For Gmail, you need to enable "Less secure app access" or use App Passwords
// For other services, configure SMTP settings accordingly

function getTransporter() {
  const emailService = process.env.EMAIL_SERVICE || "gmail"
  const emailUser = process.env.EMAIL_USER
  const emailPass = process.env.EMAIL_PASS

  if (!emailUser || !emailPass) {
    console.warn("Email credentials not configured. Emails will be logged to console.")
    return null
  }

  // Gmail configuration
  if (emailService === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass, // Use App Password for Gmail
      },
    })
  }

  // Generic SMTP configuration
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })
}

interface SendEmailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const transporter = getTransporter()

  if (!transporter) {
    // Fallback: log email to console in development
    console.log("📧 Email (not sent - no credentials configured):")
    console.log(`   To: ${options.to}`)
    console.log(`   Subject: ${options.subject}`)
    console.log(`   Body: ${options.text || options.html}`)
    return true // Return true so the flow continues
  }

  try {
    const info = await transporter.sendMail({
      from: `"AnonWork" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    console.log("Email sent:", info.messageId)
    return true
  } catch (error) {
    console.error("Failed to send email:", error)
    return false
  }
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  const subject = "Verify Your Work Email - AnonWork"
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 32px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; }
        .content { padding: 32px; }
        .code-box { background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
        .code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1f2937; font-family: monospace; }
        .footer { padding: 24px; background: #f9fafb; text-align: center; font-size: 14px; color: #6b7280; }
        p { color: #4b5563; line-height: 1.6; margin: 0 0 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 AnonWork</h1>
        </div>
        <div class="content">
          <p>Hi there,</p>
          <p>You requested to verify your work email. Use this verification code to complete the process:</p>
          <div class="code-box">
            <div class="code">${code}</div>
          </div>
          <p>This code will expire in <strong>15 minutes</strong>.</p>
          <p>If you didn't request this verification, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} AnonWork - Anonymous Professional Community</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    AnonWork - Work Email Verification
    
    Your verification code is: ${code}
    
    This code will expire in 15 minutes.
    
    If you didn't request this verification, you can safely ignore this email.
  `

  return sendEmail({ to: email, subject, html, text })
}

