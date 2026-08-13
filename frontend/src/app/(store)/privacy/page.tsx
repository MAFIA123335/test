import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="container py-16 max-w-3xl mx-auto prose dark:prose-invert">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: January 2025</p>
      <h2>1. Information We Collect</h2>
      <p>We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support. This includes your name, email address, phone number, shipping address, and payment information.</p>
      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to process orders, send order confirmations and updates, provide customer support, send promotional communications (with your consent), and improve our services.</p>
      <h2>3. Information Sharing</h2>
      <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as necessary to fulfill your orders or as required by law.</p>
      <h2>4. Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
      <h2>5. Cookies</h2>
      <p>We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie settings through your browser preferences.</p>
      <h2>6. Your Rights</h2>
      <p>You have the right to access, correct, or delete your personal information. Contact us at privacy@beautycenter.com to exercise these rights.</p>
      <h2>7. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, please contact us at privacy@beautycenter.com.</p>
    </div>
  );
}
