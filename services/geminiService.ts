import { GoogleGenAI, Type } from "@google/genai";
import type { RefinementData, InspirationCase, CreativeProposal, GeneratingStatus, CreativeType, ExecutionDetails } from '../types';
import { handleError, validateBrief, logger, AppError, ErrorCodes } from '../utils/errors';
import { withTimeoutAndRetry, isRetryableError } from '../utils/retry';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  throw new AppError(
    "VITE_GEMINI_API_KEY environment variable not set",
    ErrorCodes.API_KEY_INVALID,
    "API 配置错误，请检查环境变量配置",
    false
  );
}

const ai = new GoogleGenAI({ apiKey });

const PROPOSAL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    conceptTitle: { type: Type.STRING },
    coreIdea: { type: Type.STRING },
    detailedDescription: { type: Type.STRING },
    example: { type: Type.STRING },
    whyItWorks: { type: Type.STRING },
  },
  required: ["conceptTitle", "coreIdea", "detailedDescription", "example", "whyItWorks"],
};


export async function refineBrief(briefText: string, creativeType: string, projectName?: string): Promise<RefinementData> {
  // 验证输入
  try {
    validateBrief(briefText);
  } catch (error) {
    throw handleError(error);
  }

  const model = 'gemini-2.5-flash';
  
  const projectContext = projectName ? `This task is for the "${projectName}" project. You already know the brand, so do NOT ask what brand or company this is for.` : '';
  
  const prompt = `You are an expert advertising strategist. A user has provided an initial creative brief for their ${creativeType} task. Your task is to analyze it, provide a concise summary of your understanding in Chinese, and ask 2-3 critical clarifying questions in Chinese to gather necessary details.

  ${projectContext}
  
  User Brief: "${briefText}"
  Creative Type: "${creativeType}"

  Based on this, provide a JSON object with a 'summary' and a list of 'questions'. 
  - The summary should acknowledge the project context if provided
  - Questions should be tailored to the creative type and details needed
  - For a Slogan: ask about brand voice, core message, and target audience (NOT the brand name)
  - For video: ask about channels, target audience, key message
  - For social media: ask about platform preferences, tone, and key objectives
  - NEVER ask "what brand/company is this for?" since the project already defines that
  `;

  try {
    logger.info('Refining brief', { briefText: briefText.substring(0, 50), creativeType, projectName });

    const result = await withTimeoutAndRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: "对用户需求的简要总结。",
                },
                questions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "向用户提出的澄清问题列表。",
                },
              },
              required: ["summary", "questions"],
            },
          },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as RefinementData;
      },
      {
        timeoutMs: 30000,
        maxRetries: 3,
        delayMs: 1000,
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Brief refinement successful');
    return result;

  } catch (error) {
    logger.error("Error refining brief", error as Error);
    throw handleError(error);
  }
}

