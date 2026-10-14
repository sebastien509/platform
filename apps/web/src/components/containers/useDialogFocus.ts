import { useEffect, useRef } from 'react';
const FOCUSABLE='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
let lockCount=0;let priorOverflow='';
/** Shared scroll lock + focus containment. Keeps nested overlays from unlocking early. */
export function useDialogFocus(open:boolean,allowEscape:boolean,onEscape:()=>void){
 const ref=useRef<HTMLDivElement>(null);const escapeRef=useRef(onEscape);escapeRef.current=onEscape;
 useEffect(()=>{if(!open)return;const before=document.activeElement instanceof HTMLElement?document.activeElement:null;
 if(lockCount++===0){priorOverflow=document.body.style.overflow;document.body.style.overflow='hidden';}
 const el=ref.current;const focus=()=>{const first=el?.querySelector<HTMLElement>(FOCUSABLE);(first??el)?.focus();};focus();
 const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'&&allowEscape){e.preventDefault();escapeRef.current();return;}if(e.key!=='Tab'||!el)return;const items=Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(x=>x.getClientRects().length>0);if(!items.length){e.preventDefault();el.focus();return;}const first=items[0],last=items[items.length-1];if(e.shiftKey&&(document.activeElement===first||!el.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!el.contains(document.activeElement))){e.preventDefault();first.focus();}};
 document.addEventListener('keydown',onKey);return()=>{document.removeEventListener('keydown',onKey);if(--lockCount===0)document.body.style.overflow=priorOverflow;before?.focus();};},[open,allowEscape]);return ref;
}
