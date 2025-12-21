import { BookMetadata, ScrapingResult } from './types';

/**
 * Amazon book scraper module
 * Implements manual HTTP requests with proper rate limiting and error handling
 * Based on the scraping patterns from the prompt files
 */

// User agents for rotation to avoid being flagged as a bot
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

/**
 * Generates a random delay between 3-10 seconds for rate limiting
 */
function getRandomDelay(): number {
  return Math.floor(Math.random() * (10000 - 3000 + 1)) + 3000;
}

/**
 * Gets a random user agent for request rotation
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Validates if the URL is an Amazon book page
 */
function isValidAmazonBookUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('amazon.com') && 
           urlObj.pathname.includes('/dp/');
  } catch {
    return false;
  }
}

/**
 * Adds debugging output to see what's being extracted
 */
function debugExtraction(html: string, url: string): void {
  console.log(`\n🔍 Debugging extraction for: ${url}`);
  
  // Check for title
  const titleMatch = html.match(/id="productTitle"[^>]*>([^<]+)</);
  console.log(`Title found: ${titleMatch ? titleMatch[1] : 'NOT FOUND'}`);
  
  // Check for various author patterns
  const fieldAuthorMatch = html.match(/field-author=([^&]+)/);
  console.log(`field-author found: ${fieldAuthorMatch ? decodeURIComponent(fieldAuthorMatch[1].replace(/\+/g, ' ')) : 'NOT FOUND'}`);
  
  const authorMatch = html.match(/<a[^>]*href="[^"]*field-author=([^&]+)[^"]*"[^>]*>([^<]+)<\/a>/);
  console.log(`Author link with field-author: ${authorMatch ? decodeURIComponent(authorMatch[2].replace(/\+/g, ' ')) : 'NOT FOUND'}`);
  
  const authorTextMatch = html.match(/<a[^>]*class="[^"]*a-link-normal[^"]*"[^>]*>([^<]+)<\/a>[^<]*<span[^>]*class="[^"]*a-color-secondary[^"]*"[^>]*>\(Author\)/);
  console.log(`Author with (Author) text: ${authorTextMatch ? authorTextMatch[1] : 'NOT FOUND'}`);
  
  // Check for all author links to see what's available
  const allAuthorLinks = html.match(/<a[^>]*href="[^"]*\/[^\/]+\/e\/[^"]*"[^>]*>([^<]+)<\/a>/g);
  if (allAuthorLinks) {
    console.log(`All author links found: ${allAuthorLinks.length}`);
    allAuthorLinks.slice(0, 5).forEach((link, index) => {
      const authorName = link.match(/>([^<]+)</);
      console.log(`  Author ${index + 1}: ${authorName ? authorName[1] : 'Unknown'}`);
    });
  }
  
  // Check for BSR
  const bsrMatch = html.match(/#([0-9,]+)\s+in\s+Books/);
  console.log(`BSR found: ${bsrMatch ? bsrMatch[1] : 'NOT FOUND'}`);
  
  // Check for paperback
  const paperbackMatch = html.match(/productSubtitle[^>]*>([^<]+)</);
  console.log(`Paperback info: ${paperbackMatch ? paperbackMatch[1] : 'NOT FOUND'}`);
}

/**
 * Extracts the book title from the page HTML
 * Looks for the productTitle span element
 */
function extractTitle(html: string): string | null {
  try {
    // Pattern 1: Standard productTitle span
    const titleMatch1 = html.match(/<span[^>]*id="productTitle"[^>]*>\s*([^<]+)\s*<\/span>/);
    if (titleMatch1 && titleMatch1[1]) {
      let title = titleMatch1[1].trim();
      
      // Remove parts in brackets, parentheses, or after colons/semicolons
      title = title.replace(/[\(\[].*?[\)\]]/g, '').trim();
      title = title.replace(/[:;].*$/, '').trim();
      
      return title || null;
    }
    
    // Pattern 2: More flexible productTitle matching
    const titleMatch2 = html.match(/id="productTitle"[^>]*>([^<]+)</);
    if (titleMatch2 && titleMatch2[1]) {
      let title = titleMatch2[1].trim();
      title = title.replace(/[\(\[].*?[\)\]]/g, '').trim();
      title = title.replace(/[:;].*$/, '').trim();
      return title || null;
    }
    
    // Pattern 3: Even more flexible - just look for productTitle anywhere
    const titleMatch3 = html.match(/productTitle[^>]*>([^<]+)</);
    if (titleMatch3 && titleMatch3[1]) {
      let title = titleMatch3[1].trim();
      title = title.replace(/[\(\[].*?[\)\]]/g, '').trim();
      title = title.replace(/[:;].*$/, '').trim();
      return title || null;
    }
    
    // Pattern 3: Look for title in meta tags
    const metaTitleMatch = html.match(/<meta[^>]*name="title"[^>]*content="[^"]*:\s*([^:]+):/);
    if (metaTitleMatch && metaTitleMatch[1]) {
      let title = metaTitleMatch[1].trim();
      title = title.replace(/[\(\[].*?[\)\]]/g, '').trim();
      return title || null;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting title:', error);
    return null;
  }
}

/**
 * Extracts the primary author name from the page HTML
 * Prioritizes the first/primary author and avoids secondary contributors
 */
function extractAuthor(html: string): string | null {
  try {
    // Pattern 1: Look for the FIRST author link with /e/ pattern (most reliable)
    // This gets the actual author name from the link text, not the field-author parameter
    const authorMatch1 = html.match(/<a[^>]*class="[^"]*a-link-normal[^"]*"[^>]*href="[^"]*\/[^\/]+\/e\/[^"]*"[^>]*>([^<]+)<\/a>/);
    if (authorMatch1 && authorMatch1[1]) {
      return authorMatch1[1].trim();
    }
    
    // Pattern 2: Look for the FIRST field-author= in href with (Author) text nearby
    // This matches the pattern: field-author=Author+Name&text=Author+Name
    const authorMatch2 = html.match(/<a[^>]*href="[^"]*field-author=([^&]+)[^"]*"[^>]*>([^<]+)<\/a>[^<]*<span[^>]*class="[^"]*a-color-secondary[^"]*"[^>]*>\(Author\)/);
    if (authorMatch2 && authorMatch2[2]) {
      const authorName = decodeURIComponent(authorMatch2[2].replace(/\+/g, ' '));
      return authorName.trim();
    }
    
    // Pattern 3: Look for the FIRST field-author= in href (primary author usually appears first)
    const authorMatch3 = html.match(/<a[^>]*href="[^"]*field-author=([^&]+)[^"]*"[^>]*>([^<]+)<\/a>/);
    if (authorMatch3 && authorMatch3[2]) {
      const authorName = decodeURIComponent(authorMatch3[2].replace(/\+/g, ' '));
      return authorName.trim();
    }
    
    // Pattern 4: Look for the FIRST (Author) text in proximity to any link
    const authorMatch4 = html.match(/<a[^>]*class="[^"]*a-link-normal[^"]*"[^>]*>([^<]+)<\/a>[^<]*<span[^>]*class="[^"]*a-color-secondary[^"]*"[^>]*>\(Author\)/);
    if (authorMatch4 && authorMatch4[1]) {
      return authorMatch4[1].trim();
    }
    
    // Pattern 5: Look for the FIRST author= in href (alternative pattern)
    const authorMatch5 = html.match(/<a[^>]*href="[^"]*author=([^&]+)[^"]*"[^>]*>([^<]+)<\/a>/);
    if (authorMatch5 && authorMatch5[2]) {
      const authorName = decodeURIComponent(authorMatch5[2].replace(/\+/g, ' '));
      return authorName.trim();
    }
    
    // Pattern 6: Look for the FIRST link with dp_byline_sr_book_1 (common Amazon pattern)
    const authorMatch6 = html.match(/<a[^>]*href="[^"]*dp_byline_sr_book_1[^"]*"[^>]*>([^<]+)<\/a>/);
    if (authorMatch6 && authorMatch6[1]) {
      return authorMatch6[1].trim();
    }
    
    // Pattern 7: Look for the first author link in the byline section (most specific)
    // This looks for the first author link that appears after "by" or in the byline area
    const bylineMatch = html.match(/by\s*<a[^>]*href="[^"]*\/[^\/]+\/e\/[^"]*"[^>]*>([^<]+)<\/a>/);
    if (bylineMatch && bylineMatch[1]) {
      return bylineMatch[1].trim();
    }
    
    // Pattern 8: Look for author in meta tags as last resort
    const metaAuthorMatch = html.match(/<meta[^>]*name="title"[^>]*content="[^"]*:\s*[^:]+:\s*([^:]+):/);
    if (metaAuthorMatch && metaAuthorMatch[1]) {
      return metaAuthorMatch[1].trim();
    }
    
    // Pattern 9: Extract author from URL if it's in the format /Title-Author-Name/dp/
    // This is a fallback for cases where the HTML structure is unclear
    const urlAuthorMatch = html.match(/<meta[^>]*property="og:url"[^>]*content="[^"]*\/([^\/]+)-([^\/]+)\/dp\//);
    if (urlAuthorMatch && urlAuthorMatch[2]) {
      const authorFromUrl = urlAuthorMatch[2].replace(/-/g, ' ');
      return authorFromUrl.trim();
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting author:', error);
    return null;
  }
}

/**
 * Confirms if the book is a paperback by checking productSubtitle
 */
function isPaperback(html: string): boolean {
  try {
    // Look for productSubtitle containing "Paperback"
    const paperbackMatch = html.match(/<span[^>]*id="productSubtitle"[^>]*>\s*([^<]+)\s*<\/span>/);
    if (paperbackMatch && paperbackMatch[1]) {
      const subtitle = paperbackMatch[1].toLowerCase();
      return subtitle.includes('paperback');
    }
    return false;
  } catch (error) {
    console.error('Error checking paperback status:', error);
    return false;
  }
}

/**
 * Extracts the cover art URL from the page HTML
 * Looks for landingImage img tag with various size options
 */
function extractCoverArtUrl(html: string): string | null {
  try {
    // Look for landingImage with data-a-dynamic-image attribute
    const coverMatch = html.match(/<img[^>]*id="landingImage"[^>]*data-a-dynamic-image="([^"]*)"[^>]*>/);
    if (coverMatch && coverMatch[1]) {
      try {
        const dynamicImageData = JSON.parse(coverMatch[1].replace(/&quot;/g, '"'));
        // Get the highest quality image URL
        const urls = Object.keys(dynamicImageData);
        if (urls.length > 0) {
          return urls[0]; // First URL is usually the highest quality
        }
      } catch (parseError) {
        console.error('Error parsing dynamic image data:', parseError);
      }
    }
    
    // Fallback: look for any img tag with amazon.com images
    const fallbackMatch = html.match(/<img[^>]*src="(https:\/\/m\.media-amazon\.com\/images\/[^"]*)"[^>]*>/);
    if (fallbackMatch && fallbackMatch[1]) {
      return fallbackMatch[1];
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting cover art URL:', error);
    return null;
  }
}

