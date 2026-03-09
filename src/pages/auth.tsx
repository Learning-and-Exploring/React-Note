import { useState } from "react";
import { Button } from "../components/button";
import { useNotes } from "../hooks/use-notes";

type AuthMode = "login" | "register";

export function AuthPage() {
  const { login, register, loading, error } = useNotes();

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const isLogin = mode === "login";

  const submit = async () => {
    setLocalMessage(null);

    if (isLogin) {
      await login({ email: email.trim(), password: password.trim() });
      return;
    }

    await register({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
    });

    setLocalMessage("Register success. You can login now.");
    setMode("login");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-8">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Notes Auth</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in or create an account to continue.</p>

        <div className="mt-5 flex gap-2">
          <Button
            variant={isLogin ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("login")}
          >
            Login
          </Button>
          <Button
            variant={!isLogin ? "primary" : "secondary"}
            size="sm"
            onClick={() => setMode("register")}
          >
            Register
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          {!isLogin ? (
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          ) : null}

          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button
            onClick={() => void submit()}
            disabled={
              loading ||
              !email.trim() ||
              !password.trim() ||
              (!isLogin && !name.trim())
            }
          >
            {loading ? "Working..." : isLogin ? "Login" : "Register"}
          </Button>
        </div>

        {localMessage ? (
          <div className="mt-4 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
            {localMessage}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>
    </main>
  );
}
