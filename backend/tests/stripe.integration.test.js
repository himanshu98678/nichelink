process.env.STRIPE_SECRET_KEY = "sk_test_integration_placeholder";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_integration_test";

const Stripe = require("stripe");
const request = require("supertest");
const app = require("../src/app");
const prisma = require("../src/lib/prisma");

jest.setTimeout(60000);

describe("Stripe checkout and webhook integration", () => {
  let token;
  let userId;

  beforeAll(async () => {
    await prisma.stripeWebhookEvent.deleteMany({ where: { providerEventId: { in: ["evt_subscription_test", "evt_invoice_test"] } } });
    const suffix = Date.now();
    const response = await request(app).post("/api/auth/register").send({
      name: "Stripe Integration User",
      username: `stripe_${suffix}`,
      email: `stripe_${suffix}@example.com`,
      password: "Password123!",
    });
    expect(response.statusCode).toBe(201);
    token = response.body.token;
    userId = response.body.user.id;
  });

  afterAll(async () => {
    await prisma.billingRefund.deleteMany({ where: { userId } });
    await prisma.billingInvoice.deleteMany({ where: { userId } });
    await prisma.stripeWebhookEvent.deleteMany({ where: { providerEventId: "evt_subscription_test" } });
    await prisma.stripeWebhookEvent.deleteMany({ where: { providerEventId: "evt_invoice_test" } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } }).catch(() => null);
    await prisma.$disconnect();
  });

  test("requires an allowed plan and configured checkout", async () => {
    await request(app)
      .post("/api/billing/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ planCode: "FREE" })
      .expect(400);

    await request(app)
      .post("/api/billing/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ planCode: "PRO" })
      .expect(503);
  });

  test("rejects an invalid webhook signature", async () => {
    await request(app)
      .post("/api/billing/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", "invalid")
      .send(JSON.stringify({ id: "evt_invalid", type: "customer.subscription.updated", data: { object: {} } }))
      .expect(400);
  });

  test("verifies, synchronizes, and deduplicates subscription events", async () => {
    const payload = JSON.stringify({
      id: "evt_subscription_test",
      object: "event",
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_integration_test",
          status: "active",
          start_date: 1700000000,
          current_period_end: 1800000000,
          customer: "cus_integration_test",
          metadata: { userId, planCode: "PRO" },
        },
      },
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });

    const first = await request(app)
      .post("/api/billing/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signature)
      .send(payload)
      .expect(200);
    expect(first.body.duplicate).toBe(false);

    const subscription = await prisma.subscription.findUnique({ where: { userId } });
    expect(subscription.planCode).toBe("PRO");
    expect(subscription.status).toBe("ACTIVE");
    expect(subscription.providerSubscriptionId).toBe("sub_integration_test");

    const second = await request(app)
      .post("/api/billing/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signature)
      .send(payload)
      .expect(200);
    expect(second.body.duplicate).toBe(true);
    await expect(prisma.stripeWebhookEvent.count({ where: { providerEventId: "evt_subscription_test" } })).resolves.toBe(1);
  });

  test("stores invoice webhook data and restricts refund access", async () => {
    const payload = JSON.stringify({
      id: "evt_invoice_test",
      object: "event",
      type: "invoice.paid",
      data: {
        object: {
          id: "in_integration_test",
          customer: "cus_integration_test",
          subscription: "sub_integration_test",
          status: "paid",
          currency: "usd",
          amount_due: 1900,
          amount_paid: 1900,
          created: 1700000000,
          payment_intent: "pi_integration_test",
          hosted_invoice_url: "https://invoice.stripe.test/in_integration_test",
        },
      },
    });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const signature = stripe.webhooks.generateTestHeaderString({ payload, secret: process.env.STRIPE_WEBHOOK_SECRET });

    await request(app)
      .post("/api/billing/webhook")
      .set("Content-Type", "application/json")
      .set("stripe-signature", signature)
      .send(payload)
      .expect(200);

    const invoice = await prisma.billingInvoice.findUnique({ where: { providerInvoiceId: "in_integration_test" } });
    expect(invoice.amountPaid).toBe(1900);
    expect(invoice.hostedInvoiceUrl).toContain("stripe.test");

    const invoices = await request(app)
      .get("/api/billing/invoices")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
    expect(invoices.body.items[0].providerInvoiceId).toBe("in_integration_test");

    await request(app)
      .post(`/api/billing/invoices/${invoice.id}/refund`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(403);
  });

  test("requires a configured Stripe subscription for cancellation", async () => {
    await request(app)
      .post("/api/billing/subscription/cancel")
      .set("Authorization", `Bearer ${token}`)
      .send({})
        .expect(401);
  });
});