import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, m } from "motion/react";
import { Smartphone, ShieldCheck, ArrowLeft, UserRound } from "lucide-react";
import { requestOtp, verifyOtp, listDemoCitizens } from "@/api/citizens";
import { useSession } from "@/store/session";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/misc";
import { spring, ease } from "@/lib/motion";
import { haptic, initials } from "@/lib/utils";
import { stateLabel } from "@/lib/reference";

export default function Login() {
  const { t, lang } = useT();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/me";
  const login = useSession((s) => s.loginCitizen);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [stage, setStage] = useState<"mobile" | "otp">("mobile");
  const [error, setError] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const { data: demos } = useQuery({ queryKey: ["demo-citizens"], queryFn: listDemoCitizens });

  const send = useMutation({
    mutationFn: () => requestOtp(mobile),
    onSuccess: (r) => {
      if (!r.sent) return setError(t("login.err_mobile"));
      setStage("otp");
      setError(null);
    },
  });
  const verify = useMutation({
    mutationFn: (code: string) => verifyOtp(mobile, code),
    onSuccess: (c) => {
      haptic();
      login(c.id);
      nav(next, { replace: true });
    },
    onError: () => setError(t("login.err_otp")),
  });

  const code = otp.join("");
  useEffect(() => {
    if (code.length === 6 && !verify.isPending) verify.mutate(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (digits.length > 1) {
      const arr = digits.slice(0, 6).split("");
      setOtp([...arr, ...Array(6 - arr.length).fill("")]);
      refs.current[Math.min(5, arr.length)]?.focus();
      return;
    }
    const nextOtp = [...otp];
    nextOtp[i] = digits;
    setOtp(nextOtp);
    if (digits && i < 5) refs.current[i + 1]?.focus();
  };

  const quick = (m: string) => {
    setMobile(m);
    setStage("otp");
    setError(null);
  };

  return (
    <div className="mx-auto max-w-[480px]">
      <PageHeader title={t("login.title")} subtitle={t("login.sub")} crumbs={[{ label: t("login.title") }]} />
      <div className="card overflow-hidden p-6">
        <AnimatePresence mode="wait" initial={false}>
          {stage === "mobile" ? (
            <m.form
              key="mobile"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25, ease: ease.out }}
              onSubmit={(e) => {
                e.preventDefault();
                if (!/^[6-9]\d{9}$/.test(mobile)) return setError(t("login.err_mobile"));
                send.mutate();
              }}
            >
              <Field label={t("login.mobile")} htmlFor="mobile" error={error} hint={t("login.mobile_hint")} required>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-ink">+91</span>
                  <Input id="mobile" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))} className="pl-14 text-lg tracking-wider" aria-invalid={!!error} aria-describedby={error ? "mobile-error" : "mobile-hint"} />
                </div>
              </Field>
              <Button type="submit" size="lg" className="mt-6 w-full" disabled={send.isPending}>
                <Smartphone aria-hidden /> {send.isPending ? t("login.sending") : t("login.get_otp")}
              </Button>
            </m.form>
          ) : (
            <m.form
              key="otp"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.25, ease: ease.out }}
              onSubmit={(e) => {
                e.preventDefault();
                if (code.length !== 6) return setError(t("login.err_otp"));
                verify.mutate(code);
              }}
            >
              <button type="button" onClick={() => { setStage("mobile"); setOtp(["", "", "", "", "", ""]); }} className="mb-4 flex min-h-[44px] items-center gap-1 text-sm font-semibold text-info">
                <ArrowLeft className="size-4" aria-hidden /> {t("login.change")} <span className="num">+91 {mobile}</span>
              </button>
              <fieldset>
                <legend className="field-label">{t("login.otp")}</legend>
                <div className="flex justify-between gap-2">
                  {otp.map((d, i) => (
                    <m.input
                      key={i}
                      ref={(el) => { refs.current[i] = el; }}
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Backspace" && !d && i > 0) refs.current[i - 1]?.focus(); }}
                      inputMode="numeric"
                      autoFocus={i === 0}
                      autoComplete={i === 0 ? "one-time-code" : "off"}
                      maxLength={6}
                      aria-label={t("login.digit", { n: i + 1 })}
                      animate={{ scale: d ? 1.04 : 1 }}
                      transition={spring.snappy}
                      className="input num h-14 w-full max-w-[56px] px-0 text-center text-xl font-semibold"
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-muted">{t("login.otp_hint")}</p>
                {error && <p role="alert" className="mt-2 text-sm text-rejected-ink">{error}</p>}
              </fieldset>
              <Button type="submit" size="lg" className="mt-6 w-full" disabled={verify.isPending}>
                <ShieldCheck aria-hidden /> {verify.isPending ? t("login.verifying") : t("login.verify")}
              </Button>
            </m.form>
          )}
        </AnimatePresence>
      </div>

      <section className="mt-6" aria-labelledby="demo-title">
        <h2 id="demo-title" className="mb-1 text-base font-semibold">{t("login.demo")}</h2>
        <p className="mb-3 text-sm text-muted">{t("login.demo_sub")}</p>
        <div className="grid gap-2">
          {demos?.map((c) => (
            <m.button key={c.id} whileTap={{ scale: 0.97 }} transition={spring.snappy} onClick={() => quick(c.mobile)} className="card flex items-center gap-3 p-3 text-left hover:border-line/[0.16]">
              <span className="flex size-10 items-center justify-center rounded-full bg-ink/[0.08] text-sm font-bold text-ink">{initials(c.name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{lang === "hi" && c.nameHi ? c.nameHi : c.name}</span>
                <span className="num block text-sm text-muted">+91 {c.mobile} · {stateLabel(c.state, lang)}</span>
              </span>
              <UserRound className="size-4 text-muted" aria-hidden />
            </m.button>
          ))}
        </div>
      </section>
    </div>
  );
}
