import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { SidebarNavigationSectionDividers } from "@/components/application/app-navigation/sidebar-navigation/sidebar-section-dividers";
import { navItems } from "@/components/application/app-navigation/config";
import { useState } from "react";

const AVAILABLE_WIDGETS = [
    { id: "tasks",        label: "Tasks",        description: "Overdue and due today" },
    { id: "clients",      label: "Clients",      description: "Active clients and recent additions" },
    { id: "applications", label: "Applications", description: "In-progress by status" },
    { id: "compliance",   label: "Compliance",   description: "Items awaiting review" },
    { id: "claims",       label: "Claims",       description: "Open claims by status" },
    { id: "dishonours",   label: "Dishonours",   description: "Outstanding dishonours" },
    { id: "commissions",  label: "Commissions",  description: "This month vs last month" },
    { id: "payments",     label: "Payments",     description: "Recent payment activity" },
];

const EmptyWidgetSlot = ({ onAdd }: { onAdd: () => void }) => (
    <button
        onClick={onAdd}
        className="group flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-secondary bg-primary p-8 text-center transition hover:border-brand-solid hover:bg-brand-primary_alt cursor-pointer min-h-48"
    >
        <div className="flex size-10 items-center justify-center rounded-full border border-secondary bg-primary shadow-xs group-hover:border-brand-solid group-hover:bg-brand-secondary">
            <Plus className="size-5 text-fg-quaternary group-hover:text-fg-brand-secondary" />
        </div>
        <div>
            <p className="text-sm font-semibold text-secondary group-hover:text-fg-brand-secondary">Add widget</p>
            <p className="text-xs text-quaternary mt-0.5">Choose a module to display here</p>
        </div>
    </button>
);

const WidgetCard = ({ label, description, onRemove }: { label: string; description: string; onRemove: () => void }) => (
    <div className="flex flex-col rounded-xl border border-secondary bg-primary p-5 shadow-xs min-h-48">
        <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-primary">{label}</p>
            <button
                onClick={onRemove}
                className="text-xs text-quaternary hover:text-secondary transition"
            >
                Remove
            </button>
        </div>
        <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-quaternary">{description} — coming soon</p>
        </div>
    </div>
);

const AddWidgetModal = ({ open, onClose, onAdd, active }: {
    open: boolean;
    onClose: () => void;
    onAdd: (id: string) => void;
    active: string[];
}) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-secondary bg-primary shadow-xl p-6">
                <div className="mb-5">
                    <h2 className="text-lg font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Add a widget</h2>
                    <p className="text-sm text-tertiary mt-1">Select a module to add to your Workbench.</p>
                </div>
                <div className="flex flex-col gap-2">
                    {AVAILABLE_WIDGETS.map(w => {
                        const isActive = active.includes(w.id);
                        return (
                            <button
                                key={w.id}
                                disabled={isActive}
                                onClick={() => { onAdd(w.id); onClose(); }}
                                className={`flex items-center justify-between rounded-lg px-4 py-3 border transition text-left
                                    ${isActive
                                        ? "border-secondary bg-secondary text-quaternary cursor-not-allowed opacity-50"
                                        : "border-secondary bg-primary hover:border-brand-solid hover:bg-brand-primary_alt cursor-pointer"
                                    }`}
                            >
                                <div>
                                    <p className="text-sm font-semibold text-primary">{w.label}</p>
                                    <p className="text-xs text-tertiary">{w.description}</p>
                                </div>
                                {isActive && <span className="text-xs text-quaternary">Added</span>}
                            </button>
                        );
                    })}
                </div>
                <div className="mt-5 flex justify-end">
                    <Button color="secondary" size="sm" onPress={onClose}>Cancel</Button>
                </div>
            </div>
        </div>
    );
};

export const HomeScreen = () => {
    const [widgets, setWidgets] = useState<string[]>([]);
    const [modalOpen, setModalOpen] = useState(false);

    const addWidget = (id: string) => setWidgets(prev => [...prev, id]);
    const removeWidget = (id: string) => setWidgets(prev => prev.filter(w => w !== id));

    const getWidget = (id: string) => AVAILABLE_WIDGETS.find(w => w.id === id)!;

    // Grid slots: always show filled widgets + one empty slot at end
    const slots = [...widgets, "empty"];

    return (
        <div className="flex h-screen bg-primary">
            {/* Sidebar */}
            <SidebarNavigationSectionDividers
                activeUrl="/"
                items={navItems}
            />

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Top bar */}
                <header className="flex h-16 items-center justify-between border-b border-secondary bg-primary px-6">
                    <div>
                        <h1 className="text-lg font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                            Workbench
                        </h1>
                        <p className="text-xs text-tertiary">Your personalised CRM dashboard</p>
                    </div>
                    <Button
                        color="primary"
                        size="sm"
                        onPress={() => setModalOpen(true)}
                        className="!bg-[#D34108] hover:!bg-[#B83507] !border-[#D34108]"
                    >
                        <Plus className="size-4 mr-1.5" />
                        Add widget
                    </Button>
                </header>

                {/* Widget grid */}
                <main className="flex-1 overflow-y-auto p-6">
                    {widgets.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full border border-secondary bg-secondary shadow-xs">
                                <Plus className="size-6 text-fg-quaternary" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                                    Your Workbench is empty
                                </p>
                                <p className="text-sm text-tertiary mt-1 max-w-xs">
                                    Add widgets to surface the data that matters most to your day.
                                </p>
                            </div>
                            <Button
                                color="primary"
                                size="md"
                                onPress={() => setModalOpen(true)}
                                className="!bg-[#D34108] hover:!bg-[#B83507] !border-[#D34108] mt-2"
                            >
                                <Plus className="size-4 mr-1.5" />
                                Add your first widget
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            {widgets.map(id => {
                                const w = getWidget(id);
                                return (
                                    <WidgetCard
                                        key={id}
                                        label={w.label}
                                        description={w.description}
                                        onRemove={() => removeWidget(id)}
                                    />
                                );
                            })}
                            <EmptyWidgetSlot onAdd={() => setModalOpen(true)} />
                        </div>
                    )}
                </main>
            </div>

            {/* Add widget modal */}
            <AddWidgetModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onAdd={addWidget}
                active={widgets}
            />
        </div>
    );
};
