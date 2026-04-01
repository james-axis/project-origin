import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { File01, Download01, Eye, ChevronDown, X } from "@untitledui/icons";

// ─── Mock data ────────────────────────────────────────────────────────────────
const DOCUMENTS = [
  { id:1,  name:"AIA Life Insurance PDS",            type:"PDS",    insurer:"AIA",      category:"Life Insurance",       updated:"12/03/2026", size:"2.4 MB" },
  { id:2,  name:"TAL Income Protection PDS",          type:"PDS",    insurer:"TAL",      category:"Income Protection",    updated:"08/03/2026", size:"1.8 MB" },
  { id:3,  name:"Zurich TPD PDS",                     type:"PDS",    insurer:"Zurich",   category:"TPD",                  updated:"01/03/2026", size:"3.1 MB" },
  { id:4,  name:"NEOS Trauma PDS",                    type:"PDS",    insurer:"NEOS",     category:"Trauma",               updated:"15/02/2026", size:"2.0 MB" },
  { id:5,  name:"MetLife Business Insurance PDS",     type:"PDS",    insurer:"MetLife",  category:"Business Insurance",   updated:"20/02/2026", size:"4.2 MB" },
  { id:6,  name:"ClearView Life PDS",                 type:"PDS",    insurer:"ClearView",category:"Life Insurance",       updated:"05/02/2026", size:"1.6 MB" },
  { id:7,  name:"AIA TMD Statement",                  type:"TMD",    insurer:"AIA",      category:"Life Insurance",       updated:"12/03/2026", size:"0.8 MB" },
  { id:8,  name:"TAL TMD Statement",                  type:"TMD",    insurer:"TAL",      category:"Income Protection",    updated:"08/03/2026", size:"0.7 MB" },
  { id:9,  name:"Zurich TMD Statement",               type:"TMD",    insurer:"Zurich",   category:"TPD",                  updated:"01/03/2026", size:"0.9 MB" },
  { id:10, name:"Acenda Product Guide",               type:"Guide",  insurer:"Acenda",   category:"General",              updated:"10/03/2026", size:"5.2 MB" },
  { id:11, name:"NEOS Adviser Guide",                 type:"Guide",  insurer:"NEOS",     category:"General",              updated:"22/02/2026", size:"3.8 MB" },
];

const FORMS = [
  { id:1,  name:"New Client Fact Find",               category:"Onboarding",    format:"PDF",  updated:"15/03/2026" },
  { id:2,  name:"Health Statement Form",              category:"Medical",       format:"PDF",  updated:"10/03/2026" },
  { id:3,  name:"Financial Needs Analysis",           category:"Advice",        format:"DOCX", updated:"08/03/2026" },
  { id:4,  name:"Authority to Obtain Information",    category:"Compliance",    format:"PDF",  updated:"05/03/2026" },
  { id:5,  name:"Direct Debit Request Form",          category:"Payments",      format:"PDF",  updated:"01/03/2026" },
  { id:6,  name:"Change of Beneficiary",              category:"Policy",        format:"PDF",  updated:"20/02/2026" },
  { id:7,  name:"Claim Lodgement Form",               category:"Claims",        format:"PDF",  updated:"18/02/2026" },
  { id:8,  name:"Superannuation Authority",           category:"Super",         format:"PDF",  updated:"15/02/2026" },
  { id:9,  name:"Insurance Application Form",         category:"Applications",  format:"DOCX", updated:"12/02/2026" },
  { id:10, name:"Statement of Advice Template",       category:"Advice",        format:"DOCX", updated:"10/02/2026" },
];

const TEMPLATES = [
  { id:1,  name:"Welcome Email — New Client",         category:"Email",   type:"Email Template",  updated:"20/03/2026" },
  { id:2,  name:"Appointment Confirmation SMS",       category:"SMS",     type:"SMS Template",     updated:"18/03/2026" },
  { id:3,  name:"Quote Follow-Up Email",              category:"Email",   type:"Email Template",  updated:"15/03/2026" },
  { id:4,  name:"Statement of Advice",                category:"DOCX",    type:"DOCX Template",   updated:"12/03/2026" },
  { id:5,  name:"Application Acknowledgement Email",  category:"Email",   type:"Email Template",  updated:"10/03/2026" },
  { id:6,  name:"Claim Acknowledgement Email",        category:"Email",   type:"Email Template",  updated:"08/03/2026" },
  { id:7,  name:"Renewal Reminder SMS",               category:"SMS",     type:"SMS Template",     updated:"05/03/2026" },
  { id:8,  name:"Pre-Assessment Report",              category:"DOCX",    type:"DOCX Template",   updated:"01/03/2026" },
  { id:9,  name:"Dishonour Notification SMS",         category:"SMS",     type:"SMS Template",     updated:"25/02/2026" },
  { id:10, name:"Policy Schedule Letter",             category:"DOCX",    type:"DOCX Template",   updated:"20/02/2026" },
  { id:11, name:"No Answer SMS",                      category:"SMS",     type:"SMS Template",     updated:"18/02/2026" },
  { id:12, name:"Inforce Congratulations Email",      category:"Email",   type:"Email Template",  updated:"15/02/2026" },
];

