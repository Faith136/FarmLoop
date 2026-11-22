
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

type EmbeddingTask =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY";

export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTask
): Promise<number[]> {
  if (!text.trim()) {
    throw new Error("Text cannot be empty.");
  }

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  const embedding = response.embeddings?.[0]?.values;

  if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Failed to generate a valid embedding.");
  }

  return embedding;
}
