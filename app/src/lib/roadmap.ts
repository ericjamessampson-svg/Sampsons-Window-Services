import type { Profile } from "./types";

export interface Link {
  label: string;
  url: string;
}

export type StepKind = "name" | "register" | "prices" | "equipment" | "booking" | "google" | "website" | "design" | "print" | "script" | "start";

export interface Step {
  id: StepKind;
  title: string;
  /** One line: why this matters. */
  why: string;
  /** Small tasks inside the step. */
  tasks: string[];
  links?: Link[];
  /** Shown in a "check with a pro" box. */
  caution?: string;
}

const isTexas = (p: Profile | null) => !!p && /\b(tx|texas)\b/i.test(p.homeBase);

export function roadmapSteps(profile: Profile | null): Step[] {
  const tx = isTexas(profile);
  return [
    {
      id: "name",
      title: "Pick a name and a phone number",
      why: "Your name and number go on every hanger. Pick them first.",
      tasks: [
        "Pick a name that says what you do and where (for example \"Kyle Window Co.\")",
        "Search your state's business name lookup to see if it's taken",
        "Get a phone number that can call and text. Google Voice is free in the US, or add a second line from your phone carrier.",
        "Record a short voicemail greeting with your business name",
      ],
      links: [
        { label: "Google Voice", url: "https://voice.google.com" },
        tx
          ? { label: "Texas business name search (SOSDirect)", url: "https://www.sos.state.tx.us/corp/sosda/index.shtml" }
          : { label: "SBA: Choose your business name", url: "https://www.sba.gov/business-guide/launch-your-business/choose-your-business-name" },
      ],
    },
    {
      id: "register",
      title: "Register the business and get insurance",
      why: "Customers and HOAs trust a real, insured business. It also protects you if something breaks.",
      tasks: [
        "Learn the basics: a sole proprietor using a different name usually files an \"assumed name\" (DBA). An LLC is a separate business you register with the state.",
        tx
          ? "In Texas, assumed names for sole proprietors are filed with the county clerk (Kyle is in Hays County). LLCs are filed with the Texas Secretary of State."
          : "Look up your state's Secretary of State website and your county clerk's office.",
        "Get a free EIN (tax ID) from the IRS if you need one. Never pay a website for it.",
        "Get general liability insurance. Ask 2 or 3 agents for quotes.",
        "Ask each city you'll work in whether door-to-door needs a permit, and what hours are allowed.",
        tx
          ? "Ask the Texas Comptroller whether your service needs a sales tax permit."
          : "Ask your state's tax office whether your service needs a sales tax permit.",
      ],
      links: [
        { label: "SBA: Register your business", url: "https://www.sba.gov/business-guide/launch-your-business/register-your-business" },
        { label: "IRS: Get an EIN (free)", url: "https://www.irs.gov/businesses/small-businesses-self-employed/get-an-employer-identification-number" },
        ...(tx
          ? [
              { label: "Texas Secretary of State: business filings", url: "https://www.sos.state.tx.us/corp/index.shtml" },
              { label: "Texas Comptroller: sales tax", url: "https://comptroller.texas.gov/taxes/sales/" },
            ]
          : []),
      ],
      caution:
        "This is general information, not legal or tax advice. Rules differ by state and city. Before you choose an LLC or decide about taxes, check with a local accountant or attorney.",
    },
    {
      id: "prices",
      title: "Set your prices",
      why: "Your hanger needs one clear price. Decide it now.",
      tasks: [
        "Call or text 3 local companies for a price on a home like the ones you'll target",
        "Write your prices below. Set a minimum job price so small jobs are worth the drive.",
        "Pick your one hanger offer, for example \"Outside windows from $X\"",
      ],
    },
    {
      id: "equipment",
      title: "Get your starter equipment",
      why: "You only need enough to do the first jobs well. Upgrade later.",
      tasks: [],
    },
    {
      id: "booking",
      title: "Set up booking and payment",
      why: "When someone calls from a hanger, you need to book them on the spot.",
      tasks: [
        "Use one calendar for every job (your phone's calendar is fine to start)",
        "Save a text you send to confirm each booking: day, time window, price",
        "Pick how you take payment: card app, cash, check, or a bank app. Card apps charge a fee on each payment, so check their current rates.",
        "Save a thank-you text that asks for a Google review",
      ],
    },
    {
      id: "google",
      title: "Set up your Google Business Profile",
      why: "People who get your hanger will search your name. A Google profile with reviews makes you look real.",
      tasks: [
        "Go to business.google.com and sign in with a Google account",
        "Add your business name and pick the category that fits best",
        "Choose \"I deliver goods and services to my customers\", and hide your home address",
        "Add your service areas (the cities and neighborhoods you'll work)",
        "Add your phone number and your website, if you have one",
        "Verify the business (Google usually asks for a short video)",
        "Add your services, prices if you want, and photos of your work and your setup",
        "After every job, text a link asking for a review",
      ],
      links: [{ label: "Google Business Profile", url: "https://business.google.com" }],
    },
    {
      id: "website",
      title: "Make a simple website",
      why: "One page is enough. Your hanger's QR code can point to it.",
      tasks: [
        "Buy a domain with your business name. These usually cost about $10 to $20 a year. Check prices first.",
        "Build one page: what you do, the areas you serve, your price or \"from $X\", your phone with \"call or text\", and a quote form",
        "Add 3 photos and any reviews you have",
        "Make sure it looks good on a phone",
        "Add the website link to your Google Business Profile",
      ],
    },
    {
      id: "design",
      title: "Design your door hanger",
      why: "A good hanger does one thing: gets them to call or text you.",
      tasks: [
        "One clear offer with a price",
        "A big phone number with \"call or text\"",
        "A reason to act now (for example \"Book by Friday\" or \"Only 5 spots this month\")",
        "A QR code that goes to your booking page or website",
        "Proof: a review, or \"We're working on your street this week\"",
        "Your business name and the areas you serve",
      ],
    },
    {
      id: "print",
      title: "Print your hangers",
      why: "Month 1 needs about 10,000 hangers. Month 2 repeats the same homes.",
      tasks: [
        "Get quotes from 2 or 3 printers (online or local) for 5,000 and 10,000 hangers",
        "Enter the best quote below to see what your budget covers",
        "Order a small proof first if you can, to check the phone number and QR code",
      ],
    },
    {
      id: "script",
      title: "Learn the door-knocking script",
      why: "Knocking on homes that got your hanger the day before turns them into quotes.",
      tasks: ["Read the script out loud 5 times", "Practice the 5 answers below", "Do 10 practice knocks with a friend or in the mirror"],
    },
    {
      id: "start",
      title: "Start the 10K Homes plan",
      why: "500 hangers every morning, then knock yesterday's streets from 4 to 7pm.",
      tasks: ["Check your Day 1 date", "Look at your 20-day route", "Load the hangers the night before Day 1"],
    },
  ];
}
