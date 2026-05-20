import { useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_MOTOCO_API_BASE_URL || "/api/live").replace(/\/$/, "");

function textOf(element) {
  return String(element?.textContent || "").trim();
}

function isAdminScreen() {
  return textOf(document.querySelector(".rpill")).toLowerCase() === "admin";
}

function money(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount : 0;
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function monthKey(value) {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 7);
  return date.toISOString().slice(0, 7);
}

function monthLabel(key) {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

function dateKey(value) {
  const text = String(value || "");
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString().slice(0, 10) : date.toISOString().slice(0, 10);
}

function dateLabel(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

function groupKeyFor(delivery) {
  return [delivery.accountName || delivery.businessName || "Unknown Account", monthKey(delivery.completedAt || delivery.deliveredAt)].join("||");
}

function mergeDeliveryWithDeal(delivery, deals) {
  const deal = deals.find(item => item.zohoDealId && item.zohoDealId === delivery.zohoDealId)
    || deals.find(item => item.conNote && item.conNote === delivery.conNote)
    || {};

  return {
    ...delivery,
    ...deal,
    id: delivery.id || deal.id,
    zohoDealId: delivery.zohoDealId || deal.zohoDealId,
    conNote: delivery.conNote || deal.conNote,
    businessName: deal.businessName || delivery.businessName,
    accountName: deal.accountName || deal.businessName || delivery.accountName || delivery.businessName,
    billingEmail: delivery.billingEmail || delivery.clientEmail || delivery.email || deal.clientEmail || "",
    status: deal.status || delivery.status,
    completedAt: delivery.completedAt || deal.completedAt || deal.deliveredAt,
    totalPrice: money(delivery.totalPrice || delivery.price || deal.totalPrice || deal.price),
    tyreQty: delivery.tyreQty || delivery.pickupItems?.tyres || delivery.pickupItems?.tyreQty || 0,
    partQtys: delivery.partQtys || {
      p1: delivery.pickupItems?.upTo5kg || 0,
      p2: delivery.pickupItems?.fiveTo10kg || 0,
    },
    returnsQty: delivery.returnsQty || delivery.pickupItems?.returns || 0,
    itemsDesc: delivery.itemsDesc || deal.itemsDesc,
  };
}

async function apiJSON(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Server request failed.");
  return body;
}

async function functionJSON(path, options = {}) {
  const response = await fetch(`/.netlify/functions/${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Server request failed.");
  return body;
}

async function pullWorkspace() {
  const body = await apiJSON("/workspace?role=admin");
  return body.store || { orders: [], deliveries: [] };
}

async function pullZohoOrders() {
  const response = await fetch("/.netlify/functions/deals-workspace");
  if (!response.ok) return [];
  const body = await response.json().catch(() => ({}));
  return Array.isArray(body.orders) ? body.orders : [];
}

function billableDeliveries({ store, zohoOrders }) {
  const deliveredDeals = zohoOrders.filter(order => order.status === "Delivered");
  const localDeliveries = Array.isArray(store.deliveries) ? store.deliveries : [];
  const merged = localDeliveries.map(delivery => mergeDeliveryWithDeal(delivery, deliveredDeals));
  const byDeal = new Map(merged.map(delivery => [delivery.zohoDealId || delivery.conNote || delivery.id, delivery]));

  for (const deal of deliveredDeals) {
    const key = deal.zohoDealId || deal.conNote || deal.id;
    if (!byDeal.has(key)) byDeal.set(key, mergeDeliveryWithDeal({}, [deal]));
  }

  return [...byDeal.values()].filter(delivery => delivery.status === "Delivered" && money(delivery.totalPrice) > 0 && !delivery.invoiceNumber);
}

export default function AdminInvoiceBridge() {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("runs");
  const [orders, setOrders] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [emails, setEmails] = useState({});
  const [message, setMessage] = useState("");
  const [busyKey, setBusyKey] = useState("");

  async function refresh() {
    if (!isAdminScreen()) return;
    const [store, zohoOrders] = await Promise.all([pullWorkspace().catch(() => ({ orders: [], deliveries: [] })), pullZohoOrders().catch(() => [])]);
    setOrders(zohoOrders);
    const nextDeliveries = billableDeliveries({ store, zohoOrders });
    setDeliveries(nextDeliveries);
    setEmails(previous => {
      const next = { ...previous };
      for (const delivery of nextDeliveries) {
        const key = groupKeyFor(delivery);
        if (!next[key] && delivery.billingEmail) next[key] = delivery.billingEmail;
      }
      return next;
    });
  }

  useEffect(() => {
    const tick = () => {
      const nextActive = isAdminScreen();
      setActive(nextActive);
      if (nextActive) refresh();
    };
    tick();
    const observer = new MutationObserver(tick);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(tick, 45000);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  const runGroups = useMemo(() => {
    const grouped = new Map();
    for (const order of orders.filter(item => item.status === "Order Placed")) {
      const runDate = dateKey(order.requestedPickupDate || order.preferredDate || order.submittedAt);
      const key = [runDate, order.vendor || "Unknown supplier"].join("||");
      const [date, vendor] = key.split("||");
      const existing = grouped.get(key) || { key, date, vendor, orders: [] };
      existing.orders.push(order);
      grouped.set(key, existing);
    }
    return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date) || a.vendor.localeCompare(b.vendor));
  }, [orders]);

  const invoiceGroups = useMemo(() => {
    const grouped = new Map();
    for (const delivery of deliveries) {
      const key = groupKeyFor(delivery);
      const [accountName, period] = key.split("||");
      const existing = grouped.get(key) || { key, accountName, period, deliveries: [], total: 0 };
      existing.deliveries.push(delivery);
      existing.total += money(delivery.totalPrice);
      grouped.set(key, existing);
    }
    return [...grouped.values()].sort((a, b) => a.accountName.localeCompare(b.accountName) || b.period.localeCompare(a.period));
  }, [deliveries]);

  async function validateRun(group) {
    setBusyKey(group.key);
    setMessage("");
    try {
      const result = await functionJSON("milk-run-validate", {
        method: "POST",
        body: JSON.stringify({
          dealIds: group.orders.map(order => order.zohoDealId).filter(Boolean),
          runLabel: `${dateLabel(group.date)} - ${group.vendor}`,
          adminName: textOf(document.querySelector(".nav-nm strong")) || "Admin",
        }),
      });
      setMessage(`Validated ${result.validatedCount || 0} job${(result.validatedCount || 0) === 1 ? "" : "s"} for ${group.vendor} on ${dateLabel(group.date)}.`);
      await refresh();
    } catch (error) {
      setMessage(error.message || "Could not validate milk run.");
    } finally {
      setBusyKey("");
    }
  }

  async function createInvoice(group) {
    setBusyKey(group.key);
    setMessage("");
    const email = String(emails[group.key] || "").trim();
    const client = {
      businessName: group.accountName,
      accountName: group.accountName,
      zohoAccountName: group.accountName,
      billingEmail: email,
      email,
    };
    try {
      const result = await apiJSON("/zoho/books/invoice", {
        method: "POST",
        body: JSON.stringify({ client, deliveries: group.deliveries, monthLabel: monthLabel(group.period) }),
      });
      if (!result.success) throw new Error(result.message || "Invoice was not created.");

      if (email) {
        const sent = await functionJSON("books-invoice-email", {
          method: "POST",
          body: JSON.stringify({ invoiceId: result.invoiceId, toMailIds: [email] }),
        });
        setMessage(`Created and emailed Books invoice ${result.invoiceNumber || result.invoiceId} to ${sent.toMailIds?.join(", ") || email}.`);
      } else {
        setMessage(`Created Books invoice ${result.invoiceNumber || result.invoiceId}. Add a billing email next time to send it from the app.`);
      }
      await refresh();
    } catch (error) {
      setMessage(error.message || "Could not create invoice.");
    } finally {
      setBusyKey("");
    }
  }

  if (!active) return null;

  return (
    <div className="ai-bridge">
      <style>{styles}</style>
      <button className="ai-launch" type="button" onClick={() => { setOpen(true); refresh(); }}>
        Admin Ops
      </button>
      {open && (
        <section className="ai-panel" aria-label="Admin operations">
          <div className="ai-head">
            <div>
              <h2>Admin Ops</h2>
              <p>Validate milk runs and create account invoices.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)}>Close</button>
          </div>
          <div className="ai-tabs">
            <button className={tab === "runs" ? "on" : ""} type="button" onClick={() => setTab("runs")}>Milk Run Validation</button>
            <button className={tab === "invoices" ? "on" : ""} type="button" onClick={() => setTab("invoices")}>Monthly Invoices</button>
          </div>
          {message && <div className="ai-message">{message}</div>}
          <div className="ai-actions"><button type="button" onClick={refresh}>Refresh</button></div>

          {tab === "runs" && (runGroups.length === 0 ? (
            <div className="ai-empty">No order placed milk runs waiting for validation.</div>
          ) : runGroups.map(group => (
            <article className="ai-group" key={group.key}>
              <div className="ai-group-head">
                <div><h3>{group.vendor}</h3><p>{dateLabel(group.date)} - {group.orders.length} customer pickup{group.orders.length === 1 ? "" : "s"}</p></div>
                <strong>{group.orders.length}</strong>
              </div>
              <div className="ai-lines">
                {group.orders.map(order => (
                  <div className="ai-line run" key={order.zohoDealId || order.id}>
                    <span>{order.conNote || order.portalOrderId || "No con note"}</span>
                    <span>{order.businessName || order.clientName || "Customer"}</span>
                    <span>{order.dropLocation || "No delivery address"}</span>
                  </div>
                ))}
              </div>
              <button className="ai-create" type="button" disabled={busyKey === group.key} onClick={() => validateRun(group)}>
                {busyKey === group.key ? "Validating..." : "Validate This Milk Run"}
              </button>
            </article>
          )))}

          {tab === "invoices" && (invoiceGroups.length === 0 ? (
            <div className="ai-empty">No delivered billable jobs waiting for invoicing.</div>
          ) : invoiceGroups.map(group => (
            <article className="ai-group" key={group.key}>
              <div className="ai-group-head">
                <div><h3>{group.accountName}</h3><p>{monthLabel(group.period)} - {group.deliveries.length} job{group.deliveries.length === 1 ? "" : "s"}</p></div>
                <strong>${group.total.toFixed(2)}</strong>
              </div>
              <div className="ai-email-row">
                <label>Billing email</label>
                <input value={emails[group.key] || ""} onChange={event => setEmails(previous => ({ ...previous, [group.key]: event.target.value }))} placeholder="accounts@example.com.au" />
                {emails[group.key] && !validEmail(emails[group.key]) && <span>Check email format before sending.</span>}
              </div>
              <div className="ai-lines">
                {group.deliveries.map(delivery => (
                  <div className="ai-line" key={delivery.id || delivery.zohoDealId || delivery.conNote}>
                    <span>{delivery.conNote || delivery.portalOrderId || "No con note"}</span>
                    <span>{delivery.vendor || "Supplier"}</span>
                    <span>{delivery.itemsDesc || "Courier delivery"}</span>
                    <b>${money(delivery.totalPrice).toFixed(2)}</b>
                  </div>
                ))}
              </div>
              <button className="ai-create" type="button" disabled={busyKey === group.key || (emails[group.key] && !validEmail(emails[group.key]))} onClick={() => createInvoice(group)}>
                {busyKey === group.key ? "Creating..." : emails[group.key] ? "Create & Email Invoice" : "Create Invoice"}
              </button>
            </article>
          )))}
        </section>
      )}
    </div>
  );
}

const styles = `
.ai-launch{position:fixed;right:18px;bottom:136px;z-index:10030;background:#e11d48;color:#f3f3e8;border:1px solid rgba(243,243,232,.45);box-shadow:0 6px 18px rgba(0,0,0,.2);padding:11px 15px;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:.7px;cursor:pointer}.ai-panel{position:fixed;right:18px;top:76px;bottom:18px;z-index:10035;width:min(780px,calc(100vw - 36px));overflow:auto;background:#fff;border:1px solid #cfc6b7;border-top:5px solid #e11d48;box-shadow:0 12px 40px rgba(0,0,0,.22);padding:18px;color:#15110d;font-family:Barlow,Arial,sans-serif}.ai-head{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid #d5cfc3;padding-bottom:12px;margin-bottom:12px}.ai-head h2,.ai-group h3{font-family:'Barlow Condensed',Arial,sans-serif;text-transform:uppercase;letter-spacing:.8px;margin:0}.ai-head h2{font-size:30px;color:#e11d48}.ai-head p,.ai-group p{margin:3px 0 0;color:#6d6257}.ai-head button,.ai-actions button,.ai-create,.ai-tabs button{border:1px solid #cfc6b7;background:#e9e2d5;color:#15110d;padding:8px 12px;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:900;text-transform:uppercase;cursor:pointer}.ai-tabs{display:flex;gap:8px;margin-bottom:12px}.ai-tabs button.on{background:#e11d48;border-color:#e11d48;color:#f3f3e8}.ai-message{background:#e9e2d5;border:1px solid #cfc6b7;border-left:4px solid #e11d48;padding:10px 12px;margin-bottom:12px}.ai-actions{display:flex;justify-content:flex-end;margin-bottom:10px}.ai-empty{border:1px solid #d5cfc3;background:#f3f3e8;padding:28px;text-align:center;color:#6d6257}.ai-group{border:1px solid #d5cfc3;margin:12px 0;background:#fff}.ai-group-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;background:#f3f3e8;padding:13px 14px;border-bottom:1px solid #d5cfc3}.ai-group-head strong{font-family:'Barlow Condensed',Arial,sans-serif;font-size:26px;color:#e11d48}.ai-email-row{display:grid;grid-template-columns:110px 1fr auto;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid #eee7dc;background:#faf9f5}.ai-email-row label{font-family:'Barlow Condensed',Arial,sans-serif;font-weight:900;text-transform:uppercase;color:#6d6257}.ai-email-row input{height:36px;border:1px solid #cfc6b7;padding:0 10px}.ai-email-row span{color:#8b6914;font-size:13px}.ai-lines{padding:6px 14px}.ai-line{display:grid;grid-template-columns:120px 150px 1fr 90px;gap:10px;padding:9px 0;border-bottom:1px solid #eee7dc;font-size:14px}.ai-line.run{grid-template-columns:130px 190px 1fr}.ai-line b{text-align:right}.ai-create{margin:12px 14px 14px;background:#e11d48;color:#f3f3e8;border-color:#e11d48}.ai-create:disabled{opacity:.55;cursor:wait}@media(max-width:760px){.ai-launch{left:14px;right:auto;bottom:136px}.ai-panel{left:10px;right:10px;width:auto;top:66px}.ai-head,.ai-tabs{flex-direction:column}.ai-email-row,.ai-line,.ai-line.run{grid-template-columns:1fr}.ai-line b{text-align:left}}
`;
