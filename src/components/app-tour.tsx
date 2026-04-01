import { useState, useEffect } from "react";
import { Joyride, STATUS, Step, TooltipRenderProps, Status, EventData, Controls } from "react-joyride";
import { X, ChevronRight, ChevronLeft } from "@untitledui/icons";

// ═══════════════════════════════════════════════════════════════════════════════
// TOUR VERSION — Bump this when deploying new features to show tour again
// ═══════════════════════════════════════════════════════════════════════════════
const TOUR_VERSION = "2026-04-01-v1";
const TOUR_STORAGE_KEY = "axis_tour_version";

// ═══════════════════════════════════════════════════════════════════════════════
// TOUR STEPS — Define your tour steps here
// ═══════════════════════════════════════════════════════════════════════════════
export const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="nav-insurance"]',
    content: "The Insurance module has been completely redesigned with 9 new tabs including Dashboard, Active Benefits, Policies tracker, and more.",
    title: "✨ New Insurance Book",
    skipBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="nav-workbench"]',
    content: "Your personalized command center. Quick access to tasks, recent clients, and key metrics all in one place.",
    title: "📊 Workbench",
    skipBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="nav-tasks"]',
    content: "Tasks now includes All Tasks and Scheduled Tasks views for better organization.",
    title: "✅ Enhanced Tasks",
    skipBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="nav-clients"]',
    content: "Client navigation now includes status-based filters: Active, Prospects, In Progress, and more.",
    title: "👥 Client Filters",
    skipBeacon: true,
    placement: "right",
  },
  {
    target: '[data-tour="nav-settings"]',
    content: "Settings has moved from the footer to the main navigation for easier access.",
    title: "⚙️ Settings Relocated",
    skipBeacon: true,
    placement: "right",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOM TOOLTIP — Styled with Slate Grey (#3B485B)
// ═══════════════════════════════════════════════════════════════════════════════
function CustomTooltip({
  continuous,
  index,
  step,
  backProps,
  closeProps,
  primaryProps,
  tooltipProps,
  size,
}: TooltipRenderProps) {
  return (
    <div
      {...tooltipProps}
      className="bg-white rounded-xl shadow-2xl border border-secondary max-w-sm overflow-hidden"
      style={{ zIndex: 10000 }}
    >
      {/* Header */}
      <div className="bg-[#3B485B] px-4 py-3 flex items-center justify-between">
        <span className="text-white text-sm font-semibold">
          {step.title || `Step ${index + 1} of ${size}`}
        </span>
        <button
          {...closeProps}
          className="text-white/70 hover:text-white transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        <p className="text-sm text-secondary leading-relaxed">{step.content}</p>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-tertiary border-t border-secondary flex items-center justify-between">
        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: size }, (_, i) => (
            <div
              key={i}
              className={`size-2 rounded-full transition-colors ${
                i === index ? "bg-[#3B485B]" : "bg-quaternary"
              }`}
            />
          ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          {index > 0 && (
            <button
              {...backProps}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary border border-secondary rounded-lg hover:bg-secondary_alt transition-colors"
            >
              <ChevronLeft className="size-3.5" />
              Back
            </button>
          )}
          <button
            {...primaryProps}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-[#3B485B] rounded-lg hover:bg-[#2d3847] transition-colors"
          >
            {continuous ? (
              <>
                Next
                <ChevronRight className="size-3.5" />
              </>
            ) : (
              "Got it!"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOUR WELCOME MODAL — Shown before starting tour
// ═══════════════════════════════════════════════════════════════════════════════
function TourWelcomeModal({
  onStart,
  onSkip,
}: {
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-[#3B485B] to-[#2d3847] px-6 py-8 text-center">
          <div className="size-16 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h2
            className="text-xl font-semibold text-white mb-2"
            style={{ fontFamily: "'Metrophobic', sans-serif" }}
          >
            What's New in Axis CRM
          </h2>
          <p className="text-white/80 text-sm">
            We've made some exciting updates! Take a quick tour to see what's
            changed.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="px-6 py-5 space-y-3">
          {[
            { emoji: "📊", text: "Redesigned Insurance Book with 9 tabs" },
            { emoji: "🏠", text: "New Workbench for quick access" },
            { emoji: "⚙️", text: "Settings moved to main navigation" },
            { emoji: "👥", text: "Client status-based filters" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg">{item.emoji}</span>
              <span className="text-sm text-secondary">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-tertiary border-t border-secondary flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-tertiary hover:text-secondary transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#3B485B] rounded-lg hover:bg-[#2d3847] transition-colors"
          >
            Take the Tour
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// JOYRIDE OPTIONS — Slate Grey styling
// ═══════════════════════════════════════════════════════════════════════════════
const joyrideOptions = {
  primaryColor: "#3B485B",
  overlayColor: "rgba(0, 0, 0, 0.5)",
  arrowColor: "#3B485B",
  spotlightPadding: 8,
  spotlightRadius: 12,
  showProgress: true,
  zIndex: 10000,
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TOUR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function AppTour() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [runTour, setRunTour] = useState(false);

  // Check if user needs to see the tour
  useEffect(() => {
    const seenVersion = localStorage.getItem(TOUR_STORAGE_KEY);
    if (seenVersion !== TOUR_VERSION) {
      // Small delay to let the page render first
      const timer = setTimeout(() => setShowWelcome(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStartTour = () => {
    setShowWelcome(false);
    setRunTour(true);
  };

  const handleSkipTour = () => {
    setShowWelcome(false);
    localStorage.setItem(TOUR_STORAGE_KEY, TOUR_VERSION);
  };

  const handleJoyrideEvent = (data: EventData, _controls: Controls) => {
    const { status } = data;
    const finishedStatuses: Status[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem(TOUR_STORAGE_KEY, TOUR_VERSION);
    }
  };

  return (
    <>
      {/* Welcome modal */}
      {showWelcome && (
        <TourWelcomeModal onStart={handleStartTour} onSkip={handleSkipTour} />
      )}

      {/* Joyride tour */}
      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        continuous
        onEvent={handleJoyrideEvent}
        tooltipComponent={CustomTooltip}
        options={joyrideOptions}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL TRIGGER BUTTON — Add this anywhere to let users restart the tour
// ═══════════════════════════════════════════════════════════════════════════════
export function TourTriggerButton({ className }: { className?: string }) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [runTour, setRunTour] = useState(false);

  const handleJoyrideEvent = (data: EventData, _controls: Controls) => {
    const { status } = data;
    const finishedStatuses: Status[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowWelcome(true)}
        className={
          className ||
          "inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary border border-secondary rounded-lg hover:bg-secondary_alt transition-colors"
        }
      >
        <span>🎯</span>
        What's New
      </button>

      {showWelcome && (
        <TourWelcomeModal
          onStart={() => {
            setShowWelcome(false);
            setRunTour(true);
          }}
          onSkip={() => setShowWelcome(false)}
        />
      )}

      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        continuous
        onEvent={handleJoyrideEvent}
        tooltipComponent={CustomTooltip}
        options={joyrideOptions}
      />
    </>
  );
}
