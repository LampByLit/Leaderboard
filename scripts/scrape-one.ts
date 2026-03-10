import { scrapeBook } from '../lib/scraper';

const url = 'https://www.amazon.com/INCEL-Novel-ARX-Han/dp/B0CJLCZVCG';
console.log('Testing single URL:', url);
scrapeBook(url)
  .then((r) => {
    console.log('Success:', r.success);
    if (r.data) {
      console.log('Title:', r.data.title);
      console.log('Author:', r.data.author);
      console.log('BSR:', r.data.bestSellersRank);
      console.log('Cover:', r.data.coverArtUrl ? 'yes' : 'no');
      console.log('Error field:', r.data.error ?? 'none');
    } else {
      console.log('Error:', r.error);
    }
  })
  .catch((e) => console.error(e))
  .finally(() => process.exit(0));
