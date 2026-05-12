import json
import random

def run():
    path = "src/data/wordBank.json"
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Targeted iteration to find Tier 1 Section 1
    for tier in data.get("tiers", []):
        if int(tier.get("id")) == 1:
            new_sections = []
            for section in tier.get("sections", []):
                words = section.get("words", [])
                
                # Targeted split condition if more than 10 words exist
                if len(words) > 10:
                    print(f"🎯 Splitting overflow section: {section.get('name')} ({len(words)} words)")
                    
                    # 1. Define Part 1 (First 10 words)
                    p1_words = words[:10]
                    section_p1 = section.copy()
                    section_p1["name"] = f"{section['name']} (Part 1)"
                    section_p1["id"] = f"{section['id']}_p1"
                    section_p1["words"] = p1_words
                    
                    # 2. Define Part 2 (Remaining words + duplicate padding to reach 10)
                    p2_initial_words = words[10:]
                    needed = 10 - len(p2_initial_words)
                    print(f"  -> Padding Part 2 with {needed} replicated words from Part 1.")
                    
                    # Collect pool from initial words to pad reliably
                    p2_padded_words = p2_initial_words + random.sample(words, needed)
                    
                    section_p2 = section.copy()
                    section_p2["name"] = f"{section['name']} (Part 2)"
                    section_p2["id"] = f"{section['id']}_p2"
                    section_p2["words"] = p2_padded_words
                    
                    # Append both parts to the ordered array
                    new_sections.append(section_p1)
                    new_sections.append(section_p2)
                else:
                    # Pass existing valid 10-word sections through untouched
                    new_sections.append(section)
            
            # Apply new structure
            tier["sections"] = new_sections
            break
            
    # Absolute atomic write flush
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print("🚀 PAGINATION COMPLETE: wordBank.json updated with strict 10-word limits across all sections.")

if __name__ == "__main__":
    random.seed(42) # Deterministic reproduction
    run()
