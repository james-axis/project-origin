import { Plus, X, Check, Settings01 } from "@untitledui/icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { useState } from "react";
import { useLocation } from "react-router";
import { Settings } from "@/pages/settings";

const AVAILABLE_WIDGETS = [
    { id: "tasks",        label: "Tasks",        description: "Overdue and due today" },
    { id: "clients",      label: "Clients",      description: "Active clients and recent additions" },
    { id: "applications", label: "Applications", description: "In-progress applications by status" },
    { id: "compliance",   label: "Compliance",   description: "Items awaiting review" },
    { id: "claims",       label: "Claims",       description: "Open claims by status" },
    { id: "dishonours",   label: "Dishonours",   description: "Outstanding dishonours" },
    { id: "commissions",  label: "Commissions",  description: "This month vs last month" },
    { id: "payments",     label: "Payments",     description: "Recent payment activity" },
];

interface WorkbenchTab {
    id: string;
    label: string;
    widgets: string[];
}

const EmptySlot = ({ onAdd }: { onAdd: () => void }) => (
    <button onClick={onAdd} className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-secondary bg-primary p-8 text-center transition hover:border-[#D34108] hover:bg-[#FFF4F1] cursor-pointer min-h-48">
        <div className="flex size-10 items-center justify-center rounded-full border border-secondary bg-primary shadow-xs group-hover:border-[#D34108] group-hover:bg-[#FFE8E1]">
            <Plus className="size-5 text-fg-quaternary group-hover:text-[#D34108]" />
        </div>
        <div>
            <p className="text-sm font-semibold text-secondary group-hover:text-[#D34108]">Add widget</p>
            <p className="text-xs text-quaternary mt-0.5">Choose a module to display here</p>
        </div>
    </button>
);

const WidgetCard = ({ label, description, onRemove }: { label: string; description: string; onRemove: () => void }) => (
    <div className="flex flex-col rounded-xl border border-secondary bg-primary p-5 shadow-xs min-h-48">
        <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>{label}</p>
            <button onClick={onRemove} className="text-xs text-quaternary hover:text-secondary transition">Remove</button>
        </div>
        <div className="flex flex-1 items-center justify-center rounded-lg bg-secondary_alt">
            <p className="text-xs text-quaternary">{description}</p>
        </div>
    </div>
);

const AddWidgetModal = ({ open, onClose, onAdd, existingWidgets }: { open: boolean; onClose: () => void; onAdd: (id: string) => void; existingWidgets: string[] }) => {
    if (!open) return null;
    const available = AVAILABLE_WIDGETS.filter(w => !existingWidgets.includes(w.id));
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl">
                <div className="flex items-center justify-between border-b border-secondary px-6 py-4">
                    <h2 className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Add widget</h2>
                    <button onClick={onClose} className="text-sm text-quaternary hover:text-secondary transition">Close</button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {available.length === 0 ? (
                        <p className="col-span-2 text-center text-sm text-quaternary py-8">All widgets added</p>
                    ) : available.map(w => (
                        <button key={w.id} onClick={() => { onAdd(w.id); onClose(); }}
                            className="flex flex-col gap-1 rounded-xl border border-secondary bg-primary p-4 text-left hover:border-[#D34108] hover:bg-[#FFF4F1] transition">
                            <p className="text-sm font-semibold text-primary">{w.label}</p>
                            <p className="text-xs text-quaternary">{w.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RenameTabModal = ({ open, current, onSave, onClose }: { open: boolean; current: string; onSave: (name: string) => void; onClose: () => void }) => {
    const [value, setValue] = useState(current);
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose} />
            <div className="relative z-10 w-full max-w-sm rounded-2xl border border-secondary bg-primary shadow-2xl">
                <div className="flex items-center justify-between border-b border-secondary px-5 py-4">
                    <h3 className="text-base font-medium text-primary">Rename tab</h3>
                    <button onClick={onClose} className="flex size-7 items-center justify-center rounded-lg text-fg-quaternary hover:bg-secondary"><X className="size-4" aria-hidden /></button>
                </div>
                <div className="px-5 py-4 space-y-4">
                    <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === "Enter" && value.trim() && (onSave(value.trim()), onClose())}
                        autoFocus className="w-full rounded-lg border border-primary bg-primary px-3 py-2.5 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand" />
                </div>
                <div className="flex gap-2 border-t border-secondary px-5 py-4">
                    <button onClick={onClose} className="flex-1 rounded-lg border border-secondary bg-primary px-3 py-2.5 text-sm font-medium text-secondary hover:bg-secondary transition-colors">Cancel</button>
                    <button onClick={() => { if (value.trim()) { onSave(value.trim()); onClose(); }}} disabled={!value.trim()}
                        className="flex-1 rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover disabled:opacity-50 transition-colors">
                        <span className="flex items-center justify-center gap-1.5"><Check className="size-3.5" aria-hidden />Save</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export function HomeScreen() {
    const location = useLocation();
    const isSettings = location.pathname === "/settings" || location.pathname.startsWith("/settings/");

    const [tabs, setTabs] = useState<WorkbenchTab[]>([{ id: "default", label: "Default", widgets: [] }]);
    const [activeTabId, setActiveTabId] = useState("default");
    const [widgetModalOpen, setWidgetModalOpen] = useState(false);
    const [renameModal, setRenameModal] = useState<{ open: boolean; tabId: string; current: string }>({ open: false, tabId: "", current: "" });

    const activeTab = tabs.find(t => t.id === activeTabId) ?? tabs[0];

    function addTab() {
        const id = Date.now().toString();
        const label = "Tab " + (tabs.length + 1);
        setTabs(prev => [...prev, { id, label, widgets: [] }]);
        setActiveTabId(id);
    }

    function removeTab(id: string) {
        if (tabs.length === 1) return; // always keep at least one
        const idx = tabs.findIndex(t => t.id === id);
        setTabs(prev => prev.filter(t => t.id !== id));
        if (activeTabId === id) {
            setActiveTabId(tabs[idx > 0 ? idx - 1 : 1]?.id ?? tabs[0].id);
        }
    }

    function renameTab(id: string, label: string) {
        setTabs(prev => prev.map(t => t.id === id ? { ...t, label } : t));
    }

    function addWidget(widgetId: string) {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, widgets: [...t.widgets, widgetId] } : t));
    }

    function removeWidget(widgetId: string) {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, widgets: t.widgets.filter(w => w !== widgetId) } : t));
    }

    const getWidget = (id: string) => AVAILABLE_WIDGETS.find(w => w.id === id) ?? { label: id, description: "" };

    return (
        <div className="lg:flex min-h-screen bg-primary">
            <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
            <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />
            <main className="min-h-screen bg-primary overflow-x-hidden lg:flex-1">
                {isSettings ? (
                    <Settings />
                ) : (
                    <div className="flex flex-col h-full">
                        {/* Header — same structure as Settings */}
                        <div className="border-b border-secondary bg-primary px-4 sm:px-6 lg:px-8 pt-6 pb-0">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Workbench</h1>
                                    <p className="text-sm text-tertiary mt-0.5">Your personalised CRM dashboard</p>
                                </div>
                                <button onClick={() => setWidgetModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-solid px-3 py-2 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
                                    <Plus className="size-3.5" aria-hidden />Add widget
                                </button>
                            </div>

                            {/* Tab bar — same style as Settings tab bar */}
                            <div className="flex items-center overflow-x-auto gap-0 -mb-px">
                                {tabs.map(tab => {
                                    const isActive = tab.id === activeTabId;
                                    return (
                                        <div key={tab.id} className="group relative flex items-center">
                                            <button onClick={() => setActiveTabId(tab.id)}
                                                onDoubleClick={() => setRenameModal({ open: true, tabId: tab.id, current: tab.label })}
                                                className={"flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors " + (isActive ? "border-brand text-brand-secondary" : "border-transparent text-tertiary hover:text-secondary hover:border-secondary")}>
                                                {tab.label}
                                            </button>
                                            {/* Rename / remove on hover */}
                                            <div className="absolute right-0 top-1 hidden group-hover:flex items-center gap-0.5 pr-1">
                                                <button onClick={() => setRenameModal({ open: true, tabId: tab.id, current: tab.label })}
                                                    title="Rename tab"
                                                    className="flex size-5 items-center justify-center rounded text-fg-quaternary hover:bg-secondary hover:text-secondary transition-colors">
                                                    <Settings01 className="size-3" aria-hidden />
                                                </button>
                                                {tabs.length > 1 && (
                                                    <button onClick={() => removeTab(tab.id)}
                                                        title="Remove tab"
                                                        className="flex size-5 items-center justify-center rounded text-fg-quaternary hover:bg-error-secondary hover:text-error-primary transition-colors">
                                                        <X className="size-3" aria-hidden />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {/* Add tab */}
                                <button onClick={addTab} title="Add tab"
                                    className="flex size-9 items-center justify-center text-fg-quaternary hover:text-secondary hover:bg-secondary_alt rounded transition-colors ml-1 mb-px">
                                    <Plus className="size-4" aria-hidden />
                                </button>
                            </div>
                        </div>

                        {/* Tab content */}
                        <div className="p-4 pt-6 lg:p-8 lg:pt-6">
                            {activeTab.widgets.length === 0 ? (
                                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 text-center">
                                    <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-secondary bg-primary shadow-xs">
                                        <Plus className="size-7 text-fg-quaternary" />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>{activeTab.label} is empty</p>
                                        <p className="text-sm text-tertiary mt-1.5 max-w-sm">Add widgets to surface the data that matters most.</p>
                                    </div>
                                    <button onClick={() => setWidgetModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#D34108] px-4 py-2 text-sm font-medium text-white hover:bg-[#B83507] transition-colors">
                                        <Plus className="size-4" /> Add your first widget
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {activeTab.widgets.map(id => (
                                        <WidgetCard key={id} label={getWidget(id).label} description={getWidget(id).description} onRemove={() => removeWidget(id)} />
                                    ))}
                                    <EmptySlot onAdd={() => setWidgetModalOpen(true)} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <AddWidgetModal open={widgetModalOpen} onClose={() => setWidgetModalOpen(false)} onAdd={addWidget} existingWidgets={activeTab.widgets} />
            <RenameTabModal open={renameModal.open} current={renameModal.current}
                onSave={label => renameTab(renameModal.tabId, label)}
                onClose={() => setRenameModal({ open: false, tabId: "", current: "" })} />
        </div>
    );
}
