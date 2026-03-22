// ─────────────────────────────────────────────────────────────────────────────
// Task-specific action panels
// Each panel renders inside the TaskActionModal for a given templateTaskId.
// The panel collects task-specific data, saves it to the sim store (client
// profile), and calls onReady(data) when the user is done — enabling Complete.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Check, Calendar, Mail01, Upload01, FileCheck01, CurrencyDollar, Phone, User01, Plus, X } from "@untitledui/icons";
import type { SimLead } from "@/store/sim-store";

export interface TaskPanelData {
  [key: string]: string | string[] | boolean | undefined;
}

interface TaskPanelProps {
  lead: SimLead | undefined;
  savedData?: TaskPanelData;
  onChange: (data: TaskPanelData) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-semibold text-quaternary uppercase tracking-wider">{label}</label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={"w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand focus:ring-1 focus:ring-brand " + (props.className ?? "")} />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...props} className={"w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand " + (props.className ?? "")} />
);

const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...props} className={"w-full rounded-lg border border-primary bg-primary px-3 py-2 text-sm text-primary outline-none focus:border-brand resize-none " + (props.className ?? "")} />
);

// ─── 1. Introduction Call — Appointment booking ───────────────────────────────
export function IntroductionCallPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <Calendar className="size-3.5" />Appointment booking
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <Input type="date" value={(d.date as string) ?? ""} onChange={e => onChange({ ...d, date: e.target.value })} />
        </Field>
        <Field label="Time">
          <Input type="time" value={(d.time as string) ?? ""} onChange={e => onChange({ ...d, time: e.target.value })} />
        </Field>
      </div>
      <Field label="Meeting type">
        <Select value={(d.meetingType as string) ?? ""} onChange={e => onChange({ ...d, meetingType: e.target.value })}>
          <option value="">Select...</option>
          <option value="phone">Phone call</option>
          <option value="video">Video call</option>
          <option value="face_to_face">Face to face</option>
        </Select>
      </Field>
      <Field label="Location / Link">
        <Input placeholder="e.g. Zoom link or office address" value={(d.location as string) ?? ""} onChange={e => onChange({ ...d, location: e.target.value })} />
      </Field>
      {d.date && d.time && (
        <div className="flex items-center gap-2 rounded-lg bg-success-secondary border border-success-solid px-3 py-2">
          <Check className="size-3.5 text-success-primary shrink-0" />
          <p className="text-xs text-success-primary font-medium">
            Appointment booked — {d.date as string} at {d.time as string} ({(d.meetingType as string) || "TBC"})
          </p>
        </div>
      )}
    </div>
  );
}

// ─── 2. Initial Life Discussion — Meeting notes ───────────────────────────────
export function InitialLifeDiscussionPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  const TOPICS = ["Current cover", "Income & expenses", "Dependants", "Health history", "Lifestyle & occupation", "Estate planning goals"];
  const covered = (d.topics as string[]) ?? [];
  function toggleTopic(t: string) {
    const next = covered.includes(t) ? covered.filter(x => x !== t) : [...covered, t];
    onChange({ ...d, topics: next });
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <User01 className="size-3.5" />Discussion notes
      </div>
      <Field label="Topics covered">
        <div className="grid grid-cols-2 gap-2">
          {TOPICS.map(t => (
            <button key={t} onClick={() => toggleTopic(t)}
              className={"flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-left transition-colors " + (covered.includes(t) ? "border-brand bg-brand-secondary text-brand-secondary font-medium" : "border-secondary text-secondary hover:border-primary")}>
              {covered.includes(t) && <Check className="size-3 shrink-0" />}{t}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Key outcomes / next steps">
        <Textarea rows={3} placeholder="What was agreed? Any follow-up required?" value={(d.notes as string) ?? ""} onChange={e => onChange({ ...d, notes: e.target.value })} />
      </Field>
    </div>
  );
}

// ─── 3. Life Insurance Discussion — Policy needs ──────────────────────────────
export function LifeInsuranceDiscussionPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <FileCheck01 className="size-3.5" />Policy needs assessment
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Life cover required">
          <Input placeholder="$500,000" value={(d.lifeCover as string) ?? ""} onChange={e => onChange({ ...d, lifeCover: e.target.value })} />
        </Field>
        <Field label="TPD cover">
          <Input placeholder="$500,000" value={(d.tpdCover as string) ?? ""} onChange={e => onChange({ ...d, tpdCover: e.target.value })} />
        </Field>
        <Field label="Income protection">
          <Input placeholder="$5,000/mo" value={(d.ipCover as string) ?? ""} onChange={e => onChange({ ...d, ipCover: e.target.value })} />
        </Field>
        <Field label="Trauma cover">
          <Input placeholder="$250,000" value={(d.traumaCover as string) ?? ""} onChange={e => onChange({ ...d, traumaCover: e.target.value })} />
        </Field>
      </div>
      <Field label="Preferred insurer">
        <Select value={(d.insurer as string) ?? ""} onChange={e => onChange({ ...d, insurer: e.target.value })}>
          <option value="">Select insurer...</option>
          {["TAL", "Zurich", "AIA", "MLC", "BT", "CommInsure", "OnePath", "Clearview"].map(i => <option key={i} value={i}>{i}</option>)}
        </Select>
      </Field>
      <Field label="Notes">
        <Textarea rows={2} placeholder="Client preferences, health disclosures, exclusions discussed..." value={(d.notes as string) ?? ""} onChange={e => onChange({ ...d, notes: e.target.value })} />
      </Field>
    </div>
  );
}

