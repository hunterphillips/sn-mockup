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
  AiAssistFieldConfig,
  ClarifyContextConfig,
} from '../../../types';
import { generateContent, clarifyContext } from '../../../api/nowAssist';
import { NowAssistTrigger } from './NowAssistTrigger';
import { NowAssistPopup, type NowAssistPhase } from './NowAssistPopup';

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

/** Get field-level AI config */
function getFieldAiConfig(field: FieldDefinition): AiAssistFieldConfig | null {
  if (!field.aiAssist) return null;
  if (field.aiAssist === true) return {};
  if (field.aiAssist.enabled === false) return null;
  return field.aiAssist;
}

/** Check if collectInput is enabled and get its config */
function getCollectInputConfig(aiConfig: AiAssistFieldConfig | null): {
  enabled: boolean;
  placeholder?: string;
  label?: string;
} {
  if (!aiConfig?.collectInput) return { enabled: false };
  if (aiConfig.collectInput === true) return { enabled: true };
  return {
    enabled: true,
    placeholder: aiConfig.collectInput.placeholder,
    label: aiConfig.collectInput.label,
  };
}

/** Check if clarifyContext is enabled and get its config */
function getClarifyContextConfig(aiConfig: AiAssistFieldConfig | null): ClarifyContextConfig | null {
  if (!aiConfig?.clarifyContext) return null;
  if (aiConfig.clarifyContext === true) return {};
  return aiConfig.clarifyContext;
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
  const [phase, setPhase] = useState<NowAssistPhase>('input');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [currentUserInput, setCurrentUserInput] = useState<string | undefined>();
  const [clarifyQuestions, setClarifyQuestions] = useState<string[]>([]);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const isRichText = field.type === 'richtext';
  const aiConfig = getFieldAiConfig(field);
  const collectInputConfig = getCollectInputConfig(aiConfig);
  const clarifyConfig = getClarifyContextConfig(aiConfig);

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

  // Handle trigger click - open popup
  const handleOpen = async () => {
    setIsOpen(true);
    setError(undefined);
    setContent('');
    setCurrentUserInput(undefined);
    setClarifyQuestions([]);

    // If clarifyContext is enabled, start by evaluating context
    if (clarifyConfig) {
      setPhase('loading');
      try {
        const clarifyResponse = await clarifyContext({
          field,
          tableDef,
          recordData: formData,
        });

        if (!clarifyResponse.sufficient && clarifyResponse.questions?.length) {
          setClarifyQuestions(clarifyResponse.questions);
          setPhase('clarify');
          return;
        }
      } catch (err) {
        console.error('Clarify context failed:', err);
        // Continue to normal flow on error
      }
    }

    // If collectInput is enabled, show input phase; otherwise generate immediately
    if (collectInputConfig.enabled) {
      setPhase('input');
    } else {
      setPhase('loading');
      doGenerate(undefined);
    }
  };

  // Generate content (called from input phase or directly)
  const doGenerate = async (userInput?: string) => {
    setPhase('loading');
    setCurrentUserInput(userInput);
    setError(undefined);

    try {
      const response = await generateContent({
        field,
        tableDef,
        recordData: formData,
        userInput,
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
      setPhase('result');
    }
  };

  // Handle generate from input phase
  const handleGenerate = (userInput?: string) => {
    doGenerate(userInput);
  };

  // Handle clarify submit - proceed with answers as additional context
  const handleClarifySubmit = (answers: string[]) => {
    // Format answers as additional user input
    const answersContext = clarifyQuestions
      .map((q, i) => answers[i] ? `Q: ${q}\nA: ${answers[i]}` : null)
      .filter(Boolean)
      .join('\n\n');
    
    if (collectInputConfig.enabled) {
      // Store answers and go to input phase for additional guidance
      setCurrentUserInput(answersContext);
      setPhase('input');
    } else {
      // Generate directly with answers as context
      doGenerate(answersContext);
    }
  };

  // Handle clarify skip - proceed without answers
  const handleClarifySkip = () => {
    if (collectInputConfig.enabled) {
      setPhase('input');
    } else {
      doGenerate(undefined);
    }
  };

  // Handle refinement
  const handleRefine = async (type: 'shorter' | 'more_detailed') => {
    setPhase('loading');
    setError(undefined);

    try {
      const response = await generateContent({
        field,
        tableDef,
        recordData: formData,
        refinement: type,
        userInput: currentUserInput,
      });

      if (response.error) {
        setError(response.error);
      } else {
        setContent(response.content);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine content');
    } finally {
      setPhase('result');
    }
  };

  // Handle insert
  const handleInsert = () => {
    onInsert(content);
    setIsOpen(false);
  };

  // Handle close
  const handleClose = () => {
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
              phase={phase}
              content={content}
              error={error}
              onInsert={handleInsert}
              onRefine={handleRefine}
              onClose={handleClose}
              onGenerate={handleGenerate}
              inputPlaceholder={collectInputConfig.placeholder}
              inputLabel={collectInputConfig.label}
              clarifyQuestions={clarifyQuestions}
              onClarifySubmit={handleClarifySubmit}
              onClarifySkip={handleClarifySkip}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}


