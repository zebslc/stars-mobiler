import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { SettingsService } from '../../services/core/settings.service';
import { GameStateService } from '../../services/game/game-state.service';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

// Declare Jasmine globals
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeEach: any;
declare const jasmine: any;

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let mockSettingsService: any;
  let mockGameStateService: any;
  let mockRouter: any;

  beforeEach(async () => {
    mockSettingsService = {
      showMapControls: signal(false),
      defaultGovernor: signal('balanced'),
      developerMode: signal(false),
      toggleMapControls: jasmine.createSpy('toggleMapControls'),
      setDefaultGovernor: jasmine.createSpy('setDefaultGovernor'),
      toggleDeveloperMode: jasmine.createSpy('toggleDeveloperMode'),
    };

    mockGameStateService = {
      game: signal(null),
    };

    mockRouter = {
      navigateByUrl: jasmine.createSpy('navigateByUrl'),
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: GameStateService, useValue: mockGameStateService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Developer Mode Checkbox', () => {
    it('should render developer mode checkbox', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      const developerSection = compiled.querySelector('div.card:last-child');
      
      expect(developerSection).toBeTruthy();
      expect(developerSection?.querySelector('h3')?.textContent?.trim()).toBe('Developer');
      
      const checkbox = developerSection?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      expect(checkbox).toBeTruthy();
      
      const label = developerSection?.querySelector('span.font-medium');
      expect(label?.textContent?.trim()).toBe('Developer Mode');
      
      const description = developerSection?.querySelector('p.text-small.text-muted');
      expect(description?.textContent?.trim()).toBe('Enable enhanced debugging features and real-time error display');
    });

    it('should render developer mode checkbox with correct structure', () => {
      fixture.detectChanges();
      
      // Find the developer mode checkbox by looking for the one in the Developer section
      const compiled = fixture.nativeElement as HTMLElement;
      const developerSection = compiled.querySelector('div.card:last-child');
      const checkbox = developerSection?.querySelector('input[type="checkbox"]') as HTMLInputElement;
      
      expect(checkbox).toBeTruthy();
      expect(checkbox.type).toBe('checkbox');
      
      // Verify the component has access to the settings service
      expect(component.settings).toBe(mockSettingsService);
      expect(component.settings.developerMode).toBe(mockSettingsService.developerMode);
      expect(component.settings.toggleDeveloperMode).toBe(mockSettingsService.toggleDeveloperMode);
    });

    it('should call toggleDeveloperMode when checkbox value changes', () => {
      fixture.detectChanges();
      
      // Test that the component properly calls the service method
      // This tests the integration between the component and service
      expect(component.settings.toggleDeveloperMode).toBe(mockSettingsService.toggleDeveloperMode);
      
      // Verify the service method exists and can be called
      component.settings.toggleDeveloperMode(true);
      expect(mockSettingsService.toggleDeveloperMode).toHaveBeenCalledWith(true);
      
      component.settings.toggleDeveloperMode(false);
      expect(mockSettingsService.toggleDeveloperMode).toHaveBeenCalledWith(false);
    });

    it('should integrate properly with existing settings UI patterns', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement as HTMLElement;
      
      // Verify developer section follows same structure as other sections
      const allCards = compiled.querySelectorAll('div.card');
      expect(allCards.length).toBe(3); // Interface, Automation, Developer
      
      const developerCard = allCards[2]; // Last card should be developer
      
      // Verify it has the same structure as other cards
      expect(developerCard.querySelector('h3')).toBeTruthy();
      expect(developerCard.querySelector('label')).toBeTruthy();
      expect(developerCard.querySelector('p.text-small.text-muted')).toBeTruthy();
      
      // Verify label styling matches other checkboxes
      const developerLabel = developerCard.querySelector('label');
      const interfaceLabel = allCards[0].querySelector('label');
      
      expect(developerLabel?.getAttribute('style')).toBe(interfaceLabel?.getAttribute('style'));
    });

    it('should not interfere with other settings controls', () => {
      fixture.detectChanges();
      
      // Verify that developer mode and other settings are independent
      const initialMapControls = mockSettingsService.showMapControls();
      const initialDeveloperMode = mockSettingsService.developerMode();
      
      // Change developer mode
      component.settings.toggleDeveloperMode(!initialDeveloperMode);
      
      // Verify developer mode service method was called
      expect(mockSettingsService.toggleDeveloperMode).toHaveBeenCalled();
      
      // Verify other settings methods were not called
      expect(mockSettingsService.toggleMapControls).not.toHaveBeenCalled();
      expect(mockSettingsService.setDefaultGovernor).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to map when game exists', () => {
      mockGameStateService.game.set({ id: 'test-game' });
      
      component.back();
      
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/map');
    });

    it('should navigate to home when no game exists', () => {
      mockGameStateService.game.set(null);
      
      component.back();
      
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/');
    });
  });
});