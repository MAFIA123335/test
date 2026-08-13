import { Metadata } from 'next';
import { Sparkles, Heart, Award, Users } from 'lucide-react';

export const metadata: Metadata = { title: 'About Us' };

export default function AboutPage() {
  const values = [
    { icon: Sparkles, title: 'Premium Quality', desc: 'We source only the finest beauty products from trusted brands worldwide.' },
    { icon: Heart, title: 'Customer First', desc: 'Your satisfaction is our top priority. We go above and beyond for every customer.' },
    { icon: Award, title: 'Authenticity', desc: '100% authentic products, guaranteed. No counterfeits, ever.' },
    { icon: Users, title: 'Community', desc: 'Building a community of beauty lovers who inspire and support each other.' },
  ];

  return (
    <div className="container py-16 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold">About <span className="text-gradient">Beauty Center</span></h1>
        <p className="text-lg text-muted-foreground">
          We are a luxury beauty destination dedicated to bringing you the world's finest skincare, makeup, and fragrance products.
          Founded with a passion for beauty and a commitment to excellence.
        </p>
      </div>

      {/* Story */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">Our Story</h2>
          <p className="text-muted-foreground leading-relaxed">
            Beauty Center was born from a simple belief: every person deserves access to premium beauty products that make them feel confident and radiant.
            What started as a small boutique has grown into a trusted destination for beauty enthusiasts across the region.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We carefully curate our collection, partnering with the world's most prestigious beauty brands to bring you an unparalleled selection of skincare, makeup, fragrance, and hair care products.
          </p>
        </div>
        <div className="aspect-square rounded-2xl bg-gradient-luxury flex items-center justify-center">
          <Sparkles className="w-24 h-24 text-pink-400" />
        </div>
      </div>

      {/* Values */}
      <div>
        <h2 className="text-3xl font-bold text-center mb-10">Our Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="text-center p-6 rounded-2xl border bg-card space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
