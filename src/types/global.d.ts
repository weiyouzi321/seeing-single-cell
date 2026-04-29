export interface Subject {
  id: string
  number: number
  title: string
  group: string
  groupName: string
  summary: string
  content: string
  importance: string | number
  tags: string[]
  color: string
  connectedTo?: string[]
  sections?: Array<{ level: number; title: string; lineNumber: number }>
  status?: string
  date?: string
  file?: string
  inDegree?: number
}

export interface Group {
  id: string
  name: string
  color: string
  range: [number, number]
}

export interface PathData {
  name: string
  description: string
  subjectIds: string[]
  steps: string[]
}

declare module "*.json" {
  const value: any
  export default value
}
