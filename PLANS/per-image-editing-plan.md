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
- apply patch to many images when needed
- replace many images with a source recipe
- reset image(s) to defaults later

### Suggested reducer actions

```ts
type ImageEditsAction =
  | { type: 'initialize-images'; imageIds: string[]; recipe: ImageEditRecipe }
  | { type: 'remove-image'; imageId: string }
  | { type: 'remove-images'; imageIds: string[] }
  | { type: 'patch-image'; imageId: string; patch: Partial<ImageEditRecipe> }
  | { type: 'patch-images'; imageIds: string[]; patch: Partial<ImageEditRecipe> }
  | { type: 'replace-image-recipe'; imageId: string; recipe: ImageEditRecipe }
  | {
      type: 'replace-images-with-recipe'
      imageIds: string[]
      recipe: ImageEditRecipe
    }
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
  replaceImagesWithRecipe,
  getRecipe,
} = useImageEdits()
```

---

## Recommended Targeting Model

## Editing targets should be derived, not stored twice

Derive the current edit target from existing page state.

### Browse mode
- if exactly 1 ready image is selected, that image is the direct edit target
- if 2+ ready images are selected, use explicit batch apply actions instead of mixed-value direct editing in v1

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
- Browse with 1 selected image -> controls edit that image directly
- Browse with 2+ selected images -> direct field controls are disabled in v1
- Inspect with no active ready image -> edit controls disabled
- Inspect with an active ready image -> controls edit the current image directly
- batch changes across many images happen through explicit apply actions

This keeps the first version simple and avoids mixed-value complexity.

---

## Multi-Select UX Recommendation

## Recommended v1 behavior
Keep multi-select editing intentionally simple.

When 2+ images are selected in Browse:
- do **not** show mixed-value direct editing controls in v1
- show helper copy like `3 images selected`
- show an explicit batch action:
  - `Apply current image edits to selected`
- optionally also show:
  - `Apply current image edits to all`

## Source of truth for batch apply
The source recipe should be the **current image in Inspect**.

That gives a clear workflow:
1. open an image in Inspect
2. tune its filter/size/border
3. select other images in Browse
4. apply the current image recipe to selected or all

## Why this is a good v1
- avoids mixed-state UI complexity
- avoids ambiguous batch-editing behavior
- matches common “copy edits / paste edits” workflows
- keeps the architecture compatible with future mixed-state editing later

## Recommended follow-up naming
Internally this should be treated as recipe copy/apply, for example:
- `replaceImagesWithRecipe(imageIds, recipe)`

Later you can evolve this into:
- copy edits
- paste edits
- sync selected images
- preset snapshots

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
- derive direct edit target vs batch-selection state
- initialize per-image recipes when files are added
- remove recipes when items are removed
- resolve the current inspect source recipe for batch apply
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
Support control states that may be:
- concrete
- disabled

### Recommended prop model
Keep these components simple in v1.
Use ordinary value props plus `disabled` and optional helper copy from the parent.

Example:
- `selectedPresetId?: FilterPresetId`
- `disabled?: boolean`
- `helperText?: string`

### Important note
Avoid introducing mixed-value control abstractions in this pass.
The batch workflow should be handled with explicit apply actions instead.

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
- derive direct edit target from single selection / inspect focus
- disable controls when no valid direct target exists
- wire filter/size/border changes to one selected image in Browse or current image in Inspect
- keep export settings global

### Deliverable
User can edit one selected image in Browse and the current image in Inspect.

---

## Phase 4: batch apply UX
- add helper copy for multi-selection
- add `Apply current image edits to selected`
- optionally add `Apply current image edits to all`
- ensure batch apply copies the full recipe snapshot

### Deliverable
Batch editing feels intentional without needing mixed-state controls.

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
- `Select an image to edit.`

### Browse with one selection
Show helper text:
- `Editing selected image`

### Browse with multi-selection
Show helper text:
- `3 images selected`
- `Direct editing is disabled for multi-select in this version`
- `Apply current image edits to selected images`

### Inspect
Show helper text:
- `Editing current image`

This will reduce confusion a lot.

---

## Confirmed Decisions

These decisions are now confirmed for implementation.

## Confirmed
- Browse with no selection: **disable edit controls**
- New imports: **inherit current default recipe snapshot**
- Reset semantics: **reset to defaults**
- Compare scope: **filter-only for this pass**
- Multi-select editing: **keep it simple**
- Multi-select workflow: **edit one image, then apply that image's recipe to selected images**
- Optional stretch action: **apply current image edits to all images**

---

## Testing Plan

## Unit tests
### `useImageEdits`
- initializes recipes for new ids
- patches one image
- patches many images
- replaces many images with one source recipe
- removes image recipes cleanly

### persistence hooks
- default recipe loads/sanitizes from localStorage
- export settings load/sanitize from localStorage

---

## Component tests
### `FilterControls`
- disabled with no direct edit target
- applies selected filter change

### `PresetSelector`
- custom size changes propagate correctly

### `BorderControls`
- disabled when appropriate
- changing one control applies one field patch

