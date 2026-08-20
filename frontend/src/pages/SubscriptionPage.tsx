import React, { useEffect, useState } from 'react';
import { CheckCircle2, CreditCard, LoaderCircle } from 'lucide-react';
import { api } from '../services/api';
import { SUBSCRIPTION_PLANS, SubscriptionPlan } from '../data/subscriptionPlans';

interface CurrentSubscription {
  id: string | null;
  planCode: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  providerSubscriptionId?: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  hasAccess: boolean;
  checkoutAvailable: boolean;
  plan: SubscriptionPlan;
}

interface BillingInvoice {
  id: string;
  providerInvoiceId: string;
  invoiceNumber?: string | null;
  hostedInvoiceUrl?: string | null;
  status: string;
  currency: string;
  amountDue: number;
  amountPaid: number;
  issuedAt?: string | null;
  paidAt?: string | null;
}

export const SubscriptionPage: React.FC = () => {
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(SUBSCRIPTION_PLANS);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [isCancelLoading, setIsCancelLoading] = useState(false);

  useEffect(() => {
    const loadBilling = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [subscriptionResponse, plansResponse, invoicesResponse] = await Promise.all([
          api.get<{ success: boolean; subscription: CurrentSubscription }>('/billing/subscription'),
          api.get<{ success: boolean; plans: SubscriptionPlan[] }>('/billing/plans'),
          api.get<{ success: boolean; items: BillingInvoice[] }>('/billing/invoices'),
        ]);
        setSubscription(subscriptionResponse.subscription);
        setPlans(plansResponse.plans || SUBSCRIPTION_PLANS);
        setInvoices(invoicesResponse.items || []);
      } catch (error: any) {
        setErrorMessage(api.getFriendlyMessage(error));
      } finally {
        setIsLoading(false);
      }
    };
    loadBilling();
  }, []);

  const startCheckout = async () => {
    setIsCheckoutLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post<{ success: boolean; session: { url?: string } }>('/billing/checkout', { planCode: 'PRO' });
      if (!response.session?.url) throw new Error('Stripe checkout did not return a redirect URL.');
      window.location.assign(response.session.url);
    } catch (error: any) {
      setErrorMessage(api.getFriendlyMessage(error));
      setIsCheckoutLoading(false);
    }
  };

  const cancelSubscription = async () => {
    if (!window.confirm('Cancel your subscription at the end of the current billing period?')) return;
    setIsCancelLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post<{ success: boolean; subscription: CurrentSubscription }>('/billing/subscription/cancel', {});
      setSubscription((previous) => previous ? { ...previous, ...response.subscription, cancelAtPeriodEnd: true } : previous);
    } catch (error: any) {
      setErrorMessage(api.getFriendlyMessage(error));
    } finally {
      setIsCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl space-y-3 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Billing & Subscription</span>
          <h1 className="text-3xl font-extrabold text-slate-900">Your plan</h1>
          <p className="text-sm text-slate-600">Subscription state is read from your account on the server.</p>
        </div>

        {isLoading && <div className="flex items-center gap-2 text-sm text-slate-500"><LoaderCircle className="w-4 h-4 animate-spin" /> Loading subscription...</div>}
        {errorMessage && <p className="text-sm text-rose-600">{errorMessage}</p>}

        {!isLoading && subscription && (
          <div className="mb-8 bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">Current plan</p>
                <h2 className="text-2xl font-bold text-slate-900">{subscription.plan.name}</h2>
              </div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold"><CheckCircle2 className="w-4 h-4" />{subscription.status}</span>
            </div>
            <p className="mt-4 text-sm text-slate-600">Status is synchronized from Stripe webhooks. Access remains available until the server-reported end date.</p>
            {subscription.cancelAtPeriodEnd && <p className="mt-2 text-sm text-amber-700">Cancellation scheduled{subscription.endsAt ? ` for ${new Date(subscription.endsAt).toLocaleDateString()}` : ''}.</p>}
            {!subscription.cancelAtPeriodEnd && subscription.providerSubscriptionId && subscription.status === 'ACTIVE' && <button type="button" onClick={cancelSubscription} disabled={isCancelLoading} className="mt-4 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50">{isCancelLoading ? 'Scheduling cancellation...' : 'Cancel at period end'}</button>}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.code} className={`bg-white border rounded-2xl p-6 ${subscription?.planCode === plan.code ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-slate-200'}`}>
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900">{plan.name}</h2><p className="text-3xl font-extrabold text-slate-900 mt-3">${plan.price}<span className="text-xs font-medium text-slate-500"> / {plan.interval}</span></p></div>{subscription?.planCode === plan.code && <span className="text-xs font-semibold text-indigo-600">Current</span>}</div>
              <ul className="mt-6 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-slate-700"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />{feature}</li>)}</ul>
              {plan.code === 'PRO' && (subscription?.checkoutAvailable ? <button type="button" onClick={startCheckout} disabled={isCheckoutLoading} className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"><CreditCard className="w-4 h-4" />{isCheckoutLoading ? 'Opening checkout...' : 'Upgrade with Stripe'}</button> : <button type="button" disabled className="mt-6 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-100 text-slate-500 text-sm font-semibold cursor-not-allowed"><CreditCard className="w-4 h-4" />Checkout not configured</button>)}
            </div>
          ))}
        </div>

        <section className="mt-10 bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-slate-900">Invoice history</h2>
          {invoices.length === 0 ? <p className="mt-4 text-sm text-slate-500">No invoices are available yet.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-slate-100"><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Reference</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Status</th><th className="py-3">Invoice</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b border-slate-50"><td className="py-3 pr-4">{invoice.issuedAt ? new Date(invoice.issuedAt).toLocaleDateString() : 'Pending'}</td><td className="py-3 pr-4 font-mono text-xs">{invoice.invoiceNumber || invoice.providerInvoiceId}</td><td className="py-3 pr-4">{(invoice.amountPaid || invoice.amountDue) / 100} {invoice.currency.toUpperCase()}</td><td className="py-3 pr-4">{invoice.status}</td><td className="py-3">{invoice.hostedInvoiceUrl ? <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-semibold">Open hosted invoice</a> : 'Unavailable'}</td></tr>)}</tbody></table></div>}
        </section>
      </div>
    </div>
  );
};