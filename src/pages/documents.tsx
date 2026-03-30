import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import {
  File01, Folder, Download01, Upload01, Plus, SearchLg, Eye,
  Trash01, Edit01, Calendar, Building01, Users01, ChevronDown,
} from "@untitledui/icons";

// ─── Document Groups Configuration ───────────────────────────────────────────
const documentGroups = [
  {
    id: "pds",
    label: "PDS Documents",
    icon: File01,
    tabs: [
      { id: "all-pds", label: "All PDS" },
      { id: "life-insurance", label: "Life Insurance" },
      { id: "income-protection", label: "Income Protection" },
      { id: "tpd", label: "TPD" },
      { id: "trauma", label: "Trauma" },
    ],
  },
  {
    id: "tmd",
    label: "TMD Documents",
    icon: File01,
    tabs: [
      { id: "all-tmd", label: "All TMD" },
      { id: "retail", label: "Retail Products" },
      { id: "wholesale", label: "Wholesale Products" },
    ],
  },
  {
    id: "forms",
    label: "Forms",
    icon: File01,
    tabs: [
      { id: "all-forms", label: "All Forms" },
      { id: "application-forms", label: "Application Forms" },
      { id: "claim-forms", label: "Claim Forms" },
      { id: "change-forms", label: "Change of Details" },
      { id: "authority-forms", label: "Authority Forms" },
    ],
  },
  {
    id: "templates",
    label: "Templates",
    icon: File01,
    tabs: [
      { id: "all-templates", label: "All Templates" },
      { id: "email-templates", label: "Email Templates" },
      { id: "letter-templates", label: "Letter Templates" },
      { id: "soa-templates", label: "SOA Templates" },
    ],
  },
  {
    id: "guides",
    label: "Guides",
    icon: File01,
    tabs: [
      { id: "all-guides", label: "All Guides" },
      { id: "training", label: "Training Guides" },
      { id: "compliance", label: "Compliance Guides" },
      { id: "product-guides", label: "Product Guides" },
    ],
  },
];

