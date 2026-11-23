# EV Charging Platform: Clickable Prototype Design

Status: approved in conversation (user said "Everything, lets go"). Prototype only; no backend.

## Intent
Show the client what the finished platform will look and feel like before we build the real system. The client should be able to click through the customer app, the ad-hoc web charging page, and the admin portal, and understand the business flow.

## Goals
- Clickable customer mobile app (phone-sized frame) covering all customer features in the draft spec (FR-001 to FR-008) plus the additions agreed in conversation.
- Clickable admin portal covering FR-009 to FR-018 plus the agreed additions.
- Clickable ad-hoc web charging page (FR-008).
- Mock data only. Every screen should look real.

## Non-goals
- No real authentication, payments, OCPP, or database.
- No production code. The prototype is throwaway; the real app is built in the MVP phases.
- Not a pixel copy of the Evoltsoft brochure. Brand colours and logo are placeholders until the client supplies them.

## Scope additions (beyond the brochure)
Included in the prototype, all of them, as agreed:
- Customer: report a faulty charger (photo and ticket number); push and email notifications; multi-language selector; pay-before-charge cost estimate.
- Admin: fault and maintenance tickets with technician assignment; firmware update scheduling; price-change history.
- Platform and compliance: consent and data-privacy screen; country tax rules shown on invoices.
- Later roadmap, shown only as "coming later" labels: loyalty points, subscription passes, CO2-saved report.

## Approaches considered
1. Clickable HTML in one file (chosen). Opens in a browser, easy to share, and easy to turn into the Flutter screens later.
2. PPT only. Quicker but not clickable, so the client can't feel the flow.
3. Figma mockups. Good design quality but needs a separate tool and a designer's time.

## Calls I made (not specified by the user)
- Prototype is a single self-contained HTML file with no external dependencies.
- Charging flow uses simulated time (a timer, not a real charger).
- Currency is INR (₹) with Indian digit grouping and 18% GST. The business is in India.
- Customer app is available in English, Hindi and Marathi (language switch on login and in Profile). The admin portal stays in English for staff.
- Privacy screens reference India's Digital Personal Data Protection Act, 2023. Exact obligations need confirmation from the client's legal advisers.
- Payment options shown: UPI, card and net banking.
- Sample station names are generic.

## Deliverables
- `prototype/index.html`: the clickable prototype.
- A PPT deck summarising the flow, to follow once the HTML prototype is reviewed.

## Open questions for the client (carried from the draft spec)
Charger hardware, OCPP version, payment model (wallet vs direct), country and currency, Android-first or both platforms.
