"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TaskForm } from "@/components/task-form";
import { api, ApiError } from "@/lib/api";
import { formatDate, statuses, statusLabels } from "@/lib/tasks";
import type { Member, Status, Task, TaskInput } from "@/lib/tasks";

export default function TaskDetailPage(): React.JSX.Element {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);
  const [task, setTask] = useState<Task | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    setNotFound(false);
    try {
      setTask(await api.task(id));
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 404) setNotFound(true);
      else
        setError(
          cause instanceof Error ? cause.message : "할 일을 불러오지 못했습니다.",
        );
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => {
    void api
      .task(id)
      .then(setTask)
      .catch((cause: unknown) => {
        if (cause instanceof ApiError && cause.status === 404) setNotFound(true);
        else
          setError(
            cause instanceof Error ? cause.message : "할 일을 불러오지 못했습니다.",
          );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);
  useEffect(() => {
    void api
      .members()
      .then(setMembers)
      .catch(() => {
        setActionError("담당자 목록을 불러오지 못했습니다. 다시 시도해 주세요.");
      });
  }, []);

  async function save(input: TaskInput): Promise<void> {
    const updated = await api.update(id, input);
    setTask(updated);
    setEditing(false);
    setActionError("");
  }
  async function changeStatus(status: Status): Promise<void> {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      setTask(await api.update(id, { status }));
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "상태 변경에 실패했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove(): Promise<void> {
    if (busy) return;
    setBusy(true);
    setActionError("");
    try {
      await api.remove(id);
      router.push("/tasks");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "삭제에 실패했습니다.");
      setConfirmDelete(false);
    } finally {
      setBusy(false);
    }
  }
  const memberName =
    members.find((member) => member.id === task?.assignee_id)?.name ?? "미지정";

  return (
    <div className="page-wrap detail-wrap">
      <Link className="back-link" href="/tasks">
        ← 전체 할 일
      </Link>
      {loading ? (
        <div className="panel state">할 일을 불러오는 중…</div>
      ) : notFound ? (
        <div className="panel state">
          <h1>할 일을 찾을 수 없습니다</h1>
          <p>삭제되었거나 주소가 올바르지 않습니다.</p>
          <Link className="button primary" href="/tasks">
            목록으로 돌아가기
          </Link>
        </div>
      ) : error ? (
        <div className="panel state">
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
      ) : task ? (
        <>
          <div className="eyebrow">WORKSPACE / TASK #{task.id}</div>
          <div className="page-heading">
            <div>
              <h1>{task.title}</h1>
              <p>
                작성 {formatDate(task.created_at)} · 마지막 수정{" "}
                {formatDate(task.updated_at)}
              </p>
            </div>
            <div className="heading-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setEditing(!editing);
                  setActionError("");
                }}
              >
                {editing ? "편집 취소" : "편집"}
              </button>
              <button
                className="button danger"
                onClick={() => {
                  setConfirmDelete(true);
                }}
              >
                삭제
              </button>
            </div>
          </div>
          {actionError && (
            <div role="alert" className="error-box">
              {actionError}{" "}
              <button
                className="text-button"
                onClick={() => {
                  void api
                    .members()
                    .then(setMembers)
                    .then(() => {
                      setActionError("");
                    });
                }}
              >
                담당자 다시 조회
              </button>
            </div>
          )}
          {editing ? (
            <section className="panel content-panel">
              <h2>할 일 편집</h2>
              <TaskForm
                task={task}
                members={members}
                onSubmit={save}
                onCancel={() => {
                  setEditing(false);
                }}
              />
            </section>
          ) : (
            <div className="detail-grid">
              <section className="panel content-panel">
                <div className="section-heading">
                  <h2>작업 내용</h2>
                  <span className={`badge ${task.status}`}>
                    {statusLabels[task.status]}
                  </span>
                </div>
                <div className="description">
                  {task.description !== null && task.description !== "" ? (
                    task.description
                  ) : (
                    <span className="muted">설명이 없습니다.</span>
                  )}
                </div>
                <div className="detail-tags">
                  <h3>태그</h3>
                  {task.tags.length ? (
                    task.tags.map((tag) => (
                      <span className="tag" key={tag}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="muted">태그 없음</span>
                  )}
                </div>
              </section>
              <aside className="panel inspector">
                <h2>작업 정보</h2>
                <dl>
                  <div>
                    <dt>상태</dt>
                    <dd>
                      <span className={`badge ${task.status}`}>
                        {statusLabels[task.status]}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>우선순위</dt>
                    <dd>{task.priority}</dd>
                  </div>
                  <div>
                    <dt>담당자</dt>
                    <dd>{memberName}</dd>
                  </div>
                  <div>
                    <dt>마감일</dt>
                    <dd>{formatDate(task.due_date)}</dd>
                  </div>
                </dl>
                <h3>빠른 상태 변경</h3>
                <div className="status-actions">
                  {statuses.map((status) => (
                    <button
                      key={status}
                      disabled={busy || task.status === status}
                      className={`button ${task.status === status ? "primary" : "secondary"}`}
                      onClick={() => {
                        void changeStatus(status);
                      }}
                    >
                      {statusLabels[status]}
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          )}
          {confirmDelete && (
            <div className="dialog-backdrop">
              <div
                className="dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-title"
              >
                <h2 id="delete-title">할 일을 삭제할까요?</h2>
                <p>삭제하면 다시 복구할 수 없습니다.</p>
                <div className="form-actions">
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => {
                      setConfirmDelete(false);
                    }}
                  >
                    취소
                  </button>
                  <button
                    className="button danger"
                    disabled={busy}
                    onClick={() => {
                      void remove();
                    }}
                  >
                    {busy ? "삭제 중…" : "삭제 확인"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
