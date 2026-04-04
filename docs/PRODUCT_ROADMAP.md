# SMARTIES — Product roadmap

**Purpose:** Single canonical roadmap for SMARTIES so product, engineering, partners, and operations share the same phase boundaries, outcomes, and traceability to deeper specs.  
**Owner (architecture / structure):** FORREST (CTO, APEX). **Execution:** consulting implementation team per `docs/MVP_TECHNICAL_DELIVERY_PLAN.md`.  
**Last updated:** 2026-04-04

---

## Canonical references (read these first)

| Artifact | Role |
|----------|------|
| [MVP technical & delivery plan](./MVP_TECHNICAL_DELIVERY_PLAN.md) | Phase 1 scope, NFRs, milestones M0–M5, definition of done, RAID handoff |
| [Partner MVP narrative](./PARTNER_MVP_NARRATIVE.md) | Executive-facing scope, differentiation, privacy story, partnership framing |
| [.kiro/steering/product.md](../.kiro/steering/product.md) | Domain rules, restriction taxonomy, UX principles, phased feature intent |
| [.kiro/steering/tech.md](../.kiro/steering/tech.md) | Stack, integration, quality bar (with other `.kiro/steering/*` strategy docs) |
| [.kiro/specs/](../.kiro/specs/) | Feature-level requirements, design, tasks, and test plans (numbered specs) |
| [CONTENT_STRATEGY.md](./CONTENT_STRATEGY.md) | GTM voice, channels, partner types (cross-links to narrative where relevant) |
| [CI_CD_SETUP.md](./CI_CD_SETUP.md) | Build/test pipeline expectations (must stay aligned with MAUI reality) |

---

## North-star outcomes (company charter)

These are the outcomes the SMARTIES **project description** and MVP plan align on; they do not change between Phase 1 and Phase 2.

1. **Trust on severe allergies** — Design for **zero tolerated false negatives** when product data supports a deterministic match; **yellow** when data is incomplete or ambiguous; never silent “safe” when safety cannot be established offline for severe allergens.
2. **Speed** — **~3 seconds median** scan-to-result on a reference mid-range Android device on Wi‑Fi; bounded degradation offline.
3. **Clarity** — Consistent **red / yellow / green** with plain-language rationale and source attribution (ingredients vs “may contain”, etc.).
4. **Responsible delivery** — Privacy-by-design local profile handling, minimal PII, GDPR-style controls as requirements; **accessibility** (TalkBack-first on Android; WCAG-minded UI; not color-only RYG).

---

## Phase 1 vs Phase 2 (scope boundary)

### Phase 1 — Credible MVP (store-ready Android)

**Theme:** UPC-first scan → trusted compliance signal → repeatable offline behavior.

| Theme | What “done” means (summary) | Spec / plan anchors |
|-------|------------------------------|---------------------|
| **Scan** | Camera permission, scan UX, valid/invalid barcode handling | `.kiro/specs/07-google-mlkit-barcode-scanning/`, `.kiro/specs/09-zxing-barcode-scanning/`, MVP plan §2.1 |
| **Product data** | Primary catalog lookup (Open Food Facts family), caching, graceful errors | `.kiro/specs/03-open-food-facts-integration/`, MVP plan §4 |
| **Compliance engine** | Deterministic rules first; RYG semantics; severe-allergen non-regression tests | `.kiro/specs/01-core-architecture/`, MVP plan §3.2–3.3 |
| **Profile** | Restrictions taxonomy, persistence, edit/delete, encryption at rest | `.kiro/specs/05-enhanced-profile-screen/`, `.kiro/specs/18-profile-selection-screen/`, steering `product.md` |
| **Offline-first core** | Cached evaluation where possible; explicit yellow when verification impossible; no silent green for severe unknowns | `.kiro/specs/06-error-handling-offline-resilience/`, MVP plan §4 |
| **History & favorites** | Save scans, lists, basic management | MVP plan §2.1; related UI specs under `.kiro/specs/` |
| **Quality bar** | CI green, Android release-capable artifact, a11y pass on core flows | `.kiro/specs/12-comprehensive-testing/`, `.github/workflows/ci.yml`, MVP plan §6–7 |

**Explicitly out of scope for Phase 1** (Phase 2 placeholders — not MVP commitments):

