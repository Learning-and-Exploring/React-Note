import { useState } from "react";
import { Eye, EyeOff, NotebookPen } from "lucide-react";
import { Button } from '@/components/button'
import { Input } from "@/components/ui/input";
import { useNotes } from "@features/notes/hooks/use-notes";

type AuthMode = "login" | "register";

export function AuthPage() {
  const { login, register, loading, error } = useNotes();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isLogin = mode === "login";

  const submit = async () => {
    setLocalMessage(null);

    if (isLogin) {
      await login({ email: email.trim(), password: password.trim() });
      return;
    }

    const success = await register({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
    });

    if (success) {
      setLocalMessage("Register success. You can login now.");
      setMode("login");
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f2f2f7] px-4 py-8 dark:bg-zinc-950">
      <section className="w-full max-w-md rounded-3xl bg-white/85 px-6 py-8 shadow-[0_18px_40px_rgba(0,0,0,0.08)] ring-1 ring-white/70 backdrop-blur dark:bg-zinc-900/80 dark:ring-white/10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/70 shadow-sm dark:bg-white/10">
            <NotebookPen className="h-7 w-7 text-slate-700 dark:text-slate-200" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Welcome to Notes
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {isLogin ? "Sign in to continue" : "Create an account to start"}
          </p>
        </div>

        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {!isLogin ? (
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Name</label>
              <Input
                className="mt-2"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          ) : null}

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Email</label>
            <Input
              className="mt-2"
              placeholder="Enter your email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Password</label>
            <div className="relative mt-2">
              <Input
                className="pr-10"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-slate-500 dark:text-slate-400"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              loading ||
              !email.trim() ||
              !password.trim() ||
              (!isLogin && !name.trim())
            }
          >
            {loading ? "Loading..." : isLogin ? "Login" : "Register"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          {isLogin ? (
            <p className="text-slate-600 dark:text-slate-400">
              Don't have an account?{" "}
              <button
                onClick={() => setMode("register")}
                className="font-medium text-blue-600 hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <button
                onClick={() => setMode("login")}
                className="font-medium text-blue-600 hover:underline"
              >
                Log in
              </button>
            </p>
          )}
        </div>

        {(error || localMessage) && (
          <div
            className={`mt-4 rounded-2xl p-3 text-sm ${
              error
                ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300 text-center"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 text-center"
            }`}
          >
            {error || localMessage}
          </div>
        )}
      </section>
    </main>
  );
}
