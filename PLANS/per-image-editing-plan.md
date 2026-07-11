# Per-Image Editing Plan

Branch: `feature/per-image-editing-plan`

## Goal

Move from a **single global edit recipe** to **per-image edit recipes** so that:

- in **Browse/Review** mode, filters / size / border changes apply only to **selected images**
- in **Inspect** mode, those same changes apply only to the **current image**
- export uses each image's own recipe
- the architecture stays clean enough to support future manual adjustments, copy/paste edits, reset, and eventual project persistence

---

## Assessment Summary

## Short answer

This is **very feasible** in the current codebase.

The biggest work is **state architecture + control binding**, not canvas processing.

## Complexity by area

### Low complexity
- canvas rendering pipeline
- inspect rendering
- single-image export rendering
- ZIP export rendering

Why:
- `PreviewCanvas` and `renderProcessedCanvas()` already accept all render inputs explicitly
- the processor is already image-agnostic and can render any recipe you give it

### Medium complexity
- per-image state model
- wiring controls to selected/current targets
- cleanup when items are removed
- test updates

### Medium-high complexity
- multi-select editing UX when selected images have **different values**

This is the main design wrinkle.

---

## Current Architecture Assessment

## What is good already

### 1. Rendering is centralized
Current render/export flow already routes through:
- `src/shared/components/PreviewCanvas.tsx`
- `src/features/borders/processing/canvasProcessor.ts`
- `src/features/borders/BorderToolPage.tsx`

That is a strong foundation.

### 2. Selection and focus already exist
Current page state already has:
- `selectedIds` for Browse
- `activeItemId` for Inspect
- `workspaceMode`

That means the app already has the idea of **edit targets**, even if edits are still global.

### 3. Queue items are already ID-based
`useImageQueue()` already gives stable image IDs.
That is exactly what per-image edits should key off.

## What does not scale for this feature

### 1. `useBorderSettings()` is global-only
Right now one `settings` object drives:
- every grid preview
- inspect preview
- single export
- ZIP export

That is the main constraint.

### 2. UI controls assume one concrete value
`FilterControls`, `PresetSelector`, and `BorderControls` all expect a single value.
That becomes awkward when 3 selected images have different presets or borders.

### 3. Persistence is only localStorage defaults
Current persistence is localStorage-based and stores one global settings object.
That is fine for tool defaults, but not a real project/session model.

---

## Recommendation

## Best-practice approach for this app

Use a **feature-local normalized edit store keyed by image id**, and keep it separate from:
- transient queue/file state
- transient UI state
- export settings

### Recommended separation

#### A. Per-image edit state
Store one edit recipe per image id.

#### B. UI state
Keep things like:
- `selectedIds`
- `activeItemId`
- `workspaceMode`
- `inspectZoom`
- compare pressed state

out of the edit store.

#### C. Export settings
Keep these global:
- `outputFormat`
- `jpegQuality`

#### D. Tool defaults
Keep a persisted default edit recipe in localStorage for:
- new imports
- reset-to-default behavior later

This separation is the most scalable pattern for the next features.

---

## BrowserDB / IndexedDB Recommendation

## Do you need BrowserDB for this feature?

**No, not for v1.**

### Why not
Current images are session-only:
- files are uploaded into memory
- object URLs are created at runtime
- there is no project restore on refresh

So if you persisted per-image edits today without also persisting the image files, you would restore edit metadata for images that no longer exist.

### Recommendation
For this feature:
- keep per-image edits **in memory**
- keep only **tool defaults + export settings** in localStorage

### When IndexedDB becomes the right move
Use IndexedDB only when you want one of these:
- restore imported images after refresh
- save/load projects
- keep original blobs locally
- store derived thumbnails/previews
- support offline multi-session editing

### Best practice if/when you do that
Use:
- **IndexedDB**
- preferably via **Dexie**

Store:
- image blobs separately
- project/session metadata separately
- per-image recipes keyed by image id

Do **not** introduce IndexedDB in this feature unless project persistence is also in scope.

---

## State Management Recommendation

