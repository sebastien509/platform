/* ============================================================
   IV — Brand assets
   Centralised so component code never hardcodes a Cloudinary URL.
   If the CDN moves, this file is the only change.
   ============================================================ */

   export const BRAND_ASSETS = {
    /** Full "IV." wordmark — audience needs to recognize the brand. */
    wordmark:
      'https://res.cloudinary.com/dvcmopd4q/image/upload/v1789515611/Branding_IV_text_Color_Blue_vovyzb.png',
  
    /** Circular geometric mark — space is limited or brand is understood. */
    symbol:
      'https://res.cloudinary.com/dvcmopd4q/image/upload/v1789515612/Branding_IV_Basic_color_Blue_kawkqg.png',
  } as const;
  
  /**
   * Cloudinary URL transformation helper.
   *
   * Cloudinary URL shape: .../image/upload/{transforms}/{public_id}
   * We insert the transform segment right after `/upload/`.
   *
   * Example:
   *   cldTransform(BRAND_ASSETS.wordmark, { width: 320, trim: true })
   *   → .../image/upload/w_320,e_trim,q_auto,f_auto/Branding_IV_text_Color_Blue_vovyzb.png
   *
   * The `trim` flag is important for the IV brand assets — both are
   * 3600×3600 canvas exports with the visible mark centered in a
   * large transparent field. Without `e_trim`, a `width: 320` request
   * returns a 320px-wide image whose visible content is only ~30% of
   * that — which is why untrimmed logos render tiny inside their box.
   *
   * Docs: https://cloudinary.com/documentation/transformation_reference
   */
  export function cldTransform(
    url: string,
    opts: {
      width?: number;
      height?: number;
      crop?: 'fit' | 'fill' | 'scale' | 'pad';
      quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco';
      format?: 'auto' | 'webp' | 'png';
      /** Auto-crop transparent padding around the visible content. */
      trim?: boolean;
    } = {}
  ): string {
    const parts: string[] = [];
  
    // trim must come before width/height so the requested size applies
    // to the visible content, not the padded canvas.
    if (opts.trim) parts.push('e_trim');
  
    if (opts.width) parts.push(`w_${opts.width}`);
    if (opts.height) parts.push(`h_${opts.height}`);
    if (opts.crop) parts.push(`c_${opts.crop}`);
    parts.push(`q_${opts.quality ?? 'auto'}`);
    parts.push(`f_${opts.format ?? 'auto'}`);
  
    const transform = parts.join(',');
    return url.replace('/image/upload/', `/image/upload/${transform}/`);
  }