const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const feedService = require("./feedService");

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const SEARCH_TYPES = ["all", "users", "communities", "posts", "comments", "jobs", "projects", "tasks", "messages"];

function normalizePagination(options = {}) {
  const page = parseInt(options.page, 10) || DEFAULT_PAGE;
  const limit = parseInt(options.limit, 10) || DEFAULT_LIMIT;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginationResult(items, total, page, limit) {
  const totalPages = Math.ceil(total / limit) || 0;
  return {
    items,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrevious: page > 1,
  };
}

function toKeywordArray(value) {
  if (!value) {return undefined;}
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function buildOrderBy(type, sortBy, sortOrder) {
  const order = String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc";
  const normalizedSortBy = String(sortBy || "").trim().toLowerCase();
  switch (normalizedSortBy) {
    case "latest":
      return { createdAt: "desc" };
    case "oldest":
      return { createdAt: "asc" };
    case "alphabetical":
      switch (type) {
        case "users":
          return { username: order };
        case "communities":
          return { name: order };
        case "posts":
        case "comments":
        case "messages":
          return { content: order };
        case "jobs":
          return { title: order };
        case "projects":
          return { title: order };
        case "tasks":
          return { title: order };
        default:
          return { createdAt: order };
      }
    default:
      return { createdAt: order };
  }
}

function normalizeSearchType(type) {
  const normalized = String(type || "all").trim().toLowerCase();
  return SEARCH_TYPES.includes(normalized) ? normalized : "all";
}

async function recordSearchHistory(userId, keyword, type) {
  if (!userId || !keyword) {return;}
  await prisma.searchHistory.create({
    data: {
      userId,
      keyword: keyword.trim(),
      type: normalizeSearchType(type),
    },
  });
}

async function recordSearchKeyword(keyword) {
  if (!keyword) {
    return;
  }

  const normalized = keyword.trim().toLowerCase();
  const existing = await prisma.searchKeyword.findUnique({ where: { keyword: normalized } });
  if (existing) {
    await prisma.searchKeyword.update({
      where: { id: existing.id },
      data: { count: { increment: 1 } },
    });
    return;
  }

  await prisma.searchKeyword.create({ data: { keyword: normalized, count: 1 } });
  return;
}

function buildUserFilters(options = {}) {
  const filters = [];
  if (options.date) {filters.push({ createdAt: { gte: new Date(options.date) } });}
  if (options.skills) {
    const skills = toKeywordArray(options.skills);
    if (skills) {filters.push({ skills: { hasSome: skills } });}
  }
  return filters;
}

function buildCommunityFilters(options = {}) {
  const filters = [];
  if (options.date) {filters.push({ createdAt: { gte: new Date(options.date) } });}
  return filters;
}

function buildPostFilters(options = {}) {
  const filters = [];
  if (options.date) {filters.push({ createdAt: { gte: new Date(options.date) } });}
  if (options.author) {filters.push({ author: { username: { contains: options.author.trim(), mode: "insensitive" } } });}
  if (options.community) {filters.push({ community: { name: { contains: options.community.trim(), mode: "insensitive" } } });}
  return filters;
}

function buildCommentFilters(options = {}) {
  const filters = [];
  if (options.date) {filters.push({ createdAt: { gte: new Date(options.date) } });}
  if (options.author) {filters.push({ user: { username: { contains: options.author.trim(), mode: "insensitive" } } });}
  return filters;
}

function buildJobFilters(options = {}) {
  const filters = [];
  if (options.date) {filters.push({ createdAt: { gte: new Date(options.date) } });}
  if (options.author) {filters.push({ postedBy: { username: { contains: options.author.trim(), mode: "insensitive" } } });}
  if (options.category) {filters.push({ category: { contains: options.category.trim(), mode: "insensitive" } });}
  if (options.status) {filters.push({ status: { contains: options.status.trim(), mode: "insensitive" } });}
  if (options.skills) {
    const skills = toKeywordArray(options.skills);
    if (skills) {filters.push({ skills: { hasSome: skills } });}
  }
  if (options.location) {filters.push({ location: { contains: options.location.trim(), mode: "insensitive" } });}
  return filters;
}

function buildProjectFilters(options = {}) {
  const filters = [];
  if (options.date) {filters.push({ createdAt: { gte: new Date(options.date) } });}
  if (options.author) {filters.push({ owner: { username: { contains: options.author.trim(), mode: "insensitive" } } });}
  if (options.status) {filters.push({ status: { contains: options.status.trim(), mode: "insensitive" } });}
  return filters;
}

function buildTaskFilters(options = {}) {
  const filters = [];
  if (options.date) {filters.push({ createdAt: { gte: new Date(options.date) } });}
  if (options.status) {filters.push({ status: { contains: options.status.trim(), mode: "insensitive" } });}
  if (options.priority) {filters.push({ priority: { contains: options.priority.trim(), mode: "insensitive" } });}
  if (options.author) {filters.push({ assignee: { username: { contains: options.author.trim(), mode: "insensitive" } } });}
  return filters;
}

function buildProjectAccessCondition(user) {
  if (!user) {
    return { id: { in: [] } };
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return {};
  }

  return {
    OR: [
      { ownerId: user.id },
      { members: { some: { userId: user.id } } },
    ],
  };
}

function buildTaskAccessCondition(user) {
  if (!user) {
    return { id: { in: [] } };
  }

  if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
    return {};
  }

  return {
    project: buildProjectAccessCondition(user),
  };
}

function buildUserSearchWhere(q, user) {
  const normalized = q.trim();
  const userFilters = [
    { username: { contains: normalized, mode: "insensitive" } },
    { name: { contains: normalized, mode: "insensitive" } },
    { bio: { contains: normalized, mode: "insensitive" } },
    { skills: { has: normalized } },
  ];
  if (user && user.role === "ADMIN") {
    userFilters.push({ email: { contains: normalized, mode: "insensitive" } });
  }
  return { OR: userFilters };
}

function buildCommunitySearchWhere(q) {
  const normalized = q.trim();
  return {
    OR: [
      { name: { contains: normalized, mode: "insensitive" } },
      { description: { contains: normalized, mode: "insensitive" } },
      { slug: { contains: normalized, mode: "insensitive" } },
    ],
  };
}

function buildPostSearchWhere(q) {
  const normalized = q.trim();
  return {
    OR: [
      { content: { contains: normalized, mode: "insensitive" } },
      { author: { username: { contains: normalized, mode: "insensitive" } } },
      { author: { name: { contains: normalized, mode: "insensitive" } } },
      { community: { name: { contains: normalized, mode: "insensitive" } } },
    ],
  };
}

function buildCommentSearchWhere(q) {
  const normalized = q.trim();
  return {
    OR: [
      { content: { contains: normalized, mode: "insensitive" } },
      { user: { username: { contains: normalized, mode: "insensitive" } } },
      { user: { name: { contains: normalized, mode: "insensitive" } } },
    ],
  };
}

function buildJobSearchWhere(q) {
  const normalized = q.trim();
  return {
    OR: [
      { title: { contains: normalized, mode: "insensitive" } },
      { company: { contains: normalized, mode: "insensitive" } },
      { location: { contains: normalized, mode: "insensitive" } },
      { skills: { has: normalized } },
      { employmentType: { contains: normalized, mode: "insensitive" } },
      { category: { contains: normalized, mode: "insensitive" } },
    ],
  };
}

function buildProjectSearchWhere(q) {
  const normalized = q.trim();
  return {
    OR: [
      { title: { contains: normalized, mode: "insensitive" } },
      { description: { contains: normalized, mode: "insensitive" } },
      { owner: { username: { contains: normalized, mode: "insensitive" } } },
      { owner: { name: { contains: normalized, mode: "insensitive" } } },
      { status: { contains: normalized, mode: "insensitive" } },
    ],
  };
}

function buildTaskSearchWhere(q) {
  const normalized = q.trim();
  return {
    OR: [
      { title: { contains: normalized, mode: "insensitive" } },
      { description: { contains: normalized, mode: "insensitive" } },
      { status: { contains: normalized, mode: "insensitive" } },
      { priority: { contains: normalized, mode: "insensitive" } },
      { assignee: { username: { contains: normalized, mode: "insensitive" } } },
      { assignee: { name: { contains: normalized, mode: "insensitive" } } },
    ],
  };
}

function buildMessageSearchWhere(q) {
  const normalized = q.trim();
  return {
    OR: [
      { content: { contains: normalized, mode: "insensitive" } },
      { attachments: { some: { url: { contains: normalized, mode: "insensitive" } } } },
      { attachments: { some: { fileName: { contains: normalized, mode: "insensitive" } } } },
      { attachments: { some: { fileType: { contains: normalized, mode: "insensitive" } } } },
    ],
  };
}

async function searchUsers(user, options) {
  const { page, limit, skip } = normalizePagination(options);
  const where = buildUserSearchWhere(options.q, user);
  const filters = buildUserFilters(options);
  if (filters.length) {where.AND = [...(where.AND || []), ...filters];}

  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
    const publicFilter = { OR: [{ visibility: "public" }] };
    if (user?.id) {
      publicFilter.OR.push({ id: user.id });
    }
    where.AND = [...(where.AND || []), publicFilter];
  }

  const select = {
    id: true,
    name: true,
    username: true,
    avatar: true,
    isOnline: true,
    bio: true,
    skills: true,
    visibility: true,
    createdAt: true,
  };
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
    select.email = true;
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy("users", options.sortBy, options.sortOrder),
      select,
    }),
    prisma.user.count({ where }),
  ]);

  return { type: "users", ...buildPaginationResult(items, total, page, limit) };
}

