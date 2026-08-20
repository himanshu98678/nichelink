import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Heading3, List, ListOrdered, Link2, Quote, Code } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write something format-rich here...',
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync value prop to inner html on load / change
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleCommand = (command: string, arg: string = '') => {
    if (disabled) return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleLink = () => {
    if (disabled) return;
    const url = prompt('Enter link URL (e.g., https://example.com):');
    if (url) {
      handleCommand('createLink', url);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center px-3 py-2 bg-slate-100 border-b border-slate-200 text-slate-600 text-xs gap-1">
        <button
          type="button"
          onClick={() => handleCommand('bold')}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-white text-slate-700 cursor-pointer disabled:opacity-50"
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('italic')}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-white text-slate-700 cursor-pointer disabled:opacity-50"
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', '<h3>')}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-white text-slate-700 cursor-pointer disabled:opacity-50"
          title="Heading H3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('insertUnorderedList')}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-white text-slate-700 cursor-pointer disabled:opacity-50"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('insertOrderedList')}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-white text-slate-700 cursor-pointer disabled:opacity-50"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleLink}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-white text-slate-700 cursor-pointer disabled:opacity-50"
          title="Insert Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', '<blockquote>')}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-white text-slate-700 cursor-pointer disabled:opacity-50"
          title="Quote Block"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => handleCommand('formatBlock', '<pre>')}
          disabled={disabled}
          className="p-1.5 rounded hover:bg-white text-slate-700 cursor-pointer disabled:opacity-50"
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Body */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        className="w-full min-h-[140px] max-h-[300px] overflow-y-auto px-4 py-3 bg-white text-xs sm:text-sm text-slate-900 focus:outline-none placeholder:text-slate-400 select-text"
        data-placeholder={placeholder}
        style={{ outline: 'none' }}
      />
      
      {/* Dynamic styling for editor placeholder */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          cursor: text;
        }
      `}</style>
    </div>
  );
};
