import OpenAI from "openai";

// Initialize the OpenAI client with error handling
let openai: OpenAI | null = null;
try {
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    openai = new OpenAI({
      apiKey,
      timeout: 30000, // 30 second timeout
      maxRetries: 3,  // Retry failed requests 3 times
    });
  } else {
    console.warn("OPENAI_API_KEY not found. Some AI features will be disabled.");
  }
} catch (error) {
  console.error("Error initializing OpenAI client:", error);
}

// Assistant ID for the pregnancy companion
const ASSISTANT_ID = "asst_zwfWiYjLCIqIVlUN0617YRZQ";
const MODEL = "gpt-4";

export async function getAssistantResponse(message: string): Promise<string> {
  try {
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, { 
      role: "user", 
      content: message 
    });

    const run = await openai.beta.threads.runs.create(thread.id, { 
      assistant_id: ASSISTANT_ID 
    });

    while (true) {
      const runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (runStatus.status === "completed") break;
      if (runStatus.status === "failed") throw new Error("Assistant run failed");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(msg => msg.role === "assistant");
    
    if (!assistantMessage || !assistantMessage.content.length) {
      throw new Error("No response from assistant");
    }
    
    try {
      // Using any here to bypass TypeScript errors with the OpenAI API types
      const content = assistantMessage.content[0] as any;
      if (content && content.text && content.text.value) {
        return content.text.value;
      } else {
        throw new Error("Unexpected content structure from assistant");
      }
    } catch (contentError) {
      console.error("Error parsing assistant message content:", contentError);
      throw new Error("Failed to parse assistant response");
    }
  } catch (error) {
    console.error("Error in getAssistantResponse:", error);
    throw error;
  }
}

export async function generateBabyNames(origin: string, gender: string): Promise<{
  names: string[];
  meanings: Record<string, string>;
}> {
  try {
    const prompt = `Generate 10 unique baby names with their meanings. Origin: ${origin}, Gender: ${gender}. 
                   Make names culturally authentic and meaningful.`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a cultural expert specializing in traditional and meaningful baby names."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating baby names:", error);
    throw new Error("Failed to generate baby names");
  }
}

export async function generateMealPlan(week: number): Promise<{
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string[];
}> {
  try {
    const prompt = `Generate a detailed pregnancy meal plan for week ${week} with specific nutritional requirements.`;

    const completion = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: "You are a certified nutritionist specializing in pregnancy nutrition."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(completion.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw new Error("Failed to generate meal plan");
  }
}

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  try {
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });
    return transcription.text;
  } catch (error) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio");
  }
}

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const OLD_MODEL = "gpt-4o";

/**
 * Generate a text response from OpenAI
 */
export async function generateChatResponse(
  prompt: string,
  context: string = "You are a helpful pregnancy assistant providing guidance and support to expecting mothers."
): Promise<string> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured");
    }
    const completion = await openai.chat.completions.create({
      model: OLD_MODEL,
      messages: [
        {
          role: "system",
          content: context + " Format your response in clear paragraphs with proper spacing. Use '\n\n' between paragraphs. Keep responses focused and structured. End with 1-2 relevant follow-up questions based on the current context."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    return completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Error generating response from OpenAI:", error);
    return "I'm sorry, I encountered an error while processing your request.";
  }
}

/**
 * Generate a JSON structured response from OpenAI
 */
export async function generateMealPlanOld(week: number): Promise<{
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string[];
}> {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    const prompt = `Generate a detailed pregnancy meal plan for week ${week}. Include specific nutritional requirements for this stage of pregnancy. Focus on nutritious, pregnancy-safe meals.`;
    
    const completion = await openai.chat.completions.create({
      model: OLD_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a certified nutritionist specializing in pregnancy nutrition. Provide specific, safe meal suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    return {
      breakfast: response.breakfast || "Oatmeal with fruits and nuts",
      lunch: response.lunch || "Grilled chicken salad with quinoa",
      dinner: response.dinner || "Baked salmon with vegetables",
      snacks: response.snacks || ["Greek yogurt with berries", "Mixed nuts", "Apple with peanut butter"]
    };
  } catch (error) {
    console.error("Error generating meal plan:", error);
    throw new Error("Failed to generate meal plan");
  }
}

export async function checkMedicationSafety(medicationName: string): Promise<{
  isSafe: boolean | null;
  notes: string;
  risks?: string;
  alternatives?: string[];
}> {
  const prompt = `Analyze the safety of ${medicationName} during pregnancy. Format response as JSON with structure: { isSafe: boolean | null, notes: string, risks?: string, alternatives?: string[] }. Include scientific evidence when available.`;
  
  return generateStructuredResponse(prompt, "You are a pharmacist with expertise in pregnancy medication safety.");
}

export async function generateStructuredResponse<T>(
  prompt: string,
  context: string = "You are a helpful pregnancy assistant providing guidance and support to expecting mothers."
): Promise<T> {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    const completion = await openai.chat.completions.create({
      model: OLD_MODEL,
      messages: [
        {
          role: "system",
          content: context
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    return JSON.parse(completion.choices[0].message.content || "{}") as T;
  } catch (error) {
    console.error("Error generating structured response from OpenAI:", error);
    throw new Error("Failed to generate structured response");
  }
}

/**
 * Generate audio from text using OpenAI's TTS service
 */
export async function generateSpeech(text: string): Promise<Buffer> {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // Standard model for faster initial response
      voice: "alloy", // Default voice with consistent performance
      input: text,
      speed: 1.0, // Normal speech rate
      response_format: "mp3", // Optimized format
    });

    // Convert the response to a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    return buffer;
  } catch (error) {
    console.error("Error generating speech from OpenAI:", error);
    throw new Error("Failed to generate speech");
  }
}

/**
 * Transcribe speech to text using OpenAI's Whisper service
 */
export async function transcribeSpeech(audioBuffer: Buffer): Promise<string> {
  try {
    if (!openai) {
      throw new Error("OpenAI client not initialized");
    }
    // Create a file-like object from the buffer
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Error transcribing speech with OpenAI:", error);
    throw new Error("Failed to transcribe speech");
  }
}