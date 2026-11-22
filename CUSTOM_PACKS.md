# Custom level packs

Save the [starter pack's `pack.json`](examples/starter-pack/pack.json), edit it, and optionally add PNG artwork to an `assets/` folder alongside it. ZIP the contents so `pack.json` is at the archive root, then choose **Import ZIP** under **Custom level packs**, below Sandbox. Select a pack's name to show or hide its levels. The up and down chevrons change the pack order.

## Identity and sections

| Field           | Meaning                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------ |
| `formatVersion` | Pack format version. Use the number `1`.                                                                           |
| `author-id`     | A stable author identifier, such as a username, a generated ID, or an email address. It appears in the level menu. |
| `id`            | A stable ID for this pack, using letters, digits, underscores, or hyphens.                                         |
| `name`          | The displayed pack name.                                                                                           |
| `version`       | Optional version string for this edition of your pack.                                                             |
| `sections`      | An ordered list of sections. Each has a `name` and a `levels` array.                                               |
| `gates`         | Optional list of new gates defined by this pack.                                                                   |

The unique identifier is `<author-id>/<id>`. It is case-sensitive and independent of `name` and `version`. The author ID starts with a letter or digit and can also contain `_`, `-`, `.`, `+`, and `@`. Importing a second ZIP with the same identifier shows a warning and keeps the installed pack.

This example puts a puzzle and a sandbox in separate sections. Solving the puzzle unlocks the sandbox.

```json
{
  "formatVersion": 1,
  "author-id": "qubit-lab",
  "id": "first-pack",
  "name": "First pack",
  "version": "1.0.0",
  "sections": [
    {
      "name": "Puzzles",
      "levels": [
        {
          "id": 1,
          "description": "Flip a qubit",
          "task": "Use the [b]Pauli-X[/b] gate to make [i]|1⟩[/i].",
          "input": { "kind": "basis", "bits": [0] },
          "goal": {
            "kind": "amplitude",
            "amplitudes": [
              [0, 0],
              [1, 0]
            ]
          },
          "gates": ["empty", "x"]
        }
      ]
    },
    {
      "name": "Practice",
      "levels": [
        {
          "id": 2,
          "description": "Free practice",
          "unlockAfter": [1],
          "task": "Build any circuit.",
          "input": { "kind": "basis", "bits": [0, 0] },
          "goal": null,
          "gates": ["empty", "h", "x", "control"]
        }
      ]
    }
  ]
}
```

## Level definitions

- Give each level a nonnegative integer `id` unique within its pack. Different packs can reuse the same level IDs.
- For a basis input, set `input.kind` to `"basis"` and list the `bits` from the top wire to the bottom. For a custom quantum state, use `{"kind":"state","qubits":2,"amplitudes":[[1,0],[0,0],[0,0],[0,0]]}`.
- Each amplitude is a JSON pair `[real, imaginary]`. List amplitudes in binary order, from `|00⟩` through `|11⟩` for two qubits. Input state and goal amplitudes must have unit norm.
- A goal of kind `"amplitude"` compares the complex coefficients. A goal of kind `"probability"` compares the squared magnitudes. Use `null` for a sandbox.
- Use optional `unlockAfter` to require the player to solve specific puzzles in this pack. For example, `"unlockAfter": [1, 3]` requires both puzzles 1 and 3. Prerequisites can refer to puzzles in any section. Each ID must be unique in the list, and the dependencies must be acyclic.
- Use `gates` to list the available gate IDs, including `empty` for erasing. The built-in IDs are `empty`, `h`, `x`, `y`, `z`, `control`, and `s`.
- Use optional `locked` entries in the form `[row, column, gateId]`. Coordinates are zero-based. Levels support 1–4 qubits and 12 columns. Locked cells can use any gate defined in the pack or built into the game.
- `task` and optional `help` support `[b]bold[/b]`, `[i]math[/i]`, and `[code]monospace[/code]`. Supply `help` as an array of strings, including any line breaks between parts.

Levels with no prerequisites are available as soon as the pack is imported. **Next Level** goes to the next available puzzle in section order. The profile saves completions by pack identifier and level ID.

## Custom gates and artwork

Add a gate to the root `gates` array. For example, a gate labeled **F** that flips a qubit can be defined as follows:

```json
{
  "id": "flip",
  "name": "Bit flip",
  "symbol": "F",
  "matrix": [
    [
      [0, 0],
      [1, 0]
    ],
    [
      [1, 0],
      [0, 0]
    ]
  ]
}
```

Use `"flip"` in a level's palette or locked cells. The 2×2 unitary matrix is written in row-major order, and each entry is `[real, imaginary]`. Column 0 describes the output for `|0⟩`, and column 1 describes the output for `|1⟩`. Custom gates respond to same-column control nodes just like built-in gates.

The `symbol` string appears inside a rounded gate box. To show your own artwork, add `"image": "assets/flip.png"` to the gate in `pack.json` and place that PNG in the ZIP.

After import, the local profile stores the gate definition with its image as a Base64 data URL. In this saved gate example, `...` stands for the encoded PNG bytes.

```json
{
  "id": "flip",
  "name": "Bit flip",
  "symbol": "F",
  "matrix": [
    [
      [0, 0],
      [1, 0]
    ],
    [
      [1, 0],
      [0, 0]
    ]
  ],
  "image": "data:image/png;base64,..."
}
```

On the web, the profile uses IndexedDB where available. Installed apps use the Tauri profile store.

Each ZIP supports up to 128 entries and 8 MiB of extracted pack data. `pack.json` can be up to 256 KiB. Images can be up to 512 KiB and 512 × 512 pixels each. A pack can have up to 32 sections, 128 levels total, and 32 custom gates.

The built-in level definitions are in [levels.json](packages/core/src/levels.json).
