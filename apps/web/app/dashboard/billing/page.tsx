'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  PhoneCall,
  Video,
  Monitor,
  Receipt,
  CreditCard,
  Loader2,
  Clock,
  AlertTriangle,
  CalendarClock,
  ShieldCheck,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { api } from '../../lib/api';
import { Badge } from '../../components/ui/Badge';
import PaymentMethodCard, { PaymentMethod } from './PaymentMethodCard';
import BillingTimeline from './BillingTimeline';
import { ToastHost, ToastState } from './Toast';

interface CurrentUsage {
  cycle: { start: string; end: string };
  usage: {
    audioMinutes: number;
    videoMinutes: number;
    screenShareMinutes: number;
    participants: number;
    callsCreated: number;
    callsCompleted: number;
  };
  freeAllowance: { audioMinutes: number; videoMinutes: number };
  rates: { audioPaise: number; videoPaise: number; screenSharePaise: number };
  cost: {
    audioPaise: number;
    videoPaise: number;
    screenSharePaise: number;
    totalPaise: number;
  };
  estimatedMonthEndPaise: number;
  nextBillingDate: string;
  isFreeTier?: boolean;
  hasPaymentMethod?: boolean;
  freeUsagePercent?: number;
}

interface UsageInvoice {
  id: string;
  invoiceNumber: string;
  cycleStart: string;
  cycleEnd: string;
  audioMinutes: number;
  videoMinutes: number;
  screenShareMinutes: number;
  audioPaise: number;
  videoPaise: number;
  screenSharePaise: number;
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  currency: string;
  status: string;
  paidAt: string | null;
  lineItems?: any[];
}

const paiseToINR = (paise: number) => `₹${(paise / 100).toFixed(2)}`;

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  open: 'info',
  paid: 'success',
  dunning: 'warning',
  failed: 'error',
};

