import { useMemo } from 'react';
import { useShareStore } from './store';
import type { ShareComment, ShareLink, SurfaceId } from './types';

export interface CommentWithContext extends ShareComment {
  link: ShareLink;
}

/**
 * Every comment across every share link for a venture.
 * Sorted newest first. Each comment carries its parent link so
 * the UI can show which surface and section it anchors to.
 */
export function useVentureComments(ventureId: string | undefined): CommentWithContext[] {
  const links = useShareStore((s) => s.links);
  const comments = useShareStore((s) => s.comments);

  return useMemo(() => {
    if (!ventureId) return [];
    const out: CommentWithContext[] = [];
    for (const link of Object.values(links)) {
      if (link.ventureId !== ventureId) continue;
      const list = comments[link.id] ?? [];
      for (const c of list) {
        out.push({ ...c, link });
      }
    }
    return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [links, comments, ventureId]);
}

/** Comments filtered by surface — useful for a specific page. */
export function useSurfaceComments(
  surfaceId: SurfaceId | undefined,
  ventureId: string | undefined
): CommentWithContext[] {
  const all = useVentureComments(ventureId);
  return useMemo(
    () => (surfaceId ? all.filter((c) => c.link.surfaceId === surfaceId) : all),
    [all, surfaceId]
  );
}

/** Count of unread comments for a venture. */
export function useUnreadCommentCount(ventureId: string | undefined): number {
  const all = useVentureComments(ventureId);
  return all.filter((c) => !c.readAt).length;
}
