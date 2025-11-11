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

// 140 unique statements - one for each entry
// Statements progress from survival/negative (beige/red) to enlightened (teal)
const STATEMENTS = [
  // Beige stage (survival, basic needs)
  { statement: "I don't know how I'm going to pay rent this month", context: "User focused on basic survival needs. They're in a state of immediate crisis and can't think beyond the present moment.", theme: "work" as const },
  { statement: "I'm just trying to get through each day without falling apart", context: "User in survival mode, focused on basic functioning. They're overwhelmed and can't see beyond immediate needs.", theme: "romantic" as const },
  { statement: "I have no one to turn to when things get really bad", context: "User feeling completely isolated and without support systems. They're in a state of basic survival.", theme: "community" as const },
  { statement: "Every day feels like a struggle just to keep going", context: "User operating at the most basic level of existence. They're focused purely on survival.", theme: "work" as const },
  { statement: "I can't think about the future when I'm just trying to survive today", context: "User in pure survival mode, unable to plan or think beyond immediate needs.", theme: "romantic" as const },
  { statement: "I feel completely alone and disconnected from everyone", context: "User at the most basic level of social connection - feeling isolated and without community.", theme: "community" as const },
  { statement: "I'm just trying to make it through without breaking down", context: "User focused on basic survival and maintaining minimal functioning.", theme: "work" as const },
  
  // Purple stage (tribal, belonging)
  { statement: "I moved to a new city and I'm having such a hard time making friends. Everyone already has their groups", context: "User seeking belonging and connection. They want to be part of a group but feel excluded.", theme: "community" as const },
  { statement: "I care too much about what my partner thinks of me. I change my behavior based on their reactions", context: "User seeking approval and belonging in their relationship. They're adapting to fit in.", theme: "romantic" as const },
  { statement: "I keep getting assigned the boring maintenance tasks while others get the interesting new features", context: "User feeling like they don't belong in the important work. They want to be part of the team's core activities.", theme: "work" as const },
  { statement: "My friend group has been drifting apart and I don't know how to bring us back together", context: "User noticing their tribe is fragmenting. They value these relationships but feel powerless to maintain the connection.", theme: "community" as const },
  { statement: "I'm afraid to tell my partner what I really need because I don't want to seem needy", context: "User suppressing their needs to maintain belonging in the relationship. They value the connection but at the cost of authenticity.", theme: "romantic" as const },
  { statement: "I said yes to too many social commitments this week and now I'm exhausted", context: "User overcommitted themselves to maintain social connections. They want to belong but struggle with boundaries.", theme: "community" as const },
  { statement: "I feel like I'm always the one organizing things for my friend group. Why doesn't anyone else step up?", context: "User taking on responsibility to maintain the group. They want to participate in community but feel burdened.", theme: "community" as const },
  
  // Red stage (power, impulsivity, survival of the fittest)
  { statement: "I hate how everyone expects you to respond to work emails at 11pm", context: "User expressing frustration with power dynamics. They value boundaries but feel pressure from authority.", theme: "work" as const },
  { statement: "We keep having the same argument over and over. I don't know how to break this cycle", context: "User stuck in power struggles in their relationship. They recognize the pattern but feel powerless to change it.", theme: "romantic" as const },
  { statement: "My manager keeps changing the requirements mid-sprint and it's driving me crazy", context: "User frustrated with lack of control and constant changes. They feel their time and effort is being wasted by poor management.", theme: "work" as const },
  { statement: "I feel like I'm always the one initiating conversations about our relationship. Why can't they bring things up?", context: "User feeling like they carry the emotional labor. They want mutual engagement but feel like they're doing all the work.", theme: "romantic" as const },
  { statement: "The codebase is a mess and I'm the only one who seems to want to refactor it", context: "User concerned about technical debt but feeling powerless to fix it alone. They see problems others ignore.", theme: "work" as const },
  { statement: "My partner never helps with household chores unless I ask, and then I feel like I'm nagging", context: "User frustrated with unequal domestic labor. They want partnership but feel like they're managing their partner.", theme: "romantic" as const },
  { statement: "I feel like I'm always the one reaching out to maintain friendships. If I stopped, would anyone notice?", context: "User questioning the reciprocity in their friendships. They want mutual effort but feel like they're the only one investing.", theme: "community" as const },
  
  // Blue stage (order, structure, rules)
  { statement: "I'm tired of being the only one who writes tests. No one else on the team seems to care about code quality", context: "User committed to best practices and quality standards. They value structure and process but feel unsupported.", theme: "work" as const },
  { statement: "My friends all seem to have their lives together and I feel like I'm falling behind", context: "User comparing themselves to others and feeling inadequate. They're struggling with their own path while seeing others succeed.", theme: "community" as const },
  { statement: "I spent the whole day in meetings and got zero coding done. This is so unproductive", context: "User frustrated with meeting culture that prevents deep work. They want structure but feel pulled in too many directions.", theme: "work" as const },
  { statement: "We used to have so much fun together, but now everything feels transactional", context: "User noticing the relationship has lost its spark. They miss the connection but don't know how to get it back within the current structure.", theme: "romantic" as const },
  { statement: "I need to establish better boundaries at work to maintain my work-life balance", context: "User recognizing the need for structure and rules to protect their time and energy.", theme: "work" as const },
  { statement: "I'm trying to create more consistent routines in my relationship to improve communication", context: "User seeking structure and predictability in their relationship to create stability.", theme: "romantic" as const },
  { statement: "I want to be more intentional about who I spend time with and how I invest in friendships", context: "User seeking to create more structure and intentionality in their social connections.", theme: "community" as const },
  
  // Orange stage (achievement, success, competition)
  { statement: "I want to get promoted this year and I'm not sure if I'm doing enough to stand out", context: "User focused on achievement and career advancement. They're competitive and goal-oriented.", theme: "work" as const },
  { statement: "I'm comparing my relationship progress to my friends' relationships and feeling behind", context: "User measuring their relationship success against others. They're achievement-focused in their personal life.", theme: "romantic" as const },
  { statement: "I want to build a network of high-achieving friends who can help me grow professionally", context: "User seeking strategic connections for career advancement. They're focused on building valuable relationships.", theme: "community" as const },
  { statement: "I need to optimize my workflow to be more productive and get better results", context: "User focused on efficiency and results. They want to achieve more and be more successful.", theme: "work" as const },
  { statement: "I'm working on improving my communication skills to be more effective in my relationship", context: "User focused on self-improvement and achieving better relationship outcomes.", theme: "romantic" as const },
  { statement: "I want to be seen as a leader in my friend group and take on more responsibility", context: "User seeking recognition and status within their community. They want to achieve a position of influence.", theme: "community" as const },
  { statement: "I'm tracking my goals and metrics to ensure I'm making progress in all areas of my life", context: "User focused on achievement and measurable progress. They're goal-oriented and competitive.", theme: "work" as const },
  
  // Green stage (harmony, consensus, community)
  { statement: "I want to create a more collaborative and inclusive work environment where everyone feels heard", context: "User focused on harmony and consensus. They value equality and want everyone to feel included.", theme: "work" as const },
  { statement: "I'm learning to listen more deeply to my partner's needs and find ways we can both feel fulfilled", context: "User focused on mutual understanding and harmony in their relationship. They value equality and consensus.", theme: "romantic" as const },
  { statement: "I want to build a community where everyone feels supported and can be their authentic selves", context: "User focused on creating inclusive, supportive communities. They value harmony and authenticity.", theme: "community" as const },
  { statement: "I'm working on being more empathetic and understanding different perspectives at work", context: "User focused on emotional intelligence and understanding others. They value harmony over competition.", theme: "work" as const },
  { statement: "I want to create more balance and equality in how we share responsibilities in our relationship", context: "User focused on creating equitable partnerships. They value consensus and mutual support.", theme: "romantic" as const },
  { statement: "I'm trying to be more present and authentic in my friendships, focusing on deep connection over surface-level interactions", context: "User focused on authentic, meaningful connections. They value depth and emotional intimacy.", theme: "community" as const },
  { statement: "I want to contribute to a work culture that values people's wellbeing as much as productivity", context: "User focused on creating harmonious work environments that prioritize people over profit.", theme: "work" as const },
  
  // Yellow stage (systems thinking, integration, flexibility)
  { statement: "I'm seeing how different systems at work interconnect and affect each other in ways I hadn't noticed before", context: "User thinking in systems and seeing interconnections. They're recognizing patterns and relationships between different elements.", theme: "work" as const },
  { statement: "I'm understanding how my relationship patterns connect to larger life patterns and what that means for growth", context: "User seeing their relationship in a larger context. They're thinking systemically about personal growth.", theme: "romantic" as const },
  { statement: "I'm noticing how my social connections form networks that influence each other in complex ways", context: "User thinking about community as interconnected systems. They see relationships and patterns others might miss.", theme: "community" as const },
  { statement: "I'm learning to adapt my approach based on what the situation actually needs, rather than following a fixed plan", context: "User thinking flexibly and adapting to context. They're moving beyond rigid structures to responsive systems.", theme: "work" as const },
  { statement: "I'm seeing how my partner and I are both part of larger systems that influence our relationship dynamics", context: "User thinking systemically about relationship patterns. They see how external factors and internal systems interact.", theme: "romantic" as const },
  { statement: "I'm understanding how different communities I'm part of influence each other and create opportunities for integration", context: "User seeing connections between different social systems. They're thinking about how to integrate diverse communities.", theme: "community" as const },
  { statement: "I'm recognizing that work, relationships, and community are all part of an integrated system of human experience", context: "User thinking holistically about how different life domains interconnect. They see the bigger picture.", theme: "work" as const },
  
  // Turquoise stage (holistic, global consciousness)
  { statement: "I'm seeing how my work contributes to larger patterns of human development and collective evolution", context: "User thinking about their work in terms of global consciousness and human evolution. They see the bigger picture.", theme: "work" as const },
  { statement: "I'm understanding how my relationship is part of a larger journey of love and connection that transcends individual needs", context: "User seeing their relationship in terms of universal love and connection. They think beyond personal to collective experience.", theme: "romantic" as const },
  { statement: "I'm recognizing how my community connections are part of a global network of human consciousness and growth", context: "User thinking about community in terms of global interconnectedness. They see local connections as part of universal patterns.", theme: "community" as const },
  { statement: "I'm seeing how my work integrates with larger flows of energy and information that support collective wellbeing", context: "User thinking holistically about work as part of universal systems. They see beyond individual achievement to collective good.", theme: "work" as const },
  { statement: "I'm understanding how love operates as a fundamental force that connects all beings and transcends individual relationships", context: "User thinking about love as a universal principle. They see relationships as expressions of a larger force.", theme: "romantic" as const },
  { statement: "I'm recognizing how communities are expressions of collective consciousness that evolve toward greater integration", context: "User thinking about community as evolving consciousness. They see groups as part of humanity's collective development.", theme: "community" as const },
  { statement: "I'm seeing how my work serves larger purposes of human development and planetary evolution", context: "User thinking about work in terms of planetary and human evolution. They see their contribution to something greater.", theme: "work" as const },
  
  // Coral stage (transcendence, integration of all stages)
  { statement: "I'm experiencing work as a practice that integrates all aspects of being - survival, achievement, harmony, and transcendence", context: "User integrating all stages of development in their work. They see work as a complete practice of human development.", theme: "work" as const },
  { statement: "I'm understanding love as a practice that includes survival needs, achievement, harmony, and transcendent connection", context: "User integrating all stages of relationship development. They see love as a complete journey of human connection.", theme: "romantic" as const },
  { statement: "I'm seeing community as a practice that honors all stages of human development and creates space for everyone's journey", context: "User integrating all stages of community development. They see community as inclusive of all human experiences.", theme: "community" as const },
  { statement: "I'm recognizing how my work naturally flows between different modes - sometimes survival, sometimes achievement, sometimes transcendence", context: "User experiencing work as a fluid practice that includes all stages. They're comfortable moving between different modes.", theme: "work" as const },
  { statement: "I'm understanding how my relationship includes moments of survival, achievement, harmony, and transcendent connection", context: "User experiencing relationship as a complete practice. They see all stages as valid parts of the journey.", theme: "romantic" as const },
  { statement: "I'm seeing how communities need to honor all stages of development and create space for everyone's unique journey", context: "User thinking about community as inclusive of all stages. They want to create spaces that honor all human experiences.", theme: "community" as const },
  { statement: "I'm experiencing work as a complete practice that integrates survival, structure, achievement, harmony, and transcendence", context: "User fully integrating all stages in their work. They see work as a complete expression of human development.", theme: "work" as const },
  
  // Teal stage (enlightened, fully integrated)
  { statement: "I'm experiencing work as a natural expression of being, where productivity and purpose flow effortlessly from presence", context: "User experiencing work as enlightened practice. They're fully present and work flows naturally from their being.", theme: "work" as const },
  { statement: "I'm experiencing love as a natural state of being that doesn't require effort or strategy, just presence and openness", context: "User experiencing love as enlightened practice. They're fully present in love without needing to manage or control it.", theme: "romantic" as const },
  { statement: "I'm experiencing community as a natural expression of interconnectedness, where connection happens effortlessly", context: "User experiencing community as enlightened practice. They're fully present and connection flows naturally.", theme: "community" as const },
  { statement: "I'm seeing how work, relationships, and community are all expressions of the same underlying reality of connection", context: "User experiencing all life domains as expressions of one reality. They see the unity underlying all experience.", theme: "work" as const },
  { statement: "I'm understanding how love is the fundamental nature of reality, and relationships are just expressions of that truth", context: "User experiencing love as fundamental reality. They see relationships as natural expressions of universal love.", theme: "romantic" as const },
  { statement: "I'm recognizing how community is a natural expression of our interconnected nature, not something we need to create", context: "User experiencing community as natural reality. They see connection as fundamental, not something to be achieved.", theme: "community" as const },
  { statement: "I'm experiencing all of life as a seamless flow of being, where work, love, and community are all one expression", context: "User experiencing complete integration. They see all life as one seamless expression of being.", theme: "work" as const },
] as const;

