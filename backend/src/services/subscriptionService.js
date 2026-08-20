const prisma = require("../lib/prisma");
const { SUBSCRIPTION_PLANS } = require("../config/subscriptionPlans");
const { checkoutConfigured } = require("./stripeService");

const getPlans = () => SUBSCRIPTION_PLANS;

async function getCurrentSubscription(userId) {
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: {
      id: true,
      planCode: true,
      status: true,
      startsAt: true,
      endsAt: true,
      provider: true,
      providerSubscriptionId: true,
      cancelAtPeriodEnd: true,
      canceledAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (subscription) {
    return {
      ...subscription,
      plan: SUBSCRIPTION_PLANS.find((plan) => plan.code === subscription.planCode) || SUBSCRIPTION_PLANS[0],
      checkoutAvailable: checkoutConfigured(),
      hasAccess: ["ACTIVE", "PENDING", "PAYMENT_FAILED"].includes(subscription.status) && (!subscription.endsAt || subscription.endsAt > new Date()),
    };
  }

  return {
    id: null,
    planCode: "FREE",
    status: "ACTIVE",
    startsAt: null,
    endsAt: null,
    provider: null,
    createdAt: null,
    updatedAt: null,
    plan: SUBSCRIPTION_PLANS[0],
    checkoutAvailable: checkoutConfigured(),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    hasAccess: true,
  };
}

async function listInvoices(userId) {
  return prisma.billingInvoice.findMany({
    where: { userId },
    orderBy: { issuedAt: "desc" },
    select: {
      id: true,
      providerInvoiceId: true,
      invoiceNumber: true,
      hostedInvoiceUrl: true,
      status: true,
      currency: true,
      amountDue: true,
      amountPaid: true,
      issuedAt: true,
      paidAt: true,
      createdAt: true,
    },
  });
}

module.exports = { getPlans, getCurrentSubscription, listInvoices };