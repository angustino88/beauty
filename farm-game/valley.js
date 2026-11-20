"use strict";

// Map locations and actions share the game-day clock and the existing save slot.
const districts = {
  home: { name: "Homestead", x: 0, z: 0, icon: "⌂", hint: "Plant, tend and harvest your fields." },
  orchard: { name: "Cider Orchard", x: -19, z: -10, icon: "❧", hint: "Gather apples and press them into cider." },
  apiary: { name: "Clover Meadow", x: -13, z: 15, icon: "✿", hint: "Tend the hives and collect honey the next day." },
  quay: { name: "Willow Wharf", x: 17, z: 7, icon: "⚓", hint: "Land river fish and fill the merchant’s cargo orders." }
};
const valleyItems = { apples: "Apples", cider: "Cider", honey: "Honey", fish: "Fish" };
const cargoManifest = [
  { name:"River sampler", goods:{cider:1,honey:1,fish:1}, reward:24 },
  { name:"Grower’s hamper", goods:{carrot:2,cider:1,honey:1}, reward:38 },
  { name:"Market-day provisions", goods:{cabbage:1,fish:2,honey:1}, reward:42 }
];
function cargoOrder(v){ return cargoManifest[v.shipped % cargoManifest.length]; }
function stockFor(item,farm){ return Object.hasOwn(valleyItems,item) ? farm.valley : farm.basket; }
const valleyActions = {
  orchard: [
    { id: "pick", title: "Hái táo · Pick orchard apples", detail: "Gather 3 apples once per day.",
      available: (v,d) => v.picked !== d, run(v,d) { v.apples += 3; v.picked = d; return "Gathered 3 apples."; } },
    { id: "press", title: "Ép táo · Start the cider press", detail: "3 apples → 2 cider, ready tomorrow.",
      available: v => v.apples >= 3 && !v.batch, run(v,d) { v.apples -= 3; v.batch = d+1; return "The cider press will finish tomorrow."; } },
    { id: "bottle", title: "Đóng chai · Bottle the cider", detail: "Collect the finished batch from the press.",
      available: (v,d) => v.batch > 0 && v.batch <= d, run(v) { v.batch = 0; v.cider += 2; return "Bottled 2 cider."; } }
  ],
  apiary: [
    { id: "tend-hives", title: "Chăm tổ ong · Tend the hives", detail: "Prepare the frames for tomorrow’s honey.",
      available: v => !v.hives, run(v,d) { v.hives = d+1; return "The bees are working. Return tomorrow."; } },
    { id: "collect-honey", title: "Thu mật · Extract honey", detail: "Collect 2 jars from the filled frames.",
      available: (v,d) => v.hives > 0 && v.hives <= d, run(v) { v.hives = 0; v.honey += 2; return "Collected 2 jars of honey."; } }
  ],
  quay: [
    { id: "fish", title: "Kéo lưới cá · Haul the fishing nets", detail: "Land 2 river fish once per day.",
      available: (v,d) => v.fished !== d, run(v,d) { v.fish += 2; v.fished = d; return "Landed 2 fresh river fish."; } },
    { id: "ship", title: "Giao hàng · Ship a valley crate", detail: "Fill the merchant’s next order.",
      available: (v,d,farm) => Object.entries(cargoOrder(v).goods).every(([item,n])=>(stockFor(item,farm)[item] || 0)>=n),
      run(v,d,farm) {
        const order=cargoOrder(v);
        for(const [item,n] of Object.entries(order.goods)){
          const stock=stockFor(item,farm);stock[item]-=n;
          if(stock===farm.basket && !stock[item])delete stock[item];
        }
        v.shipped++;farm.coins+=order.reward;
        return order.name+" delivered for "+order.reward+" coins.";
      } }
  ]
};