// Work theme progression: peaks at yellow, dips to red, then recovers
// Maps week index to stage for work theme
function getWorkThemeStage(weekIndex: number): string {
  // Linear progression to yellow (weeks 0-13, 2 weeks per stage)
  if (weekIndex < 14) {
    const stageIndex = Math.floor(weekIndex / 2);
    const stages = ["beige", "purple", "red", "blue", "orange", "green", "yellow"];
    return stages[Math.min(stageIndex, stages.length - 1)]!;
  }
  // Dip to red (weeks 14-15)
  if (weekIndex < 16) {
    return "red";
  }
  // Recovery back up (weeks 16-19)
  const recoveryIndex = weekIndex - 16;
  const recoveryStages = ["blue", "orange", "green", "yellow"];
  return recoveryStages[Math.min(recoveryIndex, recoveryStages.length - 1)]!;
}

// Other themes follow linear progression
function getLinearStage(weekIndex: number): string {
  const totalWeeks = 20;
  const stageIndex = Math.floor((weekIndex / totalWeeks) * STAGES.length);
  return STAGES[Math.min(stageIndex, STAGES.length - 1)]!;
}

// Get statements for a specific stage and theme
// Statements are organized: 7 per stage (beige, purple, red, blue, orange, green, yellow, turquoise, coral, teal)
function getStatementsForStageAndTheme(stage: string, theme: "work" | "romantic" | "community"): typeof STATEMENTS[number][] {
  const stageIndex = STAGES.indexOf(stage as typeof STAGES[number]);
  if (stageIndex === -1) {
    return [];
  }
  
  // Each stage has 7 statements (roughly 2-3 per theme)
  const startIndex = stageIndex * 7;
  const endIndex = startIndex + 7;
  const stageStatements = STATEMENTS.slice(startIndex, endIndex);
  
  // Filter by theme
  return stageStatements.filter(s => s.theme === theme);
}

