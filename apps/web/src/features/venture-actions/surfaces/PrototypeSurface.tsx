import { useEffect, useState } from 'react';
import { useLink, useCommentsForLink, copyShareUrl } from '@/lib/share';
import { SurfaceFrame, CopyLinkButton } from './SurfaceFrame';
import { SurfaceSections } from './sections';
import { CommentThread } from './CommentThread';

export function PrototypeSurface({ linkId }: { linkId: string }) {
  const link = useLink(linkId);
  const comments = useCommentsForLink(linkId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  if (!link) {
    return (
      <div className="surface-frame surface-frame--missing">
        <p>This link has expired or was revoked.</p>
      </div>
    );
  }

  const handleCopy = async () => {
    if (await copyShareUrl(link)) setCopied(true);
  };

  const isFullBleedHtml =
    link.snapshot.sections.length === 1 &&
    link.snapshot.sections[0].type === 'embed';

  if (isFullBleedHtml) {
    const embed = link.snapshot.sections[0] as any;
    return (
      <div className="surface-html-full">
        <div className="surface-html-full__toolbar">
          <span className="surface-html-full__title">{link.snapshot.title}</span>
          <CopyLinkButton onClick={handleCopy} copied={copied} />
        </div>
        <iframe
          title={link.snapshot.title}
          srcDoc={embed.html}
          sandbox="allow-scripts allow-same-origin"
          className="surface-html-full__frame"
        />
      </div>
    );
  }

  return (
    <SurfaceFrame
      eyebrow="Prototype"
      title={link.snapshot.title}
      kicker={link.snapshot.kicker}
      actions={<CopyLinkButton onClick={handleCopy} copied={copied} />}
      meta="Clickable preview · no login"
    >
      <SurfaceSections sections={link.snapshot.sections} />
      {link.commentsEnabled && (
        <CommentThread linkId={link.id} comments={comments} />
      )}
    </SurfaceFrame>
  );
}