## Should this use React state, reducer, Zustand, Redux, etc.?

### Recommendation for now
Use a **feature-local `useReducer` hook**.

That is the best fit because:
- this state is domain-heavy now
- `BorderToolPage.tsx` is already getting large
- multiple updates need to stay transactional
- batch apply to many selected images is easier in reducer actions
- no app-wide store is required yet

### Not recommended for this pass
- introducing Redux just for this feature
- introducing IndexedDB-backed state now
- attaching full edit state directly onto `ImageQueueItem`

### Why not attach edits directly to queue items?
Because queue items are about:
- files
- object URLs
- dimensions
- processing status

Per-image edit recipes are a separate domain.
Keeping them separate will scale better.

---

## Recommended Data Model

## Split current settings into two concepts

### 1. Image edit recipe
This is what becomes per-image.

```ts
export type ImageEditRecipe = {
  presetId: OutputPresetId
  backgroundColor: string
  imageSizingMode: ImageSizingMode
  imageEdgePixels: number
  borderWidthPixels: number
  customWidth: number
  customHeight: number
  filterPresetId: FilterPresetId
}
```

### 2. Export settings
These stay global.

```ts
export type ExportSettings = {
  outputFormat: ExportFormat
  jpegQuality: number
}
```

### 3. Feature state

```ts
export type ImageEditsState = {
  byId: Record<string, ImageEditRecipe>
}
```

## Why full recipe per image instead of sparse overrides?

A sparse override model is also valid, but for this app I recommend a **full recipe snapshot per image**.

### Why this is the better fit here
- predictable: one image's recipe does not change because some global default changed later
- simple export path
- simple preview path
- simple save/load path later
- easier future features: copy/paste edits, reset image, duplicate recipe
- the data size is tiny, so duplication cost is negligible

### Keep defaults separately anyway
Persist a default recipe separately for:
- seeding new images
- future reset actions
- future “apply current defaults to new imports” behavior

---

## Recommended Hook Structure

## Keep `useImageQueue()` as-is for files
Do not turn it into the edit store.

## Add a new hook

Recommended file:
- `src/features/borders/useImageEdits.ts`

### Suggested responsibilities
- initialize recipes for new image ids
- remove recipes when images are removed
- resolve current recipe for an image id
- apply patch to one image
- apply patch to many images
- reset image(s) to defaults later
- derive shared/mixed values for current edit targets

### Suggested reducer actions

```ts
type ImageEditsAction =
  | { type: 'initialize-images'; imageIds: string[]; recipe: ImageEditRecipe }
  | { type: 'remove-image'; imageId: string }
  | { type: 'remove-images'; imageIds: string[] }
  | { type: 'patch-image'; imageId: string; patch: Partial<ImageEditRecipe> }
  | { type: 'patch-images'; imageIds: string[]; patch: Partial<ImageEditRecipe> }
  | { type: 'replace-image-recipe'; imageId: string; recipe: ImageEditRecipe }
```

### Suggested hook API

```ts
const {
  recipesById,
  initializeImages,
  removeImage,
  removeImages,
  patchImage,
  patchImages,
  getRecipe,
  getSharedValue,
  hasMixedValue,
} = useImageEdits()
```

---

## Recommended Targeting Model

## Editing targets should be derived, not stored twice

Derive the current edit target from existing page state.

### Browse mode
Target ids = selected ready-image ids.

### Inspect mode
Target ids = current inspect image id, if ready.

### Recommended derived model

```ts
type EditTarget = {
  ids: string[]
  scope: 'browse-selection' | 'inspect-current'
}
```

### Rules
- Browse with no selection -> edit controls disabled
- Inspect with no active ready image -> edit controls disabled
- changing a control applies that field to **all target ids**

This is the cleanest mental model.

---

## Multi-Select UX Recommendation

This is the main product decision area.

## Recommended v1 behavior
When multiple selected images have different values:
- controls show a **mixed** state where possible
- changing a control applies the new value to all selected images

