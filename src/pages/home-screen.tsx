import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { useState } from "react";

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

const AddWidgetModal = ({ open, onClose, onAdd, active }: { open: boolean; onClose: () => void; onAdd: (id: string) => void; active: string[] }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-secondary bg-primary shadow-xl p-6">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Add a widget</h2>
                    <p className="text-sm text-tertiary mt-1">Select a module to add to your Workbench.</p>
                </div>
                <div className="flex flex-col gap-2 max-h-96 overflow-y-auto">
                    {AVAILABLE_WIDGETS.map(w => {
                        const isActive = active.includes(w.id);
                        return (
                            <button key={w.id} disabled={isActive} onClick={() => { onAdd(w.id); onClose(); }}
                                className={`flex items-center justify-between rounded-lg px-4 py-3 border transition text-left ${isActive ? "border-secondary bg-secondary_alt opacity-50 cursor-not-allowed" : "border-secondary bg-primary hover:border-[#D34108] hover:bg-[#FFF4F1] cursor-pointer"}`}>
                                <div>
                                    <p className="text-sm font-semibold text-primary">{w.label}</p>
                                    <p className="text-xs text-tertiary mt-0.5">{w.description}</p>
                                </div>
                                {isActive && <span className="text-xs text-quaternary ml-4 shrink-0">Added</span>}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-5 flex justify-end">
                    <Button color="secondary" size="sm" onClick={() => onClose()}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};

export const HomeScreen = () => {
    const [widgets, setWidgets] = useState<string[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const addWidget = (id: string) => setWidgets(p => [...p, id]);
    const removeWidget = (id: string) => setWidgets(p => p.filter(w => w !== id));
    const getWidget = (id: string) => AVAILABLE_WIDGETS.find(w => w.id === id)!;

    return (
        <>
            {/* Slim sidebar — fixed, self-positions, renders own spacer div to push content */}
            <SidebarNavigationSlim
                activeUrl="/"
                items={navItems}
                footerItems={footerNavItems}
            />

            {/* Page content — the slim sidebar renders a spacer that pushes this right */}
            <main className="min-h-screen bg-primary">
                {/* Top action bar */}
                <div className="flex items-center justify-between px-8 pt-8 pb-2">
                    <div>
                        <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Workbench</h1>
                        <p className="text-xs text-tertiary mt-0.5">Your personalised CRM dashboard</p>
                    </div>
                    <Button color="primary" size="sm" onClick={() => setModalOpen(true)} className="!bg-[#D34108] hover:!bg-[#B83507] !border-[#D34108]">
                        <span className="inline-flex items-center gap-1.5"><Plus className="size-4" /> Add widget</span>
                    </Button>
                </div>

                {/* Widget area */}
                <div className="p-8 pt-4">
                    {widgets.length === 0 ? (
                        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
                            <div className="flex size-16 items-center justify-center rounded-2xl border-2 border-dashed border-secondary">
                                <Plus className="size-7 text-fg-quaternary" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Your Workbench is empty</p>
                                <p className="text-sm text-tertiary mt-1.5 max-w-sm">Add widgets to surface the data that matters most to your day.</p>
                            </div>
                            <Button color="primary" size="md" onClick={() => setModalOpen(true)} className="!bg-[#D34108] hover:!bg-[#B83507] !border-[#D34108] mt-2">
                                <span className="inline-flex items-center gap-1.5"><Plus className="size-4" /> Add your first widget</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {widgets.map(id => <WidgetCard key={id} label={getWidget(id).label} description={getWidget(id).description} onRemove={() => removeWidget(id)} />)}
                            <EmptySlot onAdd={() => setModalOpen(true)} />
                        </div>
                    )}
                </div>
            </main>

            <AddWidgetModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={addWidget} active={widgets} />
        </>
    );
};
