// Test script for sending an email directly using SendGrid
import sgMail from '@sendgrid/mail';
import { createInterface } from 'readline';

// Get API key from environment variable
const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey) {
  console.error('Error: SENDGRID_API_KEY environment variable not found');
  process.exit(1);
}

console.log('Using SendGrid API Key:', apiKey.substring(0, 5) + '...');
sgMail.setApiKey(apiKey);

// NAUMAH support email
const NAUMAH_SUPPORT_EMAIL = 'asknaumah@gmail.com';
// SendGrid verified sender email
const SENDGRID_SENDER = 'info@sendgrid.net';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter test recipient email: ', async (recipientEmail) => {
  console.log(`Sending test email to: ${recipientEmail}`);
  
  try {
    // Try sending with verified email
    const msg = {
      to: recipientEmail,
      from: NAUMAH_SUPPORT_EMAIL, // Use verified sender email
      subject: 'NauMah Test Email',
      text: 'This is a test email from NauMah.',
      html: '<strong>This is a test email from NauMah.</strong>',
    };

    console.log('Sending email with the following configuration:');
    console.log(JSON.stringify(msg, null, 2));
    
    const response = await sgMail.send(msg);
    console.log('Email sent successfully!');
    console.log('SendGrid Response:', response);
    
  } catch (error) {
    console.error('Error sending email:');
    console.error(error);
    
    if (error.response) {
      console.error('SendGrid error details:');
      console.error(JSON.stringify(error.response.body, null, 2));
    }
  }
  
  rl.close();
});