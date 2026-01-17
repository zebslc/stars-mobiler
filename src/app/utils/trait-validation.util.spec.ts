import { hasAll, lacksAny } from './trait-validation.util';

describe('Trait Validation Utilities', () => {
  describe('hasAll', () => {
    it('should return true when source contains all required values', () => {
      const source = ['Hyper Expansion', 'War Monger'];
      const required = ['Hyper Expansion'];
      expect(hasAll(source, required)).toBe(true);
    });

    it('should return true when source contains all multiple required values', () => {
      const source = ['Hyper Expansion', 'War Monger', 'Super Stealth'];
      const required = ['Hyper Expansion', 'War Monger'];
      expect(hasAll(source, required)).toBe(true);
    });

    it('should return false when source is missing some required values', () => {
      const source = ['Hyper Expansion'];
      const required = ['Hyper Expansion', 'War Monger'];
      expect(hasAll(source, required)).toBe(false);
    });

    it('should return false when source is empty but required has values', () => {
      const source: string[] = [];
      const required = ['Hyper Expansion'];
      expect(hasAll(source, required)).toBe(false);
    });

    it('should return false when source is null but required has values', () => {
      const source = null;
      const required = ['Hyper Expansion'];
      expect(hasAll(source, required)).toBe(false);
    });

    it('should return false when source is undefined but required has values', () => {
      const source = undefined;
      const required = ['Hyper Expansion'];
      expect(hasAll(source, required)).toBe(false);
    });

    it('should return true when required is empty', () => {
      const source = ['Hyper Expansion'];
      const required: string[] = [];
      expect(hasAll(source, required)).toBe(true);
    });

    it('should return true when required is undefined', () => {
      const source = ['Hyper Expansion'];
      const required = undefined;
      expect(hasAll(source, required)).toBe(true);
    });

    it('should return true when both source and required are empty', () => {
      const source: string[] = [];
      const required: string[] = [];
      expect(hasAll(source, required)).toBe(true);
    });

    it('should handle case-sensitive matching', () => {
      const source = ['hyper expansion']; // lowercase
      const required = ['Hyper Expansion']; // uppercase
      expect(hasAll(source, required)).toBe(false);
    });
  });

  describe('lacksAny', () => {
    it('should return true when source lacks all forbidden values', () => {
      const source = ['Hyper Expansion', 'War Monger'];
      const forbidden = ['Super Stealth'];
      expect(lacksAny(source, forbidden)).toBe(true);
    });

    it('should return true when source lacks all multiple forbidden values', () => {
      const source = ['Hyper Expansion'];
      const forbidden = ['Super Stealth', 'War Monger'];
      expect(lacksAny(source, forbidden)).toBe(true);
    });

    it('should return false when source contains any forbidden value', () => {
      const source = ['Hyper Expansion', 'War Monger'];
      const forbidden = ['War Monger'];
      expect(lacksAny(source, forbidden)).toBe(false);
    });

    it('should return false when source contains one of multiple forbidden values', () => {
      const source = ['Hyper Expansion', 'War Monger'];
      const forbidden = ['Super Stealth', 'War Monger'];
      expect(lacksAny(source, forbidden)).toBe(false);
    });

    it('should return true when source is empty', () => {
      const source: string[] = [];
      const forbidden = ['Hyper Expansion'];
      expect(lacksAny(source, forbidden)).toBe(true);
    });

    it('should return true when source is null', () => {
      const source = null;
      const forbidden = ['Hyper Expansion'];
      expect(lacksAny(source, forbidden)).toBe(true);
    });

    it('should return true when source is undefined', () => {
      const source = undefined;
      const forbidden = ['Hyper Expansion'];
      expect(lacksAny(source, forbidden)).toBe(true);
    });

    it('should return true when forbidden is empty', () => {
      const source = ['Hyper Expansion'];
      const forbidden: string[] = [];
      expect(lacksAny(source, forbidden)).toBe(true);
    });

    it('should return true when forbidden is undefined', () => {
      const source = ['Hyper Expansion'];
      const forbidden = undefined;
      expect(lacksAny(source, forbidden)).toBe(true);
    });

    it('should return true when both source and forbidden are empty', () => {
      const source: string[] = [];
      const forbidden: string[] = [];
      expect(lacksAny(source, forbidden)).toBe(true);
    });

    it('should handle case-sensitive matching', () => {
      const source = ['hyper expansion']; // lowercase
      const forbidden = ['Hyper Expansion']; // uppercase
      expect(lacksAny(source, forbidden)).toBe(true); // Different case, so source lacks forbidden
    });
  });

  describe('Combined usage scenarios', () => {
    it('should correctly validate "AND" logic for required traits', () => {
      // Player must have ALL required traits
      const playerTraits = ['Hyper Expansion', 'War Monger'];
      const requiredTraits = ['Hyper Expansion', 'War Monger'];
      expect(hasAll(playerTraits, requiredTraits)).toBe(true);
    });

    it('should correctly validate "OR" logic for forbidden traits', () => {
      // Player cannot have ANY forbidden trait
      const playerTraits = ['Hyper Expansion'];
      const forbiddenTraits = ['War Monger', 'Super Stealth'];
      expect(lacksAny(playerTraits, forbiddenTraits)).toBe(true);
    });

    it('should handle real-world trait filtering scenario - Terrans', () => {
      const terranPrimaryTraits = ['Jack of All Trades'];
      const terranLesserTraits = ['Generalized Research', 'Improved Starbases'];

      // Mini-Colony requires Hyper Expansion (Terrans should NOT have access)
      expect(hasAll(terranPrimaryTraits, ['Hyper Expansion'])).toBe(false);

      // Colony Ship has no restrictions (Terrans SHOULD have access)
      expect(hasAll(terranPrimaryTraits, [])).toBe(true);
      expect(lacksAny(terranPrimaryTraits, [])).toBe(true);
    });

    it('should handle real-world trait filtering scenario - Hyper Expansion race', () => {
      const hePrimaryTraits = ['Hyper Expansion'];
      const heLesserTraits: string[] = [];

      // Mini-Colony requires Hyper Expansion (HE race SHOULD have access)
      expect(hasAll(hePrimaryTraits, ['Hyper Expansion'])).toBe(true);

      // Some hypothetical hull forbids Hyper Expansion (HE race should NOT have access)
      expect(lacksAny(hePrimaryTraits, ['Hyper Expansion'])).toBe(false);
    });

    it('should handle complex multi-trait validation', () => {
      const playerPrimaryTraits = ['Super Stealth'];
      const playerLesserTraits = ['Improved Fuel Efficiency', 'Generalized Research'];

      // Hull requires Super Stealth AND Improved Fuel Efficiency
      expect(hasAll(playerPrimaryTraits, ['Super Stealth'])).toBe(true);
      expect(hasAll(playerLesserTraits, ['Improved Fuel Efficiency'])).toBe(true);

      // Hull forbids War Monger (player doesn't have it, so OK)
      expect(lacksAny(playerPrimaryTraits, ['War Monger'])).toBe(true);

      // Hull requires trait player doesn't have
      expect(hasAll(playerLesserTraits, ['Advanced Remote Mining'])).toBe(false);
    });
  });
});
