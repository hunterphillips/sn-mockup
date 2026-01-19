import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface NowAssistTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the popup is currently open */
  isOpen?: boolean;
}

/**
 * Sparkle icon button that triggers Now Assist AI content generation
 */
export const NowAssistTrigger = forwardRef<
  HTMLButtonElement,
  NowAssistTriggerProps
>(({ isOpen, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      title="Write with Now Assist"
      className={cn(
        'inline-flex items-center justify-center',
        'w-7 h-7 rounded-full',
        'bg-sn-primary text-white',
        'hover:bg-sn-primary-hover',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sn-primary',
        'transition-colors',
        isOpen && 'bg-sn-primary-hover',
        className
      )}
      {...props}
    >
      <Sparkles className="w-4 h-4" />
    </button>
  );
});

NowAssistTrigger.displayName = 'NowAssistTrigger';