async function getInspirations(refinedBrief: string, creativeType: string): Promise<InspirationCase[]> {
  const model = 'gemini-2.5-flash';

  // Step 1: Search for recent campaigns using Google Search with enhanced criteria
  const searchPrompt = `Search for the most recent successful advertising campaigns and creative cases from 2023-2025 that match these criteria:
  
Creative Type: ${creativeType}
Brief Requirements: ${refinedBrief}

Must find cases that are:
- HIGHLY RELEVANT (at least 80% match to the creative type and brief)
- From well-known brands or agencies
- Successful in terms of awards, engagement, or business results
- Recent (2023-2025 preferred, but 2022-2025 acceptable)

Find 3 specific, real campaign examples with their official names, source URLs, and detailed descriptions.`;

  try {
    logger.info('Fetching inspirations', { creativeType });

    // Step 1: Use Google Search to find recent cases
    const searchResults = await withTimeoutAndRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: model,
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        return response.text;
      },
      {
        timeoutMs: 60000, // 增加到 60 秒，Google Search 需要更长时间
        maxRetries: 3,    // 增加重试次数
        delayMs: 2000,    // 增加重试延迟
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Search results obtained', { resultLength: searchResults.length });

    // Step 2: Parse search results and generate structured data with enhanced relevance scoring
    const parsePrompt = `Based on these search results about advertising campaigns, extract and analyze 3 campaigns:

${searchResults}

For each campaign, provide a JSON object with these exact fields:
{
  "title": "Campaign/Product name",
  "highlight": "Key creative insight or unique selling point in Chinese",
  "category": "${creativeType}",
  "relevanceScore": <number 0-100 indicating relevance to brief. MUST be >= 80 for high relevance matches>,
  "detailedDescription": "Detailed explanation of the campaign strategy and execution in Chinese (2-3 sentences)",
  "keyInsights": "Core innovative points or breakthrough thinking that makes this case valuable in Chinese (2-3 sentences)",
  "targetAudience": "Target demographic description in Chinese",
  "industry": "Industry category in Chinese"
}

IMPORTANT:
1. Only return campaigns where relevanceScore >= 75
2. Be strict with relevance scoring - only score high if the case directly matches the creative type and brief requirements
3. Provide insightful, actionable detailedDescription and keyInsights
4. Return ONLY a JSON array with 3 objects maximum, no markdown, no explanations.`;

    const result = await withTimeoutAndRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: model,
          contents: parsePrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const parsedInspirations = JSON.parse(jsonText) as any[];
        
        // Filter and ensure high-quality results with proper relevance scoring
        const validInspirations = parsedInspirations
          .filter(insp => (insp.relevanceScore || 0) >= 75) // 只返回相关度 >= 75 的案例
          .slice(0, 3)
          .map((insp) => {
            const relevanceScore = Math.min(100, Math.max(0, insp.relevanceScore || 85));
            return {
              title: insp.title || '案例',
              highlight: insp.highlight || '',
              category: insp.category || creativeType,
              relevanceScore: relevanceScore,
              detailedDescription: insp.detailedDescription || '',
              keyInsights: insp.keyInsights || insp.highlight || '',
              targetAudience: insp.targetAudience || '通用',
              industry: insp.industry || '广告',
              imageUrl: `https://picsum.photos/seed/${encodeURIComponent(insp.title || '案例')}/600/400`,
              sourceUrl: insp.sourceUrl,
            } as InspirationCase;
          });
        
        // 如果案例数不足，返回现有的（通常意味着网络搜索没有找到足够高相关度的案例）
        return validInspirations.length > 0 ? validInspirations : 
          parsedInspirations.slice(0, 3).map((insp) => {
            return {
              title: insp.title || '案例',
              highlight: insp.highlight || '',
              category: insp.category || creativeType,
              relevanceScore: Math.min(100, Math.max(0, insp.relevanceScore || 75)),
              detailedDescription: insp.detailedDescription || '',
              keyInsights: insp.keyInsights || insp.highlight || '',
              targetAudience: insp.targetAudience || '通用',
              industry: insp.industry || '广告',
              imageUrl: `https://picsum.photos/seed/${encodeURIComponent(insp.title || '案例')}/600/400`,
              sourceUrl: insp.sourceUrl,
            } as InspirationCase;
          });
      },
      {
        timeoutMs: 60000, // 增加到 60 秒
        maxRetries: 3,    // 增加重试次数
        delayMs: 2000,    // 增加重试延迟
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Inspirations fetched successfully', { count: result.length });
    return result;

  } catch (error) {
    logger.error("Error getting inspirations", error as Error);
    // 返回错误提示案例，以便用户了解需要重试
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return [
      { 
        title: "网络不易被探测", 
        highlight: `案例推荐服务暂时不可用。\n错误: ${errorMessage}`, 
        imageUrl: "https://picsum.photos/seed/error1/600/400", 
        relevanceScore: 0,
        detailedDescription: "案例推荐处于不可用状态，但我们仍然会为你生成一流的创意方案。",
        keyInsights: "稍后尝试稍后尝试。"
      },
      { 
        title: "想要查看案例配图", 
        highlight: "需要检查你的网络连接", 
        imageUrl: "https://picsum.photos/seed/error2/600/400", 
        relevanceScore: 0,
        detailedDescription: "请检查你的网络连接，然后稍后估估。",
        keyInsights: "不过不覆你的创意稍后子。"
      },
    ];
  }
}


async function generateProposals(refinedBrief: string, inspirations: InspirationCase[], projectContext: string): Promise<Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>[]> {
  const model = 'gemini-2.5-pro';

  const prompt = `You are a world-class advertising creative director from Ogilvy. Your task is to generate 3 distinct and innovative creative proposals in Chinese based on the user's brief and some inspirational examples.

  **User's Refined Creative Brief:**
  ${refinedBrief}
  
  ${projectContext ? `**Project Context (for your reference):**\n${projectContext}\n` : ''}

  **Inspirational Examples for Context (use these as a starting point for tone and quality, but create original ideas):**
  ${JSON.stringify(inspirations.map(i => ({ title: i.title, highlight: i.highlight })), null, 2)}

  Please generate 3 complete creative proposals. Return a JSON array where each object has the following structure:
  - conceptTitle: A catchy name for the creative concept (in Chinese).
  - coreIdea: A single sentence that captures the essence of the idea (in Chinese).
  - detailedDescription: A paragraph explaining the creative in more detail (in Chinese).
  - example: A concrete example of the creative in action (e.g., the actual slogan, a snippet of copy, a scene description for a video) (in Chinese).
  - whyItWorks: A brief analysis of why this creative approach is likely to be effective, connecting back to the user's brief (in Chinese).
  `;

  try {
    logger.info('Generating creative proposals', { briefLength: refinedBrief.length });

    const result = await withTimeoutAndRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.ARRAY,
              items: PROPOSAL_SCHEMA,
            },
          },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>[];
      },
      {
        timeoutMs: 60000, // 方案生成需要更长时间
        maxRetries: 3,
        delayMs: 3000, // 增加延迟时间以更好地处理过载情况
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Creative proposals generated successfully', { count: result.length });
    return result;

  } catch (error) {
    logger.error("Error generating proposals", error as Error);
    throw handleError(error);
  }
}

