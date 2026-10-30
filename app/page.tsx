'use client';
import {useEffect, useRef, useState} from 'react';
import PlanPreview from './PlanPreview';
import {demoHouseholds} from '../lib/demo-households';
import {preferences as allPreferences, preferenceLabels, type Preference} from '../lib/design-agent';
import {rooms} from '../lib/room-brief';
import {BUDGET_MAX, BUDGET_MIN, briefChanged, briefKey, convertDimensions, createRequestGuard, describeConceptChanges, dimensionError, planRequest, resolveSelection, togglePreference, validateBudget, type BriefForm, type DimensionText, type Person, type PlanRequest, type Ref, type Unit} from '../lib/plan-state';
import {ArrowUpRight, ArrowRight, Check, X, House, SlidersHorizontal, RefreshCw, ChevronDown, Heart, Search, RotateCcw, Printer, TriangleAlert, Undo2, Sofa, BedDouble, UtensilsCrossed, Monitor} from 'lucide-react';

const defaults: Ref[] = [{id: 'E12201A5-CC50-40AF-97AE-C54A2CA303F7', name: 'Muji', type: 'brand'}, {id: '18D4B0BC-4E4F-4563-809C-1A4B0AC9D39C', name: 'West Elm', type: 'brand'}];
const blankDimensions: DimensionText = {length: '', width: '', height: ''};

// Hero illustration only: a generic living room, never used to depict a result.
function Room({colors = ['#c8bca6', '#ede5d7', '#7e8b77', '#f7f2e9']}: {colors?: string[]}) {return <svg className="room" viewBox="0 0 640 470" role="img" aria-label="Illustrated living room with a sofa, floor lamp, art, and natural colors"><defs><linearGradient id={'wall' + colors[0].slice(1)} x2="0" y2="1"><stop stopColor={colors[3]}/><stop offset="1" stopColor={colors[1]}/></linearGradient></defs><path d="M0 0h640v470H0z" fill={colors[3]}/><path d="M0 340h640v130H0z" fill={colors[0]} opacity=".4"/><path d="M490 0v340M0 340h640" stroke={colors[0]} strokeWidth="2" opacity=".5"/><path d="M40 32h150v233H40z" fill="#fffaf1"/><path d="M45 35h140v225H45z" fill="#d9dfd1"/><path d="M112 35v225M45 140h140" stroke={colors[3]} strokeWidth="7"/><path d="M40 265l176 75h240L185 140v125z" fill="#fffaf1" opacity=".3"/><ellipse cx="329" cy="409" rx="242" ry="38" fill={colors[1]}/><rect x="239" y="61" width="118" height="146" fill={colors[0]}/><rect x="247" y="69" width="102" height="130" fill={colors[3]}/><path d="M261 176q5-93 50-86q43 13 13 86" fill={colors[2]}/><circle cx="289" cy="117" r="17" fill={colors[0]}/><path d="M147 311q0-51 35-51h211q32 0 32 51v67H147z" fill={colors[2]}/><rect x="162" y="298" width="249" height="62" rx="14" fill={colors[2]}/><rect x="133" y="317" width="35" height="68" rx="12" fill={colors[2]}/><rect x="399" y="317" width="35" height="68" rx="12" fill={colors[2]}/><path d="M158 385v20m251-20v20" stroke="#545246" strokeWidth="7"/><path d="M191 282l40 3l-2 44l-43-5z" fill={colors[1]}/><path d="M349 286l37-6l9 43l-39 7z" fill={colors[0]}/><ellipse cx="300" cy="387" rx="75" ry="20" fill="#756048"/><path d="M251 391l-8 49m107-49l8 49" stroke="#756048" strokeWidth="7"/><ellipse cx="301" cy="384" rx="75" ry="18" fill={colors[0]}/><path d="M473 370V180" stroke="#655d4e" strokeWidth="5"/><path d="M440 181l11-63h45l12 63z" fill={colors[1]} stroke={colors[0]}/><ellipse cx="473" cy="374" rx="26" ry="5" fill="#655d4e"/><path d="M548 336v-90m0 40q-49-42-33-68q34 2 33 68m0-17q42-48 48-23q5 27-48 23" fill={colors[2]} stroke={colors[2]} strokeWidth="4"/><path d="M523 329h51l-7 50h-37z" fill={colors[0]}/></svg>}

const roomIcons: Record<string, typeof Sofa> = {'Living room': Sofa, Bedroom: BedDouble, 'Dining room': UtensilsCrossed, 'Home office': Monitor};

