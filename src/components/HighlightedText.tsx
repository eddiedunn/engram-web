import * as React from 'react';

export interface HighlightedTextProps {
  text: string;
  searchTerm: string;
  className?: string;
}

/**
 * HighlightedText component highlights occurrences of a search term within text
 *
 * @param text - The text to display
 * @param searchTerm - The term to highlight (case-insensitive)
 * @param className - Optional CSS classes to apply to the container
 */
export function HighlightedText({ text, searchTerm, className }: HighlightedTextProps) {
  if (!searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters in the search term
  const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create regex for case-insensitive matching
  const regex = new RegExp(`(${escapedTerm})`, 'gi');

  // Split text by the search term while preserving the matches
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the search term (case-insensitive)
        const isMatch = regex.test(part);
        // Reset regex lastIndex for next iteration
        regex.lastIndex = 0;

        return isMatch ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-900 font-semibold rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </span>
  );
}
