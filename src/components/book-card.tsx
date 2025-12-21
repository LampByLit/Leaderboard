import Image from 'next/image';
import { BookWithHistory } from '@/lib/types';

interface BookCardProps {
  book: BookWithHistory;
  rank: number;
}

/**
 * Sanitizes text content to prevent React rendering errors
 * Removes HTML entities, control characters, and other problematic content
 */
function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  return text
    // Remove HTML entities
    .replace(/&[^;]+;/g, '')
    // Remove control characters
    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
    // Remove any remaining HTML tags
    .replace(/<[^>]*>/g, '')
    // Trim whitespace
    .trim();
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

  // Calculate BSR trend
  const getBSRTrend = () => {
    if (book.history.length < 2) return null;
    
    const sortedHistory = [...book.history].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const oldest = sortedHistory[0].bsr;
    const newest = sortedHistory[sortedHistory.length - 1].bsr;
    
    if (newest < oldest) return 'up'; // Better performance (lower BSR)
    if (newest > oldest) return 'down'; // Worse performance (higher BSR)
    return 'stable';
  };

  const bsrTrend = getBSRTrend();
  const historyCount = book.history.length;

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
              alt={`Cover of ${sanitizeText(book.title)}`}
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
              {sanitizeText(book.title)}
            </h3>
          </a>
          <p className="text-sm text-gray-600 mt-1">
            by {normalizeAuthorName(sanitizeText(book.author))}
          </p>
          
          <div className="mt-3 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                BSR
              </span>
              <span className="text-lg font-bold text-primary-600">
                {sanitizeText(formatBSR(book.bestSellersRank))}
              </span>
              {bsrTrend && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  bsrTrend === 'up' 
                    ? 'bg-green-100 text-green-800' 
                    : bsrTrend === 'down'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {bsrTrend === 'up' ? '↗' : bsrTrend === 'down' ? '↘' : '→'}
                </span>
              )}
            </div>
          </div>
          
          {/* Historical Data Info */}
          {historyCount > 0 && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="text-xs text-gray-500">
                📊 {historyCount} data point{historyCount !== 1 ? 's' : ''}
              </span>
              {historyCount > 1 && (
                <span className="text-xs text-gray-400">
                  • {new Date(book.history[0].date).toLocaleDateString()} - {new Date(book.history[book.history.length - 1].date).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
          
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