export default function BillingPage() {
  const { token, logout } = useAuthStore();
  const router = useRouter();
  const { isReady } = useRequireAuth();

  const [usage, setUsage] = useState<CurrentUsage | null>(null);
  const [invoices, setInvoices] = useState<UsageInvoice[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [spendingLimitPaise, setSpendingLimitPaise] = useState<number | null>(null);

  const showToast = useCallback((type: 'success' | 'error', message: string) => {
    setToast({ id: Date.now(), type, message });
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [usageRes, invoiceRes, pmRes, limitRes] = await Promise.all([
        api.get('/billing/current-usage'),
        api.get('/billing/usage-invoices'),
        api.get('/billing/payment-methods'),
        api.get('/billing/spending-limit'),
      ]);
      setUsage(usageRes.data);
      setInvoices(invoiceRes.data ?? []);
      setPaymentMethods(pmRes.data ?? []);
      setSpendingLimitPaise(limitRes.data?.spendingLimitPaise ?? null);
      setError(null);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        logout();
        router.push('/login');
      } else {
        setError('Failed to load billing details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [logout, router]);

  useEffect(() => {
    if (!isReady) return;
    if (!token) { router.push('/login'); return; }
    fetchAll();
  }, [isReady, token, fetchAll, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin h-6 w-6 text-indigo-500" />
          <span className="text-sm text-slate-500">Loading billing…</span>
        </div>
      </div>
    );
  }

const u = usage?.usage;
  const cost = usage?.cost;
  const free = usage?.freeAllowance;
  const rates = usage?.rates;
  const paiseToINRShort = (p: number) => `₹${(p / 100).toFixed(2)}`;

  const hasDefaultCard = paymentMethods.some((pm) => pm.default);
  const hasBillableUsage = (cost?.totalPaise ?? 0) > 0 || (usage?.estimatedMonthEndPaise ?? 0) > 0;
  const latestInvoiceStatus = invoices[0]?.status;
  const billingAtRisk = latestInvoiceStatus === 'failed' || latestInvoiceStatus === 'dunning';

  const billingStatus: { label: string; variant: 'success' | 'warning' | 'error'; icon: typeof ShieldCheck } =
    billingAtRisk
      ? { label: 'Action needed', variant: 'error', icon: AlertTriangle }
      : !hasDefaultCard && hasBillableUsage
        ? { label: 'Add a card', variant: 'warning', icon: AlertTriangle }
        : { label: 'Healthy', variant: 'success', icon: ShieldCheck };

  const defaultCard = paymentMethods.find((pm) => pm.default);

  return (
    <div className="flex flex-col gap-6">
      <ToastHost toast={toast} onDismiss={() => setToast(null)} />

      <div>
        <h1 className="text-2xl font-bold text-white">Billing &amp; Usage</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pay only for what you use. Add a card and we&apos;ll auto-charge you at the end of each month.
        </p>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-500/30 px-4 py-3 text-sm text-red-400"
          style={{ background: 'rgba(239,68,68,0.06)' }}
        >
          {error}
        </div>
      )}

      <UsageAlertBanner
        freeUsagePercent={usage?.freeUsagePercent}
        hasPaymentMethod={hasDefaultCard}
        audioRemaining={Math.max(0, (free?.audioMinutes ?? 0) - (u?.audioMinutes ?? 0))}
        videoRemaining={Math.max(0, (free?.videoMinutes ?? 0) - (u?.videoMinutes ?? 0))}
      />

      {/* ── Current balance / usage ── */}
      <div
        className="rounded-2xl border border-[#2A3D64] p-6"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))' }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              <Wallet size={22} />
            </div>
            <div>
              <p className="text-lg font-bold text-white">Free Tier</p>
<p className="text-sm text-slate-400 mt-0.5">
                {free?.audioMinutes ?? 500} audio + {free?.videoMinutes ?? 200} video mins / month free · screen share always paid
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 mb-1">Current balance</p>
            <p className="text-2xl font-bold text-white">{paiseToINR(cost?.totalPaise ?? 0)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              est. month-end {paiseToINR(usage?.estimatedMonthEndPaise ?? 0)}
            </p>
          </div>
        </div>

        {/* Per-type breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
<TypeRow
            icon={<PhoneCall size={16} style={{ color: '#818CF8' }} />}
            label="Audio"
            minutes={u?.audioMinutes ?? 0}
            costPaise={cost?.audioPaise ?? 0}
            freeOf={free?.audioMinutes ?? 0}
            rate={`${paiseToINRShort(rates?.audioPaise ?? 20)} / participant-min`}
            color="#818CF8"
          />
          <TypeRow
            icon={<Video size={16} style={{ color: '#C084FC' }} />}
            label="Video"
            minutes={u?.videoMinutes ?? 0}
            costPaise={cost?.videoPaise ?? 0}
            freeOf={free?.videoMinutes ?? 0}
            rate={`${paiseToINRShort(rates?.videoPaise ?? 80)} / participant-min`}
            color="#C084FC"
          />
          <TypeRow
            icon={<Monitor size={16} style={{ color: '#34D399' }} />}
            label="Screen Share"
            minutes={u?.screenShareMinutes ?? 0}
            costPaise={cost?.screenSharePaise ?? 0}
            freeOf={0}
            rate={`+${paiseToINRShort(rates?.screenSharePaise ?? 10)} / participant-min`}
            color="#34D399"
          />
        </div>

        {/* Billing summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/5">
          <SummaryTile
            label="Est. end-of-month"
            value={paiseToINR(usage?.estimatedMonthEndPaise ?? 0)}
          />
          <SummaryTile
            label="Next billing date"
            value={
              usage?.nextBillingDate
                ? new Date(usage.nextBillingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : '—'
            }
            icon={<CalendarClock size={13} style={{ color: '#818CF8' }} />}
          />
          <SummaryTile
            label="Payment method"
            value={defaultCard ? `${(defaultCard.brand || 'Card').toUpperCase()} •••• ${defaultCard.last4 ?? '····'}` : 'Not added'}
            icon={<CreditCard size={13} style={{ color: '#A5B4FC' }} />}
          />
          <SummaryTile
            label="Billing status"
            value={billingStatus.label}
            valueColor={
              billingStatus.variant === 'success' ? '#34D399' : billingStatus.variant === 'warning' ? '#FBBF24' : '#F87171'
            }
            icon={<billingStatus.icon size={13} style={{ color: '#818CF8' }} />}
          />
        </div>
      </div>

      {/* ── How billing works ── */}
<BillingTimeline
        hasUsage={(u?.callsCompleted ?? 0) > 0 || (u?.audioMinutes ?? 0) > 0 || (u?.videoMinutes ?? 0) > 0}
        hasBillableUsage={hasBillableUsage}
        hasPaymentMethod={hasDefaultCard}
        nextBillingDate={usage?.nextBillingDate ?? null}
        hasInvoices={invoices.length > 0}
        freeAllowance={usage?.freeAllowance}
      />

      {/* ── Payment method ── */}
      <PaymentMethodCard
        paymentMethods={paymentMethods}
        onChanged={fetchAll}
        showToast={showToast}
      />

      {/* ── Spending protection ── */}
      <SpendingLimitCard
        spendingLimitPaise={spendingLimitPaise}
        onSaved={(paise) => {
          setSpendingLimitPaise(paise);
          showToast('success', paise == null ? 'Spending limit removed.' : 'Spending limit updated.');
        }}
        showToast={showToast}
      />

      {/* ── Usage invoices ── */}
      <div className="rounded-2xl border border-[#1A2642] p-6" style={{ background: '#0D1421' }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Invoices</p>
          <span className="text-xs text-slate-500">{invoices.length} total</span>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Receipt size={24} className="text-slate-600" />
            <p className="text-sm text-slate-500">
              No invoices yet. You&apos;ll be billed at the end of each month for usage beyond the free tier.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-[#1A2642]">
                  <th className="py-2 pr-4 font-medium">Invoice</th>
                  <th className="py-2 pr-4 font-medium">Cycle</th>
                  <th className="py-2 pr-4 font-medium">Usage</th>
                  <th className="py-2 pr-4 font-medium">Tax</th>
                  <th className="py-2 pr-4 font-medium">Total</th>
                  <th className="py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-[#1A2642]/60 last:border-0">
                    <td className="py-3 pr-4 font-mono text-xs text-slate-400">{inv.invoiceNumber}</td>
                    <td className="py-3 pr-4 text-slate-300">
                      {new Date(inv.cycleStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      {' – '}
                      {new Date(inv.cycleEnd).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 pr-4 font-medium text-white">{paiseToINR(inv.subtotalPaise)}</td>
                    <td className="py-3 pr-4 text-slate-400">{paiseToINR(inv.taxPaise)}</td>
                    <td className="py-3 pr-4 font-medium text-white">{paiseToINR(inv.totalPaise)}</td>
                    <td className="py-3">
                      <Badge variant={statusVariant[inv.status] ?? 'default'}>
                        {inv.status.toUpperCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── How it works ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
<InfoCard
          icon={<Wallet size={16} style={{ color: '#34D399' }} />}
          title="Free tier"
          body={`${free?.audioMinutes ?? 500} audio + ${free?.videoMinutes ?? 200} video participant-minutes free every month. Screen sharing is always billable.`}
        />
        <InfoCard
          icon={<Clock size={16} style={{ color: '#818CF8' }} />}
          title="Monthly invoice"
          body="On the 1st, we aggregate your usage and generate an invoice for anything beyond the free allowance."
        />
        <InfoCard
          icon={<CreditCard size={16} style={{ color: '#FBBF24' }} />}
          title="Auto-charge"
          body="Your saved card is charged automatically. Failed payments get a 7-day grace period."
        />
      </div>
    </div>
  );
}

function TypeRow({
  icon,
  label,
  minutes,
  costPaise,
  freeOf,
  rate,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  minutes: number;
  costPaise: number;
  freeOf: number;
  rate: string;
  color: string;
}) {
  const pct =
    freeOf > 0 ? Math.min(100, Math.round((minutes / freeOf) * 100)) : Math.min(100, minutes > 0 ? 100 : 0);
  return (
    <div className="rounded-xl border border-[#1A2642] p-4" style={{ background: '#0A0F1E' }}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-xs text-slate-500">{label}</p>
      </div>
      <p className="text-lg font-bold text-white">
        {Math.round(minutes).toLocaleString()}
        <span className="text-xs font-normal text-slate-500"> min</span>
      </p>
      <p className="text-xs font-semibold mt-1" style={{ color }}>
        {paiseToINR(costPaise)}
      </p>
      <p className="text-[11px] text-slate-600 mt-0.5">{rate}</p>
      {freeOf > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
            <span>Free allowance: {freeOf} min</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A2642' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: pct >= 90 ? 'linear-gradient(135deg,#f43f5e,#fb7185)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon,
  valueColor,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueColor?: string;
}) {
  return (
    <div>
      <p className="text-[11px] text-slate-500 mb-1">{label}</p>
      <p
        className="text-sm font-semibold flex items-center gap-1.5 truncate"
        style={{ color: valueColor ?? '#F1F5F9' }}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          {icon}
        </div>
        <p className="text-sm font-semibold text-white">{title}</p>
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{body}</p>
    </div>
  );
}

/**
 * Warns the customer before they're surprised by a bill: nudges at 50/75%,
 * escalates at 90%, and calls out clearly once the free allowance is fully
 * used (with a CTA to add a card if they haven't already).
 */
function UsageAlertBanner({
  freeUsagePercent,
  hasPaymentMethod,
  audioRemaining,
  videoRemaining,
}: {
  freeUsagePercent?: number;
  hasPaymentMethod: boolean;
  audioRemaining: number;
  videoRemaining: number;
}) {
  const pct = freeUsagePercent ?? 0;
  if (pct < 50) return null;

  const tier =
    pct >= 100
      ? { color: '#F87171', border: 'rgba(248,113,113,0.35)', bg: 'rgba(239,68,68,0.06)' }
      : pct >= 90
        ? { color: '#FBBF24', border: 'rgba(251,191,36,0.35)', bg: 'rgba(251,191,36,0.06)' }
        : { color: '#818CF8', border: 'rgba(99,102,241,0.3)', bg: 'rgba(99,102,241,0.05)' };

  const message =
    pct >= 100
      ? hasPaymentMethod
        ? "You've used your full free allowance — you're now on paid usage."
        : "You've used your full free allowance. Add a payment method to keep making calls."
      : `You've used ${pct}% of your free allowance. ${audioRemaining.toFixed(0)} audio + ${videoRemaining.toFixed(0)} video participant-minutes remaining.`;

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{ borderColor: tier.border, background: tier.bg }}
    >
      <AlertTriangle size={16} style={{ color: tier.color }} className="shrink-0" />
      <p className="text-sm flex-1" style={{ color: tier.color }}>{message}</p>
    </div>
  );
}

/**
 * Lets the customer cap their own monthly paid usage so a leaked API key or
 * runaway integration can't run up a surprise bill. Enforced server-side in
 * UsageBillingService.canStartCall — this is just the control surface.
 */
function SpendingLimitCard({
  spendingLimitPaise,
  onSaved,
  showToast,
}: {
  spendingLimitPaise: number | null;
  onSaved: (paise: number | null) => void;
  showToast: (type: 'success' | 'error', message: string) => void;
}) {
  const [input, setInput] = useState(spendingLimitPaise != null ? String(spendingLimitPaise / 100) : '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInput(spendingLimitPaise != null ? String(spendingLimitPaise / 100) : '');
  }, [spendingLimitPaise]);

  const save = async (paise: number | null) => {
    setSaving(true);
    try {
      await api.post('/billing/spending-limit', { spendingLimitPaise: paise });
      onSaved(paise);
    } catch (e: any) {
      showToast('error', e?.response?.data?.message || 'Could not update your spending limit.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#1A2642] p-5" style={{ background: '#0D1421' }}>
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={16} style={{ color: '#34D399' }} />
        <p className="text-sm font-semibold text-white">Monthly spending limit</p>
      </div>
      <p className="text-xs text-slate-500 mb-3">
        Cap how much paid usage (beyond your free allowance) can be billed each month. New calls are blocked once you hit it — active calls are never interrupted.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-lg border border-[#1A2642] px-3 py-2" style={{ background: '#0A0F1E' }}>
          <span className="text-slate-500 text-sm">₹</span>
          <input
            type="number"
            min={0}
            step="1"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="No limit"
            className="w-28 bg-transparent text-sm text-slate-100 outline-none"
          />
        </div>
        <button
          onClick={() => {
            const value = parseFloat(input);
            if (!input.trim() || Number.isNaN(value) || value < 0) return;
            save(Math.round(value * 100));
          }}
          disabled={saving}
          className="text-sm font-medium px-3 py-2 rounded-lg text-white transition-colors disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
        >
          Save
        </button>
        {spendingLimitPaise != null && (
          <button
            onClick={() => { setInput(''); save(null); }}
            disabled={saving}
            className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            Remove limit
          </button>
        )}
      </div>
    </div>
  );
}
