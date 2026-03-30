import { useState } from "react";
import { useSearchParams } from "react-router";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";
import { navItems, footerNavItems } from "@/components/application/app-navigation/config";
import { Shield01, Link01, Upload01, Trash01, Eye, EyeOff, Mail01, Calendar, Key01, RefreshCw01, AlertCircle } from "@untitledui/icons";

const USER = {
  firstName: "James",
  lastName: "Nicholls",
  email: "james@axiscrm.com.au",
  phone: "0433337000",
  avatarUrl: "",
};

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "password", label: "Password" },
  { id: "integrations", label: "Integrations" },
  { id: "2fa", label: "Two-Factor Auth" },
];

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

function FormField({ label, value, onChange, type = "text", placeholder, disabled }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; disabled?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-3 border-b border-secondary last:border-0">
      <label className="text-sm text-tertiary w-40 shrink-0">{label}:</label>
      <div className="flex-1 relative">
        <input 
          type={isPassword && showPassword ? "text" : type} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder} 
          disabled={disabled}
          className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-colors disabled:bg-secondary_alt disabled:text-tertiary" 
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-quaternary hover:text-secondary">
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

// Profile Tab Content
function ProfileTab() {
  const [firstName, setFirstName] = useState(USER.firstName);
  const [lastName, setLastName] = useState(USER.lastName);
  const [email, setEmail] = useState(USER.email);
  const [phone, setPhone] = useState(USER.phone);
  const [avatarUrl, setAvatarUrl] = useState(USER.avatarUrl);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile Picture Card */}
      <SectionCard title="Profile Picture" description="Edit your profile picture or upload a new one">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile" className="size-24 rounded-full object-cover border-4 border-brand-solid" />
            ) : (
              <div className="size-24 rounded-full flex items-center justify-center text-2xl font-semibold text-white border-4" style={{ background: "#D34108", borderColor: "#a33306" }}>
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-tertiary">Upload a new profile picture. JPG, PNG or GIF, max 2MB.</p>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <span className="sr-only">Choose file</span>
                <div className="inline-flex items-center gap-2 rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-secondary hover:bg-secondary transition-colors">
                  <Upload01 className="size-4" />
                  Upload new
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => { 
                    const file = e.target.files?.[0]; 
                    if (file) { 
                      const reader = new FileReader(); 
                      reader.onload = ev => setAvatarUrl(ev.target?.result as string); 
                      reader.readAsDataURL(file); 
                    } 
                  }} 
                />
              </label>
              {avatarUrl && (
                <button 
                  onClick={() => setAvatarUrl("")} 
                  className="inline-flex items-center gap-2 rounded-lg border border-error-300 px-3 py-2 text-sm text-error-700 hover:bg-error-50 transition-colors"
                >
                  <Trash01 className="size-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Personal Information Card */}
      <SectionCard title="Personal Information" description="Update your personal details">
        <FormField label="First Name" value={firstName} onChange={setFirstName} />
        <FormField label="Last Name" value={lastName} onChange={setLastName} />
        <FormField label="Email" value={email} onChange={setEmail} type="email" />
        <FormField label="Phone" value={phone} onChange={setPhone} type="tel" />
        <div className="flex justify-end mt-4">
          <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}>
            Save Changes
          </button>
        </div>
      </SectionCard>
    </div>
  );
}

