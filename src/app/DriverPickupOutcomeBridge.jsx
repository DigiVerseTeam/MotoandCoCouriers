import { useEffect, useMemo, useState } from "react";

const API_BASE = (import.meta.env.VITE_MOTOCO_API_BASE_URL || "/api/live").replace(/\/$/, "");
const BRISBANE_TZ = "Australia/Brisbane";

function textOf(element) {
  return String(element?.textContent || "").trim();
}

function looseKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function isDriverScreen() {
  return Boolean(document.querySelector(".dw-shell"));
}

function brisbaneDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function orderDateKey(order = {}) {
  const value = order.requestedPickupDate || order.milkRunDate || order.preferredDate || order.submittedAt;
  if (!value) return brisbaneDateKey();
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? brisbaneDateKey() : date.toISOString().slice(0, 10);
}

function displayDate(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function normaliseStatus(status) {
  return status === "Pending" ? "Order Placed" : String(status || "Order Placed");
}

function orderLabel(order) {
  return order?.conNote || order?.portalOrderId || order?.businessName || order?.clientName || "Pickup";
}

function findOrderFromCard(card, orders) {
  const conNote = textOf(card?.querySelector?.(".dw-order-top strong"));
  const vendor = textOf(card?.querySelector?.("small"));
  const businessName = textOf(card?.querySelector?.(".dw-deliver-box strong"));
  const exactConNote = orders.find(order => conNote && String(order.conNote || "").trim() === conNote);
  if (exactConNote) return exactConNote;

  const cardBusiness = looseKey(businessName);
  const cardVendor = looseKey(vendor);
  return orders.find(order => {
    const orderBusiness = looseKey(order.businessName || order.clientName || order.accountName);
    const orderVendor = looseKey(order.vendor);
    return cardBusiness && orderBusiness === cardBusiness && (!cardVendor || !orderVendor || orderVendor === cardVendor);
  }) || orders.find(order => {
    const cardIdentifier = looseKey(conNote);
    return cardIdentifier && [order.portalOrderId, order.id, order.workItemId, order.businessName, order.clientName]
      .map(looseKey)
      .some(value => value && value === cardIdentifier);
  }) || null;
}

function findOrderFromRouteRow(row, orders) {
  const customer = looseKey(textOf(row?.querySelector?.("strong")));
  const marker = textOf(row?.querySelector?.("em")).split(" - ")[0];
  const conNote = looseKey(marker);
  return orders.find(order => conNote && looseKey(order.conNote || order.portalOrderId || order.workItemId || order.id) === conNote)
    || orders.find(order => customer && looseKey(order.businessName || order.clientName || order.accountName) === customer)
    || null;
}

function pickupItemsFromCard(card) {
  const items = { tyres: 0, upTo5kg: 0, fiveTo10kg: 0, returns: 0 };
  card?.querySelectorAll?.(".dw-item")?.forEach(row => {
    const label = textOf(row.querySelector("div")).toLowerCase();
    const qty = Number(textOf(row.querySelector(".dw-stepper span")) || 0) || 0;
    if (label.includes("tyre")) items.tyres = qty;
    else if (label.includes("up to 5")) items.upTo5kg = qty;
    else if (label.includes("5-10") || label.includes("5-10")) items.fiveTo10kg = qty;
    else if (label.includes("return")) items.returns = qty;
  });
  return items;
}

function hasAnyPickupItems(items) {
  return Object.values(items || {}).some(value => Number(value || 0) > 0);
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

async function pullZohoOrders() {
  const response = await fetch("/.netlify/functions/deals-workspace");
  if (!response.ok) return [];
  const body = await response.json().catch(() => ({}));
  return Array.isArray(body.orders) ? body.orders : [];
}

async function updatePickupOutcome(order, { outcome, stageKey, requestedPickupDate, notes, pickupItems }) {
  if (!order?.zohoDealId) throw new Error("This pickup does not have a Zoho Deal ID yet.");
  const actualPickupAt = new Date().toISOString();
  const response = await fetch("/.netlify/functions/pickup-outcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dealId: order.zohoDealId,
      stageKey,
      outcome,
      actualPickupAt,
      requestedPickupDate,
      pickupNotes: notes,
      pickupItems,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Could not update Zoho pickup outcome.");
  return body;
}

async function patchLocalOrder(order, changes) {
  const data = await apiJSON("/workspace?role=driver");
  const store = data.store || { users: [], clients: [], orders: [], deliveries: [] };
  const idSet = new Set([order.id, order.zohoDealId ? `zoho_${order.zohoDealId}` : "", order.conNote].filter(Boolean));
  let found = false;
  const orders = (store.orders || []).map(item => {
    const itemKeys = [item.id, item.zohoDealId ? `zoho_${item.zohoDealId}` : "", item.conNote].filter(Boolean);
    if (itemKeys.some(key => idSet.has(key))) {
      found = true;
      return { ...item, ...changes };
    }
    return item;
  });
  if (!found) orders.push({ ...order, ...changes });
  await apiJSON("/snapshot", { method: "PUT", body: JSON.stringify({ store: { ...store, orders } }) });
}

function groupByVendor(orders) {
  return orders.reduce((groups, order) => {
    const key = order.vendor || "Unknown supplier";
    groups[key] = groups[key] || [];
    groups[key].push(order);
    return groups;
  }, {});
}

export default function DriverPickupOutcomeBridge() {
  const [active, setActive] = useState(false);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");
  const [futureOpen, setFutureOpen] = useState(false);
  const todayKey = brisbaneDateKey();

  async function refreshOrders() {
    if (!isDriverScreen()) return;
    const pulled = await pullZohoOrders().catch(() => []);
    setOrders(pulled);
  }

  useEffect(() => {
    const tick = () => {
      const nextActive = isDriverScreen();
      setActive(nextActive);
      if (nextActive) refreshOrders();
      if (!nextActive) setFutureOpen(false);
    };
    tick();
    const observer = new MutationObserver(tick);
    observer.observe(document.body, { childList: true, subtree: true });
    const interval = window.setInterval(tick, 30000);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  const futureOrders = useMemo(() => orders
    .filter(order => normaliseStatus(order.status) === "Order Placed")
    .filter(order => orderDateKey(order) > todayKey), [orders, todayKey]);
  const futureGroups = useMemo(() => groupByVendor(futureOrders), [futureOrders]);

  useEffect(() => {
    if (!active) return;

    function syncNav() {
      const nav = document.querySelector(".dw-nav");
      if (!nav) return;
      let button = nav.querySelector("[data-driver-future-tab='true']");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.className = "dw-future-tab";
        button.dataset.driverFutureTab = "true";
        const deliveryButton = Array.from(nav.querySelectorAll("button")).find(item => textOf(item).toLowerCase().includes("delivery"));
        nav.insertBefore(button, deliveryButton || null);
      }
      button.textContent = futureOrders.length ? `Future Pickups (${futureOrders.length})` : "Future Pickups";
      button.classList.toggle("active", futureOpen);
    }

    syncNav();
    const observer = new MutationObserver(syncNav);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [active, futureOpen, futureOrders.length]);

  useEffect(() => {
    if (!active) return;

    function handleNavClick(event) {
      const button = event.target?.closest?.("button");
      if (!button?.closest?.(".dw-nav")) return;
      if (button.dataset.driverFutureTab === "true") {
        event.preventDefault();
        event.stopPropagation();
        setFutureOpen(true);
        refreshOrders();
        return;
      }
      setFutureOpen(false);
    }

    document.addEventListener("click", handleNavClick, true);
    return () => document.removeEventListener("click", handleNavClick, true);
  }, [active]);

  useEffect(() => {
    if (!active) return;

    function syncDom() {
      document.querySelectorAll(".dw-order.legacy-order").forEach(card => {
        const order = findOrderFromCard(card, orders);
        if (!order) return;
        card.style.display = orderDateKey(order) > todayKey ? "none" : "";

        const actions = card.querySelector(".dw-order-actions");
        if (actions && !actions.querySelector(".dw-abandon")) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "dw-no dw-abandon";
          button.textContent = "Abandoned";
          actions.appendChild(button);
        }
      });

      document.querySelectorAll(".dw-route-row").forEach(row => {
        const order = findOrderFromRouteRow(row, orders);
        if (!order) return;
        row.style.display = orderDateKey(order) > todayKey ? "none" : "";
      });
    }

    syncDom();
    const observer = new MutationObserver(syncDom);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [active, orders, todayKey]);

  useEffect(() => {
    if (!active) return;

    function handleClick(event) {
      const button = event.target?.closest?.("button");
      if (!button) return;
      const text = textOf(button).toLowerCase();
      const card = button.closest?.(".dw-order.legacy-order");
      const order = findOrderFromCard(card, orders);
      if (!order) return;

      if (text === "confirm this pickup") {
        const pickupItems = pickupItemsFromCard(card);
        if (!hasAnyPickupItems(pickupItems)) return;
        setTimeout(() => {
          updatePickupOutcome(order, {
            outcome: "Picked Up",
            stageKey: "PICKED_UP",
            notes: "Driver confirmed pickup in app.",
            pickupItems,
          })
            .then(result => setMessage(`${orderLabel(order)} pickup saved to Zoho with ${result.itemRows || 0} item row${result.itemRows === 1 ? "" : "s"}.`))
            .then(refreshOrders)
            .catch(error => setMessage(error.message));
        }, 250);
      }

      if (text === "no pickup") {
        setTimeout(() => {
          updatePickupOutcome(order, { outcome: "No Pickup", notes: "Driver marked no pickup in app." })
            .then(() => setMessage(`${orderLabel(order)} marked No Pickup in Zoho.`))
            .then(refreshOrders)
            .catch(error => setMessage(error.message));
        }, 250);
      }

      if (text === "abandoned") {
        event.preventDefault();
        event.stopPropagation();
        const notes = window.prompt("Why is this pickup abandoned?", "Pickup no longer required.") || "Pickup abandoned by driver.";
        setBusyId(order.id);
        Promise.all([
          updatePickupOutcome(order, { outcome: "Abandoned", notes }),
          patchLocalOrder(order, { status: "Abandoned", pickupOutcome: "Abandoned", pickupNotes: notes, actualPickupAt: new Date().toISOString() }),
        ]).then(() => {
          setMessage(`${orderLabel(order)} marked Abandoned.`);
          return refreshOrders();
        }).catch(error => setMessage(error.message)).finally(() => setBusyId(""));
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [active, orders]);

  async function bringForward(order) {
    const notes = `Supplier had this future pickup picked and packed early. Driver brought it into the ${displayDate(todayKey)} run.`;
    setBusyId(order.id);
    try {
      await updatePickupOutcome(order, {
        outcome: "Brought Forward",
        requestedPickupDate: `${todayKey}T09:00:00+10:00`,
        notes,
      });
      await patchLocalOrder(order, {
        preferredDate: todayKey,
        requestedPickupDate: `${todayKey}T09:00:00+10:00`,
        pickupOutcome: "Brought Forward",
        pickupNotes: notes,
        broughtForwardAt: new Date().toISOString(),
      });
      setMessage(`${orderLabel(order)} brought into today's run.`);
      setFutureOpen(false);
      await refreshOrders();
      window.setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      setMessage(error.message || "Could not bring pickup forward.");
    } finally {
      setBusyId("");
    }
  }

  if (!active) return null;

  return (
    <div className="dw-outcome-bridge">
      <style>{styles}</style>
      {message && <div className="dw-outcome-message" onClick={() => setMessage("")}>{message}</div>}
      {futureOpen && (
        <main className="dw-future-screen">
          <section className="dw-future-titlebar">
            <div>
              <h1><span>Future</span> Pickups</h1>
              <p>Use this only when the driver is physically at the supplier and the warehouse confirms the future pickup is already picked and packed.</p>
            </div>
            <button type="button" onClick={() => setFutureOpen(false)}>Close</button>
          </section>

          {futureOrders.length === 0 && <div className="dw-future-empty">No future pickups are waiting.</div>}
          {Object.entries(futureGroups).map(([vendor, group]) => (
            <section className="dw-future-vendor" key={vendor}>
              <h2>{vendor} Future Pickups ({group.length})</h2>
              {group.map(order => (
                <div className="dw-future-row" key={order.id}>
                  <div>
                    <strong>{order.conNote || order.portalOrderId || "No con note"}</strong>
                    <span>{order.businessName || order.clientName || "Customer"}</span>
                    <em>{order.dropLocation || "No delivery address set"}</em>
                    <small>Scheduled {displayDate(orderDateKey(order))}</small>
                  </div>
                  <button disabled={busyId === order.id} onClick={() => bringForward(order)}>
                    {busyId === order.id ? "Moving..." : "Bring into today"}
                  </button>
                </div>
              ))}
            </section>
          ))}
        </main>
      )}
    </div>
  );
}

const styles = `
.dw-outcome-message{position:fixed;right:18px;bottom:18px;z-index:10020;max-width:360px;background:#e9e2d5;border:1px solid #cfc6b7;border-left:4px solid #d70b3c;color:#15110d;padding:12px 14px;box-shadow:0 4px 18px rgba(0,0,0,.18);font-family:Barlow,Arial,sans-serif;font-size:14px;cursor:pointer}.dw-abandon{border-color:#d7b5b5!important;color:#8a293b!important}.dw-future-screen{position:fixed;left:0;right:0;top:58px;bottom:0;z-index:10005;overflow:auto;background:#f3f3e8;color:#15110d;padding:32px 22px 60px;font-family:Barlow,Arial,sans-serif}.dw-future-screen>*{max-width:1180px;margin-left:auto;margin-right:auto}.dw-future-titlebar{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid #cfc6b7;padding-bottom:18px;margin-bottom:18px}.dw-future-titlebar h1{font-family:'Barlow Condensed',Arial,sans-serif;font-size:39px;line-height:1;text-transform:uppercase;margin:0;letter-spacing:.5px;color:#d70b3c}.dw-future-titlebar h1 span{color:#15110d}.dw-future-titlebar p{margin:6px 0 0;color:#6e6459;font-size:15px;max-width:760px}.dw-future-titlebar button{border:1px solid #cfc6b7;background:#e9e2d5;color:#15110d;padding:10px 15px;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:900;text-transform:uppercase;cursor:pointer}.dw-future-empty{background:#fff;border:1px solid #cfc6b7;margin-top:18px;padding:36px;text-align:center;color:#7a6f61;font-style:italic}.dw-future-vendor h2{font-family:'Barlow Condensed',Arial,sans-serif;text-transform:uppercase;letter-spacing:3px;font-size:14px;color:#d70b3c;margin:18px 0 10px}.dw-future-row{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;background:#fff;border:1px solid #cfc6b7;border-left:5px solid #d70b3c;padding:16px 18px;margin-bottom:10px;box-shadow:0 2px 6px rgba(0,0,0,.05)}.dw-future-row strong{display:block;font-family:'Barlow Condensed',Arial,sans-serif;text-transform:uppercase;font-size:22px;line-height:1}.dw-future-row span{display:block;font-family:'Barlow Condensed',Arial,sans-serif;text-transform:uppercase;font-size:16px;margin-top:4px}.dw-future-row em{display:block;font-style:normal;font-size:14px;color:#15110d;margin-top:3px}.dw-future-row small{display:block;color:#6d6257;margin-top:4px}.dw-future-row button{border:0;background:#d70b3c;color:#f3f3e8;padding:10px 14px;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:900;text-transform:uppercase;letter-spacing:.4px;cursor:pointer}.dw-future-row button:disabled{opacity:.55;cursor:wait}@media(max-width:760px){.dw-outcome-message{left:14px;right:14px;bottom:14px;max-width:none}.dw-future-screen{top:0;padding:18px 14px 44px}.dw-future-titlebar,.dw-future-row{grid-template-columns:1fr;flex-direction:column}.dw-future-titlebar h1{font-size:32px}.dw-future-row button{width:100%}}
`;
