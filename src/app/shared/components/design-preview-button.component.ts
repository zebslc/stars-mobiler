import { Component, ChangeDetectionStrategy, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../services/game/game-state.service';
import { TechService } from '../../services/tech/tech.service';
import { HullPreviewModalComponent } from './hull-preview-modal.component';
import type { HullTemplate } from '../../data/tech-atlas.types';
import { DataAccessService } from '../../services/data/data-access.service';
import { ShipDesignRegistry } from '../../services/data/ship-design-registry.service';
import { compileShipStats } from '../../models/ship-design.model';
import type { ShipDesign } from '../../models/game.model';
import type { TouchClickEvent } from '../directives';
import { TouchClickDirective } from '../directives';

@Component({
  selector: 'app-design-preview-button',
  standalone: true,
  imports: [CommonModule, HullPreviewModalComponent, TouchClickDirective],
  template: `
    <button
      appTouchClick
      (touchClick)="openPreview($event)"
      class="btn-small"
      [title]="title() || 'View Design'"
      [class]="buttonClass()"
    >
      <img
        [src]="hullIcon()"
        [alt]="title() || 'Hull'"
        class="ship-icon"
        (error)="onImageError($event)"
      />
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
  readonly designId = input.required<string>();
  readonly title = input('');
  readonly buttonClass = input('');

  private gs = inject(GameStateService);
  private techService = inject(TechService);
  private readonly dataAccess = inject(DataAccessService);
  private readonly shipDesignRegistry = inject(ShipDesignRegistry);

  readonly previewOpen = signal(false);
  readonly previewHull = signal<HullTemplate | null>(null);
  readonly previewDesign = signal<ShipDesign | null>(null);
  readonly previewTitle = signal<string>('');
  readonly previewStats = signal<any>(null);

  readonly hullIcon = computed(() => {
    const designId = this.designId();
    if (!designId) return '';

    let hullName = '';

    // Try to find dynamic design first to get hull name
    const playerDesigns = this.gs.game()?.shipDesigns || [];
    const dynamicDesign = playerDesigns.find((d) => d.id === designId);

    if (dynamicDesign) {
      const hull = this.dataAccess.getHull(dynamicDesign.hullId);
      if (hull && hull.id) {
        return `/assets/tech-icons/${hull.id}.png`;
      }
      hullName = hull?.Name || '';
    } else {
      // Fallback to static design
      const staticDesign = this.shipDesignRegistry.getDesign(designId);
      hullName = staticDesign?.hullName || '';
    }

    if (!hullName) return '/assets/tech-icons/hull-scout.png';

    // Fallback mapping based on known file names
    const name = hullName.toLowerCase();
    if (name.includes('scout')) return '/assets/tech-icons/hull-scout.png';
    if (name.includes('destroyer')) return '/assets/tech-icons/hull-destroyer.png';
    if (name.includes('cruiser') && !name.includes('battle'))
      return '/assets/tech-icons/hull-cruiser.png';
    if (name.includes('battle cruiser')) return '/assets/tech-icons/hull-battle-cruiser.png';
    if (name.includes('battleship')) return '/assets/tech-icons/hull-battleship.png';
    if (name.includes('colony')) return '/assets/tech-icons/hull-colony.png';
    if (name.includes('freighter')) {
      if (name.includes('small')) return '/assets/tech-icons/hull-freight-s.png';
      if (name.includes('medium')) return '/assets/tech-icons/hull-freight-m.png';
      if (name.includes('large')) return '/assets/tech-icons/hull-freight-l.png';
      if (name.includes('super')) return '/assets/tech-icons/hull-freight-super.png';
      return '/assets/tech-icons/hull-freight-s.png';
    }
    if (name.includes('miner')) return '/assets/tech-icons/hull-miner.png';
    // Fallback
    return '/assets/tech-icons/hull-scout.png';
  });

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = '/assets/tech-icons/hull-scout.png';
  }

  openPreview(event?: TouchClickEvent | MouseEvent): void {
    if (event) {
      if ('stopPropagation' in event) {
        event.stopPropagation();
      } else if (event.originalEvent && 'stopPropagation' in event.originalEvent) {
        event.originalEvent.stopPropagation();
      }
    }

    const designId = this.designId();
    const designDetails = this.getDesignDetails(designId);
    const hull = this.dataAccess.getHull(designDetails.hullId);

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
      const stats = compileShipStats(hull, realDesign.slots, techLevels, this.dataAccess.getComponentsLookup(), this.dataAccess.getTechFieldLookup(), this.dataAccess.getRequiredLevelLookup());
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
      const hull = this.dataAccess.getHull(dynamicDesign.hullId);
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

    const staticDesign = this.shipDesignRegistry.getDesign(designId);
    return {
      ...staticDesign,
      isStarbase: staticDesign?.isStarbase || false,
    };
  }
}
