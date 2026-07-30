import type { Metadata } from "next";
import MotoCoLogisticsApp from "@/components/moto-co-logistics";

export const metadata: Metadata = {
  title: "Journey View | Moto & Co Couriers",
  robots: {
    index: false,
    follow: false,
  },
};

export default function JourneyPage() {
  return <MotoCoLogisticsApp />;
}
