import { Injectable, inject, computed } from '@angular/core';
import { GameStateService } from '../game/game-state.service';
import { TechService } from '../tech/tech.service';
import type { TechField } from '../../data/tech-tree.data';
import type { TechRequirement } from '../../data/tech-atlas.types';

@Injectable({ providedIn: 'root' })
export class TechStatusService {
  private gs = inject(GameStateService);
  private techService = inject(TechService);

  getExternalDependenciesWithStatus(
    name: string,
    selectedField: TechField,
  ): Array<{ label: string; status: 'met' | 'close' | 'far' }> {
    const hull = this.techService.getHullByName(name);
    const comp = this.techService.getComponentByName(name);
    const details = hull || comp;

    if (!details) return [];

    let techReq: TechRequirement | undefined;
    if (hull) {
      techReq = hull.techReq;
    } else if (comp) {
      techReq = comp.tech;
    }

    if (!techReq) return [];

    const player = this.gs.player();
    if (!player) return [];

    const reqs: Array<{ field: string; level: number }> = [];
    Object.entries(techReq).forEach(([field, level]) => {
      reqs.push({ field, level: Number(level) });
    });

    return reqs
      .filter((r) => r.field !== selectedField && r.level > 0)
      .map((r) => {
        const currentLevel = player.techLevels[r.field as TechField] ?? 0;
        const requiredLevel = r.level;
        const diff = requiredLevel - currentLevel;

        let status: 'met' | 'close' | 'far';
        if (diff <= 0) {
          status = 'met';
        } else if (diff <= 2) {
          status = 'close';
        } else {
          status = 'far';
        }

        return {
          label: `${r.field.substring(0, 4)} ${r.level}`,
          status,
        };
      });
  }

  getComputedExternalDependencies(
    name: string,
    selectedField: TechField,
  ) {
    return computed(() => this.getExternalDependenciesWithStatus(name, selectedField));
  }
}
