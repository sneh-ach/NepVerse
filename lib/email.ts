// Email service abstraction
// Supports Resend, SendGrid, and AWS SES

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
}

class EmailService {
  private provider: 'resend' | 'sendgrid' | 'ses' | null = null
  private fromEmail: string

  constructor() {
    // Use Resend's test domain for development if no custom domain verified
    this.fromEmail = process.env.EMAIL_FROM || 'NepVerse <onboarding@resend.dev>'
  }

  // Lazy provider detection - check at send time to ensure env vars are loaded
  private getProvider(): 'resend' | 'sendgrid' | 'ses' | null {
    if (this.provider) {
      return this.provider
    }
    
    // Check environment variables at runtime
    if (process.env.RESEND_API_KEY) {
      this.provider = 'resend'
      console.log('[Email] ✅ Resend provider detected')
    } else if (process.env.SENDGRID_API_KEY) {
      this.provider = 'sendgrid'
      console.log('[Email] ✅ SendGrid provider detected')
    } else if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.provider = 'ses'
      console.log('[Email] ✅ AWS SES provider detected')
    } else {
      console.warn('[Email] ⚠️ No email provider configured')
      console.warn('[Email] ⚠️ RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Found' : 'NOT FOUND')
    }
    
    return this.provider
  }

  async send(options: EmailOptions): Promise<boolean> {
    const provider = this.getProvider()
    
    if (!provider) {
      console.warn('⚠️ No email provider configured. Email not sent:', options.subject)
      console.warn('⚠️ To enable email sending, set one of the following in .env:')
      console.warn('   - RESEND_API_KEY (recommended)')
      console.warn('   - SENDGRID_API_KEY')
      console.warn('   - AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY (for AWS SES)')
      console.warn('⚠️ Current RESEND_API_KEY value:', process.env.RESEND_API_KEY ? 'Set (' + process.env.RESEND_API_KEY.substring(0, 10) + '...)' : 'NOT SET')
      return false
    }

    try {
      switch (provider) {
        case 'resend':
          return await this.sendViaResend(options)
        case 'sendgrid':
          return await this.sendViaSendGrid(options)
        case 'ses':
          return await this.sendViaSES(options)
        default:
          return false
      }
    } catch (error) {
      console.error('Email send error:', error)
      return false
    }
  }

  private async sendViaResend(options: EmailOptions): Promise<boolean> {
    try {
      const { Resend } = await import('resend')
      const apiKey = process.env.RESEND_API_KEY
      
      if (!apiKey) {
        console.error('[Email] RESEND_API_KEY not found')
        return false
      }
      
      console.log('[Email] Initializing Resend with API key:', apiKey.substring(0, 10) + '...')
      const resend = new Resend(apiKey)

      const toEmail = Array.isArray(options.to) ? options.to.join(', ') : options.to
      const fromEmail = options.from || this.fromEmail
      
      console.log('[Email] Sending via Resend:')
      console.log('[Email]   To:', toEmail)
      console.log('[Email]   From:', fromEmail)
      console.log('[Email]   Subject:', options.subject)

      const result = await resend.emails.send({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      })

      if (result.error) {
        console.error('[Email] Resend API error:', JSON.stringify(result.error, null, 2))
        console.error('[Email] Error details:', result.error.message || result.error)
        return false
      }

      console.log('[Email] ✅ Email sent successfully!')
      console.log('[Email]   Message ID:', result.data?.id)
      console.log('[Email]   To:', toEmail)
      return true
    } catch (error: any) {
      console.error('[Email] ❌ Resend send error:', error.message || error)
      console.error('[Email] Error stack:', error.stack)
      return false
    }
  }

  private async sendViaSendGrid(options: EmailOptions): Promise<boolean> {
    // This function should only be called if SENDGRID_API_KEY is set
    // Use dynamic import (safe, no Function constructor)
    try {
      const sgMail = await import('@sendgrid/mail').catch(() => null)
      
      if (!sgMail) {
        console.warn('SendGrid package not installed. Install with: npm install @sendgrid/mail')
        return false
      }
      
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY!)

      await sgMail.default.send({
        from: options.from || this.fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      })

      return true
    } catch (error: any) {
      console.error('SendGrid send error:', error)
      return false
    }
  }

  private async sendViaSES(options: EmailOptions): Promise<boolean> {
    // This function should only be called if AWS SES credentials are set
    // Use dynamic import (safe, no Function constructor)
    try {
      const sesModule = await import('@aws-sdk/client-ses').catch(() => null)
      
      if (!sesModule) {
        console.warn('AWS SES package not installed. Install with: npm install @aws-sdk/client-ses')
        return false
      }
      
      const { SESClient, SendEmailCommand } = sesModule
      const client = new SESClient({
        region: process.env.AWS_SES_REGION || 'us-east-1',
      })

      await client.send(
        new SendEmailCommand({
          Source: options.from || this.fromEmail,
          Destination: {
            ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
          },
          Message: {
            Subject: { Data: options.subject },
            Body: {
              Html: { Data: options.html },
              Text: { Data: options.text || options.subject },
            },
          },
        })
      )

      return true
    } catch (error: any) {
      console.error('AWS SES send error:', error)
      return false
    }
  }

  // Email templates
  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    return this.send({
      to,
      subject: 'Welcome to NepVerse!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Welcome to NepVerse!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Hi ${name},</p>
              <p>Thank you for joining NepVerse - The Home of Nepali Stories!</p>
              <p>You now have access to unlimited Nepali movies, series, and originals.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/browse" style="background: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Watching</a>
              </div>
              <p>Happy streaming!</p>
              <p>The NepVerse Team</p>
            </div>
          </body>
        </html>
      `,
    })
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`
    console.log('[Email] Password reset URL:', resetUrl)
    
    return this.send({
      to,
      subject: 'Reset Your NepVerse Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Password Reset</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>You requested to reset your password for your NepVerse account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
              <p>The NepVerse Team</p>
            </div>
          </body>
        </html>
      `,
    })
  }

  async sendEmailVerificationEmail(to: string, verificationToken: string): Promise<boolean> {
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`
    
    return this.send({
      to,
      subject: 'Verify Your NepVerse Email',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Verify Your Email</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
              <p>Thank you for signing up for NepVerse!</p>
              <p>Please verify your email address by clicking the button below:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" style="background: #e50914; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>The NepVerse Team</p>
            </div>
          </body>
        </html>
      `,
    })
  }
}

export const emailService = new EmailService()


