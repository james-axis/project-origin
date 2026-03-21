import { ChevronLeft, ChevronRight } from "@untitledui/icons";
import { Carousel } from "@/components/application/carousel/carousel-base";
import { CarouselIndicator } from "@/components/application/carousel/carousel.demo";
import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { useNavigate } from "react-router";
import { useState } from "react";

const AxisIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="Axis">
        <defs>
            <linearGradient id="axis-login-lg" x1="16" y1="31.9" x2="16" y2="-0.1" gradientTransform="translate(0 31.9) scale(1 -1)" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#fff"/><stop offset="1" stopColor="#0a0d12"/>
            </linearGradient>
        </defs>
        <path fill="#ff4405" d="M0,12.8C0,8.32,0,6.08.87,4.37c.77-1.51,1.99-2.73,3.5-3.5C6.08,0,8.32,0,12.8,0h6.4C23.68,0,25.92,0,27.63.87c1.51.77,2.73,1.99,3.5,3.5.87,1.71.87,3.95.87,8.43v6.4c0,4.48,0,6.72-.87,8.43-.77,1.51-1.99,2.73-3.5,3.5-1.71.87-3.95.87-8.43.87h-6.4c-4.48,0-6.72,0-8.43-.87-1.51-.77-2.73-1.99-3.5-3.5C0,25.92,0,23.68,0,19.2v-6.4Z"/>
        <path fill="url(#axis-login-lg)" fillOpacity=".2" d="M0,12.8C0,8.32,0,6.08.87,4.37c.77-1.51,1.99-2.73,3.5-3.5C6.08,0,8.32,0,12.8,0h6.4C23.68,0,25.92,0,27.63.87c1.51.77,2.73,1.99,3.5,3.5.87,1.71.87,3.95.87,8.43v6.4c0,4.48,0,6.72-.87,8.43-.77,1.51-1.99,2.73-3.5,3.5-1.71.87-3.95.87-8.43.87h-6.4c-4.48,0-6.72,0-8.43-.87-1.51-.77-2.73-1.99-3.5-3.5C0,25.92,0,23.68,0,19.2v-6.4Z"/>
        <path fill="#fff" d="M13.43,15.89l-9.43,10.27h4.86L28,5.35h-4.99l-7.08,7.63-7.08-7.63h-4.86l9.43,10.54Z"/>
        <path fill="#fff" d="M23.01,26.16h4.99l-9.16-9.85c-1.44,2.37-.88,4.23-.42,4.86l4.58,4.99Z"/>
    </svg>
);

const AxisWordmark = () => (
    <div className="flex items-center gap-3">
        <AxisIcon className="size-8" />
        <span className="text-xl font-normal tracking-tight text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>AXIS</span>
    </div>
);

const slides = [
    { title: "Less Admin. More Impact.", body: "Axis brought our compliance time from hours down to minutes without cutting corners." },
    { title: "Everything in One Place.", body: "Manage clients, applications, compliance and claims — all in a single, unified platform." },
    { title: "Built for Advisers.", body: "Designed with the advice process in mind, so you can focus on your clients, not the paperwork." },
    { title: "Trusted by Leading Practices.", body: "Axis powers advice businesses across Australia, from boutique practices to national licensees." },
];

const TEST_EMAIL = "test@gmail.com";
const TEST_PASSWORD = "form123";

export const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState(TEST_EMAIL);
    const [password, setPassword] = useState(TEST_PASSWORD);

    const handleSignIn = (e: React.FormEvent) => {
        e.preventDefault();
        navigate("/workbench");
    };

    return (
        <section className="grid min-h-screen grid-cols-1 bg-primary lg:grid-cols-2">
            {/* Left panel — form */}
            <div className="flex flex-col bg-primary">
                <header className="hidden p-8 md:block">
                    <AxisWordmark />
                </header>

                <div className="flex flex-1 justify-center px-4 py-12 md:items-center md:px-8 md:py-0">
                    <div className="flex w-full flex-col gap-8 sm:max-w-90">
                        <div className="flex flex-col gap-6">
                            <AxisIcon className="size-10 lg:hidden" />
                            <div className="flex flex-col gap-2 md:gap-3">
                                <h1 className="text-display-xs font-normal text-primary md:text-display-md" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                                    Log in
                                </h1>
                                <p className="text-md text-tertiary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                                    Welcome back. Please enter your details.
                                </p>
                            </div>
                        </div>

                        <Form onSubmit={handleSignIn} className="flex flex-col gap-6">
                            <div className="flex flex-col gap-5">
                                <Input
                                    isRequired hideRequiredIndicator
                                    label="Email" type="email" name="email"
                                    placeholder="Enter your email" size="md"
                                    value={email} onChange={(v) => setEmail(v)}
                                />
                                <Input
                                    isRequired hideRequiredIndicator
                                    label="Password" type="password" name="password"
                                    size="md" placeholder="Enter your password"
                                    value={password} onChange={(v) => setPassword(v)}
                                />
                            </div>
                            <div className="flex items-center">
                                <Checkbox label="Remember for 30 days" name="remember" />
                                <Button color="link-color" size="md" href="#" className="ml-auto">
                                    Forgot password
                                </Button>
                            </div>
                            <div className="flex flex-col gap-4">
                                <Button type="submit" size="lg" className="!bg-[#D34108] hover:!bg-[#B83507] !border-[#D34108]">
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

            {/* Right panel — carousel */}
            <div className="hidden h-full bg-primary py-4 pr-4 lg:block">
                <Carousel.Root className="relative h-full w-full items-center justify-center overflow-hidden rounded-[20px] lg:flex" style={{ backgroundColor: '#D34108' }}>
                    <div className="flex w-full flex-col items-center gap-8">
                        <Carousel.Content overflowHidden={false}>
                            {slides.map((slide, i) => (
                                <Carousel.Item key={i} className="flex flex-col items-center gap-16 px-12">
                                    {/* Graphic area */}
                                    <div className="flex h-64 w-full items-center justify-center rounded-2xl bg-white/10">
                                        <AxisIcon className="size-24 opacity-80" />
                                    </div>
                                    {/* Text */}
                                    <div className="flex max-w-96 flex-col gap-3 text-center">
                                        <p className="text-display-xs font-semibold text-white" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
                                            {slide.title}
                                        </p>
                                        <p className="text-md font-medium text-white/70">
                                            {slide.body}
                                        </p>
                                    </div>
                                </Carousel.Item>
                            ))}
                        </Carousel.Content>

                        <div className="flex items-center justify-center gap-16">
                            <Carousel.PrevTrigger className="cursor-pointer rounded-full p-2 text-white/60 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                                <ChevronLeft className="size-5" />
                            </Carousel.PrevTrigger>
                            <CarouselIndicator size="lg" />
                            <Carousel.NextTrigger className="cursor-pointer rounded-full p-2 text-white/60 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                                <ChevronRight className="size-5" />
                            </Carousel.NextTrigger>
                        </div>
                    </div>
                </Carousel.Root>
            </div>
        </section>
    );
};
