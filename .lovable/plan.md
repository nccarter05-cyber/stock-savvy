# Fix: "Take Photo" not working on Samsung

## Why it fails
`InvoiceCameraCapture.tsx` keeps the camera `<input type="file" capture="environment">` hidden and opens it via `cameraRef.current.click()` inside the Button's `onClick`. Samsung Internet (and Chrome on Samsung when the app is installed as a PWA) often refuses programmatic clicks on hidden file inputs — the camera intent never launches and nothing visible happens. iOS Safari and desktop Chrome happen to allow it, which is why it works for you in preview but not on the phone.

## Fix
Replace the programmatic `.click()` pattern with real `<label htmlFor>` elements so the file picker opens directly from the user's tap (which every Android browser honors).

### Changes to `src/components/InvoiceCameraCapture.tsx`
- Remove the `useRef` handles and the `onClick` handlers on the two Buttons.
- Wrap each button in a `<label htmlFor="invoice-camera-input">` / `<label htmlFor="invoice-library-input">` and give the inputs matching `id`s.
- Render the Buttons with `asChild` + `<span>` (or use a styled `<label>` directly) so the label is the actual click target. Keep current visuals (icon + text, h-20 grid).
- Keep the inputs visually hidden using `sr-only` (not `hidden`/`display:none` on some Android variants this also blocks the picker — `sr-only` keeps them in the layout but invisible).
- Keep `accept="image/*"`, `capture="environment"` on the camera input and `accept="image/*" multiple` on the library input.
- Keep the existing `onChange` handlers and `e.target.value = ''` reset so re-taking the same photo still fires `change`.
- When `disabled`, add `pointer-events-none opacity-50` to the labels and the `disabled` attribute to the inputs.

### No other files change
`ScanInvoice.tsx`, the hook, and the edge function are unaffected — this is purely the capture trigger.

## How to verify on the Samsung phone
1. Open the preview URL in Samsung Internet (and again in Chrome).
2. Go to `/scan-invoice` → tap "Take Photo" → the system camera should open immediately.
3. Tap "From Library" → the gallery picker should open and allow multi-select.
4. If installed as a PWA, repeat from the installed icon.

## Out of scope
- No change to AI extraction, review table, or import logic.
- Not switching to `getUserMedia` / in-page camera — that's a larger redesign and not needed to fix this.
