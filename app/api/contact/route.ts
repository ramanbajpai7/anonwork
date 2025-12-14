import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json(
        { error: "Name must be between 2 and 100 characters" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    // Validate subject
    const validSubjects = [
      "General Inquiry",
      "Technical Support",
      "Account Issue",
      "Report a Bug",
      "Feature Request",
      "Partnership",
      "Press/Media",
      "Other",
    ];
    if (!validSubjects.includes(subject)) {
      return NextResponse.json(
        { error: "Please select a valid subject" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length < 10 || message.length > 5000) {
      return NextResponse.json(
        { error: "Message must be between 10 and 5000 characters" },
        { status: 400 }
      );
    }

    // Check for required environment variables
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      console.error("Email configuration missing: EMAIL_USER or EMAIL_PASS not set");
      return NextResponse.json(
        { error: "Email service is not configured. Please try again later." },
        { status: 500 }
      );
    }

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass, // Use App Password, not regular password
      },
    });

    // Email content to send to admin
    const mailOptionsToAdmin = {
      from: emailUser,
      to: emailUser, // Send to your email
      replyTo: email, // Reply goes to the sender
      subject: `[AnonWork Contact] ${subject} - from ${name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a1628; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(18, 84, 217, 0.1) 0%, rgba(10, 22, 40, 0.9) 100%); border-radius: 16px; border: 1px solid rgba(18, 84, 217, 0.2); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px; background: linear-gradient(135deg, #1254D9 0%, #0d3d99 100%); text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                        📧 New Contact Form Submission
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px;">
                      <!-- Subject Badge -->
                      <div style="margin-bottom: 20px;">
                        <span style="background: rgba(18, 84, 217, 0.2); color: #5b9aff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
                          ${subject}
                        </span>
                      </div>
                      
                      <!-- Sender Info -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                        <tr>
                          <td style="padding: 15px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border-left: 3px solid #1254D9;">
                            <p style="margin: 0 0 8px 0; color: #888;">From:</p>
                            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${name}</p>
                            <p style="margin: 4px 0 0 0; color: #5b9aff;">${email}</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Message -->
                      <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                        <p style="margin: 0 0 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message:</p>
                        <p style="margin: 0; color: #e0e0e0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                      </div>
                      
                      <!-- Reply Button -->
                      <div style="margin-top: 25px; text-align: center;">
                        <a href="mailto:${email}?subject=Re: ${subject}" style="display: inline-block; background: linear-gradient(135deg, #1254D9 0%, #0d3d99 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: 600;">
                          Reply to ${name}
                        </a>
                      </div>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 30px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
                      <p style="margin: 0; color: #666; font-size: 12px;">
                        This message was sent from the AnonWork contact form.<br>
                        Received at ${new Date().toLocaleString()}
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
New Contact Form Submission

Subject: ${subject}
From: ${name} (${email})

Message:
${message}

---
Received at ${new Date().toLocaleString()}
      `,
    };

    // Confirmation email to sender
    const mailOptionsToSender = {
      from: emailUser,
      to: email,
      subject: `Thank you for contacting AnonWork!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #0a1628; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a1628; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, rgba(18, 84, 217, 0.1) 0%, rgba(10, 22, 40, 0.9) 100%); border-radius: 16px; border: 1px solid rgba(18, 84, 217, 0.2); overflow: hidden;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 30px; background: linear-gradient(135deg, #1254D9 0%, #0d3d99 100%); text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">
                        ✅ We Received Your Message!
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px;">
                      <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                        Hi ${name},
                      </p>
                      <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                        Thank you for reaching out to AnonWork! We've received your message and our team will review it shortly.
                      </p>
                      <p style="margin: 0 0 20px 0; color: #e0e0e0; font-size: 16px; line-height: 1.6;">
                        <strong>Expected response time:</strong> 24-48 hours
                      </p>
                      
                      <!-- Message Summary -->
                      <div style="background: rgba(255, 255, 255, 0.03); border-radius: 8px; padding: 20px; border: 1px solid rgba(255, 255, 255, 0.1); margin: 20px 0;">
                        <p style="margin: 0 0 10px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Message:</p>
                        <p style="margin: 0 0 10px 0; color: #5b9aff; font-weight: 600;">${subject}</p>
                        <p style="margin: 0; color: #aaa; font-size: 14px; line-height: 1.5; white-space: pre-wrap;">${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
                      </div>
                      
                      <p style="margin: 0; color: #888; font-size: 14px;">
                        In the meantime, feel free to explore our community at <a href="https://www.anonwork.tech" style="color: #5b9aff; text-decoration: none;">anonwork.tech</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 20px 30px; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center;">
                      <p style="margin: 0 0 10px 0; color: #ffffff; font-weight: 600;">
                        AnonWork - Speak Freely, Stay Anonymous
                      </p>
                      <p style="margin: 0; color: #666; font-size: 12px;">
                        <a href="https://www.anonwork.tech/privacy" style="color: #5b9aff; text-decoration: none;">Privacy</a> • 
                        <a href="https://www.anonwork.tech/terms" style="color: #5b9aff; text-decoration: none;">Terms</a> • 
                        <a href="https://www.anonwork.tech" style="color: #5b9aff; text-decoration: none;">Website</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
Hi ${name},

Thank you for reaching out to AnonWork! We've received your message and our team will review it shortly.

Expected response time: 24-48 hours

Your Message:
Subject: ${subject}
${message}

---
AnonWork - Speak Freely, Stay Anonymous
https://www.anonwork.tech
      `,
    };

    // Send both emails
    await transporter.sendMail(mailOptionsToAdmin);
    await transporter.sendMail(mailOptionsToSender);

    return NextResponse.json(
      { message: "Message sent successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}

