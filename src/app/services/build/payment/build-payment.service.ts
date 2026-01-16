import { Injectable } from '@angular/core';
import { BuildItem, Star } from '../../../models/game.model';

export type ResourceAmount = {
  resources: number;
  ironium: number;
  boranium: number;
  germanium: number;
};

export type PaymentResult = {
  paid: ResourceAmount;
  isComplete: boolean;
};

@Injectable({ providedIn: 'root' })
export class BuildPaymentService {
  
  constructor() {}

  /**
   * Initialize payment tracking for a build item.
   */
  initializeItemPayment(item: BuildItem): void {
    if (!item.paid) {
      item.paid = { resources: 0, ironium: 0, boranium: 0, germanium: 0 };
    }
  }

  /**
   * Calculate the total cost for a build item.
   */
  calculateTotalCost(item: BuildItem): ResourceAmount {
    return {
      resources: item.cost.resources ?? 0,
      ironium: item.cost.ironium ?? 0,
      boranium: item.cost.boranium ?? 0,
      germanium: item.cost.germanium ?? 0,
    };
  }

  /**
   * Calculate remaining costs after accounting for payments and credits.
   */
  calculateRemainingCost(
    totalCost: ResourceAmount,
    paid: ResourceAmount,
    scrapCredit: ResourceAmount
  ): ResourceAmount {
    return {
      resources: Math.max(0, totalCost.resources - paid.resources),
      ironium: Math.max(0, totalCost.ironium - paid.ironium - scrapCredit.ironium),
      boranium: Math.max(0, totalCost.boranium - paid.boranium - scrapCredit.boranium),
      germanium: Math.max(0, totalCost.germanium - paid.germanium - scrapCredit.germanium),
    };
  }

  /**
   * Process payment for a build item from planet resources.
   */
  processItemPayment(
    planet: Star,
    item: BuildItem,
    remaining: ResourceAmount,
    totalCost: ResourceAmount,
    scrapCredit: ResourceAmount
  ): PaymentResult {
    const affordable = this.calculateAffordablePayment(planet, remaining);
    this.deductFromPlanet(planet, affordable);
    this.addToPaidAmount(item, affordable);
    const isComplete = this.checkPaymentCompletion(item.paid!, totalCost, scrapCredit);

    return { paid: item.paid!, isComplete };
  }

  /**
   * Calculate what the planet can afford to pay.
   */
  calculateAffordablePayment(planet: Star, remaining: ResourceAmount): ResourceAmount {
    return {
      resources: Math.min(remaining.resources, planet.resources),
      ironium: Math.min(remaining.ironium, planet.surfaceMinerals.ironium),
      boranium: Math.min(remaining.boranium, planet.surfaceMinerals.boranium),
      germanium: Math.min(remaining.germanium, planet.surfaceMinerals.germanium),
    };
  }

  /**
   * Deduct affordable amounts from planet resources.
   */
  deductFromPlanet(planet: Star, affordable: ResourceAmount): void {
    planet.resources -= affordable.resources;
    planet.surfaceMinerals.ironium -= affordable.ironium;
    planet.surfaceMinerals.boranium -= affordable.boranium;
    planet.surfaceMinerals.germanium -= affordable.germanium;
  }

  /**
   * Add affordable amounts to the item's paid amount.
   */
  addToPaidAmount(item: BuildItem, affordable: ResourceAmount): void {
    item.paid!.resources += affordable.resources;
    item.paid!.ironium += affordable.ironium;
    item.paid!.boranium += affordable.boranium;
    item.paid!.germanium += affordable.germanium;
  }

  /**
   * Check if payment is complete.
   */
  checkPaymentCompletion(
    paid: ResourceAmount,
    totalCost: ResourceAmount,
    scrapCredit: ResourceAmount
  ): boolean {
    return (
      paid.resources >= totalCost.resources &&
      paid.ironium + scrapCredit.ironium >= totalCost.ironium &&
      paid.boranium + scrapCredit.boranium >= totalCost.boranium &&
      paid.germanium + scrapCredit.germanium >= totalCost.germanium
    );
  }

  /**
   * Handle excess resource refunds from scrap credits.
   */
  handleExcessRefunds(
    planet: Star,
    paid: ResourceAmount,
    scrapCredit: ResourceAmount,
    totalCost: ResourceAmount
  ): void {
    const excessIronium = paid.ironium + scrapCredit.ironium - totalCost.ironium;
    const excessBoranium = paid.boranium + scrapCredit.boranium - totalCost.boranium;
    const excessGermanium = paid.germanium + scrapCredit.germanium - totalCost.germanium;

    if (excessIronium > 0) planet.surfaceMinerals.ironium += excessIronium;
    if (excessBoranium > 0) planet.surfaceMinerals.boranium += excessBoranium;
    if (excessGermanium > 0) planet.surfaceMinerals.germanium += excessGermanium;
  }
}