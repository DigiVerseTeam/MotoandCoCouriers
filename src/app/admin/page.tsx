import type { Metadata } from "next";
import MotoCoLogisticsApp from "@/components/moto-co-logistics";

export const metadata: Metadata = {
  title: "Courier Business Login | Moto & Co Couriers",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  return <MotoCoLogisticsApp />;
}
