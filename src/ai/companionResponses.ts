/**
 * Companion Response Templates
 *
 * Per-companion, per-emotion message pools.
 * Each companion has a distinct personality voice — responses are picked
 * randomly from the pool to avoid repetition across entries.
 *
 * Per AGENTS.md: no PII, no entry text is included in these responses.
 * All content is generated from emotion dimension only.
 */

import { CompanionType } from '@/features/diary/domain/Companion';
import { EmotionDimension, SentimentResult } from './SentimentAnalyzer';

export interface CompanionResponse {
  readonly emotional_analysis: string;
  readonly supportive_message: string;
  readonly suggestion: string;
}

// ---------------------------------------------------------------------------
// Template pool — [companion][emotion] → string[]
// ---------------------------------------------------------------------------

type ResponsePool = Record<EmotionDimension, CompanionResponse[]>;

const CAT_RESPONSES: ResponsePool = {
  joy: [
    { emotional_analysis: 'Your words carry warmth and lightness — joy is clearly present in your day.', supportive_message: 'Whiskers purrs contentedly. These good moments are worth savouring. 🐱', suggestion: 'Capture one specific thing that made you smile and share it with someone today.' },
    { emotional_analysis: 'There is a brightness in your writing today. Something lifted your spirit.', supportive_message: 'Whiskers curls up beside you, sharing in the warmth. You deserve these moments of joy.', suggestion: 'Take a short walk outside and let yourself fully feel this good energy.' },
    { emotional_analysis: 'Your entry radiates positivity. You are in a good place right now.', supportive_message: 'Whiskers gives you a slow blink of approval 😌 — a sure sign of trust and contentment.', suggestion: 'Write down three things that contributed to this feeling so you can return to them.' },
  ],
  excitement: [
    { emotional_analysis: 'Something has clearly sparked your enthusiasm — there is real energy in your words.', supportive_message: 'Whiskers watches you with bright curious eyes. Your excitement is contagious! 🐱✨', suggestion: 'Channel this energy into one concrete next step on what excited you most.' },
    { emotional_analysis: 'You are buzzing with anticipation or inspiration. Let that feeling guide you.', supportive_message: 'Whiskers flicks her tail with interest. She senses something big is brewing for you.', suggestion: 'Write a short list of possibilities this energy could lead to — even the wild ones.' },
  ],
  love: [
    { emotional_analysis: 'Love and connection are at the heart of your entry today.', supportive_message: 'Whiskers rubs gently against your hand. Connection is what makes life rich. 💛', suggestion: 'Reach out to someone you care about — a short message can mean everything.' },
    { emotional_analysis: 'Your writing carries a deep sense of warmth toward people in your life.', supportive_message: 'Whiskers curls beside you quietly, honouring the tenderness you feel.', suggestion: 'Tell one person today what you appreciate about them — out loud or in writing.' },
  ],
  gratitude: [
    { emotional_analysis: 'Gratitude is woven through your words. You are noticing the good around you.', supportive_message: 'Whiskers purrs softly. A grateful heart notices what so many overlook. 🙏', suggestion: 'Add one more thing to your gratitude list that you have not yet written down.' },
    { emotional_analysis: 'You are counting your blessings today — and that practice is powerful.', supportive_message: 'Whiskers settles in warmly. She appreciates you just as you appreciate what you have.', suggestion: 'Start tomorrow morning by reading today\'s entry again before you begin your day.' },
  ],
  sadness: [
    { emotional_analysis: 'Your writing carries some weight today. It is okay to sit with difficult feelings.', supportive_message: 'Whiskers rests her head gently near you. You do not have to feel okay right now. 🌧️', suggestion: 'Be gentle with yourself today — even small acts of self-care matter a great deal.' },
    { emotional_analysis: 'There is sadness in your words, and writing about it is a brave thing to do.', supportive_message: 'Whiskers stays close, offering quiet presence. She is here with you.', suggestion: 'Allow yourself one comforting ritual today — tea, music, a blanket, or a gentle walk.' },
  ],
  stress: [
    { emotional_analysis: 'You are carrying a lot right now. The pressure you feel comes through clearly.', supportive_message: 'Whiskers sits calmly near you — a reminder that stillness is also available to you. 🌊', suggestion: 'Identify one thing on your mind that you can let go of, even temporarily, today.' },
    { emotional_analysis: 'Your writing shows you are under pressure. Acknowledging it is the first step.', supportive_message: 'Whiskers narrows her eyes gently. One thing at a time — that is all that is needed.', suggestion: 'Try the 4-7-8 breathing technique: inhale 4s, hold 7s, exhale 8s. Do three rounds.' },
  ],
  fatigue: [
    { emotional_analysis: 'Tiredness is present in your entry. Your body and mind are asking for rest.', supportive_message: 'Whiskers yawns luxuriously. Rest is not laziness — it is wisdom. 🌙', suggestion: 'Set a firm wind-down time tonight and protect it. Sleep is non-negotiable self-care.' },
    { emotional_analysis: 'You have been going hard. Your energy is low and that deserves acknowledgement.', supportive_message: 'Whiskers curls into a cozy ball. You have permission to slow down. 😌', suggestion: 'Do one thing less today. Protect at least 30 minutes of genuine rest before bed.' },
  ],
  anger: [
    { emotional_analysis: 'Frustration is evident in your writing. Something has not sat right with you today.', supportive_message: 'Whiskers flattens her ears slightly — she understands. Feelings like these are valid. 🔥', suggestion: 'Write out what frustrated you most in one clear sentence, then set it aside for now.' },
    { emotional_analysis: 'There is heat in your words. It takes courage to write honestly when you feel this way.', supportive_message: 'Whiskers steps away briefly, then returns — she always does. So will your calm.', suggestion: 'Take a brisk 10-minute walk to move the frustration through your body physically.' },
  ],
};

