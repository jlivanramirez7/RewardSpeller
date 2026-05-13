import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptsMap = {
  '2nd': {
    'tier_g2_t1': 'Welcome, young Padawan! Your training starts with foundational CVC words. Just like stacking basic blocks in Minecraft to build a sturdy shelter before nightfall, you build these words one crisp, short vowel sound at a time. Master the short vowels, and the Force will be with you!',
    'g2_t1_s1': "In Minecraft, craft a 'MAP' to find a pink 'PIG', or watch Hermione's 'CAT' Crookshanks 'SIT' on a wizard's 'HAT'. Short 'a' sounds like the crunch of an apple, and short 'i' sounds like an igloo. Keep your vowel sounds short and crisp to 'WIN' the spelling battle!",
    'g2_t1_s2': "As the twin 'SUN's of Tatooine set, you must 'RUN' from Creepers and hop into a red 'BED'! Today we explore short O, U, and E. Listen for the distinct middle sounds in Hagrid's loyal 'DOG', a magical wooden 'BOX' from Narnia, or Darth Vader's 'RED' lightsaber. Mnemonic: shape your mouth like an 'O' for dog, and make a wide grin for red!",
    
    'tier_g2_t2': "Behold the power of the silent Magic E! Like a secret Jedi Master hiding in the shadows, the 'E' sits silently at the end of a word, using the Force to jump backward over one consonant and make the middle vowel say its own long name! It transforms 'cap' into 'cape' and 'cub' into 'cube'.",
    'g2_t2_s1': "Welcome to Hogwarts! Today we bake a giant birthday 'CAKE' for Harry and play a wizard chess 'GAME'. Notice how the silent 'E' at the end of 'TIME' and 'BIKE' magically forces the 'I' to shout its name! Mnemonic: When 'E' is at the gate, the vowel says its name!",
    'g2_t2_s2': "Step into Bilbo's cozy Hobbit 'HOME' or climb down an elven 'ROPE'! Today we master long O and U. The magic E turns a Minecraft skeleton's 'BONE' into a long 'O' sound, and helps Mr. Tumnus play a beautiful 'TUNE' on his 'FLUTE' in Narnia. Remember: silent E gives all its energy to the vowel!",
    
    'tier_g2_t3': "When two consonant heroes team up, they form powerful alliances! Blends keep both of their original sounds, like 'st' in 'star'. But Digraphs like 'sh', 'ch', and 'th' use magic to fuse together into a brand new sound, just like crafting iron and wood into a shield!",
    'g2_t3_s1': "Enter Diagon Alley's wand 'SHOP' or sail across Narnia on a majestic 'SHIP'! Today we study Digraphs. 'SH' makes the quiet 'shh' sound, 'CH' makes the cheerful 'chat' sound, and 'TH' guides your 'PATH' through the Shire. Tip: place your tongue between your teeth when saying 'WITH' and 'THIS'!",
    'g2_t3_s2': "Look up at the massive Death 'STAR' or climb a Whomping Willow 'TREE'! Today we master consonant blends. When you take a 'STEP' into Narnia or 'FLIP' Anakin's starfighter to dodge a 'TRAP', you hear both consonant sounds blended smoothly together. Listen closely so you don't 'TRIP'!",
    
    'tier_g2_t4': "These legendary words appear everywhere across the galaxy! Some refuse to follow the normal rules of phonics, acting like rebellious space smugglers. You must memorize them by sight and learn them by heart, just as a wizard memorizes their most trusted spells!",
    'g2_t4_s1': "Welcome, Padawan! To read the ancient Jedi archives, you must instantly recognize sight words like 'THE', 'YOU', and 'THEY'. When Obi-Wan 'SAID' to use the Force, or when an owl arrives 'FROM' Hogwarts, these words keep the sentence flowing smoothly. Take a mental snapshot of each one!",
    'g2_t4_s2': "'WHAT' kind of magical creature is in Hagrid's pocket? 'WHEN' the sun rises in Minecraft, 'WHERE' do the skeletons go? Master tricky words like 'COME', 'SOME', and 'BEEN'. Mnemonic: 'COME' and 'SOME' look like 'home' but sound like 'hum'! Memorize them to unlock your spelling magic.",
    
    'tier_g2_t5': "Even in the farthest outer rim of the galaxy, math and science govern the universe! Whether calculating hyperspace jumps on the Millennium Falcon or brewing complex potions at Hogwarts, mastering academic vocabulary is your key to understanding the cosmos.",
    'g2_t5_s1': "Welcome to Potions class! When you 'ADD' ingredients or calculate the 'SUM' of Smaug's gold, you are using math! Whether measuring Harry's eleven-'INCH' wand or staring at a nine-'FOOT' Enderman, these terms help you measure the world. Remember: 'PLUS' brings things together!",
    'g2_t5_s2': "Step through the wardrobe and feel the cold Narnian 'WIND' and 'RAIN'! Science words describe the natural world, from the solid 'ROCK' of the Lonely Mountain to a Minecraft wheat 'SEED' planted in dark 'DIRT'. Watch your spelling 'GROW' as you explore the living universe!"
  },
  '3rd': {
    'tier_g3_t1': "Welcome, young apprentice! Today we master Vowel Teams. When two vowels go walking, the first one usually does the talking! Like Frodo and Sam joining forces on their quest, these vowels unite to make one powerful sound.",
    'g3_t1_s1': "In Minecraft, wait for the 'RAIN' to stop before mining 'CLAY', or board the Hogwarts Express 'TRAIN'! Today we master AI and AY. Notice how 'AI' stays inside words like 'BRAIN' and 'PAINT', while 'AY' loves to 'PLAY' and 'STAY' at the end of 'DAY'. Mnemonic: AI stays inside, AY plays at the end!",
    'g3_t1_s2': "Encounter a giant walking 'TREE' Ent in LOTR, admire Yoda's 'GREEN' skin, or join the Gryffindor Quidditch 'TEAM'! Both EE and EA make the long E sound. Dumbledore needs 'SLEEP', and Hermione loves to 'READ'. Mnemonic: double E cheers long E loud and proud, EA teams up to lead!",
    'g3_t1_s3': "Cross a deep river in a 'BOAT' or watch the Narnian wind 'BLOW' 'SNOW' onto your fur 'COAT'! Today we explore OA and OW. The 'OA' team floats in the middle of 'GOAT' and 'TOAD', while 'OW' makes crops 'GROW' and swords 'GLOW' at the end. Mnemonic: OA floats inside, OW blows at the end!",
    
    'tier_g3_t2': "Affixes are magical ingredients added to base words! Prefixes attach to the front to change a word's destiny, while Suffixes attach to the end to change its purpose. Master these building blocks to expand your spellbook!",
    'g3_t2_s1': "Gollum was 'UNHAPPY' to lose his ring, Hermione used magic to 'UNLOCK' doors, and Sauron tried to 'REMAKE' the world! Prefixes attach to the front: 'UN-' and 'DIS-' mean opposite or not ('DISLIKE', 'UNSAFE'), while 'RE-' means do it again ('REREAD', 'REWRITE').",
    'g3_t2_s2': "Sam was a 'HELPFUL' companion to Frodo, and you must be 'CAREFUL' mining near lava in Minecraft so you don't feel 'PAINFUL' burns! Suffixes attach to the end: '-FUL' means full of, '-LESS' means without ('MINDLESS', 'HOPELESS'), and '-LY' describes how you move ('QUICKLY', 'SLOWLY').",
    
    'tier_g3_t3': "Break massive words into manageable blocks! Compound words weld two independent words together like building a Minecraft castle, while multi-syllable words can be split between consonant cores like chopping firewood in the Shire.",
    'g3_t3_s1': "Enjoy warm 'SUNSHINE' in the Shire, pack your Minecraft 'BACKPACK', or catch a 'SNOWFLAKE' in Narnia! Compound words fuse two complete words into one. Look closely to spot 'BUTTER' and 'FLY' in 'BUTTERFLY', or 'CAMP' and 'FIRE' in 'CAMPFIRE'. Mnemonic: find the two smaller words hiding inside!",
    'g3_t3_s2': "Radagast traveled with giant 'RABBIT's, Gimli swung a heavy 'HAMMER', and Narnia suffered an endless 'WINTER'. When spelling multi-syllable words, slice directly between the double consonants (RAB-BIT, KIT-TEN, SUD-DEN, LES-SON). This splits the word into easy, bite-sized pieces!",
    
    'tier_g3_t4': "Beware the Jedi mind trick of Homophones! Words that sound identical but have completely different spellings and meanings. You must evaluate sentence context clues to choose your correct spelling path.",
    'g3_t4_s1': "Frodo could 'SEE' the dark tower, while elven ships sailed on the salt 'SEA'. You need 'TWO' galleons 'TO' 'BUY' a wand 'TOO'! Use context clues to know when to write 'FOR' (purpose) versus 'FOUR' (number), or 'BY' (near) versus 'BUY' (purchase). Context is your spelling compass!",
    
    'tier_g3_t5': "Math and Science govern the entire galaxy! Whether brewing potions at Hogwarts or calculating hyperspace routes on Star Wars starships, academic terms are your ultimate analytical tools.",
    'g3_t5_s1': "Welcome to Potions and Arithmancy! When you 'ADD' potion drops, 'SUBTRACT' rings of power from Sauron, or calculate the 'TOTAL' 'SUM' of Erebor's gold, you are mastering math vocabulary. These words help you 'MEASURE' and 'GRAPH' the exact 'SHAPE' and 'PATTERN' of the universe!",
    'g3_t5_s2': "Study Professor Sprout's Mandrake 'PLANT', admire Aslan the talking 'ANIMAL', or feel the Star Wars 'FORCE' and 'ENERGY' across 'SPACE'! Science vocabulary categorizes matter into 'SOLID' rock, bubbling 'LIQUID' potions, and dragon breath 'GAS'. Master them to explore any 'PLANET'!"
  },
  '5th': {
    'tier_g5_t1': "Welcome, young Padawan! Today we face the deceptive OUGH trigraph and complex diphthongs. Navigating these vowel patterns is as tough as flying through an asteroid field. Use the Force to master their distinct sounds!",
    'g5_t1_s1': "The 'OUGH' trigraph is a master of disguise! 'ALTHOUGH' Creepers approached, Steve had a 'THOROUGH' 'THOUGHT'. General Grievous had a nasty 'COUGH', and Nether terrain is 'ROUGH' and 'TOUGH'. Mnemonic: Group OUGH words by their sound family—/aw/ in 'BROUGHT' versus /uff/ in 'TOUGH'.",
    'g5_t1_s2': "Watch Han Solo the 'ASTRONAUT' pilot his ship, join the Narnian 'AUDIENCE' to 'APPLAUD' Aslan the 'AUTHENTIC' king, or build an 'AUTOMATIC' Minecraft farm! The 'AU' team launches the crisp /aw/ sound. Approach the Nether with 'CAUTION' and guard your ship's 'EXHAUST'!",
    'g5_t1_s3': "Edmund felt 'AWKWARD' meeting the White Witch, but the Argonath statues were truly 'AWESOME'. Legolas had 'FLAWLESS' aim, while Tatooine remained a 'LAWLESS' realm. The 'AW' team also makes the /aw/ sound, preferring the end of syllables or before L, N, and K ('SPRAWL', 'WITHDRAW').",
    
    'tier_g5_t2': "Construct words like ancient Dwarves carving the halls of Moria! Latin roots hold the core meaning of advanced vocabulary. Master the base root, and you unlock dozens of complex words.",
    'g5_t2_s1': "Lord Vader arrived to 'INSPECT' the Death Star, while all Middle-earth showed 'RESPECT' to Aragorn. The Triwizard Tournament was a spectacular 'SPECTACLE' for every 'SPECTATOR'. The Latin root 'SPECT' means 'to look or watch'. Keep things in 'PERSPECTIVE' as you examine this root!",
    'g5_t2_s2': "Steve must 'CONSTRUCT' redstone 'INFRASTRUCTURE', while the Death Star activates its self-'DESTRUCT' sequence! Obi-Wan is a master 'INSTRUCTOR' who will 'INSTRUCT' Luke. The Latin root 'STRUCT' means 'to build'. Don't let tricky spelling 'OBSTRUCT' your building progress!",
    'g5_t2_s3': "The Arkenstone's glow will 'ATTRACT' greedy eyes, the White Witch will 'DISTRACT' Edmund, and Anakin's lightsaber will 'RETRACT'. The Latin root 'TRACT' means 'to drag or pull'. Whether using a 'TRACTOR' beam or signing a 'CONTRACT' with Bilbo, this root pulls your vocabulary together!",
    
    'tier_g5_t3': "Defeating massive polysyllabic words is like battling an Ender Dragon! Slice them into prefixes, roots, and suffixes to conquer them easily.",
    'g5_t3_s1': "Creeper behavior is completely 'UNPREDICTABLE', Frodo 'DISAPPEARED' using the Ring, and Narnia is filled with 'SUPERNATURAL' magic! Prefixes attach to the front: 'UN-', 'DIS-', and 'MIS-' ('MISUNDERSTANDING') flip meaning, while 'INTER-' connects across borders ('INTERNATIONAL').",
    'g5_t3_s2': "R2-D2 enables galactic 'COMMUNICATION', Frodo bore the heavy 'RESPONSIBILITY', and entering Erebor was a major 'ACCOMPLISHMENT'. Suffixes attach to the end: '-TION', '-ITY', and '-MENT' ('EXCITEMENT') transform active verbs and adjectives into formidable, structured nouns.",
    'g5_t3_s3': "Gandalf focused on the 'IDENTIFICATION' of the Ring, while the Pevensie 'DISAPPEARANCE' shocked their uncle. Anakin's 'TRANSFORMATION' into Vader was tragic. When facing mega-words with combined affixes ('UNPREDICTABILITY', 'MISINTERPRETATION'), peel them off like onion layers to isolate the root!",
    
    'tier_g5_t4': "Welcome, master detective! Some words are shape-shifters, as deceptive as Sith Lords. Homophones sound alike but differ in spelling, while Homographs share spelling but shift meaning and pronunciation.",
    'g5_t4_s1': "Aslan's return will 'AFFECT' (verb) the winter, breaking its freezing 'EFFECT' (noun). Obi-Wan lived by the 'PRINCIPLE' (rule) of protecting the 'PRINCIPAL' (main) galaxy. The Death Star remained 'STATIONARY' (still) while Hermione bought 'STATIONERY' (paper). Match the spelling to the role!",
    'g5_t4_s2': "Homographs share exact spelling but split meaning and sound! The Pevensies were 'CONTENT' (happy) with the 'CONTENT' (items) of Narnia. Tatooine is a harsh 'DESERT', but Aslan will never 'DESERT' his people. Steve had one 'MINUTE' (time) to examine the 'MINUTE' (tiny) details of his 'PROJECT'.",
    
    'tier_g5_t5': "Welcome, scholar! To excel at Hogwarts or the Jedi Academy, you must master academic terms. These subject-specific vocabulary words are your keys to advanced knowledge.",
    'g5_t5_s1': "Science vocabulary unlocks the physical world! Explore the forest 'ECOSYSTEM' of Endor, understand 'PHOTOSYNTHESIS' in Narnia's talking trees, or test Hermione's 'HYPOTHESIS' in Snape's 'LABORATORY'. Master concepts like 'GRAVITY', 'EVAPORATION', and 'RESPIRATION' to understand living 'ORGANISM's.",
    'g5_t5_s2': "Social Studies examines history and culture! Restoring the 'GOVERNMENT' and 'CONSTITUTION' of Narnia, fighting for 'DEMOCRACY' in the Galactic Senate, or studying the farming 'ECONOMY' and 'AGRICULTURE' of the Shire. Understand how 'REVOLUTION' shapes human 'CIVILIZATION'!",
    'g5_t5_s3': "Math and ELA vocabulary pairs geometric precision with literary analysis! Steve's crafting table is a 'QUADRILATERAL' with 'PERPENDICULAR' sides and a secure 'PERIMETER'. In ELA, Frodo is our hero 'PROTAGONIST' fighting the evil 'ANTAGONIST' Sauron using 'METAPHOR' and 'ALLITERATION'."
  },
  '6th': {
    'tier_g6_t1': "Delve into the ancient roots of language! Advanced Greek roots are the foundation of scientific vocabulary. Master bio- (life), geo- (earth), and photo- (light) to decode complex academic texts.",
    'g6_t1_s1': "Master 'BIO-', the Greek root of life! Hermione excelled in magical 'BIOLOGY', Endor boasts a lush 'BIOSPHERE', and Minecraft jungles possess incredible 'BIODIVERSITY' (pandas, ocelots). Whether reading Dumbledore's 'BIOGRAPHY' or admiring 'BIOLUMINESCENT' glow squids, BIO signals living systems!",
    'g6_t1_s2': "Explore 'GEO-', the Greek root of earth! The dwarves of Erebor mastered 'GEOLOGY' to find the Arkenstone, while Gandalf mapped the vast 'GEOGRAPHY' of Middle-earth. In Minecraft, mine deep to find an amethyst 'GEODE' or utilize 'GEOTHERMAL' energy. GEO grounds your spelling in physical earth!",
    'g6_t1_s3': "Capture 'PHOTO-', the Greek root of light! Colin Creevey snapped a 'PHOTOGRAPH' of Harry, Minecraft crops rely on 'PHOTOSYNTHESIS', and the Death Star superlaser unleashed a massive 'PHOTON' beam. Endermen are 'PHOTOSENSITIVE' and teleport away from bright flashes. PHOTO illuminates light energy!",
    
    'tier_g6_t2': "Master the art of shape-shifting prefixes! Assimilated prefixes change their final consonant to match the starting letter of the root word, ensuring seamless pronunciation.",
    'g6_t2_s1': "It seemed 'IMPOSSIBLE' to destroy the Death Star, the Elves are 'IMMORTAL', and the dark side created an 'IMBALANCE' in the Force! To make pronunciation seamless, the prefix 'IN-' (meaning not) assimilates into 'IM-' before roots starting with P, M, or B ('IMPERFECT', 'IMMATURE').",
    'g6_t2_s2': "The stone pillars of Narnia 'SUPPORT' a massive roof, while the realm had to 'SUFFER' a century of winter as the Empire tried to 'SUPPRESS' the Jedi. The prefix 'SUB-' (meaning under) assimilates into 'SUF-' or 'SUP-' depending on the root ('SUPPLANT', 'SUPPLEMENT'). See how smoothly it glides!",
    'g6_t2_s3': "In Minecraft, 'COMBINE' damaged tools to repair them, cause a 'COMMOTION' in Gryffindor Tower, or show 'COMPASSION' like Luke Skywalker! The prefix 'CON-' (meaning together) assimilates into 'COM-' before roots starting with B, M, and P ('COMPETE', 'COMPILE', 'COMPLEX'). Stronger together!",
    
    'tier_g6_t3': "Listen to the underlying rhythm of language! Discover the elusive Schwa sound in unstressed syllables, and observe how shifting syllable stress transforms word meaning and function.",
    'g6_t3_s1': "Finding a pink sheep is a rare 'PHENOMENON', the sun sets on the Narnian 'HORIZON', and the author of dark spellbooks remains 'ANONYMOUS'. The elusive Schwa is a lazy, unstressed vowel sound whispering a soft /uh/ or /ih/ (like the 'a' in 'anonymous' or 'e' in 'SOVEREIGN'). Listen for the whisper!",
    'g6_t3_s2': "Notice how vocal stress shifts when words change form! The beat shifts from 'photo' to 'PHOTOGRAPHY', or from 'compete' to 'COMPETITIVE'. Whether admiring 'MAGNIFICENT' Minas Tirith, reading the 'DECLARATION' of the Empire, or demanding an 'EXPLANATION', feel the rhythmic beat shift!",
    
    'tier_g6_t4': "Words are like a painter's palette! Discover shades of intensity to choose the exact right word, and become a word detective by using surrounding context clues to decode unfamiliar vocabulary.",
    'g6_t4_s1': "Not all big things are merely 'big'. Minecraft map details are 'MINUTE', Erebor held 'SUBSTANTIAL' gold, the Balrog was 'COLOSSAL', and the Death Star was 'FORMIDABLE'! Hermione was 'PETRIFIED' by the Basilisk, and Harry was 'ASTOUNDED'. Master the exact shade of intensity from spark to inferno!",
    'g6_t4_s2': "When encountering mystery words, analyze surrounding context clues! Steve stood on a 'PRECARIOUS' cliff, droids are 'UBIQUITOUS' across the galaxy, and the beauty of Lothlórien felt 'EPHEMERAL'. Whether Gimli's axe can 'CLEAVE' stone or Frodo remains 'RESOLUTE', let context unlock the meaning!",
    
    'tier_g6_t5': "Prepare for the rigorous trials of high school! Master the heavy-hitting academic vocabulary used by advanced scholars to analyze arguments, evaluate theories, and describe complex structures.",
    'g6_t5_s1': "Master the scholar's analytical toolkit! Elrond must 'ANALYZE' ancient texts, Hermione will 'SYNTHESIZE' library books, and the Rebel Alliance will 'FORMULATE' battle plans. Use powerful verbs like 'EVALUATE', 'ELABORATE', 'INFER', 'DEDUCE', and 'VALIDATE' to craft flawless, high school level essays!",
    'g6_t5_s2': "Build an unshakeable framework for your arguments! A redstone repeater is a vital 'COMPONENT', the Death Star's 'FUNCTION' was intimidation, and Creeper explosions destroy wooden 'FRAMEWORK's. Use structural terms like 'FACILITATE', 'IMPLEMENT', 'MODIFY', 'DERIVE', and 'INNOVATION' to prove your perspective!"
  }
};

const grades = ['2nd', '3rd', '5th', '6th'];

grades.forEach(grade => {
  const filePath = path.join(__dirname, 'src', 'data', `wordBank_${grade}.json`);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ Skipping missing file: ${filePath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const gradeScripts = scriptsMap[grade] || {};

  data.tiers.forEach(tier => {
    const tierKey = `tier_${tier.id}`;
    if (gradeScripts[tierKey]) {
      tier.lessonScript = gradeScripts[tierKey];
    }

    tier.sections.forEach(section => {
      if (gradeScripts[section.id]) {
        section.lessonScript = gradeScripts[section.id];
      }
    });
  });

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Successfully upgraded lesson scripts in ${filePath}`);
});

console.log('🎉 All lesson scripts upgraded successfully!');
