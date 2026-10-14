import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ShareLink, ShareComment } from './types';

/* Stable reference — prevents Zustand re-render loops. */
const EMPTY_COMMENTS: import('./types').ShareComment[] = [];

interface ShareState {
  links: Record<string, ShareLink>;
  comments: Record<string, ShareComment[]>;

  createLink: (link: Omit<ShareLink, 'id' | 'createdAt'>) => string;
  getLink: (id: string) => ShareLink | undefined;
  revokeLink: (id: string) => void;

  addComment: (comment: Omit<ShareComment, 'id' | 'createdAt'>) => string;
  getComments: (linkId: string) => ShareComment[];
  removeComment: (commentId: string, linkId: string) => void;
  /** Mark a single comment as read. */
  markCommentRead: (commentId: string, linkId: string) => void;
  /** Mark every comment on a link as read. */
  markAllCommentsRead: (linkId: string) => void;
}

function rid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${rand}`;
}

export const useShareStore = create<ShareState>()(
  persist(
    (set, get) => ({
      links: {},
      comments: {},

      createLink: (link) => {
        const id = rid('sh');
        const record: ShareLink = {
          ...link,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ links: { ...s.links, [id]: record } }));
        return id;
      },

      getLink: (id) => get().links[id],

      revokeLink: (id) =>
        set((s) => {
          const { [id]: _removed, ...rest } = s.links;
          const { [id]: _removedComments, ...restComments } = s.comments;
          return { links: rest, comments: restComments };
        }),

      addComment: (comment) => {
        const id = rid('cm');
        const record: ShareComment = {
          ...comment,
          id,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          comments: {
            ...s.comments,
            [comment.linkId]: [...(s.comments[comment.linkId] ?? []), record],
          },
        }));
        return id;
      },

      getComments: (linkId) => get().comments[linkId] ?? [],

      removeComment: (commentId, linkId) =>
        set((s) => ({
          comments: {
            ...s.comments,
            [linkId]: (s.comments[linkId] ?? []).filter((c) => c.id !== commentId),
          },
        })),

      markCommentRead: (commentId, linkId) =>
        set((s) => ({
          comments: {
            ...s.comments,
            [linkId]: (s.comments[linkId] ?? []).map((c) =>
              c.id === commentId
                ? { ...c, readAt: c.readAt ?? new Date().toISOString() }
                : c
            ),
          },
        })),

      markAllCommentsRead: (linkId) =>
        set((s) => {
          const now = new Date().toISOString();
          return {
            comments: {
              ...s.comments,
              [linkId]: (s.comments[linkId] ?? []).map((c) =>
                c.readAt ? c : { ...c, readAt: now }
              ),
            },
          };
        }),
    }),
    {
      name: 'iv-share-store',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);

/* ---------- Selectors ---------- */

export const useLink = (id: string | undefined) =>
  useShareStore((s) => (id ? s.links[id] : undefined));

export const useCommentsForLink = (linkId: string | undefined) =>
  useShareStore((s) =>
    linkId ? s.comments[linkId] ?? EMPTY_COMMENTS : EMPTY_COMMENTS
  );
