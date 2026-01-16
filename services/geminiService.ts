
import { GoogleGenAI, Type } from "@google/genai";
import { IssueType, IssueSeverity } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const analyzeUIComparison = async (designBase64: string, devBase64: string) => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    你是一位资深的 UI/UX 视觉走查工程师（QA）。
    请对比以下两张图片：
    1. 图片 1: UI 设计稿（原始设计标准）
    2. 图片 2: 开发实现的页面截图（当前现状）
    
    找出所有视觉上的不一致，包括但不限于：
    - 间距与边距（错误的 padding、gap 或对齐）
    - 文字排版（错误的字号、字重、行高或颜色）
    - 颜色与渐变（品牌色不符或阴影效果不对）
    - 组件（图标缺失、圆角错误、投影不符）
    - 布局（元素错位、未居中、比例不对）
    
    请务必精确。对于每个问题，尽可能详细说明设计稿是怎么要求的，而开发是怎么实现的。
    请使用中文返回结果。
  `;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/png", data: designBase64.split(',')[1] } },
        { inlineData: { mimeType: "image/png", data: devBase64.split(',')[1] } },
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.1,
    },
  });

  try {
    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("AI 分析生成数据失败，请重试。");
  }
};
