import { OPS_PREVIEW_IMAGES } from './opsPreviewImages';

export type OpsPreviewType = keyof typeof OPS_PREVIEW_IMAGES;
type ActionLike = {
  id?: string;
  verb?: string;
  produces?: string;
  description?: string;
  renderType?: string;
  destination?: string;
  icon?: string;
};

const LABELS: Record<OpsPreviewType, string> = {
  document: 'Document', report: 'Report', deck: 'Presentation',
  code: 'Code', html: 'Website / app', sheet: 'Spreadsheet',
  email: 'Email / batch', connected_action: 'Connected action',
};

/** Choose the illustration from the action definition, never from its current state.
 * Explicit renderType wins; keywords are a fallback for older action definitions.
 */
export function getOpsPreview(action: ActionLike): {
  type: OpsPreviewType; label: string; src: string; alt: string;
} {
  const renderType = String(action.renderType ?? '').toLowerCase();
  const output = String(action.produces ?? '').toLowerCase();
  const combined = [action.id, action.verb, action.produces, action.description, action.destination, action.icon]
    .filter(Boolean).join(' ').toLowerCase();
  let type: OpsPreviewType = 'document';
  if (/^(html|web|website|react|app|iframe)$/.test(renderType)) type = 'html';
  else if (/^(code|source|typescript|javascript|json|diff)$/.test(renderType)) type = 'code';
  else if (/^(sheet|spreadsheet|csv|xlsx|table)$/.test(renderType)) type = 'sheet';
  else if (/^(slides?|deck|pptx|presentation)$/.test(renderType)) type = 'deck';
  else if (/^(email|mail|batch|sequence)$/.test(renderType)) type = 'email';
  else if (/^(connected.action|integration|workflow|tool|external.action)$/.test(renderType)) type = 'connected_action';
  else if (/^(report|analysis|research)$/.test(renderType)) type = 'report';
  else if (/^(markdown|pdf|docx|document|text)$/.test(renderType)) type = 'document';
  else if (/\b(integration|connector|crm|sync|webhook|publish|send to|external action)\b/.test(combined)) type = 'connected_action';
  else if (/\b(landing page|website|web app|prototype ui|html)\b/.test(combined)) type = 'html';
  else if (/\b(code|repository|api|typescript|deploy|architecture source)\b/.test(combined)) type = 'code';
  else if (/\b(deck|pitch|slides|presentation)\b/.test(combined)) type = 'deck';
  else if (/\b(email|outreach|campaign sequence|newsletter|messages)\b/.test(combined)) type = 'email';
  else if (/\b(sheet|spreadsheet|forecast|financial model|lead list|dataset|csv)\b/.test(combined)) type = 'sheet';
  else if (/\b(report|research|analysis|findings|assessment|validation study)\b/.test(combined)) type = 'report';
  else if (/\b(sheet|spreadsheet|csv)\b/.test(output)) type = 'sheet';
  return { type, label: LABELS[type], src: OPS_PREVIEW_IMAGES[type], alt: `Illustrative ${LABELS[type].toLowerCase()} preview` };
}
