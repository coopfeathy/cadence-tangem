import { useState } from "react";
import { Lock, Plus, Trash2 } from "lucide-react";
import { CadenceCard } from "@/components/cadence-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SecureCardPicker } from "@/components/secure-card";
import { useStripeConfig } from "@/components/providers";
import { NETWORKS } from "@/lib/assets";
import { useCadence } from "@/lib/store";
import { cn } from "@/lib/utils";
import { detectNetwork, isValidAddress, shortenAddress } from "@/lib/validate";

export function WalletHub() {
  const wallets = useCadence((s) => s.wallets);
  const cards = useCadence((s) => s.cards);
  const removeWallet = useCadence((s) => s.removeWallet);
  const removeCard = useCadence((s) => s.removeCard);
  const [walletOpen, setWalletOpen] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const primary = wallets[0];
  const { config } = useStripeConfig();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-medium tracking-tight">Wallet</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Addresses live on this device. Cadence never asks for a Tangem seed
          or private key — only a receive address.
        </p>
      </header>

      <CadenceCard
        label={primary?.label ?? "Tangem"}
        address={primary?.address}
        networkLabel={
          primary
            ? NETWORKS.find((n) => n.id === primary.network)?.label
            : undefined
        }
      />

      <section className="rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Lock className="size-4 text-primary" />
          Payment processor
        </p>
        <p className="mt-2 text-sm text-muted">
          {config?.configured
            ? `Stripe ${config.livemode ? "live" : "test"} is connected. Card numbers are entered in Stripe's PCI frame and never stored here.`
            : "Stripe is free to start (no monthly fee). Set STRIPE_SECRET_KEY and VITE_STRIPE_PUBLISHABLE_KEY to take live card payments to your Tangem."}
        </p>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm tracking-wide text-subtle uppercase">
            Tangem addresses
          </h2>
          <Button size="sm" variant="secondary" onClick={() => setWalletOpen(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        <ul className="mt-3 divide-y divide-border rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          {wallets.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">No addresses yet.</li>
          ) : (
            wallets.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm">{w.label}</p>
                  <p className="text-xs text-subtle">
                    {NETWORKS.find((n) => n.id === w.network)?.label}
                  </p>
                  <p className="truncate font-mono text-xs text-muted">
                    {shortenAddress(w.address, 12, 8)}
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Remove ${w.label}`}
                  onClick={() => removeWallet(w.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm tracking-wide text-subtle uppercase">Payment rails</h2>
          <Button size="sm" variant="secondary" onClick={() => setCardOpen(true)}>
            <Plus className="size-4" />
            Add
          </Button>
        </div>
        <ul className="mt-3 divide-y divide-border rounded-2xl bg-surface shadow-[var(--shadow-border)]">
          {cards.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">No payment rail yet.</li>
          ) : (
            cards.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm">
                    {c.processor === "stripe"
                      ? "Stripe Crypto Onramp"
                      : `Preview ···· ${c.last4}`}
                  </p>
                  <p className="text-xs text-subtle">{c.holder}</p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Remove rail"
                  onClick={() => removeCard(c.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))
          )}
        </ul>
        <p className="mt-3 text-xs text-subtle">
          Full card numbers, CVC, and expiry are never stored. Stripe tokens
          live on Stripe. Preview rails store only last four digits of a test
          card we issue — you never type a PAN.
        </p>
      </section>

      <AddWalletDialog open={walletOpen} onOpenChange={setWalletOpen} />
      <AddCardDialog open={cardOpen} onOpenChange={setCardOpen} />
    </div>
  );
}

function AddWalletDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addWallet = useCadence((s) => s.addWallet);
  const [label, setLabel] = useState("Tangem");
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]["id"]>("ethereum");
  const [address, setAddress] = useState("");
  const valid = isValidAddress(network, address);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Tangem address</DialogTitle>
          <DialogDescription>
            Copy a receive address from the Tangem app.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nw-label">Nickname</Label>
            <Input id="nw-label" value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => setNetwork(n.id)}
                className={cn(
                  "h-9 rounded-full px-3 text-sm",
                  network === n.id
                    ? "bg-primary text-primary-fg"
                    : "bg-secondary text-muted",
                )}
              >
                {n.label}
              </button>
            ))}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nw-addr">Address</Label>
            <Input
              id="nw-addr"
              className="font-mono text-xs"
              value={address}
              spellCheck={false}
              onChange={(e) => {
                const next = e.target.value.trim();
                setAddress(next);
                const guess = detectNetwork(next);
                if (guess) setNetwork(guess);
              }}
            />
            {address && !valid ? (
              <p className="text-xs text-danger">Address does not match this network.</p>
            ) : null}
          </div>
          <Button
            className="w-full"
            disabled={!valid || !label.trim()}
            onClick={() => {
              addWallet({ label: label.trim(), network, address: address.trim() });
              setAddress("");
              onOpenChange(false);
            }}
          >
            Save address
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddCardDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addCard = useCadence((s) => s.addCard);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a payment rail</DialogTitle>
          <DialogDescription>
            No card number field. Stripe hosts the PAN, or use a preview test card.
          </DialogDescription>
        </DialogHeader>
        <SecureCardPicker
          onChoose={(card) => {
            addCard(card);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