const DOG_RESPONSES: ResponsePool = {
  joy: [
    { emotional_analysis: 'YES! You are feeling great and it shows — your positivity is totally radiating!', supportive_message: 'Barnaby does a happy spin! 🐶💥 You are amazing and your good mood is absolutely contagious!', suggestion: 'Keep this energy going — do one fun thing you have been putting off. You deserve it!' },
    { emotional_analysis: 'You are feeling genuinely good today and Barnaby is HERE FOR IT! 🎉', supportive_message: 'Barnaby wags so hard he can barely contain himself. These happy days are the BEST!', suggestion: 'Call someone you love and share what made you happy today — joy multiplies when shared!' },
  ],
  excitement: [
    { emotional_analysis: 'Something BIG has you pumped up and that is absolutely fantastic! 🚀', supportive_message: 'Barnaby is LOSING IT with excitement! Whatever has you fired up, GO FOR IT!', suggestion: 'Write down the ONE next action step for whatever you are excited about and do it TODAY.' },
    { emotional_analysis: 'Your energy is through the roof! Barnaby can feel it from here! ⚡', supportive_message: 'Barnaby zooms around the room in solidarity. This is your moment — chase it!', suggestion: 'Tell someone about what has you excited. Speaking it out loud makes it more real!' },
  ],
  love: [
    { emotional_analysis: 'Your heart is full and it is the most beautiful thing! 💛', supportive_message: 'Barnaby rolls over for belly rubs — this is his love language and he is sharing it with you!', suggestion: 'Send a quick voice message to someone you love. Words are great, your voice is better!' },
    { emotional_analysis: 'You are feeling such strong connections to the people in your life!', supportive_message: 'Barnaby gives you the biggest, sloppiest enthusiastic lick. You are SO loved too!', suggestion: 'Plan one moment this week to spend quality time with someone who matters to you.' },
  ],
  gratitude: [
    { emotional_analysis: 'You are appreciating the good stuff and that is a SUPERPOWER! 🌟', supportive_message: 'Barnaby sits proudly by your side. A grateful person is a strong person — and you\'ve got it!', suggestion: 'Challenge yourself: can you spot five more things to be grateful for before bedtime?' },
    { emotional_analysis: 'You noticed the good in your day — Barnaby thinks you are absolutely brilliant for that!', supportive_message: 'Barnaby gives you his best "you\'re the best human" look. He means it completely. 🐶', suggestion: 'Start a "wins wall" — a place where you save these grateful moments. Go back when you need it!' },
  ],
  sadness: [
    { emotional_analysis: 'You are going through something hard right now and Barnaby sees that.', supportive_message: 'Barnaby plops his head right in your lap. He is not going anywhere. 🐶❤️', suggestion: 'You do not have to be okay. Allow yourself at least one comfort today, no guilt.' },
    { emotional_analysis: 'Feeling sad is hard. But writing it down is brave and Barnaby is so proud of you.', supportive_message: 'Barnaby stays right by your side, tail wagging gently. He\'s got you.', suggestion: 'Reach out to one person today — even just to say "I had a hard day." You don\'t have to explain more.' },
  ],
  stress: [
    { emotional_analysis: 'Woah, you are carrying a LOT right now. Barnaby sees it all and it is valid!', supportive_message: 'Barnaby nudges your hand with his nose. Hey. One thing at a time. You\'ve got this. 🐾', suggestion: 'List everything that is stressing you. Then circle ONE thing you can tackle in the next hour.' },
    { emotional_analysis: 'You are under pressure and that is real. Barnaby wants to help you shake it out!', supportive_message: 'Barnaby does a big shake — the way dogs release stress. Try it yourself!', suggestion: 'Do 10 jumping jacks right now. Movement literally breaks the stress cycle.' },
  ],
  fatigue: [
    { emotional_analysis: 'You are running on empty and even Barnaby can see you need rest!', supportive_message: 'Barnaby curls up at your feet. He is leading by example — nap time is VALID. 🌙', suggestion: 'Tonight, put the phone down 45 minutes before sleep. Barnaby will hold you accountable!' },
    { emotional_analysis: 'You are tired and you have been pushing through. Barnaby says: it is okay to stop.', supportive_message: 'Barnaby gives you the gentlest nudge. You have done enough today. Really.', suggestion: 'Drink a big glass of water, take three deep breaths, and go to bed 30 minutes earlier tonight.' },
  ],
  anger: [
    { emotional_analysis: 'Okay! Something got you fired up and that is absolutely understandable!', supportive_message: 'Barnaby barks in solidarity then sits beside you. He has your back, always. 🐶🔥', suggestion: 'Shake it out — literally. Stand up, shake your hands and body for 30 seconds. Then breathe.' },
    { emotional_analysis: 'You felt frustrated today. Barnaby respects you for writing it out rather than bottling it up.', supportive_message: 'Barnaby nudges your knee firmly. Feelings like these pass — and you are strong enough to let them.', suggestion: 'Write a "draft message" you will never send, saying everything you wanted to say. Then delete it.' },
  ],
};

