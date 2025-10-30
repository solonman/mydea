import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import { RefinementExpression } from '../types';

interface RichTextEditorProps {
  refinement: RefinementExpression;
  onClose: () => void;
  onSave: (refinement: RefinementExpression) => Promise<void>;
  isProcessing?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  refinement,
  onClose,
  onSave,
  isProcessing = false,
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateInitialContent = useCallback(() => {
    // 如果refinedExample已经是完整的HTML（有一级标题）且是用户修改版本
    // 这意味着是编辑过的预先版本，直接返回以不重复编辑
    if (refinement.refinedExample && 
        refinement.refinedExample.includes('<h') && 
        refinement.isUserModified && 
        refinement.versionLabel?.startsWith('v2')) {
      return refinement.refinedExample;
    }
    
    // 此时是首次生成或v1原始版本，初始化结构化内容
    let html = '';
    html += `<h1>${refinement.title || '细化方案'}</h1>`;
    html += '<h2>核心创意</h2>';
    html += `<p>${refinement.refinedCoreIdea || ''}</p>`;
    html += '<h2>最终表达示例</h2>';
    html += refinement.refinedExample || '<p>暂无内容</p>';
    
    if (refinement.alternatives && refinement.alternatives.length > 0) {
      html += '<h2>可选表达方式</h2>';
      html += '<ul>';
      refinement.alternatives.forEach((alt) => {
        html += `<li>${alt}</li>`;
      });
      html += '</ul>';
    }
    
    html += '<h2>表达理由</h2>';
    html += `<p>${refinement.reasoning || ''}</p>`;
    
    if (refinement.visualGuidance) {
      html += '<h2>视觉指导</h2>';
      html += `<p>${refinement.visualGuidance}</p>`;
    }
    
    if (refinement.toneGuidance) {
      html += '<h2>语调指导</h2>';
      html += `<p>${refinement.toneGuidance}</p>`;
    }
    
    return html;
  }, [refinement]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      Underline,
    ],
    content: generateInitialContent(),
    onUpdate: ({ editor }) => {
      const newContent = editor.getHTML();
      setLastSaveTime(Date.now());
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(newContent);
      }, 1500);
    },
  });

  const handleAutoSave = async (content: string) => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const versionLabel = `v2-${dateStr}-${timeStr}`;

      // 只保存编辑器的完整内容，不做分解
      // 显示时会检测 HTML 标签并用 dangerouslySetInnerHTML 渲染
      const refinementToSave = {
        ...refinement,
        refinedExample: content,
        isUserModified: true,
        versionLabel,
      };

      await onSave(refinementToSave);
    } catch (error) {
      console.error('Auto save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const EditorToolbar = () => (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        padding: '12px 16px',
        borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#fafafa',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <ToolbarButton
        title="加粗 (Ctrl+B)"
        onClick={() => editor?.chain().focus().toggleBold().run()}
        active={editor?.isActive('bold')}
      >
        <strong>B</strong>
      </ToolbarButton>
      
      <ToolbarButton
        title="斜体 (Ctrl+I)"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        active={editor?.isActive('italic')}
      >
        <em>I</em>
      </ToolbarButton>
      
      <ToolbarButton
        title="下划线 (Ctrl+U)"
        onClick={() => editor?.chain().focus().toggleUnderline().run()}
        active={editor?.isActive('underline')}
      >
        <u>U</u>
      </ToolbarButton>
      
      <div style={{
        width: '1px',
        height: '20px',
        backgroundColor: '#d9d9d9',
        margin: '0 8px',
      }} />
      
      <ToolbarButton
        title="标题 1"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor?.isActive('heading', { level: 1 })}
      >
        H1
      </ToolbarButton>
      
      <ToolbarButton
        title="标题 2"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor?.isActive('heading', { level: 2 })}
      >
        H2
      </ToolbarButton>
      
      <ToolbarButton
        title="标题 3"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        active={editor?.isActive('heading', { level: 3 })}
      >
        H3
      </ToolbarButton>
      
      <div style={{
        width: '1px',
        height: '20px',
        backgroundColor: '#d9d9d9',
        margin: '0 8px',
      }} />
      
      <ToolbarButton
        title="无序列表"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        active={editor?.isActive('bulletList')}
      >
        •
      </ToolbarButton>
      
      <ToolbarButton
        title="有序列表"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        active={editor?.isActive('orderedList')}
      >
        1.
      </ToolbarButton>
      
      <ToolbarButton
        title="代码块"
        onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
        active={editor?.isActive('codeBlock')}
      >
        {'<>'}
      </ToolbarButton>
      
      <div style={{ flex: 1 }} />
      
      {isSaving && (
        <div style={{
          fontSize: '12px',
          color: '#888888',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#3b82f6',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          保存中...
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 背景蒙层 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* 编辑器窗口 */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          maxWidth: '90vw',
          height: '85vh',
          width: '1100px',
          background: '#ffffff',
          borderRadius: '8px',
          border: '1px solid #d9d9d9',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'fadeInScale 0.3s ease',
        }}
      >
        {/* 头部 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 32px',
            borderBottom: '1px solid #e8e8e8',
            background: '#fafafa',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: '#222222',
                margin: 0,
                marginBottom: '4px',
              }}
            >
              编辑细化方案
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: '#888888',
                margin: 0,
              }}
            >
              编辑内容会自动保存为新版本 v2
              {isSaving && ' • 保存中...'}
            </p>
          </div>
        </div>

        {/* 工具栏 */}
        <EditorToolbar />

        {/* 编辑区域 */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              flex: 1,
              border: '1px solid #e8e8e8',
              borderRadius: '4px',
              overflow: 'hidden',
              background: '#ffffff',
              margin: '24px 32px',
            }}
          >
            <div style={{ padding: '24px', minHeight: '100%', overflowY: 'auto', overflowX: 'hidden', height: '100%' }}>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            padding: '16px 32px',
            borderTop: '1px solid #e8e8e8',
            background: '#fafafa',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid #d9d9d9',
              background: '#ffffff',
              color: '#333333',
              borderRadius: '4px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              opacity: isProcessing ? 0.6 : 1,
            }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.background = '#f5f5f5';
                e.currentTarget.style.borderColor = '#b3b3b3';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#ffffff';
              e.currentTarget.style.borderColor = '#d9d9d9';
            }}
          >
            完成编辑
          </button>
        </div>

        <style>{`
          @keyframes fadeInScale {
            from {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          
          .ProseMirror {
            outline: none;
            font-size: 15px;
            line-height: 1.8;
            color: #333333;
            word-break: break-word;
          }
          
          .ProseMirror h1 {
            font-size: 32px;
            font-weight: 700;
            margin: 32px 0 16px 0;
            color: #222222;
          }
          
          .ProseMirror h1:first-child { margin-top: 0; }
          
          .ProseMirror h2 {
            font-size: 24px;
            font-weight: 700;
            margin: 28px 0 12px 0;
            color: #222222;
          }
          
          .ProseMirror h3 {
            font-size: 20px;
            font-weight: 600;
            margin: 20px 0 10px 0;
            color: #222222;
          }
          
          .ProseMirror p { margin: 12px 0; }
          
          .ProseMirror ul, .ProseMirror ol {
            margin: 12px 0;
            padding-left: 24px;
          }
          
          .ProseMirror li { margin: 6px 0; }
          
          .ProseMirror code {
            background-color: #f5f5f5;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 0.9em;
            color: #c41d7f;
          }
          
          .ProseMirror pre {
            background-color: #f5f5f5;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 12px 0;
            border: 1px solid #e8e8e8;
          }
          
          .ProseMirror pre code {
            background: none;
            padding: 0;
            color: #333333;
          }
          
          .ProseMirror blockquote {
            border-left: 4px solid #d9d9d9;
            margin: 12px 0;
            padding-left: 16px;
            color: #888888;
          }
        `}</style>
      </div>
    </>
  );
};

const ToolbarButton: React.FC<{
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, active, children }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      padding: '6px 12px',
      fontSize: '13px',
      fontWeight: '500',
      border: `1px solid ${active ? '#3b82f6' : '#d9d9d9'}`,
      background: active ? 'rgba(59, 130, 246, 0.1)' : '#ffffff',
      color: active ? '#3b82f6' : '#333333',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      minWidth: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
      e.currentTarget.style.borderColor = '#3b82f6';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = active ? 'rgba(59, 130, 246, 0.1)' : '#ffffff';
      e.currentTarget.style.borderColor = active ? '#3b82f6' : '#d9d9d9';
    }}
  >
    {children}
  </button>
);

export default RichTextEditor;
