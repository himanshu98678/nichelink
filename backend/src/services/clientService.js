const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");

const createClientForUser = async (userId, data) => {
  const { name, email, phone, company, address, notes } = data;

  if (!name?.trim() || !email?.trim()) {
    throw new AppError(400, "Name and email are required");
  }

  try {
    return await prisma.client.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
        userId,
      },
    });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError(409, "A client with that email already exists");
    }
    throw error;
  }
};

const listClientsForUser = async (userId) => {
  return prisma.client.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
};

const getClientForUser = async (userId, clientId) => {
  const client = await prisma.client.findFirst({
    where: {
      id: clientId,
      userId,
    },
  });

  if (!client) {
    throw new AppError(404, "Client not found");
  }

  return client;
};

const updateClientForUser = async (userId, clientId, data) => {
  const existingClient = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!existingClient) {
    throw new AppError(404, "Client not found");
  }

  const payload = {};

  if (data.name !== undefined) {
    payload.name = data.name.trim();
  }
  if (data.email !== undefined) {
    payload.email = data.email.trim().toLowerCase();
  }
  if (data.phone !== undefined) {
    payload.phone = data.phone?.trim() || null;
  }
  if (data.company !== undefined) {
    payload.company = data.company?.trim() || null;
  }
  if (data.address !== undefined) {
    payload.address = data.address?.trim() || null;
  }
  if (data.notes !== undefined) {
    payload.notes = data.notes?.trim() || null;
  }

  if (!payload.name && existingClient.name) {
    payload.name = existingClient.name;
  }
  if (!payload.email && existingClient.email) {
    payload.email = existingClient.email;
  }

  if (!payload.name || !payload.email) {
    throw new AppError(400, "Name and email are required");
  }

  try {
    const result = await prisma.client.updateMany({
      where: { id: clientId, userId },
      data: payload,
    });

    if (result.count === 0) {
      throw new AppError(404, "Client not found");
    }

    return prisma.client.findUnique({ where: { id: clientId } });
  } catch (error) {
    if (error.code === "P2002") {
      throw new AppError(409, "A client with that email already exists");
    }
    throw error;
  }
};

const deleteClientForUser = async (userId, clientId) => {
  const existingClient = await prisma.client.findFirst({
    where: { id: clientId, userId },
  });

  if (!existingClient) {
    throw new AppError(404, "Client not found");
  }

  await prisma.client.deleteMany({
    where: { id: clientId, userId },
  });

  return true;
};

module.exports = {
  createClientForUser,
  listClientsForUser,
  getClientForUser,
  updateClientForUser,
  deleteClientForUser,
};