---

## Integration tests
### `BorderToolPage`
- new images get initialized recipes
- single selected browse edits affect only that image
- inspect edits affect only active image
- multi-selected browse images do not enable direct field editing
- apply current image edits to selected copies the full recipe
- apply current image edits to all copies the full recipe if implemented
- unselected browse images keep their recipe unless batch apply is used
- export ZIP uses each image's own recipe
- removing an image cleans recipe state
- controls disable when no browse selection exists

---

## Risks / Watchouts

## 1. Control-state complexity is the real cost
Canvas work is not the hard part.
That is why this plan avoids mixed-value UI in v1.

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
- support simple batch editing through **apply recipe from current image** actions

### Overall effort
This is **moderate complexity**, not a rewrite.

With mixed-state editing deferred, the implementation becomes much more straightforward.

---

## Model-Ready Implementation Checklist

Use this as the execution order for the implementation model.

## Guardrails
- keep image files/object URLs in `useImageQueue()`
- do not introduce IndexedDB in this pass
- do not keep a second global "current recipe" source of truth
- do not implement mixed-value controls in this pass
- keep compare behavior filter-only
- keep export settings global

## Step 0: baseline
1. run `npm test`
2. inspect current usages of `BorderSettings`
3. confirm branch is `feature/per-image-editing-plan`

## Step 1: split types
Files:
- `src/features/borders/types.ts`

Tasks:
- add `ImageEditRecipe`
- add `ExportSettings`
- keep `ImageSizingMode`, `FilterPresetId`, `FilterAdjustments`, `InspectZoom`
- either remove `BorderSettings` or redefine it only temporarily during migration

Recommended shape:
```ts
type ImageEditRecipe = {
  presetId: OutputPresetId
  backgroundColor: string
  imageSizingMode: ImageSizingMode
  imageEdgePixels: number
  borderWidthPixels: number
  customWidth: number
  customHeight: number
  filterPresetId: FilterPresetId
}

type ExportSettings = {
  outputFormat: ExportFormat
  jpegQuality: number
}
```

Done when:
- recipe fields are clearly separated from export fields

## Step 2: split persistence hook
Files:
- `src/features/borders/useBorderSettings.ts`
- optionally new files:
  - `src/features/borders/useDefaultImageRecipe.ts`
  - `src/features/borders/useExportSettings.ts`

Tasks:
- stop using one persisted object for both recipe and export settings
- keep localStorage persistence only for:
  - default image recipe
  - export settings
- preserve current sanitization behavior
- preserve current defaults:
  - preset/background/sizing/border/custom size/filter defaults
  - output format / jpeg quality defaults

Preferred outcome:
- one hook for default recipe
- one hook for export settings

Acceptable fallback:
- keep `useBorderSettings.ts` but have it return two nested domains:
  - `defaultRecipe`
  - `exportSettings`

Done when:
- `BorderToolPage` can read defaults separately from export settings
- tests cover localStorage load/sanitize for the new shape

## Step 3: add per-image edit state
Files:
- new: `src/features/borders/useImageEdits.ts`
- new test: `src/features/borders/useImageEdits.test.tsx` or `.test.ts`

Tasks:
- implement reducer state keyed by image id
- initialize image recipes from the current default recipe snapshot
- support single-image patch
- support many-image patch if useful
- support `replaceImagesWithRecipe(imageIds, recipe)`
- support removal cleanup
- provide `getRecipe(imageId)` with safe fallback behavior

Recommended reducer actions:
```ts
initialize-images
remove-image
remove-images
patch-image
patch-images
replace-image-recipe
replace-images-with-recipe
```

Done when:
- hook tests prove initialization, patching, replacement, and cleanup work

## Step 4: wire recipe lifecycle into `BorderToolPage`
Files:
- `src/features/borders/BorderToolPage.tsx`

Tasks:
- instantiate the new per-image edit hook
- when new ready items appear, initialize recipes for missing ids
- when items are removed, remove recipes
- derive:
  - `selectedReadyItems`
  - `singleSelectedReadyItem`
  - `activeInspectItem`
  - `currentInspectRecipe`
- derive whether controls should be enabled for:
  - browse single-select
  - inspect current image
  - multi-select batch apply

Important rule:
- Browse direct editing is enabled only when exactly one ready image is selected
- Inspect direct editing is enabled when there is an active ready image

Done when:
- no editing control depends on one global image recipe anymore

## Step 5: convert direct edit handlers
Files:
- `src/features/borders/BorderToolPage.tsx`

Tasks:
- replace `setPresetId`, `setBackgroundColor`, `setImageSizingMode`, etc. usage for image edits with recipe patch handlers
- direct edits should patch:
  - selected image in Browse when exactly one is selected
  - active image in Inspect
- export controls should still use global export settings setters

Implementation hint:
- create a helper like `patchDirectTarget(patch)` inside `BorderToolPage`
- no-op when there is no valid direct target

Done when:
- changing filter/border/size no longer updates every image globally