// Palette and material board: an abstract composition of the direction's colors and finish character, not a room reconstruction.
function MaterialBoard({palette, style, room}: {palette: string[]; style: string; room: string}) {
 const Icon = roomIcons[room] || Sofa;
 const [main, mid, accent, ground] = palette;
 return <div className="material-board">
  <svg viewBox="0 0 320 180" role="img" aria-label={`Illustrative ${style} palette and material board for a ${room.toLowerCase()}; not a picture of your room or of products`}>
   <rect width="320" height="180" fill={ground}/>
   <rect x="16" y="16" width="150" height="148" rx="4" fill={main}/>
   {style === 'natural' && <path d="M24 40q60 12 134 0M24 70q60 14 134 0M24 100q60 10 134 0M24 130q60 14 134 0" stroke={ground} strokeOpacity=".45" strokeWidth="2" fill="none"/>}
   {style === 'expressive' && <path d="M40 164v-58a51 51 0 0 1 102 0v58z" fill={accent} opacity=".85"/>}
   {style === 'streamlined' && <path d="M16 64h150M16 112h150M90 16v148" stroke={ground} strokeOpacity=".5" strokeWidth="1.5"/>}
   <rect x="178" y="16" width="126" height="70" rx="4" fill={mid}/>
   <path d="M178 40h126M178 62h126" stroke={ground} strokeOpacity=".5" strokeWidth={style === 'natural' ? 3 : 1}/>
   <circle cx="214" cy="126" r="36" fill={accent}/>
   <rect x="262" y="96" width="42" height="68" rx={style === 'expressive' ? 21 : 4} fill={main} stroke={accent} strokeWidth="2"/>
  </svg>
  <span className="board-room"><Icon size={14} aria-hidden="true"/> {room} · palette board</span>
 </div>;
}

function TastePerson({person, index, onChange}: {person: Person; index: number; onChange: (p: Person) => void}) {
 const [query, setQuery] = useState('');
 const [results, setResults] = useState<Ref[]>([]);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [status, setStatus] = useState('');
 const guard = useRef(createRequestGuard());
 const input = useRef<HTMLInputElement>(null);
 const label = person.name.trim() || `Person ${index + 1}`;
 const full = person.entities.length >= 3;
 async function search() {
  const q = query.trim();
  if (q.length < 2) return;
  const request = guard.current.start();
  setBusy(true); setError(''); setStatus('');
  try {
   const r = await fetch('/api/search?q=' + encodeURIComponent(q));
   const d: any = await r.json();
   if (!request.isCurrent()) return;
   if (!r.ok) throw Error(d.error || 'Search failed. Please try again.');
   setResults(d.results);
   if (!d.results.length) setError(`No matches for “${q}”. Try a specific brand, artist, film, or book title.`);
  } catch (e: any) {
   if (request.isCurrent()) setError(e.message || 'Search failed. Check your connection and try again.');
  } finally {
   if (request.isCurrent()) setBusy(false);
  }
 }
 function add(r: Ref) {
  if (!person.entities.some(e => e.id === r.id)) onChange({...person, entities: [...person.entities, r].slice(0, 3)});
  setStatus(`Added ${r.name} to ${label}’s taste.`);
  setResults([]); setQuery('');
  input.current?.focus();
 }
 return <div className="person">
  <div className="person-heading"><span className={'avatar a' + index}>{index === 0 ? '01' : '02'}</span><label className="name-field"><span className="sr-only">Person {index + 1} name</span><input maxLength={40} value={person.name} onChange={e => onChange({...person, name: e.target.value})}/></label><span className="muted">{person.entities.length}/3 favorites</span></div>
  <ul className="refs" aria-label={`${label}’s taste references`}>
   {person.entities.map(e => <li className="chip" key={e.id}><span>{e.name}<small>{e.type.replace(/_/g, ' ')}</small></span><button type="button" aria-label={`Remove ${e.name} from ${label}`} onClick={() => {onChange({...person, entities: person.entities.filter(x => x.id !== e.id)}); setStatus(`Removed ${e.name}.`);}}><X size={14}/></button></li>)}
   {!person.entities.length && <li className="empty-ref">Add at least one favorite for {label}.</li>}
  </ul>
  {full ? <p className="helper tight">Three favorites chosen. Remove one to add another.</p> :
   <form className="search" role="search" onSubmit={e => {e.preventDefault(); search();}}>
    <label className="sr-only" htmlFor={`search-${index}`}>Search taste references for {label}</label>
    <input id={`search-${index}`} ref={input} placeholder="Search a brand, artist, film, or book" value={query} maxLength={100} onChange={e => {guard.current.invalidate(); setBusy(false); setResults([]); setQuery(e.target.value); setError('');}}/>
    <button type="submit" disabled={busy || query.trim().length < 2}>{busy ? <RefreshCw size={15} className="spin" aria-hidden="true"/> : <Search size={15} aria-hidden="true"/>}{busy ? 'Searching…' : 'Search'}</button>
   </form>}
  {error && <p className="field-error" role="alert">{error}</p>}
  <p className="sr-only" role="status">{busy ? 'Searching Qloo…' : status}</p>
  {results.length > 0 && <div className="search-results" aria-label={`Qloo matches for ${label}`}>
   {results.map(r => {const added = person.entities.some(e => e.id === r.id); return <button type="button" key={r.id} disabled={added} onClick={() => add(r)}><strong>{r.name}</strong><small>{r.type.replace(/_/g, ' ')}</small><span className="pick">{added ? <><Check size={13}/> Added</> : 'Add'}</span></button>;})}
   <button type="button" className="dismiss-results" onClick={() => setResults([])}>Close results</button>
  </div>}
 </div>;
}