// ─── 4. Quote Review — Quote summary ─────────────────────────────────────────
export function QuoteReviewPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <CurrencyDollar className="size-3.5" />Quote details
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Insurer">
          <Select value={(d.insurer as string) ?? ""} onChange={e => onChange({ ...d, insurer: e.target.value })}>
            <option value="">Select insurer...</option>
            {["TAL", "Zurich", "AIA", "MLC", "BT", "CommInsure", "OnePath", "Clearview"].map(i => <option key={i} value={i}>{i}</option>)}
          </Select>
        </Field>
        <Field label="Monthly premium">
          <Input placeholder="$0.00" value={(d.premium as string) ?? ""} onChange={e => onChange({ ...d, premium: e.target.value })} />
        </Field>
        <Field label="Total cover">
          <Input placeholder="$1,000,000" value={(d.totalCover as string) ?? ""} onChange={e => onChange({ ...d, totalCover: e.target.value })} />
        </Field>
        <Field label="Policy type">
          <Select value={(d.policyType as string) ?? ""} onChange={e => onChange({ ...d, policyType: e.target.value })}>
            <option value="">Select...</option>
            <option value="stepped">Stepped</option>
            <option value="level">Level</option>
            <option value="hybrid">Hybrid</option>
          </Select>
        </Field>
      </div>
      <Field label="Client response">
        <Select value={(d.clientResponse as string) ?? ""} onChange={e => onChange({ ...d, clientResponse: e.target.value })}>
          <option value="">Select...</option>
          <option value="accepted">Accepted — proceeding</option>
          <option value="counter">Counter — wants changes</option>
          <option value="deferred">Deferred — thinking it over</option>
          <option value="declined">Declined</option>
        </Select>
      </Field>
    </div>
  );
}

// ─── 5. Life Insurance Follow-up — Call log ───────────────────────────────────
export function FollowUpPanel({ label, savedData, onChange }: { label?: string } & TaskPanelProps) {
  const d = savedData ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <Phone className="size-3.5" />{label ?? "Follow-up log"}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Contact method">
          <Select value={(d.method as string) ?? ""} onChange={e => onChange({ ...d, method: e.target.value })}>
            <option value="">Select...</option>
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </Select>
        </Field>
        <Field label="Outcome">
          <Select value={(d.outcome as string) ?? ""} onChange={e => onChange({ ...d, outcome: e.target.value })}>
            <option value="">Select...</option>
            <option value="reached">Reached — spoke with client</option>
            <option value="voicemail">Left voicemail</option>
            <option value="no_answer">No answer</option>
            <option value="callback">Callback requested</option>
          </Select>
        </Field>
      </div>
      <Field label="Notes">
        <Textarea rows={3} placeholder="What was discussed or agreed?" value={(d.notes as string) ?? ""} onChange={e => onChange({ ...d, notes: e.target.value })} />
      </Field>
    </div>
  );
}

// ─── 6. Book Insurance Review — Appointment ───────────────────────────────────
export function BookReviewPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  return <IntroductionCallPanel lead={lead} savedData={savedData} onChange={onChange} />;
}

