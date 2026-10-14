interface IdeaHistoryItemProps {
  value: string;
  onClick?: () => void;
}

export function IdeaHistoryItem({ value, onClick }: IdeaHistoryItemProps) {
  /* Truncate for the rail — never more than ~60 chars so the label
     stays on one line next to the dot. */
  const railLabel =
    value.length > 60 ? `${value.slice(0, 60).trimEnd()}…` : value;

  return (
    <div
      className="idea-history-item"
      data-rail-label={railLabel}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <p className="idea-history-item__value">{value}</p>
    </div>
  );
}