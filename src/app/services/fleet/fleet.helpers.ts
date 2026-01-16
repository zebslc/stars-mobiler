import type { GameState, Star } from '../../models/game.model';

export function buildStarIndex(game: GameState): Map<string, Star> {
  const index = new Map<string, Star>();
  for (const star of game.stars) {
    index.set(star.id, star);
  }
  return index;
}

export function getStarPosition(game: GameState, starId: string): { x: number; y: number } {
  const star = game.stars.find((s) => s.id === starId);
  return star ? star.position : { x: 0, y: 0 };
}
