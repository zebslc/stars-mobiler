---
inclusion: always
---

# Stellar Remnants - Multi-Agent Development Guardrails

## Project Context
This is **Stellar Remnants**, a modernized Stars! 4X strategy game built with Angular 21. The project uses zoneless change detection, signals-first architecture, and is designed mobile-first.

## Critical Architecture Rules

### Angular Architecture
- **Zoneless + OnPush everywhere**: All components MUST use `ChangeDetectionStrategy.OnPush`
- **Signals-first**: Use `signal()`, `computed()`, `effect()` - avoid RxJS in app code except for library interop
- **Standalone components**: All components must be standalone with lazy `loadComponent` routes
- **Folder structure**: 
  - `app/core`: cross-cutting concerns (state stores, guards, config)
  - `app/shared`: reusable UI components and utilities  
  - `app/features`: feature/page components
  - `app/screens`: main screen components (already established)
  - `app/services`: business logic services
  - `app/models`: TypeScript interfaces and types
  - `app/data`: static game data

### State Management
- **Store pattern**: Logic lives in stores under `core/state` using signals
- **Component role**: Components read signals in templates, trigger actions via stores/services
- **No god classes**: Keep modules small and cohesive
- **DRY and YAGNI**: Avoid speculative abstractions

### Code Quality
- **Strong typing**: No `any` types allowed
- **ESLint + Prettier**: Must be enforced
- **Error boundaries**: Use simple boundary components per feature
- **No render path exceptions**: Signal state and render accordingly

## Game Domain Rules

### Core Game Concepts
- **Galaxy**: 1000×1000 coordinate space with Poisson-disc distribution
- **Stars**: 1-4 planets each, deterministic generation with seeds
- **Species**: 4 presets (Terrans, Crystallids, Pyreans, Voidborn) with habitat preferences
- **Habitability**: 2-axis calculation (temperature/atmosphere) with tolerance radius

### Implementation Phases
1. **Foundation** (Current): Galaxy generation, planet habitability, basic map UI
2. **Economy**: Population, production, mining, build queues
3. **Ships & Fleets**: Movement, fuel, colonization
4. **Combat & AI**: Battle resolution and AI opponents
5. **UI Screens**: Complete screen flow

## File Naming & Organization

### Component Files
- Use kebab-case: `galaxy-map.component.ts`
- Co-locate templates when small: inline templates preferred
- Separate `.html` files only for complex templates

### Service Files  
- Use kebab-case: `galaxy-generator.service.ts`
- Keep services focused on single responsibility

### Model Files
- Use kebab-case: `game.model.ts`
- Export interfaces, not classes for data models

### Spec Files
- Format: `YYYY-MM-DD-feature-name.md`
- Use template from `docs/specs/_template.md`
- Place in `docs/specs/`

## Testing Requirements
- Configure TestBed with `provideZonelessChangeDetection()`
- Prefer interaction-driven tests
- Avoid `fixture.detectChanges()` unless necessary

## Performance Guidelines
- Avoid global listeners - use component-bound listeners
- Keep templates simple - move complex logic to stores
- Lazy load all features
- Use OnPush change detection strategy

## Multi-Agent Consistency Rules

### Before Making Changes
1. **Read existing specs**: Check `docs/specs/` for feature requirements
2. **Follow folder structure**: Respect the established `app/` organization
3. **Check existing implementations**: Look for similar patterns in codebase
4. **Validate against guardrails**: Ensure changes align with these rules

### When Creating New Features
1. **Create spec first**: Use `docs/specs/_template.md`
2. **Follow signals pattern**: State in stores, components read signals
3. **Use standalone components**: No NgModules
4. **Implement OnPush**: All components must use OnPush strategy

### When Modifying Existing Code
1. **Preserve patterns**: Don't break existing architectural decisions
2. **Maintain consistency**: Follow established naming and structure
3. **Update specs**: Modify relevant spec files if behavior changes
4. **Test thoroughly**: Ensure zoneless change detection still works

## Common Pitfalls to Avoid
- Don't use NgZone or RxJS for core state management
- Don't create god components - keep them focused
- Don't use `any` types - maintain strong typing
- Don't break the folder structure - respect the organization
- Don't ignore the specs - they are the source of truth
- Don't use traditional change detection - stay zoneless + OnPush

## Reference Files
- Engineering rules: `docs/guardrails.md`
- Architecture overview: `ARCHITECTURE.md`
- Contributing guide: `CONTRIBUTING.md`
- Current specs: `docs/specs/README.md`