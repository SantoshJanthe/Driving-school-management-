import { redirect } from "next/navigation";

// The middleware already redirects "/" based on session state; this is the
// fallback for environments where the middleware does not run (e.g. tests).
export default function Home() {
  redirect("/dashboard");
}
