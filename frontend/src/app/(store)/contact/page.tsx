import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Contact Us' };

export default function ContactPage() {
  return (
    <div className="container py-16 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-muted-foreground mb-10">Have a question or need help? We'd love to hear from you.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="p-4 rounded-xl border bg-card">
            <p className="font-medium mb-1">Email</p>
            <p className="text-sm text-muted-foreground">support@beautycenter.com</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="font-medium mb-1">Phone</p>
            <p className="text-sm text-muted-foreground">+1 (555) 123-4567</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="font-medium mb-1">Address</p>
            <p className="text-sm text-muted-foreground">123 Luxury Avenue, Beauty City</p>
          </div>
          <div className="p-4 rounded-xl border bg-card">
            <p className="font-medium mb-1">Hours</p>
            <p className="text-sm text-muted-foreground">Mon–Fri: 9am–6pm</p>
            <p className="text-sm text-muted-foreground">Sat–Sun: 10am–4pm</p>
          </div>
        </div>
        <div className="p-6 rounded-2xl border bg-card space-y-4">
          <h2 className="font-semibold">Send a Message</h2>
          <input className="w-full border rounded-xl px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Your name" />
          <input className="w-full border rounded-xl px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Your email" type="email" />
          <input className="w-full border rounded-xl px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Subject" />
          <textarea className="w-full border rounded-xl px-4 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]" placeholder="Your message" />
          <button className="w-full bg-primary text-primary-foreground rounded-full py-2.5 text-sm font-medium hover:opacity-90 transition-opacity">
            Send Message
          </button>
        </div>
      </div>
    </div>
  );
}
