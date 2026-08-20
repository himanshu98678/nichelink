const buildClientResponse = (client) => ({
  id: client.id,
  name: client.name,
  email: client.email,
  phone: client.phone,
  company: client.company,
  address: client.address,
  notes: client.notes,
  userId: client.userId,
  createdAt: client.createdAt,
  updatedAt: client.updatedAt,
});

module.exports = {
  buildClientResponse,
};