// Password Tab Content
function PasswordTab() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");

  return (
    <div className="max-w-3xl space-y-6">
      <SectionCard title="Change Password" description="To change your password, enter your current password and then your new password">
        <FormField label="Current password" value={currentPassword} onChange={setCurrentPassword} type="password" />
        <FormField label="New password" value={newPassword} onChange={setNewPassword} type="password" />
        <FormField label="Confirm password" value={repeatPassword} onChange={setRepeatPassword} type="password" />
        <div className="mt-4 p-3 rounded-lg bg-secondary_alt">
          <p className="text-xs text-tertiary font-medium mb-2">Password requirements:</p>
          <ul className="text-xs text-tertiary space-y-1">
            <li>• At least 8 characters long</li>
            <li>• Contains at least one uppercase letter</li>
            <li>• Contains at least one number</li>
            <li>• Contains at least one special character</li>
          </ul>
        </div>
        <div className="flex justify-end mt-4">
          <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}>
            Update Password
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Password History" description="Recent password changes for your account">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-secondary">
            <div className="flex items-center gap-3">
              <Key01 className="size-4 text-quaternary" />
              <div>
                <p className="text-sm text-primary">Password changed</p>
                <p className="text-xs text-tertiary">From Sydney, NSW • Chrome on macOS</p>
              </div>
            </div>
            <span className="text-xs text-tertiary">15 Mar 2026</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-3">
              <Key01 className="size-4 text-quaternary" />
              <div>
                <p className="text-sm text-primary">Password changed</p>
                <p className="text-xs text-tertiary">From Sydney, NSW • Chrome on macOS</p>
              </div>
            </div>
            <span className="text-xs text-tertiary">02 Jan 2026</span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// Integrations Tab Content
