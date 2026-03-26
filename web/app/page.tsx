import { redirect } from "next/navigation";
import { DASHBOARD_ROUTE } from "@/lib/routes";

export default function Home() {
  redirect(DASHBOARD_ROUTE);
}
