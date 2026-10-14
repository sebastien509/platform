import { Printer } from 'lucide-react';
import { getSurfaceRenderer } from '../registry';
import { useLink } from '@/lib/share';

/**
 * PdfView — print-preview wrapper around the surface.
 * Renders the HTML surface in a print-optimized layout and
 * offers a "Save as PDF" action that triggers the browser dialog.
 */
export function PdfView({ linkId }: { linkId: string }) {
  const link = useLink(linkId);
  const Renderer = link ? getSurfaceRenderer(link.surfaceId) : undefined;

  const handlePrint = () => {
    window.print();
  };

  if (!Renderer) return null;

  return (
    <div className="pdf-view">
      <div className="pdf-view__toolbar">
        <span className="pdf-view__hint">
          Print-preview · save as PDF from your browser
        </span>
        <button
          type="button"
          className="pdf-view__btn"
          onClick={handlePrint}
        >
          <Printer className="h-3.5 w-3.5" />
          Save as PDF
        </button>
      </div>
      <div className="pdf-view__page">
        <Renderer linkId={linkId} />
      </div>
    </div>
  );
}
