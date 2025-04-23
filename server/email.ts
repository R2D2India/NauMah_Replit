import sgMail from '@sendgrid/mail';

// Initialize SendGrid with the API key
if (!process.env.SENDGRID_API_KEY) {
  console.warn('SENDGRID_API_KEY not found. Email notifications will not be sent.');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// NAUMAH support email address for replies
export const NAUMAH_SUPPORT_EMAIL = 'asknaumah@gmail.com';
// SendGrid verified sender email
const SENDGRID_SENDER = 'info@sendgrid.net';

interface EmailOptions {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

/**
 * Send an email using SendGrid
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('Cannot send email: SENDGRID_API_KEY not found');
    return false;
  }
  
  try {
    await sgMail.send({
      to: options.to,
      from: options.from,
      subject: options.subject,
      text: options.text || (options.html ? options.html.replace(/<[^>]*>/g, '') : ''),
      html: options.html || '',
      replyTo: options.replyTo
    });
    
    return true;
  } catch (error: any) {
    console.error('Error sending email:', error);
    // Log additional details if available
    if (error && error.response && error.response.body) {
      console.error('SendGrid error details:', JSON.stringify(error.response.body));
    }
    return false;
  }
}

/**
 * Send a notification email when a new user joins the waitlist
 */
export async function sendWaitlistNotification(
  recipientEmail: string, 
  entry: { name: string; mobile: string; email: string }
): Promise<boolean> {
  const subject = 'New NauMah Waitlist Entry';
  const html = `
    <h1>New User Joined NauMah Waitlist</h1>
    <p>A new user has joined the waitlist for NauMah:</p>
    <ul>
      <li><strong>Name:</strong> ${entry.name}</li>
      <li><strong>Email:</strong> ${entry.email}</li>
      <li><strong>Mobile:</strong> ${entry.mobile}</li>
    </ul>
    <p>Time: ${new Date().toLocaleString()}</p>
  `;
  
  return sendEmail({
    to: recipientEmail,
    from: SENDGRID_SENDER,
    subject,
    html
  });
}

/**
 * Send a welcome email to a newly registered user
 */
export async function sendWelcomeEmail(
  user: { 
    email: string; 
    firstName?: string | null; 
    lastName?: string | null;
    username: string;
  }
): Promise<boolean> {
  const userName = user.firstName || user.username;
  const subject = 'Welcome to NauMah - Your Pregnancy Companion';
  
  // Create a beautiful and responsive HTML email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to NauMah</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #FF8080 0%, #FF4D4D 100%);
      color: white;
      padding: 30px;
      text-align: center;
      border-radius: 10px 10px 0 0;
    }
    .content {
      background-color: #ffffff;
      padding: 30px;
      border-left: 1px solid #eeeeee;
      border-right: 1px solid #eeeeee;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
      border-radius: 0 0 10px 10px;
      border: 1px solid #eeeeee;
    }
    h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
    }
    h2 {
      color: #FF4D4D;
      font-size: 22px;
    }
    .logo {
      margin-bottom: 20px;
      width: 120px;
      height: auto;
    }
    .btn {
      display: inline-block;
      background-color: #FF4D4D;
      color: white;
      text-decoration: none;
      padding: 12px 25px;
      border-radius: 25px;
      margin: 20px 0;
      font-weight: bold;
      text-align: center;
    }
    .features {
      margin: 30px 0;
    }
    .feature {
      margin-bottom: 15px;
      padding-left: 25px;
      position: relative;
    }
    .feature:before {
      content: "•";
      position: absolute;
      left: 0;
      color: #FF4D4D;
      font-size: 20px;
    }
    .social-links {
      margin-top: 20px;
    }
    .social-link {
      margin: 0 10px;
      text-decoration: none;
    }
    @media screen and (max-width: 480px) {
      .header, .content, .footer {
        padding: 15px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to NauMah!</h1>
    </div>
    <div class="content">
      <h2>Hi ${userName},</h2>
      <p>Thank you for joining NauMah, your dedicated pregnancy companion. We're excited to be part of your beautiful journey into motherhood.</p>
      
      <a href="https://naumah.com/dashboard" class="btn">Go to Your Dashboard</a>
      
      <h2>Here's what NauMah offers:</h2>
      <div class="features">
        <div class="feature">AI-powered assistance for all your pregnancy questions</div>
        <div class="feature">Advanced mood tracking to understand your emotional well-being</div>
        <div class="feature">Food and medication safety checker for peace of mind</div>
        <div class="feature">Personalized pregnancy journal to document your journey</div>
        <div class="feature">Weekly updates on your baby's development</div>
      </div>
      
      <p>We recommend starting with a quick tour of your dashboard to understand all the features available to you. You can also customize your profile and pregnancy details for a more personalized experience.</p>
      
      <p>If you have any questions or need assistance, please don't hesitate to reply to this email or reach out to our support team.</p>
      
      <p>Wishing you a healthy and joyful pregnancy journey,</p>
      <p><strong>The NauMah Team</strong></p>
    </div>
    <div class="footer">
      <p>This email was sent to ${user.email}</p>
      <p>&copy; ${new Date().getFullYear()} NauMah. All rights reserved.</p>
      <p>For assistance, contact us at <a href="mailto:${NAUMAH_SUPPORT_EMAIL}">${NAUMAH_SUPPORT_EMAIL}</a></p>
    </div>
  </div>
</body>
</html>
  `;
  
  return sendEmail({
    to: user.email,
    from: SENDGRID_SENDER,
    replyTo: NAUMAH_SUPPORT_EMAIL,
    subject,
    html
  });
}