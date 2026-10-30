# Panel Clinic Finder: How to Use It

**The problem it solves:** Clients can't quickly find the right Great Eastern panel clinic for a medical exam or a TGJ visit, so they end up contacting you.
**The fix:** Clients open one link, pick their area and the tests on their exam letter, and see matching clinics with the address, phone, hours and a map. You get a private tracker that prepares the 3-day and 1-day reminders in English and 中文.

Clinic data:
- **Medical exam (new policy):** 528 panel clinics from GE e-Partner (Panel Doctor Listing), captured on **30 Oct 2026**.
- **TGJ visit (The Great Journey):** 1,045 clinics from the GE TGJ Panel Clinic list dated **22 Sep 2025**.

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
2. Tap **Medical exam** (new policy) or **TGJ visit (The Great Journey)**.
3. Tap **📍 Near me** to sort every clinic by distance from where they are standing. The phone asks for location permission the first time. Or pick the **state** and **area**, or type a town or postcode, for example "Bayan Lepas" or "11900".
4. Medical exam only: tap **Filter by tests on your exam letter**, then tap each test on the letter, for example *Blood & urine test*, *ECG*, *Chest X-ray*. Only clinics that do **all** the selected tests stay on the list. The TGJ list has no test details.
5. On each clinic:
   - **Directions** lets the client choose **Waze** or **Google Maps**, then starts navigation to the clinic. If the chosen app isn't installed, its website opens.
   - **Photos** opens the clinic on Google Maps, with its photos, reviews and street view.
   - **Call** books an appointment.
   - **Download list** saves the filtered list (with distances, if Near me is on).
6. They can switch between **EN / 中文** at the top.

**About the distances:** they are straight-line distances to the centre of the clinic's **postcode**, so they're marked **≈**. In town that's usually within 1–2 km, but in rural postcodes it can be further off. Use **Directions** for the real route and driving time. 27 clinics (6 medical exam, 21 TGJ) have no usable postcode in the source list (for example some Terengganu addresses), so they show "distance unknown" and appear at the end of a Near me list.

**About photos:** neither GE list includes clinic photos, and copying Google's photos into the app isn't allowed, so the **Photos** button opens each clinic's own Google Maps page instead.

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

- **TGJ clinic list:** taken from the PDF *Great Eastern TGJ Panel Clinic 22-september-2025*. It has no opening hours, so clinics show "Call to confirm". 32 clinics whose town isn't clear in the address are grouped under **Other**. They can still be found by search or Near me. To update it, send Claude the newer PDF.
- **Tracker:** choose **TGJ visit (The Great Journey)** as the purpose and pick a clinic marked TGJ. The tracker warns you if the clinic is on the wrong list.
- **Data checks:** *P3020 Medic Clinic (KL)* has no hours on e-Partner, so the app shows "Call to confirm". *P1022 "Reimbursement of Medical Fees"* is a placeholder entry, not a clinic, so it's left out.
- **Privacy:** the pages ask Google and other search engines not to list them (noindex). Anyone with the link can still open it. The page says clearly that it is **not an official Great Eastern website**.
- **Compliance:** please confirm with your agency manager or GE compliance that sharing this panel list with clients is allowed.
- **Offline file:** `dist/GE-Panel-Clinic-Finder-offline-2026-10-30.html` is the same client finder in one file. Send it on WhatsApp, and it opens in any phone browser without internet.
