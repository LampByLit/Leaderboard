import Image from 'next/image';
import { BookMetadata } from '@/lib/types';

interface BookCardProps {
  book: BookMetadata;
  rank: number;
}

export function BookCard({ book, rank }: BookCardProps) {
  const formatBSR = (bsr: number) => {
    return bsr.toLocaleString();
  };

  const getRankColor = (rank: number) => {
    if (rank <= 3) return 'text-yellow-600 bg-yellow-100';
    if (rank <= 10) return 'text-blue-600 bg-blue-100';
    return 'text-gray-600 bg-gray-100';
  };

  const normalizeAuthorName = (author: string): string => {
    // Check if author name is in "Last, First" format
    if (author.includes(', ')) {
      const parts = author.split(', ');
      if (parts.length === 2) {
        // Reverse to "First Last" format
        return `${parts[1]} ${parts[0]}`;
      }
    }
    return author;
  };

  return (
    <div className="material-card p-6 hover:shadow-material-3 transition-all duration-200">
      <div className="flex items-start space-x-4">
        {/* Rank Badge */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankColor(rank)}`}>
          #{rank}
        </div>
        
        {/* Book Cover - Clickable Link */}
        <div className="flex-shrink-0">
          <a 
            href={book.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block relative w-20 h-28 rounded-md overflow-hidden shadow-material-1 hover:shadow-material-2 transition-shadow duration-200"
          >
            <Image
              src={book.coverArtUrl}
              alt={`Cover of ${book.title}`}
              fill
              className="object-cover"
              sizes="80px"
            />
          </a>
        </div>
        
        {/* Book Info */}
        <div className="flex-1 min-w-0">
          <a 
            href={book.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:text-primary-600 transition-colors duration-200"
          >
            <h3 className="text-lg font-medium text-gray-900 break-words leading-tight hover:text-primary-600">
              {book.title}
            </h3>
          </a>
          <p className="text-sm text-gray-600 mt-1">
            by {normalizeAuthorName(book.author)}
          </p>
          
          <div className="mt-3 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                BSR
              </span>
              <span className="text-lg font-bold text-primary-600">
                {formatBSR(book.bestSellersRank)}
              </span>
            </div>
          </div>
          
          {/* Validation Badge */}
          <div className="mt-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              book.isValidPaperback 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {book.isValidPaperback ? '✓ Paperback' : '✗ Not Paperback'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 