#!/usr/bin/env tsx

/**
 * Generate sample month data that progresses through all Spiral Dynamics stages
 * 
 * Usage:
 *   pnpm tsx scripts/generate-sample-month-data.ts
 * 
 * This will create scripts/sample-month-data.json
 */

import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

type ColorStage = {
  beige: number;
  purple: number;
  red: number;
  blue: number;
  orange: number;
  green: number;
  yellow: number;
  turquoise: number;
  coral: number;
  teal: number;
};

type PixelData = {
  timestamp: string;
  pixel: {
    statement: string;
    context: string;
    explanation: string;
    color_stage: ColorStage;
    confidence_score: number;
    too_nuanced: boolean;
    absolute_thinking: boolean;
  };
};

const STAGES = [
  "beige",
  "purple",
  "red",
  "blue",
  "orange",
  "green",
  "yellow",
  "turquoise",
  "coral",
  "teal",
] as const;

// Theme-based statements
const THEMES = {
  work: [
    {
      statement: "I hate how everyone expects you to respond to work emails at 11pm",
      context: "User expressing frustration with always-on work culture. They value boundaries but feel pressure to be constantly available. This expectation is costing them evening rest and personal time.",
    },
    {
      statement: "My manager keeps changing the requirements mid-sprint and it's driving me crazy",
      context: "User frustrated with lack of planning and constant scope changes. They feel their time and effort is being wasted by poor project management.",
    },
    {
      statement: "I'm tired of being the only one who writes tests. No one else on the team seems to care about code quality",
      context: "User feeling isolated in their commitment to best practices. They value quality and maintainability but feel unsupported by their team.",
    },
    {
      statement: "I spent the whole day in meetings and got zero coding done. This is so unproductive",
      context: "User frustrated with meeting culture that prevents deep work. They want to focus on building but feel pulled in too many directions.",
    },
    {
      statement: "The codebase is a mess and I'm the only one who seems to want to refactor it",
      context: "User concerned about technical debt and long-term maintainability. They see problems others ignore and feel responsible for fixing them.",
    },
    {
      statement: "I keep getting assigned the boring maintenance tasks while others get the interesting new features",
      context: "User feeling undervalued and stuck with unglamorous work. They want growth opportunities but feel overlooked.",
    },
  ],
  romantic: [
    {
      statement: "I care too much about what my partner thinks of me. I change my behavior based on their reactions",
      context: "User reflecting on people-pleasing patterns in their relationship. They're aware this is limiting their authenticity but haven't broken the pattern yet.",
    },
    {
      statement: "We keep having the same argument over and over. I don't know how to break this cycle",
      context: "User stuck in repetitive conflict patterns. They recognize the pattern but feel powerless to change the dynamic.",
    },
    {
      statement: "I'm afraid to tell my partner what I really need because I don't want to seem needy",
      context: "User suppressing their needs to avoid conflict or rejection. They value the relationship but at the cost of their own authenticity.",
    },
    {
      statement: "My partner never helps with household chores unless I ask, and then I feel like I'm nagging",
      context: "User frustrated with unequal domestic labor. They want partnership but feel like they're managing their partner instead of collaborating.",
    },
    {
      statement: "I feel like I'm always the one initiating conversations about our relationship. Why can't they bring things up?",
      context: "User feeling like they carry the emotional labor in the relationship. They want mutual engagement but feel like they're doing all the work.",
    },
    {
      statement: "We used to have so much fun together, but now everything feels transactional",
      context: "User noticing the relationship has lost its spark. They miss the connection and playfulness but don't know how to get it back.",
    },
  ],
  community: [
    {
      statement: "I feel like I'm always the one organizing things for my friend group. Why doesn't anyone else step up?",
      context: "User frustrated with being the default organizer. They want to participate in community but feel burdened by always being responsible.",
    },
    {
      statement: "My friends all seem to have their lives together and I feel like I'm falling behind",
      context: "User comparing themselves to friends and feeling inadequate. They're struggling with their own path while seeing others succeed.",
    },
    {
      statement: "I said yes to too many social commitments this week and now I'm exhausted",
      context: "User overcommitted themselves socially. They want to maintain relationships but struggle with boundaries and saying no.",
    },
    {
      statement: "I moved to a new city and I'm having such a hard time making friends. Everyone already has their groups",
      context: "User feeling isolated in a new place. They want connection and community but feel excluded from existing social circles.",
    },
    {
      statement: "I feel like I'm always the one reaching out to maintain friendships. If I stopped, would anyone notice?",
      context: "User questioning the reciprocity in their friendships. They want mutual effort but feel like they're the only one investing.",
    },
    {
      statement: "My friend group has been drifting apart and I don't know how to bring us back together",
      context: "User noticing their community is fragmenting. They value these relationships but feel powerless to maintain the connection.",
    },
  ],
} as const;

