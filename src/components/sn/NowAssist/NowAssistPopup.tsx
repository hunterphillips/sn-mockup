import { useState, useRef, useEffect } from 'react';
import { Sparkles, X, ChevronDown, ThumbsUp, ThumbsDown } from 'lucide-react';
import { cn } from '../../../utils/cn';

/** Popup phase state */
export type NowAssistPhase = 'input' | 'loading' | 'result';

export interface NowAssistPopupProps {
  /** Current phase of the popup */
  phase: NowAssistPhase;
  /** Generated content to display (in result phase) */
  content: string;
  error?: string;
  onInsert: () => void;
  onRefine: (type: 'shorter' | 'more_detailed') => void;
  onClose: () => void;
  /** Called when user submits input or skips (in input phase) */
  onGenerate: (userInput?: string) => void;
  inputPlaceholder?: string;
  inputLabel?: string;
}

/**
 * Popup component displaying AI-generated content with actions
 */
export function NowAssistPopup({
  phase,
  content,
  error,
  onInsert,
  onRefine,
  onClose,
  onGenerate,
  inputPlaceholder = 'e.g., Focus on security requirements, use bullet points...',
  inputLabel = 'What would you like to include? (optional)',
}: NowAssistPopupProps) {
  const [refineOpen, setRefineOpen] = useState(false);
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [userInput, setUserInput] = useState('');
  const refineRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input field when in input phase
  useEffect(() => {
    if (phase === 'input' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase]);

  // Close refine dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        refineRef.current &&
        !refineRef.current.contains(event.target as Node)
      ) {
        setRefineOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerate = () => {
    onGenerate(userInput.trim() || undefined);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleGenerate();
    }
  };

  return (
    <div
      className={cn(
        'fixed bottom-60 left-1/2 transform -translate-x-1/2 z-50',
        'w-[840px] max-w-[calc(100vw-48px)]',
        'bg-white rounded-sn-lg shadow-sn-5 border border-sn-neutral-3',
        'flex flex-col',
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-sn-neutral-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-sn-primary" />
          <span className="text-sm font-medium text-sn-neutral-9">
            {phase === 'loading' ? 'Generating...' : 'Write with Now Assist'}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 hover:bg-sn-neutral-1 rounded transition-colors"
        >
          <X className="w-4 h-4 text-sn-neutral-6" />
        </button>
      </div>

      {/* Input Phase */}
      {phase === 'input' && (
        <>
          <div className="p-4">
            <label className="block text-sm text-sn-neutral-7 mb-2">
              {inputLabel}
            </label>
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={inputPlaceholder}
              rows={3}
              className={cn(
                'w-full px-3 py-2 text-sm',
                'border border-sn-neutral-4 rounded-sn',
                'focus:outline-none focus:border-sn-primary focus:ring-1 focus:ring-sn-primary',
                'placeholder:text-sn-neutral-5',
                'resize-none',
              )}
            />
            <p className="mt-1 text-xs text-sn-neutral-5">
              Press ⌘+Enter to generate
            </p>
          </div>
          <div className="flex items-center justify-end px-4 py-3 border-t border-sn-neutral-3">
            <button
              type="button"
              onClick={handleGenerate}
              className={cn(
                'px-4 py-1.5 text-sm font-medium',
                'bg-sn-primary text-white rounded-sn',
                'hover:bg-sn-primary-hover transition-colors',
              )}
            >
              Continue
            </button>
          </div>
        </>
      )}

      {/* Loading Phase */}
      {phase === 'loading' && (
        <div className="p-4 min-h-[120px] flex items-center justify-center">
          <span className="animate-spin h-6 w-6 border-2 border-sn-primary border-t-transparent rounded-full" />
        </div>
      )}

      {/* Result Phase */}
      {phase === 'result' && (
        <>
          {/* Content Area */}
          <div className="p-4 min-h-[120px] max-h-[300px] overflow-auto">
            {error ? (
              <div className="text-sm text-sn-critical">{error}</div>
            ) : (
              <div
                className="text-sm text-sn-neutral-8 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            )}
          </div>

          {/* Actions */}
          {!error && content && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-sn-neutral-3">
              <div className="flex items-center gap-2">
                {/* Refine Dropdown */}
                <div ref={refineRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setRefineOpen(!refineOpen)}
                    className={cn(
                      'inline-flex items-center gap-1 px-3 py-1.5 text-sm',
                      'text-sn-neutral-7 hover:text-sn-neutral-9',
                      'border border-sn-neutral-4 rounded-sn',
                      'hover:bg-sn-neutral-1 transition-colors',
                    )}
                  >
                    Refine
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {refineOpen && (
                    <div className="absolute left-0 bottom-full mb-1 w-40 bg-white rounded-sn shadow-sn-3 border border-sn-neutral-3 py-1 z-10">
                      <button
                        type="button"
                        onClick={() => {
                          onRefine('shorter');
                          setRefineOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-sn-neutral-8 hover:bg-sn-neutral-1"
                      >
                        Shorter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onRefine('more_detailed');
                          setRefineOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-sn-neutral-8 hover:bg-sn-neutral-1"
                      >
                        More detailed
                      </button>
                    </div>
                  )}
                </div>

                {/* Insert Button */}
                <button
                  type="button"
                  onClick={onInsert}
                  className={cn(
                    'inline-flex items-center px-4 py-1.5 text-sm font-medium',
                    'bg-sn-primary text-white rounded-sn',
                    'hover:bg-sn-primary-hover transition-colors',
                  )}
                >
                  Insert
                </button>
              </div>

              {/* Feedback */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === 'up' ? null : 'up')}
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    feedback === 'up'
                      ? 'bg-sn-success-light text-sn-success'
                      : 'hover:bg-sn-neutral-1 text-sn-neutral-5',
                  )}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFeedback(feedback === 'down' ? null : 'down')
                  }
                  className={cn(
                    'p-1.5 rounded transition-colors',
                    feedback === 'down'
                      ? 'bg-sn-critical-light text-sn-critical'
                      : 'hover:bg-sn-neutral-1 text-sn-neutral-5',
                  )}
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer Disclaimer */}
      <div className="px-4 py-2 border-t border-sn-neutral-2 bg-sn-neutral-1">
        <p className="text-xs text-sn-neutral-5">
          AI-generated content. Review before using.
        </p>
      </div>
    </div>
  );
}
