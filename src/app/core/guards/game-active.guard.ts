import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { GameStateService } from '../../services/game/game-state.service';

export const gameActiveGuard: CanActivateFn = () => {
  const gs = inject(GameStateService);
  const router = inject(Router);

  if (!gs.game()) {
    return router.parseUrl('');
  }

  return true;
};
