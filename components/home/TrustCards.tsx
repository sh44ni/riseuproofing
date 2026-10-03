import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/shared/Tooltip';

export interface TrustItem {
  title: string;
  subtitle: string;
  tooltipText: string;
  iconSrc: string;
  accentColor?: string;
}

export const TRUST_ITEMS: TrustItem[] = [
  {
    title: 'Licensed & Insured',
    subtitle: 'CA Lic #1096492',
    tooltipText: 'Active California State License Board Class B & C-39 License',
    iconSrc: '/badges/cslb.webp',
    accentColor: '#2F9FE3',
  },
  {
    title: 'Owens Corning',
    subtitle: 'Preferred Contractor',
    tooltipText: 'Factory certified for 50-year non-prorated manufacturer warranties',
    iconSrc: '/badges/owens_corning_icon_org.png',
    accentColor: '#F43F5E',
  },
  {
    title: '0% Financing',
    subtitle: 'From $149/mo',
    tooltipText: 'Flexible zero-down financing options with quick approval',
    iconSrc: '/badges/financing.webp',
    accentColor: '#EAA636',
  },
  {
    title: '25+ Years Exp.',
    subtitle: 'Trusted Since 2000',
    tooltipText: 'Over 1,000+ roofs installed across San Diego County',
    iconSrc: '/badges/experience.webp',
    accentColor: '#10B981',
  },
];

export function TrustCards({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'w-full bg-white/[0.04] backdrop-blur-xl border border-white/15 rounded-2xl p-2 sm:p-2.5 shadow-2xl shadow-black/40',
        className
      )}
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
        {TRUST_ITEMS.map((item, idx) => (
          <Tooltip key={idx} content={item.tooltipText} className="w-full">
            <div className="w-full group relative transition-all duration-200 hover:-translate-y-0.5 cursor-help">
              {/* Soft subtle glow on hover */}
              <div
                className="absolute inset-x-2 -bottom-1 h-5 rounded-full blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-200 pointer-events-none"
                style={{ background: item.accentColor || '#2F9FE3' }}
              />

              {/* Glass Card Body */}
              <div className="relative rounded-xl overflow-hidden p-2 flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.10] border border-white/10 hover:border-white/25 transition-all duration-200 text-left w-full">
                {/* Logo Badge Container */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center p-1 bg-white/95 border border-white/80 shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <Image
                    src={item.iconSrc}
                    alt={item.title}
                    width={36}
                    height={36}
                    className="w-full h-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Text info */}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[11px] sm:text-xs text-white leading-tight truncate">
                    {item.title}
                  </h4>
                  <p className="text-[9.5px] sm:text-[10px] font-medium text-white/70 leading-tight mt-0.5 truncate">
                    {item.subtitle}
                  </p>
                </div>

                {/* Bottom Accent Line */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[1.5px] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{ background: item.accentColor || '#2F9FE3' }}
                />
              </div>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}

