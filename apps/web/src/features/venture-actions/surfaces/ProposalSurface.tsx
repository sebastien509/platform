import { useEffect, useState } from 'react';
import { useLink, useCommentsForLink, copyShareUrl } from '@/lib/share';
import { SurfaceFrame, CopyLinkButton } from './SurfaceFrame';
import { SurfaceSections } from './sections';
import { CommentThread } from './CommentThread';

export function ProposalSurface({ linkId }: { linkId: string }) {
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

  return (
    <SurfaceFrame
      eyebrow="Proposal"
      title={link.snapshot.title}
      kicker={link.snapshot.kicker}
      actions={<CopyLinkButton onClick={handleCopy} copied={copied} />}
      meta="Pricing and terms · reply with feedback"
    >
      <SurfaceSections sections={link.snapshot.sections} />
      {link.commentsEnabled && (
        <CommentThread linkId={link.id} comments={comments} />
      )}
    </SurfaceFrame>
  );
}
