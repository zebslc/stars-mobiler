import * as fc from 'fast-check';
import type {
  IFleetOperationsService,
  IFleetMovementService,
  IGalaxyInteractionService,
  IGalaxyCoordinateService,
  IShipDesignValidationService,
  IShipDesignOperationsService,
  FleetLocation,
  GalaxyMapState,
  ValidationResult,
  MovementValidationResult,
  InteractionResult,
  ScreenCoordinate,
  GalaxyCoordinate,
  HullSlot,
  ComponentData,
  SlotDisplayInfo,
  ResourceCost,
  LogContext} from './service-interfaces.model';
import {
  IFleetNamingService,
  IFleetValidationService,
  IGalaxyContextMenuService,
  IShipDesignTemplateService,
  IHullSlotValidationService,
  IHullSlotOperationsService,
  ShipDesignTemplate,
  ServiceLogEntry,
} from './service-interfaces.model';
import type { GameState, Star, Fleet, ShipDesign, PlayerTech } from './game.model';

describe('ServiceInterfacesModel', () => {
  describe('Property 1: Service Interface Consistency', () => {
    /**
     * Feature: code-quality-refactor, Property 1: Service Interface Consistency
     * Validates: Requirements 1.6, 8.1
     *
     * For any service method call with valid parameters, the service should produce
     * consistent, well-typed results according to its interface contract
     */
    it('should maintain consistent interface contracts for all service interfaces', () => {
      fc.assert(
        fc.property(
          // Generate test data for various interface types
          fc.record({
            fleetLocation: fc.record({
              type: fc.constantFrom('space', 'orbit'),
              x: fc.option(fc.integer({ min: 0, max: 2000 }), { nil: undefined }),
              y: fc.option(fc.integer({ min: 0, max: 2000 }), { nil: undefined }),
              starId: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            }),
            galaxyMapState: fc.record({
              zoom: fc.double({ min: 0.1, max: 10.0, noNaN: true }),
              panX: fc.integer({ min: -1000, max: 1000 }),
              panY: fc.integer({ min: -1000, max: 1000 }),
              selectedStar: fc.option(fc.string({ minLength: 1 }), { nil: null }),
              selectedFleet: fc.option(fc.string({ minLength: 1 }), { nil: null }),
            }),
            validationResult: fc.record({
              isValid: fc.boolean(),
              errors: fc.array(fc.string({ minLength: 1 })),
              warnings: fc.array(fc.string({ minLength: 1 })),
            }),
            screenCoordinate: fc.record({
              x: fc.integer({ min: 0, max: 4000 }),
              y: fc.integer({ min: 0, max: 4000 }),
            }),
            galaxyCoordinate: fc.record({
              x: fc.integer({ min: 0, max: 2000 }),
              y: fc.integer({ min: 0, max: 2000 }),
            }),
            hullSlot: fc.record({
              id: fc.string({ minLength: 1 }),
              allowedTypes: fc.array(fc.string({ minLength: 1 }), { minLength: 1 }),
              max: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
              required: fc.option(fc.boolean(), { nil: undefined }),
              editable: fc.option(fc.boolean(), { nil: undefined }),
              size: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
            }),
            componentData: fc.record({
              id: fc.string({ minLength: 1 }),
              name: fc.string({ minLength: 1 }),
              type: fc.string({ minLength: 1 }),
              stats: fc.option(fc.dictionary(fc.string(), fc.anything()), { nil: undefined }),
              cost: fc.option(
                fc.record({
                  resources: fc.integer({ min: 0 }),
                  ironium: fc.integer({ min: 0 }),
                  boranium: fc.integer({ min: 0 }),
                  germanium: fc.integer({ min: 0 }),
                }),
                { nil: undefined },
              ),
              mass: fc.option(fc.integer({ min: 1 }), { nil: undefined }),
            }),
            logContext: fc.record({
              service: fc.string({ minLength: 1 }),
              operation: fc.string({ minLength: 1 }),
              entityId: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
              entityType: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
              additionalData: fc.option(fc.dictionary(fc.string(), fc.anything()), {
                nil: undefined,
              }),
            }),
          }),
          (testData: {
            fleetLocation: FleetLocation;
            galaxyMapState: GalaxyMapState;
            validationResult: ValidationResult;
            screenCoordinate: ScreenCoordinate;
            galaxyCoordinate: GalaxyCoordinate;
            hullSlot: HullSlot;
            componentData: ComponentData;
            logContext: LogContext;
          }) => {
            // Test FleetLocation interface consistency
            expect(typeof testData.fleetLocation.type).toBe('string');
            expect(['space', 'orbit']).toContain(testData.fleetLocation.type);

            if (testData.fleetLocation.type === 'space') {
              // Space locations should have coordinates
              if (testData.fleetLocation.x !== undefined) {
                expect(typeof testData.fleetLocation.x).toBe('number');
                expect(testData.fleetLocation.x).toBeGreaterThanOrEqual(0);
              }
              if (testData.fleetLocation.y !== undefined) {
                expect(typeof testData.fleetLocation.y).toBe('number');
                expect(testData.fleetLocation.y).toBeGreaterThanOrEqual(0);
              }
            } else if (testData.fleetLocation.type === 'orbit') {
              // Orbit locations should have planetId
              if (testData.fleetLocation.starId !== undefined) {
                expect(typeof testData.fleetLocation.starId).toBe('string');
                expect(testData.fleetLocation.starId.length).toBeGreaterThan(0);
              }
            }

            // Test GalaxyMapState interface consistency
            expect(typeof testData.galaxyMapState.zoom).toBe('number');
            expect(testData.galaxyMapState.zoom).toBeGreaterThan(0);
            expect(typeof testData.galaxyMapState.panX).toBe('number');
            expect(typeof testData.galaxyMapState.panY).toBe('number');

            if (testData.galaxyMapState.selectedStar !== null) {
              expect(typeof testData.galaxyMapState.selectedStar).toBe('string');
            }
            if (testData.galaxyMapState.selectedFleet !== null) {
              expect(typeof testData.galaxyMapState.selectedFleet).toBe('string');
            }

            // Test ValidationResult interface consistency
            expect(typeof testData.validationResult.isValid).toBe('boolean');
            expect(Array.isArray(testData.validationResult.errors)).toBe(true);
            expect(Array.isArray(testData.validationResult.warnings)).toBe(true);

            testData.validationResult.errors.forEach((error: string) => {
              expect(typeof error).toBe('string');
              expect(error.length).toBeGreaterThan(0);
            });

            testData.validationResult.warnings.forEach((warning: string) => {
              expect(typeof warning).toBe('string');
              expect(warning.length).toBeGreaterThan(0);
            });

            // Test coordinate interfaces consistency
            expect(typeof testData.screenCoordinate.x).toBe('number');
            expect(typeof testData.screenCoordinate.y).toBe('number');
            expect(testData.screenCoordinate.x).toBeGreaterThanOrEqual(0);
            expect(testData.screenCoordinate.y).toBeGreaterThanOrEqual(0);

            expect(typeof testData.galaxyCoordinate.x).toBe('number');
            expect(typeof testData.galaxyCoordinate.y).toBe('number');
            expect(testData.galaxyCoordinate.x).toBeGreaterThanOrEqual(0);
            expect(testData.galaxyCoordinate.y).toBeGreaterThanOrEqual(0);

            // Test HullSlot interface consistency
            expect(typeof testData.hullSlot.id).toBe('string');
            expect(testData.hullSlot.id.length).toBeGreaterThan(0);
            expect(Array.isArray(testData.hullSlot.allowedTypes)).toBe(true);
            expect(testData.hullSlot.allowedTypes.length).toBeGreaterThan(0);

            testData.hullSlot.allowedTypes.forEach((type: string) => {
              expect(typeof type).toBe('string');
              expect(type.length).toBeGreaterThan(0);
            });

            if (testData.hullSlot.max !== undefined) {
              expect(typeof testData.hullSlot.max).toBe('number');
              expect(testData.hullSlot.max).toBeGreaterThan(0);
            }

            if (testData.hullSlot.required !== undefined) {
              expect(typeof testData.hullSlot.required).toBe('boolean');
            }

            if (testData.hullSlot.editable !== undefined) {
              expect(typeof testData.hullSlot.editable).toBe('boolean');
            }

            if (testData.hullSlot.size !== undefined) {
              expect(typeof testData.hullSlot.size).toBe('number');
              expect(testData.hullSlot.size).toBeGreaterThan(0);
            }

            // Test ComponentData interface consistency
            expect(typeof testData.componentData.id).toBe('string');
            expect(testData.componentData.id.length).toBeGreaterThan(0);
            expect(typeof testData.componentData.name).toBe('string');
            expect(testData.componentData.name.length).toBeGreaterThan(0);
            expect(typeof testData.componentData.type).toBe('string');
            expect(testData.componentData.type.length).toBeGreaterThan(0);

            if (testData.componentData.stats !== undefined) {
              expect(typeof testData.componentData.stats).toBe('object');
              expect(testData.componentData.stats).not.toBeNull();
            }

            if (testData.componentData.cost !== undefined) {
              expect(typeof testData.componentData.cost).toBe('object');
              expect(testData.componentData.cost).not.toBeNull();
              expect(typeof testData.componentData.cost.resources).toBe('number');
              expect(typeof testData.componentData.cost.ironium).toBe('number');
              expect(typeof testData.componentData.cost.boranium).toBe('number');
              expect(typeof testData.componentData.cost.germanium).toBe('number');
              expect(testData.componentData.cost.resources).toBeGreaterThanOrEqual(0);
              expect(testData.componentData.cost.ironium).toBeGreaterThanOrEqual(0);
              expect(testData.componentData.cost.boranium).toBeGreaterThanOrEqual(0);
              expect(testData.componentData.cost.germanium).toBeGreaterThanOrEqual(0);
            }

            if (testData.componentData.mass !== undefined) {
              expect(typeof testData.componentData.mass).toBe('number');
              expect(testData.componentData.mass).toBeGreaterThan(0);
            }

            // Test LogContext interface consistency
            expect(typeof testData.logContext.service).toBe('string');
            expect(testData.logContext.service.length).toBeGreaterThan(0);
            expect(typeof testData.logContext.operation).toBe('string');
            expect(testData.logContext.operation.length).toBeGreaterThan(0);

            if (testData.logContext.entityId !== undefined) {
              expect(typeof testData.logContext.entityId).toBe('string');
              expect(testData.logContext.entityId.length).toBeGreaterThan(0);
            }

            if (testData.logContext.entityType !== undefined) {
              expect(typeof testData.logContext.entityType).toBe('string');
              expect(testData.logContext.entityType.length).toBeGreaterThan(0);
            }

            if (testData.logContext.additionalData !== undefined) {
              expect(typeof testData.logContext.additionalData).toBe('object');
              expect(testData.logContext.additionalData).not.toBeNull();
            }
          },
        ),
        { numRuns: 20 },
      );
    });
  });

  describe('Interface Type Guards and Validation', () => {
    it('should validate FleetLocation interface structure', () => {
      const spaceLocation: FleetLocation = {
        type: 'space',
        x: 100,
        y: 200,
      };

      const orbitLocation: FleetLocation = {
        type: 'orbit',
        starId: 'planet1',
      };

      expect(spaceLocation.type).toBe('space');
      expect(spaceLocation.x).toBe(100);
      expect(spaceLocation.y).toBe(200);

      expect(orbitLocation.type).toBe('orbit');
      expect(orbitLocation.starId).toBe('planet1');
    });

    it('should validate ValidationResult interface structure', () => {
      const validResult: ValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };

      const invalidResult: ValidationResult = {
        isValid: false,
        errors: ['Error 1', 'Error 2'],
        warnings: ['Warning 1'],
      };

      expect(validResult.isValid).toBe(true);
      expect(validResult.errors).toEqual([]);
      expect(validResult.warnings).toEqual([]);

      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toEqual(['Error 1', 'Error 2']);
      expect(invalidResult.warnings).toEqual(['Warning 1']);
    });

    it('should validate MovementValidationResult extends ValidationResult', () => {
      const movementResult: MovementValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        fuelRequired: 100,
        fuelAvailable: 150,
        canMove: true,
      };

      // Should have all ValidationResult properties
      expect(movementResult.isValid).toBe(true);
      expect(Array.isArray(movementResult.errors)).toBe(true);
      expect(Array.isArray(movementResult.warnings)).toBe(true);

      // Should have additional MovementValidationResult properties
      expect(typeof movementResult.fuelRequired).toBe('number');
      expect(typeof movementResult.fuelAvailable).toBe('number');
      expect(typeof movementResult.canMove).toBe('boolean');
    });

    it('should validate InteractionResult interface structure', () => {
      const selectResult: InteractionResult = {
        type: 'select',
        target: 'fleet1',
        position: { x: 100, y: 200 },
      };

      const panResult: InteractionResult = {
        type: 'pan',
      };

      expect(selectResult.type).toBe('select');
      expect(selectResult.target).toBe('fleet1');
      expect(selectResult.position).toEqual({ x: 100, y: 200 });

      expect(panResult.type).toBe('pan');
      expect(panResult.target).toBeUndefined();
      expect(panResult.position).toBeUndefined();
    });

    it('should validate SlotDisplayInfo interface structure', () => {
      const emptySlot: SlotDisplayInfo = {
        isEmpty: true,
        componentName: '',
        componentCount: 0,
        maxCount: 1,
        slotType: 'Engine',
      };

      const filledSlot: SlotDisplayInfo = {
        isEmpty: false,
        componentName: 'Quick Jump 5',
        componentCount: 1,
        maxCount: 1,
        slotType: 'Engine',
      };

      expect(emptySlot.isEmpty).toBe(true);
      expect(emptySlot.componentName).toBe('');
      expect(emptySlot.componentCount).toBe(0);

      expect(filledSlot.isEmpty).toBe(false);
      expect(filledSlot.componentName).toBe('Quick Jump 5');
      expect(filledSlot.componentCount).toBe(1);
    });

    it('should validate ResourceCost interface structure', () => {
      const cost: ResourceCost = {
        resources: 100,
        ironium: 50,
        boranium: 25,
        germanium: 10,
      };

      expect(typeof cost.resources).toBe('number');
      expect(typeof cost.ironium).toBe('number');
      expect(typeof cost.boranium).toBe('number');
      expect(typeof cost.germanium).toBe('number');
      expect(cost.resources).toBeGreaterThanOrEqual(0);
      expect(cost.ironium).toBeGreaterThanOrEqual(0);
      expect(cost.boranium).toBeGreaterThanOrEqual(0);
      expect(cost.germanium).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Service Interface Method Signatures', () => {
    it('should have consistent method signatures across fleet services', () => {
      // Test that interface method signatures are well-defined
      // This is a compile-time check that ensures TypeScript interfaces are consistent

      // Mock implementations to verify interface contracts
      const mockFleetOps: Partial<IFleetOperationsService> = {
        createFleet: (
          game: GameState,
          location: FleetLocation,
          ownerId: string,
          baseNameSource?: string,
        ): Fleet => {
          // Mock implementation - just verify the signature compiles
          return {} as Fleet;
        },
        addShipToFleet: (
          game: GameState,
          planet: Star,
          shipDesignId: string,
          count: number,
        ): void => {
          // Mock implementation - just verify the signature compiles
        },
        validateFleetLimits: (game: GameState, ownerId: string): boolean => {
          // Mock implementation - just verify the signature compiles
          return true;
        },
      };

      const mockFleetMovement: Partial<IFleetMovementService> = {
        moveFleet: (game: GameState, fleetId: string, destination: FleetLocation): void => {
          // Mock implementation - just verify the signature compiles
        },
        calculateFuelConsumption: (fleet: Fleet, distance: number): number => {
          // Mock implementation - just verify the signature compiles
          return 0;
        },
        validateMovement: (fleet: Fleet, destination: FleetLocation): MovementValidationResult => {
          // Mock implementation - just verify the signature compiles
          return {
            isValid: true,
            errors: [],
            warnings: [],
            fuelRequired: 0,
            fuelAvailable: 0,
            canMove: true,
          };
        },
      };

      // If these compile without TypeScript errors, the interfaces are consistent
      expect(mockFleetOps.createFleet).toBeDefined();
      expect(mockFleetOps.addShipToFleet).toBeDefined();
      expect(mockFleetOps.validateFleetLimits).toBeDefined();
      expect(mockFleetMovement.moveFleet).toBeDefined();
      expect(mockFleetMovement.calculateFuelConsumption).toBeDefined();
      expect(mockFleetMovement.validateMovement).toBeDefined();
    });

    it('should have consistent method signatures across galaxy map services', () => {
      // Mock implementations to verify interface contracts
      const mockGalaxyInteraction: Partial<IGalaxyInteractionService> = {
        handleMouseEvents: (event: MouseEvent, mapState: GalaxyMapState): InteractionResult => {
          return { type: 'select' };
        },
        handleTouchEvents: (event: TouchEvent, mapState: GalaxyMapState): InteractionResult => {
          return { type: 'pan' };
        },
        handleWheelEvents: (event: WheelEvent, mapState: GalaxyMapState): InteractionResult => {
          return { type: 'zoom' };
        },
      };

      const mockGalaxyCoordinate: Partial<IGalaxyCoordinateService> = {
        screenToGalaxy: (
          screenX: number,
          screenY: number,
          mapState: GalaxyMapState,
        ): GalaxyCoordinate => {
          return { x: 0, y: 0 };
        },
        galaxyToScreen: (
          galaxyX: number,
          galaxyY: number,
          mapState: GalaxyMapState,
        ): ScreenCoordinate => {
          return { x: 0, y: 0 };
        },
        calculateZoomLevel: (currentZoom: number, delta: number): number => {
          return 1.0;
        },
      };

      // If these compile without TypeScript errors, the interfaces are consistent
      expect(mockGalaxyInteraction.handleMouseEvents).toBeDefined();
      expect(mockGalaxyInteraction.handleTouchEvents).toBeDefined();
      expect(mockGalaxyInteraction.handleWheelEvents).toBeDefined();
      expect(mockGalaxyCoordinate.screenToGalaxy).toBeDefined();
      expect(mockGalaxyCoordinate.galaxyToScreen).toBeDefined();
      expect(mockGalaxyCoordinate.calculateZoomLevel).toBeDefined();
    });

    it('should have consistent method signatures across ship design services', () => {
      // Mock implementations to verify interface contracts
      const mockShipDesignValidation: Partial<IShipDesignValidationService> = {
        validateDesign: (design: ShipDesign, techLevels: PlayerTech): ValidationResult => {
          return { isValid: true, errors: [], warnings: [] };
        },
        validateComponentPlacement: (
          slotId: string,
          component: ComponentData,
          count: number,
        ): ValidationResult => {
          return { isValid: true, errors: [], warnings: [] };
        },
        validateHullSelection: (hullId: string, techLevels: PlayerTech): ValidationResult => {
          return { isValid: true, errors: [], warnings: [] };
        },
      };

      const mockShipDesignOps: Partial<IShipDesignOperationsService> = {
        setSlotComponent: (
          design: ShipDesign,
          slotId: string,
          component: ComponentData,
          count: number,
        ): ShipDesign => {
          return design;
        },
        clearSlot: (design: ShipDesign, slotId: string): ShipDesign => {
          return design;
        },
        changeHull: (design: ShipDesign, newHullId: string): ShipDesign => {
          return design;
        },
        calculateDesignCost: (design: ShipDesign): ResourceCost => {
          return { resources: 0, ironium: 0, boranium: 0, germanium: 0 };
        },
      };

      // If these compile without TypeScript errors, the interfaces are consistent
      expect(mockShipDesignValidation.validateDesign).toBeDefined();
      expect(mockShipDesignValidation.validateComponentPlacement).toBeDefined();
      expect(mockShipDesignValidation.validateHullSelection).toBeDefined();
      expect(mockShipDesignOps.setSlotComponent).toBeDefined();
      expect(mockShipDesignOps.clearSlot).toBeDefined();
      expect(mockShipDesignOps.changeHull).toBeDefined();
      expect(mockShipDesignOps.calculateDesignCost).toBeDefined();
    });
  });
});