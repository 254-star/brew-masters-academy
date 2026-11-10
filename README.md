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
1. Create a GitHub repository for the website. `.gitignore` keeps the private source photos, editor, build tools, and local files out of the repository.
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

## Editing the site yourself (admin/index.html)
Open `admin/index.html` in your browser (double-click it; if the file does not load on its own, click "Open site.json" and pick `content/site.json`). You can change courses (name, description, duration, fee, button, photo, order), the headline, About and Consulting text, and add, remove, re-order or describe gallery photos. Click "Download updated site", unzip, copy the `content` and `images` folders into this project, and upload the project again.
- The page content lives in `content/site.json`. `js/content.js` reads it; if it cannot load, the text written in `index.html` is shown instead.
- The editor has no password. Do NOT upload the `admin` folder (or `source-photos`, `tools`) to your website.
