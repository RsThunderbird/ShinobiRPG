# 🎯 100% AdSense Verification Checklist for ShinobiRPG

This checklist ensures your website meets all of Google's strict requirements for quality, legal compliance, and technical readiness.

## 🛠️ Phase 1: Legal & Compliance (Already Implemented)
- [x] **Terms of Service:** Created `tos.html` with AMOLED theme.
- [x] **Privacy Policy:** Created `privacy.html` with AMOLED theme and details on data collection.
- [x] **About Us:** Created `about.html` explaining the project's mission and team.
- [x] **Contact Us:** Created `contact.html` with Discord and Email support options.
- [x] **Clear Navigation:** Added footer links in `index.html` to all legal/support pages.

## 🔍 Phase 2: SEO & Technical Readiness (Already Implemented)
- [x] **Robots.txt:** Configured to allow AdSense crawlers (removed `/gwent/` block).
- [x] **Sitemap.xml:** Generated and verified for search engines.
- [x] **Semantic HTML:** Used tags like `<main>`, `<header>`, and `<footer>` for better crawling.
- [x] **Rich Aesthetics:** AMOLED black theme with glassmorphism for a "Premium" look.
- [x] **Bug Fixes:** Resolved the PC Liquid Cursor animation loading issue.

## ⏳ Phase 3: Content Quality (Manual Action Required)
- [ ] **Minimum Content:** Ensure you have at least 15-20 high-quality "static" pages or blog posts. AdSense dislikes sites that are *too* thin on text.
- [ ] **No No-Go Content:** Confirm there is no copyrighted content (unauthorized manga scans, etc.) or "adult" content that violates AdSense policies.
- [ ] **Engagement:** Ensure the "Event" and "Story" pages (which are interactive) have enough text descriptions to explain what the user is seeing.

## 🚀 Phase 4: Verification Process (Next Steps)
1. **AdSense Account Setup:**
   - Go to [Google AdSense](https://www.google.com/adsense/start/).
   - Sign up with your `shinobirpg.online` domain.
2. **The Verification Code:**
   - Google will provide a `<script>` tag (AdSense Code).
   - **Action:** You MUST paste this into the `<head>` of `index.html`.
3. **Ads.txt:**
   - Google will ask you to host an `ads.txt` file at the root of your site.
   - **Action:** Create `website/ads.txt` and paste the snippet they provide (e.g., `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`).
4. **The Review Period:**
   - Google takes 2-4 weeks to review. Keep the site active during this time.

## 💎 Bonus: Reward-Driven Ads Preparation
Once approved for standard AdSense, you can look into **AdSense for Games (H5 Games)** or **Rewarded Video Ads**:
- Integrate a "Watch Ad for 500 Ryo" button in the Bank or Store.
- This requires the Google Publisher SDK (GPT or IMA SDK).
- We can implement this as soon as your domain is approved for standard display ads!

---
*Created by Antigravity AI for ShinobiRPG*