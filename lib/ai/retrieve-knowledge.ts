
import { generateEmbedding } from "./embeddings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function retrieveKnowledge(
  question: string
) {
  if (!question.trim()) {
    throw new Error("Question cannot be empty.");
  }

  const supabase = await createSupabaseServerClient();

  const queryEmbedding = await generateEmbedding(
    question,
    "RETRIEVAL_QUERY"
  );

  const { data, error } = await supabase.rpc(
    "match_agricultural_knowledge",
    {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: 5,
    }
  );

  if (error) {
    throw new Error(
      `Knowledge retrieval failed: ${error.message}`
    );
  }

  return data;
}
