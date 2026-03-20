import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { RatingStars } from "@/components/foundations/rating-stars";

// Axis wordmark SVG — matches brand guidelines (Core Orange #D34108)
const AxisLogo = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 120 34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Axis">
        <path d="M0 32L11 2h5.5l11 30H22l-2.4-6H8.4L6 32H0zm9.8-11h8.4L14 9.5 9.8 21z" fill="#D34108" />
        <path d="M30 32L39.5 17 30.5 2h7l5.8 10.2L49.5 2h7L47.5 17 57 32h-7.4L44 21.5 38.5 32H30z" fill="#D34108" />
        <path d="M60 2h6.5v30H60V2z" fill="#D34108" />
        <path d="M70 24.5l4.8-3.8c1.4 2.6 3.5 4 6.2 4 2.5 0 3.8-1.1 3.8-2.8 0-1.8-1.4-2.8-5.2-3.9C75 16.7 72 14.5 72 10c0-4.2 3.4-7 8.5-7 4 0 7 1.8 8.8 5l-4.5 3.4c-1.2-2-2.7-3.1-4.5-3.1-2 0-3.1 1-3.1 2.5 0 1.6 1.2 2.5 5 3.7 4.8 1.5 8.2 3.8 8.2 8.5 0 4.5-3.7 7.7-9.5 7.7-4.4 0-8.2-2-10.9-5.2z" fill="#D34108" />
    </svg>
);

export const Login = () => {
    return (
        <section className="grid min-h-screen grid-cols-1 bg-primary lg:grid-cols-[640px_1fr]">
            {/* ── Left panel — form ── */}
            <div className="flex w-full flex-col bg-primary lg:max-w-(--breakpoint-sm)">
                <div className="flex flex-1 justify-center px-4 py-12 md:items-center md:px-8 md:py-32">
                    <div className="flex w-full flex-col gap-8 sm:max-w-90">
                        <div className="flex flex-col gap-6 md:gap-20">
                            <AxisLogo className="h-8 w-auto max-md:hidden" />
                            <AxisLogo className="size-10 md:hidden" />

                            <div className="flex flex-col gap-2 md:gap-3">
                                <h1 className="text-display-xs font-semibold text-primary md:text-display-md">
                                    Log in
                                </h1>
                                <p className="text-md text-tertiary">
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
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex items-center">
                                <Checkbox label="Remember for 30 days" name="remember" />
                                <Button color="link-color" size="md" href="#" className="ml-auto">
                                    Forgot password
                                </Button>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Button type="submit" size="lg" className="bg-[#D34108] hover:bg-[#B83507]">
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
                    <p className="text-sm text-tertiary">© Axis Technology 2025</p>
                </footer>
            </div>

            {/* ── Right panel — brand ── */}
            <div className="relative hidden w-full gap-20 overflow-hidden bg-tertiary pt-24 pr-16 pl-20 lg:flex lg:flex-col">
                <figure className="flex max-w-3xl flex-col gap-6">
                    <blockquote>
                        <p className="text-display-sm font-medium text-primary">
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
                        <RatingStars className="hidden gap-0.5 md:flex" starClassName="text-fg-primary" />
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
