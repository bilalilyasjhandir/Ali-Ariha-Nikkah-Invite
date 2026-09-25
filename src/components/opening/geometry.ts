// Must match the baked renders exactly. Envelope units: 1000 x 1800 (a tall
// "tea-length" envelope, back side up). Body layers are baked on a 1160x1960
// canvas with 80u of margin for shadows; flap faces on a 1160x960 canvas whose
// top row is the hinge; the seal on a 1200px canvas covering the 360u square
// centred on the seal at (500, 845) — low enough that only a small cap of wax
// lies on the flap tip, so the break never touches the monogram.

export const ENVELOPE_RATIO = 1800 / 1000;
export const CARD_RATIO = 1600 / 880;

export const PADDED_LAYER = { left: "-8%", top: "-4.4444%", width: "116%", height: "108.8889%" };
// the flap-shadow's hinge line sits 80px into the 1960px padded canvas
export const PADDED_HINGE_ORIGIN = "50% 4.0816%";
export const FLAP_LAYER = { left: "-8%", top: "0%", width: "116%", height: "53.3333%" };
// the opened flap lies above the hinge; its table shadow shares the flap-back frame
export const OPEN_FLAP_SHADOW_LAYER = { left: "-8%", top: "-53.3333%", width: "116%", height: "53.3333%" };

export const SEAL_IN_FRAME = { left: "32%", top: "36.9444%", width: "36%", height: "20%" };
export const SEAL_IN_FLAP = { left: "34.4828%", top: "69.2708%", width: "31.0345%", height: "37.5%" };

// the mouth, where the card can be seen before it rises: envelope top down to
// the bottom flap's apex
export const MOUTH_BOTTOM = 705 / 1800;

export const CARD_SLOT = { left: "6%", top: "7.2222%", width: "88%", height: "88.8889%" };
export const CARD_SLOT_TOP = 130 / 1800;
export const CARD_SLOT_HEIGHT = 1600 / 1800;
export const CARD_SLOT_CENTRE = CARD_SLOT_TOP + CARD_SLOT_HEIGHT / 2;

export const IMG = {
  backdrop: "/images/opening/backdrop.webp",
  interior: "/images/opening/env-interior.webp",
  pocket: "/images/opening/env-pocket.webp",
  flapShadow: "/images/opening/flap-shadow.webp",
  flapShadowSoft: "/images/opening/flap-shadow-soft.webp",
  flapFront: "/images/opening/flap-front.webp",
  flapBack: "/images/opening/flap-back.webp",
  flapOpenShadow: "/images/opening/flap-open-shadow.webp",
  seal: "/images/opening/seal.webp",
  sealFlap: "/images/opening/seal-flap.webp",
  sealBody: "/images/opening/seal-body.webp",
  sealLight: "/images/opening/seal-light.webp",
  sealHalo: "/images/opening/seal-halo.webp",
  card: "/images/opening/card.webp",
  cardMask: "/images/opening/card-mask.webp",
  flower: "/images/flower.webp",
  monogram: "/images/monogram.webp",
} as const;

export const SIZE = {
  padded: { w: 1160, h: 1960 },
  flap: { w: 1160, h: 960 },
  seal: { w: 1200, h: 1200 },
  card: { w: 1000, h: 1818 },
  flower: { w: 1273, h: 1303 },
  monogram: { w: 589, h: 1018 },
} as const;
