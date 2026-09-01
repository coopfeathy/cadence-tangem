import { useMemo, useState, type ReactNode } from "react";
import { ArrowRight, CreditCard, Nfc, Shield } from "lucide-react";
import { CadenceCard } from "@/components/cadence-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SecureCardPicker, type CardDraft } from "@/components/secure-card";
import { NETWORKS, SAMPLE_ADDRESSES } from "@/lib/assets";
import { useCadence } from "@/lib/store";
import { cn } from "@/lib/utils";
import { detectNetwork, isValidAddress } from "@/lib/validate";

const STEPS = ["Welcome", "Tangem", "Card"] as const;

export function Onboarding() {
  const [step, setStep] = useState(0);
  const addWallet = useCadence((s) => s.addWallet);
  const addCard = useCadence((s) => s.addCard);
  const complete = useCadence((s) => s.completeOnboarding);

  return (
    <div id="app-root" className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pt-8">
        <p className="font-display text-2xl italic">Cadence</p>
        <ol className="mt-6 flex gap-2">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-200",
                i <= step ? "bg-primary" : "bg-elevated",
              )}
            />
          ))}
        </ol>

        {step === 0 ? <Welcome onNext={() => setStep(1)} /> : null}
        {step === 1 ? (
          <WalletStep
            onBack={() => setStep(0)}
            onNext={(wallet) => {
              addWallet(wallet);
              setStep(2);
            }}
          />
        ) : null}
        {step === 2 ? (
          <CardStep
            onBack={() => setStep(1)}
            onNext={(card) => {
              addCard(card);
              complete();
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 mt-auto bg-bg/90 pt-4 pb-20 backdrop-blur-md">
      {children}
    </div>
  );
}

function Welcome({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="rise-in mt-8">
        <h1 className="font-display text-4xl leading-tight font-medium tracking-tight sm:text-5xl">
          Small buys.
          <br />
          <span className="italic">Straight to Tangem.</span>
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Set a cadence, pay with a card, and stack bitcoin on the hardware
          wallet in your pocket. Cadence never holds your keys — and never
          sees your card number.
        </p>
        <Button className="mt-6 w-full" size="lg" onClick={onNext}>
          Add my Tangem
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="rise-in rise-in-delay-1 mx-auto mt-8 w-full max-w-sm">
        <CadenceCard />
      </div>

      <ul className="rise-in rise-in-delay-2 mt-8 mb-8 space-y-3 text-sm text-muted">
        <li className="flex gap-3">
          <Nfc className="mt-0.5 size-4 shrink-0 text-primary" />
          Destination is a Tangem address you paste from the app.
        </li>
        <li className="flex gap-3">
          <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" />
          Cards go through Stripe. Cadence never collects the number or CVC.
        </li>
        <li className="flex gap-3">
          <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
          Without Stripe keys, buys are simulated at live prices so you can
          design the cadence first.
        </li>
      </ul>
    </div>
  );
}

function WalletStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (wallet: {
    label: string;
    network: (typeof NETWORKS)[number]["id"];
    address: string;
  }) => void;
}) {
  const [label, setLabel] = useState("My Tangem");
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]["id"]>("bitcoin");
  const [address, setAddress] = useState("");

  const detected = useMemo(() => detectNetwork(address), [address]);
  const valid = isValidAddress(network, address);

  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Where should it land?
        </h1>
        <p className="mt-2 text-sm text-muted">
          Open the Tangem app, copy a receive address, and paste it here.
          Later cadences can only buy to addresses you save — not ones you
          type at checkout.
        </p>
      </div>

      <div className="mx-auto mt-6 w-full max-w-sm">
        <CadenceCard
          label={label || "Tangem"}
          address={address || undefined}
          networkLabel={NETWORKS.find((n) => n.id === network)?.label}
        />
      </div>

      <div className="mt-6 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="wallet-label">Nickname</Label>
          <Input
            id="wallet-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={32}
          />
        </div>

        <div className="space-y-2">
          <Label>Network</Label>
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNetwork(n.id)}
                className={cn(
                  "h-10 rounded-full px-3 text-sm transition-colors duration-150",
                  network === n.id
                    ? "bg-primary text-primary-fg"
                    : "bg-secondary text-muted hover:text-fg",
                )}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="wallet-address">Receive address</Label>
          <Input
            id="wallet-address"
            value={address}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            placeholder={NETWORKS.find((n) => n.id === network)?.hint}
            onChange={(e) => {
              const next = e.target.value.trim();
              setAddress(next);
              const guess = detectNetwork(next);
              if (guess) setNetwork(guess);
            }}
            className="font-mono text-xs sm:text-sm"
          />
          {address && !valid ? (
            <p className="text-xs text-danger">
              That does not look like a {NETWORKS.find((n) => n.id === network)?.label}{" "}
              address.
            </p>
          ) : null}
          {detected && detected !== network ? (
            <p className="text-xs text-muted">Detected {detected}. Network updated.</p>
          ) : null}
        </div>

        <button
          type="button"
          className="text-sm text-muted underline-offset-4 hover:text-fg hover:underline"
          onClick={() => {
            setNetwork("bitcoin");
            setAddress(SAMPLE_ADDRESSES.bitcoin);
            setLabel("Sample Tangem");
          }}
        >
          Use a sample Bitcoin address to explore
        </button>
      </div>

      <StickyActions>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onBack}>
            Back
          </Button>
          <Button
            className="flex-1"
            disabled={!valid || !label.trim()}
            onClick={() =>
              onNext({
                label: label.trim(),
                network,
                address: address.trim(),
              })
            }
          >
            Continue
          </Button>
        </div>
      </StickyActions>
    </div>
  );
}

function CardStep({
  onBack,
  onNext,
}: {
  onBack: () => void;
  onNext: (card: CardDraft) => void;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="mt-8">
        <h1 className="font-display text-3xl font-medium tracking-tight">
          How you'll pay
        </h1>
        <p className="mt-2 text-sm text-muted">
          Cadence does not accept card numbers. Stripe collects them in a
          certified frame, then sends crypto to your Tangem.
        </p>
      </div>
      <div className="mt-6">
        <SecureCardPicker onChoose={onNext} />
      </div>
      <StickyActions>
        <Button variant="secondary" className="w-full" onClick={onBack}>
          Back
        </Button>
      </StickyActions>
    </div>
  );
}
