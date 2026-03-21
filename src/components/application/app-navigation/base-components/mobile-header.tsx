import type { PropsWithChildren } from "react";
import { X as CloseIcon, Menu02 } from "@untitledui/icons";
import {
    Button as AriaButton,
    Dialog as AriaDialog,
    DialogTrigger as AriaDialogTrigger,
    Modal as AriaModal,
    ModalOverlay as AriaModalOverlay,
} from "react-aria-components";
import { cx } from "@/utils/cx";

export const MobileNavigationHeader = ({ children }: PropsWithChildren) => {
    return (
        <AriaDialogTrigger>
            <header className="flex h-16 items-center justify-between border-b border-secondary bg-primary py-3 pr-2 pl-4 lg:hidden">
                <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{width:32,height:32}} aria-label="Axis"><defs><linearGradient id="axis-mob" x1="16" y1="31.9" x2="16" y2="-0.1" gradientTransform="translate(0 31.9) scale(1 -1)" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#0a0d12"/></linearGradient></defs><path fill="#ff4405" d="M0,12.8C0,8.32,0,6.08.87,4.37c.77-1.51,1.99-2.73,3.5-3.5C6.08,0,8.32,0,12.8,0h6.4C23.68,0,25.92,0,27.63.87c1.51.77,2.73,1.99,3.5,3.5.87,1.71.87,3.95.87,8.43v6.4c0,4.48,0,6.72-.87,8.43-.77,1.51-1.99,2.73-3.5,3.5-1.71.87-3.95.87-8.43.87h-6.4c-4.48,0-6.72,0-8.43-.87-1.51-.77-2.73-1.99-3.5-3.5C0,25.92,0,23.68,0,19.2v-6.4Z"/><path fill="url(#axis-mob)" fillOpacity=".2" d="M0,12.8C0,8.32,0,6.08.87,4.37c.77-1.51,1.99-2.73,3.5-3.5C6.08,0,8.32,0,12.8,0h6.4C23.68,0,25.92,0,27.63.87c1.51.77,2.73,1.99,3.5,3.5.87,1.71.87,3.95.87,8.43v6.4c0,4.48,0,6.72-.87,8.43-.77,1.51-1.99,2.73-3.5,3.5-1.71.87-3.95.87-8.43.87h-6.4c-4.48,0-6.72,0-8.43-.87-1.51-.77-2.73-1.99-3.5-3.5C0,25.92,0,23.68,0,19.2v-6.4Z"/><path fill="#fff" d="M13.43,15.89l-9.43,10.27h4.86L28,5.35h-4.99l-7.08,7.63-7.08-7.63h-4.86l9.43,10.54Z"/><path fill="#fff" d="M23.01,26.16h4.99l-9.16-9.85c-1.44,2.37-.88,4.23-.42,4.86l4.58,4.99Z"/></svg>

                <AriaButton
                    aria-label="Expand navigation menu"
                    className="group flex items-center justify-center rounded-lg bg-primary p-2 text-fg-secondary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary_hover focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                    <Menu02 className="size-6 transition duration-200 ease-in-out group-aria-expanded:opacity-0" />
                    <CloseIcon className="absolute size-6 opacity-0 transition duration-200 ease-in-out group-aria-expanded:opacity-100" />
                </AriaButton>
            </header>

            <AriaModalOverlay
                isDismissable
                className={({ isEntering, isExiting }) =>
                    cx(
                        "fixed inset-0 z-50 cursor-pointer bg-overlay/70 pr-16 backdrop-blur-md lg:hidden",
                        isEntering && "duration-300 ease-in-out animate-in fade-in",
                        isExiting && "duration-200 ease-in-out animate-out fade-out",
                    )
                }
            >
                {({ state }) => (
                    <>
                        <AriaButton
                            aria-label="Close navigation menu"
                            onPress={() => state.close()}
                            className="fixed top-3 right-2 flex cursor-pointer items-center justify-center rounded-lg p-2 text-fg-white/70 outline-focus-ring hover:bg-white/10 hover:text-fg-white focus-visible:outline-2 focus-visible:outline-offset-2"
                        >
                            <CloseIcon className="size-6" />
                        </AriaButton>

                        <AriaModal className="w-full cursor-auto will-change-transform">
                            <AriaDialog className="h-dvh outline-hidden focus:outline-hidden">{children}</AriaDialog>
                        </AriaModal>
                    </>
                )}
            </AriaModalOverlay>
        </AriaDialogTrigger>
    );
};
