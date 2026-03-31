import { GoogleGenAI } from "@google/genai";

async function analyzeImages() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const urls = [
      'https://i.postimg.cc/zGLFF3rP/IMG-1036.jpg',
      'https://i.postimg.cc/2Sq773YD/IMG-1037.jpg'
    ];
    
    const parts = [];
    
    for (const url of urls) {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64 = buffer.toString('base64');
      
      parts.push({
        inlineData: {
          data: base64,
          mimeType: 'image/jpeg'
        }
      });
    }
    
    parts.push({
      text: "Describe these UI screens in extreme detail. What are the colors, layout, text, buttons, icons, and overall purpose of the app? Provide a comprehensive breakdown so I can recreate it exactly in React/Tailwind."
    });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts }
    });
    
    console.log(response.text);
  } catch (error) {
    console.error("Error analyzing images:", error);
  }
}

analyzeImages();
