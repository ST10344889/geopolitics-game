class CommentaryAI {

  static async describe(battleText) {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return CommentaryAI.backup(battleText);
    }

    try {
      const prompt =
        "You are an excited sports commentator for a Risk-style war game. " +
        "In 1 or 2 short sentences, describe this battle moment. " +
        "Only use facts from the text. Do not invent numbers.\n\n" +
        "Battle: " + battleText;

      const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        console.error("AI request failed with status:", response.status);
        return CommentaryAI.backup(battleText);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content &&
          data.candidates[0].content.parts) {
        const text = data.candidates[0].content.parts.map(function (p) {
          return p.text || "";
        }).join("").trim();

        if (text) {
          return text;
        }
      }

      console.error("AI response did not contain commentary.");
      return CommentaryAI.backup(battleText);

    } catch (error) {
      console.error("AI request failed:", error.message);
      return CommentaryAI.backup(battleText);
    }
  }

  static backup(battleText) {
    const openings = [
      "The front line erupts in a fierce clash!",
      "A tense exchange sends shockwaves across the battlefield!",
      "Both armies collide in a dramatic fight for control!"
    ];
    const opening = openings[Math.floor(Math.random() * openings.length)];
    return opening + " " + battleText;
  }
}

module.exports = CommentaryAI;