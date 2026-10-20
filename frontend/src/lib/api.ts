import type { Member, Task, TaskInput } from "./tasks";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function detailMessage(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item: unknown) => {
        if (typeof item !== "object" || item === null || !("msg" in item))
          return "입력값을 확인해 주세요.";
        return String(item.msg);
      })
      .join(" ");
  }
  return "요청을 처리하지 못했습니다. 다시 시도해 주세요.";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/v1${path}`, { ...init, cache: "no-store" });
  } catch {
    throw new ApiError("연결할 수 없습니다. 잠시 후 다시 시도해 주세요.", 503);
  }
  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    const detail =
      typeof body === "object" && body !== null && "detail" in body
        ? body.detail
        : null;
    throw new ApiError(detailMessage(detail), response.status);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

const json = (method: string, body: object): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export const api = {
  tasks: (): Promise<Task[]> => request("/tasks"),
  task: (id: number): Promise<Task> => request(`/tasks/${String(id)}`),
  members: (): Promise<Member[]> => request("/members"),
  create: (input: TaskInput): Promise<Task> => request("/tasks", json("POST", input)),
  update: (id: number, input: Partial<TaskInput>): Promise<Task> =>
    request(`/tasks/${String(id)}`, json("PATCH", input)),
  remove: (id: number): Promise<void> =>
    request(`/tasks/${String(id)}`, { method: "DELETE" }),
};
