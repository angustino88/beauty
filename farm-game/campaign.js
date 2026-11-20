"use strict";

// Letters are receipts as well as chapters: only the first unread chapter can pay out.
const ferryLetters = [
  {
    district: "home", author: "Ada Holt", coins: 14, goods: { carrot: 2 },
    en: {
      title: "Two places at the table",
      letter: "I left two bowls on the mill steps before the river rose. This morning I found one in the willow roots. Ren and I can mend the landing, but neither of us has eaten since dawn. Bring two carrots for the pot. I’ll bring the second bowl.",
      objective: "Bring 2 carrots to the homestead.", handIn: "Set the table",
      after: "Ren turns the empty bowl over. On its base, in charcoal, he draws the lock where the ferry lantern went under."
    },
    vi: {
      title: "Hai chỗ bên bàn ăn",
      letter: "Trước khi nước lên, tôi để hai chiếc bát trên bậc cửa cối xay. Sáng nay tôi tìm được một chiếc mắc trong rễ liễu. Ren và tôi có thể sửa bến, nhưng từ tờ mờ sáng đến giờ cả hai chưa ăn gì. Mang cho tôi hai củ cà rốt để nấu súp nhé. Tôi sẽ lo chiếc bát thứ hai.",
      objective: "Mang 2 củ cà rốt về trang trại.", handIn: "Dọn bữa",
      after: "Ren úp chiếc bát đã cạn. Trên đáy bát, anh lấy than vẽ lại đoạn âu thuyền nơi chiếc đèn phà chìm xuống."
    }
  },
  {
    district: "quay", author: "Ren Vale", coins: 18, goods: {},
    en: {
      title: "The fourth notch",
      letter: "My father cut six notches into the lock post. At the fourth, the inspection shelf breaks the surface. That is where the brass lens caught when the lamp fell. Work the gates slowly. We cannot spare another piece of glass.",
      objective: "At Willow Wharf, bring the lock to mark 4 of 6.", handIn: "Lift the brass lens",
      after: "Inside the silted brass rim, a circle of yellow glass catches the sun. The old keeper’s lamp can shine again."
    },
    vi: {
      title: "Vạch nước thứ tư",
      letter: "Cha tôi từng khắc sáu vạch lên cọc âu thuyền. Khi nước ngang vạch thứ tư, bậc đá kiểm tra vừa nhô lên. Lúc chiếc đèn rơi, thấu kính viền đồng mắc lại ở đó. Hãy chỉnh cửa nước thật chậm. Ta chỉ còn một tấm kính này.",
      objective: "Đưa nước ở bến Willow về vạch 4 trên 6.", handIn: "Vớt thấu kính",
      after: "Giữa chiếc viền đồng lấm bùn, một khoanh kính vàng bắt nắng. Đèn của người gác bến vẫn còn có thể sáng."
    }
  },
  {
    district: "apiary", author: "Lin Mercer", coins: 20, goods: { honey: 1, cider: 1 },
    en: {
      title: "A seal against the rain",
      letter: "The lens fits, but water would find the seam. Bring a jar from the hives with the wax cap intact. A bottle of cider will persuade the tinsmith to lend us her bench. While the seal cools, I’ll show you how we used to put up apples for a crossing.",
      objective: "Bring 1 honey and 1 cider to Clover Meadow.", handIn: "Seal the lantern",
      after: "Lin presses the last curl of wax flat. She slips her apple preserve recipe into your coat for the ferry galley."
    },
    vi: {
      title: "Đường sáp chắn mưa",
      letter: "Thấu kính đã vừa, nhưng nước vẫn có thể rỉ qua mép. Hãy lấy một hũ mật còn nguyên nắp sáp. Thêm một chai cider thì bà thợ thiếc sẽ cho mượn bàn làm việc. Trong lúc chờ sáp nguội, tôi sẽ chỉ bạn cách nấu táo mang lên phà.",
      objective: "Mang 1 hũ mật và 1 chai cider tới đồng Clover.", handIn: "Gắn kín đèn hiệu",
      after: "Lin miết phẳng vòng sáp cuối cùng rồi đút công thức mứt táo vào túi áo bạn để dành cho bếp phà."
    }
  },
  {
    district: "quay", author: "Ren Vale", coins: 30, goods: { preserves: 1, fish: 2 },
    en: {
      title: "The first sailing",
      letter: "The lantern is on its post. All along the bank, people have set their clocks by a boat that hasn’t come. Put preserves and two fish aboard for the crew. Then mark the timetable yourself. Shall we carry our neighbours upriver, or take the growers’ freight to market?",
      objective: "Pack 1 apple preserve and 2 fish at Willow Wharf, then choose a route.", handIn: "Light the beacon",
      after: "For the first time since the flood, someone on the far bank waves back."
    },
    vi: {
      title: "Chuyến phà đầu tiên",
      letter: "Đèn hiệu đã lên cọc. Suốt dọc bờ, người ta vẫn chỉnh đồng hồ theo một chuyến phà mãi chưa về. Hãy mang mứt táo và hai con cá xuống cho thủy thủ. Còn giờ chạy, mời bạn tự ghi. Ta sẽ chở bà con lên thượng nguồn, hay chở nông sản ra chợ?",
      objective: "Mang 1 lọ mứt táo và 2 cá đến bến Willow rồi chọn tuyến phà.", handIn: "Thắp đèn hiệu",
      after: "Lần đầu tiên kể từ trận lũ, có người bên kia sông vẫy tay đáp lại."
    }
  }
];

