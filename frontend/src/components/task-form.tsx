"use client";

import { useState } from "react";
import { parseTags, priorities, statuses, statusLabels } from "@/lib/tasks";
import type { Member, Task, TaskInput } from "@/lib/tasks";

interface Props {
  task?: Task;
  members: Member[];
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({
  task,
  members,
  onSubmit,
  onCancel,
}: Props): React.JSX.Element {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assignee, setAssignee] = useState(task?.assignee_id?.toString() ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [priority, setPriority] = useState<TaskInput["priority"]>(
    task?.priority ?? "보통",
  );
  const [status, setStatus] = useState<TaskInput["status"]>(task?.status ?? "todo");
  const [tags, setTags] = useState(task?.tags.join(", ") ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.SubmitEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (busy) return;
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("제목을 입력해 주세요.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onSubmit({
        title: cleanTitle,
        description: description.trim() || null,
        assignee_id: assignee ? Number(assignee) : null,
        due_date: dueDate || null,
        priority,
        status,
        tags: parseTags(tags),
      });
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "저장하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        void submit(event);
      }}
      className="task-form"
      noValidate
    >
      <div className="form-grid">
        <label className="field field-wide">
          제목 <span className="required">*</span>
          <input
            value={title}
            maxLength={300}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
            aria-invalid={Boolean(error && !title.trim())}
            autoFocus
            placeholder="해야 할 일을 입력하세요"
          />
        </label>
        <label className="field field-wide">
          설명
          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
            }}
            rows={4}
            placeholder="작업에 필요한 내용을 적어 주세요"
          />
        </label>
        <label className="field">
          담당자
          <select
            value={assignee}
            onChange={(event) => {
              setAssignee(event.target.value);
            }}
          >
            <option value="">담당자 없음</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          마감일
          <input
            type="date"
            value={dueDate}
            onChange={(event) => {
              setDueDate(event.target.value);
            }}
          />
        </label>
        <label className="field">
          우선순위
          <select
            value={priority}
            onChange={(event) => {
              setPriority(event.target.value as TaskInput["priority"]);
            }}
          >
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          상태
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as TaskInput["status"]);
            }}
          >
            {statuses.map((value) => (
              <option key={value} value={value}>
                {statusLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-wide">
          태그 <span className="hint">쉼표로 구분</span>
          <input
            value={tags}
            onChange={(event) => {
              setTags(event.target.value);
            }}
            placeholder="예: 기획, 검토"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button
          type="button"
          className="button secondary"
          onClick={onCancel}
          disabled={busy}
        >
          취소
        </button>
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "저장 중…" : task ? "변경사항 저장" : "할 일 만들기"}
        </button>
      </div>
    </form>
  );
}
