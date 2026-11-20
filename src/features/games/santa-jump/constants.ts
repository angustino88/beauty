export const modes = {
  campaign: { label: 'Story route', description: 'Deliver every letter to unlock the next stop.' },
  rush: { label: 'Score rush', description: 'Earn as many points as you can in 60 seconds. A hit costs 15 points.' },
  endless: { label: 'Endless night', description: 'Survive an accelerating route. Every ten seconds earns a distance bonus.' },
} as const;
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
    ending: 'The elves tie the last ribbon. Beyond the workshop door, a trail of envelopes leads into the pines. Double jump unlocked! Tap again in midair.',
    hazard: 'Gift crate', speed: 215, spacing: 400, routeLength: 12900, letters: 10, jumps: 1,
  },
  {
    name: 'Emerald Pine Forest', short: 'Pine Forest', recipient: 'The forest keeper', time: '21:40',
    story: 'The forest keeper has hung lanterns along the frozen creek. Follow their glow, hop over stumps and catch the letters drifting through the pines.',
    ending: 'The lantern trail ends at the village. High above the sleeping streets, envelopes flutter on the rooftops.',
    hazard: 'Pine stump', speed: 245, spacing: 382, routeLength: 18375, letters: 14, jumps: 2,
  },
  {
    name: 'Moonlit Rooftops', short: 'Rooftops', recipient: 'The village children', time: '23:25',
    story: 'The village is fast asleep. Leap from roof to roof, clear the chimneys and gather the letters left beside the glowing windows.',
    ending: 'A gift waits under every tree. The last envelope bears the wax seal of the observatory. Triple jump unlocked! Tap twice in midair.',
    hazard: 'Brick chimney', speed: 270, spacing: 365, routeLength: 24300, letters: 20, jumps: 2,
  },
  {
    name: 'Daybreak Observatory', short: 'Observatory', boss: 'frost-king', recipient: 'The star keeper', time: '05:10',
    story: 'Carry the last wishes to the observatory before sunrise. The Frost King guards the summit. Dodge his ice volleys and catch three high stars to break his crown.',
    ending: 'The North Star shines again. From the smallest attic to the cabin at the edge of the woods, a line of lanterns flickers toward the coast. The glassmakers need a new lens for the harbor beacon.',
    hazard: 'Ice crystal', speed: 300, spacing: 350, routeLength: 31500, letters: 26, jumps: 3,
  },
  {
    name: 'Aurora Glassworks', short: 'Glassworks', recipient: 'The glassmakers', time: '05:35',
    story: 'The furnaces are warm again. Follow the letters above the cooling glass and take the lens order to the master glassmaker.',
    ending: 'The last furnace opens. Santa wraps the emerald lens in wool and follows the harbor bells down to the docks.',
    hazard: 'Glass shard', speed: 308, spacing: 362, routeLength: 33264, letters: 27, jumps: 3,
  },
  {
    name: 'Starlight Harbor', short: 'Harbor', recipient: 'The lighthouse keeper', time: '06:10',
    story: 'Fishing boats wait beyond the breakwater. Leap the cargo on the dock and collect the last letters before the morning tide turns.',
    ending: 'The new lens catches the first ray of sun. One by one, the boats follow its green light home for Christmas.',
    hazard: 'Cargo crate', speed: 316, spacing: 358, routeLength: 36024, letters: 29, jumps: 3,
  },
] as const;
