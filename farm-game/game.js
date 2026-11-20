"use strict";

const crops = {
  carrot: { name: "Carrot", icon: "🥕", cost: 3, days: 1, price: 7 },
  cabbage: { name: "Cabbage", icon: "🥬", cost: 5, days: 2, price: 13 },
  strawberry: { name: "Strawberry", icon: "🍓", cost: 8, days: 3, price: 22 },
  wheat: { name: "Wheat", icon: "🌾", cost: 4, days: 2, price: 10 }
};
const vegetableOrders = ["carrot", "cabbage", "strawberry"];
const flourPayment = 28;
const rainyDay = day => day % 5 === 3 || day % 9 === 0;
const saveKey = "little-acre-v1";
const byId = (id) => document.getElementById(id);

function loadFarm() {
  try {
    const farm = JSON.parse(localStorage.getItem(saveKey));
    if ([12, 16, 20, 24, 28, 32].includes(farm?.plots?.length) && farm.basket && Number.isInteger(farm.day) && Number.isInteger(farm.coins)) {
      return farm;
    }
  } catch {
    // The game can still run when browser storage is unavailable.
  }
  return { day: 1, coins: 30, plots: Array(12).fill(null), basket: {} };
}

const farm = loadFarm();
const renderValley = setupValley(farm, commit, render);
const renderCampaign = setupCampaign(farm, commit);
let tool = "plant";
let selected = "carrot";
const tools = [...document.querySelectorAll("[data-tool]")];
function createPlot(index) {
  const button = document.createElement("button");
  button.className = "plot";
  button.addEventListener("click", () => tend(index));
  byId("plots").append(button);
  return button;
}
const plotButtons = farm.plots.map((_, index) => createPlot(index));

const seedPicker = byId("quick-seed");
function chooseSeed(id) {
  selected = id;
  tool = "plant";
  render(`Select an empty plot to plant ${crops[id].name.toLowerCase()}.`);
}
seedPicker.onchange = () => chooseSeed(seedPicker.value);
const seedButtons = Object.entries(crops).map(([id, crop]) => {
  seedPicker.add(new Option(crop.name + " · " + crop.cost + " 🪙", id));
  const button = document.createElement("button");
  button.className = "seed";
  button.innerHTML = `<span class="icon" aria-hidden="true">${crop.icon}</span><span><strong>${crop.name}</strong><small>${crop.days} watered ${crop.days === 1 ? "day" : "days"} · sells for ${crop.price}</small></span><b>${crop.cost} 🪙</b>`;
  button.addEventListener("click", () => chooseSeed(id));
  byId("seeds").append(button);
  return [id, button];
});

