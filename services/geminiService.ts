
import { GoogleGenAI, Type } from "@google/genai";
import { IssueType, IssueSeverity } from "../types";

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: '差异点的简短标题（中文）' },
      description: { type: Type.STRING, description: '详细的错误说明（中文）' },
      type: { type: Type.STRING, enum: Object.values(IssueType), description: '问题类别' },
      severity: { type: Type.STRING, enum: Object.values(IssueSeverity), description: '严重程度' },
      designValue: { type: Type.STRING, description: '设计稿中的数值或样式说明' },
      devValue: { type: Type.STRING, description: '开发实现中的数值或样式说明' },
    },
    required: ['title', 'description', 'type', 'severity'],
  }
};

const parseBase64 = (base64String: string) => {
  const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return { mimeType: "image/png", data: base64String.includes(',') ? base64String.split(',')[1] : base64String };
  }
  return { mimeType: matches[1], data: matches[2] };
};

export const analyzeUIComparison = async (designBase64: string, devBase64: string) => {
  // 安全地获取环境变量，避免在非 Node 预处理环境下直接访问 process 导致崩溃
  const getApiKey = () => {
    try {
      // 优先从 process.env 获取（Vercel 等环境）
      return (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;
    } catch (e) {
      return undefined;
    }
  };

  const apiKey = getApiKey();
  
  if (!apiKey) {
    console.error("Critical: API_KEY is missing from environment.");
    throw new Error("部署变量 'API_KEY' 缺失。请在 Vercel 环境变量中添加 API_KEY。");
  }

  // 每次调用时重新实例化，确保使用最准确的环境变量值
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';
  
  const designInfo = parseBase64(designBase64);
  const devInfo = parseBase64(devBase64);

  const prompt = `
    你是一位资深的 UI/UX 视觉走查工程师。
    对比以下两张图：
    1. 图片 1: 设计标准稿
    2. 图片 2: 开发实现截图
    
    请找出两者之间的视觉差异（间距、文字、颜色、圆角、阴影、布局等）。
    请详细描述每处差异，并给出具体的数值对比（如：设计稿 16px，实际 20px）。
    请使用中文返回结果。
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: designInfo.mimeType, data: designInfo.data } },
          { inlineData: { mimeType: devInfo.mimeType, data: devInfo.data } },
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("AI 分析结果为空，请检查模型响应。");
    
    return JSON.parse(resultText);
  } catch (error: any) {
    console.error("Gemini API Error Detail:", error);
    // 针对 apimart.ai 等代理服务常见的 401/403/404 错误进行友好提示
    if (error.status === 401 || error.status === 403) {
      throw new Error("API Key 无效或过期，请检查配置。");
    }
    throw new Error(error.message || "AI 比对请求失败，请检查网络连接。");
  }
};
