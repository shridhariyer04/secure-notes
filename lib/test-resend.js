import { config } from 'dotenv';
import path from 'path';
import { Resend } from 'resend';

// Log the resolved path to .env
console.log('Looking for .env at:', path.resolve('.env'));

// Load environment variables from .env
config({ path: '.env' });

// Log the API key to verify it's loaded
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  try {
    const data = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'iyershridhar04@gmail.com', // Use your email address
      subject: 'Test Email from Secue-Notes',
      html: '<p>This is a test email from your Secue-Notes app!</p>',
    });
    console.log('Email sent successfully:', data);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

testEmail();