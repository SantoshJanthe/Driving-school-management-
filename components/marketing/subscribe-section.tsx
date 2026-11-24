import { RazorpaySubscribeForm } from "@/components/marketing/razorpay-subscribe-form";
import { SubscribeForm } from "@/components/marketing/subscribe-form";
import { formatINR } from "@/lib/format";
import { upiLink } from "@/lib/subscription/config";
import { offeredMethods } from "@/lib/subscription/methods";

export async function SubscribeSection() {
  const offered = await offeredMethods();
  const { config } = offered;
  const ready = offered.razorpay || offered.manual;
  const link = upiLink(config);
  const amountLabel = formatINR(config.monthlyFee);

  let intro =
    "Pay the monthly fee, and this page opens the download for your laptop and Android phone once the payment is confirmed.";
  if (offered.razorpay && !offered.manual) {
    intro =
      "Pay the monthly fee on Razorpay. The download for your laptop and Android phone opens as soon as Razorpay confirms the payment.";
  } else if (offered.manual && !offered.razorpay) {
    intro =
      "Pay the monthly fee by UPI or bank transfer, then send the transaction ID. Once the payment is verified, this page opens the download for your laptop and Android phone.";
  }

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
        <p className="text-sm text-muted-foreground">{intro}</p>
        {ready ? (
          <div className="grid gap-3 rounded-2xl border border-black/10 bg-white/70 p-4 text-sm">
            <p className="text-3xl font-medium">
              {amountLabel}
              <span className="text-sm font-normal text-muted-foreground"> per school, per month</span>
            </p>
            {offered.manual && config.payeeName ? <p>Pay to {config.payeeName}</p> : null}
            {offered.manual && config.upiId ? (
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
            {offered.manual && config.bankDetails ? (
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
        <div className="grid content-start gap-8">
          {offered.razorpay ? (
            <div className="grid gap-3">
              <h3 className="text-lg font-medium">Pay online with Razorpay</h3>
              <RazorpaySubscribeForm amountLabel={amountLabel} />
            </div>
          ) : null}
          {offered.manual ? (
            <div className="grid gap-3">
              <h3 className="text-lg font-medium">
                {offered.razorpay ? "Or pay by UPI or bank transfer" : "Send your payment reference"}
              </h3>
              <SubscribeForm hasUpi={config.upiId !== null} hasBank={config.bankDetails !== null} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
