import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../../utils/cn';

export interface NowAssistTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the popup is currently open */
  isOpen?: boolean;
  /** Variant: 'default' for floating overlay, 'inline' for toolbar integration */
  variant?: 'default' | 'inline';
}

/**
 * Sparkle icon button that triggers Now Assist AI content generation
 */
export const NowAssistTrigger = forwardRef<
  HTMLButtonElement,
  NowAssistTriggerProps
>(({ isOpen, variant = 'default', className, ...props }, ref) => {
  const isInline = variant === 'inline';

  return (
    <button
      ref={ref}
      type="button"
      title="Write with Now Assist"
      className={cn(
        'inline-flex items-center justify-center',
        'transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-sn-primary',
        isInline
          ? [
              // Inline/toolbar style - subtle, matches toolbar buttons
              'p-1.5 rounded',
              'text-sn-neutral-6 hover:text-sn-primary hover:bg-sn-neutral-2',
              isOpen && 'text-sn-primary bg-sn-neutral-2',
            ]
          : [
              // Default floating style - more subtle than before
              'w-6 h-6 rounded-full',
              'bg-sn-neutral-3 text-sn-neutral-7',
              'hover:bg-sn-primary hover:text-white',
              isOpen && 'bg-sn-primary text-white',
            ],
        className
      )}
      {...props}
    >
      <Sparkles className={cn(isInline ? 'w-4 h-4' : 'w-3.5 h-3.5')} />
    </button>
  );
});

NowAssistTrigger.displayName = 'NowAssistTrigger';

