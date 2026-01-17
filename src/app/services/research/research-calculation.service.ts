import { Injectable, inject, computed } from '@angular/core';
import { GameStateService } from '../game/game-state.service';
import { TECH_FIELDS } from '../../data/tech-tree.data';
import type { TechField } from '../../data/tech-tree.data';

@Injectable({ providedIn: 'root' })
export class ResearchCalculationService {
  private gs = inject(GameStateService);

  getCurrentLevel(field: TechField) {
    return computed(() => {
      return this.gs.player()?.techLevels[field] ?? 0;
    });
  }

  getCurrentUnlocks(field: TechField) {
    return computed(() => {
      const currentLevel = this.gs.player()?.techLevels[field] ?? 0;
      const fieldInfo = TECH_FIELDS[field];
      return fieldInfo.levels[currentLevel]?.unlocks ?? [];
    });
  }

  getNextUnlocks(field: TechField) {
    return computed(() => {
      const currentLevel = this.gs.player()?.techLevels[field] ?? 0;
      if (currentLevel >= 26) return [];
      const fieldInfo = TECH_FIELDS[field];
      return fieldInfo.levels[currentLevel + 1]?.unlocks ?? [];
    });
  }

  getResearchProgress(field: TechField) {
    return computed(() => {
      return Math.floor(this.gs.player()?.researchProgress[field] ?? 0);
    });
  }

  getNextLevelCost(field: TechField) {
    return computed(() => {
      const currentLevel = this.gs.player()?.techLevels[field] ?? 0;
      if (currentLevel >= 26) return 0;
      const fieldInfo = TECH_FIELDS[field];
      return fieldInfo.levels[currentLevel + 1]?.cost ?? 0;
    });
  }

  getProgressPercent(field: TechField) {
    return computed(() => {
      const progress = Math.floor(this.gs.player()?.researchProgress[field] ?? 0);
      const fieldInfo = TECH_FIELDS[field];
      const currentLevel = this.gs.player()?.techLevels[field] ?? 0;
      const cost = currentLevel >= 26 ? 0 : fieldInfo.levels[currentLevel + 1]?.cost ?? 0;
      if (cost === 0) return 100;
      return Math.min(100, (progress / cost) * 100);
    });
  }

  getTotalLabs() {
    return computed(() => {
      const game = this.gs.game();
      if (!game) return 0;
      return game.stars
        .filter((s) => s.ownerId === game.humanPlayer.id)
        .reduce((sum, p) => sum + (p.research || 0), 0);
    });
  }

  getResearchPerTurn() {
    return computed(() => {
      const game = this.gs.game();
      if (!game) return 0;
      const totalLabs = game.stars
        .filter((s) => s.ownerId === game.humanPlayer.id)
        .reduce((sum, p) => sum + (p.research || 0), 0);
      const researchTrait =
        game.humanPlayer.species.traits.find((t) => t.type === 'research')?.modifier ?? 0;
      return Math.floor(totalLabs * (1 + researchTrait));
    });
  }

  getTurnsToNextLevel(field: TechField) {
    return computed(() => {
      const currentLevel = this.gs.player()?.techLevels[field] ?? 0;
      const fieldInfo = TECH_FIELDS[field];
      const cost = currentLevel >= 26 ? 0 : fieldInfo.levels[currentLevel + 1]?.cost ?? 0;
      if (cost === 0) return 0;

      const progress = Math.floor(this.gs.player()?.researchProgress[field] ?? 0);
      const game = this.gs.game();
      if (!game) return Infinity;
      const totalLabs = game.stars
        .filter((s) => s.ownerId === game.humanPlayer.id)
        .reduce((sum, p) => sum + (p.research || 0), 0);
      const researchTrait =
        game.humanPlayer.species.traits.find((t) => t.type === 'research')?.modifier ?? 0;
      const perTurn = Math.floor(totalLabs * (1 + researchTrait));

      if (perTurn <= 0) return Infinity;

      const remaining = Math.max(0, cost - progress);
      return Math.ceil(remaining / perTurn);
    });
  }
}
