# Getting Capy on your iPhone (free)

You only do steps 1–4 once. After that, new versions come from step 3 again.

## 1. Laptop and phone setup (one time)

On your **Windows laptop**, install these three. Use the direct downloads from Apple, not the Microsoft Store versions:

1. iTunes: https://www.apple.com/itunes/download/win64
2. iCloud: https://updates.cdn-apple.com/2020/windows/001-39935-20200911-1A70AA56-F448-11EA-8CC0-99D41950005E/iCloudSetup.exe
3. AltServer: https://cdn.altstore.io/file/altstore/altinstaller.zip (unzip it, then run `Setup.exe`)

Then:

- Connect your iPhone to the laptop with a cable, unlock the phone, and tap **Trust**.
- Open iTunes, sign in with your Apple ID, click the phone icon, and turn on **Sync with this iPhone over Wi-Fi**.
- Start **AltServer** as administrator (search "AltServer" in the Start menu → right-click → Run as administrator). Allow it through the firewall if Windows asks.
- Click the AltServer icon near the clock → **Install AltStore** → pick your iPhone → enter your Apple ID.
- On the iPhone:
  - Go to **Settings → General → VPN & Device Management**, tap your Apple ID, then tap **Trust**.
  - Go to **Settings → Privacy & Security → Developer Mode**, turn it on, and let the phone restart.

Stuck? AltStore's guide has screenshots: https://faq.altstore.io/altstore-classic/how-to-install-altstore-windows

## 2. Put the code on GitHub (one time)

GitHub builds the iPhone app for free on its Mac computers.

1. Open **GitHub Desktop** → **File → Add local repository** → choose this folder (`Expense tracker app`).
2. Click **Publish repository**. Name it `capy`.
3. **Untick "Keep this code private".** Public repos get unlimited free Mac build time. Your expenses never go to GitHub; they stay on your phone.

## 3. Download the app file

1. On github.com, open your `capy` repo → **Actions** tab → **Build iPhone app**.
2. Wait for the newest run to get a green tick. It takes about 15–25 minutes.
   - It starts on its own every time new code is pushed.
   - You can also start it by hand with **Run workflow**.
3. Open that run → under **Artifacts**, download **Capy-ipa** → unzip it to get `Capy.ipa`.

## 4. Install it on your iPhone

1. Save `Capy.ipa` into **iCloud Drive** from your laptop, so the phone can see it.
2. On the iPhone, open **AltStore** → **My Apps** → **+** → pick `Capy.ipa`.
   - Your laptop needs to be on the same Wi-Fi with AltServer running.
3. Open Capy, tap **Tell Capy an expense**, and allow the microphone and speech recognition.

## 5. Make Back Tap and Siri open Capy

1. Open the **Shortcuts** app → **+** → **Add Action** → search for **Open URLs**.
2. Type `capy://listen` as the URL.
3. Rename the shortcut to **Log expense** (tap the name at the top).
4. Go to **Settings → Accessibility → Touch → Back Tap → Double Tap** and choose **Log expense**.

Now double-tapping the back of your phone opens Capy listening, from any app. Saying **"Hey Siri, log expense"** works too. The first time, iPhone may ask whether the shortcut can open Capy. Choose **Always Allow**.

After saving, tap the **◀ WhatsApp** (or other app) link at the top-left corner to jump back to where you were.

## Keeping it working (every week)

Apps installed with a free Apple ID expire after **7 days**. To keep Capy working:

- Leave **AltServer running** on your laptop. AltStore then refreshes Capy by itself when the phone and laptop are on the same Wi-Fi.
- If Capy ever won't open, open **AltStore → My Apps → Refresh All**.

Your saved expenses are kept through refreshes and updates.

## Things to try saying

- "chai with Rohit 40"
- "uber 180 to office"
- "paid 1.5k for electricity bill"
- "two fifty on coffee"
- "netflix 649"

If the category is wrong, tap the category on the summary card to change it before saving.
