import { useState } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { CreateLeadModal } from "@/components/modals/create-lead-modal";
import { Plus } from "@untitledui/icons";

interface Props { children: React.ReactNode; }

export function AppShell({ children }: Props) {
  const [showCreateLead, setShowCreateLead] = useState(false);
  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <div className="relative hidden lg:flex lg:flex-col lg:shrink-0">
        <SidebarNavigationSlim items={navItems} footerItems={footerNavItems}/>
        {/* Create New Lead button — fixed at bottom of sidebar */}
        <div className="absolute bottom-20 left-0 right-0 px-2 hidden lg:block">
          <button
            onClick={() => setShowCreateLead(true)}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-solid text-white text-xs font-semibold py-2.5 px-3 hover:bg-brand-solid_hover transition-colors shadow-sm">
            <Plus className="size-3.5"/> Create New Lead
          </button>
        </div>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
      {showCreateLead && <CreateLeadModal onClose={() => setShowCreateLead(false)}/>}
    </div>
  );
}
