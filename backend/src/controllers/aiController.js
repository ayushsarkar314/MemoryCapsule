const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const Capsule = require('../models/Capsule');

/**
 * @desc    AI-powered capsule suggestions based on user context
 * @route   POST /api/ai/suggest
 * @access  Private
 */
const getSuggestions = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ message: 'AI suggestions are not configured on this server.' });
    }

    const userId = req.user._id;
    const hint = (req.body.hint || '').trim().substring(0, 300); // cap the hint length

    // ── 1. Fetch user context ────────────────────────────────────────────────
    const user = await User.findById(userId).populate('friends', 'username displayName');

    const recentCapsules = await Capsule.find({ creator: userId })
      .sort({ createdAt: -1 })
      .limit(8)
      .select('title contentType status textContent createdAt rules capsuleType');

    // ── 2. Build context strings ─────────────────────────────────────────────
    const friendNames =
      user.friends.length > 0
        ? user.friends.map((f) => f.displayName || f.username).join(', ')
        : 'No friends added yet';

    const capsuleSummaries =
      recentCapsules.length > 0
        ? recentCapsules
          .map((c) => {
            const snippet = c.textContent ? ` — "${c.textContent.substring(0, 70)}..."` : '';
            const ruleHint = c.rules.eventName
              ? `event: ${c.rules.eventName}`
              : c.rules.unlockAt
                ? `unlocks ${new Date(c.rules.unlockAt).toLocaleDateString()}`
                : c.rules.expireAt
                  ? `expires ${new Date(c.rules.expireAt).toLocaleDateString()}`
                  : c.rules.destroyAfterView
                    ? 'destroy after view'
                    : '';
            return `• "${c.title}" (${c.contentType}, ${c.capsuleType}${ruleHint ? ', ' + ruleHint : ''})${snippet}`;
          })
          .join('\n')
        : 'No capsules created yet — this is their first one.';

    // ── 3. Compose prompt ────────────────────────────────────────────────────
    const contextPrompt = `You are a creative memory assistant for "Memory Capsule", a digital time-capsule platform where users seal personal memories, messages, and media to be opened in the future.

USER CONTEXT:
- Display name: ${user.displayName || user.username}
- Bio: ${user.bio || '(not set)'}
- Friends on the platform: ${friendNames}
- Their recent capsules:
${capsuleSummaries}
${hint ? `\nUSER HINT: "${hint}"` : ''}

YOUR TASK:
Suggest exactly 3 unique, personalized, creative capsule ideas inspired by this user's profile, their friends, and their history.
Make each suggestion feel emotionally meaningful and specific — not generic.

Respond ONLY with a valid JSON array. No markdown, no explanation, just the JSON:
[
  {
    "title": "Short catchy capsule title",
    "idea": "1–2 sentences: what to put in it and why it's meaningful",
    "contentType": "text",
    "suggestedRule": "unlockAt",
    "suggestedRuleLabel": "Unlock on a future date (e.g. your next birthday)",
    "emoji": "🎂"
  }
]

contentType must be one of: text, image, voice, video
suggestedRule must be one of: unlockAt, expireAt, destroyAfterView, eventName`;

    // ── 4. Call Gemini ───────────────────────────────────────────────────────
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent(contextPrompt);
    const rawText = result.response.text().trim();

    // ── 5. Parse & validate JSON ─────────────────────────────────────────────
    // Strip markdown code fences if Gemini wraps the JSON
    const cleaned = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error('[AI] Could not extract JSON from response:', rawText);
      return res.status(500).json({ message: 'AI returned an unexpected format. Please try again.' });
    }

    let suggestions;
    try {
      suggestions = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('[AI] JSON parse failed:', parseErr.message);
      return res.status(500).json({ message: 'AI response could not be parsed. Please try again.' });
    }

    // Validate structure
    const valid = suggestions.filter(
      (s) =>
        s.title &&
        s.idea &&
        ['text', 'image', 'voice', 'video'].includes(s.contentType) &&
        ['unlockAt', 'expireAt', 'destroyAfterView', 'eventName'].includes(s.suggestedRule)
    );

    if (valid.length === 0) {
      return res.status(500).json({ message: 'AI returned invalid suggestions. Please try again.' });
    }

    res.status(200).json({ suggestions: valid.slice(0, 3) });
  } catch (err) {
    console.error('[AI] Suggestion error:', err.message);
    // Don't expose internal errors in production
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

module.exports = { getSuggestions };