// ─── 7. Add Policy / Application Number ───────────────────────────────────────
export function AddPolicyNumberPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <FileCheck01 className="size-3.5" />Policy / application reference
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Application number">
          <Input placeholder="APP-XXXXXXXX" value={(d.applicationNumber as string) ?? ""} onChange={e => onChange({ ...d, applicationNumber: e.target.value })} />
        </Field>
        <Field label="Policy number">
          <Input placeholder="POL-XXXXXXXX" value={(d.policyNumber as string) ?? ""} onChange={e => onChange({ ...d, policyNumber: e.target.value })} />
        </Field>
      </div>
      <Field label="Insurer">
        <Select value={(d.insurer as string) ?? ""} onChange={e => onChange({ ...d, insurer: e.target.value })}>
          <option value="">Select insurer...</option>
          {["TAL", "Zurich", "AIA", "MLC", "BT", "CommInsure", "OnePath", "Clearview"].map(i => <option key={i} value={i}>{i}</option>)}
        </Select>
      </Field>
      <Field label="Submission date">
        <Input type="date" value={(d.submissionDate as string) ?? ""} onChange={e => onChange({ ...d, submissionDate: e.target.value })} />
      </Field>
      {d.applicationNumber && (
        <div className="flex items-center gap-2 rounded-lg bg-success-secondary border border-success-solid px-3 py-2">
          <Check className="size-3.5 text-success-primary shrink-0" />
          <p className="text-xs text-success-primary font-medium">Application {d.applicationNumber as string} saved to client profile</p>
        </div>
      )}
    </div>
  );
}

// ─── 8. Send application submitted email ──────────────────────────────────────
export function SendEmailPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  const defaultBody = lead
    ? `Hi ${lead.firstName},\n\nGreat news — your ${lead.policyType} application has been submitted to the insurer.\n\nWe'll be in touch once we receive confirmation. In the meantime, please don't hesitate to reach out if you have any questions.\n\nKind regards`
    : "";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <Mail01 className="size-3.5" />Email to client
      </div>
      <Field label="To">
        <Input value={lead?.email ?? ""} readOnly className="opacity-60" />
      </Field>
      <Field label="Subject">
        <Input value={(d.subject as string) ?? "Your application has been submitted"} onChange={e => onChange({ ...d, subject: e.target.value })} />
      </Field>
      <Field label="Message">
        <Textarea rows={5} value={(d.body as string) ?? defaultBody} onChange={e => onChange({ ...d, body: e.target.value })} />
      </Field>
      {!(d.sent as boolean) ? (
        <button onClick={() => onChange({ ...d, sent: true })}
          className="w-full rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
          <span className="flex items-center justify-center gap-1.5"><Mail01 className="size-3.5" />Send email</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-success-secondary border border-success-solid px-3 py-2">
          <Check className="size-3.5 text-success-primary shrink-0" />
          <p className="text-xs text-success-primary font-medium">Email sent to {lead?.email}</p>
        </div>
      )}
    </div>
  );
}

