interface IdeaSubtitleProps {
  text: string;
  className?: string;
}

/**
 * The agent's guiding question — revealed word-by-word.
 *
 * Key the component on `text` so a new question re-mounts and replays
 * the stagger. Italic + secondary color distinguish the agent's voice
 * from the founder's own typed answer (which stays upright + primary).
 */
export function IdeaSubtitle({ text, className }: IdeaSubtitleProps) {
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <p className={`idea-focus__subtitle ${className ?? ''}`}>
      {words.map((word, i) => (
        <span
          key={`${i}-${word}`}
          className="idea-focus__word"
          style={{ animationDelay: `${i * 45}ms` }}
        >
          {word}
        </span>
      ))}
    </p>
  );
}
