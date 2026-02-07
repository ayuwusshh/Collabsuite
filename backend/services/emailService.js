import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();
// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send password reset email
export const sendPasswordResetEmail = async (email, resetToken) => {
    console.log('🔄 Attempting to send password reset email to:', email);
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request - CollabSuite',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p>We received a request to reset your password for your CollabSuite account.</p>
                        <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Reset Password</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
                        <p><strong>If you didn't request this password reset, please ignore this email.</strong></p>
                        <p>Your password will remain unchanged.</p>
                        <p>Best regards,<br>The CollabSuite Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Password reset email sent to:', email);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send password reset email');
    }
};

// Send group invitation email
export const sendGroupInvitationEmail = async (email, inviterName, groupName, conversationId) => {
    console.log('🔄 Attempting to send group invitation email to:', email);
    const inviteUrl = `${process.env.CLIENT_URL}/dashboard/chat?join=${conversationId}`;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `${inviterName} invited you to join ${groupName} - CollabSuite`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>💬 You've Been Invited!</h1>
                    </div>
                    <div class="content">
                        <p>Hello,</p>
                        <p><strong>${inviterName}</strong> has invited you to join <strong>${groupName}</strong> on CollabSuite.</p>
                        <p>Click the button below to accept the invitation and start chatting:</p>
                        <div style="text-align: center;">
                            <a href="${inviteUrl}" class="button">Join Group Chat</a>
                        </div>
                        <p>Or copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; color: #667eea;">${inviteUrl}</p>
                        <p><strong>Don't have an account?</strong> You'll be able to create one when you click the link.</p>
                        <p>Best regards,<br>The CollabSuite Team</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Group invitation email sent to:', email);
        return true;
    } catch (error) {
        console.error('❌ Error sending group invitation email:', error);
        throw new Error('Failed to send group invitation email');
    }
};

export default { sendPasswordResetEmail, sendGroupInvitationEmail };
