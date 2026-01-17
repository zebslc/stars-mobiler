/**
 * Re-export the BuildCostsRegistry service and Cost type.
 * 
 * For building costs, inject BuildCostsRegistry and use getAllCosts() or getCost(type).
 */

export { BuildCostsRegistry, type Cost } from '../services/data/build-costs-registry.service';
