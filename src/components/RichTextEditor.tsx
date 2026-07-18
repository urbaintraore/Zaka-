import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, RemoveFormatting } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Synchronize internal HTML with value prop only when it differs
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        if (!value) {
          editorRef.current.innerHTML = '';
        } else {
          editorRef.current.innerHTML = value;
        }
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      let html = editorRef.current.innerHTML;
      // If it's just a blank line, treat as empty
      if (html === '<br>' || html === '<div><br></div>' || html === '<p><br></p>') {
        html = '';
      }
      onChange(html);
    }
  };

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    handleInput();
    // Maintain focus
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Prevent rich text paste and sanitize
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className={`flex flex-col rounded-xl border transition-all bg-white overflow-hidden ${
      isFocused ? 'border-orange-500 ring-2 ring-orange-100' : 'border-gray-200'
    }`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-100">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="Souligné"
        >
          <Underline className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => execCommand('insertOrderedList')}
          className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="Liste ordonnée"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        <button
          type="button"
          onClick={() => execCommand('removeFormat')}
          className="p-1.5 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          title="Effacer le format"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* Editor container */}
      <div className="relative min-h-[150px] flex flex-col">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            handleInput();
          }}
          className="outline-none px-4 py-3 min-h-[150px] text-sm text-gray-800 prose prose-sm max-w-none cursor-text"
        />
        {!value && (
          <div className="absolute top-3 left-4 text-gray-400 text-sm pointer-events-none select-none">
            {placeholder || 'Donnez tous les détails utiles...'}
          </div>
        )}
      </div>
    </div>
  );
}
