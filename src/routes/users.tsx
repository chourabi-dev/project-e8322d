import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { SectionCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRequireAuth } from "@/lib/auth";
import { users } from "@/lib/mock-data";

export const Route = createFileRoute("/users")({
  head: () => ({
    meta: [
      { title: "Users & Permissions · Dalu | Web master" },
      {
        name: "description",
        content:
          "Role-based access for administrators, restaurant managers, kitchen staff, cashiers and viewers.",
      },
      { property: "og:title", content: "Users & Permissions · Dalu | Web master" },
      { property: "og:description", content: "Give every role exactly the access it needs." },
    ],
  }),
  component: UsersPage,
});

const roles = [
  { role: "Administrator", scope: "Full access to every restaurant, user and setting." },
  { role: "Restaurant Manager", scope: "Menus, products, orders and staff for assigned restaurants." },
  { role: "Kitchen Staff", scope: "Kitchen display screens and ticket status updates only." },
  { role: "Cashier", scope: "Order creation, payment status and daily takings." },
  { role: "Viewer", scope: "Read-only dashboards and analytics." },
];

function UsersPage() {
  useRequireAuth();

  return (
    <AppShell
      title="Users & permissions"
      subtitle={`${users.length} team members · role-based access`}
      actions={
        <Button className="gap-2" onClick={() => toast("Invite form opens here")}>
          <Plus className="size-4" /> Invite user
        </Button>
      }
    >
      <div className="panel overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Restaurants</TableHead>
              <TableHead className="text-right">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.email}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-full bg-surface font-display text-xs font-semibold">
                      {u.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={u.role === "Administrator" ? "default" : "outline"}>{u.role}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.restaurants}</TableCell>
                <TableCell className="text-right">
                  <Switch defaultChecked={u.active} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <SectionCard
        title="Roles"
        description="Permissions are attached to roles, never to individual accounts"
        action={
          <span className="grid size-9 place-items-center rounded-lg bg-success/12 text-success">
            <ShieldCheck className="size-4.5" />
          </span>
        }
      >
        <ul className="grid gap-3 md:grid-cols-2">
          {roles.map((r) => (
            <li key={r.role} className="rounded-xl bg-surface p-4">
              <p className="text-sm font-medium">{r.role}</p>
              <p className="mt-1 text-xs text-muted-foreground">{r.scope}</p>
            </li>
          ))}
        </ul>
      </SectionCard>
    </AppShell>
  );
}
