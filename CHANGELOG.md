# Changelog

## 1.0.0 (2026-08-13)


### Features

* add Browse/Inspect workspace modes with dedicated views ([4022b24](https://github.com/LightBreakfast/photomoat/commit/4022b249fbf1823503de90e4f65e2ba559a10602))
* add export settings and filename patterns ([9befe27](https://github.com/LightBreakfast/photomoat/commit/9befe27e10e58519398399eb43c741279b5666bc))
* add fixed-sides image sizing mode with exact width padding ([6499d41](https://github.com/LightBreakfast/photomoat/commit/6499d418389578a1084d08b61c380f6864159bab))
* add fixed-sides image sizing mode with exact width padding ([4025952](https://github.com/LightBreakfast/photomoat/commit/40259526e011d6ee3a71f8c78eed631cf6a99ee0))
* add no-border fill mode and custom export size ([a6fcb84](https://github.com/LightBreakfast/photomoat/commit/a6fcb84ea9520903674a676f7b1743759ddaeabe))
* add no-border fill mode and custom export size ([97d4b3f](https://github.com/LightBreakfast/photomoat/commit/97d4b3f766c29992f59aecd19c65426eb33f9e29))
* add per-image rotation and flip support ([38ff0f4](https://github.com/LightBreakfast/photomoat/commit/38ff0f491d8c501aff3b2f5eca032f4145cc9ddb))
* add per-image rotation and flip support ([ae2625d](https://github.com/LightBreakfast/photomoat/commit/ae2625da8f3585b7693215014d69bc7055003781))
* add per-image undo/redo with history panel ([a546b7d](https://github.com/LightBreakfast/photomoat/commit/a546b7dbb68ff408623470a8ca73c95089cd4322))
* change default border to portrait fixed-sides (width 120, height 30) ([0bd7c3d](https://github.com/LightBreakfast/photomoat/commit/0bd7c3db3ccfed10486633189d0cc801cf890613))
* change default border to portrait fixed-sides (width 120, height 30) ([4929f9a](https://github.com/LightBreakfast/photomoat/commit/4929f9aa6e1100e22b75108138af1bda193553e1))
* export settings — split button, filename patterns, folder name ([4e9a59e](https://github.com/LightBreakfast/photomoat/commit/4e9a59e8674a47d8acfab04fecbd4971b7d4773a)), closes [#15](https://github.com/LightBreakfast/photomoat/issues/15)
* folder-name tokens, cleaner dialog footer, badge a11y ([e8e2ef1](https://github.com/LightBreakfast/photomoat/commit/e8e2ef120429d7e753bb1756de70a3ca9dc52945))
* IndexedDB storage layer for session persistence ([240a757](https://github.com/LightBreakfast/photomoat/commit/240a7576882c6f4298ff934e929edf3ec7c652f2))
* per-image undo/redo with history panel ([a50fdaf](https://github.com/LightBreakfast/photomoat/commit/a50fdafd2a43adccd3903aee61a71de73b7dcb3e))
* queue write-through + restore, and edit-history hydration ([84bcab4](https://github.com/LightBreakfast/photomoat/commit/84bcab4508385ed4a2dcb4c97766ec352e9e2676))
* replace text heading with theme-aware SVG logo ([583b0d3](https://github.com/LightBreakfast/photomoat/commit/583b0d312c1d126fe3eae26196e1d1cac3943684))
* replace text heading with theme-aware SVG logo ([74f6406](https://github.com/LightBreakfast/photomoat/commit/74f64069e46123adcbba1e9c7c341096b63b31b6))
* restore banner + BorderToolPage session wiring ([a9a14a5](https://github.com/LightBreakfast/photomoat/commit/a9a14a59b75bb7746999cc344c03ae3348e0f30c))
* **src:** add border filter controls and compare preview ([5578875](https://github.com/LightBreakfast/photomoat/commit/5578875319033aeee5d2c2a45ac21d323d7930f1))
* useSessionPersistence — save/restore lifecycle state machine ([5c7915e](https://github.com/LightBreakfast/photomoat/commit/5c7915e90a80509ff0adb69ec208b16cf671345b))


### Bug Fixes

* guard session restore and pending file cleanup ([ef2e9b6](https://github.com/LightBreakfast/photomoat/commit/ef2e9b6682efcfc3c03ceaddb7304b8ea5a5887b))
* improve export settings hierarchy and theme token contrast ([a1803b9](https://github.com/LightBreakfast/photomoat/commit/a1803b9dfb7f17c0357ec6df5c95f3deb9db561d)), closes [#15](https://github.com/LightBreakfast/photomoat/issues/15)
* make session persistence writes race-safe ([a8ddcde](https://github.com/LightBreakfast/photomoat/commit/a8ddcdefb757977efb8d7ecf007b85a732183d03))
* remove empty scrollbar gutters ([604802e](https://github.com/LightBreakfast/photomoat/commit/604802e83b3a014feafdc8c480ff3668a6e3a2c2))
* resolve session-persistence code review findings ([981f74f](https://github.com/LightBreakfast/photomoat/commit/981f74f311f292f09156da55649e9aabd0e643bc))
* review findings — dialog settings, unique ZIP entries, flat paths ([bd96687](https://github.com/LightBreakfast/photomoat/commit/bd96687e35bfaaf1398e396210b3156edb7befb9)), closes [#15](https://github.com/LightBreakfast/photomoat/issues/15)


### Performance Improvements

* compose source transforms directly, no intermediate canvas ([c6a15ec](https://github.com/LightBreakfast/photomoat/commit/c6a15ec2d8710b798d14670718fb5caecc538a59))
