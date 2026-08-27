'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  dark?: boolean;
  className?: string;
}

export function FAQAccordion({ items, dark = true, className }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className={cn('w-full max-w-[800px] mx-auto space-y-3', className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={cn(
              'rounded-2xl transition-all duration-200 overflow-hidden border',
              dark
                ? 'glass-card-interactive border-white/15'
                : 'bg-white border-slate-200 shadow-sm'
            )}
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full flex items-center justify-between p-5 sm:p-6 text-left group cursor-pointer"
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 pr-4">
                <HelpCircle className="w-5 h-5 text-brand-blue flex-shrink-0" />
                <span
                  className={cn(
                    'text-sm sm:text-base font-bold transition-colors',
                    dark ? 'text-white group-hover:text-brand-blue' : 'text-brand-navy group-hover:text-brand-blue'
                  )}
                >
                  {item.question}
                </span>
              </div>
              <div
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200',
                  dark ? 'bg-white/10 text-white group-hover:bg-brand-blue' : 'bg-slate-100 text-slate-600',
                  isOpen && 'rotate-180 bg-brand-blue text-white'
                )}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>
            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-200 ease-in-out',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <div
                  className={cn(
                    'px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm leading-relaxed border-t',
                    dark
                      ? 'text-white/80 border-white/10'
                      : 'text-slate-600 border-slate-100'
                  )}
                >
                  <p className="pt-4">{item.answer}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
