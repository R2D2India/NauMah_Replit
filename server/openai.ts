import OpenAI from "openai";

// Initialize the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

/**
 * Generate a text response from OpenAI
 */
export async function generateChatResponse(
  prompt: string,
  context: string = "You are a helpful pregnancy assistant providing guidance and support to expecting mothers."
): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
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
      max_tokens: 500,
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
export async function generateStructuredResponse<T>(
  prompt: string,
  context: string = "You are a helpful pregnancy assistant providing guidance and support to expecting mothers."
): Promise<T> {
  try {
    const completion = await openai.chat.completions.create({
      model: MODEL,
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
    const mp3 = await openai.audio.speech.create({
      model: "tts-1", // OpenAI's text-to-speech model
      voice: "alloy", // Can be changed to "nova", "shimmer", "echo", "fable", "onyx"
      input: text,
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