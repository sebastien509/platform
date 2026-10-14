import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Command, Search, Zap, Briefcase, Lightbulb, BarChart3,
  Settings, Users, BookOpen, Award,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const OPEN_COMMAND_BAR_EVENT = 'iv:open-command-bar';

const commands = [
  { name: 'Go to Today', href: '/today', icon: Zap },
  { name: 'Go to Ideas', href: '/ideas', icon: Lightbulb },
  { name: 'Go to Ventures', href: '/ventures', icon: Briefcase },
  { name: 'Go to Agents', href: '/apps-agents', icon: Users },
  { name: 'Go to Knowledge', href: '/knowledge', icon: BookOpen },
  { name: 'Go to Outcomes', href: '/outcomes', icon: Award },
  { name: 'Go to Settings', href: '/settings', icon: Settings },
  { name: 'Go to Dashboard', href: '/today', icon: BarChart3 },
];

export function CommandBar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const open = () => {
    setIsOpen(true);
    setQuery('');
    setSelectedIndex(0);
  };
  const close = () => setIsOpen(false);

  // Listen for the Topbar's open signal.
  useEffect(() => {
    const onOpen = () => open();
    window.addEventListener(OPEN_COMMAND_BAR_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_COMMAND_BAR_EVENT, onOpen);
  }, []);

  // ⌘K + keyboard nav
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) close();
        else open();
        return;
      }
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % commands.length);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + commands.length) % commands.length);
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const command = commands[selectedIndex];
        if (command) {
          navigate(command.href);
          close();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, navigate]);

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50"
      onClick={close}
    >
      <div
        className="fixed left-1/2 top-[20%] w-[640px] max-w-[90vw] -translate-x-1/2 rounded-xl border border-[var(--border)] bg-[var(--surface-0)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search className="h-5 w-5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="What do you want to do?"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <kbd className="flex h-6 items-center gap-1 rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 font-mono text-xs text-[var(--text-muted)]">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-4 text-center text-sm text-[var(--text-muted)]">
              No results found
            </div>
          ) : (
            filteredCommands.map((command, index) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.href}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    index === selectedIndex
                      ? 'bg-[var(--accent-muted)] text-[var(--accent)] font-medium'
                      : 'text-[var(--text-primary)] hover:bg-[var(--surface-2)]'
                  )}
                  onClick={() => {
                    navigate(command.href);
                    close();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <Icon className="h-4 w-4" />
                  {command.name}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}