import type { FC } from "react";
import { useState } from "react";
import { Link } from "react-router";
import { LogOut01, Settings01 } from "@untitledui/icons";
import { CreateLeadModal } from "@/components/modals/create-lead-modal";
import { TourTriggerButton } from "@/components/app-tour";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/components/base/avatar/avatar";
import { AvatarLabelGroup } from "@/components/base/avatar/avatar-label-group";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { cx } from "@/utils/cx";
import { MobileNavigationHeader } from "../base-components/mobile-header";
import { NavItemBase } from "../base-components/nav-item";
import { NavItemButton } from "../base-components/nav-item-button";
import { NavList } from "../base-components/nav-list";
import type { NavItemType } from "../config";

interface SidebarNavigationSlimProps {
    /** URL of the currently active item. */
    activeUrl?: string;
    /** List of items to display. */
    items: (NavItemType & { icon: FC<{ className?: string }> })[];
    /** List of footer items to display. */
    footerItems?: (NavItemType & { icon: FC<{ className?: string }> })[];
    /** Whether to hide the border. */
    hideBorder?: boolean;
    /** Whether to hide the right side border. */
    hideRightBorder?: boolean;
}

export const SidebarNavigationSlim = ({ activeUrl, items, footerItems = [], hideBorder, hideRightBorder }: SidebarNavigationSlimProps) => {
    const activeItem = [...items, ...footerItems].find((item) => item.href === activeUrl || item.items?.some((subItem) => subItem.href === activeUrl));
    const [currentItem, setCurrentItem] = useState(activeItem || items[1]);
    const [isHovering, setIsHovering] = useState(false);
    const [showCreateLead, setShowCreateLead] = useState(false);

    const isSecondarySidebarVisible = isHovering && Boolean(currentItem.items?.length);

    const MAIN_SIDEBAR_WIDTH = 68;
    const SECONDARY_SIDEBAR_WIDTH = 268;

    const mainSidebar = (
        <aside
            style={{
                width: MAIN_SIDEBAR_WIDTH,
            }}
            className={cx(
                "group flex h-full max-h-full max-w-full overflow-y-auto py-1 pl-1 transition duration-100 ease-linear",
                isSecondarySidebarVisible && "bg-primary",
            )}
        >
            <div
                className={cx(
                    "flex w-auto flex-col justify-between rounded-xl bg-primary pt-5 ring-1 ring-secondary transition duration-300 ring-inset",
                    hideBorder && !isSecondarySidebarVisible && "ring-transparent",
                )}
            >
                <div className="flex justify-center px-3">
                    <Link 
                        to="/workbench" 
                        className="block rounded-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2" 
                        title="Go to Workbench"
                        onPointerEnter={() => setCurrentItem(items[0])}
                    >
                        <svg className="size-8" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="Axis"><defs><linearGradient id="axis-slim-lg" x1="16" y1="31.9" x2="16" y2="-0.1" gradientTransform="translate(0 31.9) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#0a0d12"/></linearGradient></defs><path fill="#D34108" d="M0,12.8C0,8.32,0,6.08.87,4.37c.77-1.51,1.99-2.73,3.5-3.5C6.08,0,8.32,0,12.8,0h6.4C23.68,0,25.92,0,27.63.87c1.51.77,2.73,1.99,3.5,3.5.87,1.71.87,3.95.87,8.43v6.4c0,4.48,0,6.72-.87,8.43-.77,1.51-1.99,2.73-3.5,3.5-1.71.87-3.95.87-8.43.87h-6.4c-4.48,0-6.72,0-8.43-.87-1.51-.77-2.73-1.99-3.5-3.5C0,25.92,0,23.68,0,19.2v-6.4Z"/><path fill="url(#axis-slim-lg)" fillOpacity=".2" d="M0,12.8C0,8.32,0,6.08.87,4.37c.77-1.51,1.99-2.73,3.5-3.5C6.08,0,8.32,0,12.8,0h6.4C23.68,0,25.92,0,27.63.87c1.51.77,2.73,1.99,3.5,3.5.87,1.71.87,3.95.87,8.43v6.4c0,4.48,0,6.72-.87,8.43-.77,1.51-1.99,2.73-3.5,3.5-1.71.87-3.95.87-8.43.87h-6.4c-4.48,0-6.72,0-8.43-.87-1.51-.77-2.73-1.99-3.5-3.5C0,25.92,0,23.68,0,19.2v-6.4Z"/><path fill="#fff" d="M13.43,15.89l-9.43,10.27h4.86L28,5.35h-4.99l-7.08,7.63-7.08-7.63h-4.86l9.43,10.54Z"/><path fill="#fff" d="M23.01,26.16h4.99l-9.16-9.85c-1.44,2.37-.88,4.23-.42,4.86l4.58,4.99Z"/></svg>
                    </Link>
                </div>

                <ul className="mt-4 flex flex-col gap-0.5 px-3">
                    {items.map((item) => (
                        <li 
                            key={item.label} 
                            onPointerEnter={() => setCurrentItem(item)} 
                            title={item.label}
                            data-tour={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                            <NavItemButton
                                size="md"
                                current={currentItem.href === item.href}
                                href={item.href}
                                label={item.label || ""}
                                icon={item.icon}
                                onClick={() => setCurrentItem(item)}
                            />
                        </li>
                    ))}
                </ul>
                <div className="mt-auto flex flex-col gap-2 px-3 py-5">
                    {/* Footer nav items (Settings, Support) */}
                    <ul className="flex flex-col gap-0.5 mb-3">
                        {footerItems.map((item) => (
                            <li key={item.label} onPointerEnter={() => setCurrentItem(item)} title={item.label}>
                                <NavItemButton
                                    size="md"
                                    current={currentItem.href === item.href}
                                    href={item.href}
                                    label={item.label || ""}
                                    icon={item.icon}
                                    onClick={() => setCurrentItem(item)}
                                />
                            </li>
                        ))}
                    </ul>
                    
                    {showCreateLead && <CreateLeadModal onClose={() => setShowCreateLead(false)} />}

                    <Link
                        to="/profile"
                        className="group relative inline-flex rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                        <Avatar status="online" src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80" size="md" alt="Olivia Rhye" />
                    </Link>
                </div>
            </div>
        </aside>
    );

    const secondarySidebar = (
        <AnimatePresence initial={false}>
            {isSecondarySidebarVisible && (
                <motion.div
                    initial={{ width: 0, borderColor: "var(--color-border-secondary)" }}
                    animate={{ width: SECONDARY_SIDEBAR_WIDTH, borderColor: "var(--color-border-secondary)" }}
                    exit={{ width: 0, borderColor: "rgba(0,0,0,0)", transition: { borderColor: { type: "tween", delay: 0.05 } } }}
                    transition={{ type: "spring", damping: 26, stiffness: 220, bounce: 0 }}
                    className={cx(
                        "relative h-full overflow-x-hidden overflow-y-auto bg-primary",
                        !(hideBorder || hideRightBorder) && "box-content border-r-[1.5px]",
                    )}
                >
                    <div style={{ width: SECONDARY_SIDEBAR_WIDTH }} className="flex h-full flex-col">
                        {/* Scrollable nav content */}
                        <div className="flex-1 overflow-y-auto px-4 pt-5 pb-2">
                            <h3 className="text-sm font-semibold text-brand-secondary mb-3">{currentItem.label}</h3>
                            {/* Search bar */}
                            <div className="relative mb-2">
                                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-fg-quaternary pointer-events-none" viewBox="0 0 16 16" fill="none"><circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                                <input placeholder="Search..." className="w-full rounded-lg border border-secondary bg-secondary_alt pl-7 pr-3 py-1.5 text-xs text-primary outline-none focus:border-brand transition-colors placeholder:text-quaternary"/>
                            </div>
                            <ul className="py-1">
                                {currentItem.items?.map((item) => (
                                    <li key={item.label} className="py-0.5">
                                        <NavItemBase current={activeUrl === item.href} href={item.href} icon={item.icon} badge={item.badge} type="link">
                                            {item.label}
                                        </NavItemBase>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        {/* Fixed bottom: What's New + Create New Lead + user footer */}
                        <div className="shrink-0 border-t border-secondary bg-primary">
                            <div className="px-4 pt-3 pb-2">
                                <TourTriggerButton className="w-full" />
                            </div>
                            <div className="px-4 pb-3">
                                <button onClick={() => setShowCreateLead(true)}
                                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-solid text-white text-sm font-semibold py-2.5 px-4 hover:bg-brand-solid_hover transition-colors shadow-sm">
                                    <svg className="size-4" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/></svg>
                                    Create New Lead
                                </button>
                            </div>
                            <div className="flex items-center justify-between px-4 pb-5">
                                <div>
                                    <p className="text-sm font-semibold text-primary">Olivia Rhye</p>
                                    <p className="text-sm text-tertiary">olivia@untitledui.com</p>
                                </div>
                                <ButtonUtility size="sm" color="tertiary" tooltip="Log out" icon={LogOut01} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {/* Desktop sidebar navigation */}
            <div
                className="z-40 hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex"
                onPointerEnter={() => setIsHovering(true)}
                onPointerLeave={() => setIsHovering(false)}
            >
                {mainSidebar}
                {secondarySidebar}
            </div>

            {/* Placeholder to take up physical space because the real sidebar has `fixed` position. */}
            <div
                style={{
                    paddingLeft: MAIN_SIDEBAR_WIDTH,
                }}
                className="invisible hidden lg:sticky lg:top-0 lg:bottom-0 lg:left-0 lg:block"
            />

            {/* Mobile header navigation */}
            <MobileNavigationHeader>
                <aside className="group flex h-full max-h-full w-full max-w-full flex-col justify-between overflow-y-auto bg-primary pt-4">
                    <div className="px-4">
                    </div>

                    <NavList items={items} />

                    <div className="mt-auto flex flex-col gap-5 px-2 py-4">
                        <div className="flex flex-col gap-2">
                            <NavItemBase current={activeUrl === "/settings"} type="link" href="/settings" icon={Settings01}>
                                Settings
                            </NavItemBase>
                        </div>

                        <div className="relative flex items-center gap-3 border-t border-secondary pt-6 pr-8 pl-2">
                            <AvatarLabelGroup
                                status="online"
                                size="md"
                                src="https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80"
                                title="Olivia Rhye"
                                subtitle="olivia@untitledui.com"
                            />

                            <div className="absolute top-1/2 right-0 -translate-y-1/2">
                                <Button
                                    size="sm"
                                    color="tertiary"
                                    iconLeading={<LogOut01 className="size-5 text-fg-quaternary transition-inherit-all group-hover:text-fg-quaternary_hover" />}
                                    className="p-1.5!"
                                />
                            </div>
                        </div>
                    </div>
                </aside>
            </MobileNavigationHeader>
        </>
    );
};
