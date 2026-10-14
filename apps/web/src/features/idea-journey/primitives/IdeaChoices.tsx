interface Choice {
  label: string;
  value: string;
  primary?: boolean;
}

export function IdeaChoices({
  choices,
  onSelect,
  disabled,
}: {
  choices: Choice[];
  onSelect: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="idea-choices">
      {choices.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onSelect(c.value)}
          disabled={disabled}
          className={`idea-choice-btn ${c.primary ? 'is-primary' : ''}`}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}
