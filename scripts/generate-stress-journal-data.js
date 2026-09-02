#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CURRENT_DIARY_SCHEMA_VERSION = 5;
const JOURNAL_STORAGE_VERSION = 1;
const DEFAULT_OUTPUT = path.join('generated', 'stress-data', 'journal-entry-stress-data.json');

const MOODS = ['excited', 'happy', 'grateful', 'calm', 'neutral', 'tired', 'anxious', 'sad', 'angry'];
const WEATHER = ['sunny', 'calm', 'neutral', 'cloudy', 'stormy'];
const COMPANIONS = ['cat', 'dog', 'alien', 'girl', 'man'];
const WRITING_MODES = ['free-write', 'one-line', 'five-minute', 'gratitude', 'travel', 'dream', 'evening-review'];
const COVER_IMAGES = [
  { uri: 'builtin://journal-background/winter', width: 1672, height: 940 },
  { uri: 'builtin://journal-background/spring', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/summer', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/fall', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/moonlit-lake', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/cozy-reading-nook', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/school', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/office', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/rainy-window', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/mountain-sunrise', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/greenhouse', width: 1672, height: 941 },
  { uri: 'builtin://journal-background/cafe-morning', width: 1672, height: 941 },
];
const JOURNAL_TITLES = [
  'Everyday Notes',
  'Work and Focus',
  'Quiet Mornings',
  'Family Moments',
  'Travel Log',
  'Health Check-ins',
  'Learning Journal',
  'Home Projects',
  'Creative Sparks',
  'Weekend Review',
  'Gratitude',
  'Dream Notes',
];
const TAGS = ['daily', 'work', 'family', 'travel', 'health', 'learning', 'home', 'creative', 'weekend', 'reflection'];
const PROMPTS = [
  'What stood out most today?',
  'What felt lighter than expected?',
  'What did I want to remember?',
  'Where did my attention keep returning?',
  'What helped me reset?',
  'What did I learn from the day?',
];

function parseArgs(argv) {
  const options = {
    out: DEFAULT_OUTPUT,
    seed: 'mongoose-stress-data',
    today: new Date(),
    yearsBack: 5,
    monthsBackEnd: 3,
    daysPerMonth: 4,
    journalCount: 12,
    journalsPerDayMin: 1,
    journalsPerDayMax: 3,
    entriesPerJournalMin: 2,
    entriesPerJournalMax: 4,
    pretty: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (flag === '--help') {
      printHelp();
      process.exit(0);
    }
    if (flag === '--out' && value) options.out = value;
    else if (flag === '--seed' && value) options.seed = value;
    else if (flag === '--today' && value) options.today = parseDate(value, '--today');
    else if (flag === '--years-back' && value) options.yearsBack = parsePositiveInteger(value, flag);
    else if (flag === '--months-back-end' && value) options.monthsBackEnd = parsePositiveInteger(value, flag);
    else if (flag === '--days-per-month' && value) options.daysPerMonth = parsePositiveInteger(value, flag);
    else if (flag === '--journals' && value) options.journalCount = parsePositiveInteger(value, flag);
    else if (flag === '--journals-per-day-min' && value) options.journalsPerDayMin = parsePositiveInteger(value, flag);
    else if (flag === '--journals-per-day-max' && value) options.journalsPerDayMax = parsePositiveInteger(value, flag);
    else if (flag === '--entries-per-journal-min' && value) options.entriesPerJournalMin = parsePositiveInteger(value, flag);
    else if (flag === '--entries-per-journal-max' && value) options.entriesPerJournalMax = parsePositiveInteger(value, flag);
    else if (flag === '--compact') options.pretty = false;
    else if (flag.startsWith('--')) throw new Error(`Unknown option: ${flag}`);
    if (flag.startsWith('--') && flag !== '--compact') index += 1;
  }

  assertRange(options.journalsPerDayMin, options.journalsPerDayMax, 'journals per day');
  assertRange(options.entriesPerJournalMin, options.entriesPerJournalMax, 'entries per journal');
  if (options.monthsBackEnd >= options.yearsBack * 12) {
    throw new Error('--months-back-end must be lower than --years-back converted to months.');
  }
  return options;
}

function printHelp() {
  console.log(`Generate sparse synthetic journals and diary entries for stress testing.

Usage:
  npm run generate:stress-data -- [options]

Options:
  --out <path>                    Output JSON path. Default: ${DEFAULT_OUTPUT}
  --seed <value>                  Deterministic random seed.
  --today <YYYY-MM-DD>            Date anchor for repeatable ranges.
  --years-back <number>           Range start, in years before today. Default: 5
  --months-back-end <number>      Range end, in months before today. Default: 3
  --days-per-month <number>       Random days selected per month. Default: 4
  --journals <number>             Journals to generate. Default: 12
  --journals-per-day-min <number> Min journals selected for each active day. Default: 1
  --journals-per-day-max <number> Max journals selected for each active day. Default: 3
  --entries-per-journal-min <n>   Min entries per selected journal/day. Default: 2
  --entries-per-journal-max <n>   Max entries per selected journal/day. Default: 4
  --compact                       Write compact JSON.
`);
}

function createStressData(options) {
  const random = createRandom(options.seed);
  const startDate = addYears(options.today, -options.yearsBack);
  const endDate = addMonths(options.today, -options.monthsBackEnd);
  const months = getMonthsInRange(startDate, endDate);
  const generatedAt = new Date().toISOString();
  const journals = createJournals(options, generatedAt);
  const entries = [];
  const selectedDates = [];

  months.forEach((month) => {
    const dates = selectMonthDates(month.year, month.month, startDate, endDate, options.daysPerMonth, random);
    dates.forEach((date) => {
      selectedDates.push(formatDate(date));
      const journalSelection = sample(journals, randomInt(random, options.journalsPerDayMin, options.journalsPerDayMax), random);
      journalSelection.forEach((journal) => {
        const entryCount = randomInt(random, options.entriesPerJournalMin, options.entriesPerJournalMax);
        for (let entryIndex = 0; entryIndex < entryCount; entryIndex += 1) {
          entries.push(createEntry({ date, entryIndex, sequence: entries.length, journal, random }));
        }
      });
    });
  });

  const diaryEntries = {
    version: CURRENT_DIARY_SCHEMA_VERSION,
    entries: entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  };
  const journalStorage = {
    version: JOURNAL_STORAGE_VERSION,
    journals,
  };

  return {
    generatedAt,
    seed: options.seed,
    range: {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      months: months.length,
      selectedDaysPerMonth: options.daysPerMonth,
    },
    counts: {
      journals: journals.length,
      entries: entries.length,
      activeDays: selectedDates.length,
    },
    selectedDates,
    secureStorageKeys: {
      diaryEntries: 'meadow.diary-entries',
      journals: 'meadow.journals',
    },
    storage: {
      diaryEntries,
      journals: journalStorage,
    },
    backupPayload: {
      version: CURRENT_DIARY_SCHEMA_VERSION,
      exportedAt: generatedAt,
      entries: diaryEntries.entries,
      journals,
      journalExtras: { version: 1, chapters: [], rituals: [], collections: [], milestones: [], reflectionCards: [], connections: [] },
    },
  };
}

function createJournals(options, generatedAt) {
  return Array.from({ length: options.journalCount }, (_, index) => {
    const cover = COVER_IMAGES[index % COVER_IMAGES.length];
    return {
      id: uuidFromParts('11111111', index),
      title: JOURNAL_TITLES[index % JOURNAL_TITLES.length],
      description: `Synthetic stress-test journal ${index + 1}.`,
      color: journalColor(index),
      coverImageUri: cover.uri,
      coverImageWidth: cover.width,
      coverImageHeight: cover.height,
      createdAt: generatedAt,
      updatedAt: generatedAt,
    };
  });
}

function createEntry({ date, entryIndex, sequence, journal, random }) {
  const dateKey = formatDate(date);
  const createdAt = timestampForDate(date, entryIndex, random);
  const moods = createMoods(random);
  const cover = COVER_IMAGES[randomInt(random, 0, COVER_IMAGES.length - 1)];
  const tagCount = randomInt(random, 1, 3);
  return {
    id: uuidFromParts(dateKey.replaceAll('-', ''), sequence + 1),
    title: entryTitle(date, journal.title, entryIndex),
    content: entryContent(dateKey, journal.title, random),
    date: dateKey,
    paperBackgroundId: 'vintage-parchment',
    bodyFontFamily: 'system',
    stickers: [],
    companion: COMPANIONS[randomInt(random, 0, COMPANIONS.length - 1)],
    isFavorite: random() > 0.82,
    tags: sample(TAGS, tagCount, random),
    createdAt,
    updatedAt: createdAt,
    manualMoodWeather: WEATHER[randomInt(random, 0, WEATHER.length - 1)],
    manualMood: moods[0],
    manualMoods: moods,
    writingMode: WRITING_MODES[randomInt(random, 0, WRITING_MODES.length - 1)],
    sensory: {
      locationLabel: random() > 0.45 ? randomLocation(random) : '',
      sounds: random() > 0.55 ? randomSound(random) : '',
      smells: random() > 0.72 ? randomSmell(random) : '',
      energyLevel: randomInt(random, 1, 10),
      bodyState: random() > 0.65 ? randomBodyState(random) : '',
    },
    isLockbox: random() > 0.9,
    collectionIds: [],
    journalIds: [journal.id],
    coverPhoto: {
      id: uuidFromParts('22222222', Math.floor(random() * 999999)),
      uri: cover.uri,
      width: cover.width,
      height: cover.height,
      createdAt,
    },
    photos: [],
    reflections: random() > 0.76 ? [createReflection(createdAt, random)] : [],
  };
}

function createMoods(random) {
  if (random() > 0.82) return ['neutral'];
  return sample(MOODS.filter((mood) => mood !== 'neutral'), randomInt(random, 1, 3), random);
}

function createReflection(createdAt, random) {
  const updatedAt = new Date(new Date(createdAt).getTime() + randomInt(random, 30, 240) * 60000).toISOString();
  return {
    id: uuidFromParts('33333333', Math.floor(random() * 999999)),
    text: 'Synthetic follow-up reflection for stress testing threaded entry layout.',
    createdAt: updatedAt,
    updatedAt,
  };
}

function entryTitle(date, journalTitle, entryIndex) {
  const monthName = date.toLocaleDateString('en-US', { month: 'short' });
  return `${journalTitle} ${monthName} ${date.getDate()} #${entryIndex + 1}`;
}

function entryContent(dateKey, journalTitle, random) {
  const prompt = PROMPTS[randomInt(random, 0, PROMPTS.length - 1)];
  return `<p><strong>${prompt}</strong></p><p>${journalTitle} synthetic note for ${dateKey}. This entry is generated to exercise list rendering, date grouping, filters, reflections, journals, lockbox flags, and cover-photo layouts with realistic sparse data.</p>`;
}

function timestampForDate(date, entryIndex, random) {
  const next = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  next.setUTCHours(randomInt(random, 6, 22), randomInt(random, 0, 59), entryIndex, 0);
  return next.toISOString();
}

function selectMonthDates(year, month, startDate, endDate, count, random) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const candidates = [];
  for (let day = 1; day <= daysInMonth; day += 1) {
    const candidate = new Date(year, month, day, 12);
    if (candidate >= startOfDay(startDate) && candidate <= startOfDay(endDate)) candidates.push(candidate);
  }
  return sample(candidates, Math.min(count, candidates.length), random).sort((a, b) => a.getTime() - b.getTime());
}

