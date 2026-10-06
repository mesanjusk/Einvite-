export const COMMUNITY_CONTENT_GROUPS = [
  "General",
  "Hindu",
  "Jain",
  "Sikh",
  "Marathi",
  "Gujarati",
  "Punjabi",
  "Muslim",
  "Christian",
] as const;

export type CommunityContentGroup = (typeof COMMUNITY_CONTENT_GROUPS)[number];

export type ContentPreset = {
  id: string;
  community: CommunityContentGroup;
  label: string;
  text: string;
  suggestedSection: string;
  role: "heading" | "subheading" | "body" | "blessing";
};

export const COMMUNITY_CONTENT_PRESETS: ContentPreset[] = [
  {
    id: "general-welcome",
    community: "General",
    label: "Warm welcome",
    suggestedSection: "HERO",
    role: "body",
    text: "Together with our families, we invite you to celebrate this beautiful beginning with us.",
  },
  {
    id: "general-blessing",
    community: "General",
    label: "Blessing line",
    suggestedSection: "THANK_YOU",
    role: "blessing",
    text: "Your presence and blessings will make our celebration even more meaningful.",
  },
  {
    id: "hindu-ganesh",
    community: "Hindu",
    label: "Shree Ganesh invocation",
    suggestedSection: "ENVELOPE",
    role: "blessing",
    text: "॥ श्री गणेशाय नमः ॥",
  },
  {
    id: "hindu-mangal",
    community: "Hindu",
    label: "Mangal blessing",
    suggestedSection: "HERO",
    role: "body",
    text: "With the blessings of the Almighty and our elders, we request the pleasure of your presence at our auspicious wedding celebration.",
  },
  {
    id: "jain-mangal",
    community: "Jain",
    label: "Jain auspicious opening",
    suggestedSection: "ENVELOPE",
    role: "blessing",
    text: "॥ श्री जिनेन्द्राय नमः ॥",
  },
  {
    id: "jain-blessing",
    community: "Jain",
    label: "Jain family invitation",
    suggestedSection: "HERO",
    role: "body",
    text: "With the blessings of Arihant Parmatma and our elders, we warmly invite you to grace this auspicious celebration with your presence.",
  },
  {
    id: "sikh-waheguru",
    community: "Sikh",
    label: "Waheguru invocation",
    suggestedSection: "ENVELOPE",
    role: "blessing",
    text: "ੴ ਸਤਿਗੁਰ ਪ੍ਰਸਾਦਿ",
  },
  {
    id: "sikh-anand",
    community: "Sikh",
    label: "Anand Karaj invitation",
    suggestedSection: "HERO",
    role: "body",
    text: "With the blessings of Waheguru and our families, we invite you to join us for the Anand Karaj and share in our joy.",
  },
  {
    id: "marathi-mangal",
    community: "Marathi",
    label: "Marathi auspicious opening",
    suggestedSection: "ENVELOPE",
    role: "blessing",
    text: "॥ श्री गणेशाय नमः ॥ शुभमंगल सावधान",
  },
  {
    id: "marathi-invite",
    community: "Marathi",
    label: "Marathi family invitation",
    suggestedSection: "HERO",
    role: "body",
    text: "आपल्या शुभाशीर्वादाने आणि उपस्थितीने आमच्या मंगल सोहळ्याची शोभा वाढवावी, ही नम्र विनंती.",
  },
  {
    id: "gujarati-mangal",
    community: "Gujarati",
    label: "Gujarati auspicious opening",
    suggestedSection: "ENVELOPE",
    role: "blessing",
    text: "॥ શ્રી ગણેશાય નમઃ ॥",
  },
  {
    id: "gujarati-invite",
    community: "Gujarati",
    label: "Gujarati family invitation",
    suggestedSection: "HERO",
    role: "body",
    text: "આ શુભ પ્રસંગે આપની પાવન ઉપસ્થિતિ અને આશીર્વાદ અમારે માટે અમૂલ્ય રહેશે.",
  },
  {
    id: "punjabi-invite",
    community: "Punjabi",
    label: "Punjabi family invitation",
    suggestedSection: "HERO",
    role: "body",
    text: "ਸਾਡੇ ਪਰਿਵਾਰ ਦੀ ਖੁਸ਼ੀ ਵਿੱਚ ਸ਼ਾਮਿਲ ਹੋ ਕੇ ਆਪਣੀ ਹਾਜ਼ਰੀ ਅਤੇ ਅਸੀਸਾਂ ਨਾਲ ਸਮਾਗਮ ਨੂੰ ਖਾਸ ਬਣਾਓ।",
  },
  {
    id: "muslim-bismillah",
    community: "Muslim",
    label: "Bismillah opening",
    suggestedSection: "ENVELOPE",
    role: "blessing",
    text: "Bismillahir Rahmanir Rahim",
  },
  {
    id: "muslim-nikah",
    community: "Muslim",
    label: "Nikah invitation",
    suggestedSection: "HERO",
    role: "body",
    text: "With the blessings of Allah and our families, we request the honour of your presence at our Nikah celebration.",
  },
  {
    id: "christian-blessing",
    community: "Christian",
    label: "Christian blessing",
    suggestedSection: "ENVELOPE",
    role: "blessing",
    text: "What God has joined together, let no one separate.",
  },
  {
    id: "christian-wedding",
    community: "Christian",
    label: "Church wedding invitation",
    suggestedSection: "HERO",
    role: "body",
    text: "With gratitude to God and with the love of our families, we invite you to witness and celebrate our marriage.",
  },
];

export function presetsForCommunity(community: string) {
  return COMMUNITY_CONTENT_PRESETS.filter(
    (preset) => preset.community === community || preset.community === "General",
  );
}
