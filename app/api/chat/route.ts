
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const roleInstructions = {
  buyer: `
    You are the FarmLoop AI assistant for buyers.

    Help buyers understand how to find agricultural
    waste products, discover sellers, understand
    availability and navigate FarmLoop.

    Never invent product availability or prices.
  `,

  seller: `
    You are the FarmLoop AI assistant for sellers.

    Help sellers understand how to create listings,
    manage product quantities and availability periods,
    and use FarmLoop effectively.

    Never claim to have changed a listing.
  `,

  admin: `
    You are the FarmLoop AI assistant for administrators.

    Help administrators understand platform management,
    user management and administrative workflows.

    Never claim to have performed an administrative action.
  `,
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function isChatMessage(value: unknown): value is ChatMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "role" in value &&
    (value.role === "user" || value.role === "assistant") &&
    "content" in value &&
    typeof value.content === "string" &&
    value.content.trim().length > 0
  );
}

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient(true);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    const { data: conversation, error } = await supabase
      .from("chatbot_conversations")
      .select("messages")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("FarmLoop chatbot history error:", error);
      return NextResponse.json(
        { error: "Unable to load your conversation." },
        { status: 500 }
      );
    }

    const messages = conversation?.messages ?? [];
    if (!Array.isArray(messages) || !messages.every(isChatMessage)) {
      console.error("FarmLoop chatbot history is invalid.");
      return NextResponse.json(
        { error: "Unable to load your conversation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("FarmLoop chatbot history error:", error);
    return NextResponse.json(
      { error: "Unable to load your conversation." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user
    const supabase = await createSupabaseServerClient(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    // 2. Retrieve the authenticated user's role
    const { data: profile, error: profileError } =
      await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 403 }
      );
    }

    const role = profile.role as keyof typeof roleInstructions;

    if (!Object.hasOwn(roleInstructions, role)) {
      return NextResponse.json(
        { error: "Invalid user role." },
        { status: 403 }
      );
    }

    // 3. Parse and validate the request body
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body." },
        { status: 400 }
      );
    }

    if (typeof body !== "object" || body === null || !("message" in body)) {
      return NextResponse.json(
        { error: "Please provide a valid message." },
        { status: 400 }
      );
    }

    if (
      typeof body.message !== "string" ||
      body.message.trim().length === 0 ||
      body.message.length > 2000
    ) {
      return NextResponse.json(
        { error: "Invalid message." },
        { status: 400 }
      );
    }

    const { data: savedConversation, error: conversationError } = await supabase
      .from("chatbot_conversations")
      .select("messages")
      .eq("user_id", user.id)
      .maybeSingle();

    if (conversationError) {
      console.error("FarmLoop chatbot history error:", conversationError);
      return NextResponse.json(
        { error: "Unable to load your conversation." },
        { status: 500 }
      );
    }

    const history = savedConversation?.messages ?? [];
    if (!Array.isArray(history) || !history.every(isChatMessage)) {
      console.error("FarmLoop chatbot history is invalid.");
      return NextResponse.json(
        { error: "Unable to load your conversation." },
        { status: 500 }
      );
    }

    const userMessage = body.message.trim();

    // Keep requests within the existing context limit while preserving full history in storage.
    const messages = [
      ...history.slice(-18),
      { role: "user" as const, content: userMessage },
    ];

    // 5. Convert conversation history into Gemini's conversation format
    const conversation = messages.map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: message.content }],
    }));

    // 6. Send conversation history to Gemini
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-4-hydrogen",

      contents: conversation,

      config: {
        systemInstruction: roleInstructions[role],
        maxOutputTokens: 500,
      },
    });

    // 7. Save the completed exchange before returning it to the client.
    if (!response.text) {
      return NextResponse.json(
        { error: "The AI could not generate a response." },
        { status: 502 }
      );
    }

    const updatedMessages = [
      ...history,
      { role: "user" as const, content: userMessage },
      { role: "assistant" as const, content: response.text },
    ];
    const { error: saveError } = await supabase
      .from("chatbot_conversations")
      .upsert(
        {
          user_id: user.id,
          messages: updatedMessages,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (saveError) {
      console.error("FarmLoop chatbot save error:", saveError);
      return NextResponse.json(
        { error: "Unable to save your conversation. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: response.text,
      role,
    });

  } catch (error) {
    console.error("FarmLoop chatbot error:", error);

    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
