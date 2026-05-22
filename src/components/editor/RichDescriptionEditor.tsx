import { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, Link, List, Heading2, Eye, PenLine } from 'lucide-react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  action: (selected: string) => { replacement: string; cursorOffset: number };
}

const ACTIONS: ToolbarAction[] = [
  {
    icon: <Heading2 className="w-3.5 h-3.5" />,
    label: 'Heading',
    action: (sel) => ({
      replacement: sel ? `## ${sel}` : `## Section title`,
      cursorOffset: sel ? 0 : -13,
    }),
  },
  {
    icon: <Bold className="w-3.5 h-3.5" />,
    label: 'Bold',
    action: (sel) => ({
      replacement: sel ? `**${sel}**` : `**bold text**`,
      cursorOffset: sel ? 0 : -11,
    }),
  },
  {
    icon: <Italic className="w-3.5 h-3.5" />,
    label: 'Italic',
    action: (sel) => ({
      replacement: sel ? `*${sel}*` : `*italic text*`,
      cursorOffset: sel ? 0 : -12,
    }),
  },
  {
    icon: <Link className="w-3.5 h-3.5" />,
    label: 'Link',
    action: (sel) => ({
      replacement: sel ? `[${sel}](https://)` : `[link text](https://)`,
      cursorOffset: sel ? -9 : -9,
    }),
  },
  {
    icon: <List className="w-3.5 h-3.5" />,
    label: 'Bullet list',
    action: (sel) => ({
      replacement: sel
        ? sel.split('\n').map((l) => `- ${l}`).join('\n')
        : `- Item one\n- Item two\n- Item three`,
      cursorOffset: 0,
    }),
  },
];

export function RichDescriptionEditor({ value, onChange, placeholder, rows = 8 }: Props) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyAction = (action: ToolbarAction) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const { replacement, cursorOffset } = action.action(selected);

    const next = value.slice(0, start) + replacement + value.slice(end);
    onChange(next);

    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      const newPos = start + replacement.length + cursorOffset;
      ta.setSelectionRange(newPos, newPos);
      ta.focus();
    });
  };

  return (
    <div className="border border-[#e5e5e5] rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 bg-[#fafafa] border-b border-[#e5e5e5]">
        {ACTIONS.map((a) => (
          <button
            key={a.label}
            type="button"
            title={a.label}
            onClick={() => applyAction(a)}
            className="p-1.5 rounded hover:bg-[#eee] text-[#555] transition-colors disabled:opacity-40"
            disabled={mode === 'preview'}
          >
            {a.icon}
          </button>
        ))}

        {/* Divider */}
        <div className="w-px h-4 bg-[#e5e5e5] mx-1.5" />

        {/* Write / Preview toggle */}
        <button
          type="button"
          onClick={() => setMode('write')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium transition-colors ${
            mode === 'write' ? 'bg-white border border-[#e5e5e5] text-[#111] shadow-sm' : 'text-[#999] hover:text-[#555]'
          }`}
        >
          <PenLine className="w-3 h-3" />
          Write
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium transition-colors ${
            mode === 'preview' ? 'bg-white border border-[#e5e5e5] text-[#111] shadow-sm' : 'text-[#999] hover:text-[#555]'
          }`}
        >
          <Eye className="w-3 h-3" />
          Preview
        </button>
      </div>

      {/* Editor / Preview */}
      {mode === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-4 py-3 text-[13px] text-[#333] bg-white resize-y focus:outline-none leading-relaxed"
          style={{ minHeight: `${rows * 1.6}rem` }}
        />
      ) : (
        <div
          className="px-4 py-3 bg-white min-h-[8rem] prose prose-sm max-w-none"
          style={{ minHeight: `${rows * 1.6}rem` }}
        >
          {value.trim() ? (
            <MarkdownContent>{value}</MarkdownContent>
          ) : (
            <p className="text-[#bbb] text-[13px] italic">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Shared markdown renderer used on both the editor preview and the product page */
export function MarkdownContent({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {children}
          </a>
        ),
        h1: ({ children }) => <h1 className="text-[18px] font-bold text-[#111] mt-4 mb-2">{children}</h1>,
        h2: ({ children }) => <h2 className="text-[16px] font-bold text-[#111] mt-4 mb-2">{children}</h2>,
        h3: ({ children }) => <h3 className="text-[14px] font-bold text-[#111] mt-3 mb-1">{children}</h3>,
        p: ({ children }) => <p className="text-[14px] text-[#555] leading-relaxed mb-3">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside space-y-1 mb-3 text-[14px] text-[#555]">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 mb-3 text-[14px] text-[#555]">{children}</ol>,
        li: ({ children }) => <li className="text-[14px] text-[#555]">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-[#333]">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="bg-[#f5f5f5] text-[#d63384] px-1 py-0.5 rounded text-[12px] font-mono">{children}</code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-[#e5e5e5] pl-4 italic text-[#777] my-3">{children}</blockquote>
        ),
        hr: () => <hr className="border-[#eee] my-4" />,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
