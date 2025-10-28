import { GoogleGenAI, Type } from "@google/genai";
import type { RefinementData, InspirationCase, CreativeProposal, GeneratingStatus, CreativeType, ExecutionDetails, RefinementExpression } from '../types';
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

  // Step 1: Search for recent campaigns using Google Search with relaxed criteria
  const searchPrompt = `Search for successful advertising campaigns and creative cases from 2022-2025 that match the user's creative type and brief requirements.
  
Creative Type: ${creativeType}
User Brief: ${refinedBrief}

Find 5-10 specific, real campaign examples with their official names, source URLs, and detailed descriptions. Include a variety of well-known brands, startups, and creative agencies. Focus on:
- Campaigns that demonstrate similar creative approaches or themes
- Cases from major advertising platforms and award shows (Cannes Lions, The One Show, D&AD, etc.)
- Recent social media campaigns or viral content
- Industry-specific examples if applicable

For each campaign, include:
- Official campaign name and year
- Brand/agency name
- Detailed description of the creative strategy (2-3 sentences)
- Key insights and why it was successful

Return the search results with comprehensive campaign information.`;

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
        timeoutMs: 120000, // 增加到 120 秒，Google Search 需要更长时间
        maxRetries: 3,     // 增加重试次数
        delayMs: 3000,     // 增加重试延迟
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Search results obtained', { resultLength: searchResults.length });

    // Step 2: Parse search results and generate structured data with relaxed relevance scoring
    const parsePrompt = `Based on these search results about advertising campaigns, extract and analyze ALL campaigns that are relevant to the user's creative brief:

${searchResults}

For each campaign, provide a JSON object with these exact fields:
{
  "title": "Campaign/Product name",
  "highlight": "Key creative insight or unique selling point in Chinese (1-2 sentences)",
  "category": "${creativeType}",
  "relevanceScore": <number 0-100 indicating how much this campaign relates to the creative type and brief>,
  "detailedDescription": "Comprehensive explanation of the campaign strategy, execution approach, and creative highlights in Chinese (3-5 sentences, very detailed)",
  "keyInsights": "Core innovative points, breakthrough thinking, and why it was successful in Chinese (3-4 sentences, insightful)",
  "targetAudience": "Specific target demographic description, psychographics, and behaviors in Chinese",
  "industry": "Industry/sector category and market positioning in Chinese",
  "sourceUrl": "Complete and valid URL starting with https:// or http:// pointing to the original campaign. Must be a real, working URL."
}

IMPORTANT:
1. Return ALL campaigns where relevanceScore >= 50 (inclusive)
2. Sort by relevance score (highest first)
3. Focus on DETAILED and COMPREHENSIVE descriptions - each detailedDescription should be 3-5 sentences
4. Make keyInsights substantive and insightful, not just repeating highlights
5. Be specific about target audience demographics and psychographics
6. **CRITICAL: sourceUrl must be a complete, valid URL with https:// or http:// protocol. DO NOT include relative paths, empty strings, or invalid URLs. If you cannot find a valid URL, use a reasonable URL based on the brand/campaign name.**
7. Return ONLY a JSON array with campaigns, no markdown, no explanations.`;

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
        
        // Filter and keep ALL relevant results (score >= 50), sorted by relevance
        const allRelevantInspirations = parsedInspirations
          .filter(insp => (insp.relevanceScore || 0) >= 50)
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          .map((insp) => {
            const relevanceScore = Math.min(100, Math.max(0, insp.relevanceScore || 50));
            // 验证 sourceUrl 是否有效
            let validSourceUrl = '';
            if (insp.sourceUrl && typeof insp.sourceUrl === 'string' && insp.sourceUrl.trim()) {
              const trimmedUrl = insp.sourceUrl.trim();
              // 子往 http:// 或 https:// 开头，且不是相对路径、#或一些无效值
              if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
                validSourceUrl = trimmedUrl;
              }
            }
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
              sourceUrl: validSourceUrl, // 只有有效 URL 才会包含
            } as InspirationCase;
          });
        
        // 返回所有符合条件的案例（至少 3 个），用于在前端支持分页展示
        return allRelevantInspirations.length >= 3 ? allRelevantInspirations : 
          // 如果不足 3 个，补充较低评分的案例
          allRelevantInspirations.concat(
            parsedInspirations
              .filter(insp => (insp.relevanceScore || 0) < 50 && (insp.relevanceScore || 0) >= 30)
              .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
              .slice(0, 3 - allRelevantInspirations.length)
              .map((insp) => {
                const relevanceScore = Math.min(100, Math.max(0, insp.relevanceScore || 30));
                // 验证 sourceUrl 是否有效
                let validSourceUrl = '';
                if (insp.sourceUrl && typeof insp.sourceUrl === 'string' && insp.sourceUrl.trim()) {
                  const trimmedUrl = insp.sourceUrl.trim();
                  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
                    validSourceUrl = trimmedUrl;
                  }
                }
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
                  sourceUrl: validSourceUrl,
                } as InspirationCase;
              })
          );
      },
      {
        timeoutMs: 120000, // 增加到 120 秒
        maxRetries: 3,     // 增加重试次数
        delayMs: 3000,     // 增加重试延迟
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

  **IMPORTANT: Keep the conceptTitle EXACTLY THE SAME as the original. Only optimize the creative content (coreIdea, detailedDescription, example, whyItWorks), not the direction.**

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

  Based on the feedback, please generate an improved version. **CRITICAL: Return the conceptTitle unchanged.** Only refine the coreIdea, detailedDescription, example, and whyItWorks. Your response must be a single JSON object that strictly follows the same structure as the original proposal.
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

export async function refineCreativeExpression(
  proposal: CreativeProposal,
  creativeType: CreativeType,
  contextBrief: string
): Promise<RefinementExpression> {
  const model = 'gemini-2.5-pro';

  let refinementGuidance = '';
  switch (creativeType) {
    case 'Slogan':
      refinementGuidance = `
创意表达要求：
- 精炼标题：简洁有力的创意标题（5-10 字）
- 核心创意：高度概括的创意主张（一句话）
- 具体表达：最终可用的 Slogan（1-3 句，包含核心信息）
- 可选表达方式：提供 3-5 个不同角度或风格的 Slogan 变体
- 意义阐述：解释这个 Slogan 为什么有效、传达了什么
- 应用举例：给出 3-5 个具体的应用场景示例（如海报、广告语、品牌口号等）
- 语调指导：说明表达的风格（正式/亲民/创意感等）`;
      break;
    case '社交媒体文案':
      refinementGuidance = `
创意表达要求：
- 精炼标题：文案主题标题
- 核心创意：文案的核心卖点
- 具体表达：最终可用的完整文案
- 可选表达方式：提供 3-5 个不同平台或风格的文案版本（微博、微信、抖音等）
- 意义阐述：解释文案策略和效果预期
- 应用举例：配图/视频建议、发布时间、互动策略等
- 语调指导：平台特有的表达风格建议`;
      break;
    case '平面设计':
      refinementGuidance = `
创意表达要求：
- 精炼标题：设计概念名称
- 核心创意：设计的创意概念
- 具体表达：构图方案详细描述（要素、布局、配色、排版等）
- 可选表达方式：提供 3-5 个不同风格或尺寸的设计方案描述
- 意义阐述：设计策略和视觉效果如何支撑创意概念
- 应用举例：具体的设计成品示例说明（如海报、包装、UI等）
- 视觉指导：字体、色系、图像风格的具体建议`;
      break;
    case '视频创意':
      refinementGuidance = `
创意表达要求：
- 精炼标题：视频主题/概念名称
- 核心创意：视频的核心创意思路
- 具体表达：最终可用的视频脚本（场景、台词、镜头、音效等）
- 可选表达方式：提供 3-5 个不同长度或风格的脚本版本（15s/30s/60s 等）
- 意义阐述：视频策略、目标平台、传播效果预期
- 应用举例：演员/画面参考、音乐建议、字幕文案等
- 语调指导：节奏、情感基调、品牌语言的具体表现`;
      break;
    case '公关活动':
      refinementGuidance = `
创意表达要求：
- 精炼标题：活动名称/主题
- 核心创意：活动的核心想法
- 具体表达：完整的活动执行方案（时间、地点、参与者、流程、要素等）
- 可选表达方式：提供 3-5 个不同规模或形式的活动方案变体
- 意义阐述：活动如何实现传播目标、期望的舆论和市场反应
- 应用举例：邀请函文案、现场布置、媒体沟通、后续运营等
- 语调指导：活动的基调（庆祝/宣传/互动/教育等）`;
      break;
    case '品牌命名':
      refinementGuidance = `
创意表达要求：
- 精炼标题：命名的创意核心
- 核心创意：名字背后的创意逻辑
- 具体表达：最终的品牌名称及其含义解释
- 可选表达方式：提供 3-5 个候选名字及各自的含义
- 意义阐述：名字的寓意、记忆点、品牌关联性
- 应用举例：如何在品牌故事、标语、视觉中体现这个名字的含义
- 语调指导：名字传达的品牌性格（高端/亲民/创新/可靠等）`;
      break;
    default:
      refinementGuidance = '基于创意类型提供具体的表达方案';
  }

  const prompt = `You are a world-class creative director and copywriter. Your task is to refine and finalize a creative concept into concrete, actionable creative expressions in Chinese.

**Original Creative Brief:**
${contextBrief}

**Creative Proposal to Refine:**
${JSON.stringify({
  conceptTitle: proposal.conceptTitle,
  coreIdea: proposal.coreIdea,
  detailedDescription: proposal.detailedDescription,
  example: proposal.example,
  whyItWorks: proposal.whyItWorks,
}, null, 2)}

**Refinement Guidance for ${creativeType}:**
${refinementGuidance}

**Your Task:**
Based on the proposal and guidance above, generate a comprehensive and concrete creative expression. Return a JSON object with the following structure:
{
  "title": "Refined creative concept title (in Chinese)",
  "refinedCoreIdea": "One-sentence refined core idea (in Chinese)",
  "refinedExample": "Detailed final expression/execution example (in Chinese, 2-3 paragraphs)",
  "alternatives": ["Alternative 1 expression (in Chinese)", "Alternative 2 (in Chinese)", ...],
  "reasoning": "Explanation of why this refined expression is effective (in Chinese, 2-3 sentences)",
  "visualGuidance": "Visual style guidance if applicable (in Chinese)",
  "toneGuidance": "Tone and style guidance (in Chinese)"
}

IMPORTANT:
1. The refinedExample should be very detailed and practical - something that can be directly used
2. Provide 3-5 thoughtful alternatives that explore different angles or styles
3. Be concrete and specific, not abstract
4. All text must be in Chinese
5. Return ONLY valid JSON, no markdown or explanations`;

  try {
    logger.info('Refining creative expression', { proposalId: proposal.id, creativeType });

    const result = await withTimeoutAndRetry(
      async () => {
        const response = await ai.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        const jsonText = response.text.trim().replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(jsonText) as RefinementExpression;
      },
      {
        timeoutMs: 60000,
        maxRetries: 3,
        delayMs: 3000,
        shouldRetry: isRetryableError,
      }
    );

    logger.info('Creative expression refined successfully');
    return result;

  } catch (error) {
    logger.error("Error refining creative expression", error as Error);
    throw handleError(error);
  }
}