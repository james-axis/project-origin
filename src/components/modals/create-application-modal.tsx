import { useState, useRef, useEffect } from "react";
import { X, Check, ChevronRight, ChevronLeft } from "@untitledui/icons";
import { createPortal } from "react-dom";

const INSURERS = ["Acenda","AIA","AMP","Asteron Life","BT","ClearView","CommInsure","Encompass","Futura","Integrity Life","MetLife","NEOS","OnePath","PPS Mutual","Resolution Life","Sustainable Life","TAL","Zurich"];
const USERS = ["Auto assign","Adam Cowburn","Adrian Ranieri","Ben Tutton","Caitlin Gardiner","Dean Hines","Hope Lake","James Nicholls","John Rojas","Justin Carroll","Justin Turtle","Kam Rowshan","Katie Hally","Maysee Chang","Natasha Carlson","Rebel Servante","SLG Support","SLG Test Training","Sonny Lowe","Sumeet Wadhwa","Toni Smilevski","Wilson Chen"];
const ADMIN_USERS = ["Auto assign","Audits Team","Caitlin Gardiner","Compliance","Holly Barnes","Jas Cheema","John Rojas","Justin Carroll","Katie Hally","Lachlan Grant","LIP Support","Maysee Chang","Nicole Tasker","SLG Support","SLG Test Training","Sonny Lowe","Wilson Chen"];
const INSURANCE_TYPES = [
  { id:"life",     label:"Life Insurance"      },
  { id:"trauma",   label:"Trauma Cover"        },
  { id:"tpd",      label:"TPD Cover"           },
  { id:"ip",       label:"Income Protection"   },
  { id:"child",    label:"Child Cover"         },
  { id:"business", label:"Business Cover"      },
  { id:"severity", label:"Severity Based Cover"},
];

interface Props { onClose: () => void; clientName?: string; }

const STEPS = [
  { id:"insurer",   title:"Insurer & Type",       desc:"Select the insurance company and coverage types" },
  { id:"details",   title:"Application Details",   desc:"Premium, commission and lodgement dates" },
  { id:"team",      title:"Team & Type",           desc:"Assign adviser and admin, set application type" },
  { id:"checklist", title:"Compliance Checklist",  desc:"Confirm all compliance requirements are met" },
  { id:"review",    title:"Review & Submit",       desc:"Review the application before creating" },
];

