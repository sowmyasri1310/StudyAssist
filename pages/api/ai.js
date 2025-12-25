// pages/api/ai.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { text = "", mode = "Breakdown", lang = "Semi-Telugu" } = req.body || {};
  
  if (!text.trim()) {
    return res.status(400).json({ error: "No lesson text provided." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash-lite";

  if (!apiKey) {
    return res.status(500).json({ error: "API Key is missing in .env.local" });
  }

  // 1. IMPROVED GLOBAL RULES
  const noMarkdown = "STRICT: Do not use any markdown formatting like stars (**), hashtags (#), or bolding. Return only plain text.";
  
  let languageInstruction = "";
  if (lang === "Semi-Telugu") {
    languageInstruction = "Use Tanglish (Telugu slang written in English letters like 'em avtundi', 'ante','inka'). Do NOT use Telugu script (తెలుగు).Use telugu that is used by a normal telugu talking person.";
  } else if (lang === "Telugu") {
    languageInstruction = "Use full Telugu script (తెలుగు),but do not use any complex telugu words.Use telugu that is used by a normal telugu talking person.";
  } else {
    languageInstruction = "Use clear, simple English that a very english beginner can understand. Do NOT use any Telugu words.";
  }

  // 2. PROMPT BUILDER
  let prompt = "";

  if (mode === "Breakdown") {
    prompt = `
${noMarkdown}
${languageInstruction}
TASK: Breakdown the following lesson into clear bullet points.
RULES:
1. Cover only important topic from the text avoid duplicated points,make medium size bullet points with respect to the text provided.
2. Each bullet point MUST be exactly 2 to 3 lines long to provide a clear explanation.
3. Use '-' as the bullet character.
4. Keep the language simple so a student can understand it easily.
5.If there is a side heading include that and add its specific bullet points,do not leave a gap between the side heading and the bullet points.Only give gap between the one side heading topic to other side heading topic.




TEXT TO Breakdown:
${text}`;
  } 
  else if (mode === "Summary") {
    prompt = `
${noMarkdown}
${languageInstruction}
TASK: Provide a complete and simple summary of the entire text provided.
RULES:
1. Do NOT use bullet points. Write it as a cohesive, easy-to-read narrative.
2. Ensure you summarize all main ideas from the start to the end of the text.
3. Keep the tone helpful and encouraging for a student.

TEXT TO SUMMARIZE:
${text}`;
  } 
  else if (mode === "Flashcards") {
    prompt = `${noMarkdown}\n${languageInstruction}\nCreate 6 flashcards in ${lang} using Q: and A: format:\n\n${text}`;
  } 
  else if (mode === "MCQs") {
    prompt = `${noMarkdown}\n${languageInstruction}\nCreate 8 MCQs in ${lang}. Format: Question, A), B), C), D), and Answer:\n\n${text}`;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      return res.status(response.status).json({ 
        error: `Gemini API Error: ${response.status}`, 
        details: errorData 
      });
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    
    if (candidate?.finishReason === "SAFETY") {
      return res.status(200).json({ result: "⚠️ Content was blocked by safety filters. Try rephrasing your text." });
    }

    const output = candidate?.content?.parts?.[0]?.text ?? "No output produced.";
    return res.status(200).json({ result: output });

  } catch (err) {
    console.error("Backend Error:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}