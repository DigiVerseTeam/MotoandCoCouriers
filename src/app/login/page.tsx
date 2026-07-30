import type { Metadata } from "next";
import MotoCoLogisticsApp from "@/components/moto-co-logistics";

export const metadata: Metadata = {
  title: "Workshop Login & Registration | Moto & Co Couriers",
  description: "Log in to your Moto and Co Couriers workshop account or register your workshop.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return <MotoCoLogisticsApp />;
}
