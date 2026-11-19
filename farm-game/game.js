"use strict";

const crops = {
  carrot: { name: "Carrot", icon: "🥕", cost: 3, days: 1, price: 7 },
  cabbage: { name: "Cabbage", icon: "🥬", cost: 5, days: 2, price: 13 },
  strawberry: { name: "Strawberry", icon: "🍓", cost: 8, days: 3, price: 22 }
};
const saveKey = "little-acre-v1";
const byId = (id) => document.getElementById(id);

function loadFarm() {
  try {
    const farm = JSON.parse(localStorage.getItem(saveKey));
    if (farm?.plots?.length === 12 && farm.basket && Number.isInteger(farm.day) && Number.isInteger(farm.coins)) {
      return farm;
    }
  } catch {
    // The game can still run when browser storage is unavailable.
  }
  return { day: 1, coins: 30, plots: Array(12).fill(null), basket: {} };
}

const farm = loadFarm();
let tool = "plant";
let selected = "carrot";
const tools = [...document.querySelectorAll("[data-tool]")];
const plotButtons = farm.plots.map((_, index) => {
  const button = document.createElement("button");
  button.className = "plot";
  button.addEventListener("click", () => tend(index));
  byId("plots").append(button);
  return button;
});

const seedButtons = Object.entries(crops).map(([id, crop]) => {
  const button = document.createElement("button");
  button.className = "seed";
  button.innerHTML = `<span class="icon" aria-hidden="true">${crop.icon}</span><span><strong>${crop.name}</strong><small>${crop.days} watered ${crop.days === 1 ? "day" : "days"} · sells for ${crop.price}</small></span><b>${crop.cost} 🪙</b>`;
  button.addEventListener("click", () => {
    selected = id;
    tool = "plant";
    render(`Select an empty plot to plant ${crop.name.toLowerCase()}.`);
  });
  byId("seeds").append(button);
  return [id, button];
});

function render(message) {
  byId("day").textContent = farm.day;
  byId("coins").textContent = farm.coins;
  const order = currentOrder();
  const held = farm.basket[order.id] || 0;
  byId("order").textContent = `${crops[order.id].name} · ${Math.min(held, order.count)}/${order.count} packed · ${order.reward} coins`;
  byId("deliver").disabled = held < order.count;
  byId("water-all").disabled = !farm.plots.some(plot => plot && !plot.wet && plot.age < crops[plot.crop].days);
  if (message) byId("status").textContent = message;
  for (const button of tools) button.setAttribute("aria-pressed", button.dataset.tool === tool);
  for (const [id, button] of seedButtons) button.setAttribute("aria-pressed", id === selected);
  plotButtons.forEach((button, index) => {
    const plot = farm.plots[index];
    const crop = plot && crops[plot.crop];
    const ripe = Boolean(plot && plot.age >= crop.days);
    button.classList.toggle("wet", Boolean(plot?.wet));
    button.classList.toggle("ripe", ripe);
    button.textContent = ripe ? crop.icon : plot ? (plot.age ? "🌿" : "🌱") : "";
    let detail = "empty";
    if (ripe) detail = `${crop.name}, ready to harvest`;
    else if (plot) detail = `${crop.name}, ${plot.age}/${crop.days} days grown, ${plot.wet ? "watered" : "dry"}`;
    button.setAttribute("aria-label", `Plot ${index + 1}, ${detail}`);
    button.title = detail;
  });
  const basket = Object.entries(farm.basket);
  byId("basket").textContent = basket.length
    ? basket.map(([id, count]) => `${crops[id].icon} ${crops[id].name} × ${count}`).join(" · ")
    : "Your basket is empty.";
  byId("sell").disabled = !basket.length;
  byId("sell").textContent = basket.length ? `Sell harvest · ${saleValue()} coins` : "Sell harvest";
}

