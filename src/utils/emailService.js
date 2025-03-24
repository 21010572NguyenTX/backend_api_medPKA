const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  async sendEmail(options) {
    try {
      const { to, subject, html, text } = options;
      
      const mailOptions = {
        from: `"${process.env.SENDER_NAME}" <${process.env.SENDER_EMAIL}>`,
        to,
        subject,
        text,
        html
      };
      
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  // Gửi email xác thực
  async sendVerificationEmail(user, token) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Xác thực tài khoản MedCure</h2>
        <p>Xin chào ${user.username},</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại MedCure. Để hoàn tất quá trình đăng ký, vui lòng xác thực email của bạn bằng cách nhấp vào liên kết dưới đây:</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            Xác thực Email
          </a>
        </p>
        <p>Hoặc copy đường link dưới đây và dán vào trình duyệt:</p>
        <p>${verificationUrl}</p>
        <p>Liên kết này sẽ hết hạn sau 24 giờ.</p>
        <p>Nếu bạn không yêu cầu việc này, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ MedCure</p>
      </div>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject: 'Xác thực tài khoản MedCure',
      html
    });
  }
  
  // Gửi email đặt lại mật khẩu
  async sendPasswordResetEmail(user, token) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Đặt lại mật khẩu MedCure</h2>
        <p>Xin chào ${user.username},</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng nhấp vào liên kết dưới đây để đặt lại mật khẩu:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            Đặt lại mật khẩu
          </a>
        </p>
        <p>Hoặc copy đường link dưới đây và dán vào trình duyệt:</p>
        <p>${resetUrl}</p>
        <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
        <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        <p>Trân trọng,<br>Đội ngũ MedCure</p>
      </div>
    `;
    
    return await this.sendEmail({
      to: user.email,
      subject: 'Đặt lại mật khẩu MedCure',
      html
    });
  }
}

module.exports = new EmailService(); 