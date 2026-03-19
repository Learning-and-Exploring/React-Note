import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck, ShieldEllipsis } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "../hooks/use-admin";

const ADMIN_LOGIN_SUCCESS_STORAGE_KEY = "admin-login-success-message";

export function AdminAuthPage() {
  const { login, loading, error, clearError } = useAdmin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  const submit = async () => {
    clearError();

    const didLogin = await login({
      email: email.trim(),
      password: password.trim(),
      privateKey: privateKey.trim(),
    });

    if (didLogin && typeof window !== "undefined") {
      window.sessionStorage.setItem(
        ADMIN_LOGIN_SUCCESS_STORAGE_KEY,
        "Admin login successful.",
      );
    }
  };

  return (
    <main className="min-h-screen bg-[#eef3f8] px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur xl:grid-cols-[1.05fr_0.95fr] dark:border-white/10 dark:bg-zinc-900/85">
          <div className="relative overflow-hidden px-6 py-10 sm:px-10 lg:px-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(14,116,144,0.18),_transparent_45%),radial-gradient(circle_at_bottom_right,_rgba(234,88,12,0.14),_transparent_40%)]" />
            <div className="relative space-y-8">
              <Badge
                variant="outline"
                className="rounded-full border-cyan-200 bg-cyan-50/80 px-3 py-1 text-[0.7rem] uppercase tracking-[0.22em] text-cyan-800 dark:border-cyan-900/80 dark:bg-cyan-950/40 dark:text-cyan-100"
              >
                Admin access
              </Badge>
              <div className="space-y-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950">
                  <ShieldCheck className="h-7 w-7" />
                </div>
                <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl dark:text-slate-50">
                  Operate the Notes workspace from one control surface.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
                  Sign in with your admin account, password, and private key to
                  review users, filter accounts, and toggle access from the
                  existing backend API.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Search
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    Find users by name or email.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Review
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    Inspect account details and timestamps.
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Control
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    Toggle user access without leaving the dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/70 bg-slate-50/70 px-6 py-10 sm:px-10 lg:border-l lg:border-t-0 lg:px-12 dark:border-white/10 dark:bg-zinc-950/30">
            <div className="mx-auto w-full max-w-md space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <ShieldEllipsis className="h-5 w-5" />
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Admin sign in
                  </h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  This route is isolated from the normal user session to avoid
                  refresh-token collisions.
                </p>
              </div>

              <form
                className="space-y-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submit();
                }}
              >
                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Email
                  </label>
                  <Input
                    className="mt-2 h-12 rounded-2xl border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
                    placeholder="admin@example.com"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <div className="relative mt-2">
                    <Input
                      className="h-12 rounded-2xl border-slate-200 bg-white pr-11 dark:border-white/10 dark:bg-white/5"
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                    <KeyRound className="h-3.5 w-3.5" />
                    Private key
                  </label>
                  <div className="relative mt-2">
                    <Input
                      className="h-12 rounded-2xl border-slate-200 bg-white pr-11 dark:border-white/10 dark:bg-white/5"
                      placeholder="Enter the admin private key"
                      type={showPrivateKey ? "text" : "password"}
                      value={privateKey}
                      onChange={(event) => setPrivateKey(event.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500"
                      onClick={() => setShowPrivateKey((value) => !value)}
                    >
                      {showPrivateKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-slate-950 text-white hover:bg-slate-800 dark:bg-cyan-200 dark:text-slate-950 dark:hover:bg-cyan-100"
                  disabled={
                    loading ||
                    !email.trim() ||
                    !password.trim() ||
                    !privateKey.trim()
                  }
                >
                  {loading ? "Signing in..." : "Enter admin console"}
                </Button>
              </form>

              {error ? (
                <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                  {error}
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
