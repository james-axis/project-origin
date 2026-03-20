import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { RatingStars } from "@/components/foundations/rating-stars";

// Axis X symbol logo — orange rounded square with white X (matches brand guidelines)
const AxisLogoSymbol = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="Axis">
        <defs>
            <linearGradient id="axis-icon-lg" x1="16" y1="31.9" x2="16" y2="-0.1" gradientTransform="translate(0 31.9) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fff"/>
                <stop offset="1" stopColor="#0a0d12"/>
            </linearGradient>
        </defs>
        <path fill="#ff4405" d="M0,12.8C0,8.32,0,6.08.87,4.37c.77-1.51,1.99-2.73,3.5-3.5C6.08,0,8.32,0,12.8,0h6.4C23.68,0,25.92,0,27.63.87c1.51.77,2.73,1.99,3.5,3.5.87,1.71.87,3.95.87,8.43v6.4c0,4.48,0,6.72-.87,8.43-.77,1.51-1.99,2.73-3.5,3.5-1.71.87-3.95.87-8.43.87h-6.4c-4.48,0-6.72,0-8.43-.87-1.51-.77-2.73-1.99-3.5-3.5C0,25.92,0,23.68,0,19.2v-6.4Z"/>
        <path fill="url(#axis-icon-lg)" fillOpacity=".2" d="M0,12.8C0,8.32,0,6.08.87,4.37c.77-1.51,1.99-2.73,3.5-3.5C6.08,0,8.32,0,12.8,0h6.4C23.68,0,25.92,0,27.63.87c1.51.77,2.73,1.99,3.5,3.5.87,1.71.87,3.95.87,8.43v6.4c0,4.48,0,6.72-.87,8.43-.77,1.51-1.99,2.73-3.5,3.5-1.71.87-3.95.87-8.43.87h-6.4c-4.48,0-6.72,0-8.43-.87-1.51-.77-2.73-1.99-3.5-3.5C0,25.92,0,23.68,0,19.2v-6.4Z"/>
        <path fill="#fff" d="M13.43,15.89l-9.43,10.27h4.86L28,5.35h-4.99l-7.08,7.63-7.08-7.63h-4.86l9.43,10.54Z"/>
        <path fill="#fff" d="M23.01,26.16h4.99l-9.16-9.85c-1.44,2.37-.88,4.23-.42,4.86l4.58,4.99Z"/>
    </svg>
);

// Axis wordmark Ã¢ÂÂ for use alongside the symbol on desktop
const AxisWordmark = ({ className }: { className?: string }) => (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
        <AxisLogoSymbol className="size-10" />
        <span
            className="text-2xl font-normal tracking-tight text-primary"
            style={{ fontFamily: "'Metrophobic', sans-serif" }}
        >
            AXIS
        </span>
    </div>
);

export const Login = () => {
    return (
        <section className="grid min-h-screen grid-cols-1 bg-primary lg:grid-cols-[640px_1fr]">
            {/* Ã¢ÂÂÃ¢ÂÂ Left panel Ã¢ÂÂ form Ã¢ÂÂÃ¢ÂÂ */}
            <div className="flex w-full flex-col bg-primary lg:max-w-(--breakpoint-sm)">
                <div className="flex flex-1 justify-center px-4 py-12 md:items-center md:px-8 md:py-32">
                    <div className="flex w-full flex-col gap-8 sm:max-w-90">
                        <div className="flex flex-col gap-6 md:gap-16">
                            {/* Desktop: symbol + wordmark */}
                            <AxisWordmark className="max-md:hidden" />
                            {/* Mobile: symbol only */}
                            <AxisLogoSymbol className="size-12 md:hidden" />

                            <div className="flex flex-col gap-2 md:gap-3">
                                <h1
                                    className="text-display-xs font-normal text-primary md:text-display-md"
                                    style={{ fontFamily: "'Metrophobic', sans-serif" }}
                                >
                                    Log in
                                </h1>
                                <p className="text-md text-tertiary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                    Welcome back. Please enter your details.
                </p>
                            </div>
                        </div>

                        <Form
                            onSubmit={(e) => {
                                e.preventDefault();
                                const data = Object.fromEntries(new FormData(e.currentTarget));
                                console.log("Form data:", data);
                            }}
                            className="flex flex-col gap-6"
                        >
                            <div className="flex flex-col gap-5">
                                <Input
                                    isRequired
                                    hideRequiredIndicator
                                    label="Email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email"
                                    size="md"
                                />
                                <Input
                                    isRequired
                                    hideRequiredIndicator
                                    label="Password"
                                    type="password"
                                    name="password"
                                    size="md"
                                    placeholder="Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢Ã¢ÂÂ¢"
                                />
                            </div>

                            <div className="flex items-center">
                                <Checkbox label="Remember for 30 days" name="remember" />
                                <Button color="link-color" size="md" href="#" className="ml-auto">
                                    Forgot password
                                </Button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="!bg-[#D34108] hover:!bg-[#B83507] !border-[#D34108]"
                                >
                                    Sign in
                                </Button>
                                <SocialButton social="google" theme="color">
                                    Sign in with Google
                                </SocialButton>
                            </div>
                        </Form>
                    </div>
                </div>

                <footer className="hidden p-8 pt-11 lg:block">
                    <p className="text-sm text-tertiary">ÃÂ© Axis Technology 2025</p>
                </footer>
            </div>

            {/* Ã¢ÂÂÃ¢ÂÂ Right panel Ã¢ÂÂ brand Ã¢ÂÂÃ¢ÂÂ */}
            <div className="relative hidden w-full gap-20 overflow-hidden bg-tertiary pt-24 pr-16 pl-20 lg:flex lg:flex-col">
                <figure className="flex max-w-3xl flex-col gap-6">
                    <blockquote>
                        <p
                            className="text-display-sm font-normal text-primary"
                            style={{ fontFamily: "'Metrophobic', sans-serif" }}
                        >
                            Less admin. More impact. Axis brought our compliance time from hours down to minutes without cutting corners.
                        </p>
                    </blockquote>
                    <figcaption className="flex items-start gap-3">
                        <div className="flex-1">
                            <p className="text-lg font-semibold text-primary">— Rebel Thomas</p>
                            <cite className="text-md font-medium text-tertiary not-italic">
                                Senior Financial Adviser, SLS
                            </cite>
                        </div>
                        <RatingStars className="hidden gap-0.5 md:flex" starClassName="text-[#D34108]" />
                    </figcaption>
                </figure>

                <div className="relative">
                    <div className="absolute top-0 left-0 h-170.5 rounded-[9.03px] bg-primary p-[0.9px] shadow-lg ring-[0.56px] ring-utility-gray-300 ring-inset md:rounded-[26.95px] md:p-[3.5px] md:ring-[1.68px]">
                        <div className="h-full rounded-[7.9px] bg-primary p-0.5 shadow-modern-mockup-inner-md md:rounded-[23.58px] md:p-1 md:shadow-modern-mockup-inner-lg">
                            <div className="relative h-full overflow-hidden rounded-[6.77px] bg-utility-gray-50 ring-[0.56px] ring-utility-gray-200 md:rounded-[20.21px] md:ring-[1.68px]">
                                <img
                                    src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-light-01.webp"
                                    className="h-full max-w-none object-cover object-left-top dark:hidden"
                                    alt="Axis CRM dashboard"
                                />
                                <img
                                    src="https://www.untitledui.com/marketing/screen-mockups/dashboard-desktop-mockup-dark-01.webp"
                                    className="h-full max-w-none object-cover object-left-top not-dark:hidden"
                                    alt="Axis CRM dashboard"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
