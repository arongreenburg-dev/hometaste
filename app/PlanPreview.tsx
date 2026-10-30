'use client';
import {useEffect, useRef} from 'react';
import {Printer, X, TriangleAlert} from 'lucide-react';
import {briefSummary} from '../lib/room-brief';
import {preferenceLabels, type Preference} from '../lib/design-agent';

export default function PlanPreview({data, direction, stale, vetoNames, onClose}: {data: any; direction: any; stale: boolean; vetoNames: Record<string, string>; onClose: () => void}) {
 const dialog = useRef<HTMLDialogElement>(null);
 const heading = useRef<HTMLHeadingElement>(null);
 useEffect(() => {
  const el = dialog.current;
  if (!el) return;
  el.showModal();
  heading.current?.focus();
  const root = document.documentElement;
  const overflow = root.style.overflow;
  root.style.overflow = 'hidden';
  return () => { root.style.overflow = overflow; if (el.open) el.close(); };
 }, []);
 const concept = direction.concept;
 const prefs: Preference[] = data.request?.preferences ?? concept.preferences ?? [];
 const vetoes: string[] = data.request?.vetoes ?? [];
 const money = (amount: number) => '$' + amount.toLocaleString();
 return <dialog ref={dialog} className="plan-preview" aria-labelledby="plan-preview-title" onClose={onClose} onClick={e => {if (e.target === dialog.current) dialog.current?.close();}}>
  <div className="preview-inner">
   <div className="print-actions"><button type="button" className="primary compact" onClick={() => window.print()}><Printer size={16}/> Print / save as PDF</button><button type="button" className="secondary" onClick={() => dialog.current?.close()} aria-label="Close plan and return to results"><X size={16}/> Close</button></div>
   <p className="print-help">To keep a copy, choose Print / save as PDF, then pick your browser’s “Save as PDF” destination.</p>
   {stale && <p className="stale-print" role="note"><TriangleAlert size={16}/> <span><strong>Outdated plan:</strong> the brief was edited after this plan was generated. This document reflects the brief shown below, not the latest edits.</span></p>}
   <p className="eyebrow">HOMETASTE · ROOM PLAN</p>
   <h2 id="plan-preview-title" ref={heading} tabIndex={-1}>{data.brief.room}: {data.focus.toLowerCase()}</h2>
   <p><strong>{data.people.join(' + ')} · Budget ceiling {money(data.budget)}</strong></p>
   <h3>{direction.name} · {direction.title}</h3>
   <p>{direction.why}</p>
   <p>{briefSummary(data.brief)}</p>
   <p><strong>Adjustments:</strong> {prefs.length ? prefs.map(p => preferenceLabels[p]).join(' + ') : 'None (original brief)'}{vetoes.length ? ` · Hidden brands: ${vetoes.map(id => vetoNames[id] || 'one brand').join(', ')}` : ''}</p>
   <h3>Composition</h3>
   <p>{concept.rationale}</p>
   <div className="print-palette" aria-label="Illustrative palette">{concept.palette.map((color: string) => <span key={color}><i style={{background: color}}/>{color}</span>)}</div>
   <table className="print-table"><caption className="sr-only">Item allowances</caption><thead><tr><th scope="col">Item type</th><th scope="col">Allowance</th></tr></thead><tbody>
    {concept.items.map((item: any) => <tr key={item.role}><th scope="row"><strong>{item.name}</strong><span>{item.detail}</span></th><td>{money(item.amount)}</td></tr>)}
    <tr><th scope="row"><strong>Unspent contingency</strong><span>For tax, shipping, samples, or a change of direction.</span></th><td>{money(concept.contingency)}</td></tr>
   </tbody><tfoot><tr><th scope="row">Total (budget ceiling)</th><td>{money(data.budget)}</td></tr></tfoot></table>
   <h3>Kept in every revision</h3>{concept.constraints.map((c: string) => <p key={c}>{c}</p>)}
   {concept.needsApplied?.length > 0 && <><h3>Household needs applied</h3><ul>{concept.needsApplied.map((n: string) => <li key={n}>{n}</li>)}</ul></>}
   <h3>Revision notes</h3><ul>{concept.changes.map((c: string) => <li key={c}>{c}</li>)}</ul>
   <h3>Limits and Qloo contribution</h3>
   <p>{concept.label}. Palettes and sketches are illustrative; allowances are not retailer prices; stock and furniture fit are not verified.</p>
   <p>{data.method}</p>
   <p className="generated">Generated {new Date(data.generatedAt).toLocaleString()}</p>
  </div>
 </dialog>;
}
