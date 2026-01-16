import type { ComponentFixture} from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { ShipDesignerHullSelectorComponent } from './ship-designer-hull-selector.component';
import type { HullTemplate } from '../../../data/tech-atlas.types';

declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

describe('ShipDesignerHullSelectorComponent', () => {
  let component: ShipDesignerHullSelectorComponent;
  let fixture: ComponentFixture<ShipDesignerHullSelectorComponent>;

  const mockHulls: Array<HullTemplate> = [
    { Name: 'Scout', type: 'scout', Cost: { Resources: 10 }, Stats: {}, Slots: [] } as any,
    { Name: 'Destroyer', type: 'warship', Cost: { Resources: 100 }, Stats: {}, Slots: [] } as any,
    { Name: 'Miner', type: 'miner', Cost: { Resources: 50 }, Stats: {}, Slots: [] } as any,
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShipDesignerHullSelectorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ShipDesignerHullSelectorComponent);
    component = fixture.componentInstance;
    component.hulls = mockHulls;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show all hulls by default (all categories selected)', () => {
    expect(component.selectedCategories().size).toBe(3);
    expect(component.filteredHulls().length).toBe(3);
  });

  it('should filter hulls when a category is selected', () => {
    // Start by deselecting all (toggle null twice to clear)
    component.toggleCategory(null); // Deselects all
    component.toggleCategory('warship'); // Select only warship
    fixture.detectChanges();
    expect(component.selectedCategories().has('warship')).toBeTrue();
    expect(component.filteredHulls().length).toBe(1);
    expect(component.filteredHulls()[0].Name).toBe('Destroyer');
  });

  it('should filter hulls when multiple categories are selected', () => {
    // Start by deselecting all
    component.toggleCategory(null); // Deselects all
    component.toggleCategory('warship');
    component.toggleCategory('miner');
    fixture.detectChanges();
    expect(component.selectedCategories().size).toBe(2);
    expect(component.filteredHulls().length).toBe(2);
    const names = component.filteredHulls().map(h => h.Name);
    expect(names).toContain('Destroyer');
    expect(names).toContain('Miner');
  });

  it('should toggle category off and back on', () => {
    component.toggleCategory('warship'); // Deselect warship
    expect(component.selectedCategories().size).toBe(2); // scout and miner remain
    component.toggleCategory('warship'); // Re-select warship
    fixture.detectChanges();
    expect(component.selectedCategories().size).toBe(3); // Back to all selected
    expect(component.filteredHulls().length).toBe(3);
  });

  it('should clear categories when null passed with all selected', () => {
    // Start with all selected (default state)
    expect(component.selectedCategories().size).toBe(3);
    component.toggleCategory(null); // Toggle null when all selected = deselect all
    fixture.detectChanges();
    expect(component.selectedCategories().size).toBe(0);
    expect(component.filteredHulls().length).toBe(0); // No categories selected = no hulls shown
  });
});
