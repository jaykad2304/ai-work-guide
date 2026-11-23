# White-Label Base Platform: Plan

Status: approved (2026-11-23). Decisions:
1. One deployment per client.
2. Razorpay is the default payment gateway.
3. App-store accounts: support both client-owned and our-account-then-transfer. Client-owned is the default.
4. The prototype gets a client switch that shows each client's name, colours and enabled features.

Implementation of the switch is in `prototype/index.html` (sample clients A, B and C, with placeholder names).

## Intent
Build one base EV charging platform once, then produce a branded version for each client (for example, "Client X EV"). Each client gets its own app name, logo, colours, languages, tariffs, payment options and features, without us rewriting the code.

## Model: one codebase, configured per client
- **Shared base (our code):** customer mobile app, ad-hoc web charging page, admin portal, backend services, OCPP gateway. Identical for every client.
- **Client configuration (a single file per client):** everything that changes between clients. The build reads this file to produce the branded app, portal and backend settings.
- **Per-client deployment:** each client runs in its own cloud project and gets its own app store listing. This matches the brochure ("hosted on the client's ownership", "in your own Apple Developer and Google Play accounts").

## What lives in the client configuration
| Area | Example for one client |
|---|---|
| Identity | Display name "Client X EV", app ID, support email, support phone |
| Branding | Logo, app icon, splash screen, primary and accent colours, fonts |
| Languages | English, Hindi, Marathi (enabled list and default) |
| Region | Country, currency (₹), tax rule (GST 18%), time zone, data region |
| Tariffs | Default rate, time-of-day rates, idle fee, reservation fee |
| Payments | Gateway (for example Razorpay or Stripe), UPI, card, net banking, wallet on or off |
| Features | Each module on or off: wallet, reservations, fault reporting, fleet, roaming, partner settlement |
| Notifications | SMS and email provider, sender names, templates |
| Legal | Terms of service and privacy text links, data retention period, grievance officer contact |

## Rules we follow
1. **No client name hard-coded** in shared code. Every name, colour and string comes from configuration or the translation files.
2. **Features are switched, not forked.** A client who does not buy fleet management gets it switched off, not a separate codebase.
3. **Our brand is not shown.** The base carries a neutral placeholder name. The brochure's "Evoltsoft" name and logo never appear in a client build.
4. **Secrets are never in the configuration file.** Payment keys and API credentials are stored in the cloud's secret manager, per client.
5. **Every change to a client's configuration is logged** in the admin audit log.

## Onboarding a new client (the process)
1. Client fills in a short intake form (name, logo, colours, languages, country, tariffs, payment gateway, features).
2. We create the client's configuration file from the template.
3. The build generates the branded app and admin portal, with the client's name and logo.
4. We deploy to the client's cloud project and submit the app to the stores under the client's accounts.
5. We run the acceptance checklist (from the draft spec) against the client's configuration.
6. Client signs off. Later changes go through the same configuration process.

## Options I considered
1. **One codebase, one deployment per client (recommended now).** Simple to reason about, easy to hand over, and fits the brochure's hosting model. Downside: each client adds some cloud cost and operations work.
2. **Multi-tenant SaaS, one shared deployment with tenant IDs.** Cheaper per client at scale, but client data is mixed in one system, which many charging operators will not accept, and it is much more complex to build. Consider it only after we have several clients.
3. **Separate forked codebase per client.** Quick for the first client, but every fix must be repeated for every client. Rejected.

## Phases
- **Phase 0 (now):** approve this plan and the decisions below. Update the prototype so the client's name, logo and colours come from one config file, which proves the model.
- **Phase 1:** architecture, database schema (client config stored per tenant), and the template configuration file.
- **Phase 2 onward:** build the modules from the MVP plan (phases 2–5 of the draft spec), reading all settings from the configuration.
- **Final phase:** build pipeline that generates a branded app and portal from a client file, and deployment scripts for a new client.

## Decisions I need from you
1. Approve **one codebase with one deployment per client** (option 1), or do you expect many small clients soon, which would favour option 2?
2. Which payment gateway should the template default to? (Razorpay is common in India for UPI and cards; Stripe is common internationally.)
3. Will the client own the app store accounts (as the brochure suggests), or will we publish under our account and transfer later?
4. Should the prototype be updated to show a **client name switch** (for example, pick "Client X" and see its name, logo and colours), so the client can see the white-label idea in the demo?

## Open risks
- Each client's charger hardware and OCPP version must be checked before its deployment (see the draft spec).
- App store approval for a branded app can take days. Plan for it in the timeline.
- Trademark: the client's chosen brand name must be checked for conflicts before we use it in store listings.
