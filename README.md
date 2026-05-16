# LexLive — US Tax & Law Intel Portal

Free, public web portal with live IRS updates, US law changes, real-time exchange rates, tax calendar, and an AI Q&A assistant.

---

## Deploy in 10 minutes (free)

### Step 1 — Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)
5. Add billing info — you only pay for usage (~$0.01 per page load)

### Step 2 — Put the code on GitHub
1. Go to https://github.com and create an account if needed
2. Click **New Repository** → name it `lexlive` → **Create**
3. Upload all these files (drag & drop or use GitHub Desktop)
   - Make sure the folder structure matches what's in this ZIP

### Step 3 — Deploy to Vercel (free)
1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New Project**
3. Select your `lexlive` repository → click **Deploy**
4. Once deployed, go to your project → **Settings** → **Environment Variables**
5. Add:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** your key from Step 1
6. Go to **Deployments** → click **Redeploy**

Your app is now live at `https://lexlive-xxx.vercel.app` — share this URL with anyone!

---

## Optional: Custom domain
In Vercel → Settings → Domains → add your domain (e.g. lexlive.com)
You can buy a domain at Namecheap (~$10/year) or Cloudflare (~$10/year)

---

## Running locally (for development)
```bash
npm install
npm run dev
```
Create a `.env` file:
```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## Cost estimate
- **Hosting:** Free (Vercel free tier)
- **Exchange rates:** Free (European Central Bank via Frankfurter)
- **AI (Claude API):** ~$0.003–0.01 per user page load
  - 100 daily users ≈ $15–30/month
  - 1,000 daily users ≈ $150–300/month

---

## Tech stack
- React + Vite (frontend)
- Vercel Serverless Functions (backend/API proxy)
- Anthropic Claude Sonnet with web search (AI updates)
- Frankfurter / European Central Bank API (exchange rates)

---

## Features
- 📊 **Dashboard** — live snapshot of rates, latest IRS & law news, upcoming deadlines
- 🏛️ **IRS Updates** — AI-powered live web search for latest IRS announcements
- ⚖️ **Law Changes** — recent US federal legislation in plain English
- 💱 **Exchange Rates** — 30+ currencies, live rates, full converter ("1 USD = X")
- 📅 **Tax Calendar** — all federal tax deadlines by month with descriptions
- 🔍 **Ask LexLive** — AI chatbot for any US tax or law question
