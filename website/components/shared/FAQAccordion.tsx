import { Icon } from '@/components/shared/Icon';
import { cn } from '@/lib/utils';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQAccordionProps {
  items: FAQItem[];
  dark?: boolean;
  className?: string;
}

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  return (
    <div className={cn('w-full max-w-[800px] mx-auto space-y-3', className)}>
      {items.map((item, index) => (
        <details
          key={index}
          className="group rounded-2xl transition-all duration-200 overflow-hidden border bg-white border-slate-200/80 shadow-xs hover:border-brand-blue/30 open:border-brand-blue/40 [&_summary::-webkit-details-marker]:hidden"
        >
          <summary className="w-full flex items-center justify-between p-5 sm:p-6 text-left list-none cursor-pointer select-none">
            <div className="flex items-center gap-3 pr-4">
              <Icon name="help-circle" className="w-5 h-5 text-brand-blue flex-shrink-0" />
              <span className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-brand-blue transition-colors">
                {item.question}
              </span>
            </div>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 bg-slate-100 text-slate-600 group-hover:bg-slate-200 group-open:rotate-180 group-open:bg-brand-blue group-open:text-white">
              <Icon name="chevron-down" className="w-4 h-4" />
            </div>
          </summary>
          <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-xs sm:text-sm leading-relaxed border-t text-[var(--text-secondary)] border-slate-100">
            <p className="pt-4">{item.answer}</p>
          </div>
        </details>
      ))}
    </div>
  );
}