### Examples
- filter preset dropdown: show `Mixed`
- size preset dropdown: show `Mixed`
- background color hex field: show blank/placeholder + mixed helper text
- sizing mode: show `Mixed`
- numeric controls: show blank/placeholder or last common value only if equal

## Why this is best practice
This matches how batch editing usually behaves:
- differing values are represented as mixed
- the next explicit user change becomes a batch apply

## If mixed-state UI feels too expensive
Fallback MVP option:
- if multiple selected images differ, show a summary banner like `Mixed values across selection`
- keep controls enabled
- show the first target's value visually
- the next user change still applies to all selected images

This is easier technically but more ambiguous.

### Recommendation
Prefer real mixed-state support for select-like controls first.

---

## What Should Stay Global

These should remain global in v1:
- output format
- jpeg quality
- grid columns
- workspace mode
- inspect zoom
- compare pressed state

## Why
These are workspace/export concerns, not image recipes.

---

## Current Code Changes Required

## 1. Types
File:
- `src/features/borders/types.ts`

### Add
- `ImageEditRecipe`
- maybe `ExportSettings`

### Consider
Eventually rename current `BorderSettings` into two smaller types.

---

## 2. Settings persistence
File:
- `src/features/borders/useBorderSettings.ts`

### Recommendation
Refactor this hook so it no longer represents “the current recipe for all images”.

### Better split
Option A:
- keep file, but change it to persist:
  - default image recipe
  - export settings

Option B:
- split into:
  - `useDefaultImageRecipe.ts`
  - `useExportSettings.ts`

### Preferred
Option B is cleaner for long-term growth.

---

## 3. New per-image hook
New file:
- `src/features/borders/useImageEdits.ts`

This becomes the core new state layer.

---

## 4. `BorderToolPage.tsx`
This will be the main orchestration refactor.

### New responsibilities
- derive current edit targets
- initialize per-image recipes when files are added
- remove recipes when items are removed
- compute shared/mixed control values for the target selection
- pass per-image recipes to browse/inspect/export

### Important export change
Current export path uses one global recipe.
It must change to:
- resolve recipe for each image
- resolve preset dimensions for that image
- resolve filter adjustments for that image
- render/export using that image's own recipe

---

## 5. Browse rendering path
Files:
- `src/features/borders/components/BrowseWorkspace.tsx`
- `src/shared/components/ImageGrid.tsx`
- `src/shared/components/ImageCard.tsx`

### Current problem
These components receive one shared set of render props.

### Required change
They need per-item render settings.

### Recommended approach
Pass a resolver or per-item map.

Example idea:

```ts
getItemRecipe: (id: string) => ImageEditRecipe
```

Then resolve per card during render.

---

## 6. Inspect rendering path
File:
- `src/features/borders/components/InspectWorkspace.tsx`

### Required change
Inspect should receive the active image's recipe directly.

That part is straightforward.

---

## 7. Control components
Files:
- `src/features/borders/components/FilterControls.tsx`
- `src/features/borders/components/PresetSelector.tsx`
- `src/features/borders/components/BorderControls.tsx`

### Required change
Support control values that may be:
- concrete
- mixed
- disabled

### Recommended prop model
For v1, do not over-generalize.
A simple pattern is enough:

```ts
type MixedValueProp<T> = {
  value: T
  isMixed?: boolean
  disabled?: boolean
}
```

Or field-by-field props like:
- `selectedPresetId?: FilterPresetId`
- `isMixed?: boolean`
- `disabled?: boolean`

### Important note
Mixed numeric/color inputs are the fiddliest part.
Plan to handle selects first, then text/numeric inputs carefully.

---

## 8. Export path
File:
- `src/features/borders/BorderToolPage.tsx`

### Current behavior
`createProcessedBlob(item)` uses one global `selectedPreset` and one global filter selection.

### Required behavior
`createProcessedBlob(item)` must:
1. get recipe for `item.id`
2. derive preset for that recipe
3. derive filter adjustments for that recipe
4. render/export using those values

This is a low-risk change once the state model is correct.

---

## Recommended Implementation Phases

