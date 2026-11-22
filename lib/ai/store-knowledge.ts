
import { createSupabaseServerClient } from "@/lib/supabase/server";

type KnowledgeChunk = {
  chunkNumber: number;
  content: string;
  embedding: number[];
};

type StoreDocumentOptions = {
  documentId: string;
  title: string;
  category: string;
  source: string;
  chunks: KnowledgeChunk[];
};

export async function storeKnowledgeDocument({
  documentId,
  title,
  category,
  source,
  chunks,
}: StoreDocumentOptions) {
  const supabase = await createSupabaseServerClient(true);

  const records = chunks.map((chunk) => ({
    document_id: documentId,
    content: chunk.content,
    embedding: chunk.embedding,
    metadata: {
      title,
      category,
      source,
      chunk_number: chunk.chunkNumber,
    },
  }));

  const { data, error } = await supabase
    .from("agricultural_knowledge")
    .insert(records)
    .select("id, document_id, metadata");

  if (error) {
    throw new Error(
      `Failed to store agricultural knowledge: ${error.message}`
    );
  }

  return data;
}