const ferryRoutes = {
  passenger: { en: "Passenger ferry", vi: "Phà chở khách", goods: { preserves: 1 }, fare: 16,
    ending: { en: "A child with a school satchel boards first. By noon the two banks feel like one village again.", vi: "Một em nhỏ đeo cặp là người đầu tiên bước lên phà. Đến trưa, hai bờ sông lại như chung một làng." } },
  freight: { en: "Market barge", vi: "Phà chở hàng", goods: { cider: 1, fish: 1 }, fare: 23,
    ending: { en: "The first crates carry the names of every grower. Downriver, merchants clear a space for the valley again.", vi: "Mỗi thùng hàng đầu tiên đều ghi tên một người làm vườn. Ở hạ lưu, các thương lái lại dọn chỗ cho nông sản của thung lũng." } }
};

function setupCampaign(farm, commit) {
  farm.story ??= { signed: [], level: 2, preserves: 0, pot: 0, line: null, returnDay: 0, voyages: 0 };
  const story = farm.story;
  const dialog = document.getElementById("letters");
  const get = id => document.getElementById(id);
  const stage = () => story.signed.length;
  const district = () => document.body.dataset.district;
  let page = stage();
  let lang = story.language || (navigator.language.toLowerCase().startsWith("vi") ? "vi" : "en");
  get("letter-language").value = lang;
  const t = (en,vi) => lang === "vi" ? vi : en;
  const names = { carrot:{en:"carrot",vi:"cà rốt"}, honey:{en:"honey",vi:"mật ong"}, cider:{en:"cider",vi:"cider"}, preserves:{en:"preserves",vi:"mứt táo"}, fish:{en:"fish",vi:"cá"} };
  function inventory(item) {
    if (item === "preserves") return story;
    return Object.hasOwn(valleyItems,item) ? farm.valley : farm.basket;
  }
  function have(goods) { return Object.entries(goods).every(([item,count]) => (inventory(item)[item] || 0) >= count); }
  function spend(goods) {
    for (const [item,count] of Object.entries(goods)) {
      const stock = inventory(item);
      stock[item] -= count;
      if (stock === farm.basket && stock[item] === 0) delete stock[item];
    }
  }
  function supplies(goods,showHeld=false) {
    return Object.entries(goods).map(([item,n]) => {
      const quantity = showHeld ? Math.min(inventory(item)[item] || 0,n)+"/"+n : n;
      return quantity+" "+names[item][lang];
    }).join(" · ");
  }
  function visit(id) { document.dispatchEvent(new CustomEvent("valley-visit",{detail:id})); }
  function openJournal() {
    page = stage();
    show();
    if(!dialog.open) dialog.showModal();
  }
  get("read-letter").onclick = openJournal;
  get("pocket-journal").onclick = openJournal;
  get("close-letter").onclick = () => dialog.close();
  get("letter-language").onchange = () => {
    lang=get("letter-language").value;
    story.language=lang;
    commit(t("Letter language saved.","Đã lưu ngôn ngữ thư."));
  };
  get("archive").onchange = () => {page=Number(get("archive").value);show();};
  get("letter-travel").onclick = () => {
    const target = ferryLetters[page]?.district || "quay";
    dialog.close();
    visit(target);
  };
  for(const [id,delta] of [["inlet",3],["sluice",-2]]) {
    get(id).onclick = () => {
      const next = story.level+delta;
      if(stage()!==1 || district()!=="quay" || next<0 || next>6) return;
      story.level=next;
      commit(t("Lock level ","Mực nước ")+next+"/6.");
    };
  }
  get("sign-letter").onclick = () => {
    const letter = ferryLetters[page];
    if(page!==stage() || !letter || district()!==letter.district || !have(letter.goods)) return;
    if(page===1 && story.level!==4) return;
    if(page===3) {
      const choice=dialog.querySelector('input[name="ferry-line"]:checked')?.value;
      if(!Object.hasOwn(ferryRoutes,choice)) return;
      story.line=choice;
    }
    spend(letter.goods);
    farm.coins+=letter.coins;
    story.signed.push(farm.day);
    // Keep the signed letter open so the player can read its outcome.
    commit(letter[lang].after);
  };
  get("next-letter").onclick=()=>{page=stage();show();};
  const ingredients={apples:2,honey:1};
  get("cook").onclick=()=>{
    if(stage()<3 || !["home","orchard"].includes(district()))return;
    if(story.pot){
      if(farm.day<story.pot)return;
      story.pot=0;story.preserves+=3;
      return commit(t("Packed 3 jars of apple preserves.","Đã đóng 3 lọ mứt táo."));
    }
    if(!have(ingredients))return;
    spend(ingredients);story.pot=farm.day+1;
    commit(t("Apple preserves are simmering. Pack them tomorrow.","Mứt táo đang sên. Ngày mai có thể đóng lọ."));
  };
  get("sail").onclick=()=>{
    const route=ferryRoutes[story.line];
    if(stage()!==4 || district()!=="quay" || !route)return;
    if(story.returnDay){
      if(farm.day<story.returnDay)return;
      story.returnDay=0;story.voyages++;farm.coins+=route.fare;
      return commit(t("Ferry returned. Collected ","Phà đã về bến. Thu được ")+route.fare+t(" coins."," xu."));
    }
    if(!have(route.goods))return;
    spend(route.goods);story.returnDay=farm.day+1;
    commit(t("The ferry has left the wharf. It returns tomorrow.","Phà đã rời bến và sẽ quay về ngày mai."));
  };

  function show() {
    const current=stage(), letter=ferryLetters[page], done=page<current;
    const here=district()===(letter?.district || "quay");
    const route=ferryRoutes[story.line];
    get("letter-count").textContent=current<4 ? t("Letter ","Lá thư ")+(current+1)+"/4" : t("The ferry is running","Phà đã hoạt động");
    get("story-title").textContent=ferryLetters[current]?.[lang].title || route?.[lang];
    get("story-task").textContent=ferryLetters[current]?.[lang].objective || t("Run scheduled crossings from Willow Wharf.","Điều hành các chuyến phà tại bến Willow.");
    get("read-letter").textContent=current===4?t("Open logbook","Mở nhật ký"):t("Read the letter","Đọc thư");
    get("pocket-journal").textContent=t("Field journal","Nhật ký");
    dialog.lang=lang;
    const archive=get("archive");
    const count=Math.min(current+1,5);
    if(archive.length!==count || archive.dataset.lang!==lang){
      archive.replaceChildren();
      for(let i=0;i<count;i++) archive.add(new Option(ferryLetters[i] ? (i+1)+". "+ferryLetters[i][lang].title : t("Epilogue","Đoạn kết"),String(i)));
      archive.dataset.lang=lang;
    }
    archive.value=String(page);
    get("letter-from").textContent=letter ? t("From ","Thư của ")+letter.author : t("Willow Wharf","Bến Willow");
    get("letter-heading").textContent=letter?.[lang].title || route?.[lang];
    get("letter-body").textContent=letter?.[lang].letter || route?.ending[lang];
    get("letter-goal").textContent=done ? letter[lang].after : letter?.[lang].objective || t("Visit the wharf to send the ferry out again.","Về bến để khởi hành chuyến tiếp theo.");
    get("letter-stock").textContent=done ? t("Signed on day ","Ký ngày ")+story.signed[page] :
      letter ? [supplies(letter.goods,true),"+"+letter.coins+t(" coins"," xu")].filter(Boolean).join("  ·  ") : "";
    const lock=get("lock-gates");
    lock.hidden=page!==1 || done;
    get("lock-level").textContent=story.level+"/6";
    get("lock-meter").value=story.level;
    get("inlet").disabled=!here || story.level+3>6;
    get("sluice").disabled=!here || story.level<2;
    get("lock-caption").textContent=t("Lock gauge · target 4","Thước đo · đích 4");
    get("inlet").textContent=t("Open inlet +3","Mở cửa vào +3");
    get("sluice").textContent=t("Drain −2","Xả nước −2");
    get("route-choice").hidden=page!==3 || done;
    get("passenger-label").textContent=ferryRoutes.passenger[lang];
    get("freight-label").textContent=ferryRoutes.freight[lang];
    get("letter-travel").hidden=here || done;
    get("letter-travel").textContent=t("Travel to ","Đến ")+districts[letter?.district || "quay"].name;
    get("sign-letter").hidden=!letter || done;
    get("sign-letter").textContent=letter?.[lang].handIn || "";
    get("sign-letter").disabled=!letter || !here || !have(letter.goods) || (page===1 && story.level!==4);
    get("next-letter").hidden=!done;
    get("next-letter").textContent=t("Continue reading","Đọc tiếp");
    get("galley").hidden=current<3 || !["home","orchard"].includes(district());
    get("galley-name").textContent=t("Farm kitchen","Bếp trang trại");
    get("galley-stock").textContent=t("2 apples + 1 honey → 3 preserves · In store: ","2 táo + 1 mật ong → 3 lọ mứt · Trong kho: ")+story.preserves;
    get("cook").textContent=story.pot ? (story.pot<=farm.day?t("Pack preserves","Đóng lọ mứt"):t("Simmering until day ","Mứt chín vào ngày ")+story.pot) : t("Cook apple preserves","Nấu mứt táo");
    get("cook").disabled=story.pot ? story.pot>farm.day : !have(ingredients);
    get("crossings").hidden=current!==4 || district()!=="quay";
    if(route){
      get("crossing-name").textContent=route[lang];
      get("crossing-stock").textContent=supplies(route.goods,true)+" · "+route.fare+t(" coins · Crossings: "," xu · Số chuyến: ")+story.voyages;
      get("sail").textContent=story.returnDay ? (farm.day>=story.returnDay?t("Collect fares","Thu tiền chuyến phà"):t("Returns on day ","Phà về ngày ")+story.returnDay) : t("Dispatch ferry","Cho phà xuất bến");
      get("sail").disabled=story.returnDay ? farm.day<story.returnDay : !have(route.goods);
    }
  }
  return show;
}
