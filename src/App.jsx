import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen, PenTool, Sparkles, Star, ArrowRight,
  ChevronRight, Loader2, Copy, Check, Menu, X,
  Zap, Brain, Layers, Compass, RefreshCw, Lightbulb,
  FileText, BookMarked, Quote, Search, Clock, Eye,
  GraduationCap, Heart, Users, Award, ChevronDown,
  Cpu, Wifi, WifiOff, AlertCircle
} from 'lucide-react';
import {
  EXAM_TOPICS, FIVE_KEYS, FIVE_STEPS, MATERIALS, API_CONFIG
} from './data/courseData.js';
import './index.css';

// ─── 硅基流动 API 配置 ──────────────────────────────────────────
// 注意：此 Key 仅用于演示，生产环境请使用服务端代理
const SILICONFLOW_API_KEY = 'sk-ueuytromhuhrpcgyijkzymzqgigbkgknmfaqkazcfipmvjgl';
const SILICONFLOW_API_URL = 'https://api.siliconflow.cn/v1/chat/completions';
const SILICONFLOW_MODEL = 'deepseek-ai/DeepSeek-V2.5';

async function callSiliconFlow(messages) {
  // 尝试非流式（避免 CORS 问题）
  try {
    const response = await fetch(SILICONFLOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SILICONFLOW_API_KEY}`
      },
      body: JSON.stringify({
        model: SILICONFLOW_MODEL,
        messages: messages,
        stream: false,
        temperature: 0.7,
        max_tokens: 4096
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error?.code === 'InsufficientBalance') {
        throw new Error('API 余额不足，请联系管理员充值。');
      }
      if (errorData.error?.code === 'InvalidAPIKey') {
        throw new Error('API Key 无效，请检查配置。');
      }
      throw new Error(errorData.error?.message || `API 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('CORS')) {
      throw new Error('网络请求被拦截。可能的原因：\n1. 浏览器扩展（如广告拦截器）阻止了请求\n2. 网络代理/VPN 拦截了请求\n3. SiliconFlow 在您当前网络下不可访问\n\n请尝试：\n- 关闭广告拦截器\n- 更换网络环境\n- 或联系管理员配置代理服务器');
    }
    throw err;
  }
}

async function callAI(messages, onStream) {
  return callSiliconFlow(messages);
}

// ─── 结果缓存 ─────────────────────────────────────────────
function saveCache(key, data) {
  try {
    localStorage.setItem(`ketuo_cache_${key}`, JSON.stringify({ data, time: Date.now() }));
  } catch {}
}
function loadCache(key) {
  try {
    const raw = localStorage.getItem(`ketuo_cache_${key}`);
    if (!raw) return null;
    const { data, time } = JSON.parse(raw);
    // 缓存有效期 7 天
    if (Date.now() - time > 7 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(`ketuo_cache_${key}`);
      return null;
    }
    return data;
  } catch { return null; }
}
function clearCache() {
  try {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('ketuo_cache_')) localStorage.removeItem(k);
    });
  } catch {}
}

// ─── 使用统计 Hook ────────────────────────────────────────
function useStats() {
  const [stats, setStats] = useState(() => {
    try {
      const saved = localStorage.getItem('ketuo_write_stats');
      return saved ? JSON.parse(saved) : { visits: 0, essays: 0, lastVisit: null };
    } catch { return { visits: 0, essays: 0, lastVisit: null }; }
  });

  useEffect(() => {
    const newStats = { ...stats, visits: stats.visits + 1, lastVisit: new Date().toLocaleString('zh-CN') };
    setStats(newStats);
    localStorage.setItem('ketuo_write_stats', JSON.stringify(newStats));
  }, []);

  const incrementEssays = useCallback(() => {
    const newStats = { ...stats, essays: stats.essays + 1 };
    setStats(newStats);
    localStorage.setItem('ketuo_write_stats', JSON.stringify(newStats));
  }, [stats]);

  return { stats, incrementEssays };
}

