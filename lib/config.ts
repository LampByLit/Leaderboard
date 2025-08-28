/**
 * Shared configuration file
 * Single source of truth for all URLs and settings
 */

// Hardcoded URLs to scrape (update this file to add/remove books)
export const HARDCODED_URLS = [
  'https://www.amazon.com/NUTCRANKR-Dan-Baltic/dp/195189779X',
  'https://www.amazon.com/Libertine-Dissolves-Toxic-Brodude/dp/B0F5YL43FD',
  'https://www.amazon.com/Finally-Some-Good-Delicious-Tacos/dp/1790356229',
  'https://www.amazon.com/Improvidence-David-Herod/dp/B0CWCF7J13',
  'https://www.amazon.com/INCEL-Novel-ARX-Han/dp/B0CJLCZVCG',
  'https://www.amazon.com/dp/B0BRC7Z2Q9',
  'https://www.amazon.com/Eggplant-Ogden-Nesmer/dp/B09MJBNL7X',
  'https://www.amazon.com/Tower-Jack-BC/dp/0645928208',
  'https://www.amazon.com/Mixtape-Hyperborea-Adem-Luz-Rienspects/dp/B0BW32CX2G', 
  'https://www.amazon.com/Savage-Green-Zulu-Alitspa/dp/B0B9265BPY',
  'https://www.amazon.com/Shards-City-Robert-James-Cross/dp/B0DLGLKGFB',
  'https://www.amazon.com/SOCIOPATH-primadonna-girl-SAGA-dreamlander/dp/B09CV11BM9',
  'https://www.amazon.com/Book-Void-Sun-Lion-Serpent-feet-Christ/dp/B09JJFF82K',
  'https://www.amazon.com/Beautiful-Kingdom-K-K-Wing/dp/B0BTRTBP5H/',
  'https://www.amazon.com/Last-Free-Man-Other-Stories/dp/1925536882', 
  'https://www.amazon.com/Odyssey-Dingbats-collection-stories-obscurities/dp/B0DT6X7HJ9',  
  'https://www.amazon.com/Worst-Boyfriend-Ever-Sensitive-Young/dp/B0F3XSJGSD',
  'https://www.amazon.com/Black-Album-Matthew-Pegas/dp/B0CZ4MCD7X',
  'https://www.amazon.com/Soap-Scum-Jesse-Larkins/dp/B0DFTCW5XV',
  'https://www.amazon.com/Call-Crocodile-Horrors-F-Gardner/dp/B098JL3WY3/',
  'https://www.amazon.com/dp/B0DZVMX6KV/',
  'https://www.amazon.com/Raft-Micro-Novel-Phil-Rot/dp/B0DQ5PV8BX',
  'https://www.amazon.com/dp/195759909X',
  'https://www.amazon.com/Meme-Max-Lethe/dp/1951897935',
  'https://www.amazon.com/Egregore-Gothic-Horror-Spencer-Weedman/dp/B0B5KVDCR6',
  'https://www.amazon.com/dp/B0FMTPXNPM',
  'https://www.amazon.com/Give-Up-Ghost-P-C-M-Christ/dp/B0DCWJL387',
  'https://www.amazon.com/Gothic-Violence-Mike-Ma/dp/B096Z7J6C1',
  'https://www.amazon.com/LAcad%C3%A9mie-R-C-Waldun/dp/0648963209',
  'https://www.amazon.com/ESKETIT-quindelin-_/dp/B0863V2KCT',
  // Add more URLs here as needed
];

// Scraping settings
export const SCRAPING_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  rateLimitDelay: 3000,
  maxConcurrent: 1,
}; 
