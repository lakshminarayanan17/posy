import { autoArrange, emptyBouquet, type Bouquet, type Flower } from './model';

const KEY = 'posy:draft:v1';

interface Draft {
  bouquet: Bouquet;
  /** Strokes on the drawing card that haven't been added to the bouquet yet. */
  card: Flower;
  /** Index of the flower being edited on the drawing card, or null for a new one. */
  editing: number | null;
}

function fresh(): Draft {
  return { bouquet: emptyBouquet(), card: { strokes: [] }, editing: null };
}

function load(): Draft {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (Array.isArray(parsed?.bouquet?.flowers)) {
      return {
        bouquet: { ...emptyBouquet(), ...parsed.bouquet },
        card: Array.isArray(parsed.card?.strokes) ? parsed.card : { strokes: [] },
        editing: typeof parsed.editing === 'number' ? parsed.editing : null,
      };
    }
  } catch {
    // Corrupt or unavailable storage: start fresh.
  }
  return fresh();
}

export const store = {
  ...load(),

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ bouquet: this.bouquet, card: this.card, editing: this.editing }));
    } catch {
      // Private mode or full storage: the draft just won't survive a reload.
    }
  },

  reset() {
    Object.assign(this, fresh());
    this.save();
  },

  /** Keep placements in step with flowers, laying out any new ones. */
  syncPlacements() {
    const b = this.bouquet;
    if (b.placements.length !== b.flowers.length) b.placements = autoArrange(b.flowers.length);
  },
};
