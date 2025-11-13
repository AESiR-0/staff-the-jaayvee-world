'use client';

import { useRef } from 'react';
import { Bold, Italic, Strikethrough, Type } from 'lucide-react';

interface WhatsAppRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

/**
 * WhatsApp Markdown Editor
 * Simple textarea with markdown syntax helpers
 * Preserves newlines and supports WhatsApp formatting:
 * - Bold: *text*
 * - Italic: _text_
 * - Strikethrough: ~text~
 */
export default function WhatsAppRichTextEditor({
  value,
  onChange,
  placeholder = 'Enter your message here. Use {name} as a placeholder for contact names.',
  rows = 6,
}: WhatsAppRichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (before: string, after: string = before) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    // If text is selected, wrap it
    // If no text selected, insert markers and place cursor between them
    const newText = selectedText
      ? `${beforeText}${before}${selectedText}${after}${afterText}`
      : `${beforeText}${before}${after}${afterText}`;

    onChange(newText);

    // Set cursor position after the inserted markdown
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = selectedText
          ? start + before.length + selectedText.length + after.length
          : start + before.length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-50 border border-primary-border rounded-lg">
        <button
          type="button"
          onClick={() => insertMarkdown('*')}
          className="p-2 rounded hover:bg-gray-200 transition-colors bg-white text-primary-fg"
          title="Bold: *text*"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('_')}
          className="p-2 rounded hover:bg-gray-200 transition-colors bg-white text-primary-fg"
          title="Italic: _text_"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown('~')}
          className="p-2 rounded hover:bg-gray-200 transition-colors bg-white text-primary-fg"
          title="Strikethrough: ~text~"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <div className="flex-1" />
        <div className="text-xs text-primary-muted flex items-center gap-1">
          <Type className="h-3 w-3" />
          <span>WhatsApp: *bold* _italic_ ~strikethrough~</span>
        </div>
      </div>

      {/* Textarea - preserves newlines natively */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          // Directly update - textarea preserves newlines automatically
          onChange(e.target.value);
        }}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-primary-border rounded-lg focus:ring-2 focus:ring-primary-accent focus:border-primary-accent outline-none resize-none bg-white text-primary-fg font-mono text-sm"
        rows={rows}
        style={{
          whiteSpace: 'pre-wrap', // Preserves newlines and spaces
          wordWrap: 'break-word',
        }}
      />

      <p className="text-xs text-primary-muted">
        Use {'{name}'} as a placeholder for contact names. Newlines are preserved automatically.
      </p>
    </div>
  );
}


