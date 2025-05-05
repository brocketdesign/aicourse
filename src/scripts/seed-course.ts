// Using CommonJS require syntax for better compatibility
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
// Change require to avoid redeclaring mongoose 
const { connect, connection, Schema, model, models } = require('mongoose');

// Define the Course schema directly in the script
const LessonSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  contentType: { 
    type: String, 
    required: true, 
    enum: ['text', 'video', 'audio', 'quiz', 'code', 'chat'] 
  },
  mediaUrl: { type: String },
  order: { type: Number, required: true },
  duration: { type: Number },
  isPublished: { type: Boolean, default: false },
  module: { type: Schema.Types.ObjectId, ref: 'Module' } // Add module reference
});

const ModuleSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  order: { type: Number, required: true },
  lessons: [{ type: Schema.Types.ObjectId, ref: 'Lesson' }],
  course: { type: Schema.Types.ObjectId, ref: 'Course' } // Add course reference
});

const CourseSchema = new Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  coverImage: { type: String, required: true },
  price: { type: Number, required: true },
  stripePriceId: { type: String },
  stripeProductId: { type: String },
  authors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  modules: [{ type: Schema.Types.ObjectId, ref: 'Module' }],
  isPublished: { type: Boolean, default: false },
  prerequisites: [{ type: String }],
  level: { 
    type: String, 
    required: true, 
    enum: ['beginner', 'intermediate', 'advanced'] 
  },
  duration: { type: Number },
  featured: { type: Boolean, default: false },
  enrollmentCount: { type: Number, default: 0 }
}, { 
  timestamps: true 
});

