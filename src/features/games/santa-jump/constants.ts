export const modes = {
  campaign: { label: 'Story route', description: 'Deliver every letter to unlock the next stop.' },
  rush: { label: 'Score rush', description: 'Earn as many points as you can in 60 seconds. A hit costs 15 points.' },
  whiteout: { label: 'Whiteout', description: 'Survive 90 seconds of faster waves. No shields or hourglasses. One hit ends the run.' },
  duel: { label: 'Crown duel', description: 'Break three frost seals in 24 seconds. Triple jump is granted for the duel. Miss the deadline or take one hit and you lose.' },
  endless: { label: 'Endless night', description: 'Survive an accelerating route. Every ten seconds earns a distance bonus.' },
} as const;
export const arcadeSlots = { rush: 0, endless: 1, whiteout: 2, duel: 3 } as const;
export const timeLimits = { campaign: 0, rush: 60, endless: 0, whiteout: 90, duel: 24 } as const;
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
    ending: 'The new lens catches the first ray of sun. One by one, the boats follow its green light home. A train whistle calls Santa inland with a second mailbag.',
    hazard: 'Cargo crate', speed: 316, spacing: 358, routeLength: 36024, letters: 29, jumps: 3,
  },
  {
    name: 'Ribbon Railway', short: 'Railway', recipient: 'The night conductor', time: '06:40',
    story: 'A red locomotive waits with letters for the mountain villages. Watch the clockwork rams: they accelerate halfway across the track.',
    ending: 'The conductor hands Santa a brass key. Above the depot, the bell tower has missed its morning chime.',
    hazard: 'Freight crate', speed: 323, spacing: 368, routeLength: 43605, letters: 34, jumps: 3,
  },
  {
    name: 'Brass Bell Tower', short: 'Bell Tower', recipient: 'The bell keeper', time: '07:15',
    story: 'Carry the key past the great bronze wheels. Lantern moles surface between the gears just before Santa reaches them.',
    ending: 'Six bells ring, but the seventh stays silent. Its crystal tongue lies in the caves beneath the tower.',
    hazard: 'Loose masonry', speed: 330, spacing: 366, routeLength: 49500, letters: 38, jumps: 3,
  },
  {
    name: 'Violet Ice Caverns', short: 'Caverns', recipient: 'The crystal miners', time: '07:55',
    story: 'Follow the miners’ lamps to the lost crystal. Stay below the bats as they swoop through the tunnel.',
    ending: 'The crystal catches a ray from the summit. Above the clouds the Frost King raises his crown once more.',
    hazard: 'Amethyst shard', speed: 338, spacing: 365, routeLength: 55770, letters: 43, jumps: 3,
  },
  {
    name: 'Solstice Peak', short: 'Solstice Peak', boss: 'summit-king', recipient: 'The summit choir', time: '08:40',
    story: 'Deliver the crystal to the choir above the snowline. The king now sends paired blasts: catch the high stars between them.',
    ending: 'All seven bells ring together. Their song travels from the summit to the sea as the last wish finds its home.',
    hazard: 'Glacier spire', speed: 345, spacing: 364, routeLength: 62100, letters: 47, jumps: 3,
  },
] as const;
