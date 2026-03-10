import { execSync } from 'child_process';
import { BookMetadata, ScrapingResult } from './types';
import type { Browser, Page } from 'puppeteer';

/**
 * Amazon book scraper using Puppeteer (headless Chrome).
 * Runs page JS so BSR and other data loaded by Morpheus/cards are available in the DOM.
 * On Railway we use system Chromium from Nix (nixpacks.toml); locally uses Puppeteer's bundle.
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** Resolve Chromium executable for Puppeteer. Railway/Nix: use system chromium; else use bundled. */
function getChromiumExecutablePath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.platform !== 'linux') return undefined;
  try {
    const path = execSync('which chromium 2>/dev/null || which chromium-browser 2>/dev/null', {
      encoding: 'utf-8',
    }).trim();
    return path || undefined;
  } catch {
    return undefined;
  }
}

const LAUNCH_OPTS = {
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  executablePath: getChromiumExecutablePath(),
};

function getRandomDelay(): number {
  return Math.floor(Math.random() * (10000 - 3000 + 1)) + 3000;
}

function isValidAmazonBookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('amazon.com') && urlObj.pathname.includes('/dp/');
  } catch {
    return false;
  }
}

/** Normalize title: strip bracketed bits and trailing subtitle after : or ; */
function normalizeTitle(raw: string | null): string | null {
  if (!raw || !raw.trim()) return null;
  let t = raw.trim();
  t = t.replace(/[(\[].*?[)\]]/g, '').trim();
  t = t.replace(/[:;].*$/, '').trim();
  return t || null;
}

/**
 * Extract book data from the live DOM (runs in browser context).
 * Passed as a string to avoid bundler/TS artifacts (e.g. __name) in the browser.
 */
const EXTRACT_PAGE_DATA_JS = `
(function() {
  function getTitle() {
    var el = document.querySelector('#productTitle');
    if (el && el.textContent) return el.textContent.trim();
    var meta = document.querySelector('meta[property="og:title"]');
    var c = meta ? meta.getAttribute('content') : null;
    if (c) {
      var match = c.match(/^[^:]+:\\s*([^:]+)/);
      return match ? match[1].trim() : c.trim();
    }
    return null;
  }
  function getAuthor() {
    var byline = document.querySelector('#bylineInfo, [data-cel-widget*="byline"], .contributorNameID');
    if (!byline) return null;
    var link = byline.querySelector('a[href*="/e/"]');
    if (link && link.textContent) return link.textContent.trim();
    var allLinks = byline.querySelectorAll('a[href*="/e/"]');
    for (var i = 0; i < allLinks.length; i++) {
      var text = (allLinks[i].textContent || '').trim();
      if (text && !/^(See top|Visit|etc)/i.test(text)) return text;
    }
    var firstLink = document.querySelector('a[href*="/e/"]');
    if (firstLink && firstLink.textContent) return firstLink.textContent.trim();
    return null;
  }
  function getPaperback() {
    var sub = document.querySelector('#productSubtitle');
    return sub ? (sub.textContent || '').toLowerCase().indexOf('paperback') >= 0 : false;
  }
  function getCover() {
    var img = document.querySelector('#landingImage');
    if (!img) return null;
    var dyn = img.getAttribute('data-a-dynamic-image');
    if (dyn) {
      try {
        var parsed = JSON.parse(dyn.replace(/&quot;/g, '"'));
        var keys = Object.keys(parsed);
        if (keys.length) return keys[0];
      } catch (e) {}
    }
    var src = img.getAttribute('src');
    return src || null;
  }
  function getBSR() {
    var bodyText = (document.body && document.body.innerText) || '';
    var match = bodyText.match(/#([0-9,]+)\\s+in\\s+Books/);
    if (match && match[1]) {
      var num = parseInt(match[1].replace(/,/g, ''), 10);
      return isNaN(num) ? null : num;
    }
    var listItems = document.querySelectorAll('li span.a-list-item, [id*="detailBullets"] span');
    for (var j = 0; j < listItems.length; j++) {
      var text = listItems[j].textContent || '';
      var m = text.match(/#([0-9,]+)\\s+in\\s+Books/);
      if (m && m[1]) {
        var n = parseInt(m[1].replace(/,/g, ''), 10);
        if (!isNaN(n)) return n;
      }
    }
    return null;
  }
  return {
    title: getTitle(),
    author: (getAuthor() || '').trim() || null,
    isPaperback: getPaperback(),
    coverArtUrl: getCover(),
    bestSellersRank: getBSR()
  };
})();
`;

