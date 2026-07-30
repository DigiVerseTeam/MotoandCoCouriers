export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://motoandcocouriers.vercel.app";

export const publicContact = {
  email: "hello@motoandcocouriers.com.au",
  privacyEmail: "privacy@motoandcocouriers.com.au",
  legalEntity: "Moto & Co Pty Ltd",
  abn: "55 679 964 357",
  serviceArea: "Brisbane supplier collections and South East Queensland workshop deliveries",
};

export const activeSuppliers = [
  "Link International",
  "A1 Accessories",
  "McLeods",
  "Gas Imports",
  "Whites Powersports",
];

export const publicNav = [
  { label: "Workshops", href: "/workshops" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
  { label: "Legal", href: "/legal" },
  { label: "Portal", href: "/portal" },
];

export const portalEntryPoints = [
  {
    label: "Customer portal",
    href: "/portal",
    summary: "Register a workshop, lodge deliveries, view delivery history, and access proof of delivery.",
  },
  {
    label: "Courier business login",
    href: "/login",
    summary: "Admin, billing, and driver users sign in through the courier business login.",
  },
  {
    label: "Delivery tracking",
    href: "/tracking",
    summary: "Account holders can check delivery status and proof records through the customer portal.",
  },
];

export const workshopReasons = [
  {
    title: "Keep technicians on the tools.",
    copy: "Your team should be servicing motorcycles, not spending valuable time collecting parts across town.",
  },
  {
    title: "Plan around set delivery days.",
    copy: "Tuesday and Thursday runs give workshops a reliable rhythm for ordering, booking, and job planning.",
  },
  {
    title: "Use motorcycle-specific handling.",
    copy: "Parts, tyres, returns, riding gear, and workshop consignments are handled by a network built for the motorcycle industry.",
  },
  {
    title: "Manage deliveries digitally.",
    copy: "Book consignments, check delivery history, and access proof of delivery through the customer portal.",
  },
];

export const howItWorks = [
  "Place your order with a participating motorcycle supplier before that warehouse's cut-off.",
  "Tell the supplier Moto & Co Couriers is collecting.",
  "Log in and lodge the supplier and con note details.",
  "We collect from participating Brisbane suppliers on the scheduled run.",
  "Your workshop receives the delivery with electronic proof of delivery.",
];

export const gettingStarted = [
  "Register your workshop through the customer portal.",
  "Select the participating suppliers your workshop orders from.",
  "We confirm your account, service area, and supplier fit.",
  "Once active, lodge deliveries and receive monthly PDF invoices.",
];

export const serviceCards = [
  {
    title: "Scheduled milk runs",
    copy: "Tuesday and Thursday supplier collections across the current Brisbane network, consolidated for workshop delivery.",
  },
  {
    title: "Last-mile delivery",
    copy: "The final leg from supplier warehouse to workshop, built around motorcycle parts, tyres, and accessories.",
  },
  {
    title: "Electronic proof of delivery",
    copy: "Completed deliveries include receiver name and signature, with proof available through the customer portal.",
  },
];

export const serviceFit = [
  "Workshops ordering from Link International, A1 Accessories, McLeods, Gas Imports, or Whites Powersports.",
  "Businesses that want predictable run days instead of chasing separate couriers.",
  "Supplier partners that need a reliable final leg into South East Queensland workshops.",
];

export const operatingCadence = [
  { label: "Order readiness", value: "Before each supplier warehouse cut-off" },
  { label: "Run days", value: "Tuesday and Thursday" },
  { label: "Proof", value: "Receiver name and signature" },
];

export const tyrePricing = [
  { freight: "1 tyre", price: "$18.50" },
  { freight: "2 tyres", price: "$24.00" },
  { freight: "3 tyres", price: "$33.00" },
  { freight: "4+ tyres", price: "$12.30 each" },
];

export const partsPricing = [
  { freight: "Up to 5kg", price: "$17.20" },
  { freight: "5-10kg", price: "$21.00" },
  { freight: "10kg+", price: "From $25.00" },
];

export const additionalPricing = [
  { freight: "Return to supplier, pre-labelled", price: "$6.00" },
  { freight: "Out-of-zone delivery", price: "$10.00" },
  { freight: "Oversized / bulky freight", price: "Quoted on application" },
];

export const faqItems = [
  {
    question: "What is a milk run?",
    answer: "A milk run is a set collection route. Instead of separate courier trips for every order, supplier pickups are consolidated on fixed run days and delivered to your workshop.",
  },
  {
    question: "Which suppliers are active?",
    answer: `The current participating supplier network is ${activeSuppliers.join(", ")}.`,
  },
  {
    question: "When do you run?",
    answer: "Standard runs operate Tuesday and Thursday. Place your supplier order before that warehouse's own cut-off so the goods can be picked, packed, and ready for the scheduled collection.",
  },
  {
    question: "How are invoices handled?",
    answer: "Invoices are generated as monthly PDFs and emailed separately by the Moto & Co Couriers team.",
  },
  {
    question: "Do I need an account?",
    answer: "Yes. Workshop accounts provide access to bookings, delivery history, proof of delivery, and monthly invoicing.",
  },
  {
    question: "Can suppliers partner with the network?",
    answer: "Yes. Motorcycle suppliers can discuss scheduled collections, warehouse fit, and last-mile delivery support with the Moto & Co Couriers team.",
  },
];

export const workshopBenefits = [
  "Keep technicians on the tools.",
  "Plan around predictable delivery schedules.",
  "Use transparent Standard Network Rates.",
  "Access electronic proof of delivery.",
  "Manage deliveries through the customer portal.",
];

export const supplierBenefits = [
  "Extend delivery capability without adding vehicles.",
  "Reduce fleet and delivery operating costs.",
  "Offer professional last-mile delivery to workshops.",
  "Keep customers connected with proof of delivery.",
  "Scale delivery support as the network grows.",
];

export const brandPillars = [
  {
    title: "Specialist",
    copy: "Built exclusively for the motorcycle industry, not general freight.",
  },
  {
    title: "Connected",
    copy: "Connecting suppliers, workshops, and delivery information through one network.",
  },
  {
    title: "Reliable",
    copy: "Predictable delivery days, clear pricing, and professional communication.",
  },
  {
    title: "Efficient",
    copy: "Designed to reduce unnecessary supplier runs and keep workshop work moving.",
  },
];

export const footerStatement =
  "Moto & Co Couriers is a business of Moto & Co Pty Ltd. Building businesses that keep the motorcycle industry moving.";
