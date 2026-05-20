import { useEffect, useState } from "react";

function textOf(element) {
  return String(element?.textContent || "").trim();
}

function looseKey(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
}

function isDriverScreen() {
  return Boolean(document.querySelector(".dw-shell"));
}

function hasCanvasInk(canvas) {
  if (!canvas) return false;
  try {
    const context = canvas.getContext("2d");
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let index = 3; index < pixels.length; index += 4) {
      if (pixels[index] > 0) return true;
    }
  } catch {
    return true;
  }
  return false;
}

async function pullZohoOrders() {
  const response = await fetch("/.netlify/functions/deals-workspace");
  if (!response.ok) return [];
  const body = await response.json().catch(() => ({}));
  return Array.isArray(body.orders) ? body.orders : [];
}

function findOrderForConNote(orders, conNote) {
  const exact = orders.find(order => String(order.conNote || "").trim() === String(conNote || "").trim());
  if (exact) return exact;
  const key = looseKey(conNote);
  return orders.find(order => [order.portalOrderId, order.id, order.workItemId, order.businessName, order.clientName]
    .map(looseKey)
    .some(value => value && value === key));
}

function deliveryRowsFromCard(card, orders) {
  const rows = [];
  card.querySelectorAll(".dw-delivery-line").forEach(line => {
    const conNote = textOf(line.querySelector("strong"));
    const order = findOrderForConNote(orders, conNote);
    if (order?.zohoDealId) rows.push({ order, conNote });
  });
  return rows;
}

function deliveryPayloadFromCard({ card, orders, receiverName, receiverPhone, signatureData }) {
  const rows = deliveryRowsFromCard(card, orders);
  const completedAt = new Date().toISOString();
  const driverName = textOf(document.querySelector(".dw-user strong")) || "Driver";

  return rows.map(({ order, conNote }) => ({
    id: `delivery_${order.zohoDealId}_${Date.now()}`,
    orderId: order.id,
    zohoDealId: order.zohoDealId,
    conNote: conNote || order.conNote,
    businessName: order.businessName,
    vendor: order.vendor,
    dropLocation: order.dropLocation,
    receiverName,
    receiverPhone,
    driverName,
    signatureData,
    itemsDesc: order.pickupSummary || order.itemsDesc || "Delivered by Moto & Co Couriers",
    completedAt,
  }));
}

async function pushDeliveryOutcome(deliveries) {
  const response = await fetch("/.netlify/functions/delivery-outcome", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deliveries }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || "Could not sync delivery sign-off to Zoho.");
  return body;
}

export default function DriverDeliveryOutcomeBridge() {
  const [active, setActive] = useState(false);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState("");

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

  useEffect(() => {
    if (!active) return undefined;

    function handleClick(event) {
      const button = event.target?.closest?.("button");
      if (!button || !textOf(button).toLowerCase().includes("complete delivery")) return;

      const card = button.closest(".dw-sign-card");
      if (!card) return;

      const inputs = Array.from(card.querySelectorAll("input"));
      const receiverName = textOf({ textContent: inputs[0]?.value || "" });
      const receiverPhone = textOf({ textContent: inputs[1]?.value || "" });
      const canvas = card.querySelector("canvas");
      if (!receiverName || !hasCanvasInk(canvas)) return;

      const signatureData = canvas.toDataURL("image/png");
      const deliveries = deliveryPayloadFromCard({ card, orders, receiverName, receiverPhone, signatureData });
      if (!deliveries.length) {
        setMessage("Delivery signed locally, but I could not match the stop to Zoho deals yet.");
        return;
      }

      window.setTimeout(() => {
        pushDeliveryOutcome(deliveries)
          .then(result => {
            setMessage(`Delivery sign-off saved to Zoho for ${result.deliveryRows || deliveries.length} deal${(result.deliveryRows || deliveries.length) === 1 ? "" : "s"}.`);
            return refreshOrders();
          })
          .catch(error => setMessage(error.message));
      }, 300);
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [active, orders]);

  if (!active) return null;

  return (
    <div className="dw-delivery-bridge">
      <style>{styles}</style>
      {message && <div className="dw-delivery-message" onClick={() => setMessage("")}>{message}</div>}
    </div>
  );
}

const styles = `
.dw-delivery-message{position:fixed;right:18px;bottom:76px;z-index:10020;max-width:380px;background:#e9e2d5;border:1px solid #cfc6b7;border-left:4px solid #19733a;color:#15110d;padding:12px 14px;box-shadow:0 4px 18px rgba(0,0,0,.18);font-family:Barlow,Arial,sans-serif;font-size:14px;cursor:pointer}@media(max-width:760px){.dw-delivery-message{left:14px;right:14px;bottom:76px;max-width:none}}
`;
