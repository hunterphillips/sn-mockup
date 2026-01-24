import {
  useState,
  useRef,
  useEffect,
  cloneElement,
  isValidElement,
  type ReactNode,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import type {
  FieldDefinition,
  SNRecord,
  TableDefinition,
} from '../../../types';
import { generateContent } from '../../../api/nowAssist';
import { NowAssistTrigger } from './NowAssistTrigger';
import { NowAssistPopup } from './NowAssistPopup';

export interface NowAssistFieldWrapperProps {
  /** The field definition */
  field: FieldDefinition;
  /** Table definition for context */
  tableDef: TableDefinition;
  /** Current form data for context */
  formData: Partial<SNRecord>;
  /** Called when user inserts generated content */
  onInsert: (content: string) => void;
  /** The wrapped field component */
  children: ReactNode;
}

/**
 * Wraps a text/richtext field to add Now Assist AI capability
 */
export function NowAssistFieldWrapper({
  field,
  tableDef,
  formData,
  onInsert,
  children,
}: NowAssistFieldWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | undefined>();
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isRichText = field.type === 'richtext';

  // Close popup on click outside or escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = triggerRef.current?.contains(target);
      const clickedPopup = popupRef.current?.contains(target);

      if (!clickedTrigger && !clickedPopup) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Generate content when popup opens
  const handleOpen = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await generateContent({
        field,
        tableDef,
        recordData: formData,
      });

      if (response.error) {
        setError(response.error);
      } else {
        setContent(response.content);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate content',
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle refinement
  const handleRefine = async (type: 'shorter' | 'more_detailed') => {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await generateContent({
        field,
        tableDef,
        recordData: formData,
        refinement: type,
      });

      if (response.error) {
        setError(response.error);
      } else {
        setContent(response.content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine content');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle insert
  const handleInsert = () => {
    onInsert(content);
    setIsOpen(false);
  };

  // The trigger button element
  const triggerButton = (
    <NowAssistTrigger
      isOpen={isOpen}
      onClick={handleOpen}
      variant={isRichText ? 'inline' : 'default'}
    />
  );

  // For richtext fields, inject trigger into toolbar via cloneElement
  const renderChildren = () => {
    if (isRichText && isValidElement(children)) {
      return cloneElement(children as ReactElement<{ toolbarActions?: ReactNode }>, {
        toolbarActions: <div ref={triggerRef}>{triggerButton}</div>,
      });
    }
    return children;
  };

  return (
    <div className="relative">
      {/* For non-richtext fields, show floating trigger at top-right */}
      {!isRichText && (
        <div ref={triggerRef} className="absolute -top-1 -right-1 z-10">
          {triggerButton}
        </div>
      )}

      {/* The wrapped field (possibly with injected toolbarActions) */}
      {renderChildren()}

      {/* Popup rendered via portal to body */}
      {isOpen &&
        createPortal(
          <div ref={popupRef}>
            <NowAssistPopup
              isLoading={isLoading}
              content={content}
              error={error}
              onInsert={handleInsert}
              onRefine={handleRefine}
              onClose={() => setIsOpen(false)}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}

