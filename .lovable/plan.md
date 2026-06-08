Add a voice-to-text microphone button to the "Item Name" field on the Add Item page.

### What to build
1. **New component: `src/components/VoiceInput.tsx`**
   - Wraps the existing `Input` UI component with a microphone toggle button positioned inside the input field (right side).
   - Uses the browser's built-in Web Speech API (`window.SpeechRecognition` or `window.webkitSpeechRecognition`).
   - On click: starts listening, shows a "Listening..." state (e.g. pulsing mic icon).
   - On `result`: writes the transcript into the input value.
   - On `error` / `end`: stops listening and resets the button state.
   - If the browser does not support the API, the mic button is hidden entirely so the input behaves exactly like before.
   - Icons: `Mic`, `MicOff`, `Loader2` from `lucide-react`.

2. **Update: `src/pages/AddItem.tsx`**
   - Import `VoiceInput`.
   - Replace the standard `Input` used for "Item Name" with `VoiceInput`.
   - Keep `id="name"`, `name="name"`, `placeholder="Enter item name"`, and `required` so the existing form submission via `FormData` continues to work unchanged.

### No backend or database changes required.
This is a client-only feature using the browser's native speech recognition.