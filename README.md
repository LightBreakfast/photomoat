# PhotoMoat

Adds Instagram-style borders to photos. Everything runs in the browser — your images never get uploaded anywhere.

Drop in a photo, pick a frame size and border color, and export. You can adjust how the image fits, apply a filter, rotate or flip, and undo anything via the per-image history. When you're done, export everything at once as a ZIP with your own file names.

Details worth knowing:

- Output sizes: Square 1080×1080, Portrait 1080×1350, Landscape 1080×566, Story/Reel 1080×1920, or a custom size
- Background color is up to you
- Image fitting: auto fit, long edge, short edge, fixed border width, or fill the frame (no border)
- Filters: Original, Drift, Ember, Coast, Muse, Noir, with a compare view
- Sessions are saved locally (IndexedDB), so a refresh doesn't lose your work
- Light and dark themes, keyboard shortcuts, WCAG AA

## Development

```bash
npm install
npm run dev      # start the dev server
npm run test     # run the tests
npm run build    # production build
```

## Deployment

Push to `main`. GitHub Actions builds the site and deploys to GitHub Pages.
