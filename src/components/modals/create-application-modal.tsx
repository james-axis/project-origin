import { useState, useRef, useEffect } from "react";
import { X, Check, Plus } from "@untitledui/icons";
import { createPortal } from "react-dom";

const INSURERS = ["Acenda","AIA","AMP","Asteron Life","BT","ClearView","CommInsure","Encompass","Futura","Integrity Life","MetLife","NEOS","OnePath","PPS Mutual","Resolution Life","Sustainable Life","TAL","Zurich"];
const USERS = ["Auto assign","Adam Cowburn","Adrian Ranieri","Ali Jama","Ben Tutton","Biren Amin","Caitlin Gardiner","Dean Hines","Deon Locke","Ethan Fowler","Hope Lake","James Nicholls","John Rojas","Justin Carroll","Justin Turtle","Kam Rowshan","Katie Hally","Liam Larkins","Maysee Chang","Natasha Carlson","Nathaniel Elston","Rebel Servante","SLG Support","SLG Test Training","Sonny Lowe","Sumeet Wadhwa","Toni Smilevski","Wilson Chen"];
const ADMIN_USERS = ["Auto assign","Adam Cowburn","Adrian Ranieri","Audits Team","Ben Tutton","Caitlin Gardiner","Compliance","Dean Hines","Holly Barnes","Jas Cheema","John Rojas","Justin Carroll","Katie Hally","Lachlan Grant","LIP Support","Maysee Chang","Nicole Tasker","SLG Support","SLG Test Training","Sonny Lowe","Wilson Chen"];
const INSURANCE_TYPES = ["Life Insurance","Trauma Cover","TPD Cover","Income Protection","Child Cover","Business Cover","Severity Based Cover"];
const SUPER_OPTIONS = ["Outside","Inside","Inside/Outside"];
const INFORCE_OPTIONS = ["As soon as ready","Ask adviser","Specify date..."];

interface Props { onClose: () => void; clientName?: string; }