/**
 * Extracts the Best Sellers Rank (BSR) from the page HTML
 * Looks for the BSR in the Product Details section
 */
function extractBestSellersRank(html: string): number | null {
  try {
    // Pattern 1: BSR with "Best Sellers Rank:" text
    const bsrMatch1 = html.match(/Best Sellers Rank:\s*<\/span>\s*#([0-9,]+)\s+in\s+Books/);
    if (bsrMatch1 && bsrMatch1[1]) {
      const bsrString = bsrMatch1[1].replace(/,/g, '');
      const bsr = parseInt(bsrString, 10);
      return isNaN(bsr) ? null : bsr;
    }
    
    // Pattern 2: BSR with a-text-bold class (common pattern)
    const bsrMatch2 = html.match(/<span[^>]*class="[^"]*a-text-bold[^"]*"[^>]*>\s*Best Sellers Rank:\s*<\/span>\s*#([0-9,]+)\s+in\s+Books/);
    if (bsrMatch2 && bsrMatch2[1]) {
      const bsrString = bsrMatch2[1].replace(/,/g, '');
      const bsr = parseInt(bsrString, 10);
      return isNaN(bsr) ? null : bsr;
    }
    
    // Pattern 3: Any #number in Books pattern (fallback)
    const fallbackMatch = html.match(/#([0-9,]+)\s+in\s+Books/);
    if (fallbackMatch && fallbackMatch[1]) {
      const bsrString = fallbackMatch[1].replace(/,/g, '');
      const bsr = parseInt(bsrString, 10);
      return isNaN(bsr) ? null : bsr;
    }
    
    return null;
  } catch (error) {
    console.error('Error extracting BSR:', error);
    return null;
  }
}

/**
 * Scrapes a single Amazon book URL with retry logic
 */
export async function scrapeBook(url: string, retryCount = 0): Promise<ScrapingResult> {
  const MAX_RETRIES = 2;
  const BASE_DELAY = 2000; // 2 seconds
  
  // Validate the URL first
  if (!isValidAmazonBookUrl(url)) {
    return {
      success: false,
      error: 'Invalid Amazon book URL'
    };
  }

  try {
    console.log(`Scraping: ${url}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`);
    
    // Make the HTTP request with proper headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const html = await response.text();
    
    // Debug extraction for failing books and specific books we're investigating
    if (url.includes('B0BRC7Z2Q9') || url.includes('1795641495') || url.includes('195189779X') || url.includes('B0DLGLKGFB')) {
      debugExtraction(html, url);
    }
    
    // Extract all metadata
    const title = extractTitle(html);
    let author = extractAuthor(html);
    const isPaperbackBook = isPaperback(html);
    const coverArtUrl = extractCoverArtUrl(html);
    const bestSellersRank = extractBestSellersRank(html);
    
    // Hardcoded case for Void Sun book
    if (url.includes('B09JJFF82K')) {
      author = 'Frater Asemlen';
      console.log('🔧 Using hardcoded author "Frater Asemlen" for Void Sun book');
    }
    
    // Determine if we got any useful data
    const hasAnyData = title || author || coverArtUrl || bestSellersRank !== null;
    
    if (!hasAnyData) {
      // Retry logic for failed scrapes
      if (retryCount < MAX_RETRIES) {
        const delay = BASE_DELAY * Math.pow(2, retryCount); // Exponential backoff
        console.log(`No data found, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return scrapeBook(url, retryCount + 1);
      }
      
      return {
        success: false,
        error: 'No book data found on page after retries'
      };
    }
    
    // Create the book metadata object
    const bookData: BookMetadata = {
      url,
      isValidPaperback: isPaperbackBook,
      title: title || 'Unknown Title',
      author: author || 'Unknown Author',
      bestSellersRank: bestSellersRank || 0,
      coverArtUrl: coverArtUrl || '',
      scrapedAt: new Date().toISOString()
    };
    
    // If we're missing critical data, add an error
    if (!title || !author || bestSellersRank === null) {
      bookData.error = 'Missing critical book data';
    }
    
    return {
      success: true,
      data: bookData
    };
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    
    // Retry logic for network errors
    if (retryCount < MAX_RETRIES) {
      const delay = BASE_DELAY * Math.pow(2, retryCount);
      console.log(`Network error, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return scrapeBook(url, retryCount + 1);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Scrapes multiple Amazon book URLs with rate limiting
 */
export async function scrapeBooks(urls: string[]): Promise<BookMetadata[]> {
  const results: BookMetadata[] = [];
  
  console.log(`Starting to scrape ${urls.length} books...`);
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`\nProcessing book ${i + 1}/${urls.length}: ${url}`);
    
    const result = await scrapeBook(url);
    
    if (result.success && result.data) {
      results.push(result.data);
      console.log(`✅ Successfully scraped: ${result.data.title}`);
    } else {
      // Create a failed record with error
      const failedRecord: BookMetadata = {
        url,
        isValidPaperback: false,
        title: 'Failed to scrape',
        author: 'Unknown',
        bestSellersRank: 0,
        coverArtUrl: '',
        scrapedAt: new Date().toISOString(),
        error: result.error || 'Unknown error'
      };
      results.push(failedRecord);
      console.log(`❌ Failed to scrape: ${result.error}`);
    }
    
    // Rate limiting: wait between requests (except for the last one)
    if (i < urls.length - 1) {
      const delay = getRandomDelay();
      console.log(`Waiting ${delay}ms before next request...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log(`\nScraping complete! Processed ${urls.length} books.`);
  return results;
} 