# SMAP Meta Ads — Safe Integration & App Review Audit

**Application:** SMAP (Sahil Marketing Ads Powerful)  
**Meta App ID:** `1109938584974243`  
**Business Portfolio:** `986055813750158` (Sahil Kumar)  
**Ad Account:** `act_1627260695520511` (SMAP Ads • Active • INR)  
**Facebook Page:** `128670460329078` (Sahil Gupta)  
**Instagram Professional Account:** `17841445164423927` (@ravi105065)  
**Production Host:** `https://smap-ads.onrender.com`  
**Public Reviewer Guide URL:** `https://smap-ads.onrender.com/reviewer-instructions`  

---

## 1. Safety Gate & Mode Status (Verified)

* **`META_LIVE_SUBMISSIONS_ENABLED`:** Set strictly to `false`. Real ad submission and credit card billing are blocked.
* **App Mode:** Development Mode (Standard Access).
* **Customer Funds:** Preserved at 100%. No customer is charged for uncreated or failed ads.
* **Idempotency:** Background worker retries are strictly bounded (max 3 for transient network issues; 0 for permanent validation issues) and duplicate submissions are rejected at both API and database layers.

---

## 2. Meta Permission & Access Tier Verification Matrix

| Permission | Token Grant Status | Access Level Today | Meta App Review Status | Business Verification Required? | Access Verification Required? | Purpose in SMAP |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`ads_management`** | Granted on System User | **Standard Access** | **PENDING REVIEW** (Requires Advanced Access) | **YES (Mandatory)** | **YES** | Allows creating and updating campaigns, ad sets, creatives, and ads. |
| **`pages_manage_ads`** | Granted on System User | **Standard Access** | **PENDING REVIEW** (Requires Advanced Access) | **YES (Mandatory)** | **YES** | Allows running ads sponsored by Page `128670460329078`. |
| **`ads_read`** | Granted on System User | **Standard Access** | **PENDING REVIEW** (Requires Advanced Access) | Recommended | Recommended | Reads live impression/click/reach telemetry. |
| **`pages_read_engagement`** | Granted on System User | **Standard Access** | **PENDING REVIEW** (Requires Advanced Access) | Recommended | Recommended | Reads business page engagement metrics. |
| **`pages_show_list`** | Granted on System User | **Standard Access** | **PENDING REVIEW** (Requires Advanced Access) | Recommended | Recommended | Confirms connected page ownership. |
| **`business_management`** | Granted on System User | **Standard Access** | Optional (Standard is sufficient) | No | No | Reads Business Portfolio info (`986055813750158`). |

> **Important:** While the System User token has these permission strings granted inside Business Suite, in **Development Mode** Meta only allows **Standard Access (Level 0)**. Standard Access strictly limits ad creative creation to internal test users and blocks publishing to public audiences. Advanced Access is granted **only after Meta approves App Review**.

---

## 3. Strict Prohibited Content Enforcement (Meta Policy Section 4.2)

### Prohibited vs. Allowed Content
* **PROHIBITED:** Any ad copy, flyer, or headline promoting the sale, purchase, or artificial increase of followers, likes, views, subscribers, or fake engagement (e.g., *"1K IG/FB Followers = ₹500"*).
* **ALLOWED:** Genuine business promotion ads for products, retail shops, services, e-commerce, websites, consultations, appointments, or contact inquiries.

### Code Protections Active in SMAP:
1. **Frontend Pre-Submission Interceptor:**
   * Step 2 of `CreateAdFlow.tsx` continuously scans headlines, descriptions, and primary text using expanded regex patterns.
   * If prohibited phrasing is detected, the **"Continue to Placements"** button is disabled, and an amber alert banner displays the exact policy warning.
   * A **1-Click "Apply Meta-Compliant Product Ad Text"** button allows the user to immediately replace prohibited copy with an authentic retail/service ad template.
2. **Server-Side Pre-Flight Guard:**
   * `MetaService.validateCampaignPreFlight()` and `CampaignService.createDraft()` reject inauthentic copy with error:  
     `"Meta Advertising Policy Violation (Inauthentic Behavior & Artificial Engagement): Meta strictly prohibits ads promoting the sale, purchase, or artificial increase of followers, likes, views, subscribers, or comments (Meta Advertising Standards 4.2)."`
3. **Automated Test Coverage:**
   * Automated tests (Tests 21 & 22) confirm that both generic and the exact screenshot copy are blocked, while legitimate business ads pass.

---

## 4. App Reviewer Account & Instructions Hub (Verified)

* **Public Reviewer URL:** `https://smap-ads.onrender.com/reviewer-instructions` (No login required to view).
* **Test Reviewer Credentials:**
  * **Email:** `test.reviewer@smap-ads.test`
  * **Password:** `Reviewer@SMAP2026!`
  * **Account Role:** Customer
  * **Seeded Wallet Balance:** ₹1,000.00 (enables the Meta reviewer to test campaign creation without real UPI payments).
* **Security & Secret Protection:**
  * No access tokens, client secrets, or private keys are printed in the reviewer documentation or response logs.

---

## 5. Checklist: What You Must Do in Meta Developer Dashboard vs. What is Waiting

### A. What You Must Do Manually in Meta Portals (Android Chrome Desktop View):
1. **Complete Business Verification in Meta Business Suite:**
   * URL: `https://business.facebook.com/settings/security`
   * Portfolio: **Sahil Kumar** (`986055813750158`).
   * Upload Indian business document (GST Certificate, MSME Udyam, or Business PAN).
   * Complete OTP verification.
2. **Submit App Review for `ads_management` & `pages_manage_ads`:**
   * URL: `https://developers.facebook.com/apps/1109938584974243/app-review/requests/`
   * Request **Advanced Access** for `ads_management` and `pages_manage_ads`.
   * Provide the Reviewer URL: `https://smap-ads.onrender.com/reviewer-instructions`
   * Provide test credentials: `test.reviewer@smap-ads.test` / `Reviewer@SMAP2026!`
   * Copy the use-case explanation provided in Section 5 of the guide.
3. **Ensure App Basic Settings are Complete:**
   * Privacy Policy URL: `https://smap-ads.onrender.com/privacy`
   * Terms of Service URL: `https://smap-ads.onrender.com/terms`
   * User Data Deletion URL: `https://smap-ads.onrender.com/data-deletion`
   * Category: **Business and Pages** or **Advertising**

---

### B. What is Currently Waiting for Meta Approval:
1. **Business Verification Approval:** Waiting for Meta's operations team to review the business documentation (typically 24–48 business hours).
2. **App Review Approval for `ads_management`:** Waiting for Meta's reviewer team to test the submission and approve Advanced Access.
3. **App Review Approval for `pages_manage_ads`:** Waiting for Meta's reviewer team to approve Advanced Access.
4. **App Mode Switch:** Waiting to toggle from **Development** to **Live** mode once approvals are granted.
5. **Render Live Flag:** Only after Meta approvals are confirmed in the Meta dashboard, set `META_LIVE_SUBMISSIONS_ENABLED=true` in Render.
