# Plumber R We

A responsive single-page web app using HTML, CSS and JavaScript on classic Firebase Hosting. No framework or build step is required.

## Local development

Use Node.js 22 or newer:

```sh
npm start
npm run check
npm test
```

Preview at http://127.0.0.1:5000. The local server supports single-page route fallback. It intentionally does not emulate Firestore or supply Firebase configuration; local quote submissions show a recoverable error and retain the entered details.

## Firebase configuration

`firebase.json` serves `public/index.html` for application routes. Old `/thank-you` links redirect to the quote section; successful submissions now display confirmation within the form. Hosting response headers prevent framing and content sniffing, and allow asset cache updates without a build pipeline.

The quote form fetches `/__/firebase/init.json` from Firebase Hosting when submitted. Register a Firebase web app in the deployed project so Hosting can supply that configuration. The form then creates a document in `leads`; a success message appears only after Firestore acknowledges the write. The application does not send email notifications or provide an admin inbox.

The repository's default project alias remains `plumber-r-we`. The canonical URL and business content still contain `plumber-r-we-87724` and placeholder details, as requested. Confirm the actual project before deployment; runtime database configuration follows the project where Hosting is deployed.

For a Firebase Hosting preview, use an installed Firebase CLI:

```sh
firebase emulators:start --only hosting
firebase hosting:channel:deploy review --project YOUR_PROJECT_ID
```

Deploy when ready:

```sh
firebase deploy --only hosting --project YOUR_PROJECT_ID
```

A Git push does not deploy this site unless deployment automation has been configured separately. Firestore must already be provisioned with appropriate rules; a Hosting-only deployment does not deploy rules.

## Evaluation and remaining launch work

The existing static architecture fits this small business website. The original form contained nonfunctional Firebase credentials, used fragile named form properties, omitted optional-email validation, and navigated to a second HTML page after submission. These issues are corrected. Mobile navigation, error announcements, input limits, keyboard focus, reduced-motion support, a local preview server and submission regression checks are included.

Business phone numbers, email, images, reviews, registration details, claims and canonical metadata remain placeholders for owner review. Missing privacy and terms links have been removed until actual policies are supplied. Review the consent wording and provide policies before collecting real customer information.

Existing Firestore rules are unchanged. They restrict reads but accept public writes with only minimal name/phone checks. Before production use, harden the complete lead schema and limits, add abuse protection such as App Check or a protected backend, and test rules with the Firestore emulator. The browser honeypot alone is not abuse protection. Confirm a secure process for retrieving and responding to leads, including retention and deletion.

`npm test` uses a mocked database to verify validation, success, failure, duplicate submission prevention and static routing references. A real Firestore submission still needs to be performed in a configured Firebase preview; the visual browser checks are described below.

## Visual redesign

The site uses an ivory, deep navy, sage and citrus palette with an arched hero photograph, bespoke SVG line icons, an eight-service catalogue, dark feature panel, four-step process, regional contour decorations, and a responsive enquiry form. Service-card links preselect the matching enquiry service. Entrance animations and interaction transitions respect reduced-motion preferences.

Placeholder review cards have been removed pending verified customer reviews. Existing business contact and registration placeholders remain.

### Generated hero asset

`public/images/bathroom-concept.png` was generated with the built-in image generation tool. It is conceptual renovation inspiration, not a photograph of a completed customer project. The image is stored in this repository and needs no external image service.

Final generation prompt:

> Use case: photorealistic-natural. Asset type: hero photograph for a premium local plumbing service website. Create a portrait-oriented editorial architectural photograph of an exceptionally beautiful modern bathroom in a Cape Winelands home, warm ivory travertine wall tiles, deep navy blue floating vanity cabinet, brushed brass single faucet with a graceful curved spout above a clean white vessel basin, elegant arched mirror, soft golden morning light entering from the left, one restrained olive branch in a ceramic vase, shower visible behind glass in background. Natural believable materials, tactile stone, sophisticated design magazine photography, full scene with basin and faucet as focal point in middle, no people. Composition for a tall 4:5 website photo card. No text, logos, watermark, UI or graphic overlays. It is conceptual design imagery and not a customer project.

Browser checks covered widths of 320, 390, 768 and 1440 pixels with no horizontal overflow. The hero image loaded, mobile menu opened and closed, and a service-card click selected Blocked Drains in the quote form. No browser console errors were recorded during these checks.

## Site-wide motion

`public/js/motion.js` coordinates native Web Animations API transitions, staggered scroll entrances, reversible menu and FAQ height animation, button ripples, pointer-driven service cards, gentle hero image movement and a scroll progress indicator. CSS provides drifting accents, flowing lines, rotating ribbon details, softly floating hero cards, shifting headline colour and form feedback. There is no animation CDN, framework dependency or build step.

Motion defaults to the device's reduced-motion preference. The footer's Animations button provides an explicit opt-in even when the device requests reduced motion, and can pause animations at any time. The choice is saved locally. Disabling motion cancels active effects and completes disclosures immediately; the content remains available when motion or animation APIs are unavailable. Touch devices retain native scrolling and do not receive mouse pointer effects.

The motion preview was checked on desktop and mobile, including rapid menu/FAQ open-close reversals, keyboard Escape, pause/resume, persisted preference after reload, and initial reduced-motion behavior. The new module is included in `npm run check`; existing enquiry regression tests remain applicable.
