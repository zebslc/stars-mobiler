import { Injectable } from '@angular/core';
import { Planet, Species } from '../models/game.model';

@Injectable({ providedIn: 'root' })
export class HabitabilityService {
  calculate(planet: Planet, species: Species): number {
    const tempDiff = Math.abs(planet.temperature - species.habitat.idealTemperature);
    const atmoDiff = Math.abs(planet.atmosphere - species.habitat.idealAtmosphere);
    const distance = Math.sqrt(tempDiff * tempDiff + atmoDiff * atmoDiff);
    const tolerance = species.habitat.toleranceRadius;
    if (distance >= tolerance) {
      return Math.round(-((distance - tolerance) / tolerance) * 100);
    }
    return Math.round((1 - distance / tolerance) * 100);
  }
}