function IntegrationsTab() {
  const [connectedEmails] = useState<string[]>([]);

  return (
    <div className="max-w-3xl space-y-6">
      <SectionCard title="Email Accounts" description="Connect your email accounts to sync emails and send from the CRM">
        {connectedEmails.length === 0 ? (
          <div className="text-center py-8">
            <Mail01 className="size-12 text-quaternary mx-auto mb-3" />
            <p className="text-sm text-tertiary mb-4">No email accounts connected</p>
            <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}>
              <Link01 className="size-4" />
              Connect Email Account
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {connectedEmails.map((email, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-secondary last:border-0">
                <div className="flex items-center gap-3">
                  <Mail01 className="size-4 text-quaternary" />
                  <span className="text-sm text-primary">{email}</span>
                </div>
                <button className="text-xs text-error-700 hover:underline">Disconnect</button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Calendar Sync" description="Connect your calendar to sync appointments and meetings">
        <div className="text-center py-8">
          <Calendar className="size-12 text-quaternary mx-auto mb-3" />
          <p className="text-sm text-tertiary mb-4">No calendar connected</p>
          <button className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90" style={{ background: "#D34108" }}>
            <Link01 className="size-4" />
            Connect Google Calendar
          </button>
        </div>
      </SectionCard>

      <SectionCard title="API Access" description="Generate API keys for external integrations">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-secondary_alt">
            <div>
              <p className="text-sm font-medium text-primary">API Key</p>
              <p className="text-xs text-tertiary font-mono mt-1">axis_key_••••••••••••••••</p>
            </div>
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary transition-colors">
                <Eye className="size-3.5" />
                Reveal
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-secondary px-3 py-1.5 text-xs font-medium text-secondary hover:bg-primary transition-colors">
                <RefreshCw01 className="size-3.5" />
                Regenerate
              </button>
            </div>
          </div>
          <p className="text-xs text-tertiary flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            Keep your API key secret. Never share it or expose it in client-side code.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

// 2FA Tab Content
function TwoFactorTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [backupCodesVisible, setBackupCodesVisible] = useState(false);

  const backupCodes = ["AXXX-XXXX-1234", "BXXX-XXXX-5678", "CXXX-XXXX-9012", "DXXX-XXXX-3456", "EXXX-XXXX-7890", "FXXX-XXXX-2345"];

  return (
    <div className="max-w-3xl space-y-6">
      <SectionCard title="Two-Factor Authentication" description="Add an extra layer of security to your account">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 px-4 rounded-lg" style={{ background: twoFactorEnabled ? "#f0fdf4" : "#fef3f2" }}>
            <div className="flex items-center gap-3">
              <Shield01 className="size-5" style={{ color: twoFactorEnabled ? "#16a34a" : "#dc2626" }} />
              <div>
                <p className="text-sm font-medium text-primary">2FA is {twoFactorEnabled ? "enabled" : "disabled"}</p>
                <p className="text-xs text-tertiary">{twoFactorEnabled ? "Your account is protected with authenticator app" : "Enable 2FA to secure your account"}</p>
              </div>
            </div>
            <button 
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)} 
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${twoFactorEnabled ? "border border-secondary text-secondary hover:bg-secondary" : "text-white hover:opacity-90"}`}
              style={!twoFactorEnabled ? { background: "#D34108" } : undefined}
            >
              {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
            </button>
          </div>

          {twoFactorEnabled && (
            <>
              <div className="border-t border-secondary pt-4">
                <h3 className="text-sm font-medium text-primary mb-3">Authenticator App</h3>
                <p className="text-sm text-tertiary mb-4">Scan this QR code with your authenticator app (Google Authenticator, Microsoft Authenticator, etc.)</p>
                <div className="flex justify-center">
                  <div className="size-40 bg-white rounded-lg border border-secondary flex items-center justify-center">
                    <svg viewBox="0 0 100 100" className="size-32">
                      <rect x="10" y="10" width="25" height="25" fill="#1C1C24"/>
                      <rect x="65" y="10" width="25" height="25" fill="#1C1C24"/>
                      <rect x="10" y="65" width="25" height="25" fill="#1C1C24"/>
                      <rect x="15" y="15" width="15" height="15" fill="white"/>
                      <rect x="70" y="15" width="15" height="15" fill="white"/>
                      <rect x="15" y="70" width="15" height="15" fill="white"/>
                      <rect x="20" y="20" width="5" height="5" fill="#1C1C24"/>
                      <rect x="75" y="20" width="5" height="5" fill="#1C1C24"/>
                      <rect x="20" y="75" width="5" height="5" fill="#1C1C24"/>
                      <rect x="40" y="40" width="20" height="20" fill="#1C1C24"/>
                      <rect x="45" y="45" width="10" height="10" fill="white"/>
                    </svg>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </SectionCard>

      {twoFactorEnabled && (
        <SectionCard title="Backup Codes" description="Use these codes if you lose access to your authenticator app">
          <div className="space-y-4">
            <p className="text-sm text-tertiary">Each code can only be used once. Store them somewhere safe.</p>
            <button 
              onClick={() => setBackupCodesVisible(!backupCodesVisible)}
              className="inline-flex items-center gap-2 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors"
            >
              {backupCodesVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {backupCodesVisible ? "Hide Codes" : "View Backup Codes"}
            </button>
            {backupCodesVisible && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 rounded-lg bg-secondary_alt">
                {backupCodes.map((code, i) => (
                  <div key={i} className="font-mono text-sm text-primary bg-primary rounded px-3 py-2 text-center border border-secondary">
                    {code}
                  </div>
                ))}
              </div>
            )}
            <button className="inline-flex items-center gap-2 rounded-lg border border-secondary px-4 py-2 text-sm font-medium text-secondary hover:bg-secondary transition-colors">
              <RefreshCw01 className="size-4" />
              Generate New Codes
            </button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "profile";

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile": return <ProfileTab />;
      case "password": return <PasswordTab />;
      case "integrations": return <IntegrationsTab />;
      case "2fa": return <TwoFactorTab />;
      default: return <ProfileTab />;
    }
  };

  return (
    <div className="lg:flex min-h-screen" style={{ background: "linear-gradient(160deg, #f8f9fb 0%, #f4f5f8 100%)" }}>
      <SidebarNavigationSlim items={navItems} footerItems={footerNavItems} />
      <main className="min-h-screen overflow-x-hidden lg:flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-secondary bg-primary px-6 lg:px-8 pt-6 pb-0">
          <h1 className="text-xl font-semibold text-primary mb-4" style={{ fontFamily: "'Metrophobic', sans-serif" }}>
            {TABS.find(t => t.id === activeTab)?.label || "Profile"}
          </h1>
          {/* Tabs */}
          <div className="flex gap-6 -mb-px overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center gap-2 px-0 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-brand text-brand-secondary"
                    : "border-transparent text-tertiary hover:text-secondary hover:border-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-6 lg:px-8 py-6">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
}
