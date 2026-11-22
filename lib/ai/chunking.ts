
export function chunkText(
  text: string,
  maxCharacters: number = 1000
): string[] {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    // Keep paragraphs together where possible.
    if (paragraph.length > maxCharacters) {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = "";
      }

      // Split exceptionally long paragraphs.
      for (
        let i = 0;
        i < paragraph.length;
        i += maxCharacters
      ) {
        chunks.push(
          paragraph.slice(i, i + maxCharacters).trim()
        );
      }

      continue;
    }

    const combined = currentChunk
      ? `${currentChunk}\n\n${paragraph}`
      : paragraph;

    if (combined.length <= maxCharacters) {
      currentChunk = combined;
    } else {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
