
import { chunkText } from "./chunking";
import { generateEmbedding } from "./embeddings";

export async function processDocument(
  documentText: string
) {
  const chunks = chunkText(documentText);

  const processedChunks = [];

  for (const [index, content] of chunks.entries()) {
    const embedding = await generateEmbedding(
      content,
      "RETRIEVAL_DOCUMENT"
    );

    processedChunks.push({
      chunkNumber: index + 1,
      content,
      embedding,
    });
  }

  return processedChunks;
}