## Phase 1: domain split
- introduce `ImageEditRecipe`
- split export settings from edit recipe settings
- add `useImageEdits`
- initialize recipes for newly added images using current default recipe snapshot
- clean up recipes on remove

### Deliverable
Per-image recipe state exists, even if UI still behaves globally.

---

## Phase 2: render per-image previews
- change browse render path to resolve recipe per item
- change inspect render path to use active recipe
- change export path to use item recipe
- verify previews and exports match

### Deliverable
The app can render and export different recipes per image.

---

## Phase 3: target-aware editing
- derive edit targets from selection / inspect focus
- disable controls when no valid target exists
- wire filter/size/border changes to target ids only
- keep export settings global

### Deliverable
User can edit selected images in Browse and current image in Inspect.

---

## Phase 4: mixed-state UX
- detect differing values across selected targets
- show mixed states in controls
- apply next explicit change to all targets
- add small helper copy like `Editing 3 selected images`

### Deliverable
Batch editing feels intentional and understandable.

---

## Phase 5: cleanup and polish
- rename hooks/types for clarity
- remove leftover global-recipe assumptions
- tighten tests
- optional: add reset selected/current image action

### Deliverable
Clean handoff-quality architecture.

---

## Recommended Product Copy / UX

### Browse with no selection
Show helper text near controls:
- `Select one or more images to edit.`

### Browse with selection
Show helper text:
- `Editing 3 selected images`

### Inspect
Show helper text:
- `Editing current image`

### Mixed values
Show helper text where needed:
- `Mixed values`

This will reduce confusion a lot.

---

## Confirmed Decisions / Remaining Question

These decisions are now confirmed for implementation.

## Confirmed
- Browse with no selection: **disable edit controls**
- New imports: **inherit current default recipe snapshot**
- Reset semantics: **reset to defaults**
- Compare scope: **filter-only for this pass**

## Remaining open question
## 1. Mixed values UX
When 2+ selected images have different values, should controls show:
- a real `Mixed` state, or
- the first selected image's value and silently batch-override on change?

### Recommendation
Use explicit mixed state.

---

## Testing Plan

## Unit tests
### `useImageEdits`
- initializes recipes for new ids
- patches one image
- patches many images
- removes image recipes cleanly
- returns correct shared value when all targets match
- detects mixed values when targets differ

### persistence hooks
- default recipe loads/sanitizes from localStorage
- export settings load/sanitize from localStorage

---

## Component tests
### `FilterControls`
- disabled with no edit target
- shows mixed state when requested
- applies selected filter change

### `PresetSelector`
- shows mixed state when requested
- custom size changes propagate correctly

### `BorderControls`
- disabled when appropriate
- mixed states render correctly where supported
- changing one control applies one field patch

---

## Integration tests
### `BorderToolPage`
- new images get initialized recipes
- selected browse edits affect only selected ids
- inspect edits affect only active image
- unselected browse images keep their recipe
- export ZIP uses each image's own recipe
- removing an image cleans recipe state
- controls disable when no browse selection exists
- mixed selected images surface correct UI state

---

## Risks / Watchouts

## 1. Control-state complexity is the real cost
Canvas work is not the hard part.
Mixed-value UI is.

## 2. Do not keep “global current recipe” as the source of truth
That will create confusing bugs and partial migrations.

## 3. Do not persist per-image edits without persisting images
That creates orphaned metadata and confusing restores.

## 4. Keep export settings separate from image recipe state
Otherwise batch export and edit state will get tangled.

## 5. Avoid putting more logic directly into `BorderToolPage`
Extract hooks early.

---

## Final Recommendation

This feature is a **good next step** and the current architecture is already close.

### Best path
- keep files/session state in `useImageQueue()`
- introduce a **per-image recipe store keyed by image id**
- keep export settings global
- keep defaults persisted in localStorage
- do **not** add BrowserDB yet
- use a **feature-local reducer hook**
- support batch editing through derived edit targets

### Overall effort
This is **moderate complexity**, not a rewrite.

The biggest design decision is the **multi-select mixed-state UI**.
Once that is settled, the implementation is very manageable.
