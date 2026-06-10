import { GoogleGenAI, Modality } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // result is "data:image/jpeg;base64,LzlqLzRBQ..."
      // we only want the part after the comma
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to read base64 string from file."));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Parses complex error messages from the Google AI SDK to return a cleaner,
 * more user-friendly string.
 * @param error The error object caught from the API call.
 * @returns A cleaned-up error message string.
 */
const parseGoogleAIError = (error: Error): string => {
    // Example API error message: "[GoogleGenerativeAI Error]: [429] ... { ... JSON ... }"
    const message = error.message;
    const jsonStartIndex = message.indexOf('{');
    
    if (jsonStartIndex !== -1) {
        try {
            const jsonString = message.substring(jsonStartIndex);
            const errorDetails = JSON.parse(jsonString);

            if (errorDetails.error && errorDetails.error.message) {
                // Return a cleaner version of the API error message
                return errorDetails.error.message.split(' For more information')[0];
            }
        } catch (e) {
            // Parsing failed, fall back to the original message for debugging
            return message;
        }
    }
    
    // If no JSON is found, return the original message
    return message;
}


export const removeBackground = async (
  imageFile: File, 
  mode: 'standard' | 'remove_white' | 'enhanced' | 'masked' = 'standard',
  selection?: { x: number; y: number; width: number; height: number }
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const base64Data = await fileToBase64(imageFile);

    let prompt;

    // UPDATED STRATEGY:
    // The user requested to switch from Transparent Background to SOLID WHITE BACKGROUND.
    // This eliminates the "fake transparency checkerboard" issue entirely.
    // We now instruct the model to replace the background with RGB(255, 255, 255).

    switch (mode) {
      case 'remove_white':
        // This mode name is now legacy but maps to "Fix Background".
        // New Goal: Force any non-white background to become pure white.
        prompt = `SYSTEM TASK: FORCE PURE WHITE BACKGROUND.
        
        INPUT ANALYSIS: The user wants the background of this image to be 100% PURE WHITE.
        
        OBJECTIVE:
        1. Identify the main subject.
        2. Turn EVERYTHING else into Pure White (RGB 255, 255, 255).
        3. Ensure there are no gray shadows or checkerboard patterns.
        
        OUTPUT: JPG/PNG with Solid White Background.
        `;
        break;

      case 'enhanced':
        prompt = `SYSTEM TASK: HIGH QUALITY SUBJECT EXTRACTION ON WHITE.
        
        OBJECTIVE: Isolate the subject and place it on a SOLID WHITE background.
        
        RULES:
        1. The background must be RGB(255, 255, 255).
        2. The subject boundaries must be sharp and clean.
        3. NO transparency. NO checkerboard patterns.
        
        OUTPUT: Image with white background.
        `;
        break;
      
      case 'masked':
        if (!selection) {
          throw new Error("A selection bounding box is required for masked removal mode.");
        }
        prompt = `SYSTEM TASK: REGION-BASED BACKGROUND REPLACEMENT.
        
        REGION: X:${selection.x.toFixed(2)}%, Y:${selection.y.toFixed(2)}%, W:${selection.width.toFixed(2)}%, H:${selection.height.toFixed(2)}%.
        
        INSTRUCTION:
        1. Keep the object inside the defined region.
        2. Change the entire background (both inside and outside the region) to SOLID WHITE.
        3. Do not generate transparency.
        
        OUTPUT: Image with white background.
        `;
        break;
        
      case 'standard':
      default:
        prompt = `SYSTEM TASK: REPLACE BACKGROUND WITH WHITE.
        
        INPUT: Image.
        OUTPUT: The main subject on a PURE WHITE background.
        
        ALGORITHM:
        1. Identify the foreground subject.
        2. Replace the background pixels with Solid White (RGB 255, 255, 255).
        3. Do NOT make it transparent.
        4. Do NOT draw a checkerboard.
        
        The result should look like a product photo on a white studio background.
        `;
        break;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: imageFile.type,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // 1. Check if the entire request was blocked
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Request blocked: ${response.promptFeedback.blockReason}.`);
    }
    
    const candidate = response.candidates?.[0];

    // 2. Check if the candidate generation was stopped for a reason other than success
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`Processing failed. Reason: ${candidate.finishReason}. The content may have been blocked.`);
    }

    // 4. Check for the actual image data in the response parts
    const imagePart = candidate.content?.parts?.find(part => part.inlineData?.data);
    if (imagePart?.inlineData) {
      return imagePart.inlineData.data;
    }

    // 5. Fallback error if no image is found despite a "successful" response
    throw new Error('No image data found in the API response.');

  } catch (error) {
    console.error("Error in Gemini API call:", error);
    if (error instanceof Error) {
        // Use the parser to get a clean message and re-throw
        throw new Error(parseGoogleAIError(error));
    }
    // Generic fallback for non-Error objects
    throw new Error("An unknown error occurred while processing the image.");
  }
};