- Package / **label image recognition** when barcode fails  
- **Stronger AI** depth beyond agreed MVP prompts/rules (must stay off critical path for severe allergens)  
- **Family / multi-user profiles** at full parity (skeleton in repo is gated until Phase 2 unless executive elevation)  
- **iOS App Store release** (unless executive decision elevates iOS to MVP; then TFMs, signing, CI matrix must follow)

### Phase 2 — Resilience in the aisle + depth

**Theme:** When the barcode fails, the product still helps; profiles and intelligence mature.

| Theme | Intent | Dependencies |
|-------|--------|--------------|
| **Image / label recognition** | Fallback path when UPC missing or unscannable | Model/data strategy, latency budget, safety gating (yellow-first) |
| **AI depth** | Richer explanation where safe; still rule-first for severe allergens | Provider contracts, offline fallback, evaluation harness |
| **Family / multi-user** | Households, switching profiles, policy per MVP plan | Data model, UX, encryption boundaries |
| **iOS release** (if not pulled into Phase 1) | Parity with Android where required | Apple signing, CI, store compliance |
| **Retail / brand integrations** | Deferred until data pipeline and legal posture stable | Partner narrative §6 |

### Phase 3 (directional — not committed)

Steering `product.md` describes **prepared foods / meals / restaurants** as a later horizon. No delivery commitments until Phase 2 outcomes are stable.

---

## Major dependencies (cross-cutting)

| Dependency | Why it matters | Typical owner |
|------------|----------------|---------------|
| **Open Food Facts (or agreed catalog)** | Availability, terms, rate limits, attribution | Product + engineering + legal review |
| **Optional LLM provider** | Keys, DPA, offline fallback | Engineering + counsel |
| **Android signing & Play** | Reproducible signed builds, tracks | Engineering / release |
| **Legal / medical-adjacent copy** | Disclaimers, label primacy, in-app surfacing | Product + counsel; engineering implements |
| **Reference devices** | Evidence for ~3s and p95 claims | Engineering + VALOR (schedule) |
| **Docs accuracy** | Avoid partner mistrust (e.g. stack drift) | CTO office + IC (CI/CD docs vs MAUI) |

Coordinate **milestones and dates** with **VALOR / VICTOR**; escalate scope conflict to **PHOEBE (CEO)** with one recommended option per MVP plan.

---

## How we decide “done” per phase

### Phase 1 (MVP) — definition of done

Phase 1 is **done** when **all** of the following are true (mirrors `docs/MVP_TECHNICAL_DELIVERY_PLAN.md` §7):

1. **Functional:** UPC scan, profile, offline behaviors per MVP plan §4, favorites/history, RYG with rationale.  
2. **Safety tests:** Automated coverage for severe-allergen **non-regression** cases agreed with product.  
3. **Performance:** Median scan-to-result ~3s on reference Android; **documented measurement method** (instrumentation / harness).  
4. **Privacy:** Encrypted local profile; privacy notes accurate in-app; **no secrets in source**.  
5. **Accessibility:** TalkBack walkthrough passes on **core flows** (scan, result, profile).  
6. **Release engineering:** Signed Android build **reproducible** from CI/docs; versioned artifacts.  
7. **Phase 2 boundary:** Written placeholder scope (out-of-scope list) **accepted by stakeholders**.

### Phase 2 — definition of done (high level)

Phase 2 is **done** when, for each committed Phase 2 theme, there are: signed UX for the fallback path, measurable safety/latency targets, ship checklist parity with Phase 1 (privacy, a11y, CI), and explicit **go/no-go** for any AI-on-critical-path experiments (default: **no** for severe allergens).

---

## Paperclip / program traceability

- **Parent initiative:** LIE-229 (Product roadmap).  
- **Roadmap authoring:** LIE-230.  
- **Related delivered artifacts:** LIE-227 (MVP technical plan), LIE-228 (partner narrative), LIE-224 (content strategy), LIE-210 (codebase inventory).  
- **Ongoing program items:** LIE-226 (project plan), LIE-223 (content strategy execution) — align dates and RAID with this doc.

New backlog items spawned from this roadmap are children of **LIE-229** unless otherwise noted; each description references **LIE-230** and this file path.

---

## Document control

| Version | Date | Author |
|---------|------|--------|
| 1.0 | 2026-04-04 | FORREST (CTO) — APEX |

**Path in repo:** `docs/PRODUCT_ROADMAP.md`