function currentOrder() {
  const completed = farm.orders || 0;
  const ids = Object.keys(crops);
  const id = ids[completed % ids.length];
  const count = 2 + Math.min(4, Math.floor(completed / ids.length));
  return { id, count, reward: count * (crops[id].price + 4) };
}

byId("deliver").addEventListener("click", () => {
  const { id, count, reward } = currentOrder();
  if ((farm.basket[id] || 0) < count) return;
  farm.basket[id] -= count;
  if (!farm.basket[id]) delete farm.basket[id];
  farm.coins += reward;
  farm.orders = (farm.orders || 0) + 1;
  commit(`Order delivered for ${reward} coins. A new order is available.`);
});

byId("water-all").addEventListener("click", () => {
  for (const plot of farm.plots) {
    if (plot && plot.age < crops[plot.crop].days) plot.wet = true;
  }
  commit("All growing crops are watered for today.");
});

function saleValue() {
  return Object.entries(farm.basket).reduce((total, [id, count]) => total + crops[id].price * count, 0);
}

function commit(message) {
  try {
    localStorage.setItem(saveKey, JSON.stringify(farm));
  } catch {
    message += " Progress could not be saved on this device.";
  }
  render(message);
}

function tend(index) {
  const plot = farm.plots[index];
  if (tool === "plant") {
    const crop = crops[selected];
    if (plot) return render("This plot is occupied. Choose an empty plot.");
    if (farm.coins < crop.cost) return render("You need more coins to plant this seed.");
    farm.coins -= crop.cost;
    farm.plots[index] = { crop: selected, age: 0, wet: false };
    return commit(`Planted ${crop.name.toLowerCase()}. Water it before ending the day.`);
  }

  if (!plot) return render("Plant a seed here first.");
  const crop = crops[plot.crop];
  const ripe = plot.age >= crop.days;

  if (tool === "water") {
    if (ripe) return render("This crop is ready to harvest.");
    if (plot.wet) return render("This plot has already been watered today.");
    plot.wet = true;
    return commit(`Watered ${crop.name.toLowerCase()}. It will grow when the day ends.`);
  }

  if (!ripe) return render("This crop needs more time. Water it and end the day.");
  farm.basket[plot.crop] = (farm.basket[plot.crop] ?? 0) + 1;
  farm.plots[index] = null;
  commit(`Harvested ${crop.name.toLowerCase()}. Sell it from your basket when you’re ready.`);
}

const toolHints = {
  plant: "Select an empty plot to sow your chosen seed.",
  water: "Select a planted plot to water it.",
  harvest: "Select crops with a gold border to harvest them."
};

for (const button of tools) {
  button.addEventListener("click", () => {
    tool = button.dataset.tool;
    render(toolHints[tool]);
  });
}

byId("next").addEventListener("click", () => {
  let ready = 0;
  for (const plot of farm.plots) {
    if (!plot?.wet) continue;
    plot.age++;
    plot.wet = false;
    if (plot.age === crops[plot.crop].days) ready++;
  }
  farm.day++;
  commit(ready ? `${ready} ${ready === 1 ? "crop is" : "crops are"} ready to harvest!` : "A new day begins. Water your crops to keep them growing.");
});

byId("sell").addEventListener("click", () => {
  const value = saleValue();
  if (!value) return;
  farm.coins += value;
  farm.basket = {};
  commit(`Sold your harvest for ${value} coins.`);
});

