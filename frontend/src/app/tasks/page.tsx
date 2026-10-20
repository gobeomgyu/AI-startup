"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { api } from "@/lib/api";
import { formatDate, priorities, statuses, statusLabels } from "@/lib/tasks";
import type { Member, Task, TaskInput } from "@/lib/tasks";

export default function TasksPage(): React.JSX.Element {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [memberError, setMemberError] = useState("");
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sort, setSort] = useState("newest");

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    try {
      setTasks(await api.tasks());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void api
      .tasks()
      .then(setTasks)
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error ? cause.message : "목록을 불러오지 못했습니다.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);
  useEffect(() => {
    void api
      .members()
      .then(setMembers)
      .catch((cause: unknown) => {
        setMemberError(
          cause instanceof Error ? cause.message : "담당자 목록을 불러오지 못했습니다.",
        );
      });
  }, []);

  const visible = useMemo(() => {
    const filtered = tasks.filter(
      (task) =>
        (status === "all" || task.status === status) &&
        (priority === "all" || task.priority === priority),
    );
    return filtered.sort((a, b) => {
      if (sort === "oldest") return a.id - b.id;
      if (sort === "due")
        return (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31");
      if (sort === "priority")
        return priorities.indexOf(b.priority) - priorities.indexOf(a.priority);
      return b.id - a.id;
    });
  }, [tasks, status, priority, sort]);
  const memberName = (id: number | null): string =>
    members.find((member) => member.id === id)?.name ?? "미지정";
  async function create(input: TaskInput): Promise<void> {
    const task = await api.create(input);
    router.push(`/tasks/${String(task.id)}`);
  }

  return (
    <div className="page-wrap">
      <div className="eyebrow">WORKSPACE / TASKS</div>
      <div className="page-heading">
        <div>
          <h1>할 일</h1>
          <p>해야 할 일을 한곳에서 정리하고 진행 상황을 살펴보세요.</p>
        </div>
        <button
          className="button primary"
          onClick={() => {
            setCreating(true);
          }}
        >
          + 새 할 일
        </button>
      </div>
      {creating && (
        <section className="panel create-panel" aria-label="새 할 일">
          <div className="section-heading">
            <h2>새 할 일</h2>
          </div>
          {memberError && (
            <p className="notice">
              담당자 목록: {memberError}{" "}
              <button
                className="text-button"
                onClick={() => {
                  void api.members().then((value) => {
                    setMembers(value);
                    setMemberError("");
                  });
                }}
              >
                다시 시도
              </button>
            </p>
          )}
          <TaskForm
            members={members}
            onSubmit={create}
            onCancel={() => {
              setCreating(false);
            }}
          />
        </section>
      )}
      <section className="panel list-panel" aria-label="할 일 목록">
        <div className="section-heading">
          <div>
            <h2>
              전체 작업 <span className="count">{tasks.length}</span>
            </h2>
            <p>
              진행 중 {tasks.filter((task) => task.status === "in_progress").length} ·
              완료 {tasks.filter((task) => task.status === "done").length}
            </p>
          </div>
        </div>
        <div className="filters">
          <label>
            상태
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
              }}
            >
              <option value="all">전체 상태</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            우선순위
            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
              }}
            >
              <option value="all">전체 우선순위</option>
              {priorities.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            정렬
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
              }}
            >
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="due">마감일순</option>
              <option value="priority">우선순위순</option>
            </select>
          </label>
        </div>
        {loading ? (
          <div className="state">할 일을 불러오는 중…</div>
        ) : error ? (
          <div className="state">
            <p role="alert">{error}</p>
            <button
              className="button secondary"
              onClick={() => {
                void load();
              }}
            >
              다시 시도
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="state">
            <div className="state-icon">✓</div>
            <h3>아직 할 일이 없습니다</h3>
            <p>첫 번째 작업을 만들어 시작해 보세요.</p>
            <button
              className="button primary"
              onClick={() => {
                setCreating(true);
              }}
            >
              + 새 할 일
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="state">
            <h3>조건에 맞는 할 일이 없습니다</h3>
            <button
              className="button secondary"
              onClick={() => {
                setStatus("all");
                setPriority("all");
              }}
            >
              필터 초기화
            </button>
          </div>
        ) : (
          <div className="task-list">
            {visible.map((task) => (
              <Link
                className="task-row"
                href={`/tasks/${String(task.id)}`}
                key={task.id}
              >
                <div className="task-main">
                  <span className={`status-dot ${task.status}`} />
                  <div>
                    <strong>{task.title}</strong>
                    <div className="task-tags">
                      {task.tags.map((tag) => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="task-meta">
                  <span className={`badge ${task.status}`}>
                    {statusLabels[task.status]}
                  </span>
                  <span className={`priority ${task.priority}`}>{task.priority}</span>
                  <span>{memberName(task.assignee_id)}</span>
                  <span>{formatDate(task.due_date)}</span>
                  <span className="row-arrow">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
