export interface ScheduledTask {
  id: string
  name: string
  prompt: string
  enabled: boolean
  outputPath: string
  createdAt: string
  lastRunAt?: string
  targetRepo?: string
  targetBranch?: string
  webSearch?: boolean
  schedule?: 'daily' | 'weekly'
  stateFilePath?: string
}

export interface TasksFile {
  tasks: ScheduledTask[]
  updatedAt: string
}

export interface TasksSettings {
  repo: string
  branch: string
}