// ─── 模型加载面板 ──────────────────────────────────────────
function ModelLoader({ progress, onLoaded, error, rawErrorText, onRetry }) {
  const progressText = progress?.text || '正在准备模型...';
  const progressValue = progress?.progress !== undefined
    ? Math.round(progress.progress * 100)
    : null;
  const [diagInfo, setDiagInfo] = useState(null);
  const [rawError, setRawError] = useState('');

  const runDiagnostics = () => {
    const info = {
      userAgent: navigator.userAgent,
      hasGPU: !!navigator.gpu,
      gpuName: null,
      webgpuEnabled: false,
      webgpuAdapter: null,
    };
    if (navigator.gpu) {
      navigator.gpu.requestAdapter().then(a => {
        info.webgpuAdapter = a ? 'OK' : 'null';
        info.gpuName = a ? (a.info ? a.info.description : 'available') : null;
        setDiagInfo(info);
      }).catch(e => {
        info.webgpuAdapter = 'Error: ' + e.message;
        setDiagInfo(info);
      });
    } else {
      setDiagInfo(info);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'linear-gradient(135deg, #0a1628 0%, #0f2744 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: '24px',
        padding: '48px 40px',
        maxWidth: '540px', width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '56px', marginBottom: '20px' }}>
          {error ? '⚠️' : '🧠'}
        </div>
        <h2 style={{ color: '#d4af37', fontSize: '22px', marginBottom: '8px', fontWeight: 700 }}>
          {error ? '模型加载失败' : '首次加载 AI 模型'}
        </h2>
        <p style={{ color: 'rgba(232,224,200,0.6)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
          {error
            ? error
            : '本系统完全运行在您的浏览器中，无需网络连接。首次加载约需 1-3 分钟（取决于网速），之后即可离线使用。'}
        </p>

        {progressValue !== null && !error && (
          <>
            <div style={{
              background: 'rgba(212,175,55,0.1)',
              border: '1px solid rgba(212,175,55,0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: 'rgba(232,224,200,0.6)', fontSize: '12px' }}>下载进度</span>
                <span style={{ color: '#d4af37', fontSize: '12px', fontWeight: 600 }}>{progressValue}%</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '6px', height: '6px', overflow: 'hidden' }}>
                <div style={{
                  width: `${progressValue}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #d4af37, #f0d060)',
                  borderRadius: '6px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
            <div style={{ color: 'rgba(232,224,200,0.4)', fontSize: '12px', lineHeight: 1.5, marginBottom: '20px' }}>
              {progressText}
            </div>
          </>
        )}

        {error && (
          <>
            {/* 故障排查步骤 */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(212,175,55,0.15)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              textAlign: 'left'
            }}>
              <div style={{ color: '#d4af37', fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>🔧 请按以下步骤排查：</div>
              <div style={{ color: 'rgba(232,224,200,0.75)', fontSize: '12px', lineHeight: 1.9 }}>
                <div><strong>① 开启 WebGPU</strong>（Edge 浏览器）<br/>
                  <span style={{ color: 'rgba(232,224,200,0.45)', fontSize: '11px' }}>在 Edge 地址栏输入 <code style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>edge://flags</code> → 搜索 <strong>WebGPU</strong> → 设为 <strong>Enabled</strong> → 重启浏览器</span>
                </div>
                <div style={{ marginTop: '8px' }}><strong>② 确认显卡</strong><br/>
                  <span style={{ color: 'rgba(232,224,200,0.45)', fontSize: '11px' }}>本机需有<strong>独立显卡</strong>（Nvidia/AMD），集显（Intel UHD）通常不支持 WebGPU</span>
                </div>
                <div style={{ marginTop: '8px' }}><strong>③ 更换浏览器</strong><br/>
                  <span style={{ color: 'rgba(232,224,200,0.45)', fontSize: '11px' }}>推荐使用 <strong>Chrome 120+</strong>（下载地址：chrome.google.com）</span>
                </div>
              </div>
            </div>

            {/* 诊断按钮 */}
            <button
              className="btn-gold"
              onClick={runDiagnostics}
              style={{ marginBottom: '10px', width: '100%', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.4)' }}
            >
              🔬 运行诊断
            </button>

            {/* 原始错误信息 */}
            {rawErrorText && (
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,100,100,0.2)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
                textAlign: 'left',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'rgba(255,200,200,0.8)',
                lineHeight: 1.6,
                maxHeight: '200px',
                overflow: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {rawErrorText}
              </div>
            )}

            {/* 诊断结果 */}
            {diagInfo && (
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
                textAlign: 'left',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: 'rgba(232,224,200,0.7)',
                lineHeight: 1.8
              }}>
                <div>Browser: {diagInfo.userAgent}</div>
                <div>navigator.gpu: <span style={{ color: diagInfo.hasGPU ? '#4ade80' : '#f87171' }}>{diagInfo.hasGPU ? '✅ 存在' : '❌ 不存在'}</span></div>
                {diagInfo.hasGPU && <div>GPU Adapter: <span style={{ color: diagInfo.webgpuAdapter === 'OK' ? '#4ade80' : '#f87171' }}>{diagInfo.webgpuAdapter || 'null'}</span></div>}
              </div>
            )}

            <button
              className="btn-gold"
              onClick={onRetry}
              style={{ marginBottom: '12px', width: '100%' }}
            >
              🔄 重试
            </button>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'rgba(232,224,200,0.35)', fontSize: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={12} /> 浏览器本地运行
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <WifiOff size={12} /> 无需 API Key
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 五步进度条组件 ────────────────────────────────────────
function StepProgress({ currentStep, totalSteps = 5 }) {
  const labels = ['建模', '发散', '共轭', '变换', '成文'];
  const items = [];
  for (let i = 0; i < totalSteps; i++) {
    const num = i + 1;
    const isDone = num < currentStep;
    const isActive = num === currentStep;
    const color = isActive ? '#d4af37' : isDone ? 'rgba(212,175,55,0.7)' : 'rgba(232,224,200,0.3)';
    const itemStyle = { display: 'flex', alignItems: 'center', flex: 1 };
    const innerStyle = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' };
    const dotClass = 'progress-dot' + (isDone ? ' done' : '') + (isActive ? ' active' : '');
    const lineClass = 'progress-line' + (isDone ? ' done' : '');
    const dotEl = <div className={dotClass}>{isDone ? '✓' : num}</div>;
    const lblEl = <span style={{ fontSize: '11px', color, whiteSpace: 'nowrap' }}>{labels[i]}</span>;
    const lineEl = num < totalSteps ? <div className={lineClass} style={{ margin: '0 4px', marginBottom: '18px', flex: 1 }} /> : null;
    items.push(<div key={num} style={itemStyle}><div style={innerStyle}>{dotEl}{lblEl}</div>{lineEl}</div>);
  }
  return <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '4px' }}>{items}</div>;
}

// ─── 步骤内容显示组件 ──────────────────────────────────────
function SentenceItem({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <div style={{
      background: 'rgba(212,175,55,0.06)',
      border: '1px solid rgba(212,175,55,0.15)',
      borderRadius: '12px',
      padding: '14px 16px',
      marginBottom: '10px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ color: '#d4af37', fontSize: '12px', fontWeight: 600, flexShrink: 0 }}>{label}</span>
        <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#4ade80' : 'rgba(232,224,200,0.3)', flexShrink: 0 }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
        </button>
      </div>
      <div style={{ color: 'rgba(232,224,200,0.85)', fontSize: '14px', lineHeight: 1.8, whiteSpace: 'pre-wrap', marginTop: '6px' }}>{value}</div>
    </div>
  );
}

// 步骤5解析辅助函数 - 去掉MD格式，保留纯文本
function parseStep5Result(content) {
  const outline = [];
  let essay = '';
  let mode = 'outline'; // 'outline' | 'essay'
  const lines = content.split('\n');
  for (const line of lines) {
    let t = line.trim();
    if (!t) continue;
    
    // 检测范文开始标记
    if (t.includes('范文') || t.includes('正文') || t.includes('【完整范文】') || t.includes('## 完整范文')) {
      mode = 'essay';
      continue;
    }
    
    // 去掉MD格式标记
    t = t.replace(/^#{1,6}\s*/, ''); // 去掉 # 标题
    t = t.replace(/\*\*([^*]+)\*\*/g, '$1'); // 去掉 **bold**
    t = t.replace(/\*([^*]+)\*/g, '$1'); // 去掉 *italic*
    t = t.replace(/`([^`]+)`/g, '$1'); // 去掉 `code`
    t = t.replace(/^[-*+]\s+/, ''); // 去掉列表标记
    t = t.replace(/^\d+\.\s+/, ''); // 去掉数字编号
    
    if (mode === 'outline') outline.push(t);
    else essay += t + '\n';
  }
  return { outline, essay };
}

// ─── 思维导图节点组件 ─────────────────────────────────────
function MindMapNode({ text, isRoot = false, level = 0, color = '#d4af37' }) {
  const bgColor = isRoot 
    ? `linear-gradient(135deg, ${color}, ${color}99)` 
    : `${color}15`;
  const borderColor = isRoot ? color : `${color}40`;
  const textColor = isRoot ? '#0a1628' : 'rgba(232,224,200,0.9)';
  const fontSize = isRoot ? '13px' : '12px';
  const padding = isRoot ? '10px 14px' : '6px 12px';
  const marginLeft = level > 0 ? '16px' : '0';
  const borderRadius = isRoot ? '10px' : '6px';

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius,
      padding,
      marginLeft,
      marginBottom: '6px',
      marginRight: '8px',
      fontSize,
      color: textColor,
      fontWeight: isRoot ? 600 : 400,
      lineHeight: 1.5,
      boxShadow: isRoot ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
    }}>
      {text}
    </div>
  );
}

// ─── 思维导图容器组件 ─────────────────────────────────────
function MindMapView({ title, branches, centerColor = '#d4af37' }) {
  const [expanded, setExpanded] = useState(true);
  
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      {/* 思维导图标题栏 */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: `${centerColor}10`,
          borderBottom: `1px solid ${centerColor}20`,
          cursor: 'pointer',
        }}
      >
        <span style={{ fontSize: '14px' }}>{expanded ? '📂' : '📁'}</span>
        <span style={{ color: centerColor, fontSize: '13px', fontWeight: 600 }}>{title}</span>
        <ChevronRight size={14} style={{ 
          color: 'rgba(232,224,200,0.4)', 
          marginLeft: 'auto',
          transform: expanded ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.2s'
        }} />
      </div>
      
      {/* 思维导图内容 */}
      {expanded && (
        <div style={{ padding: '14px' }}>
          {/* 中心节点 */}
          <div style={{ marginBottom: '10px' }}>
            <MindMapNode text={title.replace('思维导图', '')} isRoot={true} color={centerColor} />
          </div>
          
          {/* 分支 */}
          {branches.map((branch, idx) => (
            <div key={idx} style={{ 
              marginLeft: '8px',
              borderLeft: `2px dashed ${centerColor}30`,
              paddingLeft: '12px',
              marginBottom: '8px',
            }}>
              {/* 分支标签 */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: '6px',
                marginBottom: '4px'
              }}>
                <span style={{ 
                  color: centerColor, 
                  fontSize: '11px', 
                  fontWeight: 600,
                  background: `${centerColor}15`,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}>
                  {branch.label}
                </span>
              </div>
              
              {/* 子节点们 */}
              {Array.isArray(branch.items) ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginLeft: '4px' }}>
                  {branch.items.map((item, i) => (
                    <MindMapNode key={i} text={item} level={1} color={centerColor} />
                  ))}
                </div>
              ) : (
                <div style={{
                  color: 'rgba(232,224,200,0.75)',
                  fontSize: '12px',
                  lineHeight: 1.6,
                  marginLeft: '4px',
                  padding: '8px 10px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: '6px',
                }}>
                  {branch.items}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 解析文本为思维导图数据 ───────────────────────────────
function parseToMindMap(step, content) {
  if (!content) return null;
  
  // 步骤1：可拓建模 - 提取物元/事元/关系元
  if (step === 1) {
    const branches = [];
    
    // 提取物元
    const wuyuanMatch = content.match(/物元[：:]\s*([^#]+?)(?=事元|关系元|分析|总结|$)/gis);
    if (wuyuanMatch) {
      branches.push({
        label: '📦 物元分析',
        items: wuyuanMatch.map(m => m.replace(/物元[：:]\s*/i, '').trim()).filter(Boolean)
      });
    }
    
    // 提取事元
    const shiyuanMatch = content.match(/事元[：:]\s*([^#]+?)(?=物元|关系元|分析|总结|$)/gis);
    if (shiyuanMatch) {
      branches.push({
        label: '⚡ 事元分析',
        items: shiyuanMatch.map(m => m.replace(/事元[：:]\s*/i, '').trim()).filter(Boolean)
      });
    }
    
    // 提取关系元
    const guanxiMatch = content.match(/关系元[：:]\s*([^#]+?)(?=物元|事元|分析|总结|$)/gis);
    if (guanxiMatch) {
      branches.push({
        label: '🔗 关系元分析',
        items: guanxiMatch.map(m => m.replace(/关系元[：:]\s*/i, '').trim()).filter(Boolean)
      });
    }
    
    // 如果没匹配到结构化格式，按段落拆分
    if (branches.length === 0) {
      const lines = content.split('\n').filter(l => l.trim());
      const mainItems = lines.map(l => l.replace(/^[#\d\.\、\：]+/, '').trim()).filter(Boolean);
      branches.push({
        label: '📋 建模要点',
        items: mainItems.slice(0, 6)
      });
    }
    
    return { title: '🔲 可拓建模思维导图', branches, centerColor: '#d4af37' };
  }
  
  // 步骤2：发散树 - 提取多个发散方向
  if (step === 2) {
    const branches = [];
    
    // 按编号或标题提取方向
    const directionMatches = content.match(/[#\d]+[\.、]\s*【?([^】\n]+)】?\s*\n?([^#\n]+?)(?=#|\d+\.|$)/g);
    
    if (directionMatches) {
      directionMatches.forEach((m, i) => {
        const labelMatch = m.match(/[#\d]+[\.、]\s*【?([^】\n]+)】?/);
        const descMatch = m.match(/】?\s*\n?([^\n#]+)/);
        if (labelMatch) {
          branches.push({
            label: labelMatch[1].trim(),
            items: descMatch ? [descMatch[1].trim()] : []
          });
        }
      });
    }
    
    // 如果没匹配到，按段落提取
    if (branches.length === 0) {
      const paras = content.split('\n\n').filter(p => p.trim());
      paras.forEach((p, i) => {
        const lines = p.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const first = lines[0].replace(/^[#\d\.\、]+/, '').trim();
          branches.push({
            label: `方向 ${i + 1}`,
            items: lines.slice(1).map(l => l.replace(/^[•\-\*]+/, '').trim()).filter(Boolean)
          });
        }
      });
    }
    
    // 兜底
    if (branches.length === 0) {
      branches.push({
        label: '💡 发散方向',
        items: content.split('\n').slice(0, 5).map(l => l.replace(/^[#\d\.\、]+/, '').trim()).filter(Boolean)
      });
    }
    
    return { title: '🌳 发散树思维导图', branches, centerColor: '#4ade80' };
  }
  
  // 步骤3：共轭分析 - 虚实/软硬/潜显/负正
  if (step === 3) {
    const branches = [];
    const patterns = [
      { key: '虚与实', icon: '👻', regex: /虚[与和]实[^：：]*[：:]\s*([^#]+)/gi },
      { key: '软与硬', icon: '🛡️', regex: /软[与和]硬[^：：]*[：:]\s*([^#]+)/gi },
      { key: '潜与显', icon: '🔮', regex: /潜[与和]显[^：：]*[：:]\s*([^#]+)/gi },
      { key: '负与正', icon: '⚖️', regex: /负[与和]正[^：：]*[：:]\s*([^#]+)/gi },
    ];
    
    patterns.forEach(p => {
      const match = content.match(p.regex);
      if (match && match[0]) {
        branches.push({
          label: `${p.icon} ${p.key}`,
          items: [match[0].replace(/[^：：]+[：:]\s*/, '').trim()]
        });
      }
    });
    
    if (branches.length === 0) {
      // 按段落提取
      const paras = content.split('\n').filter(l => l.trim() && l.includes('：'));
      paras.slice(0, 4).forEach(p => {
        const [key, ...vals] = p.split('：');
        if (key && vals.length) {
          branches.push({
            label: key.trim(),
            items: [vals.join('：').trim()]
          });
        }
      });
    }
    
    if (branches.length === 0) {
      branches.push({
        label: '🔍 共轭分析',
        items: content.split('\n').slice(0, 4).map(l => l.replace(/^[#\d\.\、]+/, '').trim()).filter(Boolean)
      });
    }
    
    return { title: '🔍 共轭部思维导图', branches, centerColor: '#60a5fa' };
  }
  
  // 步骤4：可拓变换 - 替换/增删/拆合/传导
  if (step === 4) {
    const branches = [];
    const patterns = [
      { key: '替换变换', icon: '🔄', regex: /替换[^：：]*[：:]\s*([^#]+?)(?=增删|拆合|传导|$)/gis },
      { key: '增删变换', icon: '➕', regex: /增删[^：：]*[：:]\s*([^#]+?)(?=替换|拆合|传导|$)/gis },
      { key: '拆合变换', icon: '🔗', regex: /拆合[^：：]*[：:]\s*([^#]+?)(?=替换|增删|传导|$)/gis },
      { key: '传导变换', icon: '⚡', regex: /传导[^：：]*[：:]\s*([^#]+?)(?=替换|增删|拆合|$)/gis },
    ];
    
    patterns.forEach(p => {
      const match = content.match(p.regex);
      if (match && match[0]) {
        branches.push({
          label: `${p.icon} ${p.key}`,
          items: [match[0].replace(/[^：：]+[：:]\s*/, '').trim()]
        });
      }
    });
    
    if (branches.length === 0) {
      branches.push({
        label: '🔄 变换策略',
        items: content.split('\n').slice(0, 4).map(l => l.replace(/^[#\d\.\、]+/, '').trim()).filter(Boolean)
      });
    }
    
    return { title: '🔄 可拓变换思维导图', branches, centerColor: '#fb923c' };
  }
  
  return null;
}

// ─── 步骤结果展示 ──────────────────────────────────────────
function StepResult({ step, content }) {
  if (!content) return null;

  // 尝试解析为思维导图
  const mindMapData = parseToMindMap(step, content);
  
  if (mindMapData) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <MindMapView 
          title={mindMapData.title} 
          branches={mindMapData.branches}
          centerColor={mindMapData.centerColor}
        />
        
        {/* 保留原始文本供复制 */}
        <details style={{ marginTop: '10px' }}>
          <summary style={{ 
            color: 'rgba(232,224,200,0.4)', 
            fontSize: '11px', 
            cursor: 'pointer',
            padding: '4px 0'
          }}>
            📄 查看原文
          </summary>
          <div style={{
            marginTop: '8px',
            padding: '10px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            fontSize: '12px',
            color: 'rgba(232,224,200,0.6)',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.7,
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            {content}
          </div>
        </details>
      </div>
    );
  }

  // 步骤5：直接显示完整作文，去掉所有小标题
  if (step === 5) {
    // 去掉所有MD格式标记，输出纯文本
    const pureText = content
      .replace(/^#{1,6}\s+/gm, '')  // 去掉 # 标题
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // 去掉 **bold**
      .replace(/\*([^*]+)\*/g, '$1')  // 去掉 *italic*
      .replace(/`([^`]+)`/g, '$1')  // 去掉 `code`
      .replace(/^[-*+]\s+/gm, '')  // 去掉列表标记
      .replace(/^\d+\.\s+/gm, '')  // 去掉数字编号
      .replace(/【[^】]+】/g, '')  // 去掉方框标题如【写作大纲】
      .replace(/\n{3,}/g, '\n\n')  // 压缩多余空行
      .trim();
    
    return (
      <SentenceItem key="essay" label="完整作文" value={pureText} />
    );
  }

  return <SentenceItem label={`步骤 ${step} 结果`} value={content} />;
}

// ─── 模块一：可拓写作应用 ──────────────────────────────────
function ModuleWritingApp({ onIncrementEssays }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [cacheMap, setCacheMap] = useState({});
  const [activeFilter, setActiveFilter] = useState('全部');
  const [isPaused, setIsPaused] = useState(false);

  // 分类筛选
  const filters = ['全部', '记叙文', '写人记叙文', '写景抒情', '议论文', '抒情散文', '叙事散文'];
  
  // 分类颜色映射
  const categoryColors = {
    '记叙文': { bg: 'rgba(59,130,246,0.15)', border: 'rgba(59,130,246,0.4)', text: '#60a5fa' },
    '写人记叙文': { bg: 'rgba(168,85,247,0.15)', border: 'rgba(168,85,247,0.4)', text: '#c084fc' },
    '写景抒情': { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.4)', text: '#4ade80' },
    '议论文': { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171' },
    '抒情散文': { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', text: '#fbbf24' },
    '叙事散文': { bg: 'rgba(20,184,166,0.15)', border: 'rgba(20,184,166,0.4)', text: '#2dd4bf' },
    '议论文/记叙文': { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', text: '#f87171' },
  };

  // 加载时读取所有缓存
  useEffect(() => {
    const map = {};
    EXAM_TOPICS.forEach(t => {
      const cached = loadCache(`topic_${t.id}`);
      if (cached) map[t.id] = cached;
    });
    setCacheMap(map);
  }, []);

  // 筛选后的题目
  const filteredTopics = activeFilter === '全部' 
    ? EXAM_TOPICS 
    : EXAM_TOPICS.filter(t => t.category === activeFilter || t.category.includes(activeFilter));

  const selectTopic = (topic) => {
    setSelectedTopic(topic);
    setError('');
    const cached = loadCache(`topic_${topic.id}`);
    if (cached) {
      setResults(cached.results || {});
      setCurrentStep(cached.currentStep || 1);
    } else {
      setResults({});
      setCurrentStep(1);
    }
  };

  const saveResults = (topicId, res, step) => {
    const data = { results: res, currentStep: step };
    saveCache(`topic_${topicId}`, data);
    setCacheMap(prev => ({ ...prev, [topicId]: data }));
  };

  const startAnalysis = async () => {
    if (!selectedTopic) { setError('请先选择一个题目'); return; }
    setError('');
    setResults({});
    setCurrentStep(1);
    setLoading(true);
    setLoadingStep(1);
    setIsPaused(false);
    try {
      const step = FIVE_STEPS[0];
      const systemMsg = { role: 'system', content: API_CONFIG.systemPrompt };
      const userMsg = { role: 'user', content: step.prompt(selectedTopic.title) };
      const result = await callAI([systemMsg, userMsg]);
      if (isPaused) return;
      setResults({ 1: result });
      saveResults(selectedTopic.id, { 1: result }, 1);
      setLoadingStep(null);
    } catch (e) {
      setError('AI 生成失败：' + e.message);
      setLoadingStep(null);
    }
    setLoading(false);
  };

  const pauseAnalysis = () => {
    setIsPaused(true);
    setLoading(false);
    setLoadingStep(null);
  };

  const runStep = async (stepNum) => {
    setLoadingStep(stepNum);
    setError('');
    try {
      const step = FIVE_STEPS[stepNum - 1];
      const prevResults = Object.entries(results).map(([k, v]) => `${FIVE_STEPS[parseInt(k) - 1].name}结果：\n${v}`).join('\n\n');
      const systemMsg = { role: 'system', content: API_CONFIG.systemPrompt };
      const userMsg = { role: 'user', content: `${prevResults}\n\n${'─'.repeat(20)}\n\n${step.prompt(selectedTopic.title)}` };
      const result = await callAI([systemMsg, userMsg]);
      const newResults = { ...results, [stepNum]: result };
      setResults(newResults);
      setCurrentStep(stepNum);
      saveResults(selectedTopic.id, newResults, stepNum);
      if (stepNum === 5) onIncrementEssays();
    } catch (e) {
      setError('AI 生成失败：' + e.message);
    }
    setLoadingStep(null);
  };

  const copyAll = () => {
    const text = Object.entries(results)
      .sort(([a], [b]) => a - b)
      .map(([k, v]) => `${FIVE_STEPS[parseInt(k) - 1].name}：\n${v}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId('all');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const allDone = results[5] !== undefined;
  const hasAnyResults = Object.keys(results).length > 0;

  // 星级组件
  const StarRating = ({ level }) => {
    const stars = level === '★★★' ? 3 : level === '★★☆' ? 2 : 1;
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3].map(i => (
          <span key={i} style={{ 
            color: i <= stars ? '#f59e0b' : 'rgba(255,255,255,0.15)',
            fontSize: '10px'
          }}>★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="module-section">
      {/* 顶部标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ color: '#d4af37', fontSize: '18px', marginBottom: '4px', fontWeight: 700 }}>
            📚 可拓写作应用
          </h3>
          <p style={{ color: 'rgba(232,224,200,0.4)', fontSize: '12px' }}>
            选择真题，AI 五步逐步分析 · 思维导图呈现
          </p>
        </div>
      </div>

      {/* 筛选标签栏 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            style={{
              padding: '6px 14px', borderRadius: '20px',
              border: `1px solid ${activeFilter === filter ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: activeFilter === filter ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.02)',
              color: activeFilter === filter ? '#d4af37' : 'rgba(232,224,200,0.5)',
              fontSize: '12px', cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* 题目卡片网格 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {filteredTopics.map(topic => {
          const isSelected = selectedTopic?.id === topic.id;
          const hasCache = !!cacheMap[topic.id];
          const stepCount = cacheMap[topic.id]?.results ? Object.keys(cacheMap[topic.id].results).length : 0;
          const catColor = categoryColors[topic.category] || { bg: 'rgba(212,175,55,0.1)', border: 'rgba(212,175,55,0.3)', text: '#d4af37' };
          
          return (
            <button
              key={topic.id}
              onClick={() => selectTopic(topic)}
              style={{
                padding: '14px',
                borderRadius: '12px',
                border: `1px solid ${isSelected ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.06)'}`,
                background: isSelected 
                  ? 'linear-gradient(135deg, rgba(212,175,55,0.15), rgba(212,175,55,0.05))' 
                  : 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                transition: 'all 0.25s',
                textAlign: 'left',
                position: 'relative',
                boxShadow: isSelected ? '0 4px 20px rgba(212,175,55,0.15)' : 'none',
              }}
            >
              {/* 顶部：星级 + 缓存状态 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <StarRating level={topic.difficulty} />
                {hasCache && (
                  <span style={{ 
                    fontSize: '10px', color: '#4ade80', 
                    background: 'rgba(74,222,128,0.1)', 
                    border: '1px solid rgba(74,222,128,0.3)',
                    padding: '2px 6px', borderRadius: '10px'
                  }}>已分析 {stepCount}/5</span>
                )}
              </div>
              
              {/* 标题 */}
              <div style={{ color: 'rgba(232,224,200,0.95)', fontSize: '13px', fontWeight: 700, marginBottom: '6px', lineHeight: 1.4 }}>
                {topic.title}
              </div>
              
              {/* 分类标签 */}
              <div style={{ marginBottom: '8px' }}>
                <span style={{
                  fontSize: '10px', fontWeight: 600,
                  background: catColor.bg, border: `1px solid ${catColor.border}`,
                  color: catColor.text, padding: '2px 8px', borderRadius: '10px'
                }}>
                  {topic.category}
                </span>
              </div>
              
              {/* 提示语 */}
              <div style={{ color: 'rgba(232,224,200,0.4)', fontSize: '11px', lineHeight: 1.4, marginBottom: '10px' }}>
                💡 {topic.hint.slice(0, 30)}...
              </div>
              
              {/* 底部：年级标签 */}
              <div style={{ 
                display: 'flex', gap: '4px', paddingTop: '8px',
                borderTop: '1px solid rgba(255,255,255,0.05)'
              }}>
                <span style={{ fontSize: '10px', color: 'rgba(232,224,200,0.35)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  {topic.grade}
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(232,224,200,0.35)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                  可拓五步法
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 选中题目操作区 */}
      {selectedTopic && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.1), rgba(212,175,55,0.03))',
          border: '1px solid rgba(212,175,55,0.25)',
          borderRadius: '16px', padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.4)',
                  color: '#d4af37', padding: '2px 10px', borderRadius: '10px'
                }}>
                  {selectedTopic.category}
                </span>
                <span style={{ color: '#d4af37', fontSize: '17px', fontWeight: 700 }}>
                  {selectedTopic.title}
                </span>
              </div>
              <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '12px', lineHeight: 1.5 }}>
                💡 {selectedTopic.hint}
              </div>
            </div>
            <button
              className="btn-gold"
              onClick={startAnalysis}
              disabled={loading}
              style={{ flexShrink: 0, whiteSpace: 'nowrap', padding: '10px 20px' }}
            >
              {loading ? <><Loader2 size={14} className="spin" /> 生成中...</> : <><Sparkles size={14} /> {hasAnyResults ? '重新生成' : '开始分析'}</>}
            </button>
          </div>

          {/* 进度指示 */}
          {hasAnyResults && (
            <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <StepProgress currentStep={currentStep} />
            </div>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px', padding: '12px 16px',
          color: '#f87171', fontSize: '13px', marginBottom: '16px', whiteSpace: 'pre-wrap'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 加载中 + 暂停按钮 */}
      {loading && (
        <div style={{
          background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.15)',
          borderRadius: '12px', padding: '20px', textAlign: 'center',
          color: 'rgba(232,224,200,0.5)', fontSize: '13px', marginBottom: '16px'
        }}>
          <Loader2 size={20} className="spin" style={{ marginBottom: '8px' }} />
          <div>AI 分析中，请稍候...</div>
          <button
            onClick={pauseAnalysis}
            style={{
              marginTop: '12px',
              padding: '6px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px',
              color: '#f87171',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ⏸️ 暂停分析
          </button>
        </div>
      )}

      {/* 步骤结果 */}
      {hasAnyResults && (
        <>
          {/* 控制栏 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {allDone && (
              <button onClick={copyAll} style={{
                marginLeft: 'auto', padding: '6px 14px', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.12)',
                background: copiedId === 'all' ? 'rgba(74,222,128,0.15)' : 'transparent',
                color: copiedId === 'all' ? '#4ade80' : 'rgba(232,224,200,0.4)',
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                {copiedId === 'all' ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制全部</>}
              </button>
            )}
          </div>

          {/* 步骤内容 */}
          {Object.entries(results).sort(([a], [b]) => a - b).map(([stepNum, content]) => {
            const stepInfo = FIVE_STEPS[parseInt(stepNum) - 1];
            return (
              <div key={stepNum} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d4af37, #b8932e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0a1628', fontSize: '11px', fontWeight: 700, flexShrink: 0
                  }}>{stepNum}</div>
                  <span style={{ color: '#d4af37', fontSize: '13px', fontWeight: 600 }}>{stepInfo.name}</span>
                  <span style={{ color: 'rgba(232,224,200,0.35)', fontSize: '11px' }}>{stepInfo.desc}</span>
                </div>
                <StepResult step={parseInt(stepNum)} content={content} />
              </div>
            );
          })}

          {/* 步骤按钮 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {[1, 2, 3, 4, 5].map(n => {
              const done = results[n] !== undefined;
              const isLoading = loadingStep === n;
              return (
                <button
                  key={n}
                  onClick={() => !done && !loading && runStep(n)}
                  disabled={done || isLoading}
                  style={{
                    padding: '6px 14px', borderRadius: '20px',
                    border: `1px solid ${done ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    background: done ? 'rgba(74,222,128,0.08)' : 'rgba(255,255,255,0.03)',
                    color: done ? '#4ade80' : 'rgba(232,224,200,0.4)',
                    fontSize: '12px', cursor: done || isLoading ? 'default' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '5px'
                  }}
                >
                  {isLoading ? <><Loader2 size={11} className="spin" />...</> : done ? <><Check size={11} /> {FIVE_STEPS[n-1].name}</> : <><ChevronRight size={11} /> {FIVE_STEPS[n-1].name}</>}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 底部版权信息 */}
      <div style={{ 
        textAlign: 'center', marginTop: '30px', paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: 'rgba(232,224,200,0.25)', fontSize: '11px'
      }}>
        版权课程 © 2024 广州可拓学信息科技有限公司
      </div>
    </div>
  );
}

// ─── 示例题目列表（带唯一ID用于缓存）────────────────────
const SAMPLE_TOPICS = [
  { id: 'sample_1', title: '《我最敬佩的老师》', type: '命题', hint: '写一位对你影响深刻的老师' },
  { id: 'sample_2', title: '《家乡的变化》', type: '命题', hint: '描写家乡在时代变迁中的变化' },
  { id: 'sample_3', title: '《勇气》', type: '命题', hint: '围绕"勇气"这一主题展开' },
  { id: 'sample_4', title: '《一次难忘的旅行》', type: '命题', hint: '记叙一次印象深刻的旅行经历' },
  { id: 'sample_5', title: '材料作文：人工智能', type: '材料', hint: '阅读材料，自选角度写作：随着AI技术的发展，人类生活的方方面面都在发生变化。有人担忧AI会取代人类工作，有人认为AI将帮助人类更好地生活。请结合你的经历和思考，写一篇作文。' },
  { id: 'sample_6', title: '材料作文：挫折与成长', type: '材料', hint: '阅读材料，自选角度写作：种子破土而出需要克服土壤的阻力，蝴蝶破茧需要经历痛苦的挣扎。人的成长也是如此，没有经历过挫折的人难以真正强大。请以"挫折"为话题，写一篇作文。' },
  { id: 'sample_7', title: '材料作文：传承与创新', type: '材料', hint: '阅读材料，自选角度写作：故宫博物院院长说："文物不能只放在博物馆里，要让它们活在当下。"在传承中华优秀传统文化的同时，如何让它焕发新的生机？请写一篇作文。' },
];

function ModuleCustomTopic({ onIncrementEssays, onTopicAnalyzed }) {
  const [topic, setTopic] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTopicId, setCurrentTopicId] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  // 加载示例题目缓存
  const [sampleCache, setSampleCache] = useState(() => {
    const map = {};
    SAMPLE_TOPICS.forEach(t => {
      const cached = loadCache(`sample_${t.id}`);
      if (cached) map[t.id] = cached;
    });
    return map;
  });

  // 判断示例题目是否有缓存
  const hasSampleCache = (sampleId) => !!sampleCache[sampleId];

  // 获取示例题目缓存步骤数
  const getSampleCacheSteps = (sampleId) => {
    const cached = sampleCache[sampleId];
    return cached ? Object.keys(cached.results || {}).length : 0;
  };

  // 保存到我的题库
  const saveToMyBank = (topicId, title, results) => {
    const entry = {
      id: topicId,
      title: title,
      results: results,
      analyzedAt: new Date().toLocaleString('zh-CN'),
      stepCount: Object.keys(results).length,
    };
    try {
      const bank = JSON.parse(localStorage.getItem('ketuo_my_bank') || '[]');
      // 检查是否已存在，存在则更新
      const existIdx = bank.findIndex(e => e.id === topicId);
      if (existIdx >= 0) {
        bank[existIdx] = entry;
      } else {
        bank.unshift(entry); // 新增放最前面
      }
      // 最多保存50条
      if (bank.length > 50) bank.pop();
      localStorage.setItem('ketuo_my_bank', JSON.stringify(bank));
      // 通知主应用更新题库
      if (onTopicAnalyzed) onTopicAnalyzed();
    } catch {}
  };

  const startAnalysis = async (selectedTitle, sampleId = null) => {
    const title = selectedTitle || topic;
    if (!title.trim()) { setError('请输入写作题目'); return; }
    setError('');
    
    // 生成题目ID（示例题用sampleId，自定义题用时间戳）
    const topicId = sampleId || `custom_${Date.now()}`;
    
    // 如果是示例题目且有缓存，加载缓存
    if (sampleId && sampleCache[sampleId]) {
      setIsFromCache(true);
      setCurrentTopicId(topicId);
      setResults(sampleCache[sampleId].results || {});
      setCurrentStep(sampleCache[sampleId].currentStep || 1);
      setTopic(title);
      saveToMyBank(topicId, title, sampleCache[sampleId].results || {});
      return;
    }
    
    // 清除缓存标记
    setIsFromCache(false);
    setCurrentTopicId(topicId);
    setTopic(title);
    setResults({});
    setCurrentStep(1);
    setLoading(true);
    setLoadingStep(1);
    setIsPaused(false);
    
    try {
      // 步骤1：可拓建模
      const step1 = FIVE_STEPS[0];
      const systemMsg = { role: 'system', content: API_CONFIG.systemPrompt };
      const userMsg = { role: 'user', content: step1.prompt(title) };
      const result1 = await callAI([systemMsg, userMsg]);
      const newResults = { 1: result1 };
      setResults(newResults);
      setCurrentStep(1);
      
      // 保存到我的题库
      saveToMyBank(topicId, title, newResults);
      
      if (isPaused) return;
      
      // 步骤2：发散树（基于步骤1的建模结果）
      setLoadingStep(2);
      const step2 = FIVE_STEPS[1];
      const userMsg2 = { role: 'user', content: `${FIVE_STEPS[0].name}结果：\n${result1}\n\n${'─'.repeat(20)}\n\n${step2.prompt(title)}` };
      const result2 = await callAI([systemMsg, userMsg2]);
      newResults[2] = result2;
      setResults({ ...newResults });
      setCurrentStep(2);
      saveToMyBank(topicId, title, newResults);
      
      if (isPaused) return;
      
      // 步骤3：共轭分析
      setLoadingStep(3);
      const step3 = FIVE_STEPS[2];
      const userMsg3 = { role: 'user', content: `${FIVE_STEPS[0].name}结果：\n${result1}\n\n${FIVE_STEPS[1].name}结果：\n${result2}\n\n${'─'.repeat(20)}\n\n${step3.prompt(title)}` };
      const result3 = await callAI([systemMsg, userMsg3]);
      newResults[3] = result3;
      setResults({ ...newResults });
      setCurrentStep(3);
      saveToMyBank(topicId, title, newResults);
      
      if (isPaused) return;
      
      // 步骤4：可拓变换
      setLoadingStep(4);
      const step4 = FIVE_STEPS[3];
      const userMsg4 = { role: 'user', content: `${FIVE_STEPS[0].name}结果：\n${result1}\n\n${FIVE_STEPS[1].name}结果：\n${result2}\n\n${FIVE_STEPS[2].name}结果：\n${result3}\n\n${'─'.repeat(20)}\n\n${step4.prompt(title)}` };
      const result4 = await callAI([systemMsg, userMsg4]);
      newResults[4] = result4;
      setResults({ ...newResults });
      setCurrentStep(4);
      saveToMyBank(topicId, title, newResults);
      
      if (isPaused) return;
      
      // 步骤5：成文
      setLoadingStep(5);
      const step5 = FIVE_STEPS[4];
      const userMsg5 = { role: 'user', content: `${FIVE_STEPS[0].name}结果：\n${result1}\n\n${FIVE_STEPS[1].name}结果：\n${result2}\n\n${FIVE_STEPS[2].name}结果：\n${result3}\n\n${FIVE_STEPS[3].name}结果：\n${result4}\n\n${'─'.repeat(20)}\n\n${step5.prompt(title)}` };
      const result5 = await callAI([systemMsg, userMsg5]);
      newResults[5] = result5;
      setResults({ ...newResults });
      setCurrentStep(5);
      saveToMyBank(topicId, title, newResults);
      
      // 如果是示例题目，同时保存到示例题缓存
      if (sampleId) {
        saveCache(`sample_${sampleId}`, { results: newResults, currentStep: 5 });
        setSampleCache(prev => ({ ...prev, [sampleId]: { results: newResults, currentStep: 5 } }));
      }
      
      onIncrementEssays();
    } catch (e) {
      setError('AI 生成失败：' + e.message);
    }
    setLoading(false);
    setLoadingStep(null);
  };

  const handleTopicClick = (item) => {
    setTopic(item.title);
    startAnalysis(item.title, item.id);
  };

  const pauseAnalysis = () => {
    setIsPaused(true);
    setLoading(false);
    setLoadingStep(null);
  };

  const copyAll = () => {
    const text = Object.entries(results)
      .sort(([a], [b]) => a - b)
      .map(([k, v]) => `${FIVE_STEPS[parseInt(k) - 1].name}：\n${v}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId('all');
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const hasAnyResults = Object.keys(results).length > 0;
  const allDone = results[5] !== undefined;

  return (
    <div className="module-section">
      {/* 页面标题 */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: '#d4af37', fontSize: '20px', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎭</span> 自定义主题分析
        </h3>
        <p style={{ color: 'rgba(232,224,200,0.5)', fontSize: '13px' }}>
          输入任意写作题目，AI 五步逐步分析 · 思维导图呈现
        </p>
      </div>

      {/* 主输入卡片 */}
      <div style={{
        background: 'rgba(20, 30, 50, 0.6)',
        border: '1px solid rgba(212, 175, 55, 0.2)',
        borderRadius: '16px',
        padding: '28px 32px',
        marginBottom: '20px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h4 style={{ color: '#d4af37', fontSize: '18px', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span>🎭</span> 自定义写作主题
          </h4>
          <p style={{ color: 'rgba(232,224,200,0.45)', fontSize: '12px' }}>
            输入任意写作题目，AI 运用可拓学五步法为你分析
          </p>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <textarea
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="输入写作题目，例如：《我最敬佩的一个人》或粘贴材料作文的材料..."
            rows={3}
            style={{
              width: '100%',
              padding: '14px 18px',
              background: 'rgba(10, 15, 25, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#e8e0c8',
              fontSize: '14px',
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.6,
              transition: 'all 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(212, 175, 55, 0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => startAnalysis()}
            disabled={loading || !topic.trim()}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #d4af37, #b8932e)',
              border: 'none',
              borderRadius: '8px',
              color: '#0a1628',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading || !topic.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !topic.trim() ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
            }}
          >
            {loading ? <><Loader2 size={14} className="spin" /> 分析中...</> : <><Sparkles size={14} /> 开始分析</>}
          </button>
        </div>
      </div>

      {/* 示例题目 */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <span style={{ color: '#d4af37', fontSize: '12px' }}>💡</span>
          <span style={{ color: 'rgba(232,224,200,0.5)', fontSize: '12px' }}>示例题目（点击即可分析）</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SAMPLE_TOPICS.map((item, idx) => {
            const cached = hasSampleCache(item.id);
            const stepCount = getSampleCacheSteps(item.id);
            const isCurrentlyLoaded = currentTopicId === item.id && (Object.keys(results).length > 0 || isFromCache);
            
            return (
              <button
                key={idx}
                onClick={() => handleTopicClick(item)}
                style={{
                  padding: '12px 16px',
                  background: isCurrentlyLoaded 
                    ? 'rgba(212, 175, 55, 0.12)' 
                    : cached 
                      ? 'rgba(74, 222, 128, 0.08)' 
                      : 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${isCurrentlyLoaded ? 'rgba(212, 175, 55, 0.4)' : cached ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.08)'}`,
                  borderRadius: '12px',
                  color: 'rgba(232, 224, 200, 0.7)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!isCurrentlyLoaded) {
                    e.currentTarget.style.background = 'rgba(212, 175, 55, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.3)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isCurrentlyLoaded) {
                    e.currentTarget.style.background = cached ? 'rgba(74, 222, 128, 0.08)' : 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = cached ? 'rgba(74, 222, 128, 0.3)' : 'rgba(255, 255, 255, 0.08)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '10px', padding: '2px 8px', borderRadius: '8px',
                    background: item.type === '材料' ? 'rgba(168,85,247,0.2)' : 'rgba(59,130,246,0.2)',
                    color: item.type === '材料' ? '#c084fc' : '#60a5fa',
                  }}>
                    {item.type}
                  </span>
                  <span style={{ color: '#d4af37', fontWeight: 600 }}>{item.title}</span>
                  {cached && (
                    <span style={{
                      fontSize: '10px', padding: '2px 6px', borderRadius: '8px',
                      background: 'rgba(74, 222, 128, 0.15)',
                      color: '#4ade80',
                      marginLeft: 'auto',
                    }}>
                      已分析 {stepCount}/5
                    </span>
                  )}
                  {isCurrentlyLoaded && (
                    <span style={{
                      fontSize: '10px', padding: '2px 6px', borderRadius: '8px',
                      background: 'rgba(212, 175, 55, 0.2)',
                      color: '#d4af37',
                      marginLeft: 'auto',
                    }}>
                      ✓ 查看中
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(232,224,200,0.4)', lineHeight: 1.4 }}>
                  {item.hint}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '10px', padding: '12px 16px',
          color: '#f87171', fontSize: '13px', marginBottom: '16px', whiteSpace: 'pre-wrap'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* 加载中 + 暂停按钮 */}
      {loading && (
        <div style={{
          background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.12)',
          borderRadius: '12px', padding: '20px', textAlign: 'center',
          color: 'rgba(232,224,200,0.5)', fontSize: '13px', marginBottom: '16px'
        }}>
          <Loader2 size={20} className="spin" style={{ marginBottom: '8px' }} />
          <div>AI 正在分析第 {loadingStep} 步：{FIVE_STEPS[(loadingStep || 1) - 1]?.name}...</div>
          <button
            onClick={pauseAnalysis}
            style={{
              marginTop: '12px',
              padding: '6px 16px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px',
              color: '#f87171',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            ⏸️ 暂停分析
          </button>
        </div>
      )}

      {/* 从缓存加载提示 */}
      {isFromCache && !loading && (
        <div style={{
          background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: '12px', padding: '12px 16px',
          color: '#4ade80', fontSize: '13px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <Check size={14} />
          <span>已从缓存加载分析结果，无需重新生成</span>
        </div>
      )}

      {/* 进度指示 */}
      {hasAnyResults && (
        <div style={{
          background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
          borderRadius: '12px', padding: '16px', marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#d4af37', fontSize: '13px', fontWeight: 600 }}>📊 分析进度</span>
            {allDone && (
              <button onClick={copyAll} style={{
                padding: '4px 12px', borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: copiedId === 'all' ? 'rgba(74,222,128,0.12)' : 'transparent',
                color: copiedId === 'all' ? '#4ade80' : 'rgba(232,224,200,0.4)',
                fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                {copiedId === 'all' ? <><Check size={12} /> 已复制</> : <><Copy size={12} /> 复制全部</>}
              </button>
            )}
          </div>
          <StepProgress currentStep={currentStep} />
        </div>
      )}

      {/* 步骤结果 - 思维导图展示 */}
      {hasAnyResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(results).sort(([a], [b]) => a - b).map(([stepNum, content]) => {
            const stepInfo = FIVE_STEPS[parseInt(stepNum) - 1];
            return (
              <div key={stepNum} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #d4af37, #b8932e)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#0a1628', fontSize: '11px', fontWeight: 700, flexShrink: 0
                  }}>{stepNum}</div>
                  <span style={{ color: '#d4af37', fontSize: '13px', fontWeight: 600 }}>{stepInfo.name}</span>
                  <span style={{ color: 'rgba(232,224,200,0.35)', fontSize: '11px' }}>{stepInfo.desc}</span>
                </div>
                <StepResult step={parseInt(stepNum)} content={content} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── 模块三：写作素材库 ────────────────────────────────────
function ModuleMaterials() {
  const [activeTab, setActiveTab] = useState('materials');
  const [expandedKey, setExpandedKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const copy = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const tabs = [
    { id: 'keys', label: '🔑 五把钥匙', icon: <Compass size={14} /> },
    { id: 'materials', label: '📖 素材积累', icon: <BookMarked size={14} /> },
    { id: 'frameworks', label: '🧱 逻辑框架', icon: <Layers size={14} /> },
    { id: 'sentences', label: '✨ 写作金句', icon: <Sparkles size={14} /> },
    { id: 'yuan', label: '🔮 基元特征库', icon: <Cpu size={14} /> },
  ];

  return (
    <div className="module-section">
      {/* 标签切换 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '7px 14px', borderRadius: '20px',
              border: `1px solid ${activeTab === tab.id ? 'rgba(212,175,55,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: activeTab === tab.id ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeTab === tab.id ? '#d4af37' : 'rgba(232,224,200,0.45)',
              fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            {tab.icon} {tab.label.replace(/^[^\s]+\s/, '')}
          </button>
        ))}
      </div>

      {/* 素材积累 - 名人事迹 */}
      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 名人事迹 */}
          <div>
            <h4 style={{ color: '#d4af37', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>👤 名人事迹</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {MATERIALS.famousPeople.map(group => (
                <div key={group.name}>
                  <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>{group.icon} {group.name}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '8px' }}>
                    {group.items.map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '12px', padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = 'rgba(212,175,55,0.05)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ color: '#d4af37', fontSize: '13px', fontWeight: 600 }}>{item.title}</span>
                          <button onClick={() => copy(`${item.title}：${item.desc}`, `fam-${group.name}-${i}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === `fam-${group.name}-${i}` ? '#4ade80' : 'rgba(232,224,200,0.25)', flexShrink: 0 }}>
                            {copiedId === `fam-${group.name}-${i}` ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        </div>
                        <p style={{ color: 'rgba(232,224,200,0.6)', fontSize: '12px', lineHeight: 1.5, marginTop: '4px' }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 历史事件 */}
          <div>
            <h4 style={{ color: '#d4af37', fontSize: '14px', marginBottom: '12px', fontWeight: 600 }}>🏛️ 历史事件</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {MATERIALS.historicalEvents.map(group => (
                <div key={group.name}>
                  <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '12px', marginBottom: '8px', fontWeight: 500 }}>{group.icon} {group.name}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.items.map((item, i) => (
                      <div key={i} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        borderRadius: '12px', padding: '12px 14px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                      }}>
                        <div>
                          <span style={{ color: '#d4af37', fontSize: '13px', fontWeight: 600 }}>{item.title}</span>
                          <p style={{ color: 'rgba(232,224,200,0.5)', fontSize: '11px', marginTop: '2px' }}>{item.desc}</p>
                        </div>
                        <button onClick={() => copy(`${item.title}：${item.desc}`, `evt-${group.name}-${i}`)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === `evt-${group.name}-${i}` ? '#4ade80' : 'rgba(232,224,200,0.25)', flexShrink: 0 }}>
                          {copiedId === `evt-${group.name}-${i}` ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 基元特征库 */}
      {activeTab === 'yuan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* 物元特征 - 按类型分类 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '20px' }}>🔲</span>
              <h4 style={{ color: '#d4af37', fontSize: '15px', fontWeight: 600 }}>物元特征维度</h4>
              <span style={{ fontSize: '11px', color: 'rgba(232,224,200,0.4)', marginLeft: '8px' }}>（按观察对象分类）</span>
            </div>
            
            {/* 人物特征 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>👤</span>
                <span style={{ color: '#f472b6', fontSize: '13px', fontWeight: 600 }}>人物特征</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {[
                  { name: '外貌特征', desc: '脸型、眉眼、肤色、发型、身材' },
                  { name: '语言特征', desc: '声音特点、语气、口头禅、说话方式' },
                  { name: '性格特征', desc: '内向/外向、细心/粗犷、温和/严厉' },
                  { name: '情感特征', desc: '喜、怒、哀、乐的表达方式' },
                  { name: '身份特征', desc: '姓名/别名、年龄、出生地、职业、职务' },
                  { name: '特长特征', desc: '技能、才艺、能力、兴趣爱好' },
                  { name: '象征特征', desc: '代表什么品质、精神、意义' },
                  { name: '价值观特征', desc: '人生追求、信念、道德准则' },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: 'rgba(244,114,182,0.06)',
                    border: '1px solid rgba(244,114,182,0.18)',
                    borderRadius: '12px', padding: '12px'
                  }}>
                    <div style={{ color: '#f472b6', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{f.name}</div>
                    <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '11px', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 动物特征 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>🐾</span>
                <span style={{ color: '#a78bfa', fontSize: '13px', fontWeight: 600 }}>动物特征</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {[
                  { name: '外形特征', desc: '体型、毛色、眼睛、尾巴、爪子' },
                  { name: '习性特征', desc: '食性、栖息地、活动时间、栖息方式' },
                  { name: '情感特征', desc: '忠诚、勇猛、温和、警觉的表达' },
                  { name: '象征特征', desc: '象征什么（狼=团队、鹰=志向）' },
                  { name: '关系特征', desc: '与人类关系、驯化程度' },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: 'rgba(167,139,250,0.06)',
                    border: '1px solid rgba(167,139,250,0.18)',
                    borderRadius: '12px', padding: '12px'
                  }}>
                    <div style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{f.name}</div>
                    <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '11px', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 植物特征 */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>🌱</span>
                <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: 600 }}>植物特征</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {[
                  { name: '外形特征', desc: '高度、叶片形状、花朵、果实、根茎' },
                  { name: '色彩特征', desc: '叶绿、花色、果色的丰富变化' },
                  { name: '气味特征', desc: '花香、草香、木香的特殊气味' },
                  { name: '质感特征', desc: '光滑/粗糙、柔软/坚硬、湿润/干燥' },
                  { name: '生长特征', desc: '季节变化、生长周期、枯荣规律' },
                  { name: '象征特征', desc: '梅=坚韧、莲=纯洁、松=长寿' },
                  { name: '情感特征', desc: '乡愁、思念、青春、回忆的寄托' },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: 'rgba(74,222,128,0.06)',
                    border: '1px solid rgba(74,222,128,0.18)',
                    borderRadius: '12px', padding: '12px'
                  }}>
                    <div style={{ color: '#4ade80', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{f.name}</div>
                    <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '11px', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 静物特征 */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '16px' }}>🏺</span>
                <span style={{ color: '#fb923c', fontSize: '13px', fontWeight: 600 }}>静物特征</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
                {[
                  { name: '外观特征', desc: '形状、颜色、材质、大小、比例' },
                  { name: '质感特征', desc: '光滑/粗糙、冷/暖、轻重、软/硬' },
                  { name: '功能特征', desc: '用途、作用、价值、意义' },
                  { name: '来历特征', desc: '谁送的、何时买的、背后的故事' },
                  { name: '时间特征', desc: '新旧变化、使用痕迹、岁月痕迹' },
                  { name: '空间特征', desc: '摆放位置、与环境关系' },
                  { name: '象征特征', desc: '代表什么情感、记忆、传承' },
                ].map((f, i) => (
                  <div key={i} style={{
                    background: 'rgba(251,146,60,0.06)',
                    border: '1px solid rgba(251,146,60,0.18)',
                    borderRadius: '12px', padding: '12px'
                  }}>
                    <div style={{ color: '#fb923c', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{f.name}</div>
                    <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '11px', lineHeight: 1.5 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 事元特征 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>⚡</span>
              <h4 style={{ color: '#60a5fa', fontSize: '15px', fontWeight: 600 }}>事元特征维度</h4>
              <span style={{ fontSize: '11px', color: 'rgba(232,224,200,0.4)', marginLeft: '8px' }}>（描述动作/行为）</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { name: '动作特征', desc: '做什么事（做/打/榨/打开）' },
                { name: '施动对象', desc: '谁在做（谁做）' },
                { name: '支配对象', desc: '对什么做（做什么）' },
                { name: '接受对象', desc: '为了谁/对谁（为谁做）' },
                { name: '时间特征', desc: '何时做、持续多久' },
                { name: '空间特征', desc: '在哪里做、场合环境' },
                { name: '方式特征', desc: '怎么做、动作状态' },
                { name: '程度特征', desc: '做到什么程度、效果如何' },
                { name: '工具特征', desc: '用什么做、借助什么' },
                { name: '方向特征', desc: '朝向哪里、运动轨迹' },
                { name: '原因特征', desc: '为什么要做、动机目的' },
                { name: '结果特征', desc: '产生了什么、影响如何' },
              ].map((f, i) => (
                <div key={i} style={{
                  background: 'rgba(96,165,250,0.05)',
                  border: '1px solid rgba(96,165,250,0.15)',
                  borderRadius: '12px', padding: '12px'
                }}>
                  <div style={{ color: '#60a5fa', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{f.name}</div>
                  <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '11px', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 关系元特征 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🔗</span>
              <h4 style={{ color: '#c084fc', fontSize: '15px', fontWeight: 600 }}>关系元特征维度</h4>
              <span style={{ fontSize: '11px', color: 'rgba(232,224,200,0.4)', marginLeft: '8px' }}>（描述关系）</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
              {[
                { name: '关系名', desc: '亲情、友情、师生、因果、时序等' },
                { name: '前项/主项', desc: '关系中主动方（人物A、事物A）' },
                { name: '后项/客项', desc: '关系中被动方（人物B、事物B）' },
                { name: '先后关系', desc: '谁在前、谁在后（时序关系）' },
                { name: '因果关系', desc: '原因→结果（一下雨地就湿）' },
                { name: '隶属关系', desc: '包含与被包含、归属关系' },
                { name: '矛盾关系', desc: '对立、冲突、竞争关系' },
                { name: '依赖关系', desc: '相互依存、一损俱损' },
                { name: '强度特征', desc: '强弱变化、亲疏远近' },
                { name: '时间特征', desc: '何时产生、持续多久、是否终结' },
                { name: '空间特征', desc: '在什么范围内、距离远近' },
                { name: '意义特征', desc: '带来什么价值、影响什么' },
              ].map((f, i) => (
                <div key={i} style={{
                  background: 'rgba(192,132,252,0.05)',
                  border: '1px solid rgba(192,132,252,0.15)',
                  borderRadius: '12px', padding: '12px'
                }}>
                  <div style={{ color: '#c084fc', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>{f.name}</div>
                  <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '11px', lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 逻辑框架 */}
      {activeTab === 'frameworks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {MATERIALS.frameworks.map(fw => (
            <div key={fw.name} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', padding: '18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>{fw.icon}</span>
                <span style={{ color: '#d4af37', fontSize: '14px', fontWeight: 600 }}>{fw.name}</span>
              </div>
              <p style={{ color: 'rgba(232,224,200,0.55)', fontSize: '12px', marginBottom: '12px', lineHeight: 1.5 }}>{fw.desc}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {fw.structure.map(s => (
                  <div key={s.part} style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    fontSize: '12px'
                  }}>
                    <span style={{ color: '#d4af37', fontWeight: 600, minWidth: '70px', flexShrink: 0 }}>{s.part}</span>
                    <span style={{ color: 'rgba(232,224,200,0.6)' }}>{s.content}</span>
                    <span style={{ color: 'rgba(212,175,55,0.5)', marginLeft: 'auto', flexShrink: 0 }}>{s.length}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: '10px', padding: '8px 12px',
                background: 'rgba(212,175,55,0.06)',
                border: '1px solid rgba(212,175,55,0.12)',
                borderRadius: '8px',
                color: 'rgba(232,224,200,0.5)', fontSize: '11px', lineHeight: 1.5
              }}>
                💡 {fw.tips}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 写作金句 */}
      {activeTab === 'sentences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {MATERIALS.goldenSentences.map(group => (
            <div key={group.category}>
              <h4 style={{ color: '#d4af37', fontSize: '14px', marginBottom: '10px', fontWeight: 600 }}>{group.category}</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {group.sentences.map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px', padding: '12px 14px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px'
                  }}>
                    <span style={{ color: 'rgba(232,224,200,0.8)', fontSize: '13px', lineHeight: 1.7 }}>{s}</span>
                    <button
                      onClick={() => copy(s, `sent-${i}`)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedId === `sent-${i}` ? '#4ade80' : 'rgba(232,224,200,0.25)', flexShrink: 0, marginTop: '2px' }}
                    >
                      {copiedId === `sent-${i}` ? <Check size={13} /> : <Copy size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 五把钥匙详解 */}
      {activeTab === 'keys' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {FIVE_KEYS.map(key => (
            <div key={key.id} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '16px', overflow: 'hidden'
            }}>
              <div
                onClick={() => setExpandedKey(expandedKey === key.id ? null : key.id)}
                style={{
                  padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: '12px',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${key.color}33, ${key.color}11)`,
                  border: `1px solid ${key.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0
                }}>{key.id}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'rgba(232,224,200,0.9)', fontSize: '14px', fontWeight: 600 }}>{key.name}</div>
                  <div style={{ color: 'rgba(232,224,200,0.4)', fontSize: '12px', marginTop: '2px' }}>{key.shortDesc}</div>
                </div>
                <ChevronRight size={16} style={{ color: 'rgba(232,224,200,0.3)', transform: expandedKey === key.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {expandedKey === key.id && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ paddingTop: '12px' }}>
                    {key.detail.split('\n').map((line, i) => (
                      <p key={i} style={{ color: 'rgba(232,224,200,0.65)', fontSize: '13px', lineHeight: 1.8, marginBottom: '6px' }}>{line}</p>
                    ))}
                    {key.example && (
                      <div style={{
                        marginTop: '12px', padding: '12px',
                        background: 'rgba(212,175,55,0.05)',
                        border: '1px solid rgba(212,175,55,0.12)',
                        borderRadius: '8px', whiteSpace: 'pre-wrap',
                        color: 'rgba(212,175,55,0.8)', fontSize: '12px', lineHeight: 1.7
                      }}>
                        📌 {key.example.topic}\n{key.example.model || key.example.tree || key.example.analysis || key.example.analysis}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 模块四：我的题库 ──────────────────────────────────────
function ModuleMyBank({ onViewTopic }) {
  const [bank, setBank] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 加载题库数据
  useEffect(() => {
    loadBankData();
    // 监听窗口获得焦点事件，切换回来时自动刷新
    const handleFocus = () => loadBankData();
    window.addEventListener('focus', handleFocus);
    // 监听 storage 变化（其他标签页修改时刷新）
    window.addEventListener('storage', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleFocus);
    };
  }, []);

  const loadBankData = () => {
    try {
      const data = JSON.parse(localStorage.getItem('ketuo_my_bank') || '[]');
      setBank(data);
    } catch {
      setBank([]);
    }
  };

  // 删除条目
  const deleteEntry = (e, entryId) => {
    e.stopPropagation();
    try {
      const newBank = bank.filter(item => item.id !== entryId);
      localStorage.setItem('ketuo_my_bank', JSON.stringify(newBank));
      setBank(newBank);
      if (selectedEntry?.id === entryId) {
        setSelectedEntry(null);
      }
    } catch {}
  };

  // 复制全部结果
  const copyAll = (entry) => {
    const text = Object.entries(entry.results || {})
      .sort(([a], [b]) => a - b)
      .map(([k, v]) => `${FIVE_STEPS[parseInt(k) - 1]?.name || `步骤${k}`}：\n${v}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  // 查看详情
  const viewDetail = (entry) => {
    setSelectedEntry(selectedEntry?.id === entry.id ? null : entry);
  };

  // 提取作文（步骤5的纯文本）
  const extractEssay = (entry) => {
    const step5 = entry.results?.[5];
    if (!step5) return '（暂无范文）';
    const pureText = step5
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^[-*+]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/【[^】]+】/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return pureText;
  };

  return (
    <div className="module-section">
      {/* 页面标题 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ color: '#d4af37', fontSize: '20px', marginBottom: '6px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📁</span> 我的题库
          </h3>
          <p style={{ color: 'rgba(232,224,200,0.5)', fontSize: '13px' }}>
            共 {bank.length} 道题目 {bank.length >= 50 && '（已达上限，自动清理旧记录）'}
          </p>
        </div>
        <button
          onClick={() => {
            try {
              localStorage.setItem('ketuo_my_bank', '[]');
              setBank([]);
              setSelectedEntry(null);
            } catch {}
          }}
          style={{
            padding: '6px 14px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          🗑️ 清空题库
        </button>
      </div>

      {/* 空状态 */}
      {bank.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '16px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <p style={{ color: 'rgba(232,224,200,0.4)', fontSize: '14px' }}>
            题库为空<br />
            <span style={{ fontSize: '12px' }}>在「自定义主题」中分析的题目会自动保存到这里</span>
          </p>
        </div>
      )}

      {/* 题目列表 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {bank.map((entry) => (
          <div
            key={entry.id}
            onClick={() => viewDetail(entry)}
            style={{
              background: selectedEntry?.id === entry.id 
                ? 'rgba(212,175,55,0.08)' 
                : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selectedEntry?.id === entry.id ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '14px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {/* 头部：标题和操作 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#d4af37', fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  {entry.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(232,224,200,0.4)' }}>
                    📅 {entry.analyzedAt}
                  </span>
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 8px', 
                    borderRadius: '10px',
                    background: entry.stepCount === 5 ? 'rgba(74,222,128,0.15)' : 'rgba(212,175,55,0.15)',
                    color: entry.stepCount === 5 ? '#4ade80' : '#d4af37',
                  }}>
                    {entry.stepCount}/5 步
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); copyAll(entry); }}
                  style={{
                    padding: '5px 10px',
                    background: copiedId === entry.id ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '6px',
                    color: copiedId === entry.id ? '#4ade80' : 'rgba(232,224,200,0.5)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedId === entry.id ? <><Check size={11} /> 已复制</> : <><Copy size={11} /> 复制</>}
                </button>
                <button
                  onClick={(e) => deleteEntry(e, entry.id)}
                  style={{
                    padding: '5px 10px',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '6px',
                    color: 'rgba(248,113,113,0.7)',
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* 展开详情 */}
            {selectedEntry?.id === entry.id && (
              <div style={{ 
                marginTop: '12px', 
                paddingTop: '12px',
                borderTop: '1px solid rgba(255,255,255,0.06)'
              }}>
                {/* 范文预览 */}
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ color: 'rgba(232,224,200,0.5)', fontSize: '11px', marginBottom: '6px' }}>
                    📄 范文预览
                  </div>
                  <div style={{
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    color: 'rgba(232,224,200,0.75)',
                    lineHeight: 1.7,
                    maxHeight: '150px',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {extractEssay(entry)}
                  </div>
                </div>

                {/* 步骤列表 */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[1, 2, 3, 4, 5].map(step => (
                    <div
                      key={step}
                      style={{
                        padding: '4px 10px',
                        background: entry.results?.[step] ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${entry.results?.[step] ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: entry.results?.[step] ? '#4ade80' : 'rgba(232,224,200,0.3)',
                      }}
                    >
                      {FIVE_STEPS[step - 1]?.name || `步骤${step}`}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部版权信息 */}
      <div style={{ 
        textAlign: 'center', marginTop: '30px', paddingTop: '20px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        color: 'rgba(232,224,200,0.25)', fontSize: '11px'
      }}>
        版权课程 © 2024 广州可拓学信息科技有限公司
      </div>
    </div>
  );
}

// ─── 主应用 ────────────────────────────────────────────────
export default function App() {
  const [activeModule, setActiveModule] = useState('writing');
  const [showSidebar, setShowSidebar] = useState(false);
  const [modelState, setModelState] = useState('ready'); // loading | ready | error
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [rawError, setRawError] = useState('');
  const [myBankKey, setMyBankKey] = useState(0); // 用于刷新题库
  const { stats, incrementEssays } = useStats();

  const modules = [
    { id: 'writing', label: '📚 可拓写作应用', icon: <BookOpen size={16} /> },
    { id: 'custom', label: '🔮 自定义主题', icon: <PenTool size={16} /> },
    { id: 'bank', label: '📁 我的题库', icon: <FileText size={16} /> },
    { id: 'materials', label: '📖 写作素材库', icon: <BookMarked size={16} /> },
  ];

  // 题库更新回调
  const handleTopicAnalyzed = useCallback(() => {
    setMyBankKey(prev => prev + 1);
  }, []);

  // 错误状态（硅基流动不需要加载界面）
  if (modelState === 'error') {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: 'linear-gradient(135deg, #0a1628 0%, #0f2744 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 2000, padding: '20px'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(212,175,55,0.3)',
          borderRadius: '24px',
          padding: '48px 40px',
          maxWidth: '480px', width: '100%',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#d4af37', fontSize: '22px', marginBottom: '8px' }}>系统错误</h2>
          <p style={{ color: 'rgba(232,224,200,0.6)', fontSize: '14px', marginBottom: '24px' }}>{error}</p>
          <button
            className="btn-gold"
            onClick={() => {
              setError('');
              setModelState('ready');
            }}
            style={{ width: '100%' }}
          >
            🔄 重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* 顶部导航 */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="mobile-menu-btn"
            onClick={() => setShowSidebar(!showSidebar)}
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ 
            fontSize: '22px',
            color: '#4ade80',
            filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.6))'
          }}>
            <Cpu size={26} style={{ 
              filter: 'drop-shadow(0 0 4px rgba(74,222,128,0.8))'
            }} />
          </div>
          <div>
            <div className="app-title">可拓写作智能系统（中学生）</div>
            <div className="app-subtitle">版权课程 © 广州可拓学信息科技有限公司</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'rgba(74,222,128,0.7)' }}>
            <Zap size={12} /> 云端 AI
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'rgba(232,224,200,0.4)' }}>
            <span>使用 {stats.essays} 次</span>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        {/* 侧边栏 */}
        <aside className={`sidebar ${showSidebar ? 'show' : ''}`}>
          {modules.map(m => (
            <button
              key={m.id}
              className={`sidebar-btn ${activeModule === m.id ? 'active' : ''}`}
              onClick={() => { setActiveModule(m.id); setShowSidebar(false); }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </aside>

        {/* 主内容区 - 使用CSS控制显示，保持组件挂载状态 */}
        <main className="main-content" style={{ position: 'relative' }}>
          <div style={{ display: activeModule === 'writing' ? 'block' : 'none', width: '100%', height: '100%' }}>
            <ModuleWritingApp onIncrementEssays={incrementEssays} />
          </div>
          <div style={{ display: activeModule === 'custom' ? 'block' : 'none', width: '100%', height: '100%' }}>
            <ModuleCustomTopic onIncrementEssays={incrementEssays} onTopicAnalyzed={handleTopicAnalyzed} />
          </div>
          <div style={{ display: activeModule === 'bank' ? 'block' : 'none', width: '100%', height: '100%' }}>
            <ModuleMyBank />
          </div>
          <div style={{ display: activeModule === 'materials' ? 'block' : 'none', width: '100%', height: '100%' }}>
            <ModuleMaterials />
          </div>
        </main>
      </div>

      {/* 统计面板 */}
      <div className="stats-bar">
        <div className="stats-item">
          <span className="stats-label">访问次数</span>
          <span className="stats-value">{stats.visits}</span>
        </div>
        <div className="stats-divider" />
        <div className="stats-item">
          <span className="stats-label">生成范文</span>
          <span className="stats-value">{stats.essays}</span>
        </div>
        <div className="stats-divider" />
        <div className="stats-item">
          <span className="stats-label">最后访问</span>
          <span className="stats-value" style={{ fontSize: '11px' }}>{stats.lastVisit || '首次'}</span>
        </div>
      </div>
    </div>
  );
}
