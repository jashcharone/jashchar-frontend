import React, { useState, useRef, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Code, Eye, Printer, Search, Type, Image as ImageIcon, Link as LinkIcon, 
  Table as TableIcon, Maximize, Minimize, Palette, Eraser, Undo, Redo, 
  Bold, Italic, Underline, Strikethrough, Subscript, Superscript, List, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Quote, Copy, Scissors, Clipboard,
  CheckSquare, Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom Undo/Redo icons for Quill
const CustomUndo = () => <Undo className="h-4 w-4" />;
const CustomRedo = () => <Redo className="h-4 w-4" />;

const RichTextEditor = forwardRef(({ value, onChange, placeholder, className }, ref) => {
  const [showSource, setShowSource] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const quillRef = useRef(null);
  const containerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor(),
    insertContent: (content) => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            quill.clipboard.dangerouslyPasteHTML(index, content);
        }
    },
    insertImage: (url) => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            quill.insertEmbed(index, 'image', url);
        }
    }
  }));

  // Generate a unique ID for the toolbar to avoid conflicts if multiple editors exist
  const toolbarId = useMemo(() => `toolbar-${Math.random().toString(36).substring(2, 9)}`, []);

  const handleUndo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) quill.history.undo();
  };

  const handleRedo = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) quill.history.redo();
  };

  const handlePrint = () => {
    const content = quillRef.current?.getEditor().root.innerHTML;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print</title>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSelectAll = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) quill.setSelection(0, quill.getLength());
  };

  const handleCut = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
        const range = quill.getSelection();
        if (range) {
            const text = quill.getText(range.index, range.length);
            navigator.clipboard.writeText(text);
            quill.deleteText(range.index, range.length);
        }
    }
  };

  const handleCopy = () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
        const range = quill.getSelection();
        if (range) {
            const text = quill.getText(range.index, range.length);
            navigator.clipboard.writeText(text);
        }
    }
  };

  const handlePaste = async () => {
    const quill = quillRef.current?.getEditor();
    if (quill) {
        try {
            const text = await navigator.clipboard.readText();
            const range = quill.getSelection();
            const index = range ? range.index : quill.getLength();
            quill.insertText(index, text);
        } catch (err) {
            alert('Please use Ctrl+V to paste');
        }
    }
  };

  const toggleSource = () => {
    setShowSource(!showSource);
  };

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  // Custom Toolbar Component
  const customToolbar = (
    <div id={toolbarId} className="flex flex-wrap gap-1 items-center">
      {/* Group 1: Document */}
      <span className="ql-formats flex border-r pr-2 mr-2 border-gray-300 dark:border-gray-600">
        <button className="custom-btn-source" onClick={toggleSource} title="Source">
          <Code className="h-4 w-4" />
        </button>
        <button className="custom-btn-preview" title="Preview (Not Implemented)">
          <Eye className="h-4 w-4" />
        </button>
        <button className="custom-btn-print" onClick={handlePrint} title="Print">
          <Printer className="h-4 w-4" />
        </button>
      </span>

      {/* Group 2: Clipboard */}
      <span className="ql-formats flex border-r pr-2 mr-2 border-gray-300 dark:border-gray-600">
        <button className="custom-btn-cut" onClick={handleCut} title="Cut">
          <Scissors className="h-4 w-4" />
        </button>
        <button className="custom-btn-copy" onClick={handleCopy} title="Copy">
          <Copy className="h-4 w-4" />
        </button>
        <button className="custom-btn-paste" onClick={handlePaste} title="Paste">
          <Clipboard className="h-4 w-4" />
        </button>
        <button className="custom-btn-undo" onClick={handleUndo} title="Undo">
          <Undo className="h-4 w-4" />
        </button>
        <button className="custom-btn-redo" onClick={handleRedo} title="Redo">
          <Redo className="h-4 w-4" />
        </button>
      </span>

      {/* Group 3: Editing */}
      <span className="ql-formats flex border-r pr-2 mr-2 border-gray-300 dark:border-gray-600">
        <button className="ql-clean" title="Remove Format"></button>
      </span>

      {/* Group 4: Basic Styles */}
      <span className="ql-formats flex border-r pr-2 mr-2 border-gray-300 dark:border-gray-600">
        <button className="ql-bold"></button>
        <button className="ql-italic"></button>
        <button className="ql-underline"></button>
        <button className="ql-strike"></button>
        <button className="ql-script" value="sub"></button>
        <button className="ql-script" value="super"></button>
      </span>

      {/* Group 5: Paragraph */}
      <span className="ql-formats flex border-r pr-2 mr-2 border-gray-300 dark:border-gray-600">
        <button className="ql-list" value="ordered"></button>
        <button className="ql-list" value="bullet"></button>
        <button className="ql-indent" value="-1"></button>
        <button className="ql-indent" value="+1"></button>
        <button className="ql-blockquote"></button>
        <button className="ql-direction" value="rtl"></button>
        <select className="ql-align"></select>
      </span>

      {/* Group 6: Links & Inserts */}
      <span className="ql-formats flex border-r pr-2 mr-2 border-gray-300 dark:border-gray-600">
        <button className="ql-link"></button>
        <button className="ql-image"></button>
        <button className="ql-video"></button>
        <button className="ql-formula"></button>
      </span>

      {/* Group 7: Styles */}
      <span className="ql-formats flex border-r pr-2 mr-2 border-gray-300 dark:border-gray-600">
        <select className="ql-header" defaultValue="">
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
            <option value="5">Heading 5</option>
            <option value="6">Heading 6</option>
            <option value="">Normal</option>
        </select>
        <select className="ql-font" defaultValue="sans-serif">
            <option value="sans-serif">Sans Serif</option>
            <option value="serif">Serif</option>
            <option value="monospace">Monospace</option>
        </select>
        <select className="ql-size" defaultValue="">
            <option value="small">Small</option>
            <option value="">Normal</option>
            <option value="large">Large</option>
            <option value="huge">Huge</option>
        </select>
      </span>

      {/* Group 8: Colors */}
      <span className="ql-formats flex border-r pr-2 mr-2 border-gray-300 dark:border-gray-600">
        <select className="ql-color"></select>
        <select className="ql-background"></select>
      </span>

      {/* Group 9: Tools */}
      <span className="ql-formats flex">
        <button className="custom-btn-maximize" onClick={toggleFullScreen} title="Maximize">
            {isFullScreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </span>
    </div>
  );

  const modules = useMemo(() => ({
    toolbar: {
      container: `#${toolbarId}`,
      handlers: {
        // Handlers are attached via onClick in JSX for custom buttons
        // Standard Quill buttons use default handlers
      }
    },
    clipboard: {
      matchVisual: false,
    },
    history: {
      delay: 1000,
      maxStack: 500,
      userOnly: true
    }
  }), [toolbarId]);

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
    'script', 'list', 'bullet', 'indent', 'direction', 'align',
    'color', 'background',
    'link', 'image', 'video', 'formula'
  ];

  return (
    <div 
        ref={containerRef}
        className={cn(
            "rich-text-editor flex flex-col border rounded-md overflow-hidden bg-white dark:bg-slate-950 shadow-sm", 
            isFullScreen ? "fixed inset-0 z-[9999] h-screen w-screen m-0 rounded-none" : "relative",
            className
        )}
    >
      {customToolbar}

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative bg-white dark:bg-slate-950">
        {showSource ? (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-full min-h-[300px] p-4 font-mono text-sm resize-none border-0 focus-visible:ring-0 rounded-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            placeholder="HTML Source Code..."
          />
        ) : (
          <ReactQuill
            ref={quillRef}
            theme="snow"
            value={value}
            onChange={onChange}
            modules={modules}
            formats={formats}
            placeholder={placeholder}
            className="h-full flex flex-col"
          />
        )}
      </div>

      {/* Custom Styles to override Quill defaults to match the requested look */}
      <style>{`
        .rich-text-editor .quill {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
        /* Toolbar Styling to match Classic Editor */
        .rich-text-editor .ql-toolbar.ql-snow {
            border: none;
            border-bottom: 1px solid #d1d5db;
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
            padding: 6px;
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            align-items: center;
        }
        .dark .rich-text-editor .ql-toolbar.ql-snow {
            background: #1e293b;
            border-color: #475569;
        }
        
        /* Button Groups */
        .ql-formats {
            margin-right: 4px !important;
            padding-right: 4px;
            border-right: 1px solid #d1d5db;
            display: flex;
            align-items: center;
        }
        .dark .ql-formats {
            border-color: #475569;
        }
        .ql-formats:last-child {
            border-right: none;
        }

        /* Buttons */
        .rich-text-editor button {
            width: 28px !important;
            height: 28px !important;
            padding: 4px !important;
            margin: 1px !important;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4b5563;
        }
        .dark .rich-text-editor button {
            color: #cbd5e1;
        }
        .rich-text-editor button:hover {
            background-color: #e5e7eb;
            color: #000;
        }
        .dark .rich-text-editor button:hover {
            background-color: #334155;
            color: #fff;
        }
        .rich-text-editor button.ql-active {
            background-color: #d1d5db;
            color: #000;
        }
        .dark .rich-text-editor button.ql-active {
            background-color: #475569;
            color: #fff;
        }
        
        /* Dropdowns */
        .ql-snow .ql-picker {
            height: 28px;
            margin: 1px;
            color: #4b5563;
        }
        .dark .ql-snow .ql-picker {
            color: #cbd5e1;
        }
        .ql-snow .ql-picker-label {
            padding-left: 4px;
            padding-right: 18px; /* Space for arrow */
            display: flex;
            align-items: center;
        }
        .dark .ql-snow .ql-picker-options {
            background-color: #1e293b;
            border-color: #475569;
            color: #cbd5e1;
        }
        
        /* Fix for dropdowns appearing as native selects */
        .rich-text-editor select {
            display: none;
        }

        /* Editor Content */
        .rich-text-editor .ql-container.ql-snow {
            border: none;
            flex: 1;
            overflow-y: auto;
            font-family: inherit;
            font-size: 14px;
        }
        .dark .rich-text-editor .ql-container.ql-snow {
            background-color: #020617;
        }
        .rich-text-editor .ql-editor {
            min-height: 200px;
            padding: 16px;
        }
        .dark .rich-text-editor .ql-editor {
            color: #e2e8f0;
            background-color: #020617;
        }
        .dark .rich-text-editor .ql-editor.ql-blank::before {
            color: #94a3b8;
        }
        
        /* Icons fix */
        .lucide {
            width: 16px;
            height: 16px;
        }
      `}</style>
    </div>
  );
});

export default RichTextEditor;
