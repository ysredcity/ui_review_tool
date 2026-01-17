
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
  // 根据平台规范，必须使用 process.env.API_KEY
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.error("Environment Variable API_KEY is missing.");
    throw new Error("检测到 API_KEY 缺失。请在部署平台（如 Vercel）的环境变量中添加名为 'API_KEY' 的变量。");
  }

  // 每次调用时重新实例化以确保获取最新的环境变量
  const ai = new GoogleGenAI({ apiKey });
  const model = 'gemini-3-flash-preview';
  
  const designInfo = parseBase64(designBase64);
  const devInfo = parseBase64(devBase64);

  const prompt = `
    你是一位资深的 UI/UX 视觉走查工程师。
    对比以下两张图：
    1. 图片 1: 设计标准稿
    2. 图片 2: 开发实现截图
    
    请找出两者之间的视觉差异，包含间距、文字、颜色、布局等。
    请详细描述每处差异，并给出具体的数值对比。
    请使用中文返回 JSON 格式结果。
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
    if (!resultText) throw new Error("AI 分析结果为空");
    
    return JSON.parse(resultText);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error.message || "AI 比对请求失败");
  }
};
