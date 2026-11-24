import { useLocation, useParams } from "react-router-dom";
import { useT } from "@/i18n";
import { PageHeader } from "@/components/Breadcrumbs";
import { Card } from "@/components/ui/misc";
import { PLink } from "@/components/PLink";
import { EmptyState } from "@/components/EmptyState";
import { Reveal } from "@/components/Reveal";
import type { L10n } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Block = { h?: L10n; p?: L10n; list?: L10n[] };
const l = (en: string, hi: string): L10n => ({ en, hi });

const PAGES: Record<string, Block[]> = {
  about: [
    { p: l("civicXindo is a single national portal for the full life of a welfare scheme: ministries publish schemes, citizens check eligibility, apply and track applications, and officials verify, sanction and pay.", "civicXindo कल्याण योजना के पूरे जीवन-चक्र के लिए एक राष्ट्रीय पोर्टल है: मंत्रालय योजनाएँ प्रकाशित करते हैं, नागरिक पात्रता जाँचते, आवेदन करते और स्थिति देखते हैं, तथा अधिकारी सत्यापन, स्वीकृति और भुगतान करते हैं।") },
    { h: l("Our commitments", "हमारी प्रतिबद्धताएँ"), list: [l("Every step is recorded in an audit log.", "हर चरण ऑडिट लॉग में दर्ज होता है।"), l("Budgets are visible as they are spent.", "बजट खर्च होते ही दिखाई देता है।"), l("Likely fraud is flagged before money is released.", "संभावित धोखाधड़ी को भुगतान से पहले चिह्नित किया जाता है।"), l("The service works on low-cost phones and without a connection.", "सेवा कम कीमत वाले फ़ोन पर और बिना इंटरनेट के भी काम करती है।")] },
    { p: l("This is a demonstration prototype. It is not an official government website and does not process real applications.", "यह एक प्रदर्शन प्रोटोटाइप है। यह आधिकारिक सरकारी वेबसाइट नहीं है और वास्तविक आवेदन संसाधित नहीं करती।") },
  ],
  help: [
    { h: l("Getting started", "शुरुआत"), list: [l("Use Check your eligibility to find schemes that match you.", "अपने लिए योजनाएँ खोजने हेतु पात्रता जाँचें का उपयोग करें।"), l("Sign in with your mobile number and the OTP sent to you.", "अपने मोबाइल नंबर और भेजे गए ओटीपी से साइन इन करें।"), l("Upload documents once to your wallet and reuse them in any application.", "दस्तावेज़ एक बार वॉलेट में अपलोड करें और किसी भी आवेदन में पुनः उपयोग करें।")] },
    { h: l("Working offline", "ऑफ़लाइन कार्य"), p: l("Your drafts are saved on your device after every change. If you submit while offline, the application waits and is sent automatically when you are back online.", "हर बदलाव के बाद आपके ड्राफ़्ट डिवाइस पर सहेजे जाते हैं। ऑफ़लाइन जमा करने पर आवेदन प्रतीक्षा करता है और इंटरनेट लौटते ही अपने आप भेज दिया जाता है।") },
    { h: l("Need more help?", "और सहायता चाहिए?"), p: l("Call the helpline 1800-000-0000 (toll free, demo) between 8 am and 8 pm, or raise a grievance from Track application status.", "हेल्पलाइन 1800-000-0000 (टोल फ़्री, डेमो) पर सुबह 8 से रात 8 बजे तक कॉल करें, या आवेदन की स्थिति से शिकायत दर्ज करें।") },
  ],
  contact: [
    { h: l("Helpline", "हेल्पलाइन"), p: l("1800-000-0000 (toll free, placeholder) · Monday to Saturday, 8 am to 8 pm", "1800-000-0000 (टोल फ़्री, प्लेसहोल्डर) · सोमवार से शनिवार, सुबह 8 से रात 8") },
    { h: l("Email", "ईमेल"), p: l("helpdesk@civicxindo.example (placeholder)", "helpdesk@civicxindo.example (प्लेसहोल्डर)") },
    { h: l("Address", "पता"), p: l("Department of Social Welfare (demo), Block A, Sample Bhawan, New Delhi 110001", "समाज कल्याण विभाग (डेमो), ब्लॉक ए, नमूना भवन, नई दिल्ली 110001") },
  ],
  feedback: [
    { p: l("We welcome your suggestions to improve this service. In this demo, please use Grievances after signing in, or write to the placeholder email address on the Contact Us page.", "इस सेवा को बेहतर बनाने के लिए आपके सुझावों का स्वागत है। इस डेमो में कृपया साइन इन के बाद शिकायत अनुभाग का उपयोग करें, या संपर्क पृष्ठ पर दिए प्लेसहोल्डर ईमेल पर लिखें।") },
  ],
  terms: [
    { p: l("This portal is a demonstration. Content is provided for illustration only and must not be relied upon for any legal or financial decision.", "यह पोर्टल एक प्रदर्शन है। सामग्री केवल उदाहरण हेतु है और इस पर किसी कानूनी या वित्तीय निर्णय के लिए निर्भर नहीं रहना चाहिए।") },
    { p: l("By using the portal you agree not to misuse it, attempt unauthorised access, or upload unlawful material.", "पोर्टल का उपयोग करके आप सहमत हैं कि आप इसका दुरुपयोग, अनधिकृत पहुँच का प्रयास या गैरकानूनी सामग्री अपलोड नहीं करेंगे।") },
  ],
  privacy: [
    { p: l("In this demo, all data, including uploaded documents, stays on your device in the browser's storage. Nothing is sent to a server.", "इस डेमो में अपलोड किए गए दस्तावेज़ों सहित सारा डेटा आपके डिवाइस के ब्राउज़र स्टोरेज में रहता है। कुछ भी सर्वर पर नहीं भेजा जाता।") },
    { p: l("You can remove all offline data at any time from Profile and settings → Clear offline data, or Reset demo data.", "आप प्रोफ़ाइल और सेटिंग्स → ऑफ़लाइन डेटा हटाएँ या डेमो डेटा रीसेट से कभी भी सारा डेटा हटा सकते हैं।") },
  ],
  copyright: [
    { p: l("Material on this portal may be reproduced free of charge after taking proper permission. It must be reproduced accurately and not used in a misleading context, and the source must be acknowledged.", "उचित अनुमति लेकर इस पोर्टल की सामग्री निःशुल्क पुनः प्रस्तुत की जा सकती है। इसे सटीक रूप में, भ्रामक संदर्भ के बिना और स्रोत का उल्लेख करते हुए प्रस्तुत करना होगा।") },
  ],
  hyperlinking: [
    { p: l("We do not object to you linking directly to information hosted on this portal, and no prior permission is required. We do not permit our pages to be loaded into frames on your site.", "इस पोर्टल पर उपलब्ध जानकारी से सीधे लिंक करने पर हमें आपत्ति नहीं है और पूर्व अनुमति आवश्यक नहीं है। हमारे पृष्ठों को आपकी साइट के फ़्रेम में लोड करने की अनुमति नहीं है।") },
  ],
  accessibility: [
    { p: l("We aim to meet the Guidelines for Indian Government Websites and WCAG 2.1 level AA.", "हमारा लक्ष्य भारतीय सरकारी वेबसाइट दिशानिर्देशों और WCAG 2.1 स्तर AA को पूरा करना है।") },
    { list: [l("Text can be resized with A−, A and A+ in the top strip.", "शीर्ष पट्टी में A−, A और A+ से पाठ का आकार बदला जा सकता है।"), l("A high-contrast mode and a dark mode are available.", "उच्च कंट्रास्ट और डार्क मोड उपलब्ध हैं।"), l("Every screen can be used with a keyboard, and focus is always visible.", "हर स्क्रीन कीबोर्ड से उपयोग की जा सकती है और फ़ोकस हमेशा दिखाई देता है।"), l("Animations are reduced when your device requests reduced motion.", "डिवाइस द्वारा कम गति माँगने पर एनिमेशन कम हो जाते हैं।"), l("All content is available in English and Hindi.", "सारी सामग्री अंग्रेज़ी और हिंदी में उपलब्ध है।")] },
  ],
  disclaimer: [
    { p: l("civicXindo is a demo prototype and not an official government website. Scheme names, departments, people and data are fictional. It does not use the State Emblem of India or any official logo.", "civicXindo एक डेमो प्रोटोटाइप है, आधिकारिक सरकारी वेबसाइट नहीं। योजनाओं के नाम, विभाग, व्यक्ति और डेटा काल्पनिक हैं। इसमें भारत के राजचिह्न या किसी आधिकारिक लोगो का उपयोग नहीं किया गया है।") },
  ],
};

