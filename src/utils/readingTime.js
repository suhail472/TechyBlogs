/**
 * Calculates estimated reading time of an article based on content text.
 * Uses an average reading speed of 225 words per minute.
 * 
 * @param {string} content - Markdown or HTML content of the article
 * @returns {number} Estimated reading time in minutes (minimum of 1)
 */
export function getReadingTime(content) {
  if (!content) return 1;
  
  // Strip HTML tags if there are any (e.g. from rich text editor)
  const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, "");
  
  // Count words
  const words = cleanContent.trim().split(/\s+/).filter(word => word.length > 0).length;
  
  // Average words per minute
  const wordsPerMinute = 225;
  const minutes = Math.ceil(words / wordsPerMinute);
  
  return minutes || 1;
}
