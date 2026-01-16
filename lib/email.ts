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
    // Remove quotes if present and ensure proper format
    const envFrom = process.env.EMAIL_FROM?.trim().replace(/^["']|["']$/g, '') || 'NepVerse <onboarding@resend.dev>'
    this.fromEmail = envFrom.includes('@') ? envFrom : 'NepVerse <onboarding@resend.dev>'
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
      let fromEmail = options.from || this.fromEmail
      
      // Ensure FROM email has proper format
      if (!fromEmail.includes('@')) {
        console.error('[Email] ⚠️ Invalid FROM email format:', fromEmail)
        fromEmail = 'NepVerse <onboarding@resend.dev>'
        console.error('[Email] ⚠️ Using fallback:', fromEmail)
      }
      
      console.log('[Email] Sending via Resend:')
      console.log('[Email]   To:', toEmail)
      console.log('[Email]   From:', fromEmail)
      console.log('[Email]   Subject:', options.subject)
      
      // Warn about resend.dev domain restriction
      if (fromEmail.includes('@resend.dev')) {
        console.warn('[Email] ⚠️ Using resend.dev test domain - can only send to your verified account email')
        console.warn('[Email] 💡 For production, verify your own domain in Resend dashboard')
      }

      const result = await resend.emails.send({
        from: fromEmail,
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || options.subject,
      })

      if (result.error) {
        console.error('[Email] ❌ Resend API error:', JSON.stringify(result.error, null, 2))
        console.error('[Email] Error details:', result.error.message || result.error)
        console.error('[Email] Error type:', result.error.name || 'Unknown')
        
        // Provide helpful error messages
        if (result.error.message?.includes('domain') || result.error.message?.includes('verify') || result.error.message?.includes('testing domain restriction')) {
          console.error('[Email] ⚠️ DOMAIN RESTRICTION DETECTED')
          console.error('[Email] 💡 The resend.dev domain can only send to your verified account email')
          console.error('[Email] 💡 Solutions:')
          console.error('[Email]    1. Verify your own domain in Resend dashboard (recommended for production)')
          console.error('[Email]    2. For testing, only send to your Resend account email address')
          console.error('[Email]    3. Update EMAIL_FROM in .env to use your verified domain')
          console.error('[Email] 💡 See: https://resend.com/docs/dashboard/domains/introduction')
        }
        if (result.error.message?.includes('rate limit') || result.error.message?.includes('quota')) {
          console.error('[Email] 💡 TIP: You may have hit Resend rate limits. Check your dashboard.')
        }
        return false
      }

      console.log('[Email] ✅ Email sent successfully!')
      console.log('[Email]   Message ID:', result.data?.id)
      console.log('[Email]   To:', toEmail)
      console.log('[Email]   From:', fromEmail)
      console.log('[Email] 💡 TIP: If email not received, check:')
      console.log('[Email]   1. Spam/junk folder')
      console.log('[Email]   2. Resend dashboard for delivery status')
      console.log('[Email]   3. Verify sender domain in Resend dashboard')
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
    const browseUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/browse`
    const textVersion = `Hi ${name},

Thank you for joining NepVerse - The Home of Nepali Stories!

You now have access to unlimited Nepali movies, series, and originals.

Start watching: ${browseUrl}

Happy streaming!

The NepVerse Team`
    
    return this.send({
      to,
      subject: 'Welcome to NepVerse!',
      text: textVersion,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Welcome to NepVerse!</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to NepVerse!</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="background: #f9f9f9; padding: 30px;">
                        <p style="margin: 0 0 15px 0; font-size: 16px;">Hi ${name},</p>
                        <p style="margin: 0 0 15px 0; font-size: 16px;">Thank you for joining NepVerse - The Home of Nepali Stories!</p>
                        <p style="margin: 0 0 30px 0; font-size: 16px;">You now have access to unlimited Nepali movies, series, and originals.</p>
                        <!-- Button -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" style="background: #e50914; border-radius: 5px;">
                                    <a href="${browseUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 5px;">Start Watching</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 30px 0 15px 0; font-size: 16px;">Happy streaming!</p>
                        <p style="margin: 0; font-size: 16px;">The NepVerse Team</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    // Ensure URL is properly encoded
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`
    console.log('[Email] Password reset URL:', resetUrl)
    
    // Plain text version for better deliverability
    const textVersion = `Hello,

You requested to reset your password for your NepVerse account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email. Your account is secure.

Best regards,
The NepVerse Team`
    
    return this.send({
      to,
      subject: 'Reset Your NepVerse Password',
      text: textVersion,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Reset Your NepVerse Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Password Reset Request</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="background: #f9f9f9; padding: 30px;">
                        <p style="margin: 0 0 15px 0; font-size: 16px;">Hello,</p>
                        <p style="margin: 0 0 15px 0; font-size: 16px;">You requested to reset your password for your NepVerse account.</p>
                        <p style="margin: 0 0 30px 0; font-size: 16px;">Click the button below to reset your password:</p>
                        <!-- Button -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" style="background: #e50914; border-radius: 5px;">
                                    <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 5px;">Reset Password</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 20px 0 15px 0; font-size: 16px;">Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666666; background: #ffffff; padding: 10px; border-radius: 5px; border: 1px solid #dddddd; font-family: monospace; font-size: 12px; margin: 0 0 20px 0;">${resetUrl}</p>
                        <p style="margin: 0 0 20px 0; font-size: 16px;"><strong>This link will expire in 1 hour.</strong></p>
                        <p style="color: #666666; font-size: 14px; margin: 0 0 20px 0;">If you didn't request this password reset, please ignore this email. Your account is secure.</p>
                        <p style="margin: 0; font-size: 16px;">Best regards,<br>The NepVerse Team</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })
  }

  async sendEmailVerificationEmail(to: string, verificationToken: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(verificationToken)}`
    
    const textVersion = `Thank you for signing up for NepVerse!

Please verify your email address by clicking this link:
${verifyUrl}

This link will expire in 24 hours.

The NepVerse Team`
    
    return this.send({
      to,
      subject: 'Verify Your NepVerse Email',
      text: textVersion,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Verify Your NepVerse Email</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="background: #f9f9f9; padding: 30px;">
                        <p style="margin: 0 0 15px 0; font-size: 16px;">Thank you for signing up for NepVerse!</p>
                        <p style="margin: 0 0 30px 0; font-size: 16px;">Please verify your email address by clicking the button below:</p>
                        <!-- Button -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" style="background: #e50914; border-radius: 5px;">
                                    <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 5px;">Verify Email</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        <p style="margin: 20px 0 15px 0; font-size: 16px;">Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #666666; background: #ffffff; padding: 10px; border-radius: 5px; border: 1px solid #dddddd; font-family: monospace; font-size: 12px; margin: 0 0 20px 0;">${verifyUrl}</p>
                        <p style="margin: 0 0 20px 0; font-size: 16px;"><strong>This link will expire in 24 hours.</strong></p>
                        <p style="margin: 0; font-size: 16px;">The NepVerse Team</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })
  }

  async sendNewMovieNotificationEmail(to: string, name: string, movie: { title: string; titleNepali?: string | null; posterUrl: string; id: string; description: string }): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const movieUrl = `${baseUrl}/movie/${movie.id}`
    const posterUrl = movie.posterUrl.startsWith('http') ? movie.posterUrl : `${baseUrl}${movie.posterUrl}`
    
    const textVersion = `Hi ${name},

🎬 New Movie on NepVerse!

${movie.title}${movie.titleNepali ? ` (${movie.titleNepali})` : ''} is now available to watch!

${movie.description.substring(0, 150)}${movie.description.length > 150 ? '...' : ''}

Watch now: ${movieUrl}

Happy streaming!
The NepVerse Team`
    
    return this.send({
      to,
      subject: `🎬 New Movie: ${movie.title}`,
      text: textVersion,
      html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>New Movie: ${movie.title}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4; padding: 20px;">
              <tr>
                <td align="center">
                  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #e50914 0%, #b20710 100%); padding: 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">🎬 New Movie Available!</h1>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="background: #f9f9f9; padding: 30px;">
                        <p style="margin: 0 0 20px 0; font-size: 16px;">Hi ${name},</p>
                        <p style="margin: 0 0 30px 0; font-size: 18px; font-weight: bold; color: #e50914;">${movie.title}${movie.titleNepali ? ` (${movie.titleNepali})` : ''} is now available!</p>
                        
                        <!-- Movie Poster -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0;">
                          <tr>
                            <td align="center">
                              <a href="${movieUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block;">
                                <img src="${posterUrl}" alt="${movie.title}" style="max-width: 300px; width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);" />
                              </a>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 20px 0; font-size: 16px; color: #666666;">${movie.description.substring(0, 200)}${movie.description.length > 200 ? '...' : ''}</p>
                        
                        <!-- Button -->
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                          <tr>
                            <td align="center">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td align="center" style="background: #e50914; border-radius: 5px;">
                                    <a href="${movieUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 5px;">Watch Now</a>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                        
                        <p style="margin: 30px 0 15px 0; font-size: 16px;">Happy streaming!</p>
                        <p style="margin: 0; font-size: 16px;">The NepVerse Team</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    })
  }
}

export const emailService = new EmailService()


