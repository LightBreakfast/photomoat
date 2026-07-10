# Panel Reorganisation + Filters Plan

## Branch
- `feature/panel-reorg-and-filters-plan`

## Goal
Reorganise the side panels so the tool better supports editing before export, and add a first-pass filter system in a clean, extensible way.

## Confirmed Direction

### Panel layout
- **Left panel:** Images / Filters
- **Right panel:** Size / Border / Export
- Mobile labels stay:
  - **Edit**
  - **Output**

### Filters
- **Global only** for now
- **Preset-only** for v1
- Presets should use **original branded-style names**
- Include a clear **Original / Reset** option
- Filter selection UI should use **text chips**
- A selected preset is a **starting point** for future extensibility

### Compare
- Use **press and hold** compare
- Compare applies to:
  - main preview
  - image viewer
- Compare does **not** need to affect the grid
- Best first implementation: a dedicated **Hold to compare** control near filters
- Compare is temporary UI state only and should **not** persist

### Rendering rules
- Use **canvas-based** filter rendering
- Filters apply to the **source image only**
- **Background / border must not be affected**
- Filters must affect all output surfaces consistently:
  - preview
  - viewer
  - single export
  - ZIP export

### Extensibility
- Even though v1 is preset-only, the underlying architecture should store **resolved adjustment values**
- Presets map to those values internally
- This should leave room for future:
  - manual adjustments
  - individual image adjustments
  - additional edit tools

---

## Assessment

### Is this feasible?
Yes.

This is a good fit for the current app because rendering is already centralized:
- preview rendering goes through `PreviewCanvas`
- export rendering goes through `renderProcessedCanvas`
- image placement/rendering lives in `canvasProcessor.ts`

That means filters can be integrated once into the real canvas pipeline and then reused everywhere.

### What should v1 include?
Keep the first pass intentionally narrow:
- panel reorganisation
- preset filter system
- press-and-hold compare
- consistent preview/export rendering
- reset to Original

### What should v1 not include?
Do **not** add yet:
- manual filter sliders
- per-image filter state
- advanced edits like curves, masks, sharpen, vignette, LUTs

---

## Product / UX Structure

## Left panel: Edit
This should contain controls that affect the source image and editing workflow.

### Sections
1. **Images**
   - Dropzone / add files

2. **Filters**
   - preset chips
   - Original / Reset option
   - Hold to compare control

## Right panel: Output
This should contain controls that affect the exported canvas and file output.

### Sections
1. **Size**
   - preset selector
   - custom dimensions

2. **Border**
   - background
   - sizing mode
   - edge size / border width

3. **Export**
   - format
   - quality
   - ZIP export

---

## Recommended Architecture

## 1. Separate user-facing preset selection from internal adjustment values
Although the UI is preset-only, the data model should be future-ready.

### Recommended model
- Persist a selected filter preset id
- Resolve that preset into adjustment values used by rendering

### Suggested shape
File likely: `src/features/borders/types.ts`

```ts
export type FilterPresetId =
  | 'original'
  | 'drift'
  | 'ember'
  | 'coast'
  | 'muse'
  | 'noir'

export type FilterAdjustments = {
  brightness: number
  contrast: number
  saturation: number
  grayscale: number
  sepia: number
  hueRotate: number
}
```

### Why this is best
- UI stays simple now
- rendering gets explicit numeric values
- future manual adjustments can layer on later without reworking the full model

---

## 2. Add filter preset definitions
Recommended file:
- `src/features/borders/filterPresets.ts`

### Each preset should define
- id
- label
- resolved adjustment values

### Example shape
```ts
export type FilterPreset = {
  id: FilterPresetId
  label: string
  adjustments: FilterAdjustments
}
```

### Important note
Preset names should feel branded and distinct, but be original.

Examples of the right style:
- Drift
- Ember
- Coast
- Muse
- Noir

Actual final names can be decided during implementation.

---

## 3. Extend settings persistence cleanly
File likely:
- `src/features/borders/useBorderSettings.ts`

### Add
- persisted selected filter preset id
- sanitization/fallback to `original`
- setter for filter preset id

### Do not persist
- compare pressed state

### Best-practice note
Filter preset selection belongs in the same persisted settings model as size/border/output because it affects exported results.

---

## 4. Add filter resolution helper
Recommended helper responsibility:
- map `filterPresetId` → `FilterAdjustments`

This can live in:
- `filterPresets.ts`
- or a small adjacent utility if needed

This keeps the page/component layer free from hardcoded adjustment values.

---

## 5. Integrate filters into the canvas pipeline
Primary file:
- `src/features/borders/processing/canvasProcessor.ts`

### Recommended implementation
Use the canvas 2D context `filter` property:

```ts
context.filter = buildCanvasFilter(adjustments)
context.drawImage(...)
context.filter = 'none'
```

### Recommended helper
```ts
function buildCanvasFilter(adjustments: FilterAdjustments): string
```

Example output:
```ts
brightness(100%) contrast(100%) saturate(100%) grayscale(0%) sepia(0%) hue-rotate(0deg)
```

