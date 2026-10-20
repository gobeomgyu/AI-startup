export const statuses = ["todo", "in_progress", "done"] as const;
export const priorities = ["낮음", "보통", "높음"] as const;

export type Status = (typeof statuses)[number];
export type Priority = (typeof priorities)[number];

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assignee_id: number | null;
  due_date: string | null;
  priority: Priority;
  status: Status;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: number;
  name: string;
}

export interface TaskInput {
  title: string;
  description: string | null;
  assignee_id: number | null;
  due_date: string | null;
  priority: Priority;
  status: Status;
  tags: string[];
}

export const statusLabels: Record<Status, string> = {
  todo: "할 일",
  in_progress: "진행 중",
  done: "완료",
};

export function parseTags(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => {
      const key = tag.toLocaleLowerCase();
      if (!tag || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function formatDate(value: string | null): string {
  return value !== null && value !== "" ? value.slice(0, 10) : "—";
}
