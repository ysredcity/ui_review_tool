
export enum ProjectStatus {
  DRAFT = '草稿',
  PENDING_AUDIT = '待走查',
  COMPLETED = '已完成'
}

export enum IssueSeverity {
  HIGH = '严重',
  MEDIUM = '中等',
  LOW = '轻微'
}

export enum IssueType {
  SPACING = '间距',
  TYPOGRAPHY = '字体',
  COLOR = '颜色',
  LAYOUT = '布局',
  COMPONENT = '组件'
}

export enum AuditDecision {
  MUST_FIX = '必须修改',
  SUGGEST_FIX = '建议修改',
  ACCEPTABLE = '可以接受'
}

export interface UIIssue {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  severity: IssueSeverity;
  designValue?: string;
  devValue?: string;
  decision?: AuditDecision;
  note?: string;
}

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  updatedAt: string;
  designImage?: string;
  devImage?: string;
  issues: UIIssue[];
  score?: number;
}
