import { Injectable } from '@angular/core';
import type { GameState, Star, Fleet, Player } from '../../models/game.model';
import type { ScanReport, StarVisibility } from '../../models/scanning.model';

@Injectable({ providedIn: 'root' })
export class ScanningService {
  
  processScanning(game: GameState): void {
    // Process for human player
    this.updatePlayerScans(game, game.humanPlayer);
    
    // Process for AI players could be added here
    game.aiPlayers.forEach(ai => this.updatePlayerScans(game, ai));
  }

  getStarVisibility(game: GameState, playerId: string, starId: string): StarVisibility {
    const player = (playerId === game.humanPlayer.id) ? game.humanPlayer : game.aiPlayers.find(p => p.id === playerId);
    if (!player) return { status: 'unexplored', age: 0 };

    const report = player.scanReports[starId];
    if (!report) return { status: 'unexplored', age: 0 };

    // Calculate age. Report turn 10. Game turn 11. Age = (11-1) - 10 = 0.
    // If we are in turn 1 (start), game.turn is 1. Report might be 1 (if init scanned).
    // Age = (1 - 1) - 1 = -1?
    // Let's assume standard turn logic:
    // Turn 1 starts. game.turn = 1.
    // Init runs. processScanning runs. report.turn = 1.
    // Player sees report turn 1.
    // Age should be 0.
    // So Age = game.turn - report.turn.
    // In Turn 2. game.turn = 2. Report is 1. Age = 1.
    // Wait, if Age = 1, is it 'visible'?
    // Usually 'visible' means 'currently in range'.
    // The report doesn't tell us if it's currently in range, just when it was last seen.
    // If I have a scanner there in Turn 2, I should have a report from Turn 2?
    // But processScanning runs at END of turn.
    // So in Turn 2, before end turn, the latest report is from Turn 1 (end of Turn 1).
    // So if I have a scanner, I still only have Turn 1 report.
    // Unless we run processScanning at start of turn?
    // Or we consider "Age 1" as "Visible" if we have a scanner?
    // But this function doesn't check for scanners (expensive).
    // It relies on the report.
    // Let's change the definition:
    // If report.turn === game.turn, it is "Live" (e.g. just scanned).
    // If report.turn === game.turn - 1, it is "Current" (from end of last turn).
    // If report.turn < game.turn - 1, it is "Old".
    
    // Actually, if I just initialized the game, turn is 1. Report is 1.
    // So Age = 0.
    // If I am in Turn 2. Report is 1. Age = 1.
    // Is Age 1 "Visible"?
    // In a turn based game, you see the state from the end of last turn.
    // So Age 1 is the "best possible" info.
    // So Age 1 is "Visible".
    // Age > 1 is "Old" (Fog).
    
    // Let's try:
    // visible if age <= 1.
    // But if I move a ship away in Turn 2.
    // End of Turn 1: I had a ship. Report Turn 1.
    // Turn 2: I move ship away.
    // I still have Report Turn 1. Age 1.
    // Is it visible? No, I moved away. It should be Fog.
    // So "Visible" status cannot be determined solely by report timestamp in this model
    // unless we update reports *during* the turn or store "isVisible" flag.
    
    // To properly support "Fog of War" vs "Visible", we need to know if we have a scanner *right now*.
    // But calculating that is expensive for every star every frame.
    // However, for the Galaxy Map, we can calculate it once per turn or use a cached set.
    // For now, I'll rely on the report age.
    // If I want "Fog of War" immediately upon moving away, I need to know.
    // But usually in Stars!, you see what you saw at the beginning of the turn.
    // If you move away, you still see the state from start of turn until end of turn.
    // So effectively, everything you saw at start of turn IS visible for the duration of the turn.
    // The "Fog" only applies to things you haven't seen for > 1 turn.
    
    // So: Age = game.turn - report.turn.
    // If Age <= 1 (scanned last turn or this turn), it is Visible.
    // If Age > 1, it is Fog.
    // Exception: Turn 1. Report 1. Age 0. Visible.
    
    const age = game.turn - report.turn;
    return {
      status: age <= 1 ? 'visible' : 'fog',
      scan: report,
      age: Math.max(0, age)
    };
  }

