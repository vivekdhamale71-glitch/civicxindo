import type { L10n } from "@/lib/types";
import { DAY } from "@/lib/utils";

export interface NoticeItem {
  id: string;
  daysAgo: number;
  title: L10n;
  kind: "circular" | "notice" | "advisory";
}

export const NOTICES: NoticeItem[] = [
  { id: "c1", daysAgo: 1, kind: "circular", title: { en: "Last date for Vidya Setu scholarship applications extended for students awaiting results", hi: "परिणाम की प्रतीक्षा कर रहे छात्रों के लिए विद्या सेतु छात्रवृत्ति आवेदन की अंतिम तिथि बढ़ाई गई" } },
  { id: "c2", daysAgo: 3, kind: "notice", title: { en: "Krishi Sahara: third instalment for the current year will be released in the coming weeks", hi: "कृषि सहारा: चालू वर्ष की तीसरी किस्त आने वाले सप्ताहों में जारी की जाएगी" } },
  { id: "c3", daysAgo: 6, kind: "advisory", title: { en: "Beware of fraudulent calls asking for OTP. Officials never ask for your OTP or bank PIN.", hi: "ओटीपी माँगने वाली फ़र्ज़ी कॉल से सावधान रहें। अधिकारी कभी भी आपका ओटीपी या बैंक पिन नहीं माँगते।" } },
  { id: "c4", daysAgo: 12, kind: "circular", title: { en: "Revised income certificate format accepted for all central schemes", hi: "सभी केंद्रीय योजनाओं के लिए संशोधित आय प्रमाणपत्र प्रारूप स्वीकार्य" } },
  { id: "c5", daysAgo: 20, kind: "notice", title: { en: "Griha Aadhar: geo-tagged photographs now required for second stage release", hi: "गृह आधार: दूसरे चरण की राशि के लिए अब जियो-टैग फ़ोटो आवश्यक" } },
];

export const noticeDate = (n: NoticeItem) => new Date(Date.now() - n.daysAgo * DAY).toISOString();
