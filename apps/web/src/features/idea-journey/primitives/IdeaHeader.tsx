const IV_ICON_URL =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/q_auto,f_auto,w_256/v1789515612/Branding_IV_Basic_color_Blue_kawkqg.png';

interface IdeaHeaderProps {
  title: string;
}

/**
 * Fixed header — icon + stage title.
 *
 * Sits outside the stage flow so it can persist while stages transition.
 * The title animates on change (key forces remount, CSS replays fade).
 */
export function IdeaHeader({ title }: IdeaHeaderProps) {
  return (
    <header className="idea-header">
      <img
        src={IV_ICON_URL}
        alt=""
        className="idea-header__icon"
        aria-hidden="true"
      />
      <h1 key={title} className="idea-header__title">
        {title}
      </h1>
    </header>
  );
}
