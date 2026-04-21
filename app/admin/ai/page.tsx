import { readConfig } from "@/lib/data";
import AISettingsClient from "./AISettingsClient";

export default function AISettingsPage() {
  const config = readConfig();
  return <AISettingsClient initialSettings={config.aiSettings} />;
}
