const subscriptionService = require("../services/subscriptionService");
const stripeService = require("../services/stripeService");

const plans = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, plans: subscriptionService.getPlans() });
  } catch (error) {
    return next(error);
  }
};

const current = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getCurrentSubscription(req.user.id);
    return res.status(200).json({ success: true, subscription });
  } catch (error) {
    return next(error);
  }
};

const checkout = async (req, res, next) => {
  try {
    if (req.body?.planCode !== "PRO") {
      return res.status(400).json({ success: false, message: "Only the PRO plan is available for checkout" });
    }
    const session = await stripeService.createProCheckoutSession(req.user.id);
    return res.status(201).json({ success: true, session });
  } catch (error) {
    return next(error);
  }
};

const webhook = async (req, res, next) => {
  try {
    const event = stripeService.constructWebhookEvent(req.rawBody, req.headers["stripe-signature"]);
    const result = await stripeService.processWebhookEvent(event);
    return res.status(200).json({ received: true, duplicate: result.duplicate });
  } catch (error) {
    return next(error);
  }
};

const invoices = async (req, res, next) => {
  try {
    const items = await subscriptionService.listInvoices(req.user.id);
    return res.status(200).json({ success: true, items });
  } catch (error) {
    return next(error);
  }
};

const cancel = async (req, res, next) => {
  try {
    const subscription = await stripeService.cancelSubscriptionAtPeriodEnd(req.user.id);
    return res.status(200).json({ success: true, subscription });
  } catch (error) {
    return next(error);
  }
};

const refund = async (req, res, next) => {
  try {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Administrator authorization is required for refunds' });
    }
    const amount = req.body?.amount === undefined ? undefined : Number(req.body.amount);
    if (amount !== undefined && (!Number.isInteger(amount) || amount <= 0)) {
      return res.status(400).json({ success: false, message: 'Refund amount must be a positive integer in the smallest currency unit' });
    }
    const result = await stripeService.refundInvoice(req.params.invoiceId, amount);
    return res.status(201).json({ success: true, refund: result });
  } catch (error) {
    return next(error);
  }
};

module.exports = { plans, current, checkout, webhook, invoices, cancel, refund };