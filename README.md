# root-geo-tree-editor

Navigate, search, and edit [CERN ROOT](https://root.cern/) TGeo geometry trees in JavaScript/TypeScript. Works with geometry structures produced by [JSROOT](https://root.cern/js/).

## Install

```bash
npm install @dexvis/root-geo-tree-editor
```

## Node structure

The library operates on ROOT TGeo node objects with this shape:

```
node.fName           — node name
node.fVolume         — associated volume (contains fNodes, fGeoAtt)
node.fMasterVolume   — master volume (used instead of fVolume when present)
node.fMother         — parent volume
node.fVolume.fNodes.arr — child nodes array
node.fVolume.fGeoAtt    — visibility attribute bitmask
```

Full paths are built as `"Root/Child/GrandChild"` during traversal.

## API

### Navigation

#### `walkGeoNodes(node, callback, maxLevel?, level?, path?, pattern?)`

Recursively traverses the geometry tree. The callback receives each node, its full path, and depth level. Return `false` from the callback to stop descending into children.

```ts
import { walkGeoNodes } from '@dexvis/root-geo-tree-editor';

// Count all nodes up to depth 3
let count = walkGeoNodes(topNode, null, 3);

// Walk with a callback
walkGeoNodes(topNode, (node, fullPath, level) => {
  console.log(`${fullPath} (level ${level})`);
  return true; // continue into children
}, Infinity);

// Walk only nodes matching a wildcard pattern
walkGeoNodes(topNode, (node, fullPath, level) => {
  console.log('Matched:', fullPath);
  return true;
}, Infinity, 0, "", "*Tracker*");
```

#### `findGeoNodes(node, pattern, maxLevel?)`

Finds all nodes whose full path matches a wildcard pattern. Returns `{ geoNode, fullPath }[]`.

```ts
import { findGeoNodes } from '@dexvis/root-geo-tree-editor';

const results = findGeoNodes(topNode, "*Calorimeter*");
results.forEach(r => console.log(r.fullPath));

// Limit search depth
const shallow = findGeoNodes(topNode, "*Child*", 2);
```

#### `findSingleGeoNode(topNode, pattern, maxLevel?)`

Returns a single matching node or `null`. Throws if more than one node matches.

```ts
import { findSingleGeoNode } from '@dexvis/root-geo-tree-editor';

const node = findSingleGeoNode(topNode, "*InnerTracker*");
```

#### `getGeoNodesByLevel(topNode, selectLevel?)`

Collects all nodes at a specific depth. Returns `{ geoNode, fullPath }[]`.

```ts
import { getGeoNodesByLevel } from '@dexvis/root-geo-tree-editor';

// Get all level-1 (direct children) nodes
const children = getGeoNodesByLevel(topNode, 1);
```

#### `analyzeGeoNodes(node)`

Logs a summary of top-level subcomponents and their total descendant counts.

```ts
import { analyzeGeoNodes } from '@dexvis/root-geo-tree-editor';

analyzeGeoNodes(geoManager.fMasterVolume);
// Output:
//   --- Detector subcomponents [num]-[name]: 5
//     12034: Root/Tracker
//     8921: Root/Calorimeter
//     ...
//   --- End of analysis --- Total elements: 34210
```

#### `findGeoManager(file)`

Finds and reads the `TGeoManager` object from a ROOT file.

```ts
import { findGeoManager } from '@dexvis/root-geo-tree-editor';

const geoManager = await findGeoManager(file);
const topNode = geoManager.fMasterVolume;
```

### Editing

#### `EditActions` enum

| Action | Description |
|---|---|
| `Nothing` | No action |
| `Remove` | Remove the matched node from its parent |
| `RemoveSiblings` | Keep only the matched node, remove its siblings |
| `RemoveChildren` | Remove all children of the matched node |
| `RemoveBySubLevel` | Remove descendants below N levels (set `pruneSubLevel`) |
| `SetGeoBit` | Set a visibility bit on the node's volume |
| `UnsetGeoBit` | Clear a visibility bit |
| `ToggleGeoBit` | Toggle a visibility bit |

#### `GeoNodeEditRule`

```ts
class GeoNodeEditRule {
  pattern: string;                    // wildcard pattern to match node paths
  action?: EditActions;               // action to perform
  pruneSubLevel?: number;             // depth for RemoveBySubLevel
  geoBit?: GeoAttBits;               // bit for Set/Unset/ToggleGeoBit actions
  childrenRules?: GeoNodeEditRule[];  // rules applied to children first
  childrenRulesMaxLevel?: number;     // max depth for children rules
}
```

#### `editGeoNodes(topNode, rules, maxLevel?)`

Applies edit rules to matching nodes in the geometry tree.

```ts
import { editGeoNodes, EditActions, GeoNodeEditRule } from '@dexvis/root-geo-tree-editor';
import { GeoAttBits } from '@dexvis/root-geo-tree-editor';

// Remove specific nodes
editGeoNodes(topNode, [
  { pattern: "*/SupportStructure*", action: EditActions.Remove }
]);

// Keep only one subdetector, remove its siblings
editGeoNodes(topNode, [
  { pattern: "*/Tracker", action: EditActions.RemoveSiblings }
]);

// Remove all children of a node
editGeoNodes(topNode, [
  { pattern: "*/Beampipe", action: EditActions.RemoveChildren }
]);

// Set visibility on matched nodes
editGeoNodes(topNode, [
  {
    pattern: "*/Tracker",
    action: EditActions.SetGeoBit,
    geoBit: GeoAttBits.kVisThis
  }
]);

// Nested rules: apply children rules before the main action
editGeoNodes(topNode, [
  {
    pattern: "*/Calorimeter",
    action: EditActions.Nothing,
    childrenRules: [
      { pattern: "*/Absorber*", action: EditActions.Remove }
    ],
    childrenRulesMaxLevel: 3
  }
]);
```

#### `removeGeoNode(node)` / `removeChildren(node)`

Low-level helpers to remove a single node from its parent or clear all children.

```ts
import { removeGeoNode, removeChildren } from '@dexvis/root-geo-tree-editor';

removeGeoNode(someNode);   // splices node out of parent's array
removeChildren(someNode);  // empties node's children array
```

### Attribute Bits

#### `GeoAttBits` enum

Maps to ROOT's [TGeoAtt](https://root.cern/doc/master/classTGeoAtt.html) visibility flags:

| Flag | Description |
|---|---|
| `kVisOverride` | Volume's visibility attributes are overwritten |
| `kVisNone` | Volume and daughters are invisible |
| `kVisThis` | This volume is visible |
| `kVisDaughters` | All leaves are visible |
| `kVisOneLevel` | First-level daughters are visible |
| `kVisContainers` | All containers visible |
| `kVisOnly` | Only this volume visible |
| `kVisBranch` | Only a given branch visible |
| `kVisRaytrace` | Raytracing flag |

#### `testGeoBit(volume, flag)` / `setGeoBit(volume, flag, value)` / `toggleGeoBit(volume, flag)`

Read, set, or toggle individual visibility bits on a volume's `fGeoAtt`.

```ts
import { GeoAttBits, testGeoBit, setGeoBit, toggleGeoBit } from '@dexvis/root-geo-tree-editor';

if (!testGeoBit(volume, GeoAttBits.kVisThis)) {
  setGeoBit(volume, GeoAttBits.kVisThis, 1);  // make visible
}

toggleGeoBit(volume, GeoAttBits.kVisDaughters);

setGeoBit(volume, GeoAttBits.kVisNone, 0);  // clear "invisible" flag
```

#### `printAllGeoBitsStatus(volume)`

Logs the state of all visibility flags for a volume.

```ts
import { printAllGeoBitsStatus } from '@dexvis/root-geo-tree-editor';

printAllGeoBitsStatus(volume);
// kVisOverride  : No
// kVisNone      : No
// kVisThis      : Yes
// ...
```

## Wildcard patterns

Pattern matching uses `*` (any characters) and `?` (single character) against full node paths.

| Pattern | Matches |
|---|---|
| `*Tracker*` | Any path containing "Tracker" |
| `*/Child1` | Direct or nested node named "Child1" |
| `Root/*/Sensor?` | "Sensor" + one char, two levels below Root |

## License

MIT