  private updatePlayerScans(game: GameState, player: Player): void {
    const scanners = this.getPlayerScanners(game, player.id);
    
    // For every star in the galaxy
    game.stars.forEach(star => {
      // Check if any scanner covers this star
      const isVisible = scanners.some(scanner => this.isStarInRange(scanner, star));
      
      if (isVisible) {
        // Create or update scan report
        player.scanReports[star.id] = this.createScanReport(star, game.turn);
      }
    });
  }

  private getPlayerScanners(game: GameState, playerId: string): Array<{ x: number, y: number, range: number }> {
    const scanners: Array<{ x: number, y: number, range: number }> = [];

    // 1. Owned planets
    game.stars
      .filter(s => s.ownerId === playerId)
      .forEach(s => {
        // Base planetary scan range + scanner facilities
        // Assuming base range is 100 (example) or derived from scanner tech/buildings
        // Using s.scanner which seems to be the scanner level/range
        const range = s.scanner > 0 ? s.scanner : 0; 
        // Note: Owned planets always see themselves, handled by range check (distance 0)
        // Even if scanner is 0, you should see your own planet.
        // We'll treat owned planets as having at least very short range or handle them separately.
        // But for "scanners", we use the scanner attribute.
        if (range > 0) {
            scanners.push({ x: s.position.x, y: s.position.y, range });
        }
        // Always add a minimal range for owned planets to ensure they scan themselves and immediate vicinity
        scanners.push({ x: s.position.x, y: s.position.y, range: 10 }); 
      });

    // 2. Fleets
    game.fleets
      .filter(f => f.ownerId === playerId)
      .forEach(f => {
        const fleetRange = this.getFleetScanRange(game, f);
        if (fleetRange > 0) {
          const position = this.getFleetPosition(game, f);
          if (position) {
            scanners.push({ x: position.x, y: position.y, range: fleetRange });
          }
        }
      });

    return scanners;
  }

  private getFleetScanRange(game: GameState, fleet: Fleet): number {
    // Return the max scan range of ships in the fleet
    // We need to look up ship designs
    let maxRange = 0;
    
    fleet.ships.forEach(shipStack => {
      const design = game.shipDesigns.find(d => d.id === shipStack.designId);
      if (design && design.spec) {
        if (design.spec.scanRange > maxRange) {
          maxRange = design.spec.scanRange;
        }
      }
    });
    
    return maxRange;
  }

  private getFleetPosition(game: GameState, fleet: Fleet): { x: number, y: number } | null {
    if (fleet.location.type === 'space') {
      return { x: fleet.location.x, y: fleet.location.y };
    }
    // Extract starId before callback to preserve TypeScript type narrowing
    const starId = fleet.location.starId;
    const star = game.stars.find(s => s.id === starId);
    return star ? star.position : null;
  }

  private isStarInRange(scanner: { x: number, y: number, range: number }, star: Star): boolean {
    const dx = scanner.x - star.position.x;
    const dy = scanner.y - star.position.y;
    const distSq = dx * dx + dy * dy;
    return distSq <= scanner.range * scanner.range;
  }

  createScanReport(star: Star, turn: number): ScanReport {
    return {
      starId: star.id,
      turn: turn,
      ownerId: star.ownerId,
      population: star.population,
      maxPopulation: star.maxPopulation,
      mines: star.mines,
      factories: star.factories,
      defenses: star.defenses,
      mineralConcentrations: { ...star.mineralConcentrations },
      surfaceMinerals: { ...star.surfaceMinerals },
      temperature: star.temperature,
      atmosphere: star.atmosphere,
      resources: star.resources,
    };
  }
}
