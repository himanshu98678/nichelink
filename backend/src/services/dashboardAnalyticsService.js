const { Prisma } = require("@prisma/client");
const prisma = require("../lib/prisma");

const periodStart = (period) => {
  const start = new Date();
  if (period === "week") { start.setDate(start.getDate() - 7); }
  else if (period === "year") { start.setFullYear(start.getFullYear() - 1); }
  else { start.setDate(start.getDate() - 30); }
  return start;
};

const getDashboardAnalytics = async (userId, period = "month") => {
  const startDate = periodStart(period);
  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    select: { id: true, title: true, status: true },
  });
  const projectIds = projects.map((project) => project.id);

  const [
    taskTotal,
    taskCompleted,
    jobsByStatus,
    messagesSent,
    activityCount,
    communitiesJoined,
    subscription,
  ] = await Promise.all([
    prisma.task.count({ where: { projectId: { in: projectIds } } }),
    prisma.task.count({ where: { projectId: { in: projectIds }, status: "DONE" } }),
    prisma.job.groupBy({ by: ["status"], where: { postedById: userId }, _count: { _all: true } }),
    prisma.message.count({ where: { senderId: userId, createdAt: { gte: startDate } } }),
    prisma.taskActivity.count({ where: { userId, createdAt: { gte: startDate } } }),
    prisma.communityMember.count({ where: { userId } }),
    prisma.subscription.findUnique({ where: { userId }, select: { planCode: true, status: true, endsAt: true } }),
  ]);

  const timeRows = projectIds.length === 0
    ? []
    : await prisma.$queryRaw(Prisma.sql`
      SELECT "projectId" AS "projectId",
             DATE_TRUNC('day', "startedAt") AS "day",
             COALESCE(SUM("accumulatedSeconds"), 0)::int AS "storedSeconds",
             COALESCE(SUM(CASE WHEN "status" = 'RUNNING' THEN EXTRACT(EPOCH FROM (NOW() - "startedAt")) ELSE 0 END), 0)::int AS "runningSeconds"
      FROM "TimeEntry"
      WHERE "userId" = ${userId}
        AND "startedAt" >= ${startDate}
        AND "projectId" IN (${Prisma.join(projectIds)})
      GROUP BY "projectId", DATE_TRUNC('day', "startedAt")
      ORDER BY "day" ASC
    `);

  const projectMap = new Map(projects.map((project) => [project.id, { projectId: project.id, title: project.title, seconds: 0 }]));
  const dailyMap = new Map();
  timeRows.forEach((row) => {
    const seconds = Number(row.storedSeconds || 0) + Number(row.runningSeconds || 0);
    const project = projectMap.get(row.projectId);
    if (project) { project.seconds += seconds; }
    const day = new Date(row.day).toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) || 0) + seconds);
  });
  const byProject = [...projectMap.values()].filter((project) => project.seconds > 0);
  const byDay = [...dailyMap.entries()].map(([date, seconds]) => ({ date, seconds }));
  const trackedSeconds = byDay.reduce((total, day) => total + day.seconds, 0);
  const projectStatus = projects.reduce((result, project) => {
    const status = String(project.status || "UNKNOWN").toUpperCase();
    result[status] = (result[status] || 0) + 1;
    return result;
  }, {});
  const jobStatus = jobsByStatus.reduce((result, row) => {
    result[row.status] = row._count._all;
    return result;
  }, {});

  return {
    period,
    from: startDate,
    metrics: {
      projects: { total: projects.length, byStatus: projectStatus },
      tasks: { total: taskTotal, completed: taskCompleted, pending: Math.max(0, taskTotal - taskCompleted), completionRate: taskTotal ? Math.round((taskCompleted / taskTotal) * 100) : 0 },
      jobs: { total: jobsByStatus.reduce((total, row) => total + row._count._all, 0), byStatus: jobStatus },
      trackedTime: { seconds: trackedSeconds, hours: Math.round((trackedSeconds / 3600) * 100) / 100 },
      messagesSent,
      activityCount,
      communitiesJoined,
      subscription: subscription ? { planCode: subscription.planCode, status: subscription.status, endsAt: subscription.endsAt } : null,
    },
    time: { byProject, byDay },
  };
};

module.exports = { getDashboardAnalytics };