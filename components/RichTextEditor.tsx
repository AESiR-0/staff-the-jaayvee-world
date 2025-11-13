"use client";

import { useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder = "Enter text..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  // Initialize and update when value changes
  useEffect(() => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML || '';
      const newContent = value || '';
      
      // On first render or if content is empty, set the value
      if (!isInitialized.current || (!currentContent && newContent)) {
        editorRef.current.innerHTML = newContent;
        isInitialized.current = true;
        return;
      }
      
      // Only update if the content is different to avoid cursor jumping
      // Normalize both strings for comparison (remove extra whitespace)
      const normalizedCurrent = currentContent.trim();
      const normalizedNew = newContent.trim();
      
      if (normalizedCurrent !== normalizedNew) {
        // Save cursor position if focused
        const selection = window.getSelection();
        let range = null;
        if (selection && selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
          range = selection.getRangeAt(0);
        }
        
        editorRef.current.innerHTML = newContent;
        isInitialized.current = true;
        
        // Restore cursor position if it was saved
        if (range && selection) {
          try {
            selection.removeAllRanges();
            selection.addRange(range);
          } catch (e) {
            // Ignore errors if range is invalid
          }
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const ToolbarButton = ({ 
    onClick, 
    icon: Icon, 
    title 
  }: { 
    onClick: () => void; 
    icon: any; 
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-2 hover:bg-gray-100 rounded transition-colors"
      onMouseDown={(e) => e.preventDefault()}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
        <ToolbarButton
          onClick={() => execCommand("bold")}
          icon={Bold}
          title="Bold"
        />
        <ToolbarButton
          onClick={() => execCommand("italic")}
          icon={Italic}
          title="Italic"
        />
        <ToolbarButton
          onClick={() => execCommand("underline")}
          icon={Underline}
          title="Underline"
        />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton
          onClick={() => execCommand("insertUnorderedList")}
          icon={List}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => execCommand("insertOrderedList")}
          icon={ListOrdered}
          title="Numbered List"
        />
        <div className="w-px h-6 bg-gray-300 mx-1" />
        <ToolbarButton
          onClick={() => execCommand("justifyLeft")}
          icon={AlignLeft}
          title="Align Left"
        />
        <ToolbarButton
          onClick={() => execCommand("justifyCenter")}
          icon={AlignCenter}
          title="Align Center"
        />
        <ToolbarButton
          onClick={() => execCommand("justifyRight")}
          icon={AlignRight}
          title="Align Right"
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        className="min-h-[200px] p-4 focus:outline-none text-gray-900"
        style={{
          wordBreak: "break-word",
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}


