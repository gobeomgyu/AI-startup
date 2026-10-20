const base = process.env.FRONTEND_URL ?? "http://127.0.0.1:3001";
const endpoint = `${base}/api/v1`;
const backend = `${process.env.BACKEND_URL ?? "http://127.0.0.1:8001"}/api/v1`;

async function callAt(target, path, method = "GET", body) {
  const response = await fetch(`${target}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    body: response.status === 204 ? null : await response.json(),
  };
}
const call = (path, method, body) => callAt(endpoint, path, method, body);

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

let createdId;
let memberId;
try {
  const initial = await call("/tasks");
  expect(initial.status === 200 && Array.isArray(initial.body), "list failed");
  const member = await callAt(backend, "/members", "POST", {
    name: "Integration member",
  });
  expect(member.status === 201, "test member setup failed");
  memberId = member.body.id;
  const members = await call("/members");
  expect(
    members.status === 200 && members.body.some((item) => item.id === memberId),
    "member list failed",
  );
  const created = await call("/tasks", "POST", {
    title: "Integration task",
    description: "Initial detail",
    due_date: "2026-10-21",
    assignee_id: memberId,
    priority: "높음",
    status: "todo",
    tags: ["Alpha", "Beta"],
  });
  expect(created.status === 201, `create failed: ${JSON.stringify(created)}`);
  createdId = created.body.id;
  expect(
    created.body.tags.length === 2 &&
      created.body.priority === "높음" &&
      created.body.assignee_id === memberId,
    "create fields mismatch",
  );
  const detail = await call(`/tasks/${createdId}`);
  expect(
    detail.status === 200 && detail.body.title === "Integration task",
    "detail failed",
  );
  const updated = await call(`/tasks/${createdId}`, "PATCH", {
    title: "Integration task updated",
    description: null,
    due_date: null,
    assignee_id: null,
    priority: "낮음",
    status: "in_progress",
    tags: ["Beta"],
  });
  expect(
    updated.status === 200 &&
      updated.body.description === null &&
      updated.body.due_date === null,
    "null clear failed",
  );
  expect(
    updated.body.tags.length === 1 && updated.body.tags[0] === "Beta",
    "tag replacement failed",
  );
  const done = await call(`/tasks/${createdId}`, "PATCH", { status: "done" });
  expect(
    done.status === 200 && done.body.status === "done" && done.body.tags[0] === "Beta",
    "status patch failed",
  );
  const empty = await call(`/tasks/${createdId}`, "PATCH", { tags: [] });
  expect(empty.status === 200 && empty.body.tags.length === 0, "tag clear failed");
  const invalid = await call(`/tasks/${createdId}`, "PATCH", { title: "   " });
  expect(invalid.status === 422, "validation response failed");
  const deleted = await call(`/tasks/${createdId}`, "DELETE");
  expect(deleted.status === 204, "delete failed");
  createdId = undefined;
  const missing = await call(`/tasks/${detail.body.id}`);
  expect(missing.status === 404, "missing task response failed");
  process.stdout.write(
    "PASS: list, assignee, create, detail, null clear, tag replacement/clear, status, 422, delete, 404\n",
  );
} finally {
  if (createdId !== undefined) await call(`/tasks/${createdId}`, "DELETE");
  if (memberId !== undefined) await callAt(backend, `/members/${memberId}`, "DELETE");
}