function drawLandscape() {
  const context = byId("land").getContext("2d");
  function rect(color, x, y, width, height) {
    context.fillStyle = color;
    context.fillRect(x, y, width, height);
  }
  function shape(color, points) {
    context.fillStyle = color;
    context.beginPath();
    for (const [index, [x, y]] of points.entries()) {
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.closePath();
    context.fill();
  }

  rect("#bce0cf", 0, 0, 480, 320);
  rect("#fce6a2", 397, 23, 22, 22);
  rect("#fce6a2", 392, 28, 32, 12);
  for (const [x, y] of [[30, 30], [179, 19], [293, 37]]) {
    rect("#f4f3d5", x, y + 5, 46, 7);
    rect("#f4f3d5", x + 9, y, 21, 7);
  }
  shape("#92bb82", [[0, 66], [54, 49], [91, 62], [150, 41], [224, 67], [290, 49], [340, 66], [412, 52], [480, 67], [480, 114], [0, 114]]);
  shape("#719c64", [[0, 89], [69, 64], [133, 86], [222, 68], [302, 86], [373, 69], [480, 88], [480, 126], [0, 126]]);
  rect("#8ab25f", 0, 92, 480, 228);
  shape("#a6c873", [[0, 119], [107, 97], [360, 97], [480, 116], [480, 305], [0, 290]]);
  shape("#d9be7f", [[208, 320], [273, 320], [253, 248], [224, 248]]);
  rect("#78964f", 88, 114, 304, 152);
  rect("#ba955d", 93, 118, 294, 146);
  for (let i = 0; i < 150; i++) {
    const x = (i * 73 + 19) % 474;
    const y = 104 + (i * 53) % 211;
    if ((x > 88 && x < 392 && y < 267) || (x > 208 && x < 273 && y >= 248)) continue;
    rect(i % 7 === 0 ? "#f6df91" : "#789d53", x, y, 3, 2);
    rect("#91b760", x + 3, y - 3, 2, 3);
  }
  rect("#99774b", 14, 109, 452, 4);
  rect("#d7bc82", 14, 102, 452, 4);
  for (let x = 14; x < 468; x += 24) {
    rect("#91704a", x + 4, 97, 3, 22);
    rect("#ebcf92", x, 96, 4, 22);
  }

  // Barn and silo on the ridge, with a shaded roof and cross-braced doors.
  rect("#708854", 52, 95, 84, 7);
  rect("#b2bbb0", 104, 63, 23, 34);
  shape("#697b78", [[102,64],[107,55],[118,52],[127,58],[130,64]]);
  for (let y = 69; y < 95; y += 7) rect("#87978b", 104, y, 23, 2);
  rect("#aa5540", 46, 72, 59, 26);
  for (let x = 47; x < 105; x += 6) rect("#bd6549", x, 73, 2, 24);
  shape("#793f34", [[39,75],[49,55],[65,45],[91,47],[109,74]]);
  shape("#c8794e", [[49,56],[65,45],[91,47],[99,57]]);
  rect("#f1d49a", 56, 77, 22, 21);
  rect("#813f33", 58, 79, 18, 19);
  context.strokeStyle = "#efd499";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(59,80); context.lineTo(75,96);
  context.moveTo(75,80); context.lineTo(59,96);
  context.stroke();
  rect("#f1d49a", 86, 78, 11, 10);
  rect("#4f645a", 88, 80, 7, 6);
  // A lily pond with stepped banks and reflected light.
  for (const [color,x,y,w,h] of [["#74944e",13,273,68,24],["#b1b675",8,279,77,13],["#579c97",13,278,65,15],["#69b2a7",21,274,49,20],["#a6d7ba",26,280,18,2],["#a6d7ba",57,286,12,2],["#538654",33,287,8,3],["#edc3aa",36,285,3,2]]) rect(color,x,y,w,h);
  for (const [x, y] of [[25, 143], [52, 222], [8, 266], [414, 157], [435, 243], [404, 282]]) {
    rect("#7d9e54", x - 8, y + 14, 43, 7);
    rect("#7d593b", x + 11, y - 5, 7, 23);
    shape("#417345", [[x + 13, y - 35], [x + 27, y - 27], [x + 30, y - 12], [x + 23, y - 3], [x + 1, y - 3], [x - 5, y - 13], [x, y - 27]]);
    shape("#60914d", [[x + 10, y - 35], [x + 23, y - 29], [x + 22, y - 17], [x + 13, y - 12], [x, y - 16], [x, y - 27]]);
    rect("#83aa53", x + 5, y - 28, 7, 4);
  }
}

drawLandscape();
render();
