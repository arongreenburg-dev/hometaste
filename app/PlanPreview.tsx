'use client';
import {useEffect, useRef} from 'react';
import {briefSummary} from '../lib/room-brief';

export default function PlanPreview({data, selected, onClose}: {data: any; selected: number; onClose: () => void}) {
 const dialog = useRef<HTMLDialogElement>(null);
 useEffect(() => {dialog.current?.showModal();}, []);
 const direction = data.directions[selected];
 const concept = direction.concept;
 const money = (amount: number) => '$' + amount.toLocaleString();
 return <dialog ref={dialog} className="plan-preview" aria-labelledby="plan-preview-title" onClose={onClose}>
  <div className="print-actions"><button className="secondary" onClick={() => window.print()}>Print / save as PDF</button><button className="secondary" onClick={() => dialog.current?.close()}>Back to results</button></div>
  <p className="eyebrow">HOMETASTE · YOUR ROOM PLAN</p>
  <h2 id="plan-preview-title">{data.brief.room}: {data.focus.toLowerCase()}</h2>
  <p className="print-help">Read your plan here. To keep a copy, choose Print / save as PDF, then select your browser’s PDF or save option if available.</p>
  <p><strong>{data.people.join(' + ')} · Budget ceiling: {money(data.budget)}</strong></p>
  <h3>{direction.name} · {direction.title}</h3>
  <p>{direction.why}</p>
  <p>{briefSummary(data.brief)}</p>
  {concept ? <><h3>Your composition</h3><p>{concept.rationale}</p><div className="print-palette" aria-label="Illustrative palette">{concept.palette.map((color: string) => <span key={color} style={{background: color}}>{color}</span>)}</div>
   {concept.items.map((item: any) => <article key={item.name}><h3>{item.name} — {money(item.amount)} allowance</h3><p>{item.detail}</p></article>)}
   <p><strong>Unspent contingency: {money(concept.contingency)}</strong></p>
   <h3>Keep these constraints</h3>{concept.constraints.map((constraint: string) => <p key={constraint}>{constraint}</p>)}
   <h3>Current revision</h3><p>{concept.changes.join(' ')}</p><p>{concept.label}. Sketches and palettes are illustrative; furniture fit is not verified.</p>
  </> : data.plan.map((step: any) => <article key={step.title}><h3>{step.title} — {money(step.amount)}</h3><p>{step.detail}</p></article>)}
  <p>Planning allowances only. No actual product prices, stock, or local availability have been checked.</p>
  <h3>Qloo contribution</h3><p>{data.method}</p>
  <p>Generated {new Date(data.generatedAt).toLocaleString()}</p>
 </dialog>;
}