// ─── 9. Upload face to face documents ─────────────────────────────────────────
export function UploadDocumentsPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  const docs = (d.docs as string[]) ?? [];
  const REQUIRED = ["Signed SOA", "Fact Find", "Photo ID", "Privacy consent", "Application form"];

  function toggleDoc(doc: string) {
    const next = docs.includes(doc) ? docs.filter(x => x !== doc) : [...docs, doc];
    onChange({ ...d, docs: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <Upload01 className="size-3.5" />Document checklist
      </div>
      <Field label="Required documents">
        <div className="space-y-2">
          {REQUIRED.map(doc => (
            <button key={doc} onClick={() => toggleDoc(doc)}
              className={"flex items-center gap-3 w-full rounded-lg border px-3 py-2.5 text-left transition-colors " + (docs.includes(doc) ? "border-success-solid bg-success-secondary" : "border-secondary hover:border-primary")}>
              <div className={"flex size-5 shrink-0 items-center justify-center rounded " + (docs.includes(doc) ? "bg-success-solid" : "border border-secondary")}>
                {docs.includes(doc) && <Check className="size-3 text-white" />}
              </div>
              <span className={"text-sm " + (docs.includes(doc) ? "text-success-primary font-medium line-through opacity-70" : "text-primary")}>{doc}</span>
            </button>
          ))}
        </div>
      </Field>
      <p className="text-xs text-tertiary">{docs.length} of {REQUIRED.length} documents confirmed</p>
    </div>
  );
}

// ─── 10. Compliance Audit ─────────────────────────────────────────────────────
export function ComplianceAuditPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  const checks = (d.checks as string[]) ?? [];
  const CHECKLIST = [
    "SOA matches client needs",
    "Replacement policy disclosed",
    "Cooling-off period explained",
    "Premium disclosure correct",
    "Commission disclosed",
    "Best interests duty met",
    "Signed authority on file",
    "Privacy policy acknowledged",
  ];

  function toggleCheck(c: string) {
    const next = checks.includes(c) ? checks.filter(x => x !== c) : [...checks, c];
    onChange({ ...d, checks: next });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <FileCheck01 className="size-3.5" />Compliance checklist
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {CHECKLIST.map(c => (
          <button key={c} onClick={() => toggleCheck(c)}
            className={"flex items-center gap-3 w-full rounded-lg border px-3 py-2.5 text-left transition-colors " + (checks.includes(c) ? "border-success-solid bg-success-secondary" : "border-secondary hover:border-primary")}>
            <div className={"flex size-5 shrink-0 items-center justify-center rounded " + (checks.includes(c) ? "bg-success-solid" : "border border-secondary")}>
              {checks.includes(c) && <Check className="size-3 text-white" />}
            </div>
            <span className={"text-sm " + (checks.includes(c) ? "text-success-primary font-medium" : "text-primary")}>{c}</span>
          </button>
        ))}
      </div>
      <Field label="Audit outcome">
        <Select value={(d.outcome as string) ?? ""} onChange={e => onChange({ ...d, outcome: e.target.value })}>
          <option value="">Select outcome...</option>
          <option value="Pass">Pass</option>
          <option value="On Hold">On Hold — needs rectification</option>
          <option value="Remediation Required">Remediation Required</option>
        </Select>
      </Field>
      <p className="text-xs text-tertiary">{checks.length} of {CHECKLIST.length} checks complete</p>
    </div>
  );
}

// ─── 11. Compliance Billing ───────────────────────────────────────────────────
export function ComplianceBillingPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <CurrencyDollar className="size-3.5" />Billing record
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Compliance fee">
          <Input placeholder="$0.00" value={(d.fee as string) ?? ""} onChange={e => onChange({ ...d, fee: e.target.value })} />
        </Field>
        <Field label="Billing date">
          <Input type="date" value={(d.date as string) ?? ""} onChange={e => onChange({ ...d, date: e.target.value })} />
        </Field>
      </div>
      <Field label="Billing reference">
        <Input placeholder="INV-XXXXXX" value={(d.reference as string) ?? ""} onChange={e => onChange({ ...d, reference: e.target.value })} />
      </Field>
      <Field label="Notes">
        <Textarea rows={2} placeholder="Any billing notes..." value={(d.notes as string) ?? ""} onChange={e => onChange({ ...d, notes: e.target.value })} />
      </Field>
    </div>
  );
}

// ─── 12. Audit Finalisation ───────────────────────────────────────────────────
export function AuditFinalisationPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <FileCheck01 className="size-3.5" />Audit sign-off
      </div>
      <Field label="Reviewed by">
        <Input placeholder="Compliance officer name" value={(d.reviewer as string) ?? ""} onChange={e => onChange({ ...d, reviewer: e.target.value })} />
      </Field>
      <Field label="Finalisation date">
        <Input type="date" value={(d.date as string) ?? ""} onChange={e => onChange({ ...d, date: e.target.value })} />
      </Field>
      <Field label="Final status">
        <Select value={(d.status as string) ?? ""} onChange={e => onChange({ ...d, status: e.target.value })}>
          <option value="">Select...</option>
          <option value="cleared">Cleared — no issues</option>
          <option value="minor">Minor issues noted — resolved</option>
          <option value="escalated">Escalated to management</option>
        </Select>
      </Field>
      <Field label="Sign-off notes">
        <Textarea rows={2} value={(d.notes as string) ?? ""} onChange={e => onChange({ ...d, notes: e.target.value })} />
      </Field>
    </div>
  );
}

