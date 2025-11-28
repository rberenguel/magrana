import json
import sys
from collections import defaultdict

# Config
MIN_LEN = 3
MAX_LEN = 8

def strip_accents(text):
    """Strip accented characters and replace with ASCII equivalents."""
    replacements = {
        'á': 'a', 'à': 'a', 'â': 'a', 'ä': 'a', 'ã': 'a', 'å': 'a',
        'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
        'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
        'ó': 'o', 'ò': 'o', 'ô': 'o', 'ö': 'o', 'õ': 'o',
        'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
        'ñ': 'n', 'ç': 'c', 'ý': 'y', 'ÿ': 'y'
    }
    result = text
    for accented, plain in replacements.items():
        result = result.replace(accented, plain)
    return result

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
    skipped_count = 0

    for word in lines:
        w = word.strip().lower()

        # Strip accents from the word
        w_clean = strip_accents(w)

        # Only keep words that are pure ASCII alpha after accent stripping
        if not w_clean.isalpha() or len(w_clean) < MIN_LEN or len(w_clean) > MAX_LEN:
            if w != w_clean:
                skipped_count += 1
            continue

        key = "".join(sorted(w_clean))
        if w_clean not in anagram_map[key]:
            anagram_map[key].append(w_clean)

    # Sort output for determinism
    final_dict = {k: sorted(v) for k, v in anagram_map.items()}

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_dict, f)

    print(f"Generated {OUTPUT_FILE} with {len(final_dict)} anagram bases.")
    if skipped_count > 0:
        print(f"Stripped accents from {skipped_count} words.")

if __name__ == '__main__':
    main()