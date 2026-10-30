const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send email utility
 * @param {Object} options - { email, subject, html, text }
 */
const sendEmail = async (options) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.text || '',
    html: options.html || '',
  };

  await transporter.sendMail(mailOptions);
};

// Email templates
const emailTemplates = {
  welcome: (name) => ({
    subject: `Welcome to EcommerceApp, ${name}! 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
        <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 8px; margin-bottom: 25px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🛒 EcommerceApp</h1>
        </div>
        <h2 style="color: #333;">Welcome, ${name}!</h2>
        <p style="color: #666; line-height: 1.6;">Thank you for joining us. Start exploring our amazing products and enjoy exclusive deals!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/products" style="background: #667eea; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold;">Start Shopping →</a>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center;">© 2024 EcommerceApp. All rights reserved.</p>
      </div>
    `,
  }),

  passwordReset: (name, resetUrl) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #666;">Hi ${name},</p>
        <p style="color: #666; line-height: 1.6;">You requested to reset your password. Click the button below to set a new password. This link is valid for <strong>15 minutes</strong>.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #e74c3c; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; font-weight: bold;">Reset Password</a>
        </div>
        <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email. Your password is safe.</p>
      </div>
    `,
  }),

  orderConfirmation: (name, order) => ({
    subject: `Order Confirmed! #${order._id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
        <h2 style="color: #27ae60;">✅ Order Confirmed!</h2>
        <p style="color: #666;">Hi ${name}, your order has been confirmed!</p>
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Order ID:</strong> #${order._id}</p>
          <p><strong>Total:</strong> ₹${order.totalPrice}</p>
          <p><strong>Status:</strong> ${order.orderStatus}</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, emailTemplates };