function setupValley(farm, commit, render) {
  farm.valley = Object.assign({ apples:0, cider:0, honey:0, fish:0, picked:0, fished:0, batch:0, hives:0, shipped:0 }, farm.valley);
  let active = "home";
  const get = id => document.getElementById(id);
  const travelButtons = new Map();
  function visit(id) {
    active = id;
    valleyCamera.visit(id);
    render(districts[id].hint);
  }
  for (const [id, place] of Object.entries(districts)) {
    const button = document.createElement("button");
    const icon = document.createElement("span");
    icon.textContent = place.icon;
    icon.setAttribute("aria-hidden","true");
    button.append(icon, place.name);
    button.onclick = () => visit(id);
    travelButtons.set(id, button);
    get("destinations").append(button);
  }
  const sources={cider:"orchard",honey:"apiary",fish:"quay",carrot:"home",cabbage:"home"};
  const routes=new Map();
  for(const [item,source] of Object.entries(sources)){
    const button=document.createElement("button");
    button.onclick=()=>visit(source);
    get("supply-route").append(button);
    routes.set(item,button);
  }
  const actionButtons = new Map();
  for (const [district, actions] of Object.entries(valleyActions)) {
    for (const action of actions) {
      const button = document.createElement("button");
      button.className = "valley-action";
      button.id = action.id;
      const title = document.createElement("strong");
      const detail = document.createElement("small");
      title.textContent = action.title;
      detail.textContent = action.detail;
      button.append(title,detail);
      button.onclick = () => {
        if (district === active && action.available(farm.valley,farm.day,farm)) commit(action.run(farm.valley,farm.day,farm));
      };
      get("district-actions").append(button);
      actionButtons.set(action,button);
    }
  }
  document.addEventListener("valley-visit", event => visit(event.detail));
  document.addEventListener("valley-pan-end", event => {
    const [x,z] = event.detail;
    const nearest = Object.keys(districts).reduce((best,id) =>
      Math.hypot(x-districts[id].x,z-districts[id].z) < Math.hypot(x-districts[best].x,z-districts[best].z) ? id : best, active);
    if (nearest !== active) { active = nearest; valleyCamera.selectDistrict(nearest); render(districts[active].hint); }
  });
  return () => {
    const place = districts[active], v = farm.valley;
    get("place-name").textContent = place.name;
    get("district-hint").textContent = place.hint;
    get("farm-tools").hidden = active !== "home" && active !== "orchard";
    get("district-panel").hidden = active === "home";
    get("district-title").textContent = place.name;
    document.body.dataset.district = active;
    for (const [id,button] of travelButtons) button.setAttribute("aria-pressed",id===active);
    for (const [district,actions] of Object.entries(valleyActions)) {
      for(const action of actions){
        const button = actionButtons.get(action);
        button.hidden = active !== district;
        button.disabled = !action.available(v,farm.day,farm);
      }
    }
    const cargo=cargoOrder(v);
    const requirements=Object.entries(cargo.goods).map(([item,count])=>item+" "+Math.min(stockFor(item,farm)[item]||0,count)+"/"+count);
    get("journal-order").textContent=cargo.name+" · "+cargo.reward+" coins";
    for(const [item,button] of routes){
      const count=cargo.goods[item];
      button.hidden=!count;
      if(!count)continue;
      const held=stockFor(item,farm)[item] || 0;
      button.textContent=(held>=count?"✓ ":"")+item+" "+Math.min(count,held)+"/"+count+" · "+districts[sources[item]].name+" →";
    }
    get("ship").querySelector("small").textContent=cargo.name+" · "+requirements.join(" · ")+" · "+cargo.reward+" coins";
    const production = active === "orchard" && v.batch ? (v.batch <= farm.day ? "Cider ready to bottle." : "Cider pressing until day "+v.batch+".") :
      active === "apiary" && v.hives ? (v.hives <= farm.day ? "Honey ready to extract." : "Honey ready on day "+v.hives+".") :
      active === "quay" ? "Crates shipped: "+v.shipped+(v.fished===farm.day?" · Nets reset tomorrow.":"") :
      active === "orchard" && v.picked===farm.day ? "Apple trees replenish tomorrow." : "";
    get("production").textContent = production;
    get("stores").textContent = Object.entries(valleyItems).map(([key,name])=>name+" × "+v[key]).join(" · ");
  };
}
