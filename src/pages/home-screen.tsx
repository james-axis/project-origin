import { Plus } from "@untitledui/icons";
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
            <div className="absolute inset-0 bg-overlay" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md rounded-2xl border border-secondary bg-primary shadow-2xl">
                <div className="flex items-center justify-between border-b border-secondary px-6 py-4">
                    <h2 className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Add widget</h2>
                    <button onClick={onClose} className="text-sm text-quaternary hover:text-secondary transition">Close</button>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                    {available.length === 0 ? (
                        <p className="col-span-2 text-center text-sm text-quaternary py-8">All widgets added</p>
                    ) : available.map(w => (
                        <button
                            key={w.id}
                            onClick={() => { onAdd(w.id); onClose(); }}
                            className="flex flex-col gap-1 rounded-xl border border-secondary bg-primary p-4 text-left hover:border-[#D34108] hover:bg-[#FFF4F1] transition"
                        >
                            <p className="text-sm font-semibold text-primary">{w.label}</p>
                            <p className="text-xs text-quaternary">{w.description}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export function HomeScreen() {
    const location = useLocation();
    const isSettings = location.pathname === "/settings" || location.pathname.startsWith("/settings/");

    const [widgets, setWidgets] = useState<string[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    const getWidget = (id: string) => AVAILABLE_WIDGETS.find(w => w.id === id) ?? { label: id, description: "" };
    const addWidget = (id: string) => setWidgets(prev => [...prev, id]);
    const removeWidget = (id: string) => setWidgets(prev => prev.filter(w => w !== id));

    return (
        <div className="lg:flex min-h-screen bg-primary">
            <SidebarNavigationSlim navItems={navItems} footerNavItems={footerNavItems} />
            <div className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block" />
            <header className="flex h-16 items-center justify-between border-b border-secondary bg-primary py-3 pr-2 pl-4 lg:hidden">
                <div className="flex items-center gap-2">
                    <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
                        <path d="M4 16L16 4L28 16L16 28L4 16Z" fill="#D34108" />
                    </svg>
                    <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>AXIS</span>
                </div>
            </header>
            <main className="min-h-screen bg-primary overflow-x-hidden lg:flex-1">
                {isSettings ? (
                    <Settings />
                ) : (
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between border-b border-secondary px-6 py-4 lg:px-8">
                            <div>
                                <h1 className="text-lg font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Workbench</h1>
                                <p className="text-sm text-tertiary">Your personalised CRM dashboard</p>
                            </div>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[#D34108] px-4 py-2 text-sm font-medium text-white hover:bg-[#B83507] transition-colors"
                            >
                                <Plus className="size-4" aria-hidden />
                                Add widget
                            </button>
                        </div>
                        <div className="p-4 pt-4 lg:p-8 lg:pt-6">
                            {widgets.length === 0 ? (
                                <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
                                    <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-secondary bg-primary shadow-xs">
                                        <Plus className="size-7 text-fg-quaternary" />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Your Workbench is empty</p>
                                        <p className="text-sm text-tertiary mt-1.5 max-w-sm">Add widgets to surface the data that matters most to your day.</p>
                                    </div>
                                    <button
                                        onClick={() => setModalOpen(true)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#D34108] px-4 py-2 text-sm font-medium text-white hover:bg-[#B83507] transition-colors"
                                    >
                                        <Plus className="size-4" aria-hidden />
                                        Add your first widget
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {widgets.map(id => <WidgetCard key={id} label={getWidget(id).label} description={getWidget(id).description} onRemove={() => removeWidget(id)} />)}
                                    <EmptySlot onAdd={() => setModalOpen(true)} />
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
            <AddWidgetModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addWidget} existingWidgets={widgets} />
        </div>
    );
}