// ─── Mock Documents Data ─────────────────────────────────────────────────────
const MOCK_DOCUMENTS: Record<string, { id: number; name: string; type: string; company: string; uploadedBy: string; uploadedAt: string; size: string }[]> = {
  "pds": [
    { id: 1, name: "Acenda PDS.pdf", type: "PDS", company: "Acenda", uploadedBy: "System", uploadedAt: "15 Mar 2026", size: "2.4 MB" },
    { id: 2, name: "AIA PDS.pdf", type: "PDS", company: "AIA", uploadedBy: "System", uploadedAt: "15 Mar 2026", size: "3.1 MB" },
    { id: 3, name: "Clearview PDS.pdf", type: "PDS", company: "ClearView", uploadedBy: "System", uploadedAt: "14 Mar 2026", size: "2.8 MB" },
    { id: 4, name: "Encompass PDS.pdf", type: "PDS", company: "Encompass", uploadedBy: "System", uploadedAt: "14 Mar 2026", size: "2.2 MB" },
    { id: 5, name: "MetLife PDS.pdf", type: "PDS", company: "MetLife", uploadedBy: "System", uploadedAt: "13 Mar 2026", size: "3.5 MB" },
    { id: 6, name: "NEOS PDS.pdf", type: "PDS", company: "NEOS", uploadedBy: "System", uploadedAt: "13 Mar 2026", size: "2.9 MB" },
    { id: 7, name: "TAL PDS.pdf", type: "PDS", company: "TAL", uploadedBy: "System", uploadedAt: "12 Mar 2026", size: "4.1 MB" },
    { id: 8, name: "Zurich PDS.pdf", type: "PDS", company: "Zurich", uploadedBy: "System", uploadedAt: "12 Mar 2026", size: "3.3 MB" },
  ],
  "tmd": [
    { id: 9, name: "Acenda TMD.pdf", type: "TMD", company: "Acenda", uploadedBy: "System", uploadedAt: "15 Mar 2026", size: "1.2 MB" },
    { id: 10, name: "AIA TMD.pdf", type: "TMD", company: "AIA", uploadedBy: "System", uploadedAt: "15 Mar 2026", size: "1.5 MB" },
    { id: 11, name: "Clearview TMD.pdf", type: "TMD", company: "ClearView", uploadedBy: "System", uploadedAt: "14 Mar 2026", size: "1.1 MB" },
    { id: 12, name: "MetLife TMD.pdf", type: "TMD", company: "MetLife", uploadedBy: "System", uploadedAt: "13 Mar 2026", size: "1.4 MB" },
    { id: 13, name: "TAL TMD.pdf", type: "TMD", company: "TAL", uploadedBy: "System", uploadedAt: "12 Mar 2026", size: "1.8 MB" },
    { id: 14, name: "Zurich TMD.pdf", type: "TMD", company: "Zurich", uploadedBy: "System", uploadedAt: "12 Mar 2026", size: "1.3 MB" },
  ],
  "forms": [
    { id: 15, name: "Application for Using Non-Approved product - FORM.pdf", type: "Form", company: "Axis", uploadedBy: "Admin", uploadedAt: "10 Mar 2026", size: "0.5 MB" },
    { id: 16, name: "Change of Adviser - Life.pdf", type: "Form", company: "Axis", uploadedBy: "Admin", uploadedAt: "10 Mar 2026", size: "0.3 MB" },
    { id: 17, name: "Authority to Proceed.pdf", type: "Form", company: "Axis", uploadedBy: "Admin", uploadedAt: "8 Mar 2026", size: "0.4 MB" },
    { id: 18, name: "Client Consent Form.pdf", type: "Form", company: "Axis", uploadedBy: "Admin", uploadedAt: "8 Mar 2026", size: "0.2 MB" },
    { id: 19, name: "Claim Notification Form.pdf", type: "Form", company: "Axis", uploadedBy: "Admin", uploadedAt: "5 Mar 2026", size: "0.6 MB" },
  ],
  "templates": [
    { id: 20, name: "Welcome Email Template.docx", type: "Template", company: "Axis", uploadedBy: "Marketing", uploadedAt: "20 Mar 2026", size: "0.1 MB" },
    { id: 21, name: "Quote Follow-up Email.docx", type: "Template", company: "Axis", uploadedBy: "Marketing", uploadedAt: "18 Mar 2026", size: "0.1 MB" },
    { id: 22, name: "SOA Template - Life.docx", type: "Template", company: "Axis", uploadedBy: "Compliance", uploadedAt: "15 Mar 2026", size: "0.8 MB" },
    { id: 23, name: "SOA Template - IP.docx", type: "Template", company: "Axis", uploadedBy: "Compliance", uploadedAt: "15 Mar 2026", size: "0.9 MB" },
    { id: 24, name: "Appointment Confirmation.docx", type: "Template", company: "Axis", uploadedBy: "Marketing", uploadedAt: "10 Mar 2026", size: "0.1 MB" },
  ],
  "guides": [
    { id: 25, name: "New Adviser Onboarding Guide.pdf", type: "Guide", company: "Axis", uploadedBy: "Training", uploadedAt: "25 Mar 2026", size: "5.2 MB" },
    { id: 26, name: "CRM User Manual.pdf", type: "Guide", company: "Axis", uploadedBy: "Training", uploadedAt: "20 Mar 2026", size: "8.4 MB" },
    { id: 27, name: "Compliance Requirements 2026.pdf", type: "Guide", company: "Axis", uploadedBy: "Compliance", uploadedAt: "15 Mar 2026", size: "3.1 MB" },
    { id: 28, name: "TAL Product Guide.pdf", type: "Guide", company: "TAL", uploadedBy: "System", uploadedAt: "10 Mar 2026", size: "6.7 MB" },
    { id: 29, name: "Zurich Product Guide.pdf", type: "Guide", company: "Zurich", uploadedBy: "System", uploadedAt: "10 Mar 2026", size: "5.9 MB" },
  ],
};