function getMonthsInRange(startDate, endDate) {
  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1, 12);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1, 12);
  while (cursor <= end) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

function sample(items, count, random) {
  const available = [...items];
  const selected = [];
  while (selected.length < count && available.length > 0) {
    selected.push(available.splice(randomInt(random, 0, available.length - 1), 1)[0]);
  }
  return selected;
}

function createRandom(seed) {
  let state = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    return ((state ^= state >>> 16) >>> 0) / 4294967296;
  };
}

function randomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function uuidFromParts(prefix, value) {
  const suffix = String(value).padStart(12, '0').slice(-12);
  return `${prefix.slice(0, 8).padEnd(8, '0')}-0000-4000-8000-${suffix}`;
}

function addYears(date, years) {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate(), 12);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate(), 12);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDate(value, flag) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${flag} must use YYYY-MM-DD.`);
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

function parsePositiveInteger(value, flag) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${flag} must be a positive integer.`);
  return parsed;
}

function assertRange(min, max, label) {
  if (min > max) throw new Error(`Minimum ${label} cannot be greater than maximum ${label}.`);
}

function journalColor(index) {
  return ['#4ECDC4', '#2F93E8', '#D81B60', '#0F766E', '#7C3AED', '#EA580C'][index % 6];
}

function randomLocation(random) {
  return ['Home desk', 'Kitchen table', 'Office', 'Cafe corner', 'Train ride', 'Bedroom window'][randomInt(random, 0, 5)];
}

function randomSound(random) {
  return ['soft rain', 'keyboard taps', 'distant traffic', 'quiet music', 'morning birds'][randomInt(random, 0, 4)];
}

function randomSmell(random) {
  return ['coffee', 'fresh laundry', 'rain on pavement', 'tea', 'paper'][randomInt(random, 0, 4)];
}

function randomBodyState(random) {
  return ['settled', 'restless', 'tired shoulders', 'clear-headed', 'slow and steady'][randomInt(random, 0, 4)];
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const output = createStressData(options);
  const outputPath = path.resolve(process.cwd(), options.out);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output, null, options.pretty ? 2 : 0) + '\n');
  console.log(`Generated ${output.counts.journals} journals and ${output.counts.entries} entries across ${output.counts.activeDays} active days.`);
  console.log(`Date range: ${output.range.startDate} to ${output.range.endDate}`);
  console.log(`Output: ${outputPath}`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

module.exports = { createStressData, parseArgs };
