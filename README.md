# OutreachAI

A Chrome extension (Manifest V3) that drafts a personalized LinkedIn connection request message from the profile you are viewing.

## What it does

- Adds a **Write with AI** button to LinkedIn profile pages (`https://www.linkedin.com/in/*`).
- When clicked, reads the person's **name, headline/title, company and About** section from the page.
- Sends that information to the **Groq API** using the `llama-3.3-70b-versatile` model and generates **one** personalized message (max. 3 sentences, written in the language of the profile).
- Shows the message in an **editable text area**, so you can adjust it before using it.
- **Copy** button copies the (edited) text to the clipboard in one click.

## Installation

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select the project folder.

## Setup

1. Get a Groq API key from [console.groq.com/keys](https://console.groq.com/keys).
2. Click the OutreachAI icon in the Chrome toolbar.
3. Paste your key (it must start with `gsk_`) and click **Kaydet** (Save). The popup UI is in Turkish.
4. The key is stored in `chrome.storage.local` in your browser.

## Usage

1. Open a LinkedIn profile (`https://www.linkedin.com/in/...`).
2. Click **Write with AI** in the bottom-right corner.
3. Edit the generated message if needed, then click **Copy**.

## Permissions

| Permission | Why |
|---|---|
| `storage` | Save your Groq API key locally |
| `activeTab` | Declared in the manifest |
| `https://www.linkedin.com/*` | Run on LinkedIn profile pages |

## Privacy

- To generate a message, the profile's name, title, company and About text are sent to the Groq API.
- Your API key is stored only in your own browser (`chrome.storage.local`). It is not part of this repository and is not sent anywhere except to the Groq API as the request's authorization header.
- The extension has no backend server of its own.

## Notes

- Automating or assisting activity on LinkedIn may be subject to LinkedIn's User Agreement. Evaluating whether your use complies is your own responsibility.
- This extension is intended for personal and educational use.

## Known limitations

- The company and About selectors depend on LinkedIn's page structure; if LinkedIn changes its markup, these fields may come back empty.
- Generates a single message per click; there is no "regenerate" or multiple-suggestion option.
- The only setting is the API key (no tone, length or language options).
- LinkedIn is a single-page app: if you navigate to a profile from another LinkedIn page (e.g. the feed), the button may not appear until you reload the page.
- Not published on the Chrome Web Store.

## Screenshots

Screenshots will be added to the [`docs/`](docs/) folder.

## License

[MIT](LICENSE) © 2026 Esra Bilgiz
