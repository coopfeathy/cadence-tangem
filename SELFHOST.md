# Private server — cheap and locked down

Cadence on a mini PC in your house. Only *your* phone and laptop can open it (Tailscale). Stripe talks *out* from the box. Nothing is port-forwarded. Keys stay on Tangem. Card numbers stay on Stripe.

Do not paste `sk_live_` or `sk_test_` into chat, email, or GitHub.

## 1. Hardware (~$80–150, one time)

Buy a tiny x86 box, not Umbrel, not a phone:

- 8 GB RAM, 128 GB SSD, Intel N100 or better
- Examples: Beelink Mini S12 / S13, GMKtec NucBox, used Dell OptiPlex 3080 Micro

A Raspberry Pi 5 (8 GB) works if you already have one. A used Intel mini PC is less fuss (real disk, fewer power-supply surprises).

Also grab: HDMI cable, USB keyboard, USB stick (8 GB+) for the installer.

## 2. Install Ubuntu

1. On your current computer, download [Ubuntu Desktop 24.04 LTS](https://ubuntu.com/download/desktop)
2. Flash the USB with [Raspberry Pi Imager](https://www.raspberrypi.com/software/) or Balena Etcher
3. Plug the USB into the mini PC, attach monitor + keyboard, power on
4. Mash the boot-menu key (often F7 / F12 / Esc), boot the USB
5. Install Ubuntu. Use a **long unique password**. Enable disk encryption if offered (recommended).

You now have a private computer. Keep it plugged in, on Ethernet if you can.

## 3. Updates and a closed door

On the mini PC, open **Terminal** and paste, one block at a time:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades ufw git ca-certificates curl
sudo dpkg-reconfigure -plow unattended-upgrades
```

Say yes to automatic security updates.

Firewall — deny everything inbound (Tailscale still works; it is not a forwarded router port):

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
sudo ufw status
```

**Do not** log into your home router and “open port 80 / 443 / 8080 / 22”. That undoes this setup.

## 4. Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out of Ubuntu and back in (or reboot) so Docker works without `sudo`.

```bash
docker version
```

## 5. Tailscale (the private network)

1. Create a free account at [tailscale.com](https://tailscale.com)
2. In the admin console, turn **MagicDNS** on
3. On the mini PC:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

A login URL appears — open it, approve the machine, name it `cadence`.

4. On your **iPhone**: App Store → Tailscale → sign in to the same account  
5. On your **laptop**: install Tailscale too

Until Tailscale is on a device, that device cannot see Cadence. That is the point.

## 6. Cadence

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/coopfeathy/cadence-tangem.git
cd cadence-tangem
cp .env.example .env
chmod 600 .env
nano .env
```

Put your **test** keys in (from [Stripe API keys](https://dashboard.stripe.com/test/apikeys), test mode):

```
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

Save (`Ctrl+O`, Enter, `Ctrl+X`). Then:

```bash
docker compose up -d --build
docker compose logs -f --tail=50
```

Leave it when you see it listening. `Ctrl+C` only stops the log view, not the app.

Cadence is bound to **this machine only** (`127.0.0.1`). The rest of your Wi-Fi cannot reach it.

## 7. HTTPS on Tailscale

Still on the mini PC:

```bash
sudo tailscale serve --bg 8080
sudo tailscale serve status
```

You get a URL like `https://cadence.tail-xxxxx.ts.net`. Open that **on your phone with Tailscale connected**. You should see Cadence.

If the page fails, confirm Tailscale is on on the phone and MagicDNS is on.

## 8. Tell Stripe this hostname

1. Finish [Crypto Onramp onboarding](https://dashboard.stripe.com/crypto-onramp/onboarding) if you have not
2. Add `https://cadence.tail-xxxxx.ts.net` as an allowed domain
3. In Cadence → Wallet, choose **Pay with Stripe** (appears once keys are valid)

Stay on **test keys** until a test buy works. Then swap in live keys in `.env` and run:

```bash
cd ~/apps/cadence-tangem
docker compose up -d
```

Add the same hostname in Stripe for live mode. Live Onramp coins: BTC, ETH, SOL, AVAX.

## 9. Day-to-day

| Task | Command (on the mini PC) |
|---|---|
| Update Cadence | `cd ~/apps/cadence-tangem && git pull && docker compose up -d --build` |
| Restart | `cd ~/apps/cadence-tangem && docker compose restart` |
| Logs | `cd ~/apps/cadence-tangem && docker compose logs -f` |
| Stop | `cd ~/apps/cadence-tangem && docker compose down` |

Ubuntu already installs security patches. Reboot the mini PC after a kernel update when convenient.

## 10. What this does *not* do

- It does not auto-charge your card on a schedule. Each buy still opens Stripe.
- It is not a public shop. Only devices on your Tailscale account can load Cadence.
- GitHub Pages cannot replace this box.
- Umbrel is optional later as a Bitcoin node — do not port-forward it, and do not run Cadence as a public Umbrel app.

If Stripe ever refuses a Tailscale hostname, the fallback is a cheap domain + Cloudflare Tunnel (still no open router ports). Cross that if it happens; don’t start there.
