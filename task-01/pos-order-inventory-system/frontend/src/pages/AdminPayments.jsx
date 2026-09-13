import React, { useEffect, useState } from 'react';
import { Eye, Search, WalletCards, X } from 'lucide-react';
import * as paymentService from '../services/paymentService';

const badge = {
  PENDING: 'bg-slate-100 text-slate-700', SUCCESS: 'bg-emerald-100 text-emerald-700',
  FAILED: 'bg-rose-100 text-rose-700', TIMEOUT: 'bg-amber-100 text-amber-700',
};

const AdminPayments = () => {
  const [payments, setPayments] = useState([]);
  const [status, setStatus] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      paymentService.getPayments({ status, search })
        .then((response) => setPayments(response.data || []))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(timer);
  }, [search, status]);

  return <div className="space-y-6 pb-16">
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Administration</p><h1 className="text-2xl font-black text-slate-900 mt-1">Payments</h1><p className="text-sm text-slate-500">Read-only transaction history from the mock gateway.</p></div><div className="rounded-xl bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">{payments.length} transactions</div></div>
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" /><input aria-label="Search payments" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search transaction or order number" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500" /></div><select aria-label="Filter payment status" value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm bg-white">{['ALL','PENDING','SUCCESS','FAILED','TIMEOUT'].map((value) => <option key={value}>{value}</option>)}</select></div>
      {error ? <div className="p-8 text-center text-rose-600">{error}</div> : loading ? <div className="p-12 text-center text-slate-400">Loading payments…</div> : payments.length === 0 ? <div className="p-14 text-center"><WalletCards className="w-10 h-10 mx-auto text-slate-300" /><p className="mt-3 font-semibold text-slate-600">No payments found</p></div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr>{['Transaction ID','Order ID','Amount','Method','Status','Created','Updated',''].map((head) => <th key={head} className="px-4 py-3 font-bold whitespace-nowrap">{head}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{payments.map((payment) => <tr key={payment._id} className="hover:bg-slate-50"><td className="px-4 py-4 font-mono text-xs font-bold">{payment.transactionId}</td><td className="px-4 py-4"><span className="font-semibold">{payment.orderId?.orderNumber || payment.orderId?._id || payment.orderId}</span></td><td className="px-4 py-4 font-bold">${Number(payment.amount).toFixed(2)} {payment.currency}</td><td className="px-4 py-4">{payment.paymentMethod}</td><td className="px-4 py-4"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${badge[payment.status]}`}>{payment.status}</span></td><td className="px-4 py-4 whitespace-nowrap text-slate-500">{new Date(payment.createdAt).toLocaleString()}</td><td className="px-4 py-4 whitespace-nowrap text-slate-500">{new Date(payment.updatedAt).toLocaleString()}</td><td className="px-4 py-4"><button aria-label="View payment details" onClick={() => setSelected(payment)} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600"><Eye className="w-4 h-4" /></button></td></tr>)}</tbody></table></div>}
    </div>
    {selected && <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm grid place-items-center p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6"><div className="flex justify-between items-start"><div><p className="text-xs font-bold uppercase text-slate-400">Payment detail</p><h2 className="font-mono font-bold mt-1">{selected.transactionId}</h2></div><button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-slate-100"><X className="w-5 h-5" /></button></div><dl className="grid grid-cols-2 gap-4 mt-6">{[['Order', selected.orderId?.orderNumber || selected.orderId],['Amount', `$${Number(selected.amount).toFixed(2)} ${selected.currency}`],['Method', selected.paymentMethod],['Status', selected.status],['Created', new Date(selected.createdAt).toLocaleString()],['Updated', new Date(selected.updatedAt).toLocaleString()]].map(([key,value]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><dt className="text-[10px] uppercase font-bold text-slate-400">{key}</dt><dd className="text-sm font-semibold mt-1 break-all">{value}</dd></div>)}</dl><a href={`/orders`} className="mt-6 block text-center rounded-xl bg-blue-600 text-white py-2.5 font-bold">View related order</a></div></div>}
  </div>;
};

export default AdminPayments;
