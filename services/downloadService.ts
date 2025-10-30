/**
 * 下载服务
 * 
 * 提供文件下载相关功能，支持多种格式
 */

import { CreativeProposal, RefinementExpression } from '../types';
import { Document, Packer, Paragraph, HeadingLevel, AlignmentType } from 'docx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * 生成创意方案的 Markdown 内容
 */
function generateMarkdownContent(proposal: CreativeProposal, contextBrief?: string): string {
  const lines: string[] = [];
  
  // 标题
  lines.push(`# ${proposal.conceptTitle}`);
  lines.push('');
  
  // 版本信息
  lines.push(`**版本:** V${proposal.version}`);
  lines.push('');
  
  // 核心创意
  if (proposal.coreIdea) {
    lines.push('## 核心创意');
    lines.push(proposal.coreIdea);
    lines.push('');
  }
  
  // 详细描述
  if (proposal.detailedDescription) {
    lines.push('## 详细描述');
    lines.push(proposal.detailedDescription);
    lines.push('');
  }
  
  // 示例
  if (proposal.example) {
    lines.push('## 示例');
    lines.push(proposal.example);
    lines.push('');
  }
  
  // 工作原理
  if (proposal.whyItWorks) {
    lines.push('## 工作原理');
    lines.push(proposal.whyItWorks);
    lines.push('');
  }
  
  // 细化内容
  if (proposal.refinement) {
    lines.push('## 细化方案');
    lines.push('');
    
    if (proposal.refinement.title) {
      lines.push(`**标题:** ${proposal.refinement.title}`);
      lines.push('');
    }
    
    if (proposal.refinement.refinedCoreIdea) {
      lines.push(`### 细化核心创意`);
      lines.push(proposal.refinement.refinedCoreIdea);
      lines.push('');
    }
    
    if (proposal.refinement.refinedExample) {
      lines.push(`### 细化示例`);
      lines.push(proposal.refinement.refinedExample);
      lines.push('');
    }
    
    if (proposal.refinement.reasoning) {
      lines.push(`### 细化逻辑`);
      lines.push(proposal.refinement.reasoning);
      lines.push('');
    }
  }
  
  // 执行细则
  if (proposal.isFinalized && proposal.executionDetails) {
    lines.push('## 执行细则');
    lines.push(proposal.executionDetails.content);
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * 生成创意方案的 HTML 内容（用于打印或预览）
 */
function generateHtmlContent(proposal: CreativeProposal, contextBrief?: string): string {
  const markdown = generateMarkdownContent(proposal, contextBrief);
  
  // 简单的 Markdown 到 HTML 转换
  const html = markdown
    .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
    .replace(/^\*\*(.*?)\*\*$/gm, '<strong>$1</strong>')
    .replace(/^\- (.*?)$/gm, '<li>$1</li>')
    .replace(/^((?:<li>.*?<\/li>\n?)+)/gm, '<ul>$1</ul>')
    .replace(/\n/g, '<br/>');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${proposal.conceptTitle}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          padding: 40px;
          max-width: 900px;
          margin: 0 auto;
        }
        h1 { font-size: 28px; margin: 24px 0 16px; }
        h2 { font-size: 20px; margin: 20px 0 12px; color: #1e40af; }
        h3 { font-size: 16px; margin: 16px 0 8px; }
        strong { font-weight: 600; }
        ul { margin: 12px 0 12px 24px; }
        li { margin: 4px 0; }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;
}

/**
 * 下载为 Markdown 文件
 */
export function downloadAsMarkdown(proposal: CreativeProposal, contextBrief?: string): void {
  const content = generateMarkdownContent(proposal, contextBrief);
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${proposal.conceptTitle}_${proposal.version}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * 下载为 TXT 文件
 */
export function downloadAsText(proposal: CreativeProposal, contextBrief?: string): void {
  const content = generateMarkdownContent(proposal, contextBrief);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${proposal.conceptTitle}_${proposal.version}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * 下载为 HTML 文件（可在浏览器中打开或打印成 PDF）
 */
export function downloadAsHtml(proposal: CreativeProposal, contextBrief?: string): void {
  const content = generateHtmlContent(proposal, contextBrief);
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${proposal.conceptTitle}_${proposal.version}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * 下载为 DOCX 文件
 */
export async function downloadAsDocx(proposal: CreativeProposal, contextBrief?: string): Promise<void> {
  const paragraphs: Paragraph[] = [];
  
  // 标题
  paragraphs.push(
    new Paragraph({
      text: proposal.conceptTitle,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    } as any)
  );
  
  // 版本
  paragraphs.push(
    new Paragraph({
      text: `版本: V${proposal.version}`,
      spacing: { after: 400 },
    } as any)
  );
  
  // 核心创意
  if (proposal.coreIdea) {
    paragraphs.push(
      new Paragraph({
        text: '核心创意',
        heading: HeadingLevel.HEADING_2,
      } as any)
    );
    paragraphs.push(
      new Paragraph({
        text: proposal.coreIdea,
        spacing: { after: 400 },
      } as any)
    );
  }
  
  // 详细描述
  if (proposal.detailedDescription) {
    paragraphs.push(
      new Paragraph({
        text: '详细描述',
        heading: HeadingLevel.HEADING_2,
      } as any)
    );
    paragraphs.push(
      new Paragraph({
        text: proposal.detailedDescription,
        spacing: { after: 400 },
      } as any)
    );
  }
  
  // 示例
  if (proposal.example) {
    paragraphs.push(
      new Paragraph({
        text: '示例',
        heading: HeadingLevel.HEADING_2,
      } as any)
    );
    paragraphs.push(
      new Paragraph({
        text: proposal.example,
        spacing: { after: 400 },
      } as any)
    );
  }
  
  // 工作原理
  if (proposal.whyItWorks) {
    paragraphs.push(
      new Paragraph({
        text: '工作原理',
        heading: HeadingLevel.HEADING_2,
      } as any)
    );
    paragraphs.push(
      new Paragraph({
        text: proposal.whyItWorks,
        spacing: { after: 400 },
      } as any)
    );
  }
  
  // 细化内容
  if (proposal.refinement) {
    paragraphs.push(
      new Paragraph({
        text: '细化方案',
        heading: HeadingLevel.HEADING_2,
      } as any)
    );
    
    if (proposal.refinement.title) {
      paragraphs.push(
        new Paragraph({
          text: proposal.refinement.title,
          heading: HeadingLevel.HEADING_3,
        } as any)
      );
    }
    
    if (proposal.refinement.refinedCoreIdea) {
      paragraphs.push(
        new Paragraph({
          text: '细化核心创意',
          heading: HeadingLevel.HEADING_3,
        } as any)
      );
      paragraphs.push(
        new Paragraph({
          text: proposal.refinement.refinedCoreIdea,
          spacing: { after: 200 },
        } as any)
      );
    }
    
    if (proposal.refinement.refinedExample) {
      paragraphs.push(
        new Paragraph({
          text: '细化示例',
          heading: HeadingLevel.HEADING_3,
        } as any)
      );
      paragraphs.push(
        new Paragraph({
          text: proposal.refinement.refinedExample,
          spacing: { after: 200 },
        } as any)
      );
    }
    
    if (proposal.refinement.reasoning) {
      paragraphs.push(
        new Paragraph({
          text: '细化逻辑',
          heading: HeadingLevel.HEADING_3,
        } as any)
      );
      paragraphs.push(
        new Paragraph({
          text: proposal.refinement.reasoning,
          spacing: { after: 400 },
        } as any)
      );
    }
  }
  
  // 执行细则
  if (proposal.isFinalized && proposal.executionDetails) {
    paragraphs.push(
      new Paragraph({
        text: '执行细则',
        heading: HeadingLevel.HEADING_2,
      } as any)
    );
    paragraphs.push(
      new Paragraph({
        text: proposal.executionDetails.title,
        heading: HeadingLevel.HEADING_3,
      } as any)
    );
    paragraphs.push(
      new Paragraph({
        text: proposal.executionDetails.content,
        spacing: { after: 400 },
      } as any)
    );
  }
  
  const doc = new Document({
    sections: [{
      children: paragraphs,
    }],
  });
  
  const blob = await Packer.toBlob(doc);
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${proposal.conceptTitle}_${proposal.version}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

/**
 * 直接下载为 PDF 文件（html2canvas + jsPDF，带正确分页和页眉页脚）
 */
export async function downloadAsPdf(proposal: CreativeProposal, contextBrief?: string): Promise<void> {
  const markdown = generateMarkdownContent(proposal, contextBrief);
  
  // 创建 HTML 容器
  const container = document.createElement('div');
  container.id = 'pdf-export-' + Date.now();
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '210mm';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#333';
  container.style.fontFamily = '"Microsoft YaHei", SimSun, Arial, sans-serif';
  
  // 将 markdown 转换为格式化的 HTML
  let htmlContent = markdown
    // 标题转换
    .replace(/^## (.*?)$/gm, '<h2 style="font-size: 16px; font-weight: bold; margin: 12px 0 8px; color: #1e40af; padding-bottom: 5px; border-bottom: 1px solid #1e40af;">$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3 style="font-size: 14px; font-weight: bold; margin: 10px 0 6px; color: #2d5aa8;">$1</h3>')
    // 加粗转换
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight: bold;">$1</strong>')
    // 列表项转换
    .replace(/^- (.*?)$/gm, '<li style="margin-left: 20px; margin-bottom: 5px;">$1</li>');
  
  // 将连续的 li 包装在 ul 中
  htmlContent = htmlContent.replace(/(<li[^>]*>.*?<\/li>\n)+/g, '<ul style="list-style: disc inside; margin: 10px 0;">$&</ul>');
  
  // 段落转换（空行分隔的内容）
  htmlContent = htmlContent
    .split('\n\n')
    .map(para => {
      if (para.trim().startsWith('<')) {
        return para; // 已经是 HTML 标签
      }
      if (para.trim()) {
        return `<p style="margin: 10px 0; text-align: justify; line-height: 1.8;">${para.replace(/\n/g, '<br/>')}</p>`;
      }
      return '';
    })
    .join('');
  
  // 完整的 HTML 结构（每页单独处理页眉页脚）
  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; }
        body { 
          font-family: "Microsoft YaHei", SimSun, Arial, sans-serif;
          line-height: 1.8;
          color: #333;
        }
        .page {
          page-break-after: always;
          width: 210mm;
          height: 297mm;
          padding: 15mm;
          box-sizing: border-box;
          position: relative;
        }
        .page:last-child {
          page-break-after: avoid;
        }
        .header {
          height: 12mm;
          display: flex;
          align-items: center;
          border-bottom: 1px solid #ddd;
          margin-bottom: 10mm;
          color: #999;
          font-size: 10px;
        }
        .content {
          min-height: 230mm;
          font-size: 14px;
          line-height: 1.8;
        }
        .footer {
          height: 12mm;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          border-top: 1px solid #ddd;
          margin-top: 10mm;
          color: #999;
          font-size: 10px;
          position: absolute;
          bottom: 15mm;
          right: 15mm;
          left: 15mm;
        }
        .content h2 {
          font-size: 16px;
          font-weight: bold;
          margin: 12px 0 8px;
          color: #1e40af;
          padding-bottom: 5px;
          border-bottom: 1px solid #1e40af;
        }
        .content h3 {
          font-size: 14px;
          font-weight: bold;
          margin: 10px 0 6px;
          color: #2d5aa8;
        }
        .content p {
          margin: 10px 0;
        }
        .content ul {
          list-style: disc inside;
          margin: 10px 0;
        }
        .content li {
          margin-left: 20px;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">${proposal.conceptTitle}</div>
        <div class="content">
          <h1 style="text-align: center; font-size: 28px; margin-bottom: 20px;">${proposal.conceptTitle}</h1>
          <p style="text-align: center; color: #666; margin-bottom: 20px;"><strong>版本:</strong> V${proposal.version}</p>
          <div style="border-bottom: 3px solid #1e40af; margin-bottom: 20px;"></div>
          ${htmlContent}
        </div>
        <div class="footer">第 1 页</div>
      </div>
    </body>
    </html>
  `;
  
  container.innerHTML = fullHtml;
  document.body.appendChild(container);
  
  try {
    // 使用 html2canvas 将 HTML 转换为图像（保留中文）
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowHeight: container.scrollHeight,
      windowWidth: 800
    });
    
    // 使用 jsPDF 生成 PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // 添加第一页
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, 0, imgWidth, imgHeight);
    
    // 处理多页分页
    let heightLeft = imgHeight - pageHeight;
    let pageNum = 2;
    
    while (heightLeft > 0) {
      const position = -(heightLeft);
      pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      pageNum++;
    }
    
    // 保存 PDF
    pdf.save(`${proposal.conceptTitle}_V${proposal.version}.pdf`);
  } catch (error) {
    console.error('PDF generation error:', error);
  } finally {
    // 清理
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * 在新标签页打开预览（用于后续转换为 PDF）
 */
export function previewInNewTab(proposal: CreativeProposal, contextBrief?: string): void {
  const content = generateHtmlContent(proposal, contextBrief);
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  // 注意：URL 需要延迟释放，以便新标签页完成加载
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * 生成下载菜单选项
 */
export const DOWNLOAD_FORMATS = {
  markdown: {
    label: 'Markdown (.md)',
    handler: downloadAsMarkdown,
    icon: '📄'
  },
  text: {
    label: 'Plain Text (.txt)',
    handler: downloadAsText,
    icon: '📝'
  },
  html: {
    label: 'HTML (.html)',
    handler: downloadAsHtml,
    icon: '🌐'
  },
  docx: {
    label: 'Word (.docx)',
    handler: downloadAsDocx,
    icon: '📕'
  },
  pdf: {
    label: 'PDF (.pdf)',
    handler: downloadAsPdf,
    icon: '📋'
  },
  preview: {
    label: 'Print to PDF (Preview)',
    handler: previewInNewTab,
    icon: '🖨️',
    description: '在新窗口打开，使用浏览器打印功能保存为 PDF'
  }
};
