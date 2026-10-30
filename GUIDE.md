# Panel Clinic Finder: How to Use It

**The problem it solves:** Clients can't quickly find the right Great Eastern panel clinic for a medical exam or a TGJ visit, so they end up contacting you.
**The fix:** Clients open one link, pick their area and the tests on their exam letter, and see matching clinics with the address, phone, hours and a map. You get a private tracker that prepares the 3-day and 1-day reminders in English and 中文.

Clinic data: **528 panel clinics** from GE e-Partner (Panel Doctor Listing), captured on **30 Oct 2026**.

---

## 1. Two links, two users

| Link | For | What it does |
|---|---|---|
| https://louisfoo11.github.io/panel-clinic-finder/ | **Clients** | Clinic finder. Filter by state, area, town or postcode, and tests. Download the list as a CSV file (opens in Excel). |
| https://louisfoo11.github.io/panel-clinic-finder/advisor/ | **You only** | Visit tracker and reminders. Client records stay on your phone and are never uploaded. |

Don't send the `/advisor/` link to clients. It wouldn't show them your data, because the records only exist on your phone, but they don't need it.

## 2. Install it on a phone like an app

- **Android (Chrome):** open the link, tap **⋮ → Add to Home screen → Install**.
- **iPhone (Safari):** open the link, tap **Share → Add to Home Screen**.

Once you've opened it, it works offline too.

## 3. What clients do

1. Open the link, or tap the home-screen icon.
2. Tap **Medical exam** (new policy) or **TGJ visit**.
3. Pick the **state** and **area**, or type a town or postcode, for example "Bayan Lepas" or "11900".
4. Tap **Filter by tests on your exam letter**, then tap each test on the letter, for example *Blood & urine test*, *ECG*, *Chest X-ray*. Only clinics that do **all** the selected tests stay on the list.
5. Tap **Map** for directions, or **Call** to book. **Download list** saves the filtered list.
6. They can switch between **EN / 中文** at the top.

## 4. What you do (tracker)

**Add a visit** (takes 30 seconds):
1. Open `/advisor/` and fill in: client name (first name is enough), WhatsApp number, purpose, clinic (start typing and pick from the list), date, time, and tests.
2. Tap **Save visit**. The app shows when the 3-day and 1-day reminders will be due.

**The app protects you from messy data:**
- No date or no clinic → it won't save.
- An IC number in the notes → it won't save. Remove it first.
- A wrong phone number, a date in the past, a clinic not on the panel list, or an appointment less than 3 days away → it shows a warning, and you must tap **Confirm and save**.

**Every morning:** open the tracker. **Reminders due today** lists who needs a message.
1. Tap **Review & send** and check the message. You can edit it.
2. Tap **Open in WhatsApp**. The message is ready in the chat, and **you** press Send.
3. Come back and tap **Mark … as sent**.

**Deleting** always asks you to confirm first. **Download backup (CSV)** now and then, and keep the file safe, because the records live only on that phone.

**To see which client did which tests:** tap **All** in the visit log and search by client name, clinic or test.

## 5. Keeping the clinic list up to date

GE updates the panel list from time to time. To refresh it, ask Claude to "recapture the panel clinic list and push to GitHub". Each push goes live in about a minute. You'll sign in to e-Partner, and the rest is automatic.

## 6. Things to know

- **TGJ clinic list:** e-Partner's panel page only has the new-business medical exam list. Until the TGJ list is added, the **TGJ visit** button tells clients to contact you.
- **Data checks:** *P3020 Medic Clinic (KL)* has no hours on e-Partner, so the app shows "Call to confirm". *P1022 "Reimbursement of Medical Fees"* is a placeholder entry, not a clinic, so it's left out.
- **Privacy:** the pages ask Google and other search engines not to list them (noindex). Anyone with the link can still open it. The page says clearly that it is **not an official Great Eastern website**.
- **Compliance:** please confirm with your agency manager or GE compliance that sharing this panel list with clients is allowed.
- **Offline file:** `dist/GE-Panel-Clinic-Finder-offline-2026-10-30.html` is the same client finder in one file. Send it on WhatsApp, and it opens in any phone browser without internet.
