export const WORLD_WIDTH = 760;
export const WORLD_HEIGHT = 320;
export const FLOOR = 264;
export const SANTA_X = 93;
export const SANTA_SIZE = 64;
export const ITEM_SIZE = 38;
export const HAZARD_SIZE = 44;

export const chapters = [
  {
    name: 'North Pole Mailroom', short: 'Mailroom', recipient: 'The packing elves', time: '20:15',
    story: 'A gust blows the wish letters out of the mailroom. Gather the first bundle so the elves know which gifts to wrap.',
    ending: 'The elves tie the last ribbon. Beyond the workshop door, a trail of envelopes leads into the pines.',
    hazard: 'Gift crate', speed: 215, spacing: 400, letters: 2, jumps: 1,
  },
  {
    name: 'Emerald Pine Forest', short: 'Pine Forest', recipient: 'The forest keeper', time: '21:40',
    story: 'The forest keeper has hung lanterns along the frozen creek. Follow their glow, hop over stumps and catch the letters drifting through the pines.',
    ending: 'The lantern trail ends at the village. High above the sleeping streets, envelopes flutter on the rooftops.',
    hazard: 'Pine stump', speed: 245, spacing: 382, letters: 3, jumps: 2,
  },
  {
    name: 'Moonlit Rooftops', short: 'Rooftops', recipient: 'The village children', time: '23:25',
    story: 'The village is fast asleep. Leap from roof to roof, clear the chimneys and gather the letters left beside the glowing windows.',
    ending: 'A gift waits under every tree. The last envelope bears the wax seal of the observatory.',
    hazard: 'Brick chimney', speed: 270, spacing: 365, letters: 4, jumps: 2,
  },
  {
    name: 'Daybreak Observatory', short: 'Observatory', recipient: 'The star keeper', time: '05:10',
    story: 'Carry the last wishes to the observatory before sunrise. Watch for ice crystals on the climb to the star keeper’s lantern.',
    ending: 'The North Star shines again. From the smallest attic to the cabin at the edge of the woods, every wish has found its way home.',
    hazard: 'Ice crystal', speed: 300, spacing: 350, letters: 5, jumps: 3,
  },
] as const;