// ─── 13. Input life insurance amounts & premiums ──────────────────────────────
export function InputAmountsPanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <CurrencyDollar className="size-3.5" />Policy amounts & premiums
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Life sum insured">
          <Input placeholder="$0" value={(d.lifeAmount as string) ?? ""} onChange={e => onChange({ ...d, lifeAmount: e.target.value })} />
        </Field>
        <Field label="Life annual premium">
          <Input placeholder="$0.00" value={(d.lifePremium as string) ?? ""} onChange={e => onChange({ ...d, lifePremium: e.target.value })} />
        </Field>
        <Field label="TPD sum insured">
          <Input placeholder="$0" value={(d.tpdAmount as string) ?? ""} onChange={e => onChange({ ...d, tpdAmount: e.target.value })} />
        </Field>
        <Field label="TPD annual premium">
          <Input placeholder="$0.00" value={(d.tpdPremium as string) ?? ""} onChange={e => onChange({ ...d, tpdPremium: e.target.value })} />
        </Field>
        <Field label="IP monthly benefit">
          <Input placeholder="$0/mo" value={(d.ipBenefit as string) ?? ""} onChange={e => onChange({ ...d, ipBenefit: e.target.value })} />
        </Field>
        <Field label="IP annual premium">
          <Input placeholder="$0.00" value={(d.ipPremium as string) ?? ""} onChange={e => onChange({ ...d, ipPremium: e.target.value })} />
        </Field>
      </div>
      <Field label="Total annual premium">
        <Input placeholder="$0.00" value={(d.totalPremium as string) ?? ""} onChange={e => onChange({ ...d, totalPremium: e.target.value })} className="font-semibold" />
      </Field>
    </div>
  );
}

// ─── 14. Inforce call & email ─────────────────────────────────────────────────
export function InforcePanel({ lead: _lead, savedData, onChange }: TaskPanelProps) {
  const d = savedData ?? {};
  const defaultEmail = lead
    ? `Hi ${lead.firstName},\n\nFantastic news — your ${lead.policyType} policy is now inforce!\n\nYour cover is active and protecting you and your family from today. We'll be in touch annually to review your cover.\n\nThank you for trusting us with this important decision.\n\nKind regards`
    : "";
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs text-brand-secondary font-medium">
        <Phone className="size-3.5" />Inforce confirmation
      </div>
      <Field label="Call outcome">
        <Select value={(d.callOutcome as string) ?? ""} onChange={e => onChange({ ...d, callOutcome: e.target.value })}>
          <option value="">Select...</option>
          <option value="reached">Reached — client confirmed happy</option>
          <option value="voicemail">Left voicemail</option>
          <option value="no_answer">No answer — sent email only</option>
        </Select>
      </Field>
      <Field label="Confirmation email">
        <Textarea rows={5} value={(d.emailBody as string) ?? defaultEmail} onChange={e => onChange({ ...d, emailBody: e.target.value })} />
      </Field>
      {!(d.emailSent as boolean) ? (
        <button onClick={() => onChange({ ...d, emailSent: true })}
          className="w-full rounded-lg bg-brand-solid px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-solid_hover transition-colors">
          <span className="flex items-center justify-center gap-1.5"><Mail01 className="size-3.5" />Send inforce email</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg bg-success-secondary border border-success-solid px-3 py-2">
          <Check className="size-3.5 text-success-primary shrink-0" />
          <p className="text-xs text-success-primary font-medium">🎉 Inforce email sent — client journey complete</p>
        </div>
      )}
    </div>
  );
}

// ─── Panel router — maps templateTaskId → panel component ────────────────────
export function TaskPanel({ templateTaskId, lead, savedData, onChange }: {
  templateTaskId: number;
  lead: SimLead | undefined;
  savedData?: TaskPanelData;
  onChange: (data: TaskPanelData) => void;
}) {
  const props = { lead: _lead, savedData, onChange };
  switch (templateTaskId) {
    case 166: return <IntroductionCallPanel {...props} />;
    case 207: return <InitialLifeDiscussionPanel {...props} />;
    case 147: return <LifeInsuranceDiscussionPanel {...props} />;
    case 102: return <QuoteReviewPanel {...props} />;
    case 150: return <FollowUpPanel label="Life insurance follow-up" {...props} />;
    case 172: return <BookReviewPanel {...props} />;
    case 134: return <AddPolicyNumberPanel {...props} />;
    case 117: return <SendEmailPanel {...props} />;
    case 159: return <UploadDocumentsPanel {...props} />;
    case 99:  return <ComplianceAuditPanel {...props} />;
    case 135: return <ComplianceBillingPanel {...props} />;
    case 154: return <AuditFinalisationPanel {...props} />;
    case 133: return <InputAmountsPanel {...props} />;
    case 180: return <InforcePanel {...props} />;
    default:  return null;
  }
}