type Tab = "documents" | "forms" | "templates";

function FilterSelect({ value, onChange, placeholder, options }: {
  value: string; onChange: (v: string) => void; placeholder: string; options: string[];
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none rounded-lg border border-secondary bg-primary pl-3 pr-8 py-2 text-sm text-primary outline-none focus:border-brand cursor-pointer min-w-[130px]">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-quaternary" />
    </div>
  );
}

export function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") || "documents") as Tab;
  const setTab = (t: Tab) => setSearchParams({ tab: t });

  // Documents tab state
  const [docSearch,    setDocSearch]    = useState("");
  const [docInsurer,   setDocInsurer]   = useState("");
  const [docType,      setDocType]      = useState("");
  const [docCategory,  setDocCategory]  = useState("");

  // Forms tab state
  const [formSearch,   setFormSearch]   = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formFormat,   setFormFormat]   = useState("");

  // Templates tab state
  const [tmplSearch,   setTmplSearch]   = useState("");
  const [tmplCategory, setTmplCategory] = useState("");
  const [tmplType,     setTmplType]     = useState("");

  const filteredDocs = useMemo(() => DOCUMENTS.filter(d =>
    (!docSearch   || d.name.toLowerCase().includes(docSearch.toLowerCase())) &&
    (!docInsurer  || d.insurer  === docInsurer) &&
    (!docType     || d.type     === docType) &&
    (!docCategory || d.category === docCategory)
  ), [docSearch, docInsurer, docType, docCategory]);

  const filteredForms = useMemo(() => FORMS.filter(f =>
    (!formSearch   || f.name.toLowerCase().includes(formSearch.toLowerCase())) &&
    (!formCategory || f.category === formCategory) &&
    (!formFormat   || f.format   === formFormat)
  ), [formSearch, formCategory, formFormat]);

  const filteredTmpls = useMemo(() => TEMPLATES.filter(t =>
    (!tmplSearch   || t.name.toLowerCase().includes(tmplSearch.toLowerCase())) &&
    (!tmplCategory || t.category === tmplCategory) &&
    (!tmplType     || t.type     === tmplType)
  ), [tmplSearch, tmplCategory, tmplType]);

  const TABS: { key: Tab; label: string; count: number }[] = [
    { key: "documents", label: "Documents", count: filteredDocs.length },
    { key: "forms",     label: "Forms",     count: filteredForms.length },
    { key: "templates", label: "Templates", count: filteredTmpls.length },
  ];

  function SearchInput({ value, onChange, placeholder = "Search..." }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
      <div className="relative flex-1 min-w-0 max-w-xs">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-8 py-2 text-sm text-primary outline-none focus:border-brand" />
        {value && <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-fg-quaternary hover:text-secondary"><X className="size-3.5" /></button>}
      </div>
    );
  }

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">

        {/* Header + tabs */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <h1 className="text-xl font-semibold text-primary mb-4" style={{ fontFamily: "'Metrophobic', sans-serif" }}>View Documents</h1>
          <div className="flex items-center gap-0 -mb-px overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label, count }) => (
              <button key={key} onClick={() => setTab(key)}
                className={"flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " +
                  (activeTab === key ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                {label}
                <span className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (activeTab === key ? "bg-brand-solid text-white" : "bg-secondary text-quaternary")}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 sm:px-6 lg:px-8 py-3 border-b border-secondary bg-primary flex items-center gap-2 flex-wrap">
          {activeTab === "documents" && (
            <>
              <SearchInput value={docSearch} onChange={setDocSearch} placeholder="Search documents..." />
              <FilterSelect value={docType}     onChange={setDocType}     placeholder="Type"     options={[...new Set(DOCUMENTS.map(d => d.type))].sort()} />
              <FilterSelect value={docInsurer}  onChange={setDocInsurer}  placeholder="Insurer"  options={[...new Set(DOCUMENTS.map(d => d.insurer))].sort()} />
              <FilterSelect value={docCategory} onChange={setDocCategory} placeholder="Category" options={[...new Set(DOCUMENTS.map(d => d.category))].sort()} />
              {(docSearch || docInsurer || docType || docCategory) && (
                <button onClick={() => { setDocSearch(""); setDocInsurer(""); setDocType(""); setDocCategory(""); }}
                  className="text-sm text-brand-secondary hover:underline">Clear</button>
              )}
            </>
          )}
          {activeTab === "forms" && (
            <>
              <SearchInput value={formSearch} onChange={setFormSearch} placeholder="Search forms..." />
              <FilterSelect value={formCategory} onChange={setFormCategory} placeholder="Category" options={[...new Set(FORMS.map(f => f.category))].sort()} />
              <FilterSelect value={formFormat}   onChange={setFormFormat}   placeholder="Format"   options={[...new Set(FORMS.map(f => f.format))].sort()} />
              {(formSearch || formCategory || formFormat) && (
                <button onClick={() => { setFormSearch(""); setFormCategory(""); setFormFormat(""); }}
                  className="text-sm text-brand-secondary hover:underline">Clear</button>
              )}
            </>
          )}
          {activeTab === "templates" && (
            <>
              <SearchInput value={tmplSearch} onChange={setTmplSearch} placeholder="Search templates..." />
              <FilterSelect value={tmplCategory} onChange={setTmplCategory} placeholder="Category" options={[...new Set(TEMPLATES.map(t => t.category))].sort()} />
              <FilterSelect value={tmplType}     onChange={setTmplType}     placeholder="Type"     options={[...new Set(TEMPLATES.map(t => t.type))].sort()} />
              {(tmplSearch || tmplCategory || tmplType) && (
                <button onClick={() => { setTmplSearch(""); setTmplCategory(""); setTmplType(""); }}
                  className="text-sm text-brand-secondary hover:underline">Clear</button>
              )}
            </>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="rounded-xl border border-secondary overflow-hidden bg-primary">
            <table className="w-full border-collapse text-sm">

              {activeTab === "documents" && (
                <>
                  <thead>
                    <tr className="bg-tertiary border-b border-secondary">
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Insurer</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide hidden sm:table-cell">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide hidden md:table-cell">Updated</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide hidden md:table-cell">Size</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary">
                    {filteredDocs.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-16 text-center text-sm text-quaternary">No documents found</td></tr>
                    ) : filteredDocs.map(doc => (
                      <tr key={doc.id} className="group hover:bg-secondary_alt transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <File01 className="size-4 text-quaternary shrink-0" />
                            <span className="font-medium text-primary">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-tertiary">{doc.type}</td>
                        <td className="px-4 py-3 text-xs text-tertiary">{doc.insurer}</td>
                        <td className="px-4 py-3 text-xs text-tertiary hidden sm:table-cell">{doc.category}</td>
                        <td className="px-4 py-3 text-xs text-tertiary hidden md:table-cell">{doc.updated}</td>
                        <td className="px-4 py-3 text-xs text-tertiary hidden md:table-cell">{doc.size}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button title="View" className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary hover:text-primary transition-colors"><Eye className="size-3.5" /></button>
                            <button title="Download" className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary hover:text-primary transition-colors"><Download01 className="size-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === "forms" && (
                <>
                  <thead>
                    <tr className="bg-tertiary border-b border-secondary">
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide hidden sm:table-cell">Format</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide hidden md:table-cell">Updated</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary">
                    {filteredForms.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-quaternary">No forms found</td></tr>
                    ) : filteredForms.map(form => (
                      <tr key={form.id} className="group hover:bg-secondary_alt transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <File01 className="size-4 text-quaternary shrink-0" />
                            <span className="font-medium text-primary">{form.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-tertiary">{form.category}</td>
                        <td className="px-4 py-3 text-xs text-tertiary hidden sm:table-cell">{form.format}</td>
                        <td className="px-4 py-3 text-xs text-tertiary hidden md:table-cell">{form.updated}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button title="View" className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary hover:text-primary transition-colors"><Eye className="size-3.5" /></button>
                            <button title="Download" className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary hover:text-primary transition-colors"><Download01 className="size-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

              {activeTab === "templates" && (
                <>
                  <thead>
                    <tr className="bg-tertiary border-b border-secondary">
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide hidden sm:table-cell">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide hidden md:table-cell">Updated</th>
                      <th className="px-4 py-3 w-16" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-secondary">
                    {filteredTmpls.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-16 text-center text-sm text-quaternary">No templates found</td></tr>
                    ) : filteredTmpls.map(tmpl => (
                      <tr key={tmpl.id} className="group hover:bg-secondary_alt transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <File01 className="size-4 text-quaternary shrink-0" />
                            <span className="font-medium text-primary">{tmpl.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-tertiary">{tmpl.type}</td>
                        <td className="px-4 py-3 text-xs text-tertiary hidden sm:table-cell">{tmpl.category}</td>
                        <td className="px-4 py-3 text-xs text-tertiary hidden md:table-cell">{tmpl.updated}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <button title="View" className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary hover:text-primary transition-colors"><Eye className="size-3.5" /></button>
                            <button title="Download" className="flex size-7 items-center justify-center rounded-lg hover:bg-secondary text-quaternary hover:text-primary transition-colors"><Download01 className="size-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </>
              )}

            </table>
          </div>
          <p className="text-xs text-quaternary mt-3">
            {activeTab === "documents" ? filteredDocs.length : activeTab === "forms" ? filteredForms.length : filteredTmpls.length} records
          </p>
        </div>
      </main>
    </div>
  );
}