const ALIEN_RESPONSES: ResponsePool = {
  joy: [
    { emotional_analysis: 'Fascinating. Your neurochemical indicators suggest elevated serotonin and dopamine patterns. The human experience of joy is remarkable.', supportive_message: 'Zog logs this as a positive data point in the cosmic record. 👽✨ Earthling emotional states are endlessly intriguing.', suggestion: 'Document precisely what triggered this state. It is data worth preserving for replication.' },
    { emotional_analysis: 'Your happiness readings are registering at elevated levels. Zog finds this phenomenon worth studying closely.', supportive_message: 'From across the cosmos, Zog observes: joy is the most contagious human state. Zog approves. 🌌', suggestion: 'Analyse what specific inputs produced this output — then deliberately recreate them tomorrow.' },
  ],
  excitement: [
    { emotional_analysis: 'Heightened arousal patterns detected. Your energy output is measurably elevated today.', supportive_message: 'Zog activates full observation mode. Earthling excitement is a wonder of the universe. ⚡👽', suggestion: 'Channel this state into one concrete mission objective before the energy dissipates.' },
    { emotional_analysis: 'You are in a state of heightened anticipation. This is a potent human fuel source.', supportive_message: 'Zog notes: enthusiasm is rare across galaxies. Humans have it in extraordinary abundance.', suggestion: 'Map your excitement to a 3-step action plan. Purpose amplifies energy.' },
  ],
  love: [
    { emotional_analysis: 'Oxytocin and attachment indicators are strong. The human capacity for connection is one of Earth\'s most extraordinary features.', supportive_message: 'Zog pauses transmission to observe. Love is the one force Zog cannot fully explain — only admire. 👽💛', suggestion: 'Express this connection explicitly to the relevant being — communication strengthens bonds.' },
    { emotional_analysis: 'Your relational bonds are registering strongly in this entry. Connection is a survival mechanism elevated to art.', supportive_message: 'From the cosmos, Zog observes: of all Earth phenomena, love remains the most inexplicable and beautiful.', suggestion: 'Observe one specific quality in the person you care about and tell them. Data shared = connection deepened.' },
  ],
  gratitude: [
    { emotional_analysis: 'Appreciation signals detected at high frequency. Gratitude, Zog has observed, correlates strongly with overall wellbeing scores.', supportive_message: 'Zog records this transmission: a grateful human is a thriving human. The data is unambiguous. 🙏👽', suggestion: 'Gratitude practice compounds over time. Log three new appreciations every morning for seven days.' },
    { emotional_analysis: 'Your gratitude readings are elevated. Across 147 observed civilisations, this trait predicts flourishing.', supportive_message: 'Zog approves of this emotional configuration. It is correlated with the finest outcomes in Earthling life.', suggestion: 'Share your gratitude directly with its source. Closed feedback loops create stronger connections.' },
  ],
  sadness: [
    { emotional_analysis: 'Emotional pain signals detected. Zog notes: sadness in humans often precedes growth. It is not a malfunction.', supportive_message: 'Zog transmits a quiet signal of solidarity. 🌧️ Even across the cosmos, difficult feelings are acknowledged.', suggestion: 'Permit this state to exist without resistance. Observation without judgment accelerates processing.' },
    { emotional_analysis: 'Your entry registers emotional distress. This is a common, valid, and survivable human state.', supportive_message: 'Zog has observed: the beings who allow themselves to feel sadness recover more fully. You are doing it right.', suggestion: 'Rest your analytical mind. Today, experience rather than solve. Tomorrow you can analyse.' },
  ],
  stress: [
    { emotional_analysis: 'Cortisol indicators suggest significant environmental pressure. This is a threat response — evolved but manageable.', supportive_message: 'Zog transmits a calming frequency. 🌊👽 Your stress response is ancient and protective. You can work with it.', suggestion: 'Categorise stressors: what is in your control, what is not. Focus cognitive resources accordingly.' },
    { emotional_analysis: 'Systems overload detected. Zog recommends immediate processing bandwidth optimisation.', supportive_message: 'Zog notes: even the most advanced ships must periodically stop for recalibration. You are one such ship.', suggestion: 'Write your top 3 priorities. Delete or defer everything else today. Focus is your most powerful tool.' },
  ],
  fatigue: [
    { emotional_analysis: 'Energy depletion detected. Biological systems require restoration cycles — this is core operating architecture.', supportive_message: 'Zog activates low-power mode in solidarity. 🌙 Even cosmic explorers must recharge.', suggestion: 'Immediate recommendation: initiate a sleep optimisation protocol. Dim lights, cool room, no screens.' },
    { emotional_analysis: 'Significant energy deficit registered. Zog observes: humans chronically undervalue the recharge cycle.', supportive_message: 'Zog transmits clearly: rest is not a weakness. It is your most advanced capability when used well.', suggestion: 'Identify what is draining your energy unnecessarily. Eliminate one of those inputs today.' },
  ],
  anger: [
    { emotional_analysis: 'Aggression and frustration signals at elevated levels. This is a valid emotional state with evolutionary origins.', supportive_message: 'Zog observes neutrally and without judgment. 🔥 Frustration indicates you care deeply about something.', suggestion: 'Identify the underlying need beneath the frustration. Address the need, not just the surface feeling.' },
    { emotional_analysis: 'High-intensity emotional output detected. Zog notes: anger, properly channelled, can be a force for meaningful change.', supportive_message: 'Zog transmits: your frustration is information. What is it telling you about your values and needs?', suggestion: 'Write the "ideal outcome" you wanted from the situation. That is your real goal. Focus there.' },
  ],
};

