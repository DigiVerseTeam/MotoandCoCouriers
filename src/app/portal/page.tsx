import type { Metadata } from "next";
import MotoCoLogisticsApp from "@/components/moto-co-logistics";

export const metadata: Metadata = {
  title: "Customer Portal | Moto & Co Couriers",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PortalPage() {
  return <MotoCoLogisticsApp />;
}
