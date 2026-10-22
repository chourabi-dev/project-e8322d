import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UtensilsCrossed, Loader2, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import loginImage from "@/assets/login-kitchen.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · Dalu | Web master" },
      {
        name: "description",
        content:
          "Sign in to Dalu to manage restaurants, menus, kitchen display screens and live orders.",
      },
      { property: "og:title", content: "Sign in · Dalu | Web master" },
      {
        property: "og:description",
        content: "One login for every restaurant, kitchen screen and menu you operate.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, session, ready } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && session) navigate({ to: "/dashboard", replace: true });
  }, [ready, session, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Enter your username and password");
      return;
    }
    setLoading(true);

    signIn(username.trim(), password).then((res)=>{

      console.log(res);

      
      toast.success(`Welcome back, ${username.trim()}`);
      navigate({ to: "/dashboard" });


    }).catch((err)=>{
       toast.error(`Wrong username or password`);

    }).finally(()=>{
      setLoading(false);
    })
    
    
    
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden lg:block">
         
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/55 to-background/10" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <div className="flex items-center gap-2.5">
            <span className="gradient-primary grid size-10 place-items-center rounded-xl text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </span>
            <span className="font-display text-lg font-semibold">Dalu</span>
          </div>
          <div className="max-w-md">
            <h2 className="font-display text-4xl leading-tight font-semibold">
              Every service, every station, one screen.
            </h2> 
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="animate-rise w-full max-w-sm">
          <div className="mb-8 flex items-center justify-between">
            <span className="gradient-primary grid size-10 place-items-center rounded-xl text-primary-foreground lg:hidden">
              <UtensilsCrossed className="size-5" />
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
              className="ml-auto"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>
          </div>

          <h1 className="font-display text-3xl font-semibold">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Use your staff credentials to open the operations workspace.
          </p>

          <form onSubmit={submit} className="mt-8 flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
             
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Demo workspace — any username and password opens the dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}
