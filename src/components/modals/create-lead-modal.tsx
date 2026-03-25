import { useState, useRef, useEffect } from "react";
import { X, Check, ChevronRight, User01, Phone01, Mail01, Briefcase01, Users01 } from "@untitledui/icons";
import { createPortal } from "react-dom";

const USERS = ["Auto assign","Adam Cowburn","Adrian Ranieri","Advice Team","Ben Tutton","Caitlin Gardiner","Dean Hines","Hope Lake","James Nicholls","John Rojas","Justin Turtle","Kam Rowshan","Katie Hally","Maysee Chang","Natasha Carlson","Nathaniel Elston","Rebel Servante","SLG Support","SLG Test Training","Sonny Lowe","Sumeet Wadhwa","Toni Smilevski","Wilson Chen"];
const GROUPS = ["— No Group —","Three Dogs Insurance","UFinancial","Surety","Vital","Hunter Galloway","Covered Life","CH Life","Armor Insurance Solutions","We Life Insure Pty Ltd","Shielded Insurance","Lockmor Life","Tony Insurance","Halcyon Insurance Partners","LIP","LIP (Ltd)"];
const CAMPAIGNS = ["No Campaign","Organic Traffic","Shielded Insurance Brokers","Hunter Galloway","Nectar","Apex Financial Planning","Tony Insurance","Lifed - Meta","Surety Insurance"];
const STATES = ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];
const TITLES = ["Mr","Mrs","Ms","Miss","Dr","Prof"];
const EMPLOYMENT = ["Employed full-time","Employed part-time","Self-Employed","Casual","Unemployed","Retired","Student","Home Duties"];

const SECTIONS = [
  { id:"personal",    label:"Personal"   },
  { id:"contact",     label:"Contact"    },
  { id:"employment",  label:"Employment" },
  { id:"assignment",  label:"Assignment" },
];

interface Props { onClose: () => void; }

