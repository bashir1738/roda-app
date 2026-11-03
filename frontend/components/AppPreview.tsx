import { CircleUsersIcon, TrendingUpIcon, GiftIcon, WalletIcon } from "./icons";

/* A realistic iPhone rendering of the Roda home screen, used in the hero.
   Titanium rail + Dynamic Island + status bar + home indicator wrap a screen
   that mirrors the real app: forest-green header + cream sheet with circles. */
export function AppPreview() {
  return (
    <div className="relative mx-auto w-[290px] sm:w-[320px]">
      {/* Ambient glow */}
      <div className="absolute -inset-10 -z-10 " />
      <div className="absolute -bottom-8 -left-4 -z-10 h-32 w-32 rounded-full bg-surface-sand" />

      {/* Side buttons (on the titanium rail) */}
      <span className="absolute -left-[2px] top-[120px] h-7 w-[3px] rounded-l bg-zinc-700" />
      <span className="absolute -left-[2px] top-[164px] h-12 w-[3px] rounded-l bg-zinc-700" />
      <span className="absolute -left-[2px] top-[214px] h-12 w-[3px] rounded-l bg-zinc-700" />
      <span className="absolute -right-[2px] top-[180px] h-16 w-[3px] rounded-r bg-zinc-700" />

      {/* Titanium frame */}
      <div className="rounded-[3.4rem] border border-zinc-300 bg-zinc-200 p-[2px]">
        {/* Black bezel */}
        <div className="rounded-[3.3rem] bg-black p-[9px]">
          {/* Screen */}
          <div
            className="relative flex flex-col overflow-hidden rounded-[2.7rem] bg-surface"
            style={{ aspectRatio: "9 / 19.5" }}
          >
            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-2.5 z-30 flex h-[26px] w-[86px] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-2.5">
              <span className="h-2 w-2 rounded-full bg-zinc-800 ring-1 ring-zinc-700" />
            </div>

            {/* Clean Minimalist App UI */}
            <div className="flex flex-1 flex-col bg-white px-5 pb-0 pt-3">
              <StatusBar />

              {/* Profile Header */}
              <div className="mt-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">
                    A
                  </div>
                  <span className="text-[14px] font-bold text-charcoal">Hi, Amara</span>
                </div>
                <div className="rounded-lg bg-border-subtle/50 px-2 py-1.5 text-[10px] font-bold text-charcoal">
                  Tier 3
                </div>
              </div>

              {/* Balance Section */}
              <div className="mt-8">
                <p className="text-[11px] font-semibold text-muted">Total Balance</p>
                <p className="mt-0.5 text-[28px] font-extrabold tracking-tight text-charcoal">
                  $4,820.00
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-7 flex justify-between gap-3">
                <div className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-12 w-full items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <TrendingUpIcon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-charcoal">Add Money</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-12 w-full items-center justify-center rounded-xl bg-border-subtle/50 text-charcoal">
                    <WalletIcon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-charcoal">Transfer</span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-1.5">
                  <div className="flex h-12 w-full items-center justify-center rounded-xl bg-border-subtle/50 text-charcoal">
                    <CircleUsersIcon className="h-5 w-5" />
                  </div>
                  <span className="text-[10px] font-semibold text-charcoal">Circles</span>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-9 flex-1">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[13px] font-bold text-charcoal">Recent Activity</p>
                  <span className="text-[11px] font-bold text-primary">See All</span>
                </div>
                
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4ADE80]/15">
                        <GiftIcon className="h-4 w-4 text-[#22c55e]" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-charcoal">Lagos Traders</p>
                        <p className="text-[10px] text-muted">Payout received</p>
                      </div>
                    </div>
                    <p className="text-[12px] font-extrabold text-[#22c55e]">+$1,200</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-border-subtle/50">
                        <CircleUsersIcon className="h-4 w-4 text-charcoal" />
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-charcoal">Family Pool</p>
                        <p className="text-[10px] text-muted">Weekly contribution</p>
                      </div>
                    </div>
                    <p className="text-[12px] font-bold text-charcoal">-$80</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom tab bar */}
            <div className="flex items-center justify-around border-t border-border-subtle bg-white px-2 pb-5 pt-2.5">
              <Tab icon={<HomeGlyph />} label="Home" active />
              <Tab icon={<CircleUsersIcon className="h-[18px] w-[18px]" />} label="Circles" />
              <Tab icon={<TrendingUpIcon className="h-[18px] w-[18px]" />} label="Vault" />
              <Tab icon={<WalletIcon className="h-[18px] w-[18px]" />} label="Wallet" />
            </div>

            {/* Home indicator */}
            <div className="pointer-events-none absolute bottom-1.5 left-1/2 z-20 h-1 w-28 -translate-x-1/2 rounded-full bg-charcoal/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="flex h-[26px] items-center justify-between text-zinc-900">
      <span className="text-[12px] font-bold tracking-tight">9:41</span>
      <div className="flex items-center gap-1.5">
        <SignalGlyph />
        <WifiGlyph />
        <BatteryGlyph />
      </div>
    </div>
  );
}

function SignalGlyph() {
  return (
    <svg viewBox="0 0 18 12" className="h-[11px] w-[17px]" fill="currentColor">
      <rect x="0" y="8" width="3" height="4" rx="0.6" />
      <rect x="5" y="5" width="3" height="7" rx="0.6" />
      <rect x="10" y="2.5" width="3" height="9.5" rx="0.6" />
      <rect x="15" y="0" width="3" height="12" rx="0.6" />
    </svg>
  );
}

function WifiGlyph() {
  return (
    <svg viewBox="0 0 16 12" className="h-[11px] w-[15px]" fill="currentColor">
      <path d="M8 2.4c2.6 0 5 1 6.8 2.7l-1.4 1.5A7.6 7.6 0 0 0 8 4.5 7.6 7.6 0 0 0 2.6 6.6L1.2 5.1A9.8 9.8 0 0 1 8 2.4Z" />
      <path d="M8 6.2c1.5 0 2.9.6 4 1.6l-1.5 1.5A3.6 3.6 0 0 0 8 8.3c-.9 0-1.8.4-2.5 1l-1.5-1.5a5.6 5.6 0 0 1 4-1.6Z" />
      <circle cx="8" cy="11" r="1.2" />
    </svg>
  );
}

function BatteryGlyph() {
  return (
    <svg viewBox="0 0 27 13" className="h-[12px] w-[25px]" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="22"
        height="12"
        rx="3.2"
        stroke="currentColor"
        strokeOpacity="0.45"
      />
      <rect x="2.2" y="2.2" width="16" height="8.6" rx="1.8" fill="currentColor" />
      <path
        d="M24.5 4.2c1.1.4 1.1 4.2 0 4.6Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
    </svg>
  );
}

function HomeGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

function Tab({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 ${
        active ? "text-primary" : "text-muted"
      }`}
    >
      {icon}
      <span className="text-[9px] font-semibold">{label}</span>
    </div>
  );
}

function Stat({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: dot }}
      />
      {label}
    </span>
  );
}

function MiniCircle({
  name,
  members,
  amount,
  progress,
}: {
  name: string;
  members: string;
  amount: string;
  progress: number;
}) {
  return (
    <div className="mb-2.5 rounded-xl border border-border-subtle bg-white p-3.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <CircleUsersIcon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-bold text-charcoal">{name}</p>
          <p className="text-[10px] text-muted">{members}</p>
        </div>
        <p className="text-[12px] font-extrabold text-primary">{amount}</p>
      </div>
      <div className="mt-3 h-px overflow-hidden bg-border-subtle">
        <div
          className="h-full bg-charcoal"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
