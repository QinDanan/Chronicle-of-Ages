# Historical implementations

| Location | Contents |
| :--- | :--- |
| [Minute engine](engines/minute/README.md) | Retired v3 world generation and Core pipelines, tests, historical evaluations and replay fixtures |
| [UCM-Ω v2](engines/ucm-omega-v2/README.md) | Original v2 source package and checksum manifest |
| [Inference snapshot](snapshots/inference-20261112-53f7e71/README.md) | Original source snapshot and per-file checksums |
| [Previous frontend](frontend/index.html) | Application shell, timeline, styles and workspace settings from before the Studio redesign |

The complete pre-v4 repository is preserved at commit `297283c5adbf66ad2775027e4a0da5803cdaf041` on branch `archive/pre-prompt-llm-20261112`. The repository before this directory cleanup is preserved at commit `7f729880444b88cbb6e209702ca58d1c535eb2c7` on `archive/pre-cleanup-20261112`.

The previous frontend and its matching engine, assets and deployment configuration are preserved together on [`archive/frontend-before-studio-20261121`](https://github.com/QinDanan/Chronicle-of-Ages/tree/archive/frontend-before-studio-20261121) at commit `ce06a941c828cf27687f27820b71e98e4884cdfb`.

Frozen source packages and their manifests retain their original bytes and checksums. The unpacked Minute modules have relative imports updated for this layout and reuse the existing storage validator. Their tests run from the repository root with `npm run test:archive` and are included in `npm test`.

Historical evaluation data and screenshots describe their original implementations. They are not measurements of the current engine. Production modules do not import archived generators, and the Pages artifact excludes this directory.