export function CreateLeadModal({ onClose }: Props) {
  const [activeSection, setActiveSection] = useState("personal");
  const [form, setForm] = useState({
    title:"Mr", firstName:"", lastName:"", preferredName:"",
    dob:"", gender:"Male", state:"NSW", smoker:"No",
    phone:"", phone2:"", email:"", email2:"", contactTime:"",
    salary:"", employment:"Employed full-time", occupation:"",
    campaign:"No Campaign", group:"", assignedTo:"Auto assign", notes:"",
  });

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  const inp = "w-full rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand transition-colors placeholder:text-quaternary";
  const sel = inp + " appearance-none cursor-pointer";
  const lbl = "block text-xs font-medium text-secondary mb-1.5";

  const isPersonalComplete = !!(form.firstName && form.lastName);
  const isContactComplete  = !!(form.phone && form.email);
  const canSubmit = isPersonalComplete && isContactComplete;

  function SectionTab({ id, label, complete }: { id:string; label:string; complete?:boolean }) {
    const active = activeSection === id;
    return (
      <button onClick={() => setActiveSection(id)}
        className={"relative flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors border-b-2 " +
          (active ? "border-brand text-brand-secondary" : "border-transparent text-quaternary hover:text-secondary hover:border-secondary")}>
        {label}
        {complete && <span className="flex size-3.5 items-center justify-center rounded-full bg-success-primary"><Check className="size-2 text-white"/></span>}
      </button>
    );
  }

  function Field({ label, children, required }: { label:string; children: React.ReactNode; required?:boolean }) {
    return (
      <div>
        <label className={lbl}>{label}{required && <span className="text-error-primary ml-0.5">*</span>}</label>
        {children}
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative z-10 w-full max-w-xl rounded-2xl border border-secondary bg-primary shadow-2xl flex flex-col max-h-[88vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-primary" style={{fontFamily:"'Metrophobic', sans-serif"}}>Create New Lead</h2>
            <p className="text-xs text-quaternary mt-0.5">Fill in the details to add a new lead</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg hover:bg-secondary text-quaternary transition-colors">
            <X className="size-4"/>
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-secondary shrink-0 px-2">
          <SectionTab id="personal"   label="Personal"   complete={isPersonalComplete}/>
          <SectionTab id="contact"    label="Contact"    complete={isContactComplete}/>
          <SectionTab id="employment" label="Employment"/>
          <SectionTab id="assignment" label="Assignment"/>
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {activeSection === "personal" && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3">
                <Field label="Title">
                  <select value={form.title} onChange={e => set("title", e.target.value)} className={sel}>
                    {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <div className="col-span-3">
                  <Field label="First Name" required>
                    <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="First name" className={inp}/>
                  </Field>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Last Name" required>
                  <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Last name" className={inp}/>
                </Field>
                <Field label="Preferred Name">
                  <input value={form.preferredName} onChange={e => set("preferredName", e.target.value)} placeholder="Nickname" className={inp}/>
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Date of Birth">
                  <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} className={inp}/>
                </Field>
                <Field label="Gender">
                  <select value={form.gender} onChange={e => set("gender", e.target.value)} className={sel}>
                    {["Male","Female","Other","Prefer not to say"].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="State">
                  <select value={form.state} onChange={e => set("state", e.target.value)} className={sel}>
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Smoker Status">
                <div className="flex gap-2">
                  {["No","Yes"].map(v => (
                    <button key={v} onClick={() => set("smoker", v)}
                      className={"flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors " +
                        (form.smoker === v ? "border-brand bg-brand-secondary text-brand-secondary" : "border-secondary text-secondary hover:bg-secondary")}>
                      {v === "No" ? "Non-smoker" : "Smoker"}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          )}

          {activeSection === "contact" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone" required>
                  <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="04XX XXX XXX" className={inp}/>
                </Field>
                <Field label="Additional Phone">
                  <input type="tel" value={form.phone2} onChange={e => set("phone2", e.target.value)} placeholder="Additional phone" className={inp}/>
                </Field>
              </div>
              <Field label="Email Address" required>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" className={inp}/>
              </Field>
              <Field label="Additional Email">
                <input type="email" value={form.email2} onChange={e => set("email2", e.target.value)} placeholder="Additional email address" className={inp}/>
              </Field>
              <Field label="Preferred Contact Time">
                <select value={form.contactTime} onChange={e => set("contactTime", e.target.value)} className={sel}>
                  {["","Morning (8am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–8pm)","Anytime"].map(t => <option key={t} value={t}>{t || "Select..."}</option>)}
                </select>
              </Field>
            </div>
          )}

          {activeSection === "employment" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Employment Status">
                  <select value={form.employment} onChange={e => set("employment", e.target.value)} className={sel}>
                    {EMPLOYMENT.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </Field>
                <Field label="Occupation">
                  <input value={form.occupation} onChange={e => set("occupation", e.target.value)} placeholder="Job title / occupation" className={inp}/>
                </Field>
              </div>
              <Field label="Annual Salary">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-quaternary font-medium">$</span>
                  <input type="number" value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="0" className={inp + " pl-6"}/>
                </div>
              </Field>
            </div>
          )}

          {activeSection === "assignment" && (
            <div className="space-y-4">
              <Field label="Assign To">
                <select value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} className={sel}>
                  {USERS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </Field>
              <Field label="Group">
                <select value={form.group} onChange={e => set("group", e.target.value)} className={sel}>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </Field>
              <Field label="Campaign Source">
                <select value={form.campaign} onChange={e => set("campaign", e.target.value)} className={sel}>
                  {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Notes">
                <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
                  placeholder="Any initial notes about this lead..." rows={3}
                  className={inp + " resize-none"}/>
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-secondary bg-secondary_alt shrink-0 rounded-b-2xl">
          <div className="flex items-center gap-1.5">
            {SECTIONS.map((s, i) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={"size-2 rounded-full transition-colors " + (activeSection === s.id ? "bg-brand-solid" : "bg-secondary hover:bg-tertiary")}/>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {/* Prev / Next */}
            {(() => {
              const idx = SECTIONS.findIndex(s => s.id === activeSection);
              return (
                <>
                  {idx > 0 && (
                    <button onClick={() => setActiveSection(SECTIONS[idx-1].id)}
                      className="rounded-lg border border-secondary bg-primary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
                      Back
                    </button>
                  )}
                  {idx < SECTIONS.length - 1 ? (
                    <button onClick={() => setActiveSection(SECTIONS[idx+1].id)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
                      Next <ChevronRight className="size-3.5"/>
                    </button>
                  ) : (
                    <button
                      onClick={() => { alert("Lead created! (Demo)"); onClose(); }}
                      disabled={!canSubmit}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      Create Lead
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
