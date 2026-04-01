import { useState } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Download01 } from "@untitledui/icons";

const EXPORTS = [
  { id: 1,  name: "All Clients",                category: "Clients" },
  { id: 2,  name: "Active Clients",             category: "Clients" },
  { id: 3,  name: "Inactive Clients",           category: "Clients" },
  { id: 4,  name: "Client Contacts",            category: "Clients" },
  { id: 5,  name: "Client Notes",               category: "Clients" },
  { id: 6,  name: "All Leads",                  category: "Leads" },
  { id: 7,  name: "Assigned Leads",             category: "Leads" },
  { id: 8,  name: "Unassigned Leads",           category: "Leads" },
  { id: 9,  name: "Converted Leads",            category: "Leads" },
  { id: 10, name: "Lead Activity Log",          category: "Leads" },
  { id: 11, name: "All Policies",               category: "Policies" },
  { id: 12, name: "Active Policies",            category: "Policies" },
  { id: 13, name: "Lapsed Policies",            category: "Policies" },
  { id: 14, name: "Pending Policies",           category: "Policies" },
  { id: 15, name: "Policy Renewals",            category: "Policies" },
  { id: 16, name: "All Commissions",            category: "Commissions" },
  { id: 17, name: "Upfront Commissions",        category: "Commissions" },
  { id: 18, name: "Trail Commissions",          category: "Commissions" },
  { id: 19, name: "Clawbacks",                  category: "Commissions" },
  { id: 20, name: "Adviser Splits",             category: "Commissions" },
  { id: 21, name: "All Submissions",            category: "Submissions" },
  { id: 22, name: "Pending Submissions",        category: "Submissions" },
  { id: 23, name: "Approved Submissions",       category: "Submissions" },
  { id: 24, name: "Declined Submissions",       category: "Submissions" },
  { id: 25, name: "Submission History",         category: "Submissions" },
];

export function ExportsPage() {
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState<number | null>(null);

  const filtered = EXPORTS.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  function handleDownload(id: number, name: string) {
    setDownloading(id);
    setTimeout(() => {
      const csv = `Export: ${name}\nGenerated: ${new Date().toLocaleString("en-AU")}\n`;
      const a = document.createElement("a");
      a.href = "data:text/csv," + encodeURIComponent(csv);
      a.download = `${name.toLowerCase().replace(/\s+/g, "-")}.csv`;
      a.click();
      setDownloading(null);
    }, 800);
  }

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />

      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">

        {/* Header */}
        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Exports</h1>
              <p className="text-sm text-tertiary mt-0.5">{filtered.length} exports available</p>
            </div>
            <div className="relative w-full sm:w-72">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exports..."
                className="w-full rounded-lg border border-secondary bg-primary pl-8 pr-3 py-2 text-sm text-primary outline-none focus:border-brand" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
          <div className="rounded-xl border border-secondary overflow-hidden bg-primary">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-tertiary border-b border-secondary">
                  <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Export</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-quaternary uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary">
                {filtered.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-16 text-center text-sm text-quaternary">No exports match your search</td></tr>
                ) : filtered.map(exp => (
                  <tr key={exp.id}
                    onClick={() => handleDownload(exp.id, exp.name)}
                    className="group hover:bg-secondary_alt cursor-pointer transition-colors">
                    <td className="px-4 py-3 font-medium text-primary group-hover:text-brand-secondary transition-colors">
                      {exp.name}
                    </td>
                    <td className="px-4 py-3 text-xs text-tertiary">{exp.category}</td>
                    <td className="px-4 py-3 text-right">
                      {downloading === exp.id ? (
                        <div className="inline-flex size-6 items-center justify-center">
                          <div className="size-3.5 rounded-full border-2 border-brand-solid border-t-transparent animate-spin" />
                        </div>
                      ) : (
                        <Download01 className="size-4 text-quaternary group-hover:text-brand-secondary transition-colors ml-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
