import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <div className="container py-16 max-w-3xl mx-auto prose dark:prose-invert">
      <h1>Terms of Service</h1>
      <p className="text-muted-foreground">Last updated: January 2025</p>
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using Beauty Center, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.</p>
      <h2>2. Use of Service</h2>
      <p>You may use our services only for lawful purposes and in accordance with these Terms. You agree not to use our services in any way that violates applicable laws or regulations.</p>
      <h2>3. Account Registration</h2>
      <p>To access certain features, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p>
      <h2>4. Orders and Payments</h2>
      <p>All orders are subject to availability and confirmation. We reserve the right to refuse or cancel any order. Prices are subject to change without notice.</p>
      <h2>5. Returns and Refunds</h2>
      <p>We accept returns within 14 days of delivery for unused, unopened products in their original packaging. Contact our support team to initiate a return.</p>
      <h2>6. Intellectual Property</h2>
      <p>All content on this website, including text, graphics, logos, and images, is the property of Beauty Center and is protected by applicable intellectual property laws.</p>
      <h2>7. Limitation of Liability</h2>
      <p>Beauty Center shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.</p>
      <h2>8. Contact</h2>
      <p>For questions about these Terms, contact us at legal@beautycenter.com.</p>
    </div>
  );
}