// Get a random statement for a stage and theme
function getRandomStatementForStageAndTheme(stage: string, theme: "work" | "romantic" | "community"): typeof STATEMENTS[number] {
  const matchingStatements = getStatementsForStageAndTheme(stage, theme);
  if (matchingStatements.length === 0) {
    // Fallback: return any statement with matching theme
    const fallback = STATEMENTS.find(s => s.theme === theme);
    return fallback || STATEMENTS[0]!;
  }
  return matchingStatements[Math.floor(Math.random() * matchingStatements.length)]!;
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
  const totalWeeks = 20; // 20 weeks = 140 entries
  const weeksPerStage = 2; // 1 full week + 1 transition week

  const themes: Array<"work" | "romantic" | "community"> = ["work", "romantic", "community"];
  let themeIndex = 0; // Cycle through themes

  for (let week = 0; week < totalWeeks; week++) {
    const weekInStagePair = week % weeksPerStage;
    const isTransitionWeek = weekInStagePair === 1;

    // Generate entries for this week
    for (let day = 0; day < entriesPerWeek; day++) {
      const timestamp = new Date(startDate);
      timestamp.setDate(timestamp.getDate() + (week * 7 + day));

      // Select theme (cycle through)
      const theme = themes[themeIndex % themes.length]!;
      themeIndex++;

      // Determine stage based on theme
      let stageName: string;
      let colorStage: ColorStage;
      let currentStage: string;

      if (theme === "work") {
        // Work theme has special progression
        currentStage = getWorkThemeStage(week);
        const nextWeekStage = week < totalWeeks - 1 ? getWorkThemeStage(week + 1) : currentStage;
        
        // Only create transition if stages are different and it's a transition week
        if (isTransitionWeek && currentStage !== nextWeekStage) {
          colorStage = createTransitionStage(currentStage, nextWeekStage, 0.3, 0.7);
          stageName = `${currentStage} → ${nextWeekStage}`;
        } else {
          colorStage = createColorStage(currentStage, 1.0);
          stageName = currentStage;
        }
      } else {
        // Other themes follow linear progression
        currentStage = getLinearStage(week);
        if (isTransitionWeek && week < totalWeeks - 1) {
          const nextStage = getLinearStage(week + 1);
          if (currentStage !== nextStage) {
            colorStage = createTransitionStage(currentStage, nextStage, 0.3, 0.7);
            stageName = `${currentStage} → ${nextStage}`;
          } else {
            colorStage = createColorStage(currentStage, 1.0);
            stageName = currentStage;
          }
        } else {
          colorStage = createColorStage(currentStage, 1.0);
          stageName = currentStage;
        }
      }

      // Get statement that matches the stage and theme
      // For transitions, use the "to" stage (the dominant one)
      const stageForStatement = stageName.includes("→") 
        ? stageName.split("→")[1]!.trim() 
        : currentStage;
      const statementData = getRandomStatementForStageAndTheme(stageForStatement, theme);

      // Determine absolute_thinking based on stage
      const earlyStages = ["beige", "purple", "red"];
      const absoluteThinking = earlyStages.includes(stageName.split(" ")[0]!);

      data.push({
        timestamp: timestamp.toISOString(),
        pixel: {
          statement: statementData.statement,
          context: statementData.context,
          explanation: `Reflection on ${theme} theme showing ${stageName} stage characteristics.`,
          color_stage: { ...colorStage },
          confidence_score: 0.7,
          too_nuanced: false,
          absolute_thinking: absoluteThinking,
        },
      });
    }
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
