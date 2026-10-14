import type { ShareLink } from './types';

/** Build the full public URL for a share link. */
export function buildShareUrl(link: ShareLink): string {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://iv.app';
  return `${origin}/share/${link.id}`;
}

/** Compact display form: `iv.app/share/abc12345` */
export function buildShareDisplay(link: ShareLink): string {
  return `iv.app/share/${link.id}`;
}

/** Copy to clipboard with a graceful fallback. */
export async function copyShareUrl(link: ShareLink): Promise<boolean> {
  const url = buildShareUrl(link);
  if (typeof navigator === 'undefined' || !navigator.clipboard) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
