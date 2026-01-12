import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShipDesignerHullSelectorComponent } from './ship-designer-hull-selector.component';
import { HullTemplate } from '../../../data/tech-atlas.types';

declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;

describe('ShipDesignerHullSelectorComponent', () => {
  let component: ShipDesignerHullSelectorComponent;
  let fixture: ComponentFixture<ShipDesignerHullSelectorComponent>;

  const mockHulls: HullTemplate[] = [
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

  it('should show all hulls by default (empty selection)', () => {
    expect(component.selectedCategories().size).toBe(0);
    expect(component.filteredHulls().length).toBe(3);
  });

  it('should filter hulls when a category is selected', () => {
    component.toggleCategory('warship');
    fixture.detectChanges();
    expect(component.selectedCategories().has('warship')).toBeTrue();
    expect(component.filteredHulls().length).toBe(1);
    expect(component.filteredHulls()[0].Name).toBe('Destroyer');
  });

  it('should filter hulls when multiple categories are selected', () => {
    component.toggleCategory('warship');
    component.toggleCategory('miner');
    fixture.detectChanges();
    expect(component.selectedCategories().size).toBe(2);
    expect(component.filteredHulls().length).toBe(2);
    const names = component.filteredHulls().map(h => h.Name);
    expect(names).toContain('Destroyer');
    expect(names).toContain('Miner');
  });

  it('should toggle category off', () => {
    component.toggleCategory('warship');
    component.toggleCategory('warship');
    fixture.detectChanges();
    expect(component.selectedCategories().size).toBe(0);
    expect(component.filteredHulls().length).toBe(3);
  });

  it('should clear categories if null passed (simulate select all)', () => {
    component.toggleCategory('warship');
    component.toggleCategory(null);
    fixture.detectChanges();
    expect(component.selectedCategories().size).toBe(0);
    expect(component.filteredHulls().length).toBe(3);
  });
});
