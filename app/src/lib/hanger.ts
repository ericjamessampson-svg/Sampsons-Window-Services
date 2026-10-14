import { getTrade } from "./trades";
import type { AppData, HangerDesign } from "./types";

export const HANGER_COLORS = [
  { name: "Forest green", value: "#1f4f4a" },
  { name: "Navy", value: "#12355b" },
  { name: "Sky blue", value: "#0a6db3" },
  { name: "Brick red", value: "#9b2c2c" },
  { name: "Charcoal", value: "#222222" },
];

/** Starting wording, modeled on a real Kyle, TX window cleaning hanger. */
export function defaultHanger(data: AppData): HangerDesign {
  const trade = getTrade(data.profile?.trade);
  const verb = data.profile?.trade === "other" ? data.profile.tradeOther || "home service" : trade.verb;
  return {
    headline: `Your local ${verb} specialists`,
    tagline: trade.id === "window" ? "See the difference clean windows make!" : `${trade.label} done right, by a local you can trust.`,
    services: (data.profile?.services ?? trade.services).slice(0, 4).join(" · "),
    price: "",
    urgency: "$25 off if you call this week!",
    reasons: [
      "Locally owned & operated",
      "Guaranteed quality work",
      "Friendly, reliable & professional",
      "We're working on your street this week",
    ].join("\n"),
    proof: "We're working on your street this week",
    social: "",
    color: HANGER_COLORS[0].value,
    logo: null,
    showQR: true,
  };
}