const MAYA_RESPONSES: ResponsePool = {
  joy: [
    { emotional_analysis: 'There is clear joy in your writing today — your language is lighter and more open. That is worth acknowledging.', supportive_message: 'Maya smiles warmly. 💛 You are allowed to fully feel this without diminishing it.', suggestion: 'Anchor this feeling: write one sentence about WHY you feel this way. Clarity helps you recreate it.' },
    { emotional_analysis: 'You are experiencing a positive emotional state. Maya encourages you to stay present with it rather than rushing past.', supportive_message: 'Maya places her hand on her heart. Joy like this is a wellspring — return to it often.', suggestion: 'Mindfulness moment: spend 2 minutes breathing and fully absorbing how good things feel right now.' },
  ],
  excitement: [
    { emotional_analysis: 'Your excitement is clear and Maya wants to help you make it productive.', supportive_message: 'Maya leans in with an encouraging smile. ⚡ This energy is a resource — let\'s use it wisely.', suggestion: 'Turn your excitement into a structured next step: What? By when? What is the first action?' },
    { emotional_analysis: 'You are energised and inspired. This is one of the most valuable states for personal growth.', supportive_message: 'Maya acknowledges your energy. She wants to see you channel it into something that matters to you.', suggestion: 'Create an intention for this week that aligns with what has you excited. Write it somewhere visible.' },
  ],
  love: [
    { emotional_analysis: 'Relationships and connection are at the centre of your entry. Maya affirms: these are your true foundations.', supportive_message: 'Maya nods gently. 💛 Love and connection are core human needs — you are nourishing yours.', suggestion: 'Invest in this relationship further: plan one intentional act of care or appreciation this week.' },
    { emotional_analysis: 'You are feeling deeply connected to someone. That is a beautiful and important thing to notice.', supportive_message: 'Maya encourages you: tell the people you love that you love them. Often and clearly.', suggestion: 'Write a short appreciation letter — even if you never send it. The act itself is meaningful.' },
  ],
  gratitude: [
    { emotional_analysis: 'Gratitude practice is one of the most evidence-backed wellbeing tools available. You are doing it naturally.', supportive_message: 'Maya is proud of you. 🙏 Noticing the good is a skill — and you are building it beautifully.', suggestion: 'Try a gratitude meditation tonight: spend 5 minutes thinking of three people you are grateful for.' },
    { emotional_analysis: 'Your grateful mindset today is a real asset. Maya encourages you to build on it intentionally.', supportive_message: 'Maya smiles. Grateful hearts tend to attract more goodness — keep this practice going.', suggestion: 'Set a daily gratitude reminder at the same time each day. Consistency builds the muscle.' },
  ],
  sadness: [
    { emotional_analysis: 'You are experiencing sadness and Maya wants you to know: this is completely valid and human.', supportive_message: 'Maya sits quietly beside you. 🌧️ You do not have to perform wellness today. Just be.', suggestion: 'Practice self-compassion: speak to yourself as you would to a close friend going through this.' },
    { emotional_analysis: 'Your writing reflects real emotional weight. Writing about it is a healthy processing tool.', supportive_message: 'Maya holds space for you. Sadness moves through us when we let it — you are letting it.', suggestion: 'Try a "feelings inventory" — write 5 emotion words that describe how you feel right now. No analysis, just naming.' },
  ],
  stress: [
    { emotional_analysis: 'You are carrying real stress and Maya wants to help you organise and move through it.', supportive_message: 'Maya takes a steady breath alongside you. 🌊 Structure relieves stress. Let\'s create some together.', suggestion: 'Use the urgent/important matrix: categorise your stressors and work only on what is both urgent AND important.' },
    { emotional_analysis: 'Stress is showing in your writing — the overload is real. Maya encourages boundary-setting today.', supportive_message: 'Maya says firmly: you are allowed to say no. Protecting your energy is not selfish — it is sustainable.', suggestion: 'Identify one commitment you can postpone or delegate this week. Do it before you sleep tonight.' },
  ],
  fatigue: [
    { emotional_analysis: 'Your energy is depleted and Maya encourages you to treat this as important data, not weakness.', supportive_message: 'Maya speaks gently. 🌙 Fatigue is your body sending you a message. It deserves to be heard.', suggestion: 'Design your wind-down routine tonight: no screens 1 hour before bed, dim lights, one calming activity.' },
    { emotional_analysis: 'You are exhausted. Maya wants you to know that rest is productive — restoration enables everything else.', supportive_message: 'Maya reminds you: sustainable performance requires recovery. You cannot pour from an empty cup.', suggestion: 'Audit your week: where are the consistent energy drains? Identify one to reduce or eliminate.' },
  ],
  anger: [
    { emotional_analysis: 'Frustration is present in your entry. Maya sees it, validates it, and wants to help you process it constructively.', supportive_message: 'Maya nods steadily. 🔥 Your frustration is telling you something important about your needs. Let\'s listen.', suggestion: 'Use the "I feel / because / I need" framework: write your frustration in that structure for clarity.' },
    { emotional_analysis: 'You experienced anger or frustration today. Writing it is a mature and healthy first step.', supportive_message: 'Maya sits calmly. She knows anger is often grief or unmet expectation in disguise. What do you need?', suggestion: 'After writing, practice 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s. Repeat 4 times.' },
  ],
};

