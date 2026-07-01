import type { TaskRecord } from "@/schemas/feature";

export interface OpenSpecTaskMapping {
  title: string;
  affectedAreas: string[];
  verification: string[];
}

export function mapPlanTasksToOpenSpec(tasks: TaskRecord[]): OpenSpecTaskMapping[] {
  return tasks.map((task) => ({
    title: task.title,
    affectedAreas: task.targets,
    verification: task.verification,
  }));
}