export function CreateApplicationModal({ onClose, clientName }: Props) {
  const [step, setStep] = useState(0);
  const [insurer, setInsurer] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [annualPremium, setAnnualPremium] = useState("");
  const [upfrontCommission, setUpfrontCommission] = useState("");
  const [preAssessment, setPreAssessment] = useState("");
  const [dateLodged, setDateLodged] = useState("");
  const [timeVR, setTimeVR] = useState("");
  const [adviser, setAdviser] = useState("Auto assign");
  const [admin, setAdmin] = useState("Auto assign");
  const [appType, setAppType] = useState<"new"|"renewal">("new");
  const [inSuper, setInSuper] = useState("Outside");
  const [smsf, setSmsf] = useState(false);
  const [checklist, setChecklist] = useState({
    cleanskin: null as boolean|null,
    medAuth: null as boolean|null,
    cancelExisting: null as boolean|null,
    quotesUploaded: null as boolean|null,
    docsUploaded: null as boolean|null,
    personalStatement: null as boolean|null,
  });
  const [placeInforce, setPlaceInforce] = useState("As soon as ready");
  const [inforceDate, setInforceDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function toggleType(id: string) { setSelectedTypes(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; }); }
  function setCheck(key: keyof typeof checklist, val: boolean) { setChecklist(c => ({ ...c, [key]: val })); }

  const inp = "w-full rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand transition-colors placeholder:text-quaternary";
  const sel = inp + " appearance-none cursor-pointer";
  const lbl = "block text-xs font-medium text-secondary mb-1.5";

  const stepValid: boolean[] = [
    !!(insurer && selectedTypes.size > 0),
    true,
    true,
    Object.values(checklist).every(v => v !== null),
    true,
  ];

  function YesNo({ value, onChange }: { value: boolean|null; onChange: (v: boolean) => void }) {
    return (
      <div className="flex gap-2">
        {([true,false] as const).map(v => (
          <button key={String(v)} onClick={() => onChange(v)}
            className={"flex-1 py-2 rounded-lg border text-xs font-medium transition-colors " +
              (value === v ? (v ? "border-success-primary bg-success-primary text-white" : "border-error-primary bg-error-primary text-white") : "border-secondary text-secondary hover:bg-secondary")}>
            {v ? "Yes" : "No"}
          </button>
        ))}
      </div>
    );
  }

  function RadioRow({ options, value, onChange }: { options: string[]; value: string; onChange: (v:string)=>void }) {
    return (
      <div className="flex gap-0 rounded-xl border border-secondary overflow-hidden">
        {options.map(opt => (
          <button key={opt} onClick={() => onChange(opt)}
            className={"flex-1 py-2.5 text-sm font-medium transition-colors " +
              (value === opt ? "bg-brand-solid text-white" : "bg-primary text-secondary hover:bg-secondary")}>
            {opt}
          </button>
        ))}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-secondary bg-primary shadow-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-secondary shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary" style={{fontFamily:"'Metrophobic', sans-serif"}}>New Insurance Application</h2>
              {clientName && <p className="text-xs text-brand-secondary mt-0.5 font-medium">{clientName}</p>}
            </div>
            <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg hover:bg-secondary text-quaternary"><X className="size-4"/></button>
          </div>

          {/* Step progress bar */}
          <div className="mt-4 flex items-center gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1.5 flex-1 last:flex-none">
                <button onClick={() => i < step || stepValid[step] ? setStep(i) : null}
                  className={"flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors " +
                    (i < step ? "bg-success-primary text-white cursor-pointer" :
                     i === step ? "bg-brand-solid text-white" :
                     "bg-secondary text-quaternary")}>
                  {i < step ? <Check className="size-3.5"/> : i+1}
                </button>
                {i < STEPS.length - 1 && (
                  <div className={"flex-1 h-0.5 rounded-full transition-colors " + (i < step ? "bg-success-primary" : "bg-secondary")}/>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-quaternary mt-2">{STEPS[step].desc}</p>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Step 1: Insurer & Type */}
          {step === 0 && (
            <>
              <div>
                <label className={lbl}>Insurer <span className="text-error-primary">*</span></label>
                <div className="grid grid-cols-3 gap-2">
                  {INSURERS.map(ins => (
                    <button key={ins} onClick={() => setInsurer(ins)}
                      className={"rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors " +
                        (insurer === ins ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary text-secondary hover:bg-secondary hover:border-tertiary")}>
                      {ins}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={lbl}>Insurance Types <span className="text-error-primary">*</span> <span className="text-quaternary font-normal">— select all that apply</span></label>
                <div className="space-y-2">
                  {INSURANCE_TYPES.map(t => (
                    <button key={t.id} onClick={() => toggleType(t.id)}
                      className={"flex items-center gap-3 w-full rounded-xl border px-3 py-2.5 text-left transition-colors " +
                        (selectedTypes.has(t.id) ? "border-brand bg-brand-secondary" : "border-secondary hover:bg-secondary_alt")}>
                      <div className={"flex size-4 shrink-0 items-center justify-center rounded border transition-colors " +
                        (selectedTypes.has(t.id) ? "bg-brand-solid border-brand-solid" : "border-secondary bg-primary")}>
                        {selectedTypes.has(t.id) && <Check className="size-3 text-white"/>}
                      </div>
                      <p className={"text-sm font-medium " + (selectedTypes.has(t.id) ? "text-brand-secondary" : "text-primary")}>{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Step 2: Details */}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Annual Premium</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-quaternary">$</span>
                    <input type="number" value={annualPremium} onChange={e => setAnnualPremium(e.target.value)} placeholder="0.00" className={inp + " pl-6"}/>
                  </div>
                </div>
                <div>
                  <label className={lbl}>Upfront Commission</label>
                  <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-quaternary">$</span>
                    <input type="number" value={upfrontCommission} onChange={e => setUpfrontCommission(e.target.value)} placeholder="0.00" className={inp + " pl-6"}/>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Date Lodged</label>
                  <input type="date" value={dateLodged} onChange={e => setDateLodged(e.target.value)} className={inp}/>
                </div>
                <div>
                  <label className={lbl}>Time of VR</label>
                  <input type="time" value={timeVR} onChange={e => setTimeVR(e.target.value)} className={inp}/>
                </div>
              </div>
              <div>
                <label className={lbl}>Pre-assessment Notes</label>
                <textarea value={preAssessment} onChange={e => setPreAssessment(e.target.value)}
                  placeholder="Any pre-assessment notes..." rows={4} className={inp + " resize-none"}/>
              </div>
            </>
          )}

          {/* Step 3: Team & Type */}
          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>Adviser</label>
                  <select value={adviser} onChange={e => setAdviser(e.target.value)} className={sel}>
                    {USERS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Admin</label>
                  <select value={admin} onChange={e => setAdmin(e.target.value)} className={sel}>
                    {ADMIN_USERS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={lbl}>Application Type</label>
                <RadioRow options={["New App","Renewal"]} value={appType === "new" ? "New App" : "Renewal"} onChange={v => setAppType(v === "New App" ? "new" : "renewal")}/>
              </div>
              <div>
                <label className={lbl}>Superannuation</label>
                <RadioRow options={["Outside","Inside","Inside / Outside"]} value={inSuper} onChange={setInSuper}/>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-secondary px-4 py-3 cursor-pointer hover:bg-secondary_alt transition-colors" onClick={() => setSmsf(v => !v)}>
                <div className={"flex size-5 shrink-0 items-center justify-center rounded border transition-colors " + (smsf ? "bg-brand-solid border-brand-solid" : "border-secondary bg-primary")}>
                  {smsf && <Check className="size-3 text-white"/>}
                </div>
                <div>
                  <p className="text-sm font-medium text-primary">SMSF Application</p>
                  <p className="text-xs text-quaternary">Self-Managed Super Fund</p>
                </div>
              </div>
              <div>
                <label className={lbl}>Place Inforce</label>
                <RadioRow options={["As soon as ready","Ask adviser","Specify date"]} value={placeInforce} onChange={setPlaceInforce}/>
                {placeInforce === "Specify date" && (
                  <input type="date" value={inforceDate} onChange={e => setInforceDate(e.target.value)} className={inp + " mt-2"}/>
                )}
              </div>
            </>
          )}

          {/* Step 4: Checklist */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-quaternary bg-secondary_alt rounded-xl px-4 py-3">All checklist items must be completed before the application can be submitted.</p>
              {([
                ["cleanskin",        "Cleanskin Application",              "Client has not previously applied for insurance"],
                ["medAuth",          "Medical Authority Required",         "Medical authority form has been obtained if needed"],
                ["cancelExisting",   "Cancel Existing Cover",              "Existing policies have been reviewed for cancellation"],
                ["quotesUploaded",   "Quotes Uploaded",                    "All quotes have been uploaded to the CRM"],
                ["docsUploaded",     "Application Documents Uploaded",     "All application documents are uploaded and complete"],
                ["personalStatement","Personal Statement by Adviser",      "Personal statement has been completed by the adviser"],
              ] as [keyof typeof checklist, string, string][]).map(([key, label, desc]) => (
                <div key={key} className={"rounded-xl border px-4 py-3.5 transition-colors " +
                  (checklist[key] === true ? "border-success-primary bg-[#F0FDF4]" : checklist[key] === false ? "border-error-primary bg-[#FEF2F2]" : "border-secondary")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary">{label}</p>
                      <p className="text-xs text-quaternary mt-0.5">{desc}</p>
                    </div>
                    <YesNo value={checklist[key]} onChange={v => setCheck(key, v)}/>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Step 5: Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-secondary overflow-hidden">
                <div className="bg-secondary_alt px-4 py-2.5 border-b border-secondary"><p className="text-xs font-semibold text-tertiary uppercase tracking-wide">Insurer &amp; Coverage</p></div>
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex justify-between"><span className="text-xs text-tertiary">Insurer</span><span className="text-xs font-medium text-primary">{insurer || "—"}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-tertiary">Insurance Types</span><span className="text-xs font-medium text-primary text-right max-w-[60%]">{selectedTypes.size > 0 ? Array.from(selectedTypes).map(id => INSURANCE_TYPES.find(t => t.id === id)?.label).join(", ") : "—"}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-secondary overflow-hidden">
                <div className="bg-secondary_alt px-4 py-2.5 border-b border-secondary"><p className="text-xs font-semibold text-tertiary uppercase tracking-wide">Financials</p></div>
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex justify-between"><span className="text-xs text-tertiary">Annual Premium</span><span className="text-xs font-medium text-primary">{annualPremium ? `$${parseFloat(annualPremium).toLocaleString()}` : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-tertiary">Upfront Commission</span><span className="text-xs font-medium text-primary">{upfrontCommission ? `$${parseFloat(upfrontCommission).toLocaleString()}` : "—"}</span></div>
                </div>
              </div>
              <div className="rounded-xl border border-secondary overflow-hidden">
                <div className="bg-secondary_alt px-4 py-2.5 border-b border-secondary"><p className="text-xs font-semibold text-tertiary uppercase tracking-wide">Team &amp; Type</p></div>
                <div className="px-4 py-3 space-y-2.5">
                  <div className="flex justify-between"><span className="text-xs text-tertiary">Adviser</span><span className="text-xs font-medium text-primary">{adviser}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-tertiary">Admin</span><span className="text-xs font-medium text-primary">{admin}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-tertiary">Application Type</span><span className="text-xs font-medium text-primary">{appType === "new" ? "New Application" : "Renewal"}</span></div>
                  <div className="flex justify-between"><span className="text-xs text-tertiary">Superannuation</span><span className="text-xs font-medium text-primary">{inSuper}</span></div>
                </div>
              </div>
              <div>
                <label className={lbl}>Additional Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any final notes..." rows={3} className={inp + " resize-none"}/>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-secondary bg-secondary_alt shrink-0 rounded-b-2xl">
          <div className="text-xs text-quaternary">
            Step {step + 1} of {STEPS.length} — <span className="text-tertiary font-medium">{STEPS[step].title}</span>
          </div>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep(s => s-1)}
                className="inline-flex items-center gap-1 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
                <ChevronLeft className="size-3.5"/> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button onClick={() => setStep(s => s+1)}
                disabled={!stepValid[step]}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Next <ChevronRight className="size-3.5"/>
              </button>
            ) : (
              <button
                onClick={() => { alert("Application created! (Demo)"); onClose(); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
                <Check className="size-4"/> Create Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