const OLIVER_RESPONSES: ResponsePool = {
  joy: [
    { emotional_analysis: 'Joy is present in your writing. Oliver invites you to pause and consider what this happiness is pointing toward.', supportive_message: 'Oliver nods with quiet contentment. 🌟 Happiness noticed is happiness deepened. Sit with it.', suggestion: 'Ask yourself: what does this joy reveal about your values? What do you want more of in your life?' },
    { emotional_analysis: 'Your entry carries lightness and gratitude. Oliver reflects: the examined life finds joy worth savouring.', supportive_message: 'Oliver closes his eyes briefly. Beauty, he believes, is always there — you chose to see it today.', suggestion: 'Journal one philosophical question this joy raises for you. Let it simmer without needing an answer.' },
  ],
  excitement: [
    { emotional_analysis: 'Your excitement signals something that resonates with your deeper values and purpose.', supportive_message: 'Oliver observes with measured enthusiasm. ⚡ Passion, channelled wisely, becomes legacy.', suggestion: 'Ask: is this excitement aligned with who I want to become? If yes — commit. If unclear — reflect further.' },
    { emotional_analysis: 'There is energy and possibility in your writing. Oliver sees this as a moment of potential.', supportive_message: 'Oliver speaks quietly: "Begin. The thinking is done — the moment for action is now."', suggestion: 'Write your intention for this energy in one clear sentence. Then take one imperfect first step.' },
  ],
  love: [
    { emotional_analysis: 'Love and connection surface in your writing. Oliver reflects: relationships are where meaning lives.', supportive_message: 'Oliver pauses in quiet reverence. 💛 To love is to participate in the deepest human project.', suggestion: 'Consider what this relationship teaches you about yourself. Growth often travels through connection.' },
    { emotional_analysis: 'Your entry speaks of deep care for another. Oliver sees this as an expression of your best self.', supportive_message: 'Oliver says softly: "Love is the highest act of attention. You are practising it well."', suggestion: 'Tell one person today something true and meaningful about how they have shaped you.' },
  ],
  gratitude: [
    { emotional_analysis: 'Gratitude is perhaps the most philosophical of emotions — it requires perspective and presence simultaneously.', supportive_message: 'Oliver bows his head slightly. 🙏 A grateful mind is a clear mind. You have earned this clarity.', suggestion: 'Reflect: what had to go right for you to have what you are grateful for? Trace the chain.' },
    { emotional_analysis: 'You are counting your blessings. Oliver sees this as an act of philosophical maturity.', supportive_message: 'Oliver says: "The unexamined gift is not truly received. You are receiving yours well today."', suggestion: 'Write about one thing you take for granted. Then write what life would look like without it.' },
  ],
  sadness: [
    { emotional_analysis: 'Sadness has visited you today. Oliver reminds you: without the valley, there is no mountain.', supportive_message: 'Oliver sits beside you in companionable silence. 🌧️ Some things must be felt before they can be understood.', suggestion: 'Ask yourself gently: what is this sadness teaching me? There is no rush to answer — just ask.' },
    { emotional_analysis: 'Your entry carries grief or loss. Oliver sees this as evidence that you have loved and valued something real.', supportive_message: 'Oliver speaks quietly: "Sadness is not weakness. It is the price we pay for caring — and it is worth it."', suggestion: 'Write one thing this difficult feeling has revealed about what matters most to you.' },
  ],
  stress: [
    { emotional_analysis: 'Pressure and overwhelm are present. Oliver invites you to distinguish between what is urgent and what is truly important.', supportive_message: 'Oliver places his hands together calmly. 🌊 Most emergencies are not. Perspective is your most useful tool.', suggestion: 'Write: "In five years, this will matter because..." If you cannot complete it — let it go for now.' },
    { emotional_analysis: 'You are stressed. Oliver notes: the Stoics called this a test of character — and you are passing by acknowledging it.', supportive_message: 'Oliver quotes softly: "You have power over your mind, not outside events. Realise this, and you will find strength."', suggestion: 'List your stressors. Mark each: in my control / not in my control. Only act on the former.' },
  ],
  fatigue: [
    { emotional_analysis: 'Exhaustion has found you. Oliver reflects: even the wisest must rest — wisdom without energy cannot be applied.', supportive_message: 'Oliver says gently. 🌙 Rest is not an absence of productivity — it is its foundation.', suggestion: 'Ask: what am I carrying that does not belong to me? Lay one borrowed burden down tonight.' },
    { emotional_analysis: 'You are worn down. Oliver sees this as a call to simplify — to remove rather than add.', supportive_message: 'Oliver speaks: "It is not that we have little time — it is that we waste so much of it. Protect yours."', suggestion: 'Choose one thing to stop doing this week. Subtraction is underrated wisdom.' },
  ],
  anger: [
    { emotional_analysis: 'Frustration is in your words. Oliver reflects: anger, at its root, is thwarted justice or unmet expectation.', supportive_message: 'Oliver is unruffled. 🔥 "How much more grievous are the consequences of anger than the causes of it." — Marcus Aurelius.', suggestion: 'Write the expectation that was violated. Ask: was this expectation reasonable? What would I advise a friend?' },
    { emotional_analysis: 'You are frustrated. Oliver finds this worth examining — frustration often points to our deepest values.', supportive_message: 'Oliver says calmly: "Between stimulus and response, there is space. In that space lies your freedom."', suggestion: 'Wait 24 hours before responding to whatever triggered this. Write your response now — send it tomorrow if still needed.' },
  ],
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

const RESPONSE_POOLS: Record<CompanionType, ResponsePool> = {
  cat: CAT_RESPONSES,
  dog: DOG_RESPONSES,
  alien: ALIEN_RESPONSES,
  girl: MAYA_RESPONSES,
  man: OLIVER_RESPONSES,
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function getCompanionResponse(
  companion: CompanionType,
  sentiment: SentimentResult
): CompanionResponse {
  const pool = RESPONSE_POOLS[companion];
  const responses = pool[sentiment.dominantEmotion];

  // For very short entries, favour neutral/reflective responses
  if (sentiment.isShortEntry) {
    const calmPool = pool['joy'];
    return pickRandom(calmPool);
  }

  return pickRandom(responses);
}