export async function generateCreativePackage(
  refinedBrief: string,
  creativeType: string,
  projectContext: string,
  onStatusUpdate: (status: GeneratingStatus) => void
): Promise<{ inspirations: InspirationCase[], proposals: Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>[] }> {
  onStatusUpdate('inspiring');
  const inspirations = await getInspirations(refinedBrief, creativeType);
  
  onStatusUpdate('creating');
  const proposals = await generateProposals(refinedBrief, inspirations, projectContext);
  
  onStatusUpdate('finished');
  return { inspirations, proposals };
}

export async function optimizeProposal(
  originalProposal: CreativeProposal, 
  feedback: string, 
  contextBrief: string
): Promise<Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>> {
  // 验证输入
  if (!feedback || feedback.trim().length === 0) {
    throw new AppError(
      'Feedback is empty',
      ErrorCodes.VALIDATION_ERROR,
      '优化意见不能为空',
      false
    );
  }

  const model = 'gemini-2.5-pro';

  const prompt = `You are an expert advertising creative director tasked with refining a creative proposal based on user feedback.

  **Original Creative Brief:**
  ${contextBrief}

  **Original Creative Proposal (to be improved):**
  ${JSON.stringify({
    conceptTitle: originalProposal.conceptTitle,
    coreIdea: originalProposal.coreIdea,
    detailedDescription: originalProposal.detailedDescription,
    example: originalProposal.example,
    whyItWorks: originalProposal.whyItWorks,
  }, null, 2)}

  **User's Feedback for Optimization:**
  "${feedback}"

  Based on the feedback, please generate a new, improved version of the creative proposal. Your response must be a single JSON object that strictly follows the same structure as the original proposal.
  `;
  
  try {
    logger.info('Optimizing proposal', { proposalId: originalProposal.id, feedbackLength: feedback.length });

    const result = await withTimeoutAndRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: PROPOSAL_SCHEMA,
          },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>;
      },
      {
        timeoutMs: 45000,
        maxRetries: 3,
        delayMs: 3000, // 增加延迟时间以更好地处理过载情况
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Proposal optimized successfully');
    return result;

  } catch (error) {
    logger.error("Error optimizing proposal", error as Error);
    throw handleError(error);
  }
}


export async function generateExecutionPlan(
  finalProposal: CreativeProposal,
  creativeType: CreativeType,
  contextBrief: string
): Promise<ExecutionDetails> {
  const model = 'gemini-2.5-pro';

  let action;
  switch (creativeType) {
    case '公关活动':
      action = 'a detailed, step-by-step event execution plan, including timeline, key milestones, required resources, and potential risks.';
      break;
    case '视频创意':
      action = 'a complete video script, including scene descriptions, character dialogue, camera shot suggestions, and sound design notes.';
      break;
    case '社交媒体文案':
       action = 'a one-week content calendar based on this creative, including post copy for 3 different platforms (like Weibo, WeChat, Douyin), suggested visuals, and hashtags.';
       break;
    default:
      action = 'a concise action plan for implementing this creative concept.';
  }

  const prompt = `
  You are a senior project manager in a top-tier advertising agency. Your task is to transform a finalized creative concept into a concrete, actionable plan in Chinese.

  **Original Creative Brief:**
  ${contextBrief}

  **Finalized Creative Proposal:**
  ${JSON.stringify({
    conceptTitle: finalProposal.conceptTitle,
    coreIdea: finalProposal.coreIdea,
    detailedDescription: finalProposal.detailedDescription,
    example: finalProposal.example,
  }, null, 2)}

  **Your Task:**
  Based on the proposal and the creative type "${creativeType}", generate ${action}

  Return your response as a single JSON object with 'title' (a summary of the plan, in Chinese) and 'content' (the detailed plan, in Chinese, using markdown for formatting).
  `;

  try {
    logger.info('Generating execution plan', { proposalId: finalProposal.id, creativeType });

    const result = await withTimeoutAndRetry(
      async () => {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ["title", "content"],
            },
          },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText) as ExecutionDetails;
      },
      {
        timeoutMs: 60000, // 执行计划生成需要更长时间
        maxRetries: 3,
        delayMs: 3000, // 增加延迟时间以更好地处理过载情况
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Execution plan generated successfully');
    return result;

  } catch(error) {
    logger.error("Error generating execution plan", error as Error);
    throw handleError(error);
  }
}