const SITEMAP: [string, string][] = [
  ["/", "nav.home"], ["/eligibility", "nav.eligibility"], ["/schemes", "nav.schemes"], ["/verify", "nav.verify"], ["/open-data", "nav.open_data"],
  ["/login", "header.sign_in"], ["/me", "dash.title"], ["/track", "nav.track"], ["/wallet", "nav.wallet"], ["/grievances", "nav.grievances"], ["/profile", "nav.profile"],
  ["/gov/login", "nav.officials"], ["/screen-reader-access", "strip.screen_reader"],
  ...(["about", "help", "contact", "feedback", "terms", "privacy", "copyright", "hyperlinking", "accessibility", "disclaimer"].map((p) => [`/info/${p}`, `page.${p}.title`]) as [string, string][]),
];

const READERS: [string, string, string][] = [
  ["NVDA", "Free", "https://www.nvaccess.org"],
  ["JAWS", "Commercial", "https://www.freedomscientific.com"],
  ["TalkBack", "Free (Android)", "https://support.google.com/accessibility/android"],
  ["VoiceOver", "Free (Apple devices)", "https://www.apple.com/accessibility/"],
  ["Orca", "Free (Linux)", "https://help.gnome.org/users/orca/stable/"],
];

export default function InfoPage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const { t, L, lang } = useT();
  const key = pathname === "/screen-reader-access" ? "screen-reader" : slug ?? "";
  const title = key === "screen-reader" ? t("strip.screen_reader") : t(`page.${key}.title`);

  let body: React.ReactNode;
  if (key === "sitemap") {
    body = (
      <ul className="grid gap-2 sm:grid-cols-2">
        {SITEMAP.map(([to, k]) => <li key={to}><PLink to={to} className="flex min-h-[44px] items-center rounded-input px-3 font-medium text-info hover:bg-ink/[0.04] hover:underline">{t(k)}</PLink></li>)}
      </ul>
    );
  } else if (key === "screen-reader") {
    body = (
      <div className="prose-gov">
        <p>{t("sr.intro")}</p>
        <div className="overflow-x-auto">
          <table className="mt-4 w-full text-left text-sm">
            <caption className="sr-only">{t("sr.caption")}</caption>
            <thead><tr className="border-b border-line/[0.12]"><th className="py-2 pr-4 text-ink">{t("sr.reader")}</th><th className="py-2 pr-4 text-ink">{t("sr.type")}</th><th className="py-2 text-ink">{t("sr.site")}</th></tr></thead>
            <tbody>{READERS.map(([n, ty, u]) => <tr key={n} className="border-b border-line/[0.06]"><td className="py-2 pr-4 font-semibold text-ink">{n}</td><td className="py-2 pr-4">{ty}</td><td className="py-2"><a href={u} target="_blank" rel="noopener noreferrer" className="text-info underline">{u.replace(/^https:\/\//, "")}<span className="sr-only"> ({t("sr.external")})</span></a></td></tr>)}</tbody>
          </table>
        </div>
        <h2>{t("sr.shortcuts")}</h2>
        <ul><li>{t("sr.k1")}</li><li>{t("sr.k2")}</li><li>{t("sr.k3")}</li></ul>
      </div>
    );
  } else if (PAGES[key]) {
    body = (
      <div className="prose-gov">
        {PAGES[key].map((b, i) => (
          <Reveal key={i} i={i}>
            {b.h && <h2>{L(b.h)}</h2>}
            {b.p && <p>{L(b.p)}</p>}
            {b.list && <ul>{b.list.map((x, j) => <li key={j}>{L(x)}</li>)}</ul>}
          </Reveal>
        ))}
      </div>
    );
  } else {
    return <EmptyState title={t("nf.title")} body={t("nf.body")} />;
  }

  return (
    <div className="mx-auto max-w-[820px]">
      <PageHeader title={title} crumbs={[{ label: title }]} />
      <Card className="p-6 md:p-8">{body}</Card>
      <p className="mt-4 text-xs text-muted">{t("footer.last_updated")}: {formatDate(__BUILD_DATE__, lang)}</p>
    </div>
  );
}
