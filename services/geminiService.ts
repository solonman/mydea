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


export async function refineBrief(briefText: string, creativeType: string): Promise<RefinementData> {
  // 验证输入
  try {
    validateBrief(briefText);
  } catch (error) {
    throw handleError(error);
  }

  const model = 'gemini-2.5-flash';
  
  const prompt = `You are an expert advertising strategist. A user has provided an initial creative brief. Your task is to analyze it, provide a concise summary of your understanding in Chinese, and ask 2-3 critical clarifying questions in Chinese to gather the necessary details for generating high-quality creative ideas.

  User Brief: "${briefText}"
  Creative Type: "${creativeType}"

  Based on this, please provide a JSON object with a 'summary' and a list of 'questions'. The questions should be tailored to the creative type. For example, for a Slogan, ask about brand voice and target audience. For a video, ask about channels and budget.
  `;

  try {
    logger.info('Refining brief', { briefText: briefText.substring(0, 50), creativeType });

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

async function getInspirations(refinedBrief: string): Promise<InspirationCase[]> {
  const model = 'gemini-2.5-flash';

  const prompt = `You are a creative research assistant with access to Google Search. Based on the following refined creative brief, find 3 highly relevant and successful recent advertising campaign examples from around the world.

  Refined Brief: "${refinedBrief}"

  Return the result as a JSON array string. Each item in the array should be an object with 'title' (in its original language), and 'highlight' (in Chinese).
  Do NOT include markdown formatting like \`\`\`json.
  `;

  try {
    logger.info('Fetching inspirations');

    const result = await withTimeoutAndRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        const parsedInspirations = JSON.parse(jsonText) as {title: string; highlight: string;}[];
        
        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        
        return parsedInspirations.slice(0, 3).map((insp, index) => {
          const sourceUrl = (groundingChunks && groundingChunks[index]?.web?.uri) ? groundingChunks[index].web.uri : undefined;
          return {
            ...insp,
            imageUrl: `https://picsum.photos/seed/${encodeURIComponent(insp.title)}/600/400`,
            sourceUrl: sourceUrl,
          }
        });
      },
      {
        timeoutMs: 45000, // 搜索需要更长时间
        maxRetries: 2,
        delayMs: 2000,
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Inspirations fetched successfully', { count: result.length });
    return result;

  } catch (error) {
    logger.error("Error getting inspirations", error as Error);
    // 灵感获取失败不阻塞流程，返回默认数据
    return [
      { title: "案例获取失败", highlight: "无法从网络获取灵感案例，这可能是网络问题或 API 限制。", imageUrl: "https://picsum.photos/seed/error1/600/400" },
      { title: "请检查您的网络连接", highlight: "我们将继续为您生成创意方案，但缺少了外部灵感参考。", imageUrl: "https://picsum.photos/seed/error2/600/400" },
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
        maxRetries: 2,
        delayMs: 2000,
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
  projectContext: string,
  onStatusUpdate: (status: GeneratingStatus) => void
): Promise<{ inspirations: InspirationCase[], proposals: Omit<CreativeProposal, 'id' | 'version' | 'history' | 'isFinalized' | 'executionDetails'>[] }> {
  onStatusUpdate('inspiring');
  const inspirations = await getInspirations(refinedBrief);
  
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
        delayMs: 1500,
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
        maxRetries: 2,
        delayMs: 2000,
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