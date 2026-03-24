import { useState, useRef, useEffect } from "react";
import { X, Check, Plus } from "@untitledui/icons";
import { createPortal } from "react-dom";

const USERS = ["Auto assign","Adam Cowburn","Adrian Ranieri","Advice Team","Ali Jama","Ben Tutton","Biren Amin","Caitlin Gardiner","Dean Hines","Deon Locke","Ethan Fowler","Hope Lake","James Nicholls","John Rojas","Justin Carroll","Justin Turtle","Kam Rowshan","Katie Hally","Liam Larkins","Maysee Chang","Natasha Carlson","Nathaniel Elston","Rebel Servante","Russell Sheasby","SLG Support","SLG Test Training","Sonny Lowe","Sumeet Wadhwa","Toni Smilevski","Wilson Chen","Yash Jaiswal"];
const GROUPS = ["Three Dogs Insurance","UFinancial","Surety","Vital","Hunter Galloway","Covered Life","CH Life","Armor Insurance Solutions","We Life Insure Pty Ltd","Shielded Insurance","Lockmor Life","Tony Insurance","Halcyon Insurance Partners","Nectar","LIP","LIP (Ltd)"];
const CAMPAIGNS = ["No Campaign","Organic Traffic","Shielded Insurance Brokers","Hunter Galloway","Nectar","Apex Financial Planning","Tony Insurance","Insurance Time","Lifed - Meta","Surety Insurance"];
const STATES = ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];
const TITLES = ["Mr","Mrs","Ms","Miss","Dr","Prof"];
const EMPLOYMENT = ["Employed full-time","Employed part-time","Self-Employed","Casual","Unemployed","Retired","Student","Home Duties"];

interface Props { onClose: () => void; }

export function CreateLeadModal({ onClose }: Props) {
  const [form, setForm] = useState({
    title: "Mr", firstName: "", lastName: "", preferredName: "",
    dob: "", gender: "Male", state: "NSW",
    phone: "", phone2: "", email: "", email2: "",
    salary: "", employment: "Employed full-time", occupation: "",
    campaign: "No Campaign", group: "", assignedTo: "Auto assign",
    smoker: "No", notes: "",
  });

  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  const inputCls = "w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand transition-colors placeholder:text-quaternary";
  const selectCls = "w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand appearance-none cursor-pointer";
  const labelCls = "block text-xs font-medium text-tertiary mb-1";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}/>

      {/* Modal */}
      <div ref={ref} className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl border border-secondary bg-primary shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-secondary shrink-0">
          <div>
            <h2 className="text-base font-semibold text-primary" style={{ fontFamily:"'Metrophobic', sans-serif" }}>Create New Lead</h2>
            <p className="text-xs text-quaternary mt-0.5">Add a new client lead to the CRM</p>
          </div>
          <button onClick={onClose} className="flex size-8 items-center justify-center rounded-lg hover:bg-secondary text-quaternary transition-colors">
            <X className="size-4"/>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">

          {/* Personal */}
          <div>
            <p className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-3">Personal Information</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Title</label>
                <select value={form.title} onChange={e => set("title", e.target.value)} className={selectCls}>
                  {TITLES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>First Name *</label>
                <input value={form.firstName} onChange={e => set("firstName", e.target.value)} placeholder="First name" className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Last Name *</label>
                <input value={form.lastName} onChange={e => set("lastName", e.target.value)} placeholder="Last name" className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Preferred Name</label>
                <input value={form.preferredName} onChange={e => set("preferredName", e.target.value)} placeholder="Preferred name" className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Date of Birth</label>
                <input type="date" value={form.dob} onChange={e => set("dob", e.target.value)} className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Gender</label>
                <select value={form.gender} onChange={e => set("gender", e.target.value)} className={selectCls}>
                  {["Male","Female","Other","Prefer not to say"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>State</label>
                <select value={form.state} onChange={e => set("state", e.target.value)} className={selectCls}>
                  {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Smoker</label>
                <select value={form.smoker} onChange={e => set("smoker", e.target.value)} className={selectCls}>
                  <option value="No">Non-smoker</option>
                  <option value="Yes">Smoker</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-3">Contact Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Phone *</label>
                <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="04XX XXX XXX" className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Additional Phone</label>
                <input value={form.phone2} onChange={e => set("phone2", e.target.value)} placeholder="Additional phone" className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Email *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Additional Email</label>
                <input type="email" value={form.email2} onChange={e => set("email2", e.target.value)} placeholder="Additional email" className={inputCls}/>
              </div>
            </div>
          </div>

          {/* Employment */}
          <div>
            <p className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-3">Employment &amp; Income</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Employment</label>
                <select value={form.employment} onChange={e => set("employment", e.target.value)} className={selectCls}>
                  {EMPLOYMENT.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Occupation</label>
                <input value={form.occupation} onChange={e => set("occupation", e.target.value)} placeholder="Occupation" className={inputCls}/>
              </div>
              <div>
                <label className={labelCls}>Annual Salary</label>
                <input type="number" value={form.salary} onChange={e => set("salary", e.target.value)} placeholder="0" className={inputCls}/>
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div>
            <p className="text-xs font-semibold text-brand-secondary uppercase tracking-wide mb-3">Assignment &amp; Campaign</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Assign To</label>
                <select value={form.assignedTo} onChange={e => set("assignedTo", e.target.value)} className={selectCls}>
                  {USERS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Group</label>
                <select value={form.group} onChange={e => set("group", e.target.value)} className={selectCls}>
                  <option value="">No Group</option>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Campaign</label>
                <select value={form.campaign} onChange={e => set("campaign", e.target.value)} className={selectCls}>
                  {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Add any initial notes..." rows={3}
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
              onClick={() => { alert("Lead created! (Demo — not connected to DB yet)"); onClose(); }}
              disabled={!form.firstName || !form.lastName || !form.phone || !form.email}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-4 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="size-4"/> Create Lead
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
