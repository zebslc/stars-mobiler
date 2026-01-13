import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NavBarComponent } from './components/nav-bar.component';
import { ToastContainerComponent } from './components/toast-container.component';
import { DeveloperPanelComponent } from './components/developer-panel.component';
import { GameStateService } from './services/game-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    NavBarComponent,
    ToastContainerComponent,
    DeveloperPanelComponent,
  ],
  template: `
    <app-nav-bar *ngIf="showNav()"></app-nav-bar>
    <div
      style="flex: 1; overflow: hidden; display: flex; flex-direction: column; position: relative;"
    >
      <router-outlet></router-outlet>
    </div>
    <app-toast-container></app-toast-container>
    <app-developer-panel></app-developer-panel>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100dvh;
        overflow: hidden;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  private router = inject(Router);
  private gs = inject(GameStateService);

  showNav = computed(() => {
    const game = this.gs.game();
    return game !== null;
  });
}
