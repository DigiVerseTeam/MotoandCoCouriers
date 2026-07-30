import type { Metadata } from "next";
import MotoCoLogisticsApp from "@/components/moto-co-logistics";

export const metadata: Metadata = {
  title: "Book a Pickup | Moto & Co Couriers",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingPage() {
  return <MotoCoLogisticsApp />;
}
