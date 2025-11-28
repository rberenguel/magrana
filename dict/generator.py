import json
import sys
from collections import defaultdict

# Config
MIN_LEN = 3
MAX_LEN = 8

def main():
    # Accept input file from CLI or use default
    INPUT_FILE = sys.argv[1] if len(sys.argv) > 1 else 'words.txt'
    OUTPUT_FILE = 'dictionary.json'

    print(f"Processing {INPUT_FILE}...")

    try:
        # Try UTF-8 first, fall back to latin-1 if needed
        try:
            with open(INPUT_FILE, 'r', encoding='utf-8') as f:
                lines = f.read().splitlines()
        except UnicodeDecodeError:
            print("UTF-8 decode failed, trying latin-1...")
            with open(INPUT_FILE, 'r', encoding='latin-1') as f:
                lines = f.read().splitlines()
    except FileNotFoundError:
        print(f"Error: {INPUT_FILE} not found.")
        sys.exit(1)

    # Build Map: Sorted Letters -> List of Words
    anagram_map = defaultdict(list)
    
    for word in lines:
        w = word.strip().lower()
        if not w.isalpha() or len(w) < MIN_LEN or len(w) > MAX_LEN:
            continue
        
        key = "".join(sorted(w))
        if w not in anagram_map[key]:
            anagram_map[key].append(w)

    # Sort output for determinism
    final_dict = {k: sorted(v) for k, v in anagram_map.items()}

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_dict, f)
    
    print(f"Generated {OUTPUT_FILE} with {len(final_dict)} anagram bases.")

if __name__ == '__main__':
    main()