import type { Metadata } from "next";
import WebsitePage from "./website/page";

export const metadata: Metadata = {
  title: "Moto & Co Couriers | Motorcycle Last Mile Logistics",
  description:
    "Moto & Co Couriers connects motorcycle suppliers and workshops through scheduled last mile logistics across South East Queensland.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <WebsitePage />;
}
