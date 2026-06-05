import os
import json
import urllib.request
import re

SGB_WORDS_URL = 'https://raw.githubusercontent.com/charlesreid1/five-letter-words/master/sgb-words.txt'
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, '../src/data')
OUTPUT_FILE = os.path.join(DATA_DIR, 'allowed_words.json')

def fetch_url(url):
    try:
        with urllib.request.urlopen(url) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching URL: {e}")
        raise e

def extract_curriculum_words(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        words = []
        if 'tiers' in data and isinstance(data['tiers'], list):
            for tier in data['tiers']:
                if 'sections' in tier and isinstance(tier['sections'], list):
                    for section in tier['sections']:
                        if 'words' in section and isinstance(section['words'], list):
                            for word_obj in section['words']:
                                if word_obj and 'word' in word_obj:
                                    clean = word_obj['word'].strip().lower()
                                    if re.match(r'^[a-z]{5}$', clean):
                                        words.append(clean)
        return words
    except Exception as e:
        print(f"Warning: Could not parse {file_path}: {e}")
        return []

def main():
    try:
        print('Downloading base 5-letter word list...')
        sgb_content = fetch_url(SGB_WORDS_URL)
        base_words = []
        for line in sgb_content.split('\n'):
            clean = line.strip().lower()
            if re.match(r'^[a-z]{5}$', clean):
                base_words.append(clean)
        
        print(f"Loaded {len(base_words)} base words.")

        print('Scanning curriculum word banks for 5-letter words...')
        curriculum_files = [
            'wordBank_2nd.json',
            'wordBank_3rd.json',
            'wordBank_4th.json',
            'wordBank_5th.json',
            'wordBank_6th.json'
        ]
        
        curriculum_words = []
        for file in curriculum_files:
            file_path = os.path.join(DATA_DIR, file)
            if os.path.exists(file_path):
                words = extract_curriculum_words(file_path)
                print(f"  Extracted {len(words)} words from {file}")
                curriculum_words.extend(words)

        # Merge and deduplicate
        all_words_set = set(base_words + curriculum_words)
        sorted_words = sorted(list(all_words_set))

        print(f"Merged total: {len(sorted_words)} unique 5-letter words.")

        if not os.path.exists(DATA_DIR):
            os.makedirs(DATA_DIR)

        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(sorted_words, f, indent=2)
            
        print(f"Successfully generated {OUTPUT_FILE}")
    except Exception as e:
        print(f"Error: {e}")
        exit(1)

if __name__ == '__main__':
    main()
