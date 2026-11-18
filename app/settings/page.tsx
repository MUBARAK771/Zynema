import SettingsClient from "@/app/components/SettingsClient";

export default function SettingsPage() {
  const loginUrl = process.env.LOGIN_URL ?? "https://www.zynema-app.online";
  return <SettingsClient loginUrl={loginUrl} />;
}
