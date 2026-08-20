const request = require("supertest");
const app = require("../src/app");

describe("Time tracking system", () => {
  let ownerToken;
  let otherToken;
  let projectId;
  let taskId;
  let entryId;

  beforeAll(async () => {
    const suffix = `${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 10)}`;
    const owner = await request(app).post("/api/auth/register").send({
      name: "Time Owner", username: `timeowner${suffix}`, email: `timeowner${suffix}@example.com`, password: "Password123!",
    });
    const other = await request(app).post("/api/auth/register").send({
      name: "Time Other", username: `timeother${suffix}`, email: `timeother${suffix}@example.com`, password: "Password123!",
    });
    expect(owner.statusCode).toBe(201);
    expect(other.statusCode).toBe(201);
    ownerToken = owner.body.token;
    otherToken = other.body.token;

    const project = await request(app).post("/api/projects").set("Authorization", `Bearer ${ownerToken}`).send({ title: "Tracked Project" });
    expect(project.statusCode).toBe(201);
    projectId = project.body.project.id;
    const task = await request(app).post(`/api/projects/${projectId}/tasks`).set("Authorization", `Bearer ${ownerToken}`).send({ title: "Tracked Task" });
    expect(task.statusCode).toBe(201);
    taskId = task.body.task.id;
  });

  test("requires authentication and recovers the active timer", async () => {
    const unauthenticated = await request(app).get("/api/time-tracking/timer");
    expect(unauthenticated.statusCode).toBe(401);

    const started = await request(app).post("/api/time-tracking/timer/start").set("Authorization", `Bearer ${ownerToken}`).send({ projectId, taskId, description: "Focus" });
    expect(started.statusCode).toBe(201);
    expect(started.body.timer.status).toBe("RUNNING");

    const duplicate = await request(app).post("/api/time-tracking/timer/start").set("Authorization", `Bearer ${ownerToken}`).send({ projectId });
    expect(duplicate.statusCode).toBe(409);
    const recovered = await request(app).get("/api/time-tracking/timer").set("Authorization", `Bearer ${ownerToken}`);
    expect(recovered.statusCode).toBe(200);
    expect(recovered.body.timer.id).toBe(started.body.timer.id);
  });

  test("pauses, resumes, stops, and calculates a non-negative duration", async () => {
    const paused = await request(app).post("/api/time-tracking/timer/pause").set("Authorization", `Bearer ${ownerToken}`);
    expect(paused.statusCode).toBe(200);
    expect(paused.body.timer.status).toBe("PAUSED");
    const resumed = await request(app).post("/api/time-tracking/timer/resume").set("Authorization", `Bearer ${ownerToken}`);
    expect(resumed.statusCode).toBe(200);
    const stopped = await request(app).post("/api/time-tracking/timer/stop").set("Authorization", `Bearer ${ownerToken}`).send({ description: "Finished" });
    expect(stopped.statusCode).toBe(200);
    expect(stopped.body.entry.status).toBe("COMPLETED");
    expect(stopped.body.entry.accumulatedSeconds).toBeGreaterThanOrEqual(0);
    entryId = stopped.body.entry.id;
  });

  test("creates, lists, updates, and deletes a completed entry", async () => {
    const start = new Date(Date.now() - 3600000);
    const end = new Date(Date.now() - 1800000);
    const created = await request(app).post("/api/time-tracking/entries").set("Authorization", `Bearer ${ownerToken}`).send({ projectId, taskId, startedAt: start.toISOString(), endedAt: end.toISOString(), description: "Review" });
    expect(created.statusCode).toBe(201);
    entryId = created.body.entry.id;
    expect(created.body.entry.accumulatedSeconds).toBe(1800);

    const listed = await request(app).get(`/api/time-tracking/entries?projectId=${projectId}&taskId=${taskId}`).set("Authorization", `Bearer ${ownerToken}`);
    expect(listed.statusCode).toBe(200);
    expect(listed.body.entries.some((entry) => entry.id === entryId)).toBe(true);
    const updated = await request(app).put(`/api/time-tracking/entries/${entryId}`).set("Authorization", `Bearer ${ownerToken}`).send({ description: "Reviewed" });
    expect(updated.statusCode).toBe(200);
    expect(updated.body.entry.description).toBe("Reviewed");
    const removed = await request(app).delete(`/api/time-tracking/entries/${entryId}`).set("Authorization", `Bearer ${ownerToken}`);
    expect(removed.statusCode).toBe(200);
  });

  test("protects ownership and project/task relationships", async () => {
    const invalid = await request(app).post("/api/time-tracking/entries").set("Authorization", `Bearer ${ownerToken}`).send({ projectId, taskId: "not-a-task", startedAt: new Date(Date.now() - 1000).toISOString(), endedAt: new Date().toISOString() });
    expect(invalid.statusCode).toBe(400);
    const forbidden = await request(app).post("/api/time-tracking/timer/start").set("Authorization", `Bearer ${otherToken}`).send({ projectId });
    expect(forbidden.statusCode).toBe(404);
    const protectedEntry = await request(app).post("/api/time-tracking/entries").set("Authorization", `Bearer ${ownerToken}`).send({ projectId, startedAt: new Date(Date.now() - 1000).toISOString(), endedAt: new Date().toISOString() });
    expect(protectedEntry.statusCode).toBe(201);
    const update = await request(app).put(`/api/time-tracking/entries/${protectedEntry.body.entry.id}`).set("Authorization", `Bearer ${otherToken}`).send({ description: "Nope" });
    expect(update.statusCode).toBe(404);
    const remove = await request(app).delete(`/api/time-tracking/entries/${protectedEntry.body.entry.id}`).set("Authorization", `Bearer ${otherToken}`);
    expect(remove.statusCode).toBe(404);
  });
});