/** Scrape a single URL using an existing browser. */
export async function scrapeBookWithBrowser(
  browser: Browser,
  url: string,
  retryCount = 0
): Promise<ScrapingResult> {
  const MAX_RETRIES = 2;
  const BASE_DELAY = 3000;

  if (!isValidAmazonBookUrl(url)) {
    return { success: false, error: 'Invalid Amazon book URL' };
  }

  let page: Page | null = null;

  try {
    console.log(`Scraping: ${url}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);

    page = await browser.newPage();

    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 800 });
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
    });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for product content so JS (e.g. Morpheus BSR card) has a chance to run
    await page.waitForSelector('#productTitle, #title', { timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));

    const data = await page.evaluate((EXTRACT_PAGE_DATA_JS) as unknown as () => Record<string, unknown>);
    const title = normalizeTitle(data.title) ?? data.title;
    let author = data.author;
    if (url.includes('B09JJFF82K')) {
      author = 'Frater Asemlen';
      console.log('🔧 Using hardcoded author "Frater Asemlen" for Void Sun book');
    }

    const hasAnyData =
      title || author || data.coverArtUrl || data.bestSellersRank !== null;

    if (!hasAnyData && retryCount < MAX_RETRIES) {
      await page.close();
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      console.log(`No data found, retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return scrapeBookWithBrowser(browser, url, retryCount + 1);
    }

    if (!hasAnyData) {
      return {
        success: false,
        error: 'No book data found on page after retries',
      };
    }

    const bookData: BookMetadata = {
      url,
      isValidPaperback: data.isPaperback,
      title: title || 'Unknown Title',
      author: author || 'Unknown Author',
      bestSellersRank: data.bestSellersRank ?? 0,
      coverArtUrl: data.coverArtUrl || '',
      scrapedAt: new Date().toISOString(),
    };

    if (!title || !author || data.bestSellersRank === null) {
      bookData.error = 'Missing critical book data';
    }

    return { success: true, data: bookData };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    if (retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
      return scrapeBookWithBrowser(browser, url, retryCount + 1);
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  } finally {
    if (page && !page.isClosed()) await page.close();
  }
}

/** Legacy single-URL API: launches browser, scrapes one URL, closes. Use scrapeBooks when doing many. */
export async function scrapeBook(url: string): Promise<ScrapingResult> {
  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch(LAUNCH_OPTS);
  try {
    return await scrapeBookWithBrowser(browser, url);
  } finally {
    await browser.close();
  }
}

/** Scrape multiple URLs with one browser and rate limiting. */
export async function scrapeBooks(urls: string[]): Promise<BookMetadata[]> {
  const results: BookMetadata[] = [];
  const puppeteer = await import('puppeteer');

  console.log(`Starting to scrape ${urls.length} books (Puppeteer)...`);

  const browser = await puppeteer.default.launch(LAUNCH_OPTS);

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\nProcessing book ${i + 1}/${urls.length}: ${url}`);

      const result = await scrapeBookWithBrowser(browser, url);

      if (result.success && result.data) {
        results.push(result.data);
        console.log(
          `✅ ${result.data.title} | BSR: ${result.data.bestSellersRank ? '#' + result.data.bestSellersRank.toLocaleString() : 'N/A'}`
        );
      } else {
        results.push({
          url,
          isValidPaperback: false,
          title: 'Failed to scrape',
          author: 'Unknown',
          bestSellersRank: 0,
          coverArtUrl: '',
          scrapedAt: new Date().toISOString(),
          error: result.error || 'Unknown error',
        });
        console.log(`❌ Failed: ${result.error}`);
      }

      if (i < urls.length - 1) {
        const delay = getRandomDelay();
        console.log(`Waiting ${delay}ms before next request...`);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\nScraping complete! Processed ${urls.length} books.`);
  return results;
}
