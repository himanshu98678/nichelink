const {
  createClientForUser,
  listClientsForUser,
  getClientForUser,
  updateClientForUser,
  deleteClientForUser,
} = require("../services/clientService");
const { buildClientResponse } = require("../models/client");

const createClient = async (req, res, next) => {
  try {
    const client = await createClientForUser(req.user.id, req.body);

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      client: buildClientResponse(client),
    });
  } catch (error) {
    next(error);
  }
};

const getClients = async (req, res, next) => {
  try {
    const clients = await listClientsForUser(req.user.id);

    res.status(200).json({
      success: true,
      clients: clients.map(buildClientResponse),
    });
  } catch (error) {
    next(error);
  }
};

const getClient = async (req, res, next) => {
  try {
    const client = await getClientForUser(req.user.id, req.params.id);

    res.status(200).json({
      success: true,
      client: buildClientResponse(client),
    });
  } catch (error) {
    next(error);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const client = await updateClientForUser(req.user.id, req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Client updated successfully",
      client: buildClientResponse(client),
    });
  } catch (error) {
    next(error);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    await deleteClientForUser(req.user.id, req.params.id);

    res.status(200).json({
      success: true,
      message: "Client deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
};
