import SettingsClient from "@/app/components/SettingsClient";
import { getLoginUrl } from "@/lib/auth";

export default function SettingsPage() {
  const loginUrl = getLoginUrl();
  return <SettingsClient loginUrl={loginUrl} />;
}
