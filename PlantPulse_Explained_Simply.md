# PlantPulse: the whole project, in very simple words

## Want to try PlantPulse?

**Open the live app here:** [https://plant-pulse-one.vercel.app/](https://plant-pulse-one.vercel.app/)

On an Android phone, open that link in Chrome. If Chrome offers **Install app**
or **Add to Home screen**, choose it to put PlantPulse on the phone like an
app. This is an installable website, not a bookmark and not an APK download.
You can still use the website without installing it.

## The tiny version

PlantPulse is a helper for people growing cassava. You give it a picture of a
cassava leaf. A computer model looks at the picture and suggests what the leaf
looks most like. The app then shows simple information that may help you decide
what to do next.

**PlantPulse can make mistakes. It is not a plant doctor, laboratory test, or
replacement for a trained agricultural worker.**

## What is inside this guide?

- How to use PlantPulse
- What happens to a leaf picture
- What the result means (and does not mean)
- What information stays on the phone
- How the website works without internet
- The difference between installing the website and downloading an Android app
- What the project folders and computer words mean
- How a developer runs, builds, and publishes the project
- Important limits and model test results

## 1. How to use PlantPulse

### First, open it

You can open PlantPulse in a phone or computer web browser. The home page has
buttons for starting a leaf check, choosing a photo, and opening other parts of
the app. The first time, it also shows a short welcome and introduction.

PlantPulse is made for **cassava leaves**. Please do not use its result as an
answer about a different crop.

### Then, take or choose a picture

1. Tap **Scan a Plant** or **Scan**.
2. Tap **Open camera** to take a new picture, or **Choose photo** to pick one
   already on the phone or computer.
3. If asked, allow the browser to use the camera. You can say no and choose a
   picture instead.
4. Look at the preview. If it is not a good picture, choose another one.
5. Tap **Use this photo** to start the check.

The picture must be an image and no bigger than **25 MB**. The app can resize a
large picture to make it easier for the model to read. A clear picture of one
leaf, in daylight, usually gives the model a better chance. Try to keep the
leaf still and the affected part in focus. Avoid blur, deep shadows, and very
dark pictures.

Camera access usually needs a secure website address beginning with `https://`.
It also works on `localhost` when a developer is testing on their own computer.
If the camera will not open, use the picture chooser.

### Read the result

PlantPulse shows the model's best match and may show two other possible
matches. It can also show:

- A short explanation and signs to look for
- General things to consider doing next
- Ways to help prevent problems
- When to ask an agricultural expert
- Buttons to save or share the result, or hear advice read aloud if the device
  supports it

If the best match has a score below the app's chosen cutoff, PlantPulse says
**“Not sure.”** That means the app is not showing the possible disease as a
clear answer. It does **not** prove the leaf is healthy.

To keep a result, tap **Save**. You can find it later under **My Scans**. You
can open it again or delete it. Saving keeps a small picture preview and
information about the result on that device; it does not save the original
full-size photo as scan history.

## 2. What happens to the picture?

Imagine the model as a student comparing your leaf picture with examples it
learned from:

1. The app opens the picture on your device.
2. It makes a smaller working copy so the model can read it.
3. The model compares the picture with the kinds of cassava leaves it knows.
4. It gives a score to each possible match.
5. The app sorts the scores and shows the closest matches.
6. If you choose **Save**, the app keeps the result and a small picture preview
   in storage on that device.

The picture is checked on the device. PlantPulse does not send the photo to a
PlantPulse diagnosis server. PlantPulse has no sign-in account or online
PlantPulse scan database.

## 3. What the model knows

The PlantPulse app's current model has five possible answers:

| Short name used by the computer | Name shown in the guide |
|---|---|
| `cbb` | Cassava Bacterial Blight |
| `cbsd` | Cassava Brown Streak Disease |
| `cgm` | Cassava Green Mottle |
| `cmd` | Cassava Mosaic Disease |
| `healthy` | Healthy-looking Cassava |

These are the model's choices, not a complete list of everything that can
happen to cassava. A leaf may have a different problem, or more than one
problem. The model may still choose one of the five answers even when the
picture is unusual.

### A score is not a promise

A score such as `80%` is the computer model's score for one match. It is **not**
a guarantee that the match is right, and it is not necessarily an 80-in-100
chance that the answer is correct. The app uses a cutoff to show **“Not sure”**
for some low-scoring pictures, but that cannot catch every mistake.

Use the result as a learning clue, not as the only reason to treat, remove, or
sell a plant. Ask a local agricultural extension worker or agronomist if many
plants are affected, the problem is spreading, the result is unclear, or a
decision could cost you money.

### What the saved test numbers mean

The project README records one test of the cassava model using **1,885 test
pictures**. The recorded accuracy was **70.98%**. In simple words, on that
particular group of test pictures, about 71 out of every 100 were given the
matching label.

This is a computer test, not a promise about what will happen in a real field.
Phone cameras, light, leaf age, cassava variety, location, and the way a leaf
is photographed can all change the result. A test score cannot tell us exactly
how well a new picture from your farm will work.

## 4. The screens, like rooms in a house

| Room | What it is for |
|---|---|
| **Home** | Start a check or go to another part of PlantPulse. |
| **Scan** | Take a picture or choose one. |
| **Analyzing** | Wait while the device checks the picture. |
| **Result** | Read the best match, other possibilities, and guidance. |
| **My Scans** | Reopen or delete results you chose to save. |
| **Disease Guide** | Search and read the cassava information pages. |
| **Help** | Read photo tips and reminders about what the app can do. |
| **Settings** | Choose English or Luganda, make writing larger, or clear saved scans. |
| **About** | See whether the model is ready, whether the device is online, and
  other status information. |

On a small screen, the main buttons are along the bottom. On a large screen,
they are along the top.

## 5. What stays on the phone or computer?

- The photo is read and checked on the device; it is not sent to a PlantPulse
  diagnosis server.
- If you save a scan, its small preview and result details go into the
  device's local browser/app storage.
- Your English/Luganda choice and larger-text choice are saved on that device.
- This information does not automatically move to another phone or computer.
- Clearing the browser's site data, clearing app data, or uninstalling the app
  may erase saved scans and settings.

The web app needs an internet connection the first time it downloads its
screens and model files. It does not need a PlantPulse login.

## 6. Using the website without internet

PlantPulse can work offline after the needed files have been downloaded and
saved. To prepare it:

1. Open the website while connected to the internet.
2. Keep it open until it says **Model ready, works offline**.
3. If you want, open the Guide and About pages once too.
4. Then you can try turning off the internet and opening it again.

Offline access is not a promise: a browser or phone can clear saved files to
make room. If the model or app files were not fully saved, a new check may not
work offline.

## 7. Two ways to put PlantPulse on Android

These are different things:

### A. Install from the website

Open [PlantPulse](https://plant-pulse-one.vercel.app/) in Chrome while online.
Use **Install app** or **Add to Home screen** if Chrome offers it. It opens
PlantPulse in an app-like window. This is **not** a bookmark, but it is also
**not** an APK file. The browser manages its updates.

### B. Install a real Android app

A developer can build an Android app from the `android/` project. A signed
**APK** can be shared for installation on Android devices. An **Android App
Bundle** (`.aab`) is normally uploaded to Google Play, which then delivers the
app to phones. These are separate Android releases; they are not made just by
clicking the website's Install button.

The Android app and website are separate installations and get updates
separately. A new web release does not automatically update an already
installed Android release. A real release needs to be built, signed, and
distributed.

## 8. The two model projects in this folder are different

This project folder contains two machine-learning efforts. Do not mix their
model files:

1. **The model used by PlantPulse** is in [`public/model/v2/`](./public/model/v2/).
   It recognizes the five cassava labels listed above. The website and Android
   app use this model.
2. **The experiment** is in
   [`multi_crop_classifier/`](./multi_crop_classifier/). It has separate
   Python tools and experiments for many crop-and-leaf categories. It is not
   the model used by the PlantPulse screens.

There is also a Google Colab notebook in the experiment folder for training a
separate cassava model. Training a model means teaching it from example
pictures. It is different from using the model already inside PlantPulse. If a
developer replaces the app model, the model and its matching label list must
belong together. A mismatched pair can make results wrong or stop the app
working.

## 9. The project parts, without the computer jargon

Think of the project like a little shop:

- **The screens** are the front counter; they are what people tap and read.
- **The model** is a helper in the back that compares pictures.
- **The guide** is the book of explanations and general advice.
- **Local storage** is a drawer in this one device for scans you saved.
- **The build tools** pack the screens, guide, and model into a website or app.

Here are the real names for those pieces:

| Name | In everyday words |
|---|---|
| **React** | Helps put the screens together. |
| **TypeScript** | Helps developers catch some coding mistakes. |
| **Vite** | Runs the website during development and packs the finished website. |
| **TensorFlow.js** | Lets the model check a picture in the web app. |
| **IndexedDB** | A small storage drawer inside a browser for saved scans. |
| **Service worker** | Helps the website open offline after files have been saved. |
| **Progressive Web App (PWA)** | A website that a supported browser can install like an app. |
| **Capacitor** | Wraps the same web screens in an Android app project. |
| **Node.js and npm** | Computer tools used to install the project pieces and run/build the app. |
| **GitHub** | The online home for the project's code and change history. |
| **Vercel** | The web host currently serving the live website. |

## 10. A map of the project folder

| Folder or file | What is inside |
|---|---|
| [`src/pages/`](./src/pages/) | The Home, Scan, Result, Guide, Settings, and other screens. |
| [`src/components/`](./src/components/) | Reusable screen pieces, like navigation and the photo picker. |
| [`src/services/classifier.ts`](./src/services/classifier.ts) | Code that loads the model and asks it to check a picture. |
| [`src/config/model.ts`](./src/config/model.ts) | Model location and picture-size settings. |
| [`src/data/diseases.json`](./src/data/diseases.json) | English disease names and guide information. |
| [`src/i18n/`](./src/i18n/) | Words used in the English and Luganda screens. |
| [`src/lib/database.ts`](./src/lib/database.ts) | Sets up local storage for saved scans. |
| [`src/lib/images.ts`](./src/lib/images.ts) | Checks and resizes pictures and makes small previews. |
| [`src/store/appStore.ts`](./src/store/appStore.ts) | Keeps temporary screen information and language/text settings. |
| [`public/model/v2/`](./public/model/v2/) | The model files and matching labels used by the app. |
| [`public/images/`](./public/images/) | Pictures used to decorate the home page. |
| [`android/`](./android/) | The Android Studio project for making an Android app. |
| [`multi_crop_classifier/`](./multi_crop_classifier/) | Separate Python model experiments; not the live app model. |
| [`package.json`](./package.json) | Project ingredients and commands such as `npm run build`. |
| [`vite.config.ts`](./vite.config.ts) | Website build, offline, and installable-website settings. |
| [`capacitor.config.ts`](./capacitor.config.ts) | The app name and identity used by Capacitor. |
| [`README.md`](./README.md) | Detailed instructions for developers. |

## 11. How a developer runs and publishes the project

This part is for someone working on the code. A normal app user does not need
to do these steps.

### Run the website on a developer's computer

The computer needs Node.js and npm. Open PowerShell in the project folder, then
run:

```powershell
npm install
npm run dev
```

Open the local web address printed by the command. That is a test copy on the
developer's computer, not the public Vercel website.

### Make the finished website

Run:

```powershell
npm run build
```

The finished files are put in the `dist/` folder. A web host publishes those
files so people can visit the site. PlantPulse is currently available at
[https://plant-pulse-one.vercel.app/](https://plant-pulse-one.vercel.app/).
The public website must use HTTPS so browsers can safely install it and allow
camera access.

### Prepare and test the Android project

With Android Studio and the Android tools installed, run:

```powershell
npm run android:sync
npm run android:open
```

The first command builds the website and copies it into the Android project.
The second opens that project in Android Studio. A developer can then test it
on an Android phone or an emulator (a pretend phone on the computer).

Before creating an Android release, the developer must build and sign it. The
private signing key must be kept safe and must **not** be uploaded to GitHub.
For publishing an update, the developer must also increase the Android
version number. If the website or model changes, sync the Android project
again before making its new release.

## 12. The whole project journey, from beginning to end

1. **Choose the job:** Help people learn about possible cassava leaf problems.
2. **Make the screens and words:** Build the Home, Scan, Result, Guide, Help,
   About, and Settings parts in `src/`.
3. **Prepare the model:** Keep the trained cassava model and its matching
   labels in `public/model/v2/`.
4. **Build the website:** Use the project tools to turn the source files into
   finished files in `dist/`.
5. **Put it online:** Publish those finished files on a secure web host. The
   live site is [PlantPulse on Vercel](https://plant-pulse-one.vercel.app/).
6. **Let people use it:** They open the website or install it from their
   browser. A separately built Android app is another way to use it.
7. **Check a leaf:** The device reads the picture, the model suggests matches,
   and the person reads the guidance.
8. **Improve it carefully:** Developers change the screens, words, or model,
   check the result, build again, and publish an update.

## 13. Important things to remember

- PlantPulse is intended for **cassava leaves**, and this app model has five
  possible labels.
- Its answer can be wrong, even when the score looks high.
- Its score is not the same as certainty or a confirmed diagnosis.
- A healthy-looking picture does not prove that the whole plant has no problem.
- A serious, spreading, or unclear problem should be checked with a local
  agricultural expert.
- The photo is checked on the device, not sent to a PlantPulse diagnosis
  server.
- Saved scans are kept on that device and can disappear if its app/browser data
  is cleared or the app is uninstalled.
- The first website visit needs internet. Offline use works only after the
  app and model files have been saved, and a browser can later remove them.
- Installing the website from Chrome is different from downloading an APK.
- The Python multi-crop experiment is separate from the model used by the app.

For extra technical details, deployment steps, troubleshooting, and a manual
checklist, read the project's [`README.md`](./README.md).