async function searchCommunities(user, options) {
  const { page, limit, skip } = normalizePagination(options);
  const searchWhere = buildCommunitySearchWhere(options.q);
  const filters = buildCommunityFilters(options);
  const where = { AND: [searchWhere, ...filters].filter(Boolean) };

  if (user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN") {
    const accessWhere = user
      ? {
          OR: [
            { visibility: "public" },
            { ownerId: user.id },
            { members: { some: { userId: user.id } } },
          ],
        }
      : { visibility: "public" };
    where.AND.push(accessWhere);
  }

  const [items, total] = await Promise.all([
    prisma.community.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy("communities", options.sortBy, options.sortOrder),
      include: {
        owner: { select: { id: true, name: true, username: true, email: true } },
      },
    }),
    prisma.community.count({ where }),
  ]);

  return { type: "communities", ...buildPaginationResult(items, total, page, limit) };
}

async function searchPosts(user, options) {
  const { page, limit, skip } = normalizePagination(options);
  const searchWhere = buildPostSearchWhere(options.q);
  const filters = buildPostFilters(options);
  const context = await feedService.getUserAccessContext(user?.id);
  const visibilityWhere = feedService.buildVisibilityCondition(context);

  const where = {
    AND: [visibilityWhere, searchWhere, ...filters].filter(Boolean),
  };

  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy("posts", options.sortBy, options.sortOrder),
      include: {
        author: { select: { id: true, name: true, username: true, email: true } },
        community: { select: { id: true, name: true, slug: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return { type: "posts", ...buildPaginationResult(items, total, page, limit) };
}

async function searchComments(user, options) {
  const { page, limit, skip } = normalizePagination(options);
  const where = buildCommentSearchWhere(options.q);
  const filters = buildCommentFilters(options);
  if (filters.length) {where.AND = [...(where.AND || []), ...filters];}

  if (!(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN")) {
    const context = await feedService.getUserAccessContext(user?.id);
    const visibilityWhere = feedService.buildVisibilityCondition(context);
    where.AND = [...(where.AND || []), { post: visibilityWhere }];
  }

  const [items, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy("comments", options.sortBy, options.sortOrder),
      include: {
        user: { select: { id: true, name: true, username: true, email: true } },
        post: { select: { id: true, content: true } },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return { type: "comments", ...buildPaginationResult(items, total, page, limit) };
}

async function searchJobs(options) {
  const { page, limit, skip } = normalizePagination(options);
  const where = buildJobSearchWhere(options.q);
  const filters = buildJobFilters(options);
  if (filters.length) {where.AND = [...(where.AND || []), ...filters];}

  const [items, total] = await Promise.all([
    prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy("jobs", options.sortBy, options.sortOrder),
      include: {
        postedBy: { select: { id: true, name: true, username: true, email: true } },
      },
    }),
    prisma.job.count({ where }),
  ]);

  return { type: "jobs", ...buildPaginationResult(items, total, page, limit) };
}

async function searchProjects(user, options) {
  const { page, limit, skip } = normalizePagination(options);
  const where = buildProjectSearchWhere(options.q);
  const filters = buildProjectFilters(options);
  if (filters.length) {where.AND = [...(where.AND || []), ...filters];}

  const accessWhere = buildProjectAccessCondition(user);
  if (Object.keys(accessWhere).length > 0) {
    where.AND = [...(where.AND || []), accessWhere];
  }

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy("projects", options.sortBy, options.sortOrder),
      include: {
        owner: { select: { id: true, name: true, username: true, email: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return { type: "projects", ...buildPaginationResult(items, total, page, limit) };
}

async function searchTasks(user, options) {
  const { page, limit, skip } = normalizePagination(options);
  const where = buildTaskSearchWhere(options.q);
  const filters = buildTaskFilters(options);
  if (filters.length) {where.AND = [...(where.AND || []), ...filters];}

  const accessWhere = buildTaskAccessCondition(user);
  if (Object.keys(accessWhere).length > 0) {
    where.AND = [...(where.AND || []), accessWhere];
  }

  const [items, total] = await Promise.all([
    prisma.task.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy("tasks", options.sortBy, options.sortOrder),
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, username: true, email: true } },
      },
    }),
    prisma.task.count({ where }),
  ]);

  return { type: "tasks", ...buildPaginationResult(items, total, page, limit) };
}

async function searchMessages(userId, options) {
  if (!userId) {
    throw new AppError(401, "Authentication required for message search");
  }

  const { page, limit, skip } = normalizePagination(options);
  const where = {
    conversation: {
      participants: { some: { userId } },
    },
    isDeleted: false,
    ...buildMessageSearchWhere(options.q),
  };

  const [items, total] = await Promise.all([
    prisma.message.findMany({
      where,
      skip,
      take: limit,
      orderBy: buildOrderBy("messages", options.sortBy, options.sortOrder),
      include: {
        sender: { select: { id: true, name: true, username: true, email: true } },
        conversation: { select: { id: true, name: true, isGroup: true } },
      },
    }),
    prisma.message.count({ where }),
  ]);

  return { type: "messages", ...buildPaginationResult(items, total, page, limit) };
}

async function search(user, options = {}) {
  if (!options.q || !options.q.trim()) {
    throw new AppError(400, "Query is required");
  }

  const type = normalizeSearchType(options.type);

  if (type === "messages" && !user?.id) {
    throw new AppError(401, "Authentication required for message search");
  }

  await Promise.all([recordSearchKeyword(options.q), recordSearchHistory(user?.id, options.q, type)]);

  const searchers = {
    users: () => searchUsers(user, options),
    communities: () => searchCommunities(user, options),
    posts: () => searchPosts(user, options),
    comments: () => searchComments(user, options),
    jobs: () => searchJobs(options),
    projects: () => searchProjects(user, options),
    tasks: () => searchTasks(user, options),
    messages: () => searchMessages(user?.id, options),
  };

  if (type === "all") {
    const resultKeys = Object.keys(searchers).filter((key) => {
      if (key === "messages" && !user?.id) {return false;}
      return true;
    });

    const results = await Promise.all(resultKeys.map((key) => searchers[key]()));
    return { type: "all", results };
  }

  return await searchers[type]();
}

async function getSuggestions(user, query) {
  const recent = user
    ? await prisma.searchHistory.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { keyword: true },
      })
    : [];

  const popular = await prisma.searchKeyword.findMany({
    orderBy: { count: "desc" },
    take: 5,
    select: { keyword: true },
  });

  const matchingKeywords = query
    ? await prisma.searchKeyword.findMany({
        where: { keyword: { contains: query.trim().toLowerCase(), mode: "insensitive" } },
        take: 5,
        select: { keyword: true },
      })
    : [];

  return {
    recent: recent.map((item) => item.keyword),
    popular: popular.map((item) => item.keyword),
    matching: matchingKeywords.map((item) => item.keyword),
  };
}

async function getRecentSearches(userId) {
  const recent = await prisma.searchHistory.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, keyword: true, type: true, createdAt: true },
  });
  return recent;
}

async function clearRecentSearches(userId) {
  await prisma.searchHistory.deleteMany({ where: { userId } });
}

async function getTrending(limit = 10) {
  const keywords = await prisma.searchKeyword.findMany({
    orderBy: { count: "desc" },
    take: parseInt(limit, 10) || 10,
    select: { keyword: true, count: true },
  });
  return keywords;
}

module.exports = {
  search,
  getSuggestions,
  getRecentSearches,
  clearRecentSearches,
  getTrending,
};
