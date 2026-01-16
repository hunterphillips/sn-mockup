import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
} from 'lucide-react'
import { cn } from '../../../utils/cn'

export interface SNRichTextEditorProps {
  /** Current HTML content */
  value?: string
  /** Called when content changes */
  onChange?: (html: string) => void
  /** Disabled state */
  disabled?: boolean
  /** Error state */
  error?: boolean
  /** Full width editor */
  fullWidth?: boolean
  /** Number of visible rows (affects min-height) */
  rows?: number
  /** Additional class names */
  className?: string
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        'hover:bg-sn-neutral-2 disabled:opacity-50 disabled:cursor-not-allowed',
        isActive && 'bg-sn-neutral-2 text-sn-primary'
      )}
    >
      {children}
    </button>
  )
}

/**
 * ServiceNow-styled rich text editor using TipTap
 *
 * @example
 * <SNRichTextEditor
 *   value={html}
 *   onChange={setHtml}
 *   rows={6}
 *   placeholder="Enter acceptance criteria..."
 * />
 */
export function SNRichTextEditor({
  value = '',
  onChange,
  disabled = false,
  error = false,
  fullWidth = false,
  rows = 4,
  className,
}: SNRichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  // Sync value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Sync disabled state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled)
    }
  }, [disabled, editor])

  const minHeight = rows * 24 // ~24px per row

  return (
    <div
      className={cn(
        'border rounded-sn bg-white transition-colors',
        'focus-within:border-sn-primary focus-within:ring-1 focus-within:ring-sn-primary',
        error
          ? 'border-sn-critical focus-within:border-sn-critical focus-within:ring-sn-critical'
          : 'border-sn-neutral-4',
        disabled && 'bg-sn-neutral-1 cursor-not-allowed',
        fullWidth && 'w-full',
        className
      )}
    >
      {/* Toolbar */}
      <div
        className={cn(
          'flex items-center gap-0.5 px-2 py-1 border-b border-sn-neutral-3 bg-sn-neutral-1 rounded-t-sn',
          disabled && 'opacity-50'
        )}
      >
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={editor?.isActive('bold')}
          disabled={disabled}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={editor?.isActive('italic')}
          disabled={disabled}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          isActive={editor?.isActive('underline')}
          disabled={disabled}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-4 bg-sn-neutral-3 mx-1" />

        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={editor?.isActive('bulletList')}
          disabled={disabled}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={editor?.isActive('orderedList')}
          disabled={disabled}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Editor Content */}
      <EditorContent
        editor={editor}
        className={cn(
          'sn-rich-text-content',
          disabled && 'pointer-events-none'
        )}
        style={{ minHeight: `${minHeight}px` }}
      />
    </div>
  )
}