// Sample course data
const aiCourse = {
  title: "AI Monetization Masterclass",
  slug: "ai-monetization",
  description: "Learn how to create profitable AI tools, content, and businesses in our comprehensive course led by industry experts.",
  coverImage: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000&auto=format&fit=crop",
  price: 19900, // $199.00 in cents
  level: "intermediate",
  duration: 345, // Total minutes
  featured: true,
  enrollmentCount: 0,
  prerequisites: [
    "Understand the fundamentals of AI technologies",
    "Build profitable products with AI integration",
    "Create content that outperforms the competition",
    "Automate your business with AI agents",
    "Scale your AI products to maximize revenue",
    "Use real-world successful case studies"
  ],
  modules: [
    {
      title: "Introduction to AI Monetization",
      description: "Learn the fundamentals of AI monetization strategies",
      order: 1,
      lessons: [
        {
          title: "Understanding the AI Landscape",
          description: "An overview of current AI technologies and opportunities",
          content: `
# Welcome to the AI Monetization Masterclass!

Hey there! Ready to dive into the exciting world of AI and how you can turn its potential into profit? Let's start by getting a clear picture of the current AI landscape.

## What's Hot in AI Right Now?

*   **Large Language Models (LLMs):** Think ChatGPT, Claude, Gemini. These models understand and generate human-like text, powering everything from chatbots to content creation tools.
*   **Generative AI:** Beyond text, this includes AI that creates images (Midjourney, DALL-E), music, and even code. The creative possibilities are immense!
*   **Computer Vision:** AI that 'sees' and interprets images and videos. Used in self-driving cars, medical imaging, and retail analytics.
*   **AI Agents:** Autonomous systems that can perform tasks, make decisions, and interact with digital environments. We'll build these later!

## Key Players & Market Trends

Major tech companies (Google, Microsoft, Meta, OpenAI, Anthropic) are heavily invested, but there's a booming ecosystem of startups. The AI market is projected to be worth trillions – meaning massive opportunities for entrepreneurs like you!

## Why Now?

*   **Accessibility:** Powerful AI models are more accessible than ever via APIs.
*   **Performance:** AI capabilities are advancing at an incredible pace.
*   **Demand:** Businesses and consumers are actively seeking AI-powered solutions.

## Ethical Considerations

It's crucial to build responsibly. We'll touch upon:
*   Bias in AI
*   Data privacy
*   Job displacement concerns
*   Transparency

In the next lesson, we'll explore concrete ways to make money with these amazing technologies!
`,
          contentType: "text",
          order: 1,
          duration: 15,
          isPublished: true
        },
        {
          title: "7 Business Models for AI",
          description: "Discover the most effective ways to monetize AI",
          content: `
# 7 Proven Ways to Monetize AI

Alright, let's talk business models! How can you actually make money with AI? Here are 7 proven strategies:

1.  **AI-Powered SaaS (Software as a Service):**
    *   **What:** Build a software product where AI is a core feature (e.g., an AI writing assistant, a predictive analytics tool).
    *   **Pros:** Recurring revenue, scalable.
    *   **Cons:** Requires development effort, marketing.
    *   **Example:** Jasper (AI writing), Copy.ai

2.  **API Access:**
    *   **What:** Develop a unique AI model or capability and sell access to it via an API.
    *   **Pros:** Can serve many customers, integrates into other apps.
    *   **Cons:** Needs a strong technical advantage, requires API management.
    *   **Example:** OpenAI API, Google Cloud AI APIs.

3.  **AI Consulting & Services:**
    *   **What:** Help businesses implement AI solutions, develop strategies, or build custom AI tools.
    *   **Pros:** High-value service, direct client interaction.
    *   **Cons:** Less scalable, requires expertise.
    *   **Example:** AI implementation agencies, freelance AI consultants.

4.  **AI-Generated Content/Products:**
    *   **What:** Use AI to create content (articles, art, music) or physical products (AI-designed merchandise) and sell them.
    *   **Pros:** Lower barrier to entry for some niches (e.g., art).
    *   **Cons:** Quality control needed, potential saturation.
    *   **Example:** Selling AI art prints, using AI for blog content.

5.  **AI Marketplaces:**
    *   **What:** Create a platform connecting AI service providers with clients, or selling AI models/prompts.
    *   **Pros:** Network effects, potential for high volume.
    *   **Cons:** Requires building a two-sided market.
    *   **Example:** Hugging Face (model sharing), PromptBase (prompt marketplace).

6.  **AI Education & Training:**
    *   **What:** Teach others how to use AI tools or build AI applications (like this course!).
    *   **Pros:** High demand, leverages expertise.
    *   **Cons:** Requires content creation, staying updated.
    *   **Example:** Online courses, workshops, corporate training.

7.  **AI-Enhanced Existing Business:**
    *   **What:** Integrate AI into your current business to improve efficiency, marketing, or customer experience, leading to increased profits.
    *   **Pros:** Leverages existing customer base/operations.
    *   **Cons:** Requires identifying the right AI applications.
    *   **Example:** Using an AI chatbot for customer service, AI for personalized marketing.

Think about which of these models best aligns with your skills and interests. We'll explore how to validate your ideas next!
`,
          contentType: "video",
          mediaUrl: "https://example.com/videos/business-models.mp4",
          order: 2,
          duration: 20,
          isPublished: true
        },
        {
          title: "Market Research Strategies",
          description: "Finding profitable niches for AI products",
          content: `
# Finding Your Goldmine: AI Market Research

Got an AI idea? Awesome! But before you build, let's make sure people actually want it (and will pay for it!). Here's how to do effective market research for AI ventures:

## 1. Identify Problems, Not Just Solutions

*   **Don't start with "I want to build an AI app for X."**
*   **Start with "What problems can AI uniquely solve for a specific group of people?"**
    *   Talk to potential customers (interviews, surveys).
    *   Browse forums (Reddit, industry forums) for complaints and wishes.
    *   Look for inefficient workflows that AI could automate.

## 2. Competitor Analysis (AI Edition)

*   Who else is using AI in the niche you're considering?
*   What are they doing well? Where are the gaps?
*   **AI Twist:** Analyze *how* they use AI. Is it a core feature or a gimmick? Can you do it better, faster, cheaper, or for a different audience?
*   Tools: Google Search, Product Hunt, G2, Capterra.

## 3. Keyword & Trend Research

*   What are people searching for related to your AI idea?
*   Use tools like:
    *   Google Keyword Planner
    *   Ahrefs / SEMrush
    *   Google Trends (Search for terms like "AI for [your niche]")
*   Look for rising search volume and specific "long-tail" keywords indicating need.

## 4. Niche Down!

*   The AI space is vast. Don't try to build for everyone.
*   **Example:** Instead of "AI writing tool," focus on "AI writing tool for academic researchers" or "AI scriptwriting assistant for YouTubers."
*   A specific niche is easier to target, market to, and dominate.

## 5. The Validation Checklist

Before committing significant resources, ask:

*   [ ] Is the problem significant enough for people to pay for a solution?
*   [ ] Can AI provide a *distinct* advantage over existing solutions?
*   [ ] Is the target market large enough?
*   [ ] Can you reach the target market effectively?
*   [ ] Have you talked to at least 5-10 potential customers who confirm the need?

Solid market research is your foundation for building a profitable AI business. Next up: Mastering the art of talking to AI with Prompt Engineering!
`,
          contentType: "text",
          order: 3,
          duration: 25,
          isPublished: true
        }
      ]
    },
    {
      title: "Prompt Engineering",
      description: "Master the art of crafting effective prompts for AI systems",
      order: 2,
      lessons: [
        {
          title: "Principles of Effective Prompting",
          description: "Core concepts for creating powerful prompts",
          content: `
# Talking to AI: The Art of the Prompt

Think of prompting as giving instructions to an incredibly smart, but very literal, assistant. The better your instructions (prompts), the better the results! Let's learn the core principles.

## 1. Be Clear & Specific

*   **Vague:** "Write about dogs."
*   **Specific:** "Write a 500-word blog post about the benefits of adopting senior dogs, focusing on their calm demeanor and lower energy levels. Target audience is first-time dog owners."

## 2. Provide Context

The AI doesn't know what you know unless you tell it.

*   **Without Context:** "Summarize the meeting notes." (Which notes?)
*   **With Context:** "Summarize the following meeting notes, focusing on action items assigned to the marketing team: [Paste notes here]"

## 3. Define the Output Format

Tell the AI *how* you want the response structured.

*   **Implicit:** "Explain photosynthesis."
*   **Explicit Format:** "Explain photosynthesis in three paragraphs, using simple terms suitable for a 5th grader. Include a bulleted list of the key inputs and outputs."

## 4. Assign a Role (Persona)

Tell the AI *who* it should be. This influences tone, style, and expertise.

*   **No Role:** "Write a marketing email."
*   **With Role:** "Act as an expert email marketer. Write a compelling subject line and a short, persuasive email promoting our new productivity app to busy professionals."

## 5. Use Examples (Few-Shot Prompting)

Show the AI exactly what you want by providing examples.

*   **Prompt:**
    \`\`\`
    Translate the following English sentences into French:
    English: Hello, how are you?
    French: Bonjour, comment ça va?

    English: Where is the library?
    French: Où est la bibliothèque?

    English: I would like a coffee.
    French: [AI completes this]
    \`\`\`
    *(AI Output: Je voudrais un café.)*

## 6. Iterate and Refine

Your first prompt might not be perfect. Don't be afraid to tweak and try again!

*   If the output is too generic, add more specifics.
*   If the tone is wrong, adjust the persona.
*   If the format is off, clarify your instructions.

Mastering these principles is key to unlocking the full potential of LLMs. Next, we'll look at more advanced patterns!
`,
          contentType: "text",
          order: 1,
          duration: 30,
          isPublished: true
        },
        {
          title: "Advanced Prompt Patterns",
          description: "Templates and techniques for consistent results",
          content: `
# Level Up Your Prompts: Advanced Patterns

Ready to go beyond the basics? These advanced patterns help you tackle complex tasks and get more reliable results from AI.

## 1. Chain-of-Thought (CoT) Prompting

*   **Concept:** Encourage the AI to "think step-by-step" before giving the final answer. This improves reasoning, especially for math or logic problems.
*   **How:** Add phrases like "Let's think step by step" or include a reasoning process in your examples.
*   **Example:**
    \`\`\`
    Q: Roger has 5 tennis balls. He buys 2 more cans of tennis balls. Each can has 3 tennis balls. How many tennis balls does he have now?

    A: Let's think step by step.
    1. Roger started with 5 balls.
    2. He bought 2 cans, and each can has 3 balls, so he bought 2 * 3 = 6 balls.
    3. In total, he now has 5 + 6 = 11 balls.
    The final answer is 11.
    \`\`\`

## 2. ReAct (Reason + Act) Pattern

*   **Concept:** Combine reasoning with actions (like searching the web or using a calculator). Useful for building agents.
*   **How:** Prompt the AI to break down a task into thoughts, actions (e.g., 'Search[query]', 'Calculate[expression]'), and observations (results of actions).
*   **Example (Conceptual):**
    \`\`\`
    Question: What is the current weather in Paris?
    Thought: I need to find the current weather in Paris. I can use a search tool.
    Action: Search[current weather Paris]
    Observation: (Search results show weather is 15°C and sunny)
    Thought: The search results say it's 15°C and sunny in Paris.
    Final Answer: The current weather in Paris is 15°C and sunny.
    \`\`\`

## 3. Self-Critique / Refinement Pattern

*   **Concept:** Ask the AI to generate an initial response and then critique or improve it based on specific criteria.
*   **How:** A multi-turn process. First prompt for generation, second prompt for critique/refinement.
*   **Example:**
    *   **Prompt 1:** "Write a short story about a robot who learns to paint."
    *   **Prompt 2:** "Review the story you just wrote. Does it effectively convey the robot's emotional journey? Suggest specific ways to improve the emotional depth in the second paragraph."

## 4. Persona Pattern (Advanced)

*   **Concept:** Go beyond simple role assignment. Define the persona's expertise, goals, constraints, and even specific knowledge.
*   **How:** Use detailed descriptions in the prompt.
*   **Example:**
    \`\`\`
    Act as 'Marketing Maverick,' an expert digital marketer specializing in B2B SaaS growth. Your goal is to generate three innovative marketing campaign ideas for a new AI-powered project management tool. Focus on low-budget, high-impact strategies. Avoid suggesting paid search ads. Your response should be formatted as a numbered list with a brief rationale for each idea.
    \`\`\`

## 5. Template Creation

*   **Concept:** Create reusable prompt templates for common tasks, using placeholders for specific inputs.
*   **How:** Define a structure with variables.
*   **Example Template (Markdown):**
    \`\`\`markdown
    ## Blog Post Outline Request

    **Topic:** {{TOPIC}}
    **Target Audience:** {{AUDIENCE}}
    **Goal:** {{GOAL}}
    **Keywords:** {{KEYWORDS}}
    **Tone:** {{TONE}}

    Generate a detailed blog post outline based on the information above. Include sections for Introduction, Main Points (3-5), and Conclusion. Suggest a compelling title.
    \`\`\`

Experiment with these patterns to see how they can elevate your AI interactions! Next, a hands-on workshop.
`,
          contentType: "video",
          mediaUrl: "https://example.com/videos/prompt-patterns.mp4",
          order: 2,
          duration: 35,
          isPublished: true
        },
        {
          title: "Prompt Engineering Workshop",
          description: "Hands-on practice creating effective prompts",
          content: `
# Workshop Time: Let's Practice Prompting!

Theory is great, but practice makes perfect! Let's work through some common scenarios and refine prompts together. Grab your favorite AI chat tool (like ChatGPT, Claude, etc.) and follow along.

## Exercise 1: From Vague to Specific

*   **Scenario:** You need ideas for a social media campaign.
*   **Initial Prompt:** "Give me social media ideas." (Try this - see how generic the results are?)
*   **Refinement Goal:** Get specific, actionable ideas for *your* needs.
*   **Improved Prompt (Example):**
    \`\`\`
    Act as a social media marketing expert. Generate 5 creative social media campaign ideas for promoting a new online course on 'AI Monetization'. The target audience is aspiring entrepreneurs and freelancers. Focus on Instagram and LinkedIn. Include a suggested content format (e.g., Reel, Carousel, Article) and a key message for each idea.
    \`\`\`
*   **Your Turn:** Adapt the improved prompt for a product/service *you* have in mind. Share your prompt and the AI's response in the community chat!

## Exercise 2: Role-Playing for Tone

*   **Scenario:** You need to write an email apologizing for a service outage.
*   **Prompt 1 (Neutral):** "Write an email apologizing for the recent service outage."
*   **Prompt 2 (Empathetic Role):**
    \`\`\`
    Act as the Head of Customer Success for a SaaS company. Write a sincere and empathetic email to our customers apologizing for the unexpected 2-hour service outage yesterday. Explain briefly that it was due to a server issue (now resolved). Reassure them about reliability measures. Avoid overly technical jargon. Keep the tone reassuring and professional.
    \`\`\`
*   **Compare:** Notice the difference in tone and content? The role-play adds significant nuance.

## Exercise 3: Using Examples (Few-Shot)

*   **Scenario:** You want the AI to summarize articles in a specific bullet-point format.
*   **Prompt:**
    \`\`\`
    Summarize the following article into 3 key bullet points, focusing on actionable advice.

    **Example Input Article:** [Short paragraph about time management techniques like Pomodoro]
    **Example Output Summary:**
    *   Use the Pomodoro Technique (25 min work, 5 min break) to maintain focus.
    *   Prioritize tasks using the Eisenhower Matrix (Urgent/Important).
    *   Block out specific time slots for deep work in your calendar.

    **Now, summarize this article:** [Paste your target article here]
    \`\`\`
*   **Observe:** Providing an example guides the AI to match your desired format and focus.

## Exercise 4: Chain-of-Thought for Problem Solving

*   **Scenario:** You need to figure out the best pricing strategy.
*   **Prompt:**
    \`\`\`
    I'm launching an online course on 'Advanced Dog Training Techniques'. My target audience is experienced dog owners. Competitor courses range from $99 to $499. My course includes 10 video modules, downloadable guides, and community access. What pricing strategy should I consider? Let's think step by step about the pros and cons of different price points (e.g., $149, $299, $499) considering the value offered and the target market.
    \`\`\`
*   **Analyze:** The "Let's think step by step" encourages a more reasoned analysis from the AI, exploring different angles.

Keep practicing! The more you experiment with prompts, the more intuitive it becomes. Share your biggest prompting challenges and successes in the chat!
`,
          contentType: "chat",
          order: 3,
          duration: 50,
          isPublished: true
        }
      ]
    },
    {
      title: "Content Creation",
      description: "Create podcasts, videos, and written content with AI",
      order: 3,
      lessons: [
        {
          title: "AI-Assisted Writing Workflows",
          description: "Streamline your writing process with AI tools",
          content: `
# Write Smarter, Not Harder: AI Writing Workflows

AI won't replace good writers, but it *can* make them faster and more effective. Let's build a workflow to supercharge your content creation.

## The Modern Writing Workflow with AI

1.  **Ideation & Research:**
    *   **Problem:** Writer's block? Need fresh angles?
    *   **AI Assist:** Use AI to brainstorm topics, generate headlines, find related keywords, and even summarize research papers or articles.
    *   **Prompt Example:** "Generate 10 blog post ideas about sustainable travel for budget-conscious millennials. Include a catchy title for each."

2.  **Outlining:**
    *   **Problem:** Staring at a blank page? Unsure how to structure your piece?
    *   **AI Assist:** Feed your topic and key points to an AI and ask it to create a logical outline.
    *   **Prompt Example:** "Create a detailed outline for a blog post titled 'The Ultimate Guide to Starting a Podcast'. Include sections for equipment, recording, editing, hosting, and promotion."

3.  **Drafting (The Co-Pilot Approach):**
    *   **Problem:** Getting the first draft down can be slow.
    *   **AI Assist:** Use AI to draft sections based on your outline points. **Crucially: Don't just copy-paste!** Treat the AI as a co-writer. Expand on its points, inject your voice, add personal anecdotes, and fact-check rigorously.
    *   **Prompt Example:** "Expand on the outline point 'Choosing the Right Podcast Microphone'. Discuss USB vs. XLR mics, dynamic vs. condenser, and recommend 2-3 options for beginners."
    *   **Human Touch:** Add your personal experience with microphones, refine the AI's technical explanations, ensure the tone matches your brand.

4.  **Editing & Refining:**
    *   **Problem:** Typos, grammatical errors, awkward phrasing. Need to improve clarity or conciseness?
    *   **AI Assist:** Use AI tools (like Grammarly, ProWritingAid, or even ChatGPT) to check grammar, style, clarity, and tone. Ask it to rephrase sentences or shorten paragraphs.
    *   **Prompt Example:** "Review the following paragraph for clarity and conciseness. Suggest alternative phrasing for any awkward sentences: [Paste paragraph]"

5.  **SEO Optimization:**
    *   **Problem:** Need to ensure your content ranks well in search engines?
    *   **AI Assist:** Use AI to identify relevant keywords, generate meta descriptions, and even check if your content adequately covers the topic compared to top-ranking articles.
    *   **Prompt Example:** "Analyze the following blog post draft. Suggest relevant LSI keywords I should include. Generate a compelling meta description under 160 characters."

## Key Tools:

*   **LLMs:** ChatGPT, Claude, Gemini
*   **AI Writing Assistants:** Jasper, Copy.ai, Writesonic
*   **Grammar/Style Checkers:** Grammarly, ProWritingAid
*   **SEO Tools with AI features:** SurferSEO, MarketMuse

**Remember:** AI is a powerful *tool*, not a replacement for your unique voice, expertise, and critical thinking. Use it to augment your skills, not abdicate responsibility.
`,
          contentType: "text",
          order: 1,
          duration: 25,
          isPublished: true
        },
        {
          title: "Podcast Production with AI",
          description: "Using AI for script writing, editing, and production",
          content: `
# AI in Your Ears: Revolutionizing Podcast Production

Podcasting involves many steps, and AI can streamline almost all of them! Let's explore how.

## 1. Topic Research & Ideation

*   **AI Assist:** Brainstorm episode ideas, analyze trending topics in your niche, research potential guests.
*   **Prompt Example:** "Generate 10 podcast episode ideas for a show about 'Future Technology Trends'. Focus on topics relevant in the next 1-3 years."

## 2. Scriptwriting & Show Notes

*   **AI Assist:** Generate interview questions, draft episode outlines or full scripts, summarize episodes for show notes, create timestamps.
*   **Prompt Example:** "Create a script outline for a 20-minute solo podcast episode titled 'Demystifying NFTs'. Include an intro hook, 3 main discussion points, and a call-to-action."
*   **Workflow:** Use the AI draft as a starting point, then inject your personality and expertise.

## 3. Voice Cloning & Text-to-Speech (Use Ethically!)

*   **AI Assist:** Create voiceovers from text (great for intros/outros or correcting mistakes without re-recording), or even clone your voice (requires specific tools and consent if cloning others).
*   **Tools:** ElevenLabs, Descript, Play.ht
*   **Caution:** Be transparent if using AI voices. Cloning requires explicit permission and ethical consideration.

## 4. AI-Powered Editing

*   **AI Assist:** Automatically remove filler words ("um", "uh"), silence, and background noise. Some tools allow editing audio by editing the transcript!
*   **Tools:** Descript, Adobe Podcast Enhance, Auphonic
*   **Benefit:** Drastically reduces manual editing time.

## 5. Transcription

*   **AI Assist:** Generate accurate transcripts of your episodes quickly and affordably. Essential for accessibility and SEO.
*   **Tools:** Otter.ai, Trint, Happy Scribe, Descript

## 6. Content Repurposing

*   **AI Assist:** Turn your podcast transcript into blog posts, social media snippets, email newsletters, or video scripts.
*   **Prompt Example:** "Take the following podcast transcript section and turn it into a 300-word blog post summarizing the key advice given: [Paste transcript section]"

## Putting It Together: An AI-Enhanced Podcast Workflow

1.  **Ideate:** AI brainstorms topics.
2.  **Outline/Script:** AI drafts structure, you refine.
3.  **Record:** Human performance is still key!
4.  **Edit:** AI removes filler words & noise (e.g., Descript).
5.  **Enhance:** AI improves audio quality (e.g., Adobe Podcast Enhance).
6.  **Transcribe:** AI creates the transcript (e.g., Otter.ai).
7.  **Show Notes:** AI summarizes transcript.
8.  **Repurpose:** AI converts transcript to other formats.

By integrating AI strategically, you can produce higher-quality podcasts more efficiently.
`,
          contentType: "audio",
          mediaUrl: "https://example.com/audio/podcast-production.mp3",
          order: 2,
          duration: 40,
          isPublished: true
        },
        {
          title: "YouTube Script Generation",
          description: "Create engaging video scripts with AI assistance",
          content: `
# Lights, Camera, AI! Scripting Engaging YouTube Videos

Video is king, but scripting can be tough. Let AI be your scriptwriting assistant to create content that hooks viewers and keeps them watching.

## The Anatomy of a Great YouTube Script

A typical structure includes:

1.  **The Hook (First 5-15 seconds):** Grab attention immediately! Ask a question, state a shocking fact, show a compelling visual, tease the outcome.
2.  **The Intro (30-60 seconds):** Introduce the topic, state the video's value proposition (what will the viewer learn?), and briefly introduce yourself/channel.
3.  **The Body (Main Content):** Deliver the core value. Break it down into clear sections or steps. Use visuals, examples, and storytelling.
4.  **The Call to Action (CTA):** Tell viewers what you want them to do next (Subscribe, Like, Comment, Visit a link).
5.  **The Outro:** Thank viewers, tease the next video, reinforce the CTA.

## How AI Can Help Scripting

*   **Generating Hooks:** Ask AI for attention-grabbing opening lines based on your video topic.
    *   **Prompt:** "Generate 5 compelling hooks for a YouTube video titled '5 AI Tools That Will Save You Hours Each Week'."
*   **Structuring the Body:** Provide AI with your key points and ask it to structure them logically for a video format.
    *   **Prompt:** "Create a script outline for a YouTube video about 'Setting up a Smart Home on a Budget'. Include sections for choosing a platform, essential devices (lights, plugs, speaker), and basic automation routines."
*   **Drafting Sections:** Ask AI to elaborate on specific points in your outline. Remember to edit and add your voice!
    *   **Prompt:** "Write a script segment for the 'Essential Devices' section of my smart home video. Explain smart plugs and smart bulbs, giving 1-2 budget-friendly examples for each."
*   **Crafting CTAs:** Get AI suggestions for effective calls to action.
    *   **Prompt:** "Suggest 3 different calls to action for the end of my YouTube video about AI tools. One asking for subscribes, one for comments, and one directing to a related blog post."
*   **Writing Video Descriptions & Titles:** Use AI to brainstorm SEO-friendly titles and write compelling video descriptions incorporating keywords.
    *   **Prompt:** "Generate 5 SEO-friendly YouTube titles for a video reviewing the latest iPhone. Also, write a 150-word video description including keywords like 'iPhone review', 'camera test', 'battery life'."

## Example AI Scripting Workflow

1.  **Topic & Angle:** You decide on "Easy Meal Prep Ideas for Busy Professionals."
2.  **Hook Ideas (AI):** AI suggests hooks like "Tired of takeout? I'll show you 3 meal prep hacks..."
3.  **Outline (AI + Human):** AI generates sections (Benefits, Shopping List, Recipe 1, Recipe 2, Recipe 3, Storage Tips), you refine the flow.
4.  **Drafting (AI + Human):** AI drafts the recipe steps, you add personal tips, cooking techniques, and transition sentences.
5.  **CTA (AI):** AI suggests asking viewers to share their favorite meal prep recipes in the comments.
6.  **Title/Description (AI):** AI helps craft an optimized title and description.
7.  **Final Polish (Human):** You read the script aloud, check timing, ensure it sounds natural and engaging.

AI accelerates the process, but *your* personality, delivery, and visual storytelling are what make a YouTube video truly great.
`,
          contentType: "video",
          mediaUrl: "https://example.com/videos/youtube-scripts.mp4",
          order: 3,
          duration: 30,
          isPublished: true
        }
      ]
    },
    {
      title: "AI Agent Automation",
      description: "Build autonomous AI agents to automate your workflow",
      order: 4,
      lessons: [
        {
          title: "Agent Architecture Fundamentals",
          description: "Understanding the structure of effective AI agents",
          content: `
# Meet Your AI Workforce: Understanding Agent Architecture

We've used AI as a tool, but now let's explore AI *agents* – systems that can act autonomously to achieve goals. Think of them as AI workers you can delegate tasks to.

## What is an AI Agent?

An AI agent perceives its environment (digital or physical), makes decisions, and takes actions to achieve specific goals. Unlike a simple chatbot, an agent has more autonomy and capability.

## Core Components of an AI Agent

Most modern AI agents (especially those based on LLMs) share a common architecture:

1.  **Core Logic / Brain (LLM):**
    *   The central decision-making component, usually a powerful Large Language Model (like GPT-4, Claude 3, etc.).
    *   It interprets goals, breaks down tasks, reasons about steps, and decides what actions to take.

2.  **Planning Module:**
    *   Takes a complex goal (e.g., "Research competitors for my new SaaS product") and breaks it down into smaller, manageable steps or sub-tasks.
    *   Strategies: Simple sequential planning, or more complex methods like ReAct (Reason+Act) where the agent plans, acts, observes, and replans.

3.  **Memory:**
    *   Agents need memory to retain information across steps and interactions.
    *   **Short-Term Memory:** Context window of the LLM, holding recent conversation/actions.
    *   **Long-Term Memory:** External storage (like a vector database) where the agent can save and retrieve information, learnings, or past interactions for future use. This allows agents to learn and maintain context over extended periods.

4.  **Tool Use / Action Module:**
    *   Agents need capabilities beyond just text generation. This module allows the agent to interact with the outside world or perform specific tasks.
    *   **Examples:**
        *   Web search tool
        *   Code execution tool
        *   Calculator
        *   API interaction (e.g., sending emails, accessing databases)
        *   File system access

## How it Works (Simplified Flow)

1.  **Goal:** User gives the agent a high-level goal (e.g., "Summarize today's AI news").
2.  **Planning:** The LLM (using its planning module) breaks it down: "Step 1: Search for 'AI news today'. Step 2: Read top 5 articles. Step 3: Synthesize key findings. Step 4: Write summary."
3.  **Action:** The agent decides to use the 'Web Search' tool.
4.  **Tool Execution:** The action module executes the search 'Search[AI news today]'.
5.  **Observation:** The agent receives the search results (links, snippets). This goes into short-term memory.
6.  **Reasoning/Replanning:** The LLM processes the results. It might decide to "read" the first link (using another tool or its internal knowledge if the content is passed in).
7.  **Iteration:** Steps 3-6 repeat until the plan is complete. Information might be stored in long-term memory if needed later.
8.  **Final Output:** The agent generates the final summary based on its synthesized findings.

Understanding this architecture is key to building and utilizing agents effectively. Next, we'll look at how to actually start building one!
`,
          contentType: "text",
          order: 1,
          duration: 20,
          isPublished: true
        },
        {
          title: "Building Your First Agent",
          description: "Step-by-step guide to creating an autonomous agent",
          content: `
# Let's Build! Your First AI Agent (Conceptual)

Okay, theory's done, let's get practical! We won't write production-ready code here, but we'll outline the steps and concepts using pseudocode and ideas from popular frameworks like LangChain or CrewAI.

## Goal: A Simple Research Agent

Let's build an agent whose goal is: **"Find the latest news about OpenAI and summarize the top 3 headlines."**

## Step 1: Choose Your Tools

Our agent needs capabilities:

1.  **LLM:** The 'brain' (e.g., GPT-4, Claude 3 via API).
2.  **Search Tool:** A way to browse the web (e.g., Google Search API, DuckDuckGo search library).

## Step 2: Define the Agent's Prompt / Instructions

This is crucial. We need to tell the LLM how to act as an agent.

\`\`\`plaintext
You are a helpful research assistant agent.
Your goal is to find the latest news about a given topic and summarize the top headlines.

TOOLS:
------
You have access to the following tools:
- Search[query]: Searches the web for the query and returns results.
- FinalAnswer[summary]: Use this tool to provide the final summary when you have finished.

INSTRUCTIONS:
-------------
1. Understand the research topic given by the user.
2. Use the Search tool to find relevant recent news articles about the topic.
3. Analyze the search results to identify the most important headlines/stories (aim for 3).
4. Synthesize the information from the top stories.
5. Provide the final summary using the FinalAnswer tool.
Think step-by-step about your plan.
\`\`\`

## Step 3: The Agent Loop (Conceptual Code)

This is the core execution flow.

\`\`\`python
# --- Conceptual Python-like Pseudocode ---

# Import necessary libraries/APIs (LLM, Search Tool)
import llm_api
import search_tool

# Define the agent's core prompt (from Step 2)
agent_prompt = "..."

# User's request
user_goal = "Find the latest news about OpenAI and summarize the top 3 headlines."

# Initialize conversation history / memory
conversation_history = [agent_prompt, f"User Goal: {user_goal}"]

# Agent execution loop
while True:
    # 1. Send history to LLM to get the next thought/action
    response = llm_api.generate(conversation_history)
    # Example LLM Response: "Thought: I need to search for recent OpenAI news. Action: Search[latest OpenAI news]"
    conversation_history.append(f"LLM Response: {response}")

    # 2. Parse the action from the LLM response
    if "Action: Search[" in response:
        query = parse_search_query(response) # Extract "latest OpenAI news"
        # 3. Execute the tool
        search_results = search_tool.execute(query)
        # 4. Add observation back to history
        observation = f"Observation: {search_results}"
        conversation_history.append(observation)
        # Continue loop: LLM will now process the search results

    elif "Action: FinalAnswer[" in response:
        summary = parse_final_answer(response) # Extract the summary
        print(f"Agent Finished:\n{summary}")
        break # Exit loop

    else:
        # Handle errors or unexpected responses
        print("Agent confused. Stopping.")
        break

# --- End Pseudocode ---
\`\`\`

## Step 4: Running the Agent

When you run this conceptual loop:

1.  The LLM first thinks and decides to search.
2.  The 'search_tool' is called.
3.  The search results are fed back to the LLM.
4.  The LLM analyzes the results, synthesizes the summary (this might take a few internal thought steps).
5.  Finally, the LLM decides to use 'FinalAnswer' and provides the summary.

## Frameworks Make This Easier!

Writing this loop from scratch is complex. Frameworks like:

*   **LangChain:** Provides abstractions for prompts, LLMs, tools, memory, and agent loops (executors).
*   **CrewAI:** Focuses on multi-agent collaboration, defining agents with roles, goals, and tools.
*   **AutoGen (Microsoft):** Research-focused framework for conversational agents.

These frameworks handle much of the boilerplate code (parsing actions, managing history, tool execution), letting you focus on defining the agent's goals, tools, and prompts.

This was a simplified example, but it shows the core logic! Next, we'll discuss taking agents to the next level.
`,
          contentType: "code",
          order: 2,
          duration: 45,
          isPublished: true
        },
        {
          title: "Advanced Agent Techniques",
          description: "Taking your AI agents to the next level",
          content: `
# Supercharging Your Agents: Advanced Techniques

Building simple agents is cool, but the real power comes from more advanced strategies. Let's explore how to make your agents more robust, capable, and intelligent.

## 1. Multi-Agent Systems

*   **Concept:** Instead of one agent doing everything, create a team of specialized agents that collaborate.
*   **Example (CrewAI style):**
    *   **Agent 1: Research Lead:** Goal is to find information. Tool: Web Search.
    *   **Agent 2: Content Writer:** Goal is to write compelling text based on research. Tool: None (uses LLM).
    *   **Agent 3: Editor:** Goal is to review and refine the writer's output. Tool: None.
    *   **Orchestrator/Manager:** Coordinates the workflow, passing tasks between agents.
*   **Benefits:** Specialization leads to higher quality results, mimics human teamwork.
*   **Frameworks:** CrewAI is specifically designed for this. LangChain and AutoGen also support multi-agent setups.

## 2. Sophisticated Planning & Reasoning

*   **Concept:** Move beyond simple step-by-step plans. Enable agents to handle errors, adapt to changing information, and make more complex decisions.
*   **Techniques:**
    *   **ReAct:** Already discussed, but crucial for robust tool use.
    *   **Reflection/Self-Correction:** Agent reviews its own actions and outputs, identifies flaws, and corrects its plan or results. (Prompt: "Review your previous steps. Did you achieve the sub-goal? If not, what went wrong and how can you correct it?")
    *   **Tree-of-Thoughts (ToT):** Agent explores multiple reasoning paths simultaneously and evaluates them before choosing the best one. More computationally intensive but powerful for complex problems.

## 3. Enhanced Memory Systems

*   **Concept:** Give agents better ways to store and retrieve information for long-term use and learning.
*   **Techniques:**
    *   **Vector Databases (e.g., Pinecone, ChromaDB):** Store information (text chunks, past conversations) as numerical vectors. Allows semantic search – finding information based on meaning, not just keywords. Essential for agents that need to recall large amounts of context.
    *   **Structured Memory:** Store information in structured formats (like databases or knowledge graphs) for more precise recall.
    *   **Memory Summarization:** Periodically summarize conversation history or retrieved documents to fit within the LLM's context window while retaining key information.

## 4. Tool Augmentation & Custom Tools

*   **Concept:** Expand the agent's capabilities beyond basic search or calculation.
*   **Ideas:**
    *   **API Integration:** Create tools that allow the agent to interact with specific software (e.g., Google Calendar, Slack, Notion, your company's internal database).
    *   **Code Execution:** Allow the agent to write and execute code (sandboxed for safety!) to perform complex calculations, data analysis, or scripting tasks.
    *   **Human-in-the-Loop Tool:** A special "tool" that pauses the agent and asks a human for input or approval before proceeding. Crucial for critical tasks.

## 5. Error Handling & Resilience

*   **Concept:** Agents will inevitably encounter errors (tool failures, unexpected outputs, flawed plans). Build in mechanisms to handle them gracefully.
*   **Strategies:**
    *   **Retry Logic:** If a tool fails, try again (perhaps with modified input).
    *   **Fallback Mechanisms:** If one approach fails, try an alternative plan or tool.
    *   **Error Reporting:** Agent should be able to recognize and report when it's stuck or has failed.

Building advanced agents requires experimentation and a good understanding of LLMs, prompting, and potentially software development if creating custom tools. Frameworks provide the building blocks, but the architecture and strategy are key. This is where the real cutting-edge AI development is happening!
`,
          contentType: "video",
          mediaUrl: "https://example.com/videos/advanced-agents.mp4",
          order: 3,
          duration: 35,
          isPublished: true
        }
      ]
    }
  ]
};

