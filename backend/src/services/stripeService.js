const Stripe = require("stripe");
const prisma = require("../lib/prisma");
const AppError = require("../utils/AppError");
const { env } = require("../config/env");

const checkoutConfigured = () => Boolean(
  env.STRIPE_SECRET_KEY &&
  env.STRIPE_PRICE_PRO &&
  env.STRIPE_SUCCESS_URL &&
  env.STRIPE_CANCEL_URL,
);

const webhookConfigured = () => Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);

const getStripe = () => (env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null);

async function createProCheckoutSession(userId) {
  if (!checkoutConfigured()) {throw new AppError(503, "Stripe checkout is not configured");}

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true },
  });
  if (!user) {throw new AppError(404, "User not found");}

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer_email: user.email,
    line_items: [{ price: env.STRIPE_PRICE_PRO, quantity: 1 }],
    metadata: { userId: user.id, planCode: "PRO" },
    subscription_data: { metadata: { userId: user.id, planCode: "PRO" } },
    success_url: env.STRIPE_SUCCESS_URL,
    cancel_url: env.STRIPE_CANCEL_URL,
  });

  return { id: session.id, url: session.url, status: session.status };
}

function statusFromStripe(status) {
  if (status === "active" || status === "trialing") {return "ACTIVE";}
  if (["past_due", "unpaid", "incomplete"].includes(status)) {return "PAYMENT_FAILED";}
  if (["canceled", "incomplete_expired"].includes(status)) {return "CANCELED";}
  return "PENDING";
}

function dateFromUnix(value) {
  return value ? new Date(value * 1000) : null;
}

async function findUserIdForSubscription(subscription) {
  if (subscription.metadata?.userId) {return subscription.metadata.userId;}
  const existing = await prisma.subscription.findFirst({
    where: { provider: "stripe", providerSubscriptionId: subscription.id },
    select: { userId: true },
  });
  return existing?.userId || null;
}

async function syncStripeSubscription(subscription, fallbackUserId = null) {
  const userId = await findUserIdForSubscription(subscription) || fallbackUserId;
  if (!userId) {return false;}

  const data = {
    planCode: "PRO",
    status: statusFromStripe(subscription.status),
    startsAt: dateFromUnix(subscription.start_date) || new Date(),
    endsAt: dateFromUnix(subscription.current_period_end),
    provider: "stripe",
    providerCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || null,
    providerSubscriptionId: subscription.id,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    canceledAt: dateFromUnix(subscription.canceled_at),
  };

  const existing = await prisma.subscription.findUnique({ where: { userId } });
  return existing
    ? prisma.subscription.update({ where: { userId }, data })
    : prisma.subscription.create({ data: { userId, ...data } });
}

async function resolveUserIdForInvoice(invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const linked = await prisma.subscription.findFirst({
    where: {
      OR: [
        ...(customerId ? [{ providerCustomerId: customerId }] : []),
        ...(subscriptionId ? [{ providerSubscriptionId: subscriptionId }] : []),
      ],
    },
    select: { userId: true, id: true },
  });
  return linked || null;
}

async function syncStripeInvoice(invoice) {
  const linked = await resolveUserIdForInvoice(invoice);
  if (!linked) {return false;}
  const subscriptionId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
  const paymentIntentId = typeof invoice.payment_intent === "string" ? invoice.payment_intent : invoice.payment_intent?.id;
  const localSubscription = subscriptionId
    ? await prisma.subscription.findFirst({ where: { providerSubscriptionId: subscriptionId }, select: { id: true } })
    : null;
  await prisma.billingInvoice.upsert({
    where: { providerInvoiceId: invoice.id },
    update: {
      status: invoice.status || "unknown",
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      invoiceNumber: invoice.number || null,
      providerPaymentId: paymentIntentId || null,
      currency: invoice.currency || "usd",
      amountDue: invoice.amount_due || 0,
      amountPaid: invoice.amount_paid || 0,
      issuedAt: dateFromUnix(invoice.created),
      paidAt: dateFromUnix(invoice.status_transitions?.paid_at),
      subscriptionId: localSubscription?.id || (subscriptionId ? null : linked.id),
    },
    create: {
      userId: linked.userId,
      subscriptionId: localSubscription?.id || (subscriptionId ? null : linked.id),
      providerInvoiceId: invoice.id,
      providerPaymentId: paymentIntentId || null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      invoiceNumber: invoice.number || null,
      status: invoice.status || "unknown",
      currency: invoice.currency || "usd",
      amountDue: invoice.amount_due || 0,
      amountPaid: invoice.amount_paid || 0,
      issuedAt: dateFromUnix(invoice.created),
      paidAt: dateFromUnix(invoice.status_transitions?.paid_at),
    },
  });
  return true;
}

async function syncStripeRefund(refund) {
  const paymentId = typeof refund.payment_intent === "string" ? refund.payment_intent : refund.payment_intent?.id;
  const invoice = paymentId
    ? await prisma.billingInvoice.findFirst({ where: { providerPaymentId: paymentId }, select: { id: true, userId: true } })
    : null;
  const existing = await prisma.billingRefund.findUnique({ where: { providerRefundId: refund.id } });
  const userId = existing?.userId || invoice?.userId;
  if (!userId) {return false;}
  const data = {
    userId,
    invoiceId: existing?.invoiceId || invoice?.id || null,
    providerPaymentId: paymentId,
    amount: refund.amount || 0,
    currency: refund.currency || "usd",
    status: refund.status || "PENDING",
    reason: refund.reason || null,
  };
  return existing
    ? prisma.billingRefund.update({ where: { providerRefundId: refund.id }, data })
    : prisma.billingRefund.create({ data: { providerRefundId: refund.id, ...data } });
}

