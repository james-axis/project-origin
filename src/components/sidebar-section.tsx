import { useState } from "react";
import { ChevronDown, ChevronRight } from "@untitledui/icons";

interface Props {
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
  defaultOpen?: boolean;
  noPadding?: boolean;
}

export function SidebarSection({ title, action, children, defaultOpen = true, noPadding = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-secondary bg-primary overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-secondary_alt border-b border-secondary">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 flex-1 min-w-0 text-left">
          {open
            ? <ChevronDown className="size-3.5 text-quaternary shrink-0" />
            : <ChevronRight className="size-3.5 text-quaternary shrink-0" />}
          <span className="text-xs font-semibold text-primary truncate">{title}</span>
        </button>
        {action && (
          <button onClick={action.onClick} className="text-[10px] font-medium text-brand-secondary hover:underline shrink-0 ml-2">
            {action.label}
          </button>
        )}
      </div>
      {open && (
        <div className={noPadding ? "" : "px-3 py-3"}>
          {children}
        </div>
      )}
    </div>
  );
}
