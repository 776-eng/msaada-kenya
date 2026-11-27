# Msaada Kenya

A responsive directory of useful Kenyan services, learning resources and opportunities.

## Features

- Search resources by keyword
- Filter by opportunities, public services, learning and business
- Direct links to official and established resources
- Responsive layout for phones, tablets and desktop
- Clear disclaimer reminding users to verify details with official providers

## Run locally

No build tools are required.

1. Download or clone this repository.
2. Open `index.html` in a browser.

## Publish with GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/(root)` folder, then save.
5. GitHub will provide the published website address when deployment is ready.

## Important

Msaada Kenya is an independent resource directory, not a government website. External links are provided as starting points. Always confirm current requirements, fees and deadlines with the official provider.

## Technology

HTML, CSS and vanilla JavaScript.

## Admin dashboard prototype

Open `admin.html` (or use the Admin dashboard link on the homepage) to add, edit, delete, publish and unpublish opportunity posts.

**Prototype limitation:** Listings are stored in the browser's localStorage on the current device and browser only. They are not shared with visitors on other devices, are not backed up to a server, and the admin page has no authentication. Do not treat this as a secure production admin system. The public homepage can display published posts stored in the same browser.

## Recommended production next steps

- Connect a hosted database and secure authentication with admin-only permissions.
- Validate and moderate submitted opportunities.
- Add expiry dates, source verification and reporting tools.
- Deploy server-side access controls before using real admin accounts.
