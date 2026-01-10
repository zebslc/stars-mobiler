import {
  Component,
  Input,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game-state.service';
import { TechService } from '../../services/tech.service';
import { HullPreviewModalComponent } from './hull-preview-modal.component';
import { HullTemplate } from '../../data/tech-atlas.types';
import { getHull, getAllComponents } from '../../utils/data-access.util';
import { compileShipStats } from '../../models/ship-design.model';
import { miniaturizeComponent } from '../../utils/miniaturization.util';
import { getDesign } from '../../data/ships.data';
import { ShipDesign } from '../../models/game.model';

@Component({
  selector: 'app-design-preview-button',
  standalone: true,
  imports: [CommonModule, HullPreviewModalComponent],
  template: `
    <button
      (click)="openPreview($event)"
      class="btn-small"
      [title]="title || 'View Design'"
      [class]="buttonClass"
    >
      <span class="ship-icon tech-icon" [ngClass]="iconClass()"></span>
      <ng-content></ng-content>
    </button>

    @if (previewOpen()) {
      <app-hull-preview-modal
        [hull]="previewHull()"
        [design]="previewDesign()"
        [stats]="previewStats()"
        [title]="previewTitle()"
        (close)="previewOpen.set(false)"
      ></app-hull-preview-modal>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }
      .btn-small {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        font-size: var(--font-size-sm);
        cursor: pointer;
        background: transparent;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        color: var(--color-text);
        transition: all 0.2s;
      }

      .btn-small:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: var(--color-border);
      }

      .ship-icon {
        width: 24px;
        height: 24px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
        display: inline-block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesignPreviewButtonComponent {
  @Input({ required: true }) designId!: string;
  @Input() title = '';
  @Input() buttonClass = '';

  private gs = inject(GameStateService);
  private techService = inject(TechService);

  previewOpen = signal(false);
  previewHull = signal<HullTemplate | null>(null);
  previewDesign = signal<ShipDesign | null>(null);
  previewTitle = signal<string>('');
  previewStats = signal<any>(null);

  iconClass = computed(() => {
    const designId = this.designId;
    if (!designId) return '';
    
    // Try to find dynamic design first to get hull name
    const playerDesigns = this.gs.game()?.shipDesigns || [];
    const dynamicDesign = playerDesigns.find((d) => d.id === designId);
    
    if (dynamicDesign) {
      const hull = getHull(dynamicDesign.hullId);
      return hull ? this.techService.getHullImageClass(hull.Name) : '';
    }

    // Fallback to static design
    const staticDesign = getDesign(designId);
    return staticDesign ? this.techService.getHullImageClass(staticDesign.hullName) : '';
  });

  openPreview(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }

    const designId = this.designId;
    const designDetails = this.getDesignDetails(designId);
    const hull = getHull(designDetails.hullId);

    // Try to find the actual ship design for slot layout
    const playerDesigns = this.gs.getPlayerShipDesigns();
    const realDesign = playerDesigns.find((d) => d.id === designId);

    this.previewHull.set(hull || null);
    this.previewDesign.set(realDesign || null);
    this.previewTitle.set(designDetails.name || 'Ship Design');

    if (realDesign && hull) {
      const player = this.gs.player();
      const techLevels = player?.techLevels || {
        Energy: 0,
        Kinetics: 0,
        Propulsion: 0,
        Construction: 0,
      };
      const miniaturizedComponents = getAllComponents().map((comp) =>
        miniaturizeComponent(comp, techLevels),
      );
      const stats = compileShipStats(hull, realDesign.slots, miniaturizedComponents);
      this.previewStats.set(stats);
    } else {
      this.previewStats.set(designDetails || null);
    }

    this.previewOpen.set(true);
  }

  private getDesignDetails(designId: string) {
    const playerDesigns = this.gs.game()?.shipDesigns || [];
    const dynamicDesign = playerDesigns.find((d) => d.id === designId);

    if (dynamicDesign) {
      const hull = getHull(dynamicDesign.hullId);
      const isStarbase =
        hull?.isStarbase ||
        hull?.type === 'starbase' ||
        [
          'Orbital Fort',
          'Space Dock',
          'Space Station',
          'Ultra Station',
          'Death Star',
          'Starbase',
        ].includes(hull?.Name || '');

      return {
        id: dynamicDesign.id,
        name: dynamicDesign.name,
        hullId: dynamicDesign.hullId,
        hullName: hull?.Name || '',
        isStarbase,
      };
    }

    const staticDesign = getDesign(designId);
    return {
      ...staticDesign,
      isStarbase: staticDesign?.isStarbase || false,
    };
  }
}
