# <img src="icon.png" alt="Magrana" width="32" height="32"> Magrana

> Magrana: pomegranate in Catalan.

An anagram puzzle game where you form words from a set of letters to progress through increasingly challenging levels.

**Magrana** is designed to be a relaxing yet engaging word puzzle that gradually increases in difficulty. Each level requires you to find more words than the last—how far can you go?

> If you enjoy word games, check out [Mots](https://github.com/rberenguel/mots) - another word puzzle game!

## How to Play

The gameplay is simple:

- Form anagram words using exactly N letters from your available pool of N+M letters
- Each level requires a minimum number of words to advance
- The total number of possible words is shown in parentheses. Can you find them all?
- Drag and drop letters between the answer area and the pool
- As you progress, levels get harder with more letters and higher word requirements

## Controls

- **Mouse/Touch**: Drag letters between the answer zone and the letter pool

## Dictionary

The word list is based on [SCOWL](http://wordlist.aspell.net/) (Spell Checker Oriented Word Lists) by Kevin Atkinson, specifically levels 10-70, which includes common to moderately common English words. Not all possible English words are included—the list is curated to exclude very obscure or rare terms.

## Credits

- **Icon**: Created with Nano Banana Pro (Gemini)
- **Initial Version**: Gemini
- **Final Development**: Claude Code (Anthropic)
- **Dictionary**: SCOWL by Kevin Atkinson

I (Ruben) was also involved but luckily had little to touch in the code (since this reuses some machinery from mots).

## License

MIT License - See LICENSE file for details

Dictionary source (SCOWL) is also freely licensed for use.

---

> **Note**: This game is designed for both mobile and desktop. While it works great on any modern browser, it's optimized for mobile play in portrait orientation.
