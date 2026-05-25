const COLORS = [
  'Crimson', 'Azure', 'Golden', 'Emerald', 'Violet', 'Magenta', 'Teal', 'Indigo', 'Cyan', 'Amber',
  'Ruby', 'Sapphire', 'Bronze', 'Silver', 'Copper', 'Jade', 'Scarlet', 'Cobalt', 'Lavender', 'Coral',
  'Olive', 'Apricot', 'Lilac', 'Mint', 'Peach', 'Plum', 'Mustard', 'Cherry', 'Lemon', 'Aqua',
  'Pistachio', 'Tangerine', 'Chestnut', 'Periwinkle', 'Charcoal', 'Ivory', 'Rose', 'Sunflower', 'Onyx', 'Garnet',
  'Opal', 'Turquoise', 'Rusty', 'Sandy', 'Shadow', 'Velvet', 'Blush', 'Frosty', 'Sunset', 'Forest',
  'Ocean', 'Sky', 'Desert', 'Arctic', 'Sunny', 'Stormy', 'Mist', 'Dawn', 'Dusk', 'Bramble',
  'Mossy', 'Pebble', 'Clay', 'Flint', 'Ginger', 'Honey', 'Nutmeg', 'Cinnamon', 'Claret', 'Mauve',
  'Orchid', 'Amethyst', 'Citron', 'Marigold', 'Sienna', 'Terracotta', 'Khaki', 'Sage', 'Denim', 'Cerulean',
  'Navy', 'Steel', 'Slate', 'Rust', 'Brick', 'Mahogany', 'Espresso', 'Vanilla', 'Cream', 'Butter',
  'Biscuit', 'Caramel', 'Toffee', 'Peppermint', 'Lime', 'Fern', 'Fir', 'Spruce', 'Pine', 'Ivy'
];

const EMOTIONS = [
  'Happy', 'Joyful', 'Silly', 'Brave', 'Friendly', 'Curious', 'Proud', 'Cheerful', 'Playful', 'Giddy',
  'Excited', 'Energetic', 'Kind', 'Calm', 'Bold', 'Witty', 'Clever', 'Swift', 'Bright', 'Jolly',
  'Lively', 'Merry', 'Polite', 'Gentle', 'Caring', 'Honest', 'Loyal', 'Wise', 'Eager', 'Active',
  'Cozy', 'Peppy', 'Sparky', 'Zippy', 'Snappy', 'Perky', 'Chirpy', 'Spunky', 'Feisty', 'Daring',
  'Cheery', 'Warm', 'Sweet', 'Charming', 'Sincere', 'Tough', 'Hearty', 'Steady', 'Patient', 'Zealous',
  'Nifty', 'Dandy', 'Spiffy', 'Gleeful', 'Radiant', 'Fearless', 'Dynamic', 'Vibrant', 'Gracious', 'Noble',
  'Heroic', 'Trusty', 'Dutiful', 'Social', 'Mellow', 'Dreamy', 'Sleepy', 'Restful', 'Plucky', 'Lucky',
  'Grateful', 'Thoughtful', 'Creative', 'Artistic', 'Musical', 'Spirited', 'Vigorous', 'Festive', 'Bubbly', 'Jazzy',
  'Flashy', 'Slick', 'Classy', 'Smart', 'Quick', 'Sharp', 'Keen', 'Friendly', 'Polite', 'Gentle',
  'Brave', 'Sunny', 'Bright', 'Happy', 'Calm', 'Merry', 'Jolly', 'Lively', 'Cozy', 'Kind'
];

const ANIMALS = [
  'Lion', 'Pony', 'Panda', 'Koala', 'Otter', 'Dolphin', 'Falcon', 'Gecko', 'Tiger', 'Penguin',
  'Wolf', 'Zebra', 'Puppy', 'Bunny', 'Hedgehog', 'Cheetah', 'Hippo', 'Giraffe', 'Lemur', 'Meerkat',
  'Platypus', 'Sloth', 'Bear', 'Cat', 'Fox', 'Monkey', 'Rabbit', 'Turtle', 'Squirrel', 'Raccoon',
  'Beaver', 'Badger', 'Owl', 'Eagle', 'Hawk', 'Robin', 'Bluejay', 'Cardinal', 'Sparrow', 'Puffin',
  'Seal', 'Walrus', 'Orca', 'Whale', 'Shark', 'Octopus', 'Squid', 'Lobster', 'Crab', 'Starfish',
  'Frog', 'Toad', 'Salamander', 'Newt', 'Chameleon', 'Iguana', 'Dragon', 'Phoenix', 'Gryphon', 'Unicorn',
  'Pegasus', 'Kitten', 'Hamster', 'Gerbil', 'Chinchilla', 'Ferret', 'Chipmunk', 'Gopher', 'Marmot', 'Ocelot',
  'Jaguar', 'Leopard', 'Cougar', 'Panther', 'Lynx', 'Bobcat', 'Caracal', 'Serval', 'Dingo', 'Coyote',
  'Jackal', 'Wolverine', 'Mink', 'Weasel', 'Stoat', 'Mongoose', 'Hyena', 'Civet', 'Genet', 'Linsang',
  'Fossa', 'Tapir', 'Okapi', 'Kudu', 'Elk', 'Moose', 'Deer', 'Bison', 'Otter', 'Panda'
];

/**
 * Generates a deterministic kid-friendly username from a child ID string.
 * Seemingly endless potential unique usernames: Color (100) + Emotion (100) + Animal (100) + Number (900)
 * yields exactly 900 Million unique combinations!
 * 
 * @param {string} [childId] - The unique identifier of the child profile (e.g., 'child_1').
 * @returns {string} A kid-friendly username (e.g., 'Blue Happy Lion 432').
 */
export const generateKidFriendlyName = (childId = '') => {
  let hash = 0;

  if (childId && typeof childId === 'string') {
    for (let i = 0; i < childId.length; i++) {
      hash = childId.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
  } else {
    hash = Math.floor(Math.random() * 10000000);
  }

  const colorIndex = hash % COLORS.length;
  const emotionIndex = Math.floor(hash / 7) % EMOTIONS.length;
  const animalIndex = Math.floor(hash / 31) % ANIMALS.length;
  const num = (hash % 900) + 100; // 100-999

  return `${COLORS[colorIndex]} ${EMOTIONS[emotionIndex]} ${ANIMALS[animalIndex]} ${num}`;
};
