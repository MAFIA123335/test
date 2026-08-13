import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  center?: boolean;
  className?: string;
}

export function SectionHeader({ title, subtitle, href, linkLabel, center, className }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4 mb-8', center && 'flex-col items-center text-center', className)}>
      <div>
        {subtitle && <p className="text-sm font-medium text-primary uppercase tracking-widest mb-1">{subtitle}</p>}
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
      </div>
      {href && linkLabel && (
        <Link
          href={href}
          className="flex items-center gap-1 text-sm font-medium text-primary hover:gap-2 transition-all shrink-0"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