export function CreateApplicationModal({ onClose, clientName }: Props) {
  const [insurer, setInsurer] = useState("");
  const [preAssessment, setPreAssessment] = useState("");
  const [annualPremium, setAnnualPremium] = useState("");
  const [upfrontCommission, setUpfrontCommission] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState("");
  const [dateLodged, setDateLodged] = useState("");
  const [timeVR, setTimeVR] = useState("");
  const [adviser, setAdviser] = useState("Auto assign");
  const [admin, setAdmin] = useState("Auto assign");
  const [appType, setAppType] = useState<"new"|"renewal">("new");
  const [inSuper, setInSuper] = useState("Outside");
  const [smsf, setSmsf] = useState(false);
  const [cleanskin, setCleanskin] = useState<"yes"|"no">("no");
  const [medAuth, setMedAuth] = useState<"yes"|"no">("no");
  const [cancelExisting, setCancelExisting] = useState<"yes"|"no">("no");
  const [quotesUploaded, setQuotesUploaded] = useState<"yes"|"no">("no");
  const [docsUploaded, setDocsUploaded] = useState<"yes"|"no">("no");
  const [personalStatement, setPersonalStatement] = useState<"yes"|"no">("no");
  const [placeInforce, setPlaceInforce] = useState("As soon as ready");
  const [inforceDate, setInforceDate] = useState("");
  const [notes, setNotes] = useState("");

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function toggleType(t: string) {
    setSelectedTypes(prev => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });
  }

  const filteredTypes = INSURANCE_TYPES.filter(t => !typeFilter || t.toLowerCase().includes(typeFilter.toLowerCase()));

  const inputCls = "w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand transition-colors placeholder:text-quaternary";
  const selectCls = "w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer";
  const labelCls = "block text-xs font-medium text-tertiary mb-1";

  function RadioGroup({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
    return (
      <div className="flex gap-0 rounded-lg border border-secondary overflow-hidden">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={"flex-1 py-2 text-xs font-medium transition-colors " + (value === opt ? "bg-brand-solid text-white" : "bg-primary text-secondary hover:bg-secondary")}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  function YesNo({ value, onChange }: { value: "yes"|"no"; onChange: (v: "yes"|"no") => void }) {
    return (
      <div className="flex gap-0 rounded-lg border border-secondary overflow-hidden">
        {(["Yes","No"] as const).map(opt => (
          <button key={opt} onClick={() => onChange(opt.toLowerCase() as "yes"|"no")}
            className={"flex-1 py-1.5 text-xs font-medium transition-colors " + (value === opt.toLowerCase() ? "bg-brand-solid text-white" : "bg-primary text-secondary hover:bg-secondary")}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>

      <div ref={ref} className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl border border-secondary bg-primary shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary shrink-0">
          <div>
            <h2 className="text-base font-semibold text-primary" style={{ fontFamily:"'Metrophobic', sans-serif" }}>Create New Insurance Application</h2>
            {clientName && <p className="text-xs text-quaternary mt-0.5">For {clientName}</p>}
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg hover:bg-secondary text-quaternary">
            <X className="size-4"/>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          {/* Insurer */}
          <div>
            <label className={labelCls}>Insurer *</label>
            <select value={insurer} onChange={e => setInsurer(e.target.value)} className={selectCls}>
              <option value="">Please Select...</option>
              {INSURERS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          {/* Pre-assessment */}
          <div>
            <label className={labelCls}>Pre-assessment</label>
            <textarea value={preAssessment} onChange={e => setPreAssessment(e.target.value)}
              placeholder="Enter pre-assessment notes..." rows={3}
              className={inputCls + " resize-none"}/>
          </div>

          {/* Premium + Commission */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Annual Premium</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-quaternary">$</span>
                <input type="number" value={annualPremium} onChange={e => setAnnualPremium(e.target.value)}
                  placeholder="0.00" className={inputCls + " pl-6"}/>
              </div>
            </div>
            <div>
              <label className={labelCls}>Upfront Commission</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-quaternary">$</span>
                <input type="number" value={upfrontCommission} onChange={e => setUpfrontCommission(e.target.value)}
                  placeholder="0.00" className={inputCls + " pl-6"}/>
              </div>
            </div>
          </div>

          {/* Insurance Type */}
          <div>
            <label className={labelCls}>Insurance Type</label>
            <div className="rounded-xl border border-secondary overflow-hidden">
              <div className="px-3 py-2 border-b border-secondary bg-secondary_alt">
                <input value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  placeholder="Filter..." className="w-full bg-transparent text-sm text-primary outline-none placeholder:text-quaternary"/>
              </div>
              <div className="p-2 space-y-0.5">
                {filteredTypes.map(t => (
                  <button key={t} onClick={() => toggleType(t)}
                    className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-secondary_alt text-left transition-colors">
                    <div className={"flex size-4 shrink-0 items-center justify-center rounded border transition-colors " + (selectedTypes.has(t) ? "bg-brand-solid border-brand-solid" : "border-secondary bg-primary")}>
                      {selectedTypes.has(t) && <Check className="size-2.5 text-white"/>}
                    </div>
                    <span className="text-sm text-primary">{t}</span>
                  </button>
                ))}
              </div>
            </div>
            {selectedTypes.size > 0 && (
              <p className="text-xs text-brand-secondary mt-1.5 font-medium">Selected: {Array.from(selectedTypes).join(", ")}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Date Lodged</label>
              <input type="date" value={dateLodged} onChange={e => setDateLodged(e.target.value)} className={inputCls}/>
            </div>
            <div>
              <label className={labelCls}>Time of VR</label>
              <input type="time" value={timeVR} onChange={e => setTimeVR(e.target.value)} className={inputCls}/>
            </div>
          </div>

          {/* Adviser + Admin */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Adviser</label>
              <select value={adviser} onChange={e => setAdviser(e.target.value)} className={selectCls}>
                {USERS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Admin</label>
              <select value={admin} onChange={e => setAdmin(e.target.value)} className={selectCls}>
                {ADMIN_USERS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Application Type */}
          <div>
            <label className={labelCls}>Application Type</label>
            <RadioGroup value={appType === "new" ? "New App" : "Renewal"} onChange={v => setAppType(v === "New App" ? "new" : "renewal")} options={["New App","Renewal"]}/>
          </div>

          {/* In Super */}
          <div>
            <label className={labelCls}>Application within Superannuation</label>
            <RadioGroup value={inSuper} onChange={setInSuper} options={SUPER_OPTIONS}/>
          </div>

          {/* SMSF */}
          <div className="flex items-center gap-3">
            <button onClick={() => setSmsf(v => !v)}
              className={"flex size-5 shrink-0 items-center justify-center rounded border transition-colors " + (smsf ? "bg-brand-solid border-brand-solid" : "border-secondary bg-primary")}>
              {smsf && <Check className="size-3 text-white"/>}
            </button>
            <span className="text-sm text-primary">SMSF (Self-Managed Super Fund)</span>
          </div>

          {/* Yes/No grid */}
          <div className="grid grid-cols-2 gap-4">
            {([
              ["Cleanskin Application", cleanskin, (v: "yes"|"no") => setCleanskin(v)] as const,
              ["Medical Authority Required", medAuth, (v: "yes"|"no") => setMedAuth(v)] as const,
              ["Cancel Existing Cover", cancelExisting, (v: "yes"|"no") => setCancelExisting(v)] as const,
              ["Quotes Uploaded", quotesUploaded, (v: "yes"|"no") => setQuotesUploaded(v)] as const,
              ["Application Documents Uploaded", docsUploaded, (v: "yes"|"no") => setDocsUploaded(v)] as const,
              ["Personal Statement by Adviser", personalStatement, (v: "yes"|"no") => setPersonalStatement(v)] as const,
            ]).map(([label, val, fn]) => (
              <div key={label}>
                <label className={labelCls}>{label}</label>
                <YesNo value={val} onChange={fn}/>
              </div>
            ))}
          </div>

          {/* Place Inforce */}
          <div>
            <label className={labelCls}>Place Inforce</label>
            <RadioGroup value={placeInforce} onChange={setPlaceInforce} options={INFORCE_OPTIONS}/>
            {placeInforce === "Specify date..." && (
              <input type="date" value={inforceDate} onChange={e => setInforceDate(e.target.value)} className={inputCls + " mt-2"}/>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add notes..." rows={3}
              className={inputCls + " resize-none"}/>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-secondary bg-secondary_alt shrink-0">
          <p className="text-xs text-quaternary">* Required fields</p>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg border border-secondary bg-primary px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button
              onClick={() => { alert("Application created! (Demo — not connected to DB yet)"); onClose(); }}
              disabled={!insurer || selectedTypes.size === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="size-4"/> Create Application
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
