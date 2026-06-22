import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Button from "../../../shared/components/Button";
import Field from "../../../shared/components/Field";
import Input from "../../../shared/components/Input";
import { login, selectAuthLoading, selectIsAuthenticated } from "../authSlice";
import { company } from "../../../shared/session";
import { ShowIcon, HideIcon } from "../../../shared/components/icons";

/**
 * Login screen. The only public route — everything else sits behind <RequireAuth>.
 * There is no registration: credentials are validated against the single user the
 * API seeds from configuration. On success the JWT lands in the auth slice (and
 * localStorage) and we redirect to wherever the user was headed.
 */
export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthenticated = useSelector(selectIsAuthenticated);
  const loading = useSelector(selectAuthLoading);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  // Where to land after login — the page they tried to open, or the dashboard.
  const from = location.state?.from?.pathname ?? "/";

  // Already authenticated (or a fresh login just flipped the flag)? Skip the form.
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      await dispatch(
        login({ email: email.trim(), password }),
      ).unwrap();
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        typeof err === "string" ? err : "Invalid email or password";
      setError(message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-12">
      {/* Sign-in form — centered card */}
      <form
        className="flex w-full max-w-[420px] flex-col gap-7 rounded-card border border-slate-200 bg-white px-[clamp(24px,5vw,48px)] py-10 shadow-sm"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-indigo-600 text-[18px] font-bold text-white">
            {company.initials}
          </div>
          <div>
            <strong className="block text-[15px] leading-tight text-slate-900">{company.name}</strong>
            <span className="block text-xs text-slate-500">{company.tagline}</span>
          </div>
        </div>

        <div>
          <h1 className="mb-2 text-[28px] font-semibold leading-tight text-slate-900">Sign in</h1>
          <p className="text-[14.5px] text-slate-500">
            Enter your credentials to access the workspace.
          </p>
        </div>

        {error ? (
          <div className="flex gap-2.5 rounded-field border border-red-200 bg-red-100 px-4 py-3 text-[13.5px] text-red-600">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-[22px]">
          <Field label="Email" htmlFor="login-email" className="gap-2">
            <Input
              id="login-email"
              className="rounded-card px-[15px] py-[13px] text-[15px]"
              invalid={Boolean(error)}
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
            />
          </Field>

          <Field label="Password" htmlFor="login-password" className="gap-2">
            <div className="relative flex items-center">
              <Input
                id="login-password"
                className="rounded-card px-[15px] py-[13px] pr-[46px] text-[15px]"
                invalid={Boolean(error)}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-field text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 [&>svg]:size-[18px]"
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <HideIcon /> : <ShowIcon />}
              </button>
            </div>
          </Field>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="mt-1.5 w-full px-[15px] py-[13px] text-[15px]"
          >
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </div>
      </form>
    </div>
  );
}
