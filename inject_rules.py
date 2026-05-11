import json

# DEFINITIVE GLOBAL MASTER RULESET SYNTHESIS
RULE_BANK = {
    1: [
        "Put 'I' before 'E' for most words you see! But if you spot a sneaky 'C' in front, flip them to 'E-I' to win!",
        "When double 'E's team up, they cheer their long 'E' sound together loud and proud!",
        "The 'EA' team is a master of disguise! Sometimes they whisper a short 'e' sound instead of speaking their name.",
        "Loud and brave! Both 'OU' and 'OW' shout 'OW!' together, just like you bumped your funny bone!",
        "The Bossy R Commander takes over the vowel and marches it to a fun pirate 'AR' or powerful 'OR' sound!",
        "Two words join forces! Keep their complex vowel sounds protected and strong when they combine!"
    ],
    2: [
        "You are a master builder! The root 'struct' means to build, which is how words construct their meaning!",
        "Keep moving forward! The root 'port' means to carry, helping you transport words wherever they need to go!",
        "Look far and wide! 'Bio' means life and 'tele' means far off—together they help you see the world around you!",
        "Make your mark! The Greek root 'graph' means to write or draw, turning your spelling into a work of art!",
        "Get ready to transform! 'Pre-' means it comes before, while 'dis-' means the opposite or not—you've got this!",
        "You can do anything! Use '-able' to say something can be done, and '-ful' to fill your words with greatness!"
    ],
    3: [
        "Slice your lightsaber directly between two consonants to split the syllable cores! (Example: RAB-BIT)",
        "Strike BEFORE the single consonant to leave the first vowel open, allowing it to shout its powerful long name! (Example: TI-GER)",
        "Trap the rogue vowel by slicing AFTER the single consonant, forcing it into a safe, short sound! (Example: CAM-EL)",
        "The ancient '-LE' portal always captures the consonant right before it to form the final syllable! (Example: TUR-TLE)",
        "Defeat the lazy Schwa vowel that gives up its true power in unstressed syllables to make a dark 'uh' grunt!",
        "Fuse two complete base words into a mighty mega-word, then slice exactly where the welding seam meets!"
    ],
    4: [
        "Distinguish possession from contraction or location: use 'here' clues for place (there) and 'is/are' replacement checks for apostrophes.",
        "Apply sensory and quantity cues: remember that you 'hear' with your 'ear', and 'whole' implies the entire item.",
        "Differentiate commerce and sensory actions: isolate purchase verbs ('buy') and monetary units ('cent') from prepositions.",
        "Resolve states of nature and behavior: separate the woodland animal ('deer') and coloring ('dye') from affections ('dear').",
        "Differentiate organic growth and physical form: isolate culinary products ('flour') and parts of the foot ('heel') from blooms.",
        "Master silent letters and social categories: separate units of time ('hour') and armored warriors ('knight') from group ownership ('our')."
    ],
    5: [
        "Greek roots dominate: 'photo-' (light) and 'eco-' (environment) form compounds, and 'y' acts as short /i/ in the middle.",
        "Focus on the Greek digraph 'ph' creating the /f/ sound in atmospheric terms, and note terminal 'y' acting as a long /e/.",
        "Built on Latin roots such as 'fract' (broken), using common '-tion' for /shun/ sound and soft 'c' before 'i'.",
        "Features numerical prefixes (poly-, tri-) and pairs geometric descriptors like twin 'll' in 'parallel' and 'magic e'.",
        "Derived from ancient artifacts and titles, using unique Greek/Egyptian constructs like 'ao' in 'pharaoh' and 'y' in 'pyramid'.",
        "Abstract societal nouns rely heavily on Latin suffixation, utilizing '-tion' for action (revolution) and '-ty' for quality."
    ]
}

PATH = "src/data/wordBank.json"

def run():
    with open(PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Inject Rules Iteratively
    for tier in data.get("tiers", []):
        tier_id = int(tier.get("id", 0))
        rules_for_tier = RULE_BANK.get(tier_id, [])
        
        print(f"Processing Tier {tier_id}...")
        
        for i, section in enumerate(tier.get("sections", [])):
            # Safe boundary check to fallback gracefully if count mismatch
            rule_str = rules_for_tier[i] if i < len(rules_for_tier) else tier.get("rule", "Keep learning!")
            section["rule"] = rule_str
            print(f"  - Added rule to Section {i+1}: {section['name']}")
            
    # Final Flush
    with open(PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print("\n🚀 INJECTION SUCCESSFUL: All 30 unique rules burned to wordBank.json.")

run()
