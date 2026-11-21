import type { Foe, Supply } from './types.ts';

export const WORLD_WIDTH = 760;
export const WORLD_HEIGHT = 320;
export const FLOOR = 264;
export const SANTA_X = 93;
export const SANTA_SIZE = 64;
export const ITEM_SIZE = 38;
export const HAZARD_SIZE = 44;

export interface Chapter {
  name: string;
  short: string;
  recipient: string;
  time: string;
  rule: string;
  phases: readonly [string, string, string];
  ruleHint: string;
  story: string;
  ending: string;
  hazard: string;
  speed: number;
  spacing: number;
  routeLength: number;
  letters: number;
  jumps: number;
  foes: readonly [Foe, Foe, Foe];
  supplies: readonly Supply[];
  foeEvery: number;
  basePace: number;
  maxRamp: number;
  timeLimit: number;
  survivalBonus: number;
  boss?: 'frost-king' | 'summit-king';
}

export const chapters: readonly Chapter[] = [
  {
    name: 'North Pole Mailroom', short: 'Mailroom', recipient: 'The packing elves', time: '20:15',
    rule: 'Courtyard Blitz',
    phases: ['Courtyard Sprint', 'Canopy Gust', 'Mailroom Blitz'],
    ruleHint: 'Act I: bounding hares · Act II: low snow owls & twin crates · Climax: fast pine goblins with shields disabled.',
    story: 'A gust blows the wish letters out of the mailroom. Gather the first bundle so the elves know which gifts to wrap.',
    ending: 'The elves tie the last ribbon. Beyond the workshop door, a trail of envelopes leads into the pines. Double jump unlocked! Tap again in midair.',
    hazard: 'Gift crate', speed: 255, spacing: 320, routeLength: 10965, letters: 10, jumps: 1,
    foes: ['hare', 'owl', 'goblin'], supplies: ['star', 'shield', 'magnet'],
    foeEvery: 2, basePace: 1, maxRamp: 0.16, timeLimit: 0, survivalBonus: 0,
  },
  {
    name: 'Emerald Pine Forest', short: 'Pine Forest', recipient: 'The forest keeper', time: '21:40',
    rule: 'Canopy Stampede',
    phases: ['Lantern Trail', 'Creek Ambush', 'Timber Stampede'],
    ruleHint: 'Act I: low owls · Act II: charging goblins & double-jump twin stumps · Climax: clockwork rams join the stampede.',
    story: 'The forest keeper has hung lanterns along the frozen creek. Follow their glow, hop over stumps and catch the letters drifting through the pines.',
    ending: 'The lantern trail ends at the village. High above the sleeping streets, envelopes flutter on the rooftops.',
    hazard: 'Pine stump', speed: 270, spacing: 312, routeLength: 15680, letters: 13, jumps: 2,
    foes: ['owl', 'goblin', 'ram'], supplies: ['magnet', 'star', 'shield'],
    foeEvery: 2, basePace: 1.02, maxRamp: 0.18, timeLimit: 0, survivalBonus: 10,
  },
  {
    name: 'Moonlit Rooftops', short: 'Rooftops', recipient: 'The village children', time: '23:25',
    rule: 'Curfew Sprint',
    phases: ['Chimney Hop', 'Gable Charge', 'Midnight Curfew'],
    ruleHint: '85s curfew! Act I: goblins · Act II: twin chimneys & hares · Climax: clockwork rams accelerate across the tiles.',
    story: 'The village is fast asleep. Leap from roof to roof, clear the chimneys and gather the letters left beside the glowing windows.',
    ending: 'A gift waits under every tree. The last envelope bears the wax seal of the observatory. Triple jump unlocked! Tap twice in midair.',
    hazard: 'Brick chimney', speed: 284, spacing: 306, routeLength: 20790, letters: 17, jumps: 2,
    foes: ['goblin', 'hare', 'ram'], supplies: ['prism', 'magnet', 'shield', 'star'],
    foeEvery: 2, basePace: 1.04, maxRamp: 0.20, timeLimit: 85, survivalBonus: 0,
  },
  {
    name: 'Daybreak Observatory', short: 'Observatory', boss: 'frost-king', recipient: 'The star keeper', time: '05:10',
    rule: 'Starlight Siege',
    phases: ['Ridge Ascent', 'Gale Watch', 'Frost King Siege'],
    ruleHint: 'Act I: hares · Act II: owls & triple-jump vault formations · Climax: goblins & the Frost King’s 3-seal siege.',
    story: 'Carry the last wishes to the observatory before sunrise. The Frost King guards the summit. Dodge his ice volleys and catch three high stars to break his crown.',
    ending: 'The North Star shines again. From the smallest attic to the cabin at the edge of the woods, a line of lanterns flickers toward the coast. The glassmakers need a new lens for the harbor beacon.',
    hazard: 'Ice crystal', speed: 300, spacing: 300, routeLength: 26700, letters: 22, jumps: 3,
    foes: ['hare', 'owl', 'goblin'], supplies: ['shield', 'star', 'magnet', 'hourglass', 'star'],
    foeEvery: 2, basePace: 1.05, maxRamp: 0.20, timeLimit: 0, survivalBonus: 0,
  },
  {
    name: 'Aurora Glassworks', short: 'Glassworks', recipient: 'The glassmakers', time: '05:35',
    rule: 'Furnace Overdrive',
    phases: ['Kiln Run', 'Thermal Updraft', 'Molten Overdrive'],
    ruleHint: 'No ice shields! Act I: clockwork rams · Act II: goblins & high vault letters · Climax: lantern moles erupt from the floor.',
    story: 'The furnaces are warm again. Follow the letters above the cooling glass and take the lens order to the master glassmaker.',
    ending: 'The last furnace opens. Santa wraps the emerald lens in wool and follows the harbor bells down to the docks.',
    hazard: 'Glass shard', speed: 312, spacing: 296, routeLength: 28336, letters: 24, jumps: 3,
    foes: ['ram', 'goblin', 'mole'], supplies: ['prism', 'magnet', 'hourglass', 'star'],
    foeEvery: 2, basePace: 1.06, maxRamp: 0.22, timeLimit: 0, survivalBonus: 10,
  },
  {
    name: 'Starlight Harbor', short: 'Harbor', recipient: 'The lighthouse keeper', time: '06:10',
    rule: 'Tidal Maelstrom',
    phases: ['Breakwater Dash', 'Squall Surge', 'Tidal Maelstrom'],
    ruleHint: 'Act I: coastal owls · Act II: charging rams & +10s survival bonuses · Climax: crystal bats swoop through the squall.',
    story: 'Fishing boats wait beyond the breakwater. Leap the cargo on the dock and collect the last letters before the morning tide turns.',
    ending: 'The new lens catches the first ray of sun. One by one, the boats follow its green light home. A train whistle calls Santa inland with a second mailbag.',
    hazard: 'Cargo crate', speed: 322, spacing: 292, routeLength: 30652, letters: 26, jumps: 3,
    foes: ['owl', 'ram', 'bat'], supplies: ['magnet', 'shield', 'prism', 'star'],
    foeEvery: 2, basePace: 1.07, maxRamp: 0.24, timeLimit: 0, survivalBonus: 10,
  },
  {
    name: 'Ribbon Railway', short: 'Railway', boss: 'frost-king', recipient: 'The night conductor', time: '06:40',
    rule: 'Express Siege',
    phases: ['Depot Departure', 'Piston Express', 'Ironclad Siege'],
    ruleHint: '120s deadline! Act I: burrowing moles · Act II: rams & twin freight · Climax: goblins & a railway Frost King ambush.',
    story: 'A red locomotive waits with letters for the mountain villages. Watch the clockwork rams: they accelerate halfway across the track.',
    ending: 'The conductor hands Santa a brass key. Above the depot, the bell tower has missed its morning chime.',
    hazard: 'Freight crate', speed: 330, spacing: 288, routeLength: 35200, letters: 29, jumps: 3,
    foes: ['mole', 'ram', 'goblin'], supplies: ['shield', 'magnet', 'prism', 'hourglass', 'star'],
    foeEvery: 1, basePace: 1.08, maxRamp: 0.24, timeLimit: 120, survivalBonus: 0,
  },
  {
    name: 'Brass Bell Tower', short: 'Bell Tower', recipient: 'The bell keeper', time: '07:15',
    rule: 'Belfry Overdrive',
    phases: ['Bronze Gearwork', 'Pendulum Sweep', 'Belfry Overdrive'],
    ruleHint: 'Act I: clockwork rams · Act II: swooping crystal bats & twin gears · Climax: lantern moles & +35% gear overdrive.',
    story: 'Carry the key past the great bronze wheels. Lantern moles surface between the gears just before Santa reaches them.',
    ending: 'Six bells ring, but the seventh stays silent. Its crystal tongue lies in the caves beneath the tower.',
    hazard: 'Loose masonry', speed: 338, spacing: 284, routeLength: 39800, letters: 32, jumps: 3,
    foes: ['ram', 'bat', 'mole'], supplies: ['hourglass', 'prism', 'shield', 'star'],
    foeEvery: 1, basePace: 1.09, maxRamp: 0.26, timeLimit: 0, survivalBonus: 15,
  },
  {
    name: 'Violet Ice Caverns', short: 'Caverns', recipient: 'The crystal miners', time: '07:55',
    rule: 'Whiteout Fury',
    phases: ['Crystal Tunnel', 'Subzero Gale', 'Whiteout Fury'],
    ruleHint: 'Zero shields or hourglasses! Act I: crystal bats · Act II: burrowing moles · Climax: rams & goblins in a whiteout gale.',
    story: 'Follow the miners’ lamps to the lost crystal. Stay below the bats as they swoop through the tunnel.',
    ending: 'The crystal catches a ray from the summit. Above the clouds the Frost King raises his crown once more.',
    hazard: 'Amethyst shard', speed: 346, spacing: 280, routeLength: 43800, letters: 36, jumps: 3,
    foes: ['bat', 'mole', 'ram'], supplies: ['prism', 'magnet', 'star'],
    foeEvery: 1, basePace: 1.14, maxRamp: 0.26, timeLimit: 0, survivalBonus: 15,
  },
  {
    name: 'Solstice Peak', short: 'Solstice Peak', boss: 'summit-king', recipient: 'The summit choir', time: '08:40',
    rule: 'Solstice Crown Duel',
    phases: ['Glacier Climb', 'Avalanche Ridge', 'Solstice Crown Duel'],
    ruleHint: '155s summit deadline! Act I: moles · Act II: crystal bats & twin spires · Climax: rams & the Summit King’s paired blasts.',
    story: 'Deliver the crystal to the choir above the snowline. The king now sends paired blasts: catch the high stars between them.',
    ending: 'All seven bells ring together. Their song travels from the summit to the sea as the last wish finds its home.',
    hazard: 'Glacier spire', speed: 355, spacing: 276, routeLength: 47800, letters: 40, jumps: 3,
    foes: ['mole', 'bat', 'ram'], supplies: ['prism', 'magnet', 'shield', 'hourglass', 'star'],
    foeEvery: 1, basePace: 1.12, maxRamp: 0.28, timeLimit: 155, survivalBonus: 20,
  },
];
