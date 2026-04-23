import nodemailer from 'nodemailer';
import config from '../config/env.js';

/**
 * Email Service - Sends emails via Gmail or SMTP
 */
export class EmailService {
  static transporter = null;

  /**
   * Initialize email transporter based on config
   */
  static initialize() {
    if (this.transporter) return this.transporter;

    const emailProvider = config.EMAIL_PROVIDER || 'gmail';

    if (emailProvider === 'gmail') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASSWORD,
        },
      });
    } else if (emailProvider === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT || 587,
        secure: config.SMTP_SECURE || false,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASSWORD,
        },
      });
    } else if (emailProvider === 'sendgrid') {
      // SendGrid works perfectly via standard SMTP
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        auth: {
          user: 'apikey',
          pass: config.SENDGRID_API_KEY,
        },
      });
    }

    return this.transporter;
  }

  /**
   * Send OTP email for account verification
   * @param {string} email - Recipient email
   * @param {string} otp - 6-digit OTP
   * @param {string} name - User name
   */
  static async sendOtpEmail(email, otp, name = 'User') {
    try {
      const transporter = this.initialize();

      if (!transporter) {
        console.warn('⚠️  Email service not configured. OTP not sent.');
        return { success: false, message: 'Email service not configured' };
      }

      const mailOptions = {
        from: config.EMAIL_FROM || config.EMAIL_USER,
        to: email,
        subject: '✉️ Verify Your Email - Intent Marketplace',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
                .header { text-align: center; color: #2d5016; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { color: #333; line-height: 1.6; }
                .otp-box { 
                  background-color: #E5EEE4; 
                  padding: 20px; 
                  border-radius: 8px; 
                  text-align: center; 
                  margin: 30px 0;
                }
                .otp-code { 
                  font-size: 36px; 
                  font-weight: bold; 
                  color: #2d5016; 
                  letter-spacing: 8px;
                  font-family: monospace;
                }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
                .warning { color: #d9534f; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Welcome to Intent!</h1>
                  <p>Email Verification</p>
                </div>

                <div class="content">
                  <p>Hi <strong>${name}</strong>,</p>
                  
                  <p>Thank you for signing up! To complete your registration, please verify your email address using the code below:</p>

                  <div class="otp-box">
                    <p style="margin: 0; color: #666; font-size: 12px; margin-bottom: 10px;">Your Verification Code</p>
                    <div class="otp-code">${otp}</div>
                  </div>

                  <p><strong>How to use:</strong></p>
                  <ol>
                    <li>Go to the verification page</li>
                    <li>Enter the 6-digit code above</li>
                    <li>Click "Verify OTP"</li>
                  </ol>

                  <p><strong class="warning">⏰ Important:</strong> This code expires in <strong>5 minutes</strong>. If you didn't request this code, please ignore this email.</p>

                  <p>If you have any questions, feel free to contact our support team.</p>

                  <p>Best regards,<br><strong>The Intent Team</strong></p>
                </div>

                <div class="footer">
                  <p>This is an automated email. Please do not reply to this message.</p>
                  <p>&copy; 2026 Intent Marketplace. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send OTP email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} otp - 6-digit OTP
   * @param {string} name - User name
   */
  static async sendPasswordResetEmail(email, otp, name = 'User') {
    try {
      const transporter = this.initialize();

      if (!transporter) {
        console.warn('⚠️  Email service not configured. Reset email not sent.');
        return { success: false, message: 'Email service not configured' };
      }

      const resetLink = `${config.FRONTEND_URL}/reset-password?email=${encodeURIComponent(email)}`;

      const mailOptions = {
        from: config.EMAIL_FROM || config.EMAIL_USER,
        to: email,
        subject: '🔐 Reset Your Password - Intent Marketplace',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
                .header { text-align: center; color: #2d5016; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { color: #333; line-height: 1.6; }
                .otp-box { 
                  background-color: #E5EEE4; 
                  padding: 20px; 
                  border-radius: 8px; 
                  text-align: center; 
                  margin: 30px 0;
                }
                .otp-code { 
                  font-size: 36px; 
                  font-weight: bold; 
                  color: #2d5016; 
                  letter-spacing: 8px;
                  font-family: monospace;
                }
                .cta-button {
                  display: inline-block;
                  background-color: #2d5016;
                  color: white;
                  padding: 12px 30px;
                  text-decoration: none;
                  border-radius: 6px;
                  margin: 20px 0;
                  font-weight: bold;
                }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
                .warning { color: #d9534f; font-weight: bold; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🔐 Password Reset</h1>
                  <p>We received a request to reset your password</p>
                </div>

                <div class="content">
                  <p>Hi <strong>${name}</strong>,</p>
                  
                  <p>We received a request to reset your password. To complete this process, please use the verification code below:</p>

                  <div class="otp-box">
                    <p style="margin: 0; color: #666; font-size: 12px; margin-bottom: 10px;">Your Reset Code</p>
                    <div class="otp-code">${otp}</div>
                  </div>

                  <p><strong>How to reset your password:</strong></p>
                  <ol>
                    <li>Click the button below or go to the reset page</li>
                    <li>Enter the 6-digit code above</li>
                    <li>Create a new password</li>
                    <li>Click "Reset Password"</li>
                  </ol>

                  <div style="text-align: center;">
                    <a href="${resetLink}" class="cta-button">Reset Password</a>
                  </div>

                  <p><strong class="warning">⏰ Important:</strong> This code expires in <strong>5 minutes</strong>.</p>

                  <p><span class="warning">🚨 Didn't request this?</span> If you didn't request a password reset, please ignore this email. Your account is secure.</p>

                  <p>Best regards,<br><strong>The Intent Team</strong></p>
                </div>

                <div class="footer">
                  <p>This is an automated email. Please do not reply to this message.</p>
                  <p>&copy; 2026 Intent Marketplace. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Password reset email sent to ${email}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email after account verification
   * @param {string} email - Recipient email
   * @param {string} name - User name
   */
  static async sendWelcomeEmail(email, name = 'User') {
    try {
      const transporter = this.initialize();

      if (!transporter) {
        console.warn('⚠️  Email service not configured. Welcome email not sent.');
        return { success: false, message: 'Email service not configured' };
      }

      const mailOptions = {
        from: config.EMAIL_FROM || config.EMAIL_USER,
        to: email,
        subject: '👋 Welcome Aboard - Intent Marketplace',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
                .header { text-align: center; color: #2d5016; margin-bottom: 30px; }
                .header h1 { margin: 0; font-size: 28px; }
                .content { color: #333; line-height: 1.6; }
                .feature { margin: 15px 0; padding: 10px; background-color: #f9f9f9; border-left: 4px solid #2d5016; }
                .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Welcome to Intent!</h1>
                  <p>Your account is ready to use</p>
                </div>

                <div class="content">
                  <p>Hi <strong>${name}</strong>,</p>
                  
                  <p>Your email has been verified and your account is now active! You're all set to start exploring Intent Marketplace.</p>

                  <h3>What you can do now:</h3>
                  
                  <div class="feature">
                    <strong>🎯 Create Intents</strong>
                    <p>Post your skills, services, or projects to find collaborators.</p>
                  </div>

                  <div class="feature">
                    <strong>🔍 Explore Intents</strong>
                    <p>Browse and discover opportunities from other users.</p>
                  </div>

                  <div class="feature">
                    <strong>💬 Connect & Collaborate</strong>
                    <p>Message other users and build meaningful connections.</p>
                  </div>

                  <div class="feature">
                    <strong>⭐ Build Your Profile</strong>
                    <p>Complete your profile to showcase your skills and expertise.</p>
                  </div>

                  <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>

                  <p>Happy collaborating!<br><strong>The Intent Team</strong></p>
                </div>

                <div class="footer">
                  <p>This is an automated email. Please do not reply to this message.</p>
                  <p>&copy; 2026 Intent Marketplace. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${email}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;
