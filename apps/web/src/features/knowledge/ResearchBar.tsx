import { useRef, useState } from 'react';
import {
  Sparkles,
  Loader2,
  ArrowUp,
  Paperclip,
  X,
  FileText,
} from 'lucide-react';
import { useInquiry } from '@/lib/hooks/useInquiry';
import { cn } from '@/lib/utils/cn';

type IntentChip =
  | 'general'
  | 'market'
  | 'competitor'
  | 'customer'
  | 'pricing'
  | 'product';

const INTENT_CHIPS: Array<{ value: IntentChip; label: string }> = [
  { value: 'general', label: 'General' },
  { value: 'market', label: 'Market' },
  { value: 'competitor', label: 'Competitor' },
  { value: 'customer', label: 'Customer' },
  { value: 'pricing', label: 'Pricing' },
  { value: 'product', label: 'Product' },
];

const INTENT_PROMPTS: Record<IntentChip, string> = {
  general: '',
  market: 'Analyze market size, growth, and TAM for:',
  competitor: 'Compare against competitors for:',
  customer: 'Synthesize customer insights about:',
  pricing: 'Recommend pricing strategy for:',
  product: 'Evaluate product direction for:',
};

interface Props {
  ventureId?: string;
  workspaceId?: string;
  entryCount: number;
}

export function ResearchBar({ ventureId, workspaceId, entryCount }: Props) {
  const [query, setQuery] = useState('');
  const [intent, setIntent] = useState<IntentChip>('general');
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inquiry = useInquiry();

  function addFiles(incoming: FileList | File[]) {
    const list = Array.from(incoming);
    const next = [...files];
    for (const f of list) {
      if (next.length >= 5) break;
      if (f.size > 10 * 1024 * 1024) continue; // 10MB cap
      if (next.find((x) => x.name === f.name && x.size === f.size)) continue;
      next.push(f);
    }
    setFiles(next);
  }

  function removeFile(name: string, size: number) {
    setFiles(files.filter((f) => !(f.name === name && f.size === size)));
  }

  async function submit() {
    const base = query.trim();
    if ((!base && files.length === 0) || inquiry.isPending) return;
    setError(null);

    /* Build the full query — intent prefix + user text + file
       names. Files aren't uploaded yet (bucket TBD); their names
       signal to the agent what's available. */
    const intentPrefix = INTENT_PROMPTS[intent];
    const fileNote = files.length
      ? `\n\n[Attached files: ${files.map((f) => f.name).join(', ')}]`
      : '';
    const fullQuery = intentPrefix
      ? `${intentPrefix} ${base}${fileNote}`
      : `${base}${fileNote}`;

    try {
      await inquiry.mutateAsync({ query: fullQuery, ventureId, workspaceId });
      setQuery('');
      setFiles([]);
      setIntent('general');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Inquiry failed');
    }
  }

  return (
    <div
      className={cn('research-bar', dragOver && 'is-dragover')}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      }}
    >
      {/* Intent chips */}
      <div className="research-bar__chips">
        {INTENT_CHIPS.map((c) => (
          <button
            key={c.value}
            type="button"
            className={cn(
              'research-bar__chip',
              intent === c.value && 'is-active'
            )}
            onClick={() => setIntent(c.value)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Query field */}
      <div className="research-bar__field">
        <span className="research-bar__icon">
          {inquiry.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </span>
        <input
          type="text"
          className="research-bar__input"
          placeholder={
            entryCount === 0
              ? 'Ask a question once this venture has research…'
              : intent === 'general'
              ? 'Ask anything about this venture…'
              : `What to ${INTENT_CHIPS.find((c) => c.value === intent)?.label.toLowerCase()}?`
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          disabled={inquiry.isPending || entryCount === 0}
        />
        <button
          type="button"
          className="research-bar__attach"
          onClick={() => fileInputRef.current?.click()}
          disabled={inquiry.isPending || files.length >= 5}
          aria-label="Attach files"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="research-bar__send"
          onClick={submit}
          disabled={
            (!query.trim() && files.length === 0) ||
            inquiry.isPending ||
            entryCount === 0
          }
          aria-label="Ask"
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Attached files */}
      {files.length > 0 && (
        <div className="research-bar__files">
          {files.map((f) => (
            <span key={`${f.name}-${f.size}`} className="research-bar__file">
              <FileText className="h-3 w-3" />
              {f.name}
              <button
                type="button"
                onClick={() => removeFile(f.name, f.size)}
                aria-label={`Remove ${f.name}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {dragOver && (
        <div className="research-bar__drop-hint">
          Drop files to attach
        </div>
      )}

      {error && <p className="research-bar__error">{error}</p>}
      {inquiry.isPending && (
        <p className="research-bar__hint">
          Searching the venture's knowledge…
        </p>
      )}
    </div>
  );
}
