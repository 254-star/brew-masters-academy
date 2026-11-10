# Brew Masters Coffee Academy website

Plain HTML, CSS and JavaScript. No build step, no frameworks.

## Run it
Open `index.html`, or from this folder run `python3 -m http.server 8000` and visit http://localhost:8000

## Folders
- `index.html`, `css/style.css`, `js/main.js` (menu, scrollspy, programs toggle, form), `js/gallery.js` (gallery, Load More, lightbox)
- `images/logo.jpg`, `images/favicon.png`: the academy logo (not altered)
- `images/client-gallery/large/` and `thumbs/`: WebP copies made from your photos
- `source-photos/`: your original photos (kept untouched; not needed online, do not upload)
- `source-photos/_hold/`: photos left out on purpose (a personal M-Pesa number, third-party phone numbers, another brand's shirt). Move one into `source-photos/` if you decide to use it.
- `tools/photos.json` and `tools/build_gallery.py`: the gallery generator

## Add more photos
1. Copy photos (JPG, PNG, WebP or HEIC) into `source-photos/`.
2. Add an entry for each in `tools/photos.json` (slug and a descriptive alt text).
3. Run `pip install pillow pillow-heif`, then `python3 tools/build_gallery.py`.
It rewrites the gallery section of `index.html` and makes the large and thumbnail copies. Originals are never changed.

## Contact form (free, no server)
1. Go to https://web3forms.com, enter brewmasterscoffeeacademy@gmail.com and get your free access key by email.
2. Open `js/main.js` and paste the key into `WEB3FORMS_KEY` at the top.
3. Upload the site and send a test enquiry. It arrives in that inbox.
Until a key is set, the form checks the fields but sends nothing, and says so.

## Deploy from GitHub to Vercel and connect the domain
1. Use the `254-star/brew-masters-academy` GitHub repository. `.gitignore` keeps private source photos, build tools, and local files out of the repository.
2. Push the website files to the repository, then in Vercel choose **Add New → Project**, import that GitHub repository, and deploy it. Vercel will redeploy when changes are pushed to the connected branch.
3. In the Vercel project, open **Settings → Domains** and add `brewmastersacademy.co.ke` (and optionally `www.brewmastersacademy.co.ke`). Set `www.brewmastersacademy.co.ke` as primary; the canonical URL and sitemap use this version.
4. In the Hosting.com control panel, open DNS management for `brewmastersacademy.co.ke` and add or update the records Vercel shows for each domain. Use the exact values shown in your project; do not remove mail-related DNS records.
5. Wait for Vercel to verify the DNS records and issue the HTTPS certificate. Then test both the domain and `www` if configured.

## Still to fill in
The about story, and student quotes (only with permission). Look for `EDITABLE` comments in `index.html`.

## Security
- `index.html` has a Content-Security-Policy that only allows this site's own files, Google Fonts and the Web3Forms address.
- `_headers` (Netlify, Cloudflare Pages) and `.htaccess` (cPanel/Apache) add browser security headers and force HTTPS. Upload the one that matches your hosting.
- The form has a hidden spam trap, a too-fast check, a 30-second resend limit, length limits and character cleaning. Your Web3Forms key is meant to be public; in your Web3Forms dashboard you can also restrict it to your website's address and switch on their spam protection.
- Never put passwords or private keys in these files.

## Sitemap and search engines
`robots.txt` and canonical URLs use `https://www.brewmastersacademy.co.ke/`. The sitemap includes the homepage and the dedicated `/barista-courses/` and `/cafe-consulting/` pages. Submit `https://www.brewmastersacademy.co.ke/sitemap.xml` in Google Search Console. Sitemap submission helps Google discover URLs but does not guarantee indexing or search visibility.

## Website CMS
The CMS is at `https://www.brewmastersacademy.co.ke/admin/`. It edits the homepage hero, About and Consulting sections, course names/descriptions/durations/fees/photos, and gallery images. Saving publishes a commit to the `main` branch; Vercel then deploys it automatically.
Use the deployed `www` address for sign-in; local previews do not provide the GitHub OAuth callback.

### Set up GitHub login
1. Give each editor's GitHub account **write** access to `254-star/brew-masters-academy`. The repository is public, so the OAuth app needs only the `public_repo` scope.
2. In GitHub, open **Settings → Developer settings → OAuth Apps → New OAuth App**. Set **Homepage URL** to `https://www.brewmastersacademy.co.ke` and **Authorization callback URL** to `https://www.brewmastersacademy.co.ke/callback`. Save the app and copy its Client ID and generate a Client secret.
3. In Vercel, open the `brew-masters-academy` project **Settings → Environment Variables**. Add the following for **Production**:

   | Name | Value |
   | --- | --- |
   | `GITHUB_OAUTH_CLIENT_ID` | The OAuth App's Client ID |
   | `GITHUB_OAUTH_CLIENT_SECRET` | The OAuth App's Client secret |
   | `GITHUB_OAUTH_CALLBACK_URL` | `https://www.brewmastersacademy.co.ke/callback` |
   | `CMS_ALLOWED_USERS` | Allowed GitHub usernames, comma-separated (for example `editor-one,editor-two`) |

   Enter the secret directly in Vercel; do not put it in website files or send it in chat. Add only confirmed GitHub usernames to the allowlist. Until the variables and allowlist are configured, CMS sign-in stays disabled.
4. Redeploy the Production deployment so the serverless OAuth functions receive the new variables.
5. Visit `/admin/` on the `www` domain and sign in with an allowlisted GitHub account. Accounts also need repository write access. Saving commits content and uploaded media to GitHub, then Vercel builds the live site.

Gallery uploads go in `images/cms-gallery/`. Use reasonably sized WebP images for fast loading; a separate thumbnail is optional. The site reads `content/site.json` on the homepage and course page so course fees and descriptions stay consistent.

The CMS itself is public, but only usernames in `CMS_ALLOWED_USERS` can complete sign-in and receive a GitHub token. Do not remove the allowlist or give repository write access to people who should not publish.
