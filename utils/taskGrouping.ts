import type { BriefHistoryItem } from '../types';

export interface GroupedBriefs {
  today: BriefHistoryItem[];
  yesterday: BriefHistoryItem[];
  last7Days: BriefHistoryItem[];
  last30Days: BriefHistoryItem[];
  older: { [key: string]: BriefHistoryItem[] }; // 按"年-月"分组
}

export interface GroupedBriefWithLabels {
  label: string;
  briefs: BriefHistoryItem[];
}

/**
 * 获取日期所属的分组标签
 */
function getDateGroupLabel(date: Date): string | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const diffMs = today.getTime() - dateAtMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays <= 7) return 'last7Days';
  if (diffDays <= 30) return 'last30Days';
  
  // 对于更早的日期，返回"年-月"格式
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * 将任务列表分组并排序
 */
export function groupAndSortBriefs(briefs: BriefHistoryItem[]): GroupedBriefWithLabels[] {
  const grouped: GroupedBriefs = {
    today: [],
    yesterday: [],
    last7Days: [],
    last30Days: [],
    older: {},
  };

  // 按日期分组
  briefs.forEach(brief => {
    const createdDate = new Date(brief.createdAt);
    const label = getDateGroupLabel(createdDate);
    
    if (label === 'today') {
      grouped.today.push(brief);
    } else if (label === 'yesterday') {
      grouped.yesterday.push(brief);
    } else if (label === 'last7Days') {
      grouped.last7Days.push(brief);
    } else if (label === 'last30Days') {
      grouped.last30Days.push(brief);
    } else if (label) {
      if (!grouped.older[label]) {
        grouped.older[label] = [];
      }
      grouped.older[label].push(brief);
    }
  });

  // 在每个组内按时间倒序排列
  const sortByTime = (a: BriefHistoryItem, b: BriefHistoryItem) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  };

  Object.keys(grouped).forEach(key => {
    if (key !== 'older') {
      grouped[key as keyof Omit<GroupedBriefs, 'older'>].sort(sortByTime);
    }
  });

  // 对older中的月份进行倒序排列
  const olderKeys = Object.keys(grouped.older).sort().reverse();
  olderKeys.forEach(key => {
    grouped.older[key].sort(sortByTime);
  });

  // 组装最终结果
  const result: GroupedBriefWithLabels[] = [];

  if (grouped.today.length > 0) {
    result.push({ label: '今天', briefs: grouped.today });
  }
  if (grouped.yesterday.length > 0) {
    result.push({ label: '昨天', briefs: grouped.yesterday });
  }
  if (grouped.last7Days.length > 0) {
    result.push({ label: '7 天内', briefs: grouped.last7Days });
  }
  if (grouped.last30Days.length > 0) {
    result.push({ label: '30 天内', briefs: grouped.last30Days });
  }

  olderKeys.forEach(key => {
    result.push({ label: key, briefs: grouped.older[key] });
  });

  return result;
}

/**
 * 格式化最后更新时间，显示简洁形式
 */
export function formatLastUpdated(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;
  if (diffHours < 24) return `${diffHours} 小时前`;
  if (diffDays === 1) return '昨天';
  if (diffDays < 30) return `${diffDays} 天前`;

  // 显示日期
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}