// --- Models ---
const Lesson = models.Lesson || model('Lesson', LessonSchema);
const Module = models.Module || model('Module', ModuleSchema);
const Course = models.Course || model('Course', CourseSchema);

async function seedCourse() {
  let session;
  try {
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI environment variable is not defined');
    console.log('Connecting to MongoDB at:', uri);
    await connect(uri);
    console.log('Connected to MongoDB successfully');

    // Start a session for transaction
    session = await connection.startSession();
    session.startTransaction();
    console.log('Started transaction');

    // 1. Upsert the course first (without modules) to get its ID
    // Create a new object excluding modules instead of using delete
    const { modules: modulesData, ...courseBaseData } = aiCourse;

    const courseDoc = await Course.findOneAndUpdate(
      { slug: aiCourse.slug },
      courseBaseData, // Use the object without modules
      { new: true, upsert: true, setDefaultsOnInsert: true, session: session }
    );
    const courseId = courseDoc._id;
    console.log('Upserted course base:', courseId);

    // 2. Upsert lessons and modules, linking modules back to the course
    const moduleIds = [];
    // Use the modulesData extracted earlier
    for (const mod of modulesData) {
      // First, create or update the module to get its ID
      const moduleDoc = await Module.findOneAndUpdate(
        { title: mod.title, order: mod.order, course: courseId },
        {
          title: mod.title,
          description: mod.description,
          order: mod.order,
          course: courseId, // Explicitly set the course field
          lessons: [] // Initialize with empty lessons array, will update later
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, session: session }
      );
      const moduleId = moduleDoc._id;
      
      // Now create or update the lessons with reference to the module
      const lessonIds = [];
      for (const lesson of mod.lessons) {
        const lessonDoc = await Lesson.findOneAndUpdate(
          { title: lesson.title, order: lesson.order },
          {
            ...lesson,
            module: moduleId // Set the reference to the parent module
          },
          { new: true, upsert: true, setDefaultsOnInsert: true, session: session }
        );
        lessonIds.push(lessonDoc._id);
      }

      // Update the module with the lesson IDs
      await Module.findByIdAndUpdate(
        moduleId,
        { $set: { lessons: lessonIds } },
        { session: session }
      );
      
      moduleIds.push(moduleId);
      console.log(` - Upserted module: ${moduleDoc.title} (ID: ${moduleId}) with ${lessonIds.length} lessons linked to Course ${courseId}`);
    }

    // 3. Update the course with the final list of module IDs
    await Course.findByIdAndUpdate(
        courseId,
        { $set: { modules: moduleIds } },
        { session: session }
    );
    console.log('Updated course with module IDs:', moduleIds);

    // Commit the transaction
    await session.commitTransaction();
    console.log('Transaction committed successfully');

    console.log('Seeded/updated course completely:', courseId);

  } catch (error) {
    console.error('Error seeding course:', error);
    // Abort transaction if session exists
    if (session) {
      console.log('Aborting transaction...');
      await session.abortTransaction();
      console.log('Transaction aborted');
    }
    process.exit(1); // Exit with error code
  } finally {
    // End session if it exists
    if (session) {
      session.endSession();
      console.log('Session ended');
    }
    await connection.close(); // Using connection.close() instead of mongoose.disconnect()
    console.log('MongoDB connection closed');
  }
}

// Run the seeding function
seedCourse();