// ─── Document Card Component ─────────────────────────────────────────────────
function DocumentCard({ doc }: { doc: { id: number; name: string; type: string; company: string; uploadedBy: string; uploadedAt: string; size: string } }) {
  const isPDF = doc.name.toLowerCase().endsWith('.pdf');
  const isDocx = doc.name.toLowerCase().endsWith('.docx');
  
  return (
    <div className="bg-primary rounded-xl border border-secondary p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start gap-4">
        {/* Document thumbnail/icon */}
        <div className={`size-14 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isPDF ? "bg-error-secondary" : isDocx ? "bg-blue-50" : "bg-secondary"
        }`}>
          <span className={`text-xs font-bold uppercase ${
            isPDF ? "text-error-primary" : isDocx ? "text-blue-600" : "text-secondary"
          }`}>
            {isPDF ? "PDF" : isDocx ? "DOCX" : "FILE"}
          </span>
        </div>
        
        {/* Document info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-brand-secondary truncate hover:underline cursor-pointer">
            {doc.name}
          </h3>
          <p className="text-xs text-tertiary mt-1">{doc.type} • {doc.company}</p>
          <p className="text-xs text-tertiary mt-0.5">{doc.size} • Uploaded {doc.uploadedAt}</p>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded hover:bg-secondary text-fg-quaternary hover:text-primary" title="View">
            <Eye className="size-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-secondary text-fg-quaternary hover:text-primary" title="Download">
            <Download01 className="size-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-secondary text-fg-quaternary hover:text-primary" title="Edit">
            <Edit01 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Document Library Content ────────────────────────────────────────────────
function DocumentLibraryContent({ groupId, tabId }: { groupId: string; tabId: string }) {
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  
  const documents = MOCK_DOCUMENTS[groupId] || [];
  
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      if (search && !doc.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (companyFilter !== "All" && doc.company !== companyFilter) return false;
      return true;
    });
  }, [documents, search, companyFilter]);
  
  const companies = useMemo(() => {
    const unique = [...new Set(documents.map(d => d.company))];
    return ["All", ...unique.sort()];
  }, [documents]);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <SearchLg className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary" />
            <input 
              placeholder="Search documents..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand w-64"
            />
          </div>
          <select 
            value={companyFilter} 
            onChange={(e) => setCompanyFilter(e.target.value)} 
            className="px-3 py-2 rounded-lg border border-secondary bg-primary text-sm outline-none focus:border-brand"
          >
            {companies.map(c => (
              <option key={c} value={c}>{c === "All" ? "All Companies" : c}</option>
            ))}
          </select>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid_hover">
          <Upload01 className="size-4" /> Upload Document
        </button>
      </div>
      
      {/* Document Grid */}
      {filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.map(doc => (
            <DocumentCard key={doc.id} doc={doc} />
          ))}
        </div>
      ) : (
        <div className="bg-primary rounded-xl border border-secondary p-12 text-center">
          <div className="size-16 rounded-full bg-secondary_alt flex items-center justify-center mx-auto mb-4">
            <Folder className="size-8 text-fg-quaternary" />
          </div>
          <h3 className="text-lg font-semibold text-primary mb-2">No documents found</h3>
          <p className="text-sm text-tertiary max-w-md mx-auto mb-6">
            {search || companyFilter !== "All" 
              ? "Try adjusting your search or filters to find what you're looking for."
              : "Upload your first document to get started."}
          </p>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-solid text-white text-sm font-medium hover:bg-brand-solid_hover mx-auto">
            <Upload01 className="size-4" /> Upload Document
          </button>
        </div>
      )}
      
      {/* Results count */}
      {filteredDocs.length > 0 && (
        <p className="text-sm text-tertiary">
          Showing {filteredDocs.length} of {documents.length} documents
        </p>
      )}
    </div>
  );
}

// ─── Main Documents Page ─────────────────────────────────────────────────────
export function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get current group and tab from URL params
  const currentGroupId = searchParams.get("group") || "pds";
  const currentTabId = searchParams.get("tab") || "";
  
  const currentGroup = documentGroups.find(g => g.id === currentGroupId) || documentGroups[0];
  // Default to first tab if not specified
  const activeTabId = currentTabId || currentGroup.tabs[0]?.id || "";
  
  const handleTabChange = (tabId: string) => {
    setSearchParams({ group: currentGroupId, tab: tabId });
  };

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">
        {/* Header with group name and sub-tabs */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
          <h1 className="text-xl font-semibold text-primary mb-4" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
            {currentGroup.label}
          </h1>
          
          {/* Sub-tabs for current group */}
          {currentGroup.tabs.length > 0 && (
            <div className="flex overflow-x-auto gap-6 -mb-px">
              {currentGroup.tabs.map(tab => {
                const isActive = activeTabId === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={"py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (isActive ? "border-brand-solid text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary")}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <DocumentLibraryContent groupId={currentGroupId} tabId={activeTabId} />
        </div>
      </main>
    </div>
  );
}
