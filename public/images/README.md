# Images for Boiler CS

Drop these two files here so the themed assets render. They're referenced by
`src/app/globals.css`:

| File                      | Used for                                   | Notes |
| ------------------------- | ------------------------------------------ | ----- |
| `public/images/book.jpg`  | Leather-book cover on class/unit/exam cards | The attached antique leather book photo. It's darkened + tinted toward the dark-academia palette via CSS blend modes, so a bright scan still reads as an aged binding. Any aspect ratio works (it's `background-size: cover`). |
| `public/images/seal.png`  | The "Coming soon" wax seal (`.wax-seal--img`) | The attached bronze wax-seal photo, ideally a PNG with a transparent background so only the seal shows. ~200×200px is plenty. |

## Fallbacks
If a file is missing, the UI degrades gracefully:
- No `book.jpg` → cards show the CSS leather-gradient surface instead.
- No `seal.png` → the seal shows a CSS bronze wax disc with the "Coming soon" text.

So the site works before you add them; it just looks richer once they're in place.

## Filenames differ?
If your files have other names/extensions, either rename them to `book.jpg` /
`seal.png`, or update the two `url('/images/...')` references in
`src/app/globals.css` (search for `/images/book` and `/images/seal`).