function ItemSketch({role, color}: {role: string; color: string}) {return <svg viewBox="0 0 180 120" role="img" aria-label={role + ' item-type sketch, not a product image'}><rect width="180" height="120" fill="#f3f0e8"/>{/Light|Main|Layer/.test(role) ? <><path d="M65 50l9-27h32l9 27z" fill={color}/><path d="M90 50v45m-21 0h42" stroke="#6c6658" strokeWidth="4"/></> : /Texture/.test(role) ? <><path d="M40 28h100l-9 65H32z" fill={color}/><path d="M40 43h96M37 61h96M35 79h96" stroke="#faf6ec" strokeWidth="3"/></> : <><rect x="50" y="45" width="80" height="47" rx="9" fill={color}/><path d="M64 45q25-29 51 0" fill="none" stroke="#766b59" strokeWidth="4"/></>}</svg>}

type Busy = null | 'new' | 'refine' | 'veto';
type Attempt = {request: PlanRequest; kind: Exclude<Busy, null>};

export default function Home() {
 const [searchEpoch, setSearchEpoch] = useState(0);
 const [people, setPeople] = useState<Person[]>([{name: 'Alex', entities: [defaults[0]]}, {name: 'Jordan', entities: [defaults[1]]}]);
 const [room, setRoom] = useState('Living room');
 const [unit, setUnit] = useState<Unit>('ft');
 const [dimensions, setDimensions] = useState<DimensionText>(blankDimensions);
 const [keep, setKeep] = useState('');
 const [needs, setNeeds] = useState('');
 const [focus, setFocus] = useState('Room refresh');
 const [budget, setBudget] = useState(1500);
 const [budgetText, setBudgetText] = useState('1500');
 const [interview, setInterview] = useState(false);
 const [showMeasurements, setShowMeasurements] = useState(false);
 const [demo, setDemo] = useState<{label: string; key: string} | null>(null);
 const [data, setData] = useState<any>(null);
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const [busy, setBusy] = useState<Busy>(null);
 const [error, setError] = useState<{message: string; attempt: Attempt} | null>(null);
 const [announcement, setAnnouncement] = useState('');
 const [changeNotes, setChangeNotes] = useState<string[]>([]);
 const [vetoNames, setVetoNames] = useState<Record<string, string>>({});
 const [preview, setPreview] = useState(false);
 const guard = useRef(createRequestGuard());
 const controller = useRef<AbortController | null>(null);
 const freshStart = useRef(false);
 const previewOpener = useRef<HTMLElement | null>(null);

 const form: BriefForm = {people, room, focus, budget, unit, dimensions, keep, needs};
 const budgetCheck = validateBudget(budgetText);
 const dimError = dimensionError(unit, dimensions);
 const missingTaste = people.find(p => !p.entities.length);
 const blocker = missingTaste ? `Add at least one favorite for ${missingTaste.name.trim() || 'each person'}.` : budgetCheck.error || dimError || '';
 const applied: PlanRequest | undefined = data?.request;
 const stale = briefChanged(form, applied) || (!!applied && !!budgetCheck.error);
 const demoEdited = !!demo && briefKey(planRequest(form)) !== demo.key;
 const directions: any[] = data?.directions ?? [];
 const direction = directions.find(d => d.id === selectedId) ?? directions[0];
 const concept = direction?.concept;
 const activePrefs: Preference[] = applied?.preferences ?? [];
 const step = !data ? 1 : 2;

 useEffect(() => () => controller.current?.abort(), []);

 async function run(attempt: Attempt) {
  const request = guard.current.start();
  controller.current?.abort();
  const abort = new AbortController();
  controller.current = abort;
  setBusy(attempt.kind); setError(null);
  setAnnouncement(attempt.kind === 'new' ? 'Finding your common ground with live Qloo results…' : 'Updating your plan…');
  try {
   const r = await fetch('/api/plan', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(attempt.request), signal: abort.signal});
   const d: any = await r.json().catch(() => ({error: 'The server returned an unreadable response. Please try again.'}));
   if (!request.isCurrent()) return;
   if (!r.ok) throw Error(d.error || `Request failed (${r.status}). Please try again.`);
   const firstResult = !data;
   const {id, lost} = resolveSelection(selectedId, d.directions);
   const previous = data?.directions.find((x: any) => x.id === id)?.concept;
   const next = d.directions.find((x: any) => x.id === id)?.concept;
   const notes = attempt.kind === 'refine' ? describeConceptChanges(previous, next) : [];
   const lostName = lost && selectedId ? (vetoNames[selectedId] || data?.directions.find((x: any) => x.id === selectedId)?.name || 'Your previous direction') : '';
   setData({...d, request: attempt.request});
   setSelectedId(id);
   setChangeNotes(notes);
   setAnnouncement(
    attempt.kind === 'refine' ? `Plan updated. ${next?.changes.join(' ') ?? ''}` :
    lostName ? `${lostName} is no longer available, so ${d.directions[0]?.name ?? 'no direction'} is selected.` :
    `${d.directions.length} directions ready.`);
   if (firstResult || attempt.kind === 'veto' || lostName || attempt.kind === 'new') {
    requestAnimationFrame(() => {
     const heading = document.getElementById('directions-heading');
     heading?.scrollIntoView({behavior: 'smooth', block: 'start'});
     heading?.focus({preventScroll: true});
    });
   }
  } catch (e: any) {
   if (!request.isCurrent() || e?.name === 'AbortError') return;
   setError({message: e?.message && e.message !== 'Failed to fetch' ? e.message : 'Could not reach HomeTaste. Check your connection and try again.', attempt});
   setAnnouncement('');
  } finally {
   if (request.isCurrent()) setBusy(null);
  }
 }

 function generateFromBrief() {
  const keepRefinements = !freshStart.current;
  freshStart.current = false;
  run({kind: 'new', request: planRequest(form, keepRefinements ? applied?.preferences : [], keepRefinements ? applied?.vetoes : [])});
 }
 // Refinements apply to the plan on screen; edits to the brief wait for "Update plan".
 function refine(prefs: Preference[]) { if (applied) run({kind: 'refine', request: {...applied, preferences: prefs}}); }
 function veto(id: string, name: string) {
  if (!applied) return;
  setVetoNames(v => ({...v, [id]: name}));
  run({kind: 'veto', request: {...applied, vetoes: [...applied.vetoes, id]}});
 }
 function restore(id: string) { if (applied) run({kind: 'veto', request: {...applied, vetoes: applied.vetoes.filter(v => v !== id)}}); }

 function loadDemo(id: string) {
  const d = demoHouseholds.find(x => x.id === id);
  if (!d) return;
  guard.current.invalidate(); controller.current?.abort(); setBusy(null); setError(null); setSearchEpoch(v => v + 1);
  const next: BriefForm = {people: JSON.parse(JSON.stringify(d.people)), room: d.room, focus: d.focus, budget: d.budget, unit: 'ft', dimensions: {...d.dimensions}, keep: d.keep, needs: d.needs};
  setPeople(next.people); setRoom(next.room); setFocus(next.focus); setBudget(next.budget); setBudgetText(String(next.budget));
  setUnit('ft'); setDimensions(next.dimensions); setKeep(next.keep); setNeeds(next.needs); setInterview(!!next.needs); setShowMeasurements(true);
  freshStart.current = true;
  setDemo({label: d.label, key: briefKey(planRequest(next))});
  requestAnimationFrame(() => document.getElementById('brief-heading')?.scrollIntoView({behavior: 'smooth', block: 'start'}));
 }
 function startOwn() {
  guard.current.invalidate(); controller.current?.abort(); setBusy(null); setError(null); setSearchEpoch(v => v + 1);
  setPeople([{name: 'Person 1', entities: []}, {name: 'Person 2', entities: []}]);
  setRoom('Living room'); setFocus('Room refresh'); setUnit('ft'); setDimensions(blankDimensions); setKeep(''); setNeeds(''); setBudget(1500); setBudgetText('1500');
  freshStart.current = true; setDemo(null);
  requestAnimationFrame(() => document.getElementById('search-0')?.focus());
 }

 function openPreview(e: React.MouseEvent<HTMLElement>) { previewOpener.current = e.currentTarget; setPreview(true); }
 function closePreview() { setPreview(false); requestAnimationFrame(() => previewOpener.current?.focus()); }

 const updateLabel = !data ? 'Find our common ground' : stale ? 'Update plan with these changes' : 'Refresh live results';
 const steps = [{href: '#brief', label: 'Your brief'}, {href: '#directions', label: 'Compare directions'}, {href: '#refine', label: 'Refine and keep your plan'}];
 const money = (n: number) => '$' + n.toLocaleString();

 return <>
  <header className="nav"><a className="wordmark" href="/"><span className="brand-icon"><House size={19} strokeWidth={1.5}/></span>HomeTaste<span className="beta">BETA</span></a><a href="#how">How it works <ArrowUpRight size={14}/></a></header>
  <nav className="stepper" aria-label="Your progress"><ol>{steps.map((s, i) => {
   const n = i + 1; const available = n === 1 || !!data; const done = n === 1 && !!data;
   return <li key={s.href} className={(done ? 'done ' : '') + (available ? '' : 'locked')}>{available ? <a href={s.href} aria-current={n === step ? 'step' : undefined}><span>{done ? <Check size={12}/> : n}</span>{s.label}</a> : <span aria-disabled="true"><span>{n}</span>{s.label}</span>}</li>;
  })}</ol></nav>
  <main>
   <section className="hero"><div className="hero-copy"><p className="eyebrow"><span/> A LITTLE MORE YOU. A LITTLE MORE US.</p><h1>Different tastes.<br/>One <em>happy home.</em></h1><p className="intro">Turn the things you both love into a room you can agree on. Find your common ground before you buy a thing.</p><a className="text-link" href="#samples">Try a sample household <ArrowRight size={17}/></a><div className="hero-note"><span className="tiny-avatars">A<span>J</span></span><p>Two perspectives.<br/><strong>A place that feels like both of you.</strong></p></div></div><div className="hero-art"><Room/><span className="art-label">ILLUSTRATION</span><div className="floating-note"><span><Check size={14}/></span> A little common ground goes a long way.</div></div></section>

   <section className="demo-panel" id="samples" aria-labelledby="samples-heading"><div><p className="eyebrow">TRY IT WITHOUT PERSONAL DATA</p><h2 id="samples-heading">Start with a sample household.</h2><p>Fictional people and rooms, real Qloo taste references, live recommendations. Or <button type="button" className="inline-link" onClick={startOwn}>start with your own household</button>.</p></div>
    <div className="demo-options">{demoHouseholds.map(d => <button type="button" key={d.id} aria-pressed={demo?.label === d.label} onClick={() => loadDemo(d.id)}><strong>{d.label} {demo?.label === d.label ? <Check size={15}/> : <ArrowUpRight size={15}/>}</strong><span>{d.description}</span></button>)}</div>
   </section>

   <section className="workspace" id="brief" aria-labelledby="brief-heading">
    <div className="section-heading"><div><p className="eyebrow">STEP 1 OF 3</p><h2 id="brief-heading">Your brief.</h2></div><p>A few favorites, the room, and a budget.<br/>Everything else is optional.</p></div>
    {demo && <p className={'source-badge' + (demoEdited ? ' edited' : '')} role="status"><strong>{demoEdited ? 'Edited sample' : 'Sample household'}:</strong> {demo.label}. {demoEdited ? 'Your edits replace some fictional details.' : 'Fictional people and room — edit anything, then find your common ground.'}</p>}
    <div className="brief-grid">
     <div className="taste-box"><div className="box-label"><Heart size={16}/><h3>What feels like you?</h3></div><p className="helper">Up to three favorites each — brands, music, films, and books all work as taste signals.</p>
      <div className="people">{people.map((person, i) => <TastePerson key={`${searchEpoch}-${i}`} person={person} index={i} onChange={p => setPeople(ps => ps.map((x, j) => j === i ? p : x))}/>)}</div>
     </div>
     <div className="room-box"><div className="box-label"><SlidersHorizontal size={16}/><h3>Your room, your rules.</h3></div>
      <div className="field-row">
       <label>Room<select value={room} onChange={e => setRoom(e.target.value)}>{rooms.map(r => <option key={r}>{r}</option>)}</select></label>
       <label>Goal<select value={focus} onChange={e => setFocus(e.target.value)}><option>Room refresh</option><option>Lighting</option></select></label>
      </div>
      <div className="budget-field">
       <label htmlFor="budget-amount">Total budget</label>
       <div className="budget-input"><span aria-hidden="true">$</span><input id="budget-amount" inputMode="numeric" aria-describedby="budget-help" aria-invalid={!!budgetCheck.error} value={budgetText} onChange={e => {setBudgetText(e.target.value); const v = validateBudget(e.target.value); if (v.value) setBudget(v.value);}} onBlur={() => {if (budgetCheck.value) setBudgetText(String(budgetCheck.value));}}/></div>
       <input aria-label="Budget slider" type="range" min={BUDGET_MIN} max={10000} step={100} value={Math.min(budget, 10000)} onChange={e => {setBudget(Number(e.target.value)); setBudgetText(e.target.value);}}/>
       <div className="range-labels" id="budget-help"><span>$100</span><span>Type up to $50,000</span></div>
       {budgetCheck.error && <p className="field-error">{budgetCheck.error}</p>}
      </div>
      <label>Furniture to keep <span className="optional">optional</span><textarea maxLength={1000} value={keep} placeholder="e.g. our blue sofa, oak table" onChange={e => setKeep(e.target.value)}/></label>
      <details className="optional-details" open={showMeasurements} onToggle={e => setShowMeasurements(e.currentTarget.open)}>
       <summary>Room measurements <span className="optional">optional</span><ChevronDown size={15}/></summary>
       <fieldset className="measurements"><legend className="sr-only">Room measurements</legend>
        <label>Units<select value={unit} onChange={e => {const next = e.target.value as Unit; setDimensions(convertDimensions(dimensions, next)); setUnit(next);}}><option value="ft">Feet</option><option value="m">Meters</option></select></label>
        <div className="dimension-fields">{(['length', 'width', 'height'] as const).map(axis => <label key={axis}>{axis} ({unit})<input type="number" inputMode="decimal" min="0.01" max={unit === 'ft' ? 300 : 100} step="any" value={dimensions[axis]} onChange={e => setDimensions({...dimensions, [axis]: e.target.value})}/></label>)}</div>
        {dimError ? <p className="field-error">{dimError}</p> : <p className="helper tight">Leave unknowns blank. Measurements alone can’t confirm furniture fit.</p>}
       </fieldset>
      </details>
      <button type="button" className="secondary interview-toggle" aria-expanded={interview} aria-controls="interview" onClick={() => setInterview(!interview)}>{interview ? 'Hide household needs' : needs ? 'Edit household needs' : 'Add household needs (optional interview)'}<ChevronDown size={15} className={interview ? 'flip' : ''}/></button>
      {interview && <div className="interview" id="interview"><label>What does your household need from this {room.toLowerCase()}?<textarea maxLength={1000} value={needs} placeholder="Pets, children, reading, video calls, glare, clear paths, no large furniture…" onChange={e => setNeeds(e.target.value)}/></label><p className="helper tight">Optional — skip anytime; your answers stay. HomeTaste acts on pets/children, reading, glare, video calls, warm light, clear paths, and compact space. Other notes are kept but not interpreted.</p><button type="button" className="secondary" onClick={() => setInterview(false)}>Done</button></div>}
      {data && stale && <p className="stale-note"><TriangleAlert size={15}/> Your brief changed since the plan below was made.</p>}
      <button type="button" className="primary" disabled={!!busy || !!blocker} aria-describedby="primary-help" onClick={() => {if (!stale && data) document.getElementById('directions-heading')?.scrollIntoView({behavior: 'smooth'}); else generateFromBrief();}}>{busy === 'new' ? <><RefreshCw size={17} className="spin"/> Finding your common ground…</> : !stale && data ? <>See your directions <ArrowRight size={17}/></> : <>{updateLabel} <ArrowRight size={17}/></>}</button>
      <p className="under-button" id="primary-help">{blocker || 'Live Qloo taste signals. Only taste-reference IDs are sent to Qloo; nothing is stored.'}</p>
      {error && error.attempt.kind === 'new' && <div role="alert" className="error"><p>{error.message}{data ? ' Your previous plan is still shown below.' : ''}</p><button type="button" className="secondary" onClick={() => run(error.attempt)}><RotateCcw size={14}/> Try again</button></div>}
     </div>
    </div>
   </section>

   <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

   {data && <section id="directions" className={'results' + (busy && busy !== 'new' ? ' updating' : '')} aria-labelledby="directions-heading" aria-busy={!!busy}>
    <div className="section-heading"><div><p className="eyebrow">STEP 2 OF 3</p><h2 id="directions-heading" tabIndex={-1}>Compare {data.brief.room.toLowerCase()} directions.</h2></div><span className="live-badge"><span/> Live Qloo results · {data.counts[0]} + {data.counts[1]} brands</span></div>
    {stale && <div className="stale-banner" role="status"><TriangleAlert size={18}/><div><strong>Inputs changed — update plan.</strong><p>These directions reflect your previous brief. Refinements below still apply to this version.</p></div><button type="button" className="primary compact" disabled={!!busy || !!blocker} onClick={generateFromBrief}>{busy === 'new' ? 'Updating…' : 'Update plan'}</button></div>}
    {error && error.attempt.kind !== 'new' && <div role="alert" className="error"><p>{error.message} Your plan and selections are unchanged.</p><button type="button" className="secondary" onClick={() => run(error.attempt)}><RotateCcw size={14}/> Try again</button></div>}
    <p className="result-intro">Pick the direction that feels most like both of you. Each card shows where the brand ranked in each person’s Qloo list.</p>
    {!directions.length ? <p className="error">No directions remain. Restore a hidden brand below or try other taste references.</p> : <>
     {!directions.some(d => d.ranks.every(Boolean)) && <p className="overlap-note">No brand appeared in both top-20 lists. These directions represent different sides of your household — use the tags to find a compromise.</p>}
     <div className="direction-grid" role="radiogroup" aria-label="Directions">{directions.map((d, i) => {const chosen = d.id === direction?.id; return <article key={d.id} className={'direction ' + (chosen ? 'chosen' : '')}>
      <button type="button" className="select-direction" disabled={!!busy} role="radio" aria-checked={chosen} aria-labelledby={`dir-${d.id}`} aria-describedby={`why-${d.id}`} onClick={() => {setSelectedId(d.id); setChangeNotes([]);}}>
       <div className="direction-art"><MaterialBoard palette={d.palette} style={d.concept.style} room={data.brief.room}/><span className="option-label">{i === 0 ? (d.ranks.every(Boolean) ? 'BEST SHARED RANKING' : 'TOP DISCOVERY') : 'ANOTHER POSSIBILITY'}</span></div>
       <div className="direction-body"><span className="number">DIRECTION 0{i + 1} · {d.concept.style.toUpperCase()}</span><h3 id={`dir-${d.id}`}>{d.name}<span className="radio">{chosen && <Check size={12}/>}</span></h3><p className="direction-title">{d.title}</p><p className="why" id={`why-${d.id}`}>{d.why}</p></div>
      </button>
      <details><summary>Qloo tags and tradeoff <ChevronDown size={14}/></summary>{d.description && <p>{d.description}</p>}<div className="tags">{d.tags.map((t: string) => <span key={t}>{t}</span>)}</div><p>{d.tradeoff}</p></details>
      <button type="button" className="veto" disabled={!!busy} onClick={() => veto(d.id, d.name)}><X size={14}/> Not us — hide this brand</button>
     </article>;})}</div>
    </>}
    {!!applied?.vetoes.length && <div className="hidden-brands"><strong>Hidden brands:</strong>{applied.vetoes.map(id => <button type="button" key={id} className="chip-button" disabled={!!busy} onClick={() => restore(id)}><Undo2 size={13}/> {vetoNames[id] || 'Hidden brand'} — restore</button>)}</div>}

    {concept && <section id="refine" className="composition" aria-labelledby="refine-heading">
     <div className="section-heading"><div><p className="eyebrow">STEP 3 OF 3</p><h2 id="refine-heading">Refine and keep your plan: {direction.name}.</h2></div></div>
     <p className="lead">{concept.rationale}</p>
     <div className="revision"><h3>Make it work better for us.</h3><p className="helper tight">Combine as many as you like. Your room, kept furniture, needs, and budget ceiling stay in place.</p>
      <div>{allPreferences.map(p => {const on = activePrefs.includes(p); return <button type="button" className="secondary toggle" key={p} disabled={!!busy} aria-pressed={on} onClick={() => refine(togglePreference(activePrefs, p))}>{on && <Check size={14}/>}{preferenceLabels[p]}</button>;})}
       <button type="button" className="text-button" disabled={!!busy || !activePrefs.length} onClick={() => refine([])}><RotateCcw size={14}/> Reset to original brief</button></div>
      <div className="change-log" aria-live="off">
       <p><strong>Active:</strong> {activePrefs.length ? activePrefs.map(p => preferenceLabels[p]).join(' + ') : 'None — original brief'}{busy === 'refine' && <span className="updating-label"> · Updating…</span>}</p>
       <ul>{concept.changes.map((c: string) => <li key={c}>{c}</li>)}</ul>
       {changeNotes.length > 0 && <><p><strong>What changed just now:</strong></p><ul>{changeNotes.map(c => <li key={c}>{c}</li>)}</ul></>}
      </div>
     </div>
     <div className="item-board">{concept.items.map((item: any, i: number) => <article key={item.role}><ItemSketch role={item.role} color={concept.palette[i]}/><small>{item.role}</small><h3>{item.name}</h3><p>{item.detail}</p><strong>{money(item.amount)} allowance</strong></article>)}</div>
     <div className="plan-summary">
      <div className="preserve"><strong>Kept in every revision</strong>{concept.constraints.map((c: string) => <p key={c}>{c}</p>)}
       {concept.needsApplied.length > 0 ? <><strong>Household needs applied</strong><ul>{concept.needsApplied.map((n: string) => <li key={n}>{n}</li>)}</ul></> : data.brief.needs ? <p><em>No supported needs keywords matched; your notes are kept but not interpreted.</em></p> : null}
      </div>
      <div className="budget-table"><table><caption>Budget allowances</caption><tbody>{concept.items.map((item: any) => <tr key={item.role}><th scope="row">{item.name}</th><td>{money(item.amount)}</td></tr>)}<tr><th scope="row">Unspent contingency</th><td>{money(concept.contingency)}</td></tr></tbody><tfoot><tr><th scope="row">Budget ceiling</th><td>{money(data.budget)}</td></tr></tfoot></table>
       <button type="button" className="primary" onClick={openPreview}><Printer size={16}/> View and print plan</button>
       {stale && <p className="helper tight">This plan uses your previous brief; the printout will say so.</p>}
      </div>
     </div>
     <details className="method"><summary>Limits, planning steps, and Qloo evidence <ChevronDown size={15}/></summary>
      <p><strong>What this is:</strong> {concept.label}. Boards and sketches show palettes and item types, not your room or real products. Allowances are not retailer prices; stock and fit are not checked.</p>
      <p>{data.method}</p>
      {data.agentTrace.map((t: any, i: number) => <p key={t.step}><strong>{i + 1}. {t.step}:</strong> {t.detail}</p>)}
      <p>Qloo returned {data.counts[0]} brands for {data.people[0]} and {data.counts[1]} for {data.people[1]}. Revisions apply explicit HomeTaste rules; no LLM is used. Generated {new Date(data.generatedAt).toLocaleString()}.</p>
     </details>
    </section>}
   </section>}

   <section className="how" id="how"><div><p className="eyebrow">LESS SECOND-GUESSING. MORE COMMON GROUND.</p><h2>A shared home starts<br/>with a little understanding.</h2></div><div className="how-steps"><p><span>01</span><strong>Bring your favorites.</strong> A few things each of you loves.</p><p><span>02</span><strong>Compare directions.</strong> Qloo connects each person’s taste to home brands; HomeTaste favors the overlap.</p><p><span>03</span><strong>Refine and keep your plan.</strong> Combine adjustments, hide brands, and print it.</p></div></section>
  </main>
  <footer><a className="wordmark" href="/">HomeTaste</a><p>Made for the space you share.</p><span>Taste intelligence by <strong>Qloo</strong></span></footer>
  {preview && direction && <PlanPreview data={data} direction={direction} stale={stale} vetoNames={vetoNames} onClose={closePreview}/>}
 </>;
}
