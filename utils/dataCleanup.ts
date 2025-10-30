import { CreativeProposal, RefinementExpression } from '../types';

/**
 * 清理并规范化 CreativeProposal 数据
 * 确保所有字符串字段确实是字符串，而不是对象或其他类型
 */
export function cleanCreativeProposal(proposal: any): CreativeProposal {
  if (!proposal) {
    throw new Error('Invalid proposal: null or undefined');
  }

  return {
    id: String(proposal.id || ''),
    conceptTitle: ensureString(proposal.conceptTitle),
    coreIdea: ensureString(proposal.coreIdea),
    detailedDescription: ensureString(proposal.detailedDescription),
    example: ensureString(proposal.example),
    whyItWorks: ensureString(proposal.whyItWorks),
    version: Number(proposal.version) || 1,
    history: (proposal.history || []).map((item: any) => cleanCreativeProposal(item)),
    isFinalized: Boolean(proposal.isFinalized),
    executionDetails: proposal.executionDetails ? {
      title: ensureString(proposal.executionDetails.title),
      content: ensureString(proposal.executionDetails.content),
    } : null,
    refinement: proposal.refinement ? cleanRefinementExpression(proposal.refinement) : undefined,
  };
}

/**
 * 清理 RefinementExpression 数据
 */
export function cleanRefinementExpression(refinement: any): RefinementExpression {
  if (!refinement) {
    throw new Error('Invalid refinement: null or undefined');
  }

  return {
    title: ensureString(refinement.title),
    refinedCoreIdea: ensureString(refinement.refinedCoreIdea),
    refinedExample: ensureString(refinement.refinedExample),
    alternatives: Array.isArray(refinement.alternatives) 
      ? refinement.alternatives.map((a: any) => ensureString(a))
      : [],
    reasoning: ensureString(refinement.reasoning),
    visualGuidance: refinement.visualGuidance ? ensureString(refinement.visualGuidance) : undefined,
    toneGuidance: refinement.toneGuidance ? ensureString(refinement.toneGuidance) : undefined,
    createdAt: refinement.createdAt ? new Date(refinement.createdAt) : undefined,
    isUserModified: Boolean(refinement.isUserModified),
    versionLabel: refinement.versionLabel ? ensureString(refinement.versionLabel) : undefined,
  };
}

/**
 * 确保值是字符串
 * 如果是对象，则转换为 JSON 字符串
 * 如果是其他类型，则转换为字符串
 */
function ensureString(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
}

/**
 * 批量清理 CreativeProposal 数组
 */
export function cleanProposalArray(proposals: any[]): CreativeProposal[] {
  if (!Array.isArray(proposals)) {
    return [];
  }
  return proposals.map(p => {
    try {
      return cleanCreativeProposal(p);
    } catch (e) {
      console.error('Error cleaning proposal:', e, p);
      // 返回一个有效但空的 proposal，防止整个数组被破坏
      return {
        id: p.id || 'error-' + Date.now(),
        conceptTitle: '数据错误',
        coreIdea: '',
        detailedDescription: '',
        example: '',
        whyItWorks: '',
        version: 1,
        history: [],
        isFinalized: false,
        executionDetails: null,
      };
    }
  });
}
