import { createFileRoute } from "@tanstack/react-router";
import { Save, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Aveline Restaurant OS" },
      {
        name: "description",
        content:
          "Business information, taxes, currency, language, theme, notifications and kitchen display preferences.",
      },
      { property: "og:title", content: "Settings · Aveline Restaurant OS" },
      { property: "og:description", content: "Tune the platform to how your restaurants actually run." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  useRequireAuth();
  const { theme, toggle } = useTheme();

  return (
    <AppShell
      title="Settings"
      subtitle="Workspace-wide defaults · per-restaurant overrides available"
      actions={
        <Button className="gap-2" onClick={() => toast.success("Settings saved")}>
          <Save className="size-4" /> Save changes
        </Button>
      }
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Business information">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="legal">Legal name</Label>
              <Input id="legal" defaultValue="Aveline Hospitality Group" className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vat">VAT / Tax ID</Label>
              <Input id="vat" defaultValue="TN-1184920/AM" className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="support">Support email</Label>
              <Input id="support" defaultValue="ops@aveline.co" className="h-10" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Taxes, currency & language">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Default tax rate</Label>
              <Input defaultValue="19%" className="h-10" />
            </div>
            <div className="grid gap-2">
              <Label>Currency</Label>
              <Select defaultValue="eur">
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eur">EUR · Euro</SelectItem>
                  <SelectItem value="usd">USD · US Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Language</Label>
              <Select defaultValue="en">
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Appearance">
          <div className="flex items-center justify-between rounded-xl bg-surface p-4">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground">
                Currently {theme === "dark" ? "dark" : "light"} mode
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={toggle}>
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              Switch
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Notifications & kitchen display">
          <div className="flex flex-col">
            {[
              { label: "New order sound on kitchen screens", on: true },
              { label: "Escalate ticket colour after prep time", on: true },
              { label: "Email daily revenue summary", on: false },
              { label: "Large touch targets on kitchen devices", on: true },
              { label: "Auto-complete tickets after pickup", on: false },
            ].map((s) => (
              <label
                key={s.label}
                className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-0"
              >
                {s.label}
                <Switch defaultChecked={s.on} />
              </label>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Coming modules" description="Architecture is ready for these add-ons">
        <div className="flex flex-wrap gap-2">
          {[
            "QR Code Menus",
            "Customer Mobile Ordering",
            "Reservations",
            "Loyalty Program",
            "Inventory",
            "Suppliers",
            "Multi-currency",
            "POS Integration",
            "Online Ordering",
            "Delivery Integration",
            "AI Sales Analytics",
            "Printer Settings",
          ].map((m) => (
            <Badge key={m} variant="outline" className="px-3 py-1.5 text-muted-foreground">
              {m}
            </Badge>
          ))}
        </div>
      </SectionCard>
    </AppShell>
  );
}
