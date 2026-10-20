export const C = {
  G: "#15624c", Gd: "rgba(21,97,76,.12)",
  P: "#5a4998", Pd: "rgba(90,73,152,.12)",
  A: "#96803a", Ad: "rgba(150,128,58,.13)",
  B: "#2d68b0", Bd: "rgba(45,104,176,.12)",
  R: "#e06c75", Rd: "rgba(224,108,117,.12)",
  MU: "#7a7e9a", TX: "#121428",
}

export const tooltip = {
  backgroundColor: "#fff", borderColor: "rgba(18,20,40,.1)", borderWidth: 1,
  titleColor: C.TX, bodyColor: "#3c3f5e", padding: 10, cornerRadius: 6, displayColors: false,
}

const grid  = { color: "rgba(18,20,40,.05)" }
const ticks = { color: C.MU, font: { size: 10 } }
export const scales = { x: { grid, ticks }, y: { grid, ticks } }

export const legend = { display: true, labels: { color: C.MU, boxWidth: 8, font: { size: 10 }, padding: 16 } }

export const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 500 },
  plugins: { legend: { display: false }, tooltip },
  scales,
}
