import { redirect } from "next/navigation";

export default function HRRedirect() {
  redirect("/dashboard/outbound");
}