## Step 6: render per-image previews in Browse
Files:
- `src/features/borders/components/BrowseWorkspace.tsx`
- `src/shared/components/ImageGrid.tsx`
- `src/shared/components/ImageCard.tsx`
- maybe `src/shared/components/PreviewCanvas.tsx`

Tasks:
- stop passing one shared recipe-derived prop set to all cards
- pass either:
  - `getItemRecipe(id)`
  - or pre-resolved per-item render props
- for each image card, resolve:
  - preset from that image's recipe
  - filter adjustments from that image's `filterPresetId`
  - compare override to original filter only

Important rule:
- compare should still only affect filters, not border/background/size

Done when:
- two images with different recipes render differently in the grid

## Step 7: render active recipe in Inspect
Files:
- `src/features/borders/components/InspectWorkspace.tsx`
- `src/features/borders/BorderToolPage.tsx`

Tasks:
- pass the active image recipe into Inspect
- resolve preset/filter adjustments from that recipe
- keep compare behavior filter-only

Done when:
- Inspect always reflects the current image's own recipe

## Step 8: update export to use item recipe
Files:
- `src/features/borders/BorderToolPage.tsx`

Tasks:
- change `createProcessedBlob(item)` to resolve recipe by `item.id`
- derive preset per item
- derive filter adjustments per item
- keep filename/output format/jpeg quality logic global
- ensure ZIP export uses each image's own recipe

Done when:
- export output matches visible per-image previews

## Step 9: simplify controls for v1 behavior
Files:
- `src/features/borders/components/FilterControls.tsx`
- `src/features/borders/components/PresetSelector.tsx`
- `src/features/borders/components/BorderControls.tsx`
- `src/features/borders/BorderToolPage.tsx`

Tasks:
- add `disabled` support wherever needed
- optionally add `helperText` from parent if useful
- do not implement mixed-value UI
- Browse UI behavior:
  - 0 selected -> controls disabled
  - 1 selected -> controls enabled
  - 2+ selected -> controls disabled for direct editing
- Inspect UI behavior:
  - active ready image -> controls enabled

Done when:
- the control state matches the confirmed product rules

## Step 10: add batch apply actions
Files:
- `src/features/borders/BorderToolPage.tsx`
- possibly `src/features/borders/components/BrowseWorkspace.tsx`
- possibly a footer/toolbar component if that is the cleanest place

Tasks:
- add action: `Apply current image edits to selected`
- optional stretch: `Apply current image edits to all`
- source recipe is the active Inspect image recipe
- disable batch apply when:
  - there is no active inspect recipe
  - there are fewer than 2 selected target images for the selected action
- copying should replace the full recipe snapshot on targets

Recommended guard:
- exclude the source image id from targets if already selected, unless explicit product behavior says keep it included harmlessly

Done when:
- user can tune one image, then copy its edits across other images intentionally

## Step 11: update helper copy / status text
Files:
- `src/features/borders/BorderToolPage.tsx`
- any workspace subcomponents where text is shown

Tasks:
- no selection: `Select an image to edit.`
- single selection: `Editing selected image`
- multi-selection: `3 images selected`
- multi-selection helper: `Direct editing is disabled for multi-select in this version`
- batch apply helper: `Apply current image edits to selected images`

Done when:
- state changes are understandable without guessing

## Step 12: tests
Files likely affected:
- `src/features/borders/BorderToolPage.test.tsx`
- `src/features/borders/components/FilterControls.test.tsx`
- `src/features/borders/components/PresetSelector.test.tsx`
- `src/features/borders/components/BorderControls.test.tsx`
- `src/shared/components/ImageGrid.test.tsx`
- new `src/features/borders/useImageEdits.test.tsx`
- updated persistence hook tests

Must-cover scenarios:
- new images get initialized recipes from defaults
- single selected browse edits affect only one image
- inspect edits affect only active image
- multi-select disables direct controls
- apply current image edits to selected copies full recipe
- apply current image edits to all copies full recipe if implemented
- unselected images keep their own recipes until batch apply
- removing an image cleans recipe state
- export ZIP uses per-image settings
- compare remains filter-only

## Step 13: verification pass
1. run `npm test`
2. manually verify:
   - import 3+ images
   - edit one image in Inspect
   - return to Browse and confirm only that image changed
   - single-select another image and edit it independently
   - multi-select and confirm direct controls are disabled
   - apply current image edits to selected and verify copied result
   - export PNG/JPEG and confirm outputs match previews
3. check for dead code from the old global recipe path

## Suggested implementation order inside the branch
1. types
2. persistence split
3. `useImageEdits`
4. `BorderToolPage` state wiring
5. inspect rendering
6. browse rendering
7. export path
8. control disabling rules
9. batch apply action
10. tests and cleanup

## Handoff note for the implementation model
The core architectural goal is:
- every image has its own full recipe snapshot
- direct editing only targets one image at a time
- multi-select uses explicit recipe copy/apply, not mixed controls
- export resolves recipe per image

If forced to choose, prioritize correctness in:
1. per-image preview rendering
2. per-image export rendering
3. recipe lifecycle cleanup
4. batch apply behavior
5. UI polish
