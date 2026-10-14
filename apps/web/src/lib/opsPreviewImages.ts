// src/lib/opsPreviewImages.ts

const CLOUDINARY =
  "https://res.cloudinary.com/dvcmopd4q/image/upload/v1791779293";

export const OPS_PREVIEW_IMAGES = {
  document: `${CLOUDINARY}/doc.png`,
  report: `${CLOUDINARY}/report.png`,
  deck: `${CLOUDINARY}/deck.png`,
  code: `${CLOUDINARY}/code.png`,
  html: `${CLOUDINARY}/ops-html.png`,
  sheet: `${CLOUDINARY}/ops-sheet.png`,
  email: `${CLOUDINARY}/email.png`,
  connected_action: `${CLOUDINARY}/ops-connected.png`,
} as const;
