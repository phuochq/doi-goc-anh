import { GoogleGenAI, Modality } from "@google/genai";
import { AngleState } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to resize image for faster processing
const resizeImage = async (base64Str: string, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth || height > maxWidth) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      } else {
        // No resize needed
        resolve(base64Str.split(',')[1]); 
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Return without header for API
      resolve(canvas.toDataURL('image/jpeg', 0.9).split(',')[1]);
    };
  });
};

export const generateNewAngle = async (
  base64Image: string,
  mimeType: string,
  angles: AngleState
): Promise<string> => {
  try {
    const { rotation, tilt, zoom, aspectRatio, prompt: userPrompt, quality, referenceImage, faceLock } = angles;

    // Optimize image size
    const processedImageBase64 = await resizeImage(base64Image);

    // High-fidelity System Prompt
    let systemPrompt = "Role: Expert Virtual Photographer & 3D Render Engine.\n";
    systemPrompt += "TASK: Reshoot the input subject from a new specific camera angle.\n";
    
    // QUALITY SETTINGS
    systemPrompt += `OUTPUT QUALITY: ${quality === '4K' ? '8k Resolution, Hyper-Realistic, RAW Photo' : 'High Quality, Sharp Focus'}.\n`;
    
    // ASPECT RATIO - STRICT ENFORCEMENT WITH OUTPAINTING
    systemPrompt += `\nCRITICAL: OUTPUT ASPECT RATIO MUST BE ${aspectRatio}.\n`;
    systemPrompt += "INSTRUCTION: Reshape the canvas to match this ratio.\n";
    systemPrompt += "- If the target ratio is wider than the source (e.g., 16:9), GENERATE (Outpaint) plausible background to fill the width.\n";
    systemPrompt += "- If the target ratio is taller (e.g., 9:16), GENERATE (Outpaint) vertical context (floor/ceiling/sky) to fill the height.\n";
    systemPrompt += "- DO NOT STRETCH the image. DO NOT add black bars.\n";

    const parts: any[] = [
        {
          inlineData: {
            data: processedImageBase64,
            mimeType: "image/jpeg",
          },
        }
    ];

    // REFERENCE IMAGE LOGIC
    if (referenceImage) {
        const refData = referenceImage.split(',')[1];
        parts.push({
            inlineData: {
                data: refData,
                mimeType: "image/jpeg"
            }
        });
        systemPrompt += "REFERENCE TARGET INSTRUCTION (OVERRIDE):\n";
        systemPrompt += "The SECOND image provided is the REFERENCE POSE/ANGLE.\n";
        systemPrompt += "Ignore the numeric rotation/tilt sliders. Instead, MATCH the Camera Angle, Perspective, and Head Pose of the REFERENCE image exactly.\n";
        systemPrompt += "Transfer the Reference Angle to the Subject in the FIRST image.\n\n";
    } else {
        // STANDARD SLIDER LOGIC
        systemPrompt += "\nCAMERA & SUBJECT MOVEMENT RULES:\n";
        
        if (faceLock) {
            // FACE LOCK MODE: Subject turns to face camera
            systemPrompt += "MODE: FACE LOCK (Subject tracks camera).\n";
            systemPrompt += "1. Camera moves to the specified angle.\n";
            systemPrompt += "2. Subject ROTATES HEAD to maintain EYE CONTACT with the lens.\n";
            systemPrompt += "3. Body may be angled, but Face is FRONT-FACING relative to the viewport.\n";
        } else {
            // ORBIT MODE: Subject static, camera moves
            systemPrompt += "MODE: STATIC SUBJECT (Camera Orbit).\n";
            systemPrompt += "1. Subject stays FROZEN in their original pose.\n";
            systemPrompt += "2. Camera moves around the subject.\n";
            systemPrompt += "3. Example: Rotation +90° means seeing the subject's RIGHT profile (Camera moved left).\n";
        }
        
        // Angle Definitions
        systemPrompt += `\nAPPLY THESE VALUES:\n`;
        systemPrompt += `- Rotation (Yaw): ${rotation}°\n`;
        systemPrompt += `  (0° = Front, 90° = Right Profile, -90° = Left Profile, 180° = Back)\n`;
        
        systemPrompt += `- Tilt (Pitch): ${tilt}°\n`;
        systemPrompt += `  (Positive = Looking Up at subject from below. Negative = Looking Down at subject from above)\n`;

        if (zoom !== 0) {
           systemPrompt += `- Zoom Level: ${zoom} (Negative = Wide Angle/Fisheye, Positive = Telephoto/Compressed Background)\n`;
        }
    }

    if (userPrompt && userPrompt.trim() !== "") {
      systemPrompt += `\nADDITIONAL CONTEXT: ${userPrompt}\n`;
    }

    systemPrompt += "\nCONSISTENCY RULES:\n";
    systemPrompt += "- Preserve facial identity 100%.\n";
    systemPrompt += "- Preserve clothing details, textures, and logos exactly.\n";
    systemPrompt += "- Lighting must remain consistent with the original scene but adapted to the 3D geometry.\n";

    // Add the prompt text to parts
    parts.push({ text: systemPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: parts,
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
        const base64ImageBytes = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
    }

    throw new Error("No image data returned.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};

export const suggestPrompt = async (
    base64Image: string,
    mimeType: string
): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: { data: base64Image, mimeType: mimeType }
                    },
                    {
                        text: "Analyze this image and provide a concise, technical photographer's description (max 25 words) focusing on subject, lighting, and environment."
                    }
                ]
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Prompt suggestion failed", e);
        return "A detailed studio photo of the subject.";
    }
};