function render(message) {
  renderValley();
  showMarket();
  renderCampaign();
  renderEstate();
  const rain = rainyDay(farm.day);
  document.body.classList.toggle("rainy",rain);
  byId("weather").firstChild.textContent = rain ? "☂ Rain · Day " : "☀ Day ";
  byId("weather").title = (rain ? "Rain waters all growing crops today. " : "") + (rainyDay(farm.day+1) ? "Tomorrow: rain." : "Tomorrow: sunshine.");
  byId("day").textContent = farm.day;
  byId("coins").textContent = farm.coins;
  const order = currentOrder();
  const held = farm.basket[order.id] || 0;
  byId("order").textContent = `${crops[order.id].name} · ${Math.min(held, order.count)}/${order.count} packed · ${order.reward} coins`;
  byId("deliver").disabled = held < order.count;
  const mill = byId("mill");
  mill.hidden = document.body.dataset.district !== "home";
  mill.disabled = farm.milling ? farm.milling > farm.day : (farm.basket.wheat || 0) < 2;
  mill.textContent = farm.milling ? (farm.milling > farm.day ? "Flour ready on day " + farm.milling : "Deliver milled flour · " + flourPayment + " coins") : "Mill 2 wheat · " + flourPayment + " coins tomorrow";
  byId("water-all").disabled = !farm.plots.some(plot => plot && !plot.wet && plot.age < crops[plot.crop].days);
  if (message) byId("status").textContent = message;
  for (const button of tools) button.setAttribute("aria-pressed", button.dataset.tool === tool);
  seedPicker.value = selected;
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
  const id = vegetableOrders[completed % vegetableOrders.length];
  const count = 2 + Math.min(4, Math.floor(completed / vegetableOrders.length));
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

byId("mill").onclick = () => {
  if (document.body.dataset.district !== "home") return;
  if (farm.milling) {
    if (farm.day < farm.milling) return;
    farm.milling = 0;
    farm.coins += flourPayment;
    return commit("Delivered flour to the village baker for " + flourPayment + " coins.");
  }
  if ((farm.basket.wheat || 0) < 2) return;
  farm.basket.wheat -= 2;
  if (!farm.basket.wheat) delete farm.basket.wheat;
  farm.milling = farm.day + 1;
  commit("The millstones are turning. Deliver the flour tomorrow.");
};

byId("water-all").addEventListener("click", () => {
  for (const [index,plot] of farm.plots.entries()) {
    if (!plot || plot.wet || plot.age >= crops[plot.crop].days) continue;
    plot.wet = true;
    if (!plotButtons[index].hidden) plotFeedback(index,"💧","water");
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

function plotFeedback(index, label, action) {
  document.dispatchEvent(new CustomEvent("farm-action",{detail:action}));
  const plot = plotButtons[index];
  const marker = document.createElement("span");
  marker.className = "plot-feedback";
  marker.textContent = label;
  marker.style.left = (plot.offsetLeft + plot.offsetWidth / 2) + "px";
  marker.style.top = plot.offsetTop + "px";
  const field = document.querySelector(".field");
  field.append(marker);
  setTimeout(() => marker.remove(), 1100);
}

function tend(index) {
  const plot = farm.plots[index];
  if (tool === "plant") {
    const crop = crops[selected];
    if (plot) return render("This plot is occupied. Choose an empty plot.");
    if (farm.coins < crop.cost) return render("You need more coins to plant this seed.");
    farm.coins -= crop.cost;
    farm.plots[index] = { crop: selected, age: 0, wet: rainyDay(farm.day) };
    plotFeedback(index, "🌱 −" + crop.cost + " 🪙","plant");
    return commit(`Planted ${crop.name.toLowerCase()}. ${rainyDay(farm.day) ? "Today’s rain has watered it." : "Water it before midnight."}`);
  }

  if (!plot) return render("Plant a seed here first.");
  const crop = crops[plot.crop];
  const ripe = plot.age >= crop.days;

  if (tool === "water") {
    if (ripe) return render("This crop is ready to harvest.");
    if (plot.wet) return render("This plot has already been watered today.");
    plot.wet = true;
    plotFeedback(index, "💧","water");
    return commit(`Watered ${crop.name.toLowerCase()}. It will grow when the day ends.`);
  }

  if (!ripe) return render("This crop needs more time. Water it and check back tomorrow.");
  farm.basket[plot.crop] = (farm.basket[plot.crop] ?? 0) + 1;
  farm.plots[index] = null;
  plotFeedback(index, "+1 " + crop.icon,"harvest");
  commit(`Harvested ${crop.name.toLowerCase()}. Sell it from your basket when you’re ready.`);
}

const toolHints = {
  plant: "Select an empty plot to sow your chosen seed.",
  water: "Select a planted plot to water it.",
  harvest: "Harvest ripe crops marked by golden corners."
};

for (const button of tools) {
  button.addEventListener("click", () => {
    tool = button.dataset.tool;
    render(toolHints[tool]);
  });
}

function advanceDay() {
  let ready = 0;
  for (const plot of farm.plots) {
    if (!plot || plot.age >= crops[plot.crop].days || (!plot.wet && !farm.irrigated && !rainyDay(farm.day))) continue;
    plot.age++;
    plot.wet = false;
    if (plot.age === crops[plot.crop].days) ready++;
  }
  for (const animal of Object.values(farm.animals)) {
    if (animal.fed) animal.ready = true;
    animal.fed = false;
  }
  farm.day++;
  if (rainyDay(farm.day)) {
    for (const plot of farm.plots) if(plot && plot.age < crops[plot.crop].days) plot.wet = true;
  }
  return ready;
}

byId("sell").addEventListener("click", () => {
  const value = saleValue();
  if (!value) return;
  farm.coins += value;
  farm.basket = {};
  commit(`Sold your harvest for ${value} coins.`);
});

const species = {
  hen: { name: "Hen", icon: "🐔", cost: 12, product: "eggs", price: 4 },
  cow: { name: "Cow", icon: "🐄", cost: 32, product: "milk", price: 9 }
};
farm.animals ??= {};
function expansionCost() {
  return 20 + (farm.plots.length - 12) * 5;
}
byId("expand").onclick = () => {
  const cost = expansionCost();
  if (farm.plots.length >= 32 || farm.coins < cost) return;
  farm.coins -= cost;
  for (let i = 0; i < 4; i++) {
    plotButtons.push(createPlot(farm.plots.length));
    farm.plots.push(null);
  }
  commit(farm.plots.length > 20 ? "Four new plots await in Cider Orchard." : "Four new plots are ready at the homestead.");
};

byId("irrigate").onclick = () => {
  if (farm.irrigated || farm.coins < 75) return;
  farm.coins -= 75;
  farm.irrigated = true;
  commit("Sprinklers installed across your homestead and orchard plots.");
};

function renderEstate() {
  byId("irrigate").disabled = Boolean(farm.irrigated) || farm.coins < 75;
  byId("irrigate").textContent = farm.irrigated ? "Sprinklers installed" : "Install sprinklers · 75 coins";
  valleyCamera.paint(farm, crops, plotButtons);
  const size = farm.plots.length;
  byId("acreage").textContent = `${size} cultivated plots out of 32`;
  byId("expand").disabled = size >= 32 || farm.coins < expansionCost();
  byId("expand").textContent = size >= 32 ? "Fully expanded" : `Add 4 ${size >= 20 ? "orchard" : "home"} plots · ${expansionCost()} coins`;
  for (const [id, animal] of Object.entries(species)) {
    const state = farm.animals[id];
    const button = byId(id);
    button.disabled = state ? state.fed : farm.coins < animal.cost;
    let action = `Buy · ${animal.cost} coins`;
    if (state) action = state.ready ? `Sell ${animal.product} · ${animal.price} coins` : state.fed ? "Fed today" : "Feed from pasture";
    button.textContent = `${animal.name} · ${action}`;
  }
}
for (const [id, animal] of Object.entries(species)) {
  const button = document.createElement("button");
  button.id = id;
  button.className = "seed";
  byId("livestock").append(button);
  button.onclick = () => {
    const state = farm.animals[id];
    if (!state) {
      if (farm.coins < animal.cost) return;
      farm.coins -= animal.cost;
      farm.animals[id] = { fed: false, ready: false };
      return commit(`Your ${animal.name.toLowerCase()} has arrived. Feed it in the pasture.`);
    }
    if (state.ready) {
      farm.coins += animal.price;
      state.ready = false;
      return commit(`Sold ${animal.product} for ${animal.price} coins.`);
    }
    if (state.fed) return;
    state.fed = true;
    commit(`Fed your ${animal.name.toLowerCase()}. Its ${animal.product} will be ready tomorrow.`);
  };
}
let previousLight;
const markets = [
  {place:"orchard", item:"carrot", count:2, pay:21},
  {place:"apiary", item:"apples", count:3, pay:16},
  {place:"quay", item:"honey", count:1, pay:13},
  {place:"home", item:"fish", count:2, pay:18}
];
function showMarket() {
  const deal = markets[(farm.day-1) % markets.length];
  const here = document.body.dataset.district === deal.place;
  const stock = stockFor(deal.item,farm);
  const button = byId("market-visit");
  byId("market-route").textContent = districts[deal.place].name + " · " + deal.count + " " + deal.item + " → " + deal.pay + " coins";
  const sold = farm.marketDay === farm.day;
  button.textContent = sold ? "Delivered today" : here ? "Deliver · " + (stock[deal.item] || 0) + "/" + deal.count : "Visit " + districts[deal.place].name;
  button.disabled = sold || (here && (stock[deal.item] || 0) < deal.count);
  button.onclick = () => {
    if (!here) return document.dispatchEvent(new CustomEvent("valley-visit",{detail:deal.place}));
    if (farm.marketDay === farm.day || !(stock[deal.item] >= deal.count)) return;
    stock[deal.item] -= deal.count;
    if (!stock[deal.item] && stock === farm.basket) delete stock[deal.item];
    farm.marketDay = farm.day;
    farm.coins += deal.pay;
    commit("Market delivery complete · +" + deal.pay + " coins");
  };
}
function tick() {
  const now = new Date();
  // Compare local calendar dates independently of daylight-saving transitions.
  const today = Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()) / 86400000;
  if (!Number.isInteger(farm.calendarDay)) {
    farm.calendarDay = today;
    delete farm.nextDawn;
    commit("Your farm follows local time. A new day starts at midnight.");
  } else if (today > farm.calendarDay) {
    const days = today - farm.calendarDay;
    const simulated = Math.min(days,45);
    for (let i=0;i<simulated;i++) advanceDay();
    farm.day += days-simulated;
    farm.calendarDay = today;
    commit("A new day in the valley · Day " + farm.day);
  }
  const light = valleyCamera.localLight();
  if (previousLight !== light) {
    previousLight = light;
    document.body.dataset.light = light;
    render();
  }
  byId("clock").textContent = now.toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}) + " · Local time";

}
tick();
setInterval(tick,1000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)tick();});

render();

const managementButtons = document.querySelectorAll("[data-view]");
for (const button of managementButtons) {
  button.addEventListener("click", () => {
    for (const tab of managementButtons) tab.setAttribute("aria-pressed", tab === button);
    for (const panel of document.querySelectorAll("[data-panel]")) {
      panel.hidden = panel.dataset.panel !== button.dataset.view;
    }
  });
}
