import type { OutputPreset, OutputPresetId } from '@/shared/types'

export const instagramPresets: OutputPreset[] = [
  {
    id: 'instagram-square',
    label: 'Square Post',
    width: 1080,
    height: 1080,
  },
  {
    id: 'instagram-portrait',
    label: 'Portrait Post',
    width: 1080,
    height: 1350,
  },
  {
    id: 'instagram-landscape',
    label: 'Landscape Post',
    width: 1080,
    height: 566,
  },
  {
    id: 'instagram-story',
    label: 'Story / Reel',
    width: 1080,
    height: 1920,
  },
]

export function getPresetById(presetId: OutputPresetId) {
  return instagramPresets.find((preset) => preset.id === presetId) ?? instagramPresets[0]
}
