import { createCanvas } from "@napi-rs/canvas";
const canvas = createCanvas(100, 100);
console.log(
  "Canvas methods:",
  Object.getOwnPropertyNames(Object.getPrototypeOf(canvas)),
);
