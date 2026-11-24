import { SubscribeForm } from "@/components/marketing/subscribe-form";
import { formatINR } from "@/lib/format";
import { paymentConfig, paymentReady, upiLink } from "@/lib/subscription/config";

export function SubscribeSection() {
  const config = paymentConfig();
  const ready = paymentReady(config);
  const link = upiLink(config);

  return (
    <section
      id="subscribe"
      className="grid gap-6 rounded-[2rem] border border-black/10 bg-[#fffcf7]/85 p-6 shadow-[0_18px_50px_rgba(26,25,22,0.05)] backdrop-blur-[2px] md:grid-cols-[1fr_1.4fr] md:p-10"
      aria-labelledby="subscribe-heading"
    >
      <div className="grid content-start gap-4">
        <p className="text-xs font-medium tracking-[0.18em] text-[#8a7355] uppercase">
          Monthly subscription
        </p>
        <h2 id="subscribe-heading" className="text-2xl font-medium tracking-tight md:text-3xl">
          Get the app for your school
        </h2>
        <p className="text-sm text-muted-foreground">
          Pay the monthly fee by UPI or bank transfer, then send the transaction ID. Once the payment
          is verified, this page opens the download for your laptop and Android phone.
        </p>
        {ready ? (
          <div className="grid gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm">
            <p className="text-3xl font-medium">
              {formatINR(config.monthlyFee)}
              <span className="text-sm font-normal text-muted-foreground"> per school, per month</span>
            </p>
            {config.payeeName ? <p>Pay to {config.payeeName}</p> : null}
            {config.upiId ? (
              <p>
                UPI ID <span className="font-mono">{config.upiId}</span>
                {link ? (
                  <>
                    {" "}
                    ·{" "}
                    <a href={link} className="underline underline-offset-4">
                      Open in a UPI app
                    </a>
                  </>
                ) : null}
              </p>
            ) : null}
            {config.bankDetails ? (
              <p className="whitespace-pre-line">{config.bankDetails}</p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-2xl border border-black/10 bg-white/70 p-4 text-sm">
            The monthly fee and payment details are not published yet. Check back soon.
          </p>
        )}
      </div>
      {ready ? (
        <SubscribeForm hasUpi={config.upiId !== null} hasBank={config.bankDetails !== null} />
      ) : null}
    </section>
  );
}
