# Babykelo — portfolio

Portfolio for **Aramogho Oghenekevwe Samuel (Babykelo)**, a drummer, producer, music director, live arranger and mix engineer.

## Run it
Double-click `start.bat`, or run `python -m http.server 5173` in this folder and open http://localhost:5173.
(It has to be served over http, because browsers block ES modules and YouTube embeds on `file://`.)

## Pages
- `index.html` — the main site: 3D stage, story, photo frames, craft, journey, video vault (152 videos), playable kit
- `contact.html` — **Work with Babykelo**: remote studio sessions (worldwide), services, booking form, press kit

## Turn on email / WhatsApp bookings
Open `js/contact.js` and fill in the top block:

```js
export const BOOKING = {
  email: 'bookings@example.com',   // shows "Send by email"
  whatsapp: '2348012345678',       // digits only, with country code; shows "Send on WhatsApp"
  instagram: 'babykelo',
};
```
Until those are filled in, the booking form copies the message and opens an Instagram DM to @babykelo.

## Files
- `assets/logo.svg`, `assets/mark.svg` — his signature wordmark (vector recreation of the handwritten watermark on his videos) and the smiley drumhead mark. If he has an official logo file, replace these, and also `js/logo.js`.
- `js/scene.js` — Three.js stage: kit, riser, light beams, haze. It lowers its own quality on slow devices.
- `js/audio.js` — groove engine, the site soundtrack (Afro Pocket, Highlife, Kompa, Praise Break, Gospel Shed, Amapiano) with fills and ghost notes, all synthesised live
- `js/data.js` — video catalogue. Add new videos to `VIDEOS`.
- `js/main.js`, `js/contact.js` — page interactions
