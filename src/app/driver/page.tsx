import type { Metadata } from "next";
import MotoCoLogisticsApp from "@/components/moto-co-logistics";

export const metadata: Metadata = {
  title: "Driver Run | Moto & Co Couriers",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DriverPage() {
  return <MotoCoLogisticsApp />;
}