function getRandomElement<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function createColorStage(
  stageName: string,
  value: number,
): ColorStage {
  const stage: ColorStage = {
    beige: 0.0,
    purple: 0.0,
    red: 0.0,
    blue: 0.0,
    orange: 0.0,
    green: 0.0,
    yellow: 0.0,
    turquoise: 0.0,
    coral: 0.0,
    teal: 0.0,
  };
  stage[stageName as keyof ColorStage] = value;
  return stage;
}

function createTransitionStage(
  fromStage: string,
  toStage: string,
  fromValue: number,
  toValue: number,
): ColorStage {
  const stage: ColorStage = {
    beige: 0.0,
    purple: 0.0,
    red: 0.0,
    blue: 0.0,
    orange: 0.0,
    green: 0.0,
    yellow: 0.0,
    turquoise: 0.0,
    coral: 0.0,
    teal: 0.0,
  };
  stage[fromStage as keyof ColorStage] = fromValue;
  stage[toStage as keyof ColorStage] = toValue;
  return stage;
}

function generateSampleData(): PixelData[] {
  const data: PixelData[] = [];
  const startDate = new Date("2024-01-01T00:00:00.000Z");
  const entriesPerWeek = 7; // One entry per day
  // Need 2 weeks per stage (1 full + 1 transition) × 10 stages = 20 weeks
  // But user wants ~3 months, so let's do 1.5 weeks per stage = 15 weeks
  // Actually, let's stick with 2 weeks per stage pattern but extend to cover all stages
  const weeksPerStage = 2; // 1 full week + 1 transition week
  const totalWeeks = STAGES.length * weeksPerStage; // 20 weeks to cover all stages

  let currentDate = new Date(startDate);

  for (let week = 0; week < totalWeeks; week++) {
    const stageIndex = Math.floor(week / weeksPerStage);
    const weekInStagePair = week % weeksPerStage;
    const isTransitionWeek = weekInStagePair === 1;

    let colorStage: ColorStage;
    let stageName: string;

    if (isTransitionWeek && stageIndex < STAGES.length - 1) {
      // Transition week: 30% current, 70% next (new stage is dominant)
      const currentStage = STAGES[stageIndex];
      const nextStage = STAGES[stageIndex + 1];
      colorStage = createTransitionStage(currentStage, nextStage, 0.3, 0.7);
      stageName = `${currentStage} → ${nextStage}`;
    } else {
      // Full stage week: 100% current stage
      const currentStage = STAGES[stageIndex];
      colorStage = createColorStage(currentStage, 1.0);
      stageName = currentStage;
    }

    // Generate entries for this week
    for (let day = 0; day < entriesPerWeek; day++) {
      const timestamp = new Date(currentDate);
      timestamp.setDate(timestamp.getDate() + day);

      // Pick a random theme
      const themeKeys = Object.keys(THEMES) as Array<keyof typeof THEMES>;
      const randomTheme = getRandomElement(themeKeys);
      const themeStatements = THEMES[randomTheme];
      
      // Pick a random statement from that theme
      const selectedStatement = getRandomElement([...themeStatements]);
      
      // Add UUID for embedding uniqueness (ensures no collisions)
      const uniqueId = randomUUID();
      const statement = `${selectedStatement.statement} ${uniqueId}`;
      const context = `${selectedStatement.context} ${uniqueId}`;

      data.push({
        timestamp: timestamp.toISOString(),
        pixel: {
          statement,
          context,
          explanation: `Reflection on ${randomTheme} theme showing ${stageName} stage characteristics.`,
          color_stage: { ...colorStage },
          confidence_score: 0.7,
          too_nuanced: false,
          absolute_thinking: stageIndex < 3, // Early stages have more absolute thinking
        },
      });
    }

    // Move to next week
    currentDate.setDate(currentDate.getDate() + entriesPerWeek);
  }

  return data;
}

async function main() {
  console.log("🎨 Generating sample month data...");

  const data = generateSampleData();
  const outputPath = join(process.cwd(), "scripts", "sample-month-data.json");

  await writeFile(outputPath, JSON.stringify(data, null, 2), "utf-8");

  console.log(`✅ Generated ${data.length} entries`);
  console.log(`📁 Saved to: ${outputPath}`);
  console.log(`📅 Date range: ${data[0]?.timestamp} to ${data[data.length - 1]?.timestamp}`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});