async function cancelSubscriptionAtPeriodEnd(userId) {
  if (!env.STRIPE_SECRET_KEY) {throw new AppError(503, "Stripe is not configured");}
  const local = await prisma.subscription.findUnique({ where: { userId } });
  if (!local?.providerSubscriptionId) {throw new AppError(400, "No active Stripe subscription found");}
  if (local.cancelAtPeriodEnd) {return local;}
  const updated = await getStripe().subscriptions.update(local.providerSubscriptionId, { cancel_at_period_end: true });
  return syncStripeSubscription(updated, userId);
}

async function refundInvoice(invoiceId, amount) {
  if (!env.STRIPE_SECRET_KEY) {throw new AppError(503, "Stripe is not configured");}
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${invoiceId}))`;
    const invoice = await tx.billingInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {throw new AppError(404, "Invoice not found");}
    const refunds = await tx.billingRefund.aggregate({
      where: { invoiceId, status: { in: ["SUCCEEDED", "PENDING"] } },
      _sum: { amount: true },
    });
    const remaining = Math.max(0, invoice.amountPaid - (refunds._sum.amount || 0));
    if (remaining <= 0) {throw new AppError(400, "Invoice has no refundable balance");}
    if (amount !== undefined && amount > remaining) {throw new AppError(400, "Refund amount exceeds the refundable balance");}
    const stripeInvoice = await getStripe().invoices.retrieve(invoice.providerInvoiceId);
    const paymentIntent = typeof stripeInvoice.payment_intent === "string" ? stripeInvoice.payment_intent : stripeInvoice.payment_intent?.id;
    if (!paymentIntent) {throw new AppError(400, "Invoice has no refundable payment reference");}
    const refund = await getStripe().refunds.create({ payment_intent: paymentIntent, ...(amount ? { amount } : {}) });
    return tx.billingRefund.create({
      data: {
        userId: invoice.userId,
        invoiceId,
        providerRefundId: refund.id,
        providerPaymentId: paymentIntent,
        amount: refund.amount || amount || remaining,
        currency: refund.currency || invoice.currency,
        status: refund.status || "PENDING",
        reason: refund.reason || null,
      },
    });
  });
}

async function markEventProcessing(event) {
  const existing = await prisma.stripeWebhookEvent.findUnique({ where: { providerEventId: event.id } });
  if (existing?.status === "PROCESSED") {return false;}
  if (existing?.status === "PROCESSING" && existing.createdAt > new Date(Date.now() - 10 * 60 * 1000)) {return false;}

  try {
    await prisma.stripeWebhookEvent.upsert({
      where: { providerEventId: event.id },
      update: { eventType: event.type, status: "PROCESSING", error: null },
      create: { providerEventId: event.id, eventType: event.type, status: "PROCESSING" },
    });
    return true;
  } catch (error) {
    if (error.code === "P2002") {return false;}
    throw error;
  }
}

async function processWebhookEvent(event) {
  if (!(await markEventProcessing(event))) {return { duplicate: true };}

  try {
    const object = event.data.object;
    if (event.type === "checkout.session.completed") {
      const subscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
      if (subscriptionId) {
        const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
        await syncStripeSubscription(subscription, object.metadata?.userId);
      }
    } else if (["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"].includes(event.type)) {
      await syncStripeSubscription(object);
    } else if (["invoice.created", "invoice.finalized", "invoice.paid", "invoice.payment_succeeded", "invoice.payment_failed"].includes(event.type)) {
      await syncStripeInvoice(object);
      const subscriptionId = typeof object.subscription === "string" ? object.subscription : object.subscription?.id;
      if (subscriptionId && event.type === "invoice.payment_failed") {
        await prisma.subscription.updateMany({
          where: { provider: "stripe", providerSubscriptionId: subscriptionId },
          data: { status: "PAYMENT_FAILED" },
        });
      }
    } else if (["refund.created", "refund.updated"].includes(event.type)) {
      await syncStripeRefund(object);
    } else if (event.type === "charge.refunded") {
      const latestRefund = object.refunds?.data?.[0];
      if (latestRefund) {await syncStripeRefund({ ...latestRefund, payment_intent: object.payment_intent });}
    }

    await prisma.stripeWebhookEvent.update({
      where: { providerEventId: event.id },
      data: { status: "PROCESSED", processedAt: new Date(), error: null },
    });
    return { duplicate: false };
  } catch (error) {
    await prisma.stripeWebhookEvent.update({
      where: { providerEventId: event.id },
      data: { status: "FAILED", error: error.message },
    }).catch(() => null);
    throw error;
  }
}

function constructWebhookEvent(payload, signature) {
  if (!webhookConfigured()) {throw new AppError(503, "Stripe webhook is not configured");}
  if (!signature) {throw new AppError(400, "Stripe signature is required");}
  try {
    return getStripe().webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError(400, "Invalid Stripe webhook signature");
  }
}

module.exports = {
  checkoutConfigured,
  webhookConfigured,
  createProCheckoutSession,
  constructWebhookEvent,
  processWebhookEvent,
  cancelSubscriptionAtPeriodEnd,
  refundInvoice,
};
