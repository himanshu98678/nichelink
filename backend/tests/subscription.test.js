const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

jest.setTimeout(60000);

describe("Subscription foundation", () => {
  let token;
  let userId;

  beforeAll(async () => {
    const suffix = Date.now();
    const response = await request(app).post("/api/auth/register").send({
      name: "Subscription Test User",
      username: `sub_${suffix}`,
      email: `subscription_${suffix}@example.com`,
      password: "Password123!",
    });
    token = response.body.token;
    userId = response.body.user.id;
  });

  afterAll(async () => {
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => null);
    await prisma.$disconnect();
  });

  test("requires authentication", async () => {
    await request(app).get("/api/billing/plans").expect(401);
    await request(app).get("/api/billing/subscription").expect(401);
  });

  test("returns centralized plans and the authenticated user's effective free subscription", async () => {
    const plansResponse = await request(app)
      .get("/api/billing/plans")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(plansResponse.body.plans.map((plan) => plan.code)).toEqual(["FREE", "PRO"]);
    expect(plansResponse.body.plans[1].price).toBe(19);

    const subscriptionResponse = await request(app)
      .get("/api/billing/subscription")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(subscriptionResponse.body.subscription.planCode).toBe("FREE");
    expect(subscriptionResponse.body.subscription.status).toBe("ACTIVE");
    expect(subscriptionResponse.body.subscription.checkoutAvailable).toBe(false);
    expect(subscriptionResponse.body.subscription.providerSubscriptionId).toBeUndefined();
  });
});
