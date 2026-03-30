import { useState } from "react";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { User01, Mail01, Phone01, Lock01, Shield01, Link01, Upload01, Trash01, Eye, EyeOff, LogOut01 } from "@untitledui/icons";

const USER = {
  firstName: "James",
  lastName: "Nicholls",
  email: "james@axiscrm.com.au",
  phone: "0433337000",
  avatarUrl: "",
};

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-secondary bg-primary shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-secondary">
        <h2 className="text-base font-semibold text-primary">{title}</h2>
        {description && <p className="text-sm text-tertiary mt-0.5">{description}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-secondary last:border-0">
      <label className="text-sm text-tertiary w-40 shrink-0">{label}:</label>
      <div className="flex-1 relative">
        <input type={isPassword && showPassword ? "text" : type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors" />
        {isPassword && (<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-quaternary hover:text-secondary">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>)}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const [firstName, setFirstName] = useState(USER.firstName);
  const [lastName, setLastName] = useState(USER.lastName);
  const [email, setEmail] = useState(USER.email);
  const [phone, setPhone] = useState(USER.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(USER.avatarUrl);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        <div className="border-b border-secondary bg-primary px-6 lg:px-8 py-5">
          <h1 className="text-xl font-semibold text-primary" style={{ fontFamily: "'Metrophobic', sans-serif" }}>Your Profile</h1>
          <p className="text-sm text-tertiary mt-0.5">Manage your account settings and preferences</p>
        </div>
        <div className="px-6 lg:px-8 py-6">
          <div className="max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <SectionCard title="Profile" description="Update your profile information here">
                <FormField label="First Name" value={firstName} onChange={setFirstName} />
                <FormField label="Last Name" value={lastName} onChange={setLastName} />
                <FormField label="Email" value={email} onChange={setEmail} type="email" />
                <FormField label="Phone" value={phone} onChange={setPhone} type="tel" />
                <div className="flex justify-end mt-4"><button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}>Update Profile</button></div>
              </SectionCard>
              <SectionCard title="Change your account's password" description="To change your password please type in the current password for your account and the new password">
                <FormField label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" />
                <FormField label="New password" value={newPassword} onChange={setNewPassword} type="password" />
                <FormField label="Repeat password" value={repeatPassword} onChange={setRepeatPassword} type="password" />
                <div className="flex justify-end mt-4"><button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}>Set new password</button></div>
              </SectionCard>
              <SectionCard title="Email accounts" description="Connect your accounts and import emails from 250+ providers">
                <div className="flex items-center justify-between py-3">
                  <p className="text-sm text-tertiary">No email accounts connected</p>
                  <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}><Link01 className="size-4" />New...</button>
                </div>
              </SectionCard>
            </div>
            <div className="space-y-6">
              <SectionCard title="Profile Picture" description="Edit your profile picture or upload a new one">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    {avatarUrl ? (<img src={avatarUrl} alt="Profile" className="size-32 rounded-full object-cover border-4 border-brand-solid" />) : (<div className="size-32 rounded-full flex items-center justify-center text-3xl font-semibold text-white border-4" style={{ background: "#D34108", borderColor: "#a33306" }}>{initials}</div>)}
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    {avatarUrl && (<button onClick={() => setAvatarUrl("")} className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}><Trash01 className="size-4" />Delete image</button>)}
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer"><span className="sr-only">Choose file</span><div className="flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-secondary hover:bg-secondary transition-colors"><span className="text-xs">Choose file</span><span className="text-xs text-quaternary truncate flex-1">No file chosen</span></div><input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = ev => setAvatarUrl(ev.target?.result as string); reader.readAsDataURL(file); } }} /></label>
                      <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}><Upload01 className="size-4" />Upload</button>
                    </div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="Two-Factor Authentication" description="Setup 2FA app, such as Microsoft Authenticator">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-tertiary">Your 2FA settings:</span>
                    <span className="text-sm font-semibold text-primary">{twoFactorEnabled ? "Authenticator App" : "Disabled"}</span>
                  </div>
                  {twoFactorEnabled && (<div className="bg-secondary_alt rounded-lg p-4"><p className="text-sm text-secondary mb-3">Scan the code below with your authenticator app to add this account.</p><div className="flex justify-center"><div className="size-32 bg-white rounded-lg border border-secondary flex items-center justify-center"><svg viewBox="0 0 100 100" className="size-24"><rect x="10" y="10" width="25" height="25" fill="#1C1C24"/><rect x="65" y="10" width="25" height="25" fill="#1C1C24"/><rect x="10" y="65" width="25" height="25" fill="#1C1C24"/><rect x="15" y="15" width="15" height="15" fill="white"/><rect x="70" y="15" width="15" height="15" fill="white"/><rect x="15" y="70" width="15" height="15" fill="white"/><rect x="20" y="20" width="5" height="5" fill="#1C1C24"/><rect x="75" y="20" width="5" height="5" fill="#1C1C24"/><rect x="20" y="75" width="5" height="5" fill="#1C1C24"/><rect x="40" y="40" width="20" height="20" fill="#1C1C24"/><rect x="45" y="45" width="10" height="10" fill="white"/></svg></div></div></div>)}
                  <button onClick={() => setTwoFactorEnabled(!twoFactorEnabled)} className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors"><Shield01 className="size-4" />{twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}</button>
                </div>
              </SectionCard>
              <SectionCard title="Sign Out" description="Sign out of your account">
                <button className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-error-300 bg-error-50 px-4 py-2 text-sm font-medium text-error-700 hover:bg-error-100 transition-colors">
                  <LogOut01 className="size-4" />
                  Sign out
                </button>
              </SectionCard>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
