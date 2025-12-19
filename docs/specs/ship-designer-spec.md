# Ship Designer Specification (Angular 21 + Signals)

## 1. Purpose

This specification defines how the **Ship Designer** must operate. It is intended to be implemented in **Angular 21 using Signals** and must be sufficiently explicit that the UI can render, validate, and calculate ship designs deterministically from JSON templates.

The designer must support:
- Grid-based hull layouts
- Slot-based component installation
- Stackable components
- Fixed (non-editable) structural slots
- Cost and stat calculation
- Orbital structures and ship-building docks

---

## 2. Core Concepts

### 2.1 Template

A **Template** represents a hull blueprint. It is immutable at runtime and defines:
- The physical shape of the ship
- Where components may be installed
- Base cost and statistics

Key properties:
- `Name`
- `Structure`
- `Slots`
- `Cost`
- `Stats`

---

## 3. Structure Grid

### 3.1 Format

`Structure` is an array of strings.  
Each string is a **row**, containing comma-separated **cell codes**.

Example:
```
E1,E1,W1,W1
E1,E1,W1,W1
```

### 3.2 Cell Meaning

| Cell | Meaning |
|----|----|
| `.` | Empty space |
| `CODE` | Part of a slot |

All rows **must have equal column counts**.

---

## 4. Slot Geometry Rules

- Each slot code represents a **single logical slot**
- A slot occupies **exactly 4 cells (2×2)** unless explicitly extended in the future
- All cells sharing the same code belong to the same slot
- Slot cells do **not** overlap

Validation rule:
- Cell count per slot must be divisible by 4

---

## 5. Slot Definitions

Each entry in `Slots` defines how a slot behaves.

### 5.1 Slot Definition Contract

```ts
interface SlotDef {
  Code: string;
  Allowed: string[];
  Max?: number;
  Required?: boolean;
  Editable?: boolean;
  Size?: number | "Unlimited";
}
```

### 5.2 Meaning of `Max`

`Max` defines **stack capacity**, not number of slots.

Example:
```
W2 with Max = 6
```
Means:
- One physical weapon mount
- Up to 6 identical weapons
- Mixed weapon types are NOT allowed

---

## 6. Stack Rules

- Slots are **Single-Type Stack Slots**
- One component type per slot
- Quantity range: `1..Max`
- Quantity UI only appears when `Max > 1`

---

## 7. Editable vs Fixed Slots

### Editable Slots
- User selects component
- User selects quantity
- Enforced by `Allowed` and `Max`

### Fixed Slots (`Editable: false`)
- Cannot be changed
- Represent structural capacity (Cargo, Dock)
- Display-only

---

## 8. Cargo and Dock Slots

### Cargo
- Defined using `Allowed: ["Cargo"]`
- Must include `Size`
- Contributes to ship cargo capacity

### Dock
- Defined using `Allowed: ["Dock"]`
- `Size` may be numeric or `"Unlimited"`
- Used by stations / shipyards

---

## 9. Component Catalogue

```ts
interface ComponentDef {
  id: string;
  name: string;
  category: string;
  cost?: Partial<ResourceCost>;
  statsDelta?: Partial<ShipStats>;
}
```

Components must match slot `Allowed` categories.

---

## 10. Ship Design State

```ts
interface SlotInstall {
  code: string;
  componentId: string | null;
  quantity: number;
}

interface ShipDesign {
  templateName: string;
  installs: Record<string, SlotInstall>;
}
```

---

## 11. Required Slot Validation

If `Required: true`:
- Slot must contain a component
- Quantity must be >= 1
- Design cannot be saved otherwise

---

## 12. Cost Model

### 12.1 Base Cost

- Defined by template `Cost`
- Always included

### 12.2 Component Cost (Optional Extension)

If supported:
- Add `(component.cost * quantity)` for each slot

---

## 13. Ship Stats

```ts
interface ShipStats {
  Mass: number;
  MaxFuel: number;
  Armor: number;
  Cargo: number;
  Initiative: number;

  // Optional
  GenFuel?: number;
  Heal?: number;
  MineEfficiency?: number;
  DockCapacity?: number | "Unlimited";
  CanBuildShips?: boolean;
}
```

Stats may be:
- Template-only
- Template + component modifiers

---

## 14. Orbital & Station Rules

### Orbital Hulls
- `Mass = 0`
- No engines required
- Use `OE*` orbital cores

### Shipyards
If `CanBuildShips === true`:
- Display Shipyard badge
- Display DockCapacity
- Do not allow movement

---

## 15. Rendering Rules

### Grid
- Empty cells are blank
- Slot cells highlight as a group
- Hover highlights entire slot
- Click selects slot

### Slot Inspector
- Shows allowed components
- Shows quantity control if stackable
- Shows fixed info if non-editable

---

## 16. Angular 21 + Signals Architecture

### Signals

```ts
const templates = signal<ShipTemplate[]>([]);
const components = signal<ComponentDef[]>([]);

const selectedTemplateName = signal<string | null>(null);
const selectedSlotCode = signal<string | null>(null);
const design = signal<ShipDesign | null>(null);
```

### Derived State

```ts
const selectedTemplate = computed(() => ...);
const slotGroups = computed(() => ...);
const totalCost = computed(() => ...);
const totalStats = computed(() => ...);
const validationErrors = computed(() => ...);
```

---

## 17. Validation Summary

### Template Load-Time
- Rectangular structure
- All slot codes declared
- All slots present in structure
- Slot cell count valid

### Runtime
- Required slots filled
- Quantities within limits
- Category compatibility enforced

---

## 18. Naming Conventions

Stable prefixes are required for UI grouping:

- `E*` Engines
- `W*` Weapons
- `A*` Armour
- `S*` Shields
- `SC*` Scanner
- `EL*` Electronics
- `M*` Mining
- `MI*` Mines
- `C*` Cargo
- `SD*` Dock
- `OE*` Orbital Core

---

## 19. Non-Goals

The ship designer does **not**:
- Handle combat simulation
- Handle fleet logistics
- Handle docking assignments

It produces a **validated ship design object** only.

---

## 20. End of Specification