### Why this is the right MVP
- simple
- consistent across preview/export
- low complexity
- easy to extend later

### Critical rule
Apply the filter only while drawing the source image.
Do **not** filter the background fill or border area.

---

## 6. Add compare state at the UI layer
Compare should be temporary UI state, not part of persisted tool settings.

### Recommended approach
In `BorderToolPage`:
- add temporary compare state, e.g. `isCompareActive`
- toggle true on pointer/mouse down of compare control
- toggle false on pointer/mouse up / leave / cancel

### Rendering behavior
When compare is active:
- preview + viewer render with `original` adjustments
- exports remain unaffected and continue to use the selected preset

### Important rule
Compare should affect:
- main preview
- viewer

Compare should not affect:
- grid thumbnails
- saved settings
- export state

---

## 7. Create a dedicated `FilterControls` component
Recommended file:
- `src/features/borders/components/FilterControls.tsx`

### Responsibilities
- render filter preset chips
- render Original / Reset option
- render Hold to compare control
- expose selection and compare handlers
- remain presentation-focused

### Recommended props
Conceptually:
- `selectedPresetId`
- `onPresetChange`
- `isCompareActive`
- `onCompareStart`
- `onCompareEnd`

### UI recommendation
Keep it visually consistent with the rest of the app:
- uppercase section headings
- compact grouped controls
- chip buttons with clear selected state
- compare control clearly separated from preset chips

---

## 8. Reorganise `BorderToolPage`
Primary file:
- `src/features/borders/BorderToolPage.tsx`

### New left panel content
- Dropzone
- FilterControls

### New right panel content
- PresetSelector
- BorderControls
- ExportControls

### Mobile updates
Rename/open panels as:
- Edit
- Output

### Best-practice note
This page is getting large enough that panel content should be grouped deliberately, even if not split into extra files yet.

Optional light abstraction if helpful:
- small section wrapper component for consistent headings/spacing

Only do this if it improves readability clearly.

---

## File Impact

### Definitely affected
- `src/features/borders/BorderToolPage.tsx`
- `src/features/borders/types.ts`
- `src/features/borders/useBorderSettings.ts`
- `src/features/borders/processing/canvasProcessor.ts`
- `src/shared/components/PreviewCanvas.tsx`
- `src/shared/components/ImageViewer.tsx`
- possibly `src/shared/components/ImageGrid.tsx` only if any filter state needs forwarding

### Existing components likely still used with smaller changes
- `src/features/borders/components/PresetSelector.tsx`
- `src/features/borders/components/BorderControls.tsx`
- `src/shared/components/ExportControls.tsx`

### New files likely
- `src/features/borders/filterPresets.ts`
- `src/features/borders/components/FilterControls.tsx`
- `src/features/borders/components/FilterControls.test.tsx`

---

## Testing Strategy

## Unit tests
1. preset resolution returns expected adjustment values
2. invalid persisted preset falls back to `original`
3. canvas filter string builder returns expected output
4. original preset produces neutral filters

## Rendering tests
1. filtered render applies canvas filter before drawing image
2. background/border remain unfiltered
3. compare mode swaps preview/viewer back to original rendering
4. export path still uses selected preset while compare is active in UI

## UI tests
1. left panel contains Images + Filters
2. right panel contains Size + Border + Export
3. mobile buttons are Edit / Output
4. preset chips change selected preset
5. Original / Reset works
6. compare control activates on hold and deactivates on release

---

## Risks / Watchouts

### 1. Preview/export mismatch
Biggest risk.
Avoid any preview-only CSS effect approach.
All real filters should come from the canvas pipeline.

### 2. Compare behavior complexity
Hold-to-compare can get messy if implemented with only simple click handlers.

Mitigation:
- use pointer events if practical
- ensure release/cancel states always clear compare mode
- keep compare local to preview/viewer state only

### 3. Preset naming churn
Preset names may change during review.

Mitigation:
- keep ids stable and labels easy to update
- separate internal ids from display labels if needed

### 4. Overbuilding the first pass
Temptation will be to add sliders immediately.

Mitigation:
- keep v1 preset-only
- keep adjustments internal only
- add manual controls later in a separate pass

---

## Recommended Implementation Order

1. reorganise left/right panel layout in `BorderToolPage`
2. update mobile labels and panel responsibilities
3. add filter preset types + preset definitions
4. extend persisted settings with `filterPresetId`
5. add filter resolution helper
6. add canvas filter builder/application in processing layer
7. add `FilterControls`
8. add compare state and wire it to preview + viewer only
9. update tests
10. final UI polish

---

## Bottom Line
This is a strong next feature.

The cleanest approach is:
- **preset-based filter UI**
- **adjustment-based internal model**
- **canvas-rendered source-image filtering**
- **temporary hold-to-compare state**
- clear separation of **Edit** vs **Output** panels

That gives a polished first pass while leaving room for future manual and per-image editing without needing to redesign the whole system.
