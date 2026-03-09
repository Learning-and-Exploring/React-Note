import { useState } from "react";
import { NotebookPen } from "lucide-react";
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
    <main className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-8">
      <section className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <NotebookPen className="h-10 w-10 text-slate-700" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Welcome to Notes</h1>
          <p className="mt-2 text-sm text-slate-600">{isLogin ? "Sign in to continue" : "Create an account to start"}</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          {!isLogin ? (
            <div>
              <label className="text-xs font-medium text-slate-600">Name</label>
              <input
                className="mt-1 block w-full border-0 border-b-2 border-slate-200 bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-blue-500"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          ) : null}

          <div>
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input
              className="mt-1 block w-full border-0 border-b-2 border-slate-200 bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-blue-500"
              placeholder="Enter your email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Password</label>
            <input
              className="mt-1 block w-full border-0 border-b-2 border-slate-200 bg-transparent px-1 py-2 text-sm outline-none transition-colors focus:border-blue-500"
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full !mt-8"
            disabled={
              loading ||
              !email.trim() ||
              !password.trim() ||
              (!isLogin && !name.trim())
            }
          >
            {loading ? "Working..." : isLogin ? "Login" : "Register"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          {isLogin ? (
            <p className="text-slate-600">
              Don't have an account?{" "}
              <button onClick={() => setMode("register")} className="font-medium text-blue-600 hover:underline">
                Sign up
              </button>
            </p>
          ) : (
            <p className="text-slate-600">
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="font-medium text-blue-600 hover:underline">
                Log in
              </button>
            </p>
          )}
        </div>

        {(error || localMessage) && (
          <div className={`mt-4 rounded-md p-3 text-sm ${error ? "border border-red-300 bg-red-50 text-red-700" : "border border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
            {error || localMessage}
          </div>
        )}
      </section>
    </main>
  );
}
