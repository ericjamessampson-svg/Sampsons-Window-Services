"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Black-on-white QR code drawn as crisp SVG (prints sharp at any size). */
export function QR({ value, size = 120 }: { value: string; size?: number }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    QRCode.toString(value, { type: "svg", margin: 1, errorCorrectionLevel: "M", color: { dark: "#000000", light: "#ffffff" } })
      .then(setSvg)
      .catch(() => setSvg(""));
  }, [value]);
  return <div className="qr" style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}
