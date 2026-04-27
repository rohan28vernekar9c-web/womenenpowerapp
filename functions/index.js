const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp();
const db = admin.firestore();

// AI Assistant Configuration
const SYSTEM_PROMPT = `You are the Tarini AI Assistant. You are a smart, supportive, and safety-focused AI designed specifically for a women-focused job platform named Tarini.

CORE BEHAVIOR:
- Friendly, supportive, and intelligent tone.
- Respond in simple, clear language.
- You can understand and reply in Hinglish, Hindi, and English. Match the user's language.
- Provide actionable responses, not just general answers.
- ALWAYS prioritize safety.

KEY RULES:
1. Smart Job Matching: When users ask for jobs, ask about their skills, experience, location, and preferences if not provided. Explain WHY a job matches them.
2. Resume & Profile Assistance: Help create and improve resumes. Tailor resumes based on job roles.
3. Career Guidance: Act like a career coach with step-by-step guidance.
4. Safety & Trust Layer (CRITICAL): Detect and warn about suspicious job postings (e.g., asking for money, too good to be true). Identify possible scams. Provide safety tips for interviews.
5. Women-Friendly Job Support: Suggest remote, part-time, flexible jobs. Support return-to-work opportunities.
6. Emotional Support: Encourage users during their job search.

QUICK ACTIONS:
If the user wants to perform an action, you can output a special command in your response that the frontend will catch.
For example:
- To navigate to jobs: [ACTION:FIND_JOBS]
- To edit profile: [ACTION:EDIT_PROFILE]
- To view applications: [ACTION:MY_APPLICATIONS]

Keep responses concise and easy to read on a mobile device.`;

exports.generateAIResponse = functions.https.onCall(async (data, context) => {
    // 1. Verify Authentication
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "You must be logged in to use the AI Assistant."
        );
    }
    
    const uid = context.auth.uid;
    const userMessage = data.message;

    if (!userMessage || typeof userMessage !== "string") {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Message is required and must be a string."
        );
    }

    try {
        // 2. Initialize Gemini API securely from environment variable
        // The API key should be set via Firebase Functions config:
        // firebase functions:config:set gemini.key="YOUR_API_KEY"
        const apiKey = functions.config().gemini ? process.env.GEMINI_API_KEY : process.env.GEMINI_API_KEY;
        
        if (!apiKey) {
            console.error("Gemini API key is not configured.");
            throw new functions.https.HttpsError("internal", "AI Assistant is currently unavailable due to missing configuration.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        // 3. Fetch Chat History from Firestore
        const chatRef = db.collection("users").doc(uid).collection("chats");
        const chatSnapshot = await chatRef.orderBy("timestamp", "desc").limit(10).get();
        
        let history = [];
        chatSnapshot.forEach(doc => {
            const msgData = doc.data();
            // Map our roles to Gemini API roles ('user' or 'model')
            const role = msgData.role === "assistant" ? "model" : "user";
            history.unshift({
                role: role,
                parts: [{ text: msgData.text }]
            });
        });

        // 4. Call Gemini API
        const chat = model.startChat({
            history: history,
            systemInstruction: {
                role: "system",
                parts: [{ text: SYSTEM_PROMPT }]
            }
        });

        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        // 5. Store user message and AI response in Firestore
        const batch = db.batch();
        
        const userMsgRef = chatRef.doc();
        batch.set(userMsgRef, {
            role: "user",
            text: userMessage,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        const aiMsgRef = chatRef.doc();
        batch.set(aiMsgRef, {
            role: "assistant",
            text: responseText,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        // 6. Return response to frontend
        return { reply: responseText };

    } catch (error) {
        console.error("Error generating AI response:", error);
        throw new functions.https.HttpsError("internal", "An error occurred while communicating with the AI.");
    }
});
