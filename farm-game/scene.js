// Orthographic 3D scene. The same camera projects meshes and accessible plot hit areas.
const valleyCamera = (() => {
  let canvas = document.getElementById("world");
  let gpu,ctx;
  try {
    gpu=createFarmRenderer(canvas,()=>refresh());
  } catch(error) {
    console.warn("Little Acre is using the canvas renderer.",error);
    const replacement=canvas.cloneNode(false);
    canvas.replaceWith(replacement);
    canvas=replacement;
  }
  if(!gpu)ctx=canvas.getContext("2d");
  let triangles;
  let terrain, bakedScene, sceneKey;
  let selectedDistrict="home";
  let centerX=0,centerZ=0,zoom=1,overview=false;
  const field=canvas.parentElement;
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  let angle = 0.43;
  let redraw;
  const pitch = 0.69;
  let faces, scale, width, height;
  function project([x,y,z]) {
    x-=centerX; z-=centerZ;
    const forward = Math.sin(angle)*x + Math.cos(angle)*z;
    return [width/2 + scale*(Math.cos(angle)*x-Math.sin(angle)*z),
      height*0.58 + scale*(forward*Math.sin(pitch)-y*Math.cos(pitch)),
      forward*Math.cos(pitch)+y*Math.sin(pitch)];
  }
  // Architectural parts reuse a material even when their pigments differ.
  const palette=new Map();
  function register(surface,colors){for(const color of colors)palette.set(color,surface);}
  register(SURFACE.grass,[0xa7c96d,0x9fc575]);
  register(SURFACE.water,[0x52bcb1]);
  register(SURFACE.sand,[0xd7c58d,0xe3bf82,0xe8c991,0xe2c48a,0xe4c48b]);
  register(SURFACE.soil,[0x995e3a,0x634733,0xb67e4d,0x76573d,0xa68a51]);
  register(SURFACE.timber,[0x86492f,0x4b8b83,0xb77c4e,0x935e3c,0xd5a66a,0x866345,0x92653e,0xf2d9a5,0xe3c08b,0x97623b,0xa86f42,0xd59f5c,0xb47e4b,0x8d6645,0x7b624a,0x567768,0xb57d45,0x896447,0xa77a49,0xc89554,0xb49268,0x886c50,0xc8a77b,0x856746,0xb58b5f,0x88684e,0x826448]);
  register(SURFACE.stone,[0xffda9b,0xe9d5af,0xa07158,0xb9aa8f,0xb5a38b,0xb7afa0,0xf4d4a3,0xe2bd70,0xa1beb2]);
  register(SURFACE.roof,[0xc35e3d,0xdc7747,0xd46944,0xe18350,0x914b39,0x577e79,0x466f78,0xb97052,0x51828b]);
  register(SURFACE.glass,[0x537b85,0x6e9a9f]);
  register(SURFACE.lamp,[0xffbc50]);
  register(SURFACE.coat,[0xf0dfbd,0x5a493d,0xddc6a6,0x6b5344]);
  register(SURFACE.feathers,[0xe5bc82,0xf1cb90,0xb67d49,0x93653f,0x745641]);
  const quadUV=[[0,0],[1,0],[1,1],[0,1]];
  let motionGroup=0;
  function unit(x,y,z){
    const length=Math.hypot(x,y,z)||1;
    return [x/length,y/length,z/length];
  }
  function polygonNormal(points){
    // Newell's method also handles rings that converge to a single vertex at a pole.
    let x=0,y=0,z=0;
    for(let i=0;i<points.length;i++){
      const u=points[i],v=points[(i+1)%points.length];
      x+=(u[1]-v[1])*(u[2]+v[2]);y+=(u[2]-v[2])*(u[0]+v[0]);z+=(u[0]-v[0])*(u[1]+v[1]);
    }
    return unit(x,y,z);
  }
  function face(points, color, light, material=palette.get(color)||SURFACE.plain, normals=null) {
    if(gpu){
      const rgb=[16,8,0].map(shift => ((color>>shift)&255)/255 * (.87+.13*light));
      const normal=normals?null:polygonNormal(points);
      for(let i=1;i<points.length-1;i++){
        for(const j of [0,i,i+1])triangles.push(...points[j],...rgb,...(normals?normals[j]:normal),material,...quadUV[j%4],motionGroup);
      }
      return;
    }
    const rgb = [16,8,0].map(shift => Math.min(255, Math.round(((color >> shift)&255)*light)));
    const ground = points.every(p=>p[1] <= .085);
    faces.push({points, ground, color:'rgb('+rgb.join(',')+')'});
  }
  function box(x,y,z,w,h,d,c) {
    const a=x-w/2,b=x+w/2,e=z-d/2,f=z+d/2,t=y+h;
    face([[a,t,e],[b,t,e],[b,t,f],[a,t,f]],c,1.1);
    const corners=[[a,e],[b,e],[b,f],[a,f]];
    corners.forEach(([u,v],i)=>{
      const [r,s]=corners[(i+1)%4];
      face([[u,y,v],[r,y,s],[r,t,s],[u,t,v]],c,[.69,.84,.94,.76][i]);
    });
  }
  function oval(x,y,z,rx,ry,rz,c) {
    const ring=(i,j)=>{
      const a=(i/5-.5)*Math.PI,b=j*Math.PI/5;
      return [x+rx*Math.cos(a)*Math.cos(b),y+ry*Math.sin(a),z+rz*Math.cos(a)*Math.sin(b)];
    };
    for(let i=0;i<5;i++) for(let j=0;j<10;j++){
      const points=[ring(i,j),ring(i+1,j),ring(i+1,j+1),ring(i,j+1)];
      const normals=gpu?points.map(p=>unit((p[0]-x)/(rx*rx),(p[1]-y)/(ry*ry),(p[2]-z)/(rz*rz))):null;
      face(points,c,.78+.24*i/4+.13*Math.cos(j*Math.PI/5+2),undefined,normals);
    }
  }
  // Both renderers use this deterministic model, including its planting beds.
  function beam(start,end,r,color,topRadius=r,sides=8) {
    const [x,y,z]=start;
    const [dx,dy,dz]=end.map((v,i)=>v-start[i]);
    const length=Math.hypot(dx,dy,dz);
    const horizontal=Math.hypot(dx,dz);
    const a=horizontal?[dz/horizontal,0,-dx/horizontal]:[1,0,0];
    const b=[-dy*a[2]/length,(dx*a[2]-dz*a[0])/length,dy*a[0]/length];
    function ring(center,radius){
      return Array.from({length:sides},(_,i)=>center.map((v,k)=>v+radius*(a[k]*Math.cos(i*2*Math.PI/sides)+b[k]*Math.sin(i*2*Math.PI/sides))));
    }
    const lower=ring([x,y,z],r),upper=ring(end,topRadius);
    for(let i=0;i<sides;i++){
      const j=(i+1)%sides;
      face([lower[i],lower[j],upper[j],upper[i]],color,.92+.08*Math.sin(i));
    }
    face(upper,color,1.05);
  }
  function cottage(){
    const cream=0xffda9b,wood=0x86492f,trim=0xffecc0;
    box(-4,.08,-4,3.45,2.55,2.66,cream);
    for(const z of [-5.34,-2.66]){
      face([[-5.73,2.62,z],[-2.27,2.62,z],[-4,4,z]],cream,1);
      box(-4,2.48,z,3.5,.15,.12,wood);
      box(-4,2.58,z,.13,1.18,.14,wood);
      for(const x of [-5.59,-2.4]) box(x,.1,z,.13,2.43,.13,wood);
    }
    for(const sign of [-1,1]){
      for(let row=0;row<6;row++) for(let col=0;col<9;col++){
        const x=-4+sign*row*.329,z=-5.63+col*.365,y=4.14-row*.275;
        face([[x,y,z],[x+sign*.37,y-.31,z],[x+sign*.37,y-.31,z+.355],[x,y,z+.355]],
          [0xc35e3d,0xdc7747,0xd46944,0xe18350][(row*7+col*13)%4],sign===1?1:.93);
      }
      beam([-4,4.15,-2.23],[-4+sign*2,2.48,-2.23],.086,wood);
    }
    beam([-4,4.14,-5.7],[-4,4.14,-2.25],.1,0xf39861);
    box(-4.38,.1,-2.59,.75,1.58,.17,wood);
    box(-4.38,.16,-2.48,.57,1.36,.07,0x4b8b83);
    for(const x of [-5.13,-3.12]){
      box(x,1.02,-2.58,.65,.78,.15,trim);
      box(x,1.12,-2.47,.48,.56,.07,0x537b85);
      box(x,1.11,-2.41,.06,.59,.04,trim);
      box(x,1.37,-2.41,.49,.05,.04,trim);
      box(x,.97,-2.40,.82,.13,.3,wood);
    }
    box(-5.02,3.07,-4.68,.43,1.18,.51,0xa07158);
    box(-5.02,4.18,-4.68,.55,.16,.62,cream);
    for(let j=0;j<3;j++) box(-4.38,.01,-2.31+j*.22,.98,.26-j*.075,.3,0xb9aa8f);
  }
  function boatHull(x,z,outline,height,paint){
    const deck=outline.map(([dx,dz])=>[x+dx,height,z+dz]);
    const waterline=outline.map(([dx,dz])=>[x+.73*dx,.015,z+.86*dz]);
    face(deck,0xc8a77b,1);
    deck.forEach((point,i)=>{
      const j=(i+1)%deck.length;
      face([point,deck[j],waterline[j],waterline[i]],paint,.94);
      beam(point,deck[j],.034,0xb49268,.034,5);
    });
  }
  function estate(){
    let seed=145;
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
    const waterX=z=>8.1+1.1*Math.sin(z*.4);
    const riverWidth=z=>1.02+3.6*Math.exp(-((z-10)**2)/22);
    for(let z=-55;z<55;z++){
      const a=waterX(z),b=waterX(z+1),wa=riverWidth(z),wb=riverWidth(z+1);
      for(const [l,r,l2,r2,color] of [
        [-70,a-wa-.21,-70,b-wb-.21,0xa7c96d],[a-wa-.21,a-wa,b-wb-.21,b-wb,0xd7c58d],
        [a-wa,a+wa,b-wb,b+wb,0x52bcb1],[a+wa,a+wa+.23,b+wb,b+wb+.23,0xd7c58d],
        [a+wa+.23,70,b+wb+.23,70,0x9fc575]]){
        face([[l,-.04,z],[r,-.04,z],[r2,-.04,z+1],[l2,-.04,z+1]],color,1);
      }
      if(!gpu)box(a+random()-.5,.005,z+.4,.48,.012,.035,0xb1e1cb);
    }
    // Walkways link the beds, cottage steps, bridge and pasture.
    let laneLayer=0;
    lane(1.98,-6.8,1.98,7.17,1.16);
    lane(-5.75,-1.65,2.47,-1.62,.88);
    lane(1.98,3.5,7.53,3.5,.94);
    for(let i=0;i<12;i++)box(7.45+i*.26,.09,3.5,.25,.14,1.18,0xb77c4e);
    for(const z of [2.86,4.14]){
      for(const x of [7.49,8.9,10.26]) box(x,.02,z,.13,.75,.13,0x935e3c);
      beam([7.49,.71,z],[10.26,.71,z],.065,0xd5a66a);
    }
    cottage();
    resident(-5.51,-2.22,0x647568,0xa88558);
    resident(-13.15,13.63,0xc79356,0xd0b583);
    resident(14.65,7.45,0x485b67,0x6c6352);
    // Stone mill, canvas sails and a little timber grain door.
    const mx=.05,mz=-5.35;
    beam([mx,0,mz],[mx,3.1,mz],.91,0xe9d5af,.65,12);
    beam([mx,3.04,mz],[mx,3.96,mz],.93,0x51828b,.04,12);
    box(mx,.02,mz+.85,.49,.94,.14,0x866345);
    const hub=[mx,2.7,mz+.89];
    motionGroup=1;
    for(let i=0;i<4;i++){
      const t=.47+i*Math.PI/2;
      const point=(r,w)=>[hub[0]+r*Math.cos(t)-w*Math.sin(t),hub[1]+r*Math.sin(t)+w*Math.cos(t),hub[2]];
      beam(hub,point(1.77,0),.046,0x92653e);
      face([point(.63,.03),point(1.71,.03),point(1.71,.34),point(.63,.2)],0xffedc6,1);
      for(const r of [.7,1.1,1.5])beam(point(r,0),point(r,.25),.02,0xaa7c4f);
    }
    motionGroup=0;
    oval(mx,2.7,mz+.97,.13,.13,.13,0xbc884c);
    function fence(x,z,x2,z2){
      const count=Math.ceil(Math.hypot(x2-x,z2-z)/1.15);
      for(let i=0;i<=count;i++){
        const t=i/count,px=x+(x2-x)*t,pz=z+(z2-z)*t;
        box(px,0,pz,.15,.86,.15,0xf2d9a5);
        beam([px,.86,pz],[px,.99,pz],.105,0xffe7b5,.02,4);
      }
      for(const y of [.33,.66])beam([x,y,z],[x2,y,z2],.068,0xe3c08b,.068,4);
    }
    fence(2.65,-4.25,6.3,-4.25);fence(2.65,-4.25,2.65,-2.84);
    fence(6.3,-4.25,6.3,-2.73);
    for(const [x,z] of [[4.6,-3.65],[5.36,-3.61],[5,-3.64]]){
      const y=x===5?.55:.02;
      box(x,y,z,.72,.5,.67,0xeac25b);
      for(const d of [-.21,.21])box(x+d,y-.005,z,.047,.52,.68,0xb48d47);
    }
    // Roadside produce stall, with scalloped cloth, slatted crates and fruit.
    for(const x of [3.4,5.55]) for(const z of [.68,1.96]) box(x,0,z,.11,2.05,.11,0x97623b);
    box(4.48,.52,1.33,2.42,.18,1.29,0xa86f42);
    for(let i=0;i<8;i++){
      const x=3.1+i*.34,c=i%2?0xffe9bc:0x478f83;
      face([[x,2.15,.43],[x+.34,2.15,.43],[x+.34,2.47,1.18],[x,2.47,1.18]],c,1);
      face([[x,2.47,1.18],[x+.34,2.47,1.18],[x+.34,1.98,2.2],[x,1.98,2.2]],c,1);
      face([[x,1.98,2.2],[x+.34,1.98,2.2],[x+.31,1.81,2.2],[x+.06,1.8,2.2]],c,.94);
    }
    for(let crate=0;crate<3;crate++){
      const x=3.67+crate*.77;
      for(const d of [-.28,.28])box(x,.69,1.55+d,.72,.2,.08,0xd59f5c);
      for(const d of [-.34,.34])box(x+d,.69,1.55,.07,.22,.59,0xb47e4b);
      for(let i=0;i<6;i++)oval(x-.23+i%3*.22,.87,1.43+Math.floor(i/3)*.22,.14,.15,.13,[0xc75133,0xe9af38,0x82a344][crate]);
    }
    for(let i=0;i<26;i++){
      const z=random()*15-7,x=waterX(z)+(i%2?1:-1)*(riverWidth(z)+random()*.16);
      oval(x,.06,z,.1+random()*.18,.1+random()*.14,.16+random()*.14,i%2?0xada990:0x999d86);
      if(i%3===0) for(let j=0;j<3;j++)beam([x+j*.08,.02,z],[x+j*.11,.43+j*.1,z+.06],.023,0x829349,.014,4);
    }
    function tree(x,z,size,fruit){
      const bark=0x8d6645;
      const base=[x,0,z], crown=[x+.08*size,1.55*size,z-.06*size];
      beam(base,crown,.18*size,bark,.105*size,9);
      for(let i=0;i<9;i++){
        const a=i*2.399+x*.23, reach=(i<6?.94:.52)*size;
        const px=crown[0]+Math.cos(a)*reach,pz=crown[2]+Math.sin(a)*reach;
        const py=(1.87+.18*(i%3)+(i>=6?.66:0))*size;
        const fork=[x+Math.cos(a)*.28*size,1.52*size,z+Math.sin(a)*.28*size];
        beam([x,1.03*size,z],fork,.076*size,bark,.054*size);
        beam(fork,[px,py,pz],.054*size,bark,.018*size,6);
        if(gpu){
          // Interlocking crossed leaf sprays give the crown an irregular silhouette at every angle.
          for(let j=0;j<4;j++){
            const t=a+j*1.85, w=(.58+.06*(j%2))*size, h=(.79+.09*j)*size;
            const ox=px+.23*size*Math.cos(t),oz=pz+.23*size*Math.sin(t);
            const dx=Math.cos(t)*w,dz=Math.sin(t)*w;
            const lean=.30*size;
            const topX=ox-Math.sin(t)*lean,topZ=oz+Math.cos(t)*lean;
            face([[ox-dx,py-.2*size,oz-dz],[ox+dx,py-.2*size,oz+dz],
              [topX+dx,py+h,topZ+dz],[topX-dx,py+h,topZ-dz]],0x8eaa57,1,SURFACE.leaf);
          }
        }else{
          oval(px,py+.25*size,pz,.63*size,.67*size,.57*size,[0x698f46,0x77984e,0x88a55b][i%3]);
        }
        if(fruit && i%2===0){
          oval(px+.16*size,py-.09*size,pz+.18*size,.10*size,.112*size,.1*size,0xb34930);
          oval(px+.32*size,py+.02*size,pz,.08*size,.09*size,.08*size,0xd2793b);
        }
      }
    }
    for(const [x,z,size] of [[-7,-4,1.15],[-6.95,-.6,.87],[-9,3,.9],[5,-6,1],[7,-7,1.15],[-2,-8,1.15],[-6,-8,1.3],[10,-4,1.22],[12,1,1.04],[-9,-7,1.1],[-9,7,.85],[12,7,.85]])tree(x,z,size,true);
    // The valley road follows the same coordinates as the travel destinations.
    function lane(x,z,endX,endZ,w=1.08) {
      const length=Math.hypot(endX-x,endZ-z);
      const dx=(endZ-z)/length*w/2,dz=(x-endX)/length*w/2;
      const divisions=Math.max(1,Math.ceil(length/.9));
      const y=.012+.003*laneLayer++;
      let prev;
      for(let i=0;i<=divisions;i++){
        const t=i/divisions;
        const drift=.13*Math.sin(t*Math.PI)*Math.sin(t*7+x);
        const midX=x+(endX-x)*t+dx*drift,midZ=z+(endZ-z)*t+dz*drift;
        const width=1+.045*Math.sin(i*2.72+endZ);
        const left=[midX+dx*width,y,midZ+dz*width],right=[midX-dx*width,y,midZ-dz*width];
        if(prev)face([prev.left,left,right,prev.right],0xe4c48b,1);
        prev={left,right};
      }
    }
    lane(1.98,-6.55,-6.7,-10.6);
    lane(-6.7,-10.6,-19,-9);
    lane(1.98,6.85,-4,11.7);
    lane(-4,11.7,-13,14.8);
    lane(10.3,3.5,16.5,7);
    lane(16.5,7,20.8,10.7);
    function lodge(x,z,w,d,h,wall,roof){
      box(x,0,z,w,h,d,wall);
      const front=z+d/2,back=z-d/2,peak=h+w*.29;
      for(const side of [-1,1]){
        const edge=x+side*(w*.5+.24);
        face([[x,peak,back-.25],[x,peak,front+.25],[edge,h,front+.25],[edge,h,back-.25]],roof,side===1?1:.9);
        box(x+side*(w/2-.1),0,front,.12,h,.14,0x7b624a);
      }
      for(const end of [front,back]) face([[x-w/2,h,end],[x,peak,end],[x+w/2,h,end]],wall,.95);
      box(x,.04,front+.025,.7,h*.8,.1,0x567768);
      for(const sign of [-1,1]){
        box(x+sign*w*.31,.86,front+.035,.63,.67,.12,0xf6ddab);
        box(x+sign*w*.31,.94,front+.105,.46,.5,.04,0x6e9a9f);
      }
    }
    // Orchard with terraced apple rows, a stone press and stacked cider barrels.
    lodge(-18,-13.8,4.1,2.8,2.15,0xf4d4a3,0x914b39);
    for(const row of [-15.1,-12.2,-9.4])for(const col of [-24,-21.3])tree(col,row,.93,true);
    for(let i=0;i<5;i++){
      const x=-16.4+i%3*.71,z=-11.5+Math.floor(i/3)*.8;
      beam([x,0,z],[x,.87,z],.34,0xb57d45,.34,10);
      for(const h of [.17,.65])beam([x,h,z],[x,h+.065,z],.352,0x68726a,.352,10);
    }
    box(-17,.02,-9.9,1.8,.2,1.22,0xb5a38b);
    for(const x of [-17.68,-16.32])box(x,.21,-9.9,.2,1.64,.25,0x896447);
    box(-17,1.72,-9.9,1.68,.22,.3,0xa77a49);
    beam([-17,.29,-9.9],[-17,.94,-9.9],.46,0xc89554);
    beam([-17,.86,-9.9],[-17,2.15,-9.9],.1,0x59615a);
    fence(-25,-16.7,-20,-16.7);
    // Apiary: tiered boxes and strips of pollinator flowers around the beekeeper's shed.
    lodge(-16.7,12.1,2.7,1.9,1.65,0xe2bd70,0x577e79);
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){
      const x=-15+col*1.7,z=15.7+row*1.7;
      box(x,.06,z,.92,.19,.82,0x76694f);
      for(let k=0;k<3;k++)box(x,.25+k*.22,z,.85,.2,.79,[0xf3c351,0xffdc75,0xf2cc73][k]);
      box(x,.97,z,1.01,.14,.94,0x6b9385);
      box(x,.29,z+.405,.46,.065,.034,0x5a5036);
    }
    for(let i=0;i<64;i++){
      const x=-18+random()*7,z=18.6+random()*1.7;
      beam([x,0,z],[x,.37,z],.025,0x718948,.018,4);
      oval(x,.37,z,.12,.08,.12,i%3===0?0xd2a4cd:0xf9da73);
    }
    // A covered fish market, a working jetty and a rigged cargo boat.
    lodge(17,4.3,4.2,2.6,2.15,0xa1beb2,0x466f78);
    for(let i=0;i<22;i++)box(10.6+i*.23,.19,7.3,.22,.18,1.52,0xb49268);
    for(const x of [10.6,12.3,14,15.45])for(const z of [6.57,8.03])
      beam([x,-.15,z],[x,.62,z],.09,0x886c50);
    motionGroup=2;
    const bx=9.45,bz=9.7;
    boatHull(bx,bz,[[-.64,-1.35],[.64,-1.35],[.77,.65],[0,1.77],[-.77,.65]],.54,0x386d79);
    beam([bx,.5,bz],[bx,3.35,bz],.065,0x856746);
    face([[bx,3.22,bz],[bx,.98,bz],[bx+1.04,1.24,bz+.3]],0xfaf0cf,1);
    face([[bx-.1,2.87,bz],[bx-.12,1.2,bz],[bx-.88,1.12,bz-.27]],0xd7845b,.94);
    motionGroup=0;
    for(const [x,z] of [[15,5.7],[15.8,5.7],[15.35,6.45],[18.6,6.1]]){
      box(x,0,z,.7,.58,.68,0xb58b5f);
      for(const h of [.09,.47]) box(x,h,z,.73,.08,.71,0x88684e);
    }
    // Contour fields and shelterbelts make the lanes readable in the valley overview.
    for(const [fx,fz,rows,tone] of [[-16,1.7,8,0xe4bd54],[-22,3.4,6,0x9cba59],[17,-7.8,7,0xc6ab58],[-4,-14,7,0xa99fbc]]){
      const length=4.75;
      box(fx,.003,fz,length+.2,.055,rows*.42+.15,0xa68a51);
      for(let row=0;row<rows;row++){
        const zz=fz+(row-(rows-1)/2)*.42;
        const tall=.23+random()*.12;
        // Raised leaf ridges have a softly uneven silhouette and distinct sunlit faces.
        for(let clump=0;clump<6;clump++){
          const xx=fx-length/2+clump*length/6,mid=zz+.03*random();
          const crest=tall+random()*.16,end=xx+length/6;
          face([[xx,.06,zz-.18],[end,.06,zz-.18],[end,crest,mid],[xx,crest+.05,mid]],tone,.9);
          face([[xx,crest+.05,mid],[end,crest,mid],[end,.06,zz+.18],[xx,.06,zz+.18]],tone,1.05);
        }
      }
      fence(fx-length*.5-.4,fz-rows*.23,fx-length*.5-.4,fz+rows*.23);
    }
    // Low hedgerows link the cultivated fields without obscuring interactive buildings.
    for(const [x,z,dx,dz,count] of [[-9,-9.5,-1.02,0,7],[-20,.1,-1,0,6],[-7.6,10.7,-.92,.42,7],[14,-7.1,0,-1.02,6]]){
      for(let i=0;i<count;i++){
        const px=x+dx*i,pz=z+dz*i;
        oval(px,.46,pz,.72,.48,.58,i%2?0x7d9e52:0x89a45a);
        if(i%3===0)beam([px,.15,pz],[px,1.02,pz],.1,0x957451);
      }
    }
    // Painted bee boxes and a shallow stone well mark the trailhead.
    const wx=-10.6,wz=12.4;
    for(let i=0;i<12;i++){
      const theta=i*Math.PI/6;
      box(wx+.55*Math.cos(theta),.02,wz+.55*Math.sin(theta),.31,.5,.33,0xb7afa0);
    }
    for(const dx of [-.51,.51])beam([wx+dx,.4,wz],[wx+dx,1.7,wz],.07,0x8b6843);
    beam([wx-.73,1.58,wz],[wx+.73,1.58,wz],.075,0x80674e);
    for(const sign of [-1,1])face([[wx-.82,2,wz],[wx+.82,2,wz],[wx+.82,1.54,wz+sign*.66],[wx-.82,1.54,wz+sign*.66]],0xb97052,.97);

    // The slopes rise outside the working valley and fall back down at the watercourse.
    function ridgeHeight(x,z){
      const rim=clamp(Math.max((Math.abs(x)-25)/12,(Math.abs(z)-20)/11),0,1);
      const bank=clamp((Math.abs(x-waterX(z))-4)/6,0,1);
      return rim*rim*bank*(2.8+1.55*Math.sin(x*.16+z*.08)+.97*Math.cos(z*.3));
    }
    for(let x=-46;x<46;x+=2)for(let z=-36;z<36;z+=2){
      const tile=[[x,z],[x+2,z],[x+2,z+2],[x,z+2]].map(([px,pz])=>[px,ridgeHeight(px,pz)-.045,pz]);
      if(tile.some(point=>point[1]>.025))face(tile,0x9fc575,1);
    }
    // Dark spruces and pale outcrops form the valley's distant ridgeline.
    for(let i=0;i<160;i++){
      const x=random()*84-42,z=random()*64-32;
      if(Math.abs(x)<28 && Math.abs(z)<22)continue;
      if(Math.abs(x-waterX(z))<3)continue;
      const h=1.6+random()*2.3;
      const baseY=ridgeHeight(x,z);
      beam([x,baseY,z],[x,baseY+h*.36,z],.16,0x826448);
      for(let j=0;j<3;j++)beam([x,baseY+h*(.18+.19*j),z],[x,baseY+h*(.72+.17*j),z],h*(.27-.045*j),[0x547a52,0x628a57,0x70965d][j],.02,7);
    }
    for(const [x,z] of [[-29,-20],[-33,4],[27,-13],[24,18],[-4,25]]){
      for(let i=0;i<5;i++)oval(x+random()*3,.22,z+random()*2,1+random(),.68+random(),.87+random(),0xa9ac93);
    }

    // Small grass tufts and wildflowers frame the useful land.
    for(let i=0;i<420;i++){
      const x=random()*24-12,z=random()*18-9;
      if(Math.abs(x-waterX(z))<1.4 || (x>-6.1 && x<6.6 && z>-5.9 && z<6.6))continue;
      const h=.13+random()*.13;
      face([[x-.05,0,z],[x-.03,h,z],[x+.06,0,z]],0x799f46,1);
      if(i%4===0)oval(x,h,z,.095,.066,.09,[0xffda5a,0xfff3cc,0xef9aa5][i%3]);
    }
    // Grass tussocks and seed heads cluster along the verge, clear of farm plots.
    for(let i=0;i<1300;i++){
      const x=random()*32-15,z=random()*24-12;
      if(Math.abs(x-waterX(z))<riverWidth(z)+.34 ||
        (x>-6.7 && x<6.6 && z>-6.5 && z<6.3) || Math.abs(x-2)<1 || Math.abs(z-3.5)<.9)continue;
      const h=.09+.17*random();
      for(let j=0;j<3;j++){
        const a=random()*6.28,bx=x+Math.cos(a)*.09,bz=z+Math.sin(a)*.09;
        face([[bx-.022,.01,bz],[bx+.024,.01,bz],[bx+.084*Math.cos(a),h,bz+.078*Math.sin(a)]],
          [0x6f803f,0x8b9454,0x9d9f60][j],1);
      }
    }
    // A lavender border running alongside the beds.
    for(let i=0;i<17;i++){
      const z=-1.05+i*.34,x=-6.24+.12*Math.sin(i);
      for(const dx of [-.12,.12]){
        oval(x+dx,.19,z,.18,.25,.18,0x679256);
        oval(x+dx,.44,z,.075,.16,.075,i%2?0xab8cc0:0x9072a9);
      }
    }
  }

  function chicken(x,z) {
    for(const side of [-1,1]){
      const foot=[x+.01,.065,z+side*.16];
      beam(foot,[x-.05,.41,foot[2]],.033,0xb6853d,.052,6);
      for(const toe of [-1,0,1])beam(foot,[x+.21-Math.abs(toe)*.04,.028,foot[2]+toe*.086],.024,0xc69346,.009,5);
    }
    oval(x,.58,z,.57,.37,.34,0xe5bc82);
    for(const side of [-1,1]){
      oval(x-.10,.62,z+side*.255,.41,.24,.12,0xb67d49);
      for(let i=0;i<4;i++)beam([x-.06,.59+i*.057,z+side*.34],[x-.46-i*.026,.52+i*.042,z+side*.26],.069,0x93653f,.012,6);
    }
    for(let i=-2;i<=2;i++)beam([x-.31,.59,z+i*.057],[x-.77+Math.abs(i)*.053,1.04-Math.abs(i)*.09,z+i*.093],.093,0x745641,.008,7);
    beam([x+.24,.63,z],[x+.39,.99,z],.227,0xf1cb90,.126,9);
    oval(x+.41,1.02,z,.185,.181,.177,0xf1cb90);
    for(let i=0;i<3;i++)oval(x+.33+i*.079,1.17,z,.053,.059+i*.008,.038,0xba3b2e);
    oval(x+.48,.936,z,.067,.10,.068,0xb43a32);
    beam([x+.535,1.015,z],[x+.717,.987,z],.071,0xc48a36,.005,6);
    for(const side of [-1,1])oval(x+.483,1.059,z+side*.151,.033,.035,.021,0x292a29);
  }
  function cow(x,z) {
    for(const dx of [-.6,.6]) for(const dz of [-.32,.32]){
      box(x+dx,.08,z+dz,.23,.8,.22,0xddc6a6);
      box(x+dx,.02,z+dz,.24,.17,.24,0x524941);
    }
    oval(x,1.02,z,1.04,.53,.51,0xf0dfbd);
    for(const side of [-1,1]){
      oval(x-.40,1.12,z+.409*side,.37,.32,.115,0x5a493d);
      oval(x+.35,1.29,z+.362*side,.19,.16,.11,0x5a493d);
    }
    beam([x-.92,1.19,z+.07],[x-1.05,.58,z+.23],.037,0xddc6a6,.026,6);
    oval(x-1.05,.52,z+.23,.067,.129,.057,0x5a493d);
    beam([x+.52,1.08,z],[x+.91,1.38,z],.37,0xf0dfbd,.26,10);
    oval(x+.97,1.40,z,.36,.39,.31,0x6b5344);
    oval(x+1.23,1.26,z,.24,.15,.235,0xd8ab94);
    for(const side of [-1,1]){
      oval(x+.85,1.57,z+.33*side,.18,.085,.18,0x6b5344);
      beam([x+.91,1.66,z+.14*side],[x+.84,1.84,z+.24*side],.065,0xc3aa80,.012,7);
      oval(x+1.103,1.48,z+.269*side,.052,.058,.034,0x201d19);
      oval(x+1.415,1.29,z+.125*side,.034,.03,.027,0x72574b);
    }
  }
  function resident(x,z,coat,hat){
    // Scale and stance are shared by the three villagers, with individual clothes and headwear.
    const skin=0xb98363,boots=0x4d4439,trousers=0x52605a;
    for(const side of [-1,1]){
      const footX=x+side*.135,footZ=z+side*.05;
      oval(footX,.11,footZ+.06,.095,.10,.175,boots);
      beam([footX,.17,footZ],[x+side*.10,.83,z],.079,trousers,.104,8);
      beam([x+side*.19,1.18,z],[x+side*.27,.92,z+.035],.088,coat,.065,8);
      beam([x+side*.27,.92,z+.035],[x+side*.24,.77,z+.10],.064,skin,.047,8);
      oval(x+side*.24,.755,z+.1,.058,.077,.059,skin);
    }
    oval(x,1.03,z,.24,.33,.16,coat);
    oval(x,1.485,z,.151,.185,.145,skin);
    oval(x,1.48,z+.133,.043,.05,.047,skin);
    for(const side of [-1,1])oval(x+side*.058,1.51,z+.134,.018,.013,.012,0x463c36);
    beam([x,1.59,z],[x,1.62,z],.212,hat,.215,14);
    oval(x,1.665,z,.153,.09,.152,hat);
  }
  function lockAndGauge(story){
    const x=9.52,z=5.82;
    for(const side of [-1,1])box(x+side*.68,.01,z,.18,.76,1.63,0xb7afa0);
    box(x,.01,z-.7,1.42,.67,.16,0x886c50);
    box(x,.03,z+.7,1.42,.3+story.level*.055,.14,0x886c50);
    box(x,.035+story.level*.068,z,1.16,.035,1.29,0x52bcb1);
    box(x-.51,.04,z+.45,.075,1.1,.082,0xc8a77b);
    for(let i=1;i<=6;i++)box(x-.51,.14+i*.12,z+.496,.08,.019,.025,i===4?0xb54932:0x5d574c);
  }
  function seedBed(x,z,wet){
    const colour=wet?0x634733:0x995e3a;
    const nx=8,nz=16;
    const rows=[];
    for(let j=0;j<=nz;j++){
      const v=j/nz;
      const row=[];
      for(let i=0;i<=nx;i++){
        const u=i/nx;
        const edge=Math.min(1,Math.min(u,1-u)*9,Math.min(v,1-v)*13);
        const bend=.035*Math.sin(x*2+u*5+z);
        const ridge=Math.pow(.5+.5*Math.cos(v*Math.PI*8+bend),1.4);
        const y=.032+edge*(.11+.104*ridge+.011*Math.sin(i*3+j*1.7+x));
        row.push([x+(u-.5)*(1.77-.17*Math.pow(Math.abs(2*v-1),7)),y,z+(v-.5)*1.24]);
      }
      rows.push(row);
    }
    for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
      const lower=rows[j],upper=rows[j+1];
      face([lower[i],lower[i+1],upper[i+1],upper[i]],colour,.84+.16*Math.cos(j*Math.PI/2));
    }
  }

  function drawBeacon(story,day){
    const x=11.8,z=6.33,stage=story.signed.length;
    // A missing lens, a repaired housing and a lit beacon mark the player's work at the landing.
    beam([x,-.12,z],[x,.32,z],.55,0xb7afa0,.42,10);
    beam([x,.32,z],[x,2.23,z],.19,0x886c50,.12,9);
    box(x,2.23,z,.56,.11,.56,0x515e56);
    if(stage>=2){
      for(const dx of [-.21,.21])for(const dz of [-.21,.21])
        box(x+dx,2.32,z+dz,.04,.55,.04,0x936f41);
      if(stage>=3)oval(x,2.55,z,.18,.24,.18,stage===4?0xffbc50:0xc8a669);
      beam([x,2.87,z],[x,3.1,z],.43,0x52756f,.025,4);
    }
    if(stage===4 && story.returnDay<=day){
      const px=11.0,pz=9.62;
      motionGroup=2;
      boatHull(px,pz,[[-.47,-1.42],[.47,-1.42],[.60,-.8],[.60,.64],[.38,1.25],[0,1.64],[-.38,1.25],[-.60,.64],[-.60,-.8]],.40,0x4c796d);
      if(story.line==="passenger"){
        for(const dz of [-.71,-.05,.61]) box(px,.49,pz+dz,.95,.085,.22,0xb49268);
        for(const side of [-1,1]){
          for(const end of [-1,1])beam([px+side*.49,.40,pz+end*.86],[px+side*.49,1.32,pz+end*.86],.035,0x886c50);
          face([[px,1.48,pz-.98],[px+side*.57,1.34,pz-.98],[px+side*.57,1.34,pz+.98],[px,1.48,pz+.98]],0xf3dba5,.99);
        }
      }else{
        for(const [dx,dz] of [[-.23,-.59],[.24,-.59],[0,.22]]){
          box(px+dx,.40,pz+dz,.43,.45,.65,0xb58b5f);
          for(const edge of [-.21,.21])box(px+dx,.40,pz+dz+edge,.45,.47,.048,0x776449);
        }
      }
      motionGroup=0;
    }
  }

  function plotLocation(i) {
    return i<20 ? [-4.9+i%4*1.93,-.7+Math.floor(i/4)*1.43] :
      [-22.4+i%4*1.93,-6.4+Math.floor((i-20)/4)*1.43];
  }
  // Fold each leaf along its midrib so both sides catch the light as the camera turns.
  function blade(x,y,z,a,length,width,rise,tip,color){
    const dx=Math.cos(a),dz=Math.sin(a),root=[x,y,z];
    const cx=x+dx*length*.52,cz=z+dz*length*.52;
    const mid=[cx,y+rise+.018,cz],end=[x+dx*length,y+tip,z+dz*length];
    for(const side of [-1,1]){
      const edge=[cx-side*dz*width,y+rise-width*.36,cz+side*dx*width];
      face([root,edge,mid],color,side<0?.87:1.04);
      face([mid,edge,end],color,side<0?.91:1.08);
    }
  }
  function wheatBed(x,z,growth){
    const ripe=growth>=1, straw=ripe?0xc8a052:0x7d9847;
    for(let i=0;i<14;i++){
      const angle=i*2.4;
      const px=x+(i%5-2)*.29+.035*Math.sin(angle);
      const pz=z+(Math.floor(i/5)-1)*.33+.055*Math.cos(angle);
      const top=.29+growth*(.55+.17*Math.cos(angle)),lean=.07*growth;
      beam([px,.17,pz],[px+lean,top,pz],.016,straw,.009,4);
      for(const side of [-1,1])blade(px,.22+growth*.15,pz,angle+side,.13+growth*.14,.027,.09,.075,straw);
      if(!ripe)continue;
      for(let k=0;k<5;k++){
        const side=k%2?1:-1, base=top-.14+k*.034;
        blade(px+lean,base,pz,angle+side*1.57,.079,.027,.034,.098,0xdcb565);
      }
      beam([px+lean,top,pz],[px+lean+.028,top+.14,pz],.012,0xe6c77c,.003,4);
    }
  }
  function carrot(x,z,turn){
    beam([x,.13,z],[x,.30,z],.055,0xc97232,.132,9);
    oval(x,.285,z,.143,.08,.135,0xe08737);
    for(let i=0;i<5;i++){
      const angle=i*1.26+turn, dx=Math.cos(angle), dz=Math.sin(angle);
      beam([x,.32,z],[x+dx*.23,.67,z+dz*.23],.015,0x60853e,.007,4);
      for(let j=1;j<=3;j++){
        for(const side of [-1,1])blade(x+dx*j*.056,.33+j*.082,z+dz*j*.056,angle+side*.87,.089,.026,.037,.072,0x54823d);
      }
    }
  }
  function cabbage(x,z,turn,growth){
    const size=.58+.42*growth;
    oval(x,.24+size*.10,z,.218*size,.18*size,.212*size,0x97b373);
    for(let i=0;i<10;i++){
      const angle=i*2.4+turn;
      if(i<6)blade(x,.26,z,angle,.38*size,.14*size,.10*size,.052*size,0x5b865c);
      else blade(x,.26,z,angle,.24*size,.102*size,.23*size,.25*size,0x86a96c);
    }
  }
  function strawberry(x,z,turn,growth){
    for(let i=0;i<8;i++)blade(x,.23,z,i*2.4,.21+growth*.14,.095,.12+growth*.07,.074,i%2?0x517e43:0x638b4c);
    for(let i=0;i<3;i++){
      const angle=i*2.15+turn, bx=x+.25*Math.cos(angle), bz=z+.25*Math.sin(angle);
      if(growth<1){
        for(let j=0;j<5;j++)blade(bx,.37,bz,j*1.26,.067,.028,.013,.021,0xf4eede);
        oval(bx,.381,bz,.028,.016,.028,0xe8b54a);
      }else{
        oval(bx,.29,bz,.083,.11,.084,0xb93832);
        for(let j=0;j<4;j++){
          const a=j*1.57;
          blade(bx,.392,bz,a,.076,.027,.008,-.028,0x437141);
          oval(bx+.078*Math.cos(a),.286,bz+.078*Math.sin(a),.011,.016,.011,0xe7c179);
        }
      }
    }
  }
  const gardenPlants={carrot,cabbage,strawberry};
  function plantCrop(x,z,plot,days){
    const growth=plot.age/days;
    motionGroup=4;
    if(plot.crop==="wheat")wheatBed(x,z,growth);
    else for(const side of [-1,1]){
      const px=x+side*.405, pz=z+side*.053;
      if(plot.age)gardenPlants[plot.crop](px,pz,side,growth);
      else for(let i=0;i<3;i++)blade(px,.19,pz,i*2.1,.17,.055,.081,.075,0x6a9848);
    }
    motionGroup=0;
  }
  function bake(farm,crops){
    triangles=[]; faces=[];
    if(!terrain){
      estate();
      terrain=gpu?new Float32Array(triangles):faces;
      triangles=[]; faces=[];
    }
    lockAndGauge(farm.story);
    drawBeacon(farm.story,farm.day);
    motionGroup=3;
    if(farm.animals.hen) chicken(3.2,-1.7);
    if(farm.animals.cow) cow(5.6,-2.1);
    motionGroup=0;
    farm.plots.forEach((plot,i)=>{
      const [x,z]=plotLocation(i);
      seedBed(x,z,plot?.wet);
      if(plot && plot.age >= crops[plot.crop].days){
        for(const edge of [-1,1])for(const end of [-1,1]){
          box(x+edge*.69,.16,z+end*.56,.28,.034,.045,0xd9ae64);
          box(x+edge*.81,.16,z+end*.46,.045,.034,.21,0xd9ae64);
        }
      }
      if(plot)plantCrop(x,z,plot,crops[plot.crop].days);
    });
    if(!gpu)return terrain.concat(faces);
    const all=new Float32Array(terrain.length+triangles.length);
    all.set(terrain);all.set(triangles,terrain.length);
    return all;
  }

  function paint(farm,crops,buttons){
    const key=JSON.stringify([farm.plots,Object.keys(farm.animals),farm.story.signed.length,farm.story.returnDay>farm.day,farm.story.level]);
    lastFarm={farm,crops,buttons};
    weatherWet=rainyDay(farm.day);
    if(key!==sceneKey){bakedScene=bake(farm,crops);sceneKey=key;}
    redraw=()=>frame(buttons);
    redraw();
  }
  function frame(buttons){
    width=canvas.clientWidth;height=canvas.clientHeight;
    const ratio=Math.min(devicePixelRatio,1.75,1680/Math.max(1,width));
    const w=Math.round(width*ratio),h=Math.round(height*ratio);
    if(canvas.width!==w || canvas.height!==h){canvas.width=w;canvas.height=h;}
    ctx?.setTransform(ratio,0,0,ratio,0,0);
    ctx?.clearRect(0,0,width,height);
    scale=Math.min(width/18.5,height/13.3)*zoom;
    document.getElementById("navigation-tip").textContent = overview ? "Choose a destination" : "Drag to explore · "+Math.round(zoom*100)+"%";
    buttons.forEach((button,i)=>{
      const [x,z]=plotLocation(i);
      const corners=[[-.89,-.63],[.89,-.63],[.89,.63],[-.89,.63]].map(([a,b])=>project([x+a,.24,z+b]));
      const xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]);
      const l=Math.min(...xs),t=Math.min(...ys);
      button.hidden=overview || Math.max(...xs)<0 || l>width || Math.max(...ys)<0 || t>height;
      Object.assign(button.style,{left:l+'px',top:t+'px',width:Math.max(...xs)-l+'px',height:Math.max(...ys)-t+'px',clipPath:'polygon('+corners.map(([u,v])=>(u-l)+'px '+(v-t)+'px').join(',')+')'});
    });
    for(const [id,button] of pins){
      const place=districts[id],[x,y]=project([place.x,1.5,place.z]);
      button.hidden=!overview;
      button.style.left=x+'px';button.style.top=y+'px';
    }
    const letter=ferryLetters[lastFarm.farm.story.signed.length];
    const subject=letter && {home:[-5.51,1.9,-2.22],apiary:[-13.15,1.9,13.63],quay:[14.65,1.92,7.45]}[letter.district];
    if(subject){
      const [x,y]=project(subject);
      letterPin.hidden=overview || letter.district!==selectedDistrict || x<38 || x>width-38 || y<38 || y>height-8;
      letterPin.style.left=x+"px";letterPin.style.top=y+"px";
      letterPin.textContent="✉ "+letter.author.split(" ")[0];
      letterPin.setAttribute("aria-label","Read the letter from "+letter.author);
    }else letterPin.hidden=true;
    for(const [button,station] of stations){
      const [x,y]=project([station.x,station.y,station.z]);
      button.hidden=overview || station.district!==selectedDistrict || (station.availableOnMap && !station.availableOnMap(lastFarm.farm)) || x<40 || x>width-40 || y<42 || y>height-12;
      button.style.left=x+"px";button.style.top=y+"px";
    }
    if(gpu){
      const c=Math.cos(angle),s=Math.sin(angle),v=Math.sin(pitch),u=Math.cos(pitch);
      const sx=2*scale/width,sy=2*scale/height;
      view={axes:[[sx*c,0,-sx*s],[-sy*s*v,sy*u,-sy*c*v],[-s*u/100,-v/100,-c*u/100]],
        origin:[-sx*(c*centerX-s*centerZ),-.16+sy*v*(s*centerX+c*centerZ),u*(s*centerX+c*centerZ)/100],
        eye:[s*u,v,c*u], x:centerX,z:centerZ,extent:Math.max(width,height)/scale*.84+4,
        light:lightSelect.value,rain:weatherWet};
      drawAtmosphere();
      return;
    }
    const visible=[];
    for(const item of bakedScene){
      const vertices=item.points.map(project);
      if(vertices.every(p=>p[0]<0)||vertices.every(p=>p[0]>width)||vertices.every(p=>p[1]<0)||vertices.every(p=>p[1]>height))continue;
      const depth=item.ground ? -1000+Math.max(...item.points.map(p=>p[1])) : vertices.reduce((sum,p)=>sum+p[2],0)/vertices.length;
      visible.push({vertices,color:item.color,depth});
    }
    visible.sort((a,b)=>a.depth-b.depth);
    for(const f of visible){
      ctx.beginPath(); f.vertices.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();
      ctx.fillStyle=ctx.strokeStyle=f.color;ctx.lineWidth=.45;ctx.fill();ctx.stroke();
    }
  }
  const letterPin=document.createElement("button");
  letterPin.className="map-pin correspondent";letterPin.hidden=true;
  letterPin.onclick=()=>document.getElementById("read-letter").click();
  document.getElementById("map-pins").append(letterPin);
  const pins=new Map();
  for(const [id,place] of Object.entries(districts)){
    const pin=document.createElement("button");
    pin.className="map-pin";pin.textContent=place.name;pin.hidden=true;
    pin.onclick=()=>document.dispatchEvent(new CustomEvent("valley-visit",{detail:id}));
    document.getElementById("map-pins").append(pin);
    pins.set(id,pin);
  }

  const stations = new Map();
  for(const station of [
    {district:"home",x:.05,y:2.8,z:-4.45,name:"Stone windmill",actions:["mill"],availableOnMap:farm=>farm.milling || farm.basket.wheat>=2},
    {district:"orchard",x:-22.6,y:2.6,z:-11.3,name:"Apple trees",actions:["pick"]},
    {district:"orchard",x:-17,y:2.3,z:-9.9,name:"Cider press",actions:["bottle","press"]},
    {district:"apiary",x:-13.2,y:1.4,z:15.9,name:"Beehives",actions:["collect-honey","tend-hives"]},
    {district:"quay",x:12.2,y:.9,z:7.3,name:"Fishing nets",actions:["fish"]},
    {district:"quay",x:17,y:3.7,z:4.3,name:"Cargo office",actions:["ship"]}
  ]){
    const button=document.createElement("button");
    button.hidden=true;button.className="map-pin station";button.textContent=station.name;
    button.onclick=()=>{
      const options=station.actions.map(id=>document.getElementById(id));
      const available=options.find(action=>!action.disabled);
      if(available)available.click();
      else if(station.district==="home")document.getElementById("status").textContent=options[0].textContent;
      else {
        document.getElementById("status").textContent=document.getElementById("production").textContent || "No work available here yet. Check the district panel for supplies and timing.";
        document.getElementById("district-panel").scrollIntoView({block:"nearest"});
      }
    };
    document.getElementById("map-pins").append(button);
    stations.set(button,station);
  }

  let weatherWet=false,view,inView=false,timer=0,animationFrame=0;
  let visualTime=0,lastPaint=performance.now();
  const lightSelect=document.getElementById("daylight");
  const animate=document.getElementById("animate");
  const reduced=matchMedia("(prefers-reduced-motion: reduce)");
  const dialog=document.getElementById("letters");
  let motionPreference="auto";
  try{
    const choice=localStorage.getItem("little-acre-light");
    if(["morning","noon","evening"].includes(choice))lightSelect.value=choice;
    motionPreference=localStorage.getItem("little-acre-motion")||"auto";
  }catch{}
  function syncMotion(){
    animate.checked=motionPreference==="auto"?!reduced.matches:motionPreference==="on";
  }
  syncMotion();
  function cancelAnimation(){
    clearTimeout(timer);cancelAnimationFrame(animationFrame);timer=0;animationFrame=0;
  }
  function drawAtmosphere(){
    cancelAnimation();
    if(!gpu||!view)return;
    const playing=animate.checked && inView && !document.hidden && !dialog.open && !photo.open;
    const now=performance.now();
    if(playing)visualTime+=Math.min((now-lastPaint)/1000,.25);
    lastPaint=now;
    gpu(bakedScene,view,visualTime);
    if(playing){
      // Camera input remains immediate. Ambient motion gets a bounded frame budget.
      timer=setTimeout(()=>{animationFrame=requestAnimationFrame(drawAtmosphere);},canvas.clientWidth<650?95:74);
    }
  }
  const photo=document.getElementById("photo");
  const shutter=document.getElementById("take-photo");
  const print=document.getElementById("photo-print");
  const download=document.getElementById("download-photo");
  let photoURL;
  function releasePhoto(){
    if(photoURL)URL.revokeObjectURL(photoURL);
    photoURL=null;
    print.removeAttribute("src");
    download.removeAttribute("href");
  }
  shutter.onclick=async()=>{
    if(shutter.disabled || photo.open || !lastFarm)return;
    shutter.disabled=true;
    shutter.textContent="Taking photo…";
    releasePhoto();
    cancelAnimation();
    try{
      if(gpu && view){
        // Render directly at export resolution with the current camera. UI overlays are DOM elements.
        canvas.width=Math.round(2048*Math.min(1,width/height));
        canvas.height=Math.round(canvas.width*height/width);
        gpu(bakedScene,view,visualTime);
      }
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(
        result=>result?resolve(result):reject(new Error("Capture unavailable")),"image/png"));
      photoURL=URL.createObjectURL(blob);
      print.src=photoURL;
      await print.decode();
      download.href=photoURL;
      download.download="little-acre-"+selectedDistrict+"-day-"+lastFarm.farm.day+".png";
      document.getElementById("photo-caption").textContent=districts[selectedDistrict].name+" · Day "+lastFarm.farm.day;
      photo.showModal();
    }catch{
      releasePhoto();
      document.getElementById("status").textContent="This browser could not capture the scene.";
    }finally{shutter.textContent="Take photo";shutter.disabled=false;refresh();}
  };
  document.getElementById("close-photo").onclick=()=>photo.close();
  photo.addEventListener("close",()=>{
    if(photo.open || shutter.disabled)return;
    releasePhoto();
    drawAtmosphere();
  });
  function saveDisplay(key,value){try{localStorage.setItem(key,value);}catch{}}
  lightSelect.onchange=()=>{saveDisplay("little-acre-light",lightSelect.value);refresh();};
  animate.onchange=()=>{
    motionPreference=animate.checked?"on":"off";
    saveDisplay("little-acre-motion",motionPreference);drawAtmosphere();
  };
  reduced.addEventListener("change",()=>{syncMotion();drawAtmosphere();});
  new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;drawAtmosphere();}).observe(field);
  new MutationObserver(drawAtmosphere).observe(dialog,{attributes:true,attributeFilter:["open"]});
  document.addEventListener("visibilitychange",()=>document.hidden?cancelAnimation():drawAtmosphere());
  window.addEventListener("pagehide",cancelAnimation);
  window.addEventListener("pageshow",()=>refresh());
  canvas.addEventListener("webglcontextlost",()=>{
    cancelAnimation();
    const replacement=canvas.cloneNode(false);
    canvas.replaceWith(replacement);canvas=replacement;gpu=null;ctx=canvas.getContext("2d");
    terrain=null;sceneKey=null;view=null;
    if(lastFarm)paint(lastFarm.farm,lastFarm.crops,lastFarm.buttons);
  });
  let lastFarm;
  let previous,drag,pending=false;
  function refresh(){
    if(!pending){
      pending=true;
      requestAnimationFrame(()=>{pending=false;redraw?.();});
    }
  }
  function setOverview(value){
    overview=value;
    document.getElementById("atlas").setAttribute("aria-pressed",value);
    document.getElementById("atlas").textContent=value?"Close map":"Valley map";
  }
  function visit(id){
    setOverview(false);
    selectedDistrict=id;
    const place=districts[id];
    centerX=place.x;centerZ=place.z;zoom=id==="home"?1:.81;
    refresh();
  }
  document.getElementById("atlas").onclick=()=>{
    if(overview){
      [centerX,centerZ,angle,zoom]=previous;
      setOverview(false);
    }else{
      previous=[centerX,centerZ,angle,zoom];
      centerX=-3;centerZ=1;angle=.12;zoom=.30;
      setOverview(true);
    }
    refresh();
  };
  for(const [id,step] of [["left",-1],["right",1]]){
    document.getElementById(id).onclick=()=>{angle+=step*Math.PI/6;refresh();};
  }
  function magnify(factor){
    if(overview){[centerX,centerZ,angle,zoom]=previous;setOverview(false);}
    zoom=clamp(zoom*factor,.35,1.75);
    refresh();
  }
  document.getElementById("zoom-in").onclick=()=>magnify(1.25);
  document.getElementById("zoom-out").onclick=()=>magnify(.8);
  field.addEventListener("wheel",e=>{
    if(document.activeElement!==field)return;
    e.preventDefault();magnify(e.deltaY<0?1.12:1/1.12);
  },{passive:false});
  function pan(dx,dy){
    const u=dx/scale,v=dy/(scale*Math.sin(pitch));
    centerX=clamp(centerX-u*Math.cos(angle)-v*Math.sin(angle),-30,30);
    centerZ=clamp(centerZ+u*Math.sin(angle)-v*Math.cos(angle),-23,24);
    refresh();
  }
  const notifyPan=()=>document.dispatchEvent(new CustomEvent("valley-pan-end",{detail:[centerX,centerZ]}));
  field.addEventListener("keydown",e=>{
    if(e.target!==field||overview)return;
    const move={ArrowLeft:[72,0],ArrowRight:[-72,0],ArrowUp:[0,72],ArrowDown:[0,-72]}[e.key];
    if(move){e.preventDefault();pan(...move);notifyPan();}
  });
  field.addEventListener("pointerdown",e=>{
    if(overview || e.target.closest(".camera,.map-pin") || e.button!==0 || !e.isPrimary)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    if(e.target===canvas)field.focus({preventScroll:true});
  });
  field.addEventListener("pointermove",e=>{
    if(!drag || e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.moved && Math.hypot(dx,dy)<6)return;
    drag.moved=true;field.setPointerCapture(e.pointerId);pan(dx,dy);
    drag.x=e.clientX;drag.y=e.clientY;
  });
  function finish(e){
    if(!drag || e.pointerId!==drag.id)return;
    if(drag.moved)notifyPan();
    drag=null;
  }
  field.addEventListener("pointerup",finish);
  field.addEventListener("pointercancel",finish);
  field.addEventListener("pointerleave",e=>{if(drag && !drag.moved)finish(e);});
  new ResizeObserver(refresh).observe(field);
  return {paint,visit,selectDistrict(id){selectedDistrict=id;}};
})();
