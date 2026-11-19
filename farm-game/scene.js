// Orthographic 3D scene. The same camera projects meshes and accessible plot hit areas.
const valleyCamera = (() => {
  const canvas = document.getElementById("world");
  const gpu = createFarmRenderer(canvas);
  const ctx = gpu ? null : canvas.getContext("2d");
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
  function face(points, color, light) {
    if(gpu){
      const rgb=[16,8,0].map(shift => ((color>>shift)&255)/255 * (.75+.25*light));
      for(let i=1;i<points.length-1;i++) for(const point of [points[0],points[i],points[i+1]]) triangles.push(...point,...rgb);
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
    for(let i=0;i<5;i++) for(let j=0;j<10;j++)
      face([ring(i,j),ring(i+1,j),ring(i+1,j+1),ring(i,j+1)],c,.78+.24*i/4+.13*Math.cos(j*Math.PI/5+2));
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
      box(a+random()-.5,.005,z+.4,.48,.012,.035,0xb1e1cb);
    }
    // Walkways link the beds, cottage steps, bridge and pasture.
    box(1.98,-.015,.2,1.15,.055,14,0xe3bf82);
    box(-1.6,-.015,-1.68,8.1,.06,.85,0xe8c991);
    box(5,-.015,3.5,5.2,.06,.88,0xe2c48a);
    for(let i=0;i<12;i++)box(7.45+i*.26,.09,3.5,.25,.14,1.18,0xb77c4e);
    for(const z of [2.86,4.14]){
      for(const x of [7.49,8.9,10.26]) box(x,.02,z,.13,.75,.13,0x935e3c);
      beam([7.49,.71,z],[10.26,.71,z],.065,0xd5a66a);
    }
    cottage();
    // Stone mill, canvas sails and a little timber grain door.
    const mx=.05,mz=-5.35;
    beam([mx,0,mz],[mx,3.1,mz],.91,0xe9d5af,.65,12);
    beam([mx,3.04,mz],[mx,3.96,mz],.93,0x51828b,.04,12);
    box(mx,.02,mz+.85,.49,.94,.14,0x866345);
    const hub=[mx,2.7,mz+.89];
    for(let i=0;i<4;i++){
      const t=.47+i*Math.PI/2;
      const point=(r,w)=>[hub[0]+r*Math.cos(t)-w*Math.sin(t),hub[1]+r*Math.sin(t)+w*Math.cos(t),hub[2]];
      beam(hub,point(1.77,0),.046,0x92653e);
      face([point(.63,.03),point(1.71,.03),point(1.71,.34),point(.63,.2)],0xffedc6,1);
      for(const r of [.7,1.1,1.5])beam(point(r,0),point(r,.25),.02,0xaa7c4f);
    }
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
      beam([x,0,z],[x,size*1.7,z],.22*size,0x8d6645,.12*size);
      for(let i=0;i<5;i++){
        const t=i*2.4;
        const px=x+.56*size*Math.cos(t),pz=z+.53*size*Math.sin(t);
        oval(px,(1.62+i*.13)*size,pz,.86*size,.86*size,.81*size,
          [0x679644,0x80a64b,0x719c48,0x96b954,0x86ae4b][i]);
        if(fruit) oval(px+.5*size,(1.52+i*.13)*size,pz+.58*size,.12,.13,.12,0xcf5538);
      }
    }
    for(const [x,z,size] of [[-7,-4,1.15],[-6.95,-.6,.87],[-9,3,.9],[5,-6,1],[7,-7,1.15],[-2,-8,1.15],[-6,-8,1.3],[10,-4,1.22],[12,1,1.04],[-9,-7,1.1],[-9,7,.85],[12,7,.85]])tree(x,z,size,true);
    // The valley road follows the same coordinates as the travel destinations.
    function lane(x,z,endX,endZ,w=1.08) {
      const length=Math.hypot(endX-x,endZ-z);
      const dx=(endZ-z)/length*w/2,dz=(x-endX)/length*w/2;
      face([[x+dx,.025,z+dz],[endX+dx,.025,endZ+dz],[endX-dx,.025,endZ-dz],[x-dx,.025,z-dz]],0xe4c48b,1);
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
    const bx=10.3,bz=9.7;
    const hull=[[-.64,-1.35],[.64,-1.35],[.77,.65],[0,1.77],[-.77,.65]];
    const rim=hull.map(([x,z])=>[bx+x,.54,bz+z]);
    face(rim,0xc8a77b,1);
    for(let i=0;i<hull.length;i++){
      const j=(i+1)%hull.length;
      face([rim[i],rim[j],[bx+hull[j][0]*.7,.06,bz+hull[j][1]*.84],[bx+hull[i][0]*.7,.06,bz+hull[i][1]*.84]],0x386d79,.92);
    }
    beam([bx,.5,bz],[bx,3.35,bz],.065,0x856746);
    face([[bx,3.22,bz],[bx,.98,bz],[bx+1.04,1.24,bz+.3]],0xfaf0cf,1);
    face([[bx-.1,2.87,bz],[bx-.12,1.2,bz],[bx-.88,1.12,bz-.27]],0xd7845b,.94);
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

    // Dark spruces and pale outcrops form the valley's distant ridgeline.
    for(let i=0;i<160;i++){
      const x=random()*84-42,z=random()*64-32;
      if(Math.abs(x)<28 && Math.abs(z)<22)continue;
      if(Math.abs(x-waterX(z))<3)continue;
      const h=1.6+random()*2.3;
      beam([x,0,z],[x,h*.36,z],.16,0x826448);
      for(let j=0;j<3;j++)beam([x,h*(.18+.19*j),z],[x,h*(.72+.17*j),z],h*(.27-.045*j),[0x547a52,0x628a57,0x70965d][j],.02,7);
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
      box(x+.1,.04,z+side*.24,.13,.47,.12,0xcd8631);
      box(x+.21,.03,z+side*.24,.33,.09,.15,0xe9a63b);
    }
    oval(x,.87,z,.78,.6,.51,0xf3d29d);
    oval(x-.65,1.12,z,.34,.47,.28,0xa66a3c);
    for(const side of [-1,1]) oval(x-.13,.9,z+.4*side,.47,.31,.17,0xcc8e53);
    oval(x+.47,1.45,z,.39,.43,.36,0xffe6b6);
    oval(x+.49,1.86,z,.22,.16,.1,0xdb4d38);
    oval(x+.84,1.4,z,.2,.1,.14,0xf0a338);
    for(const side of [-1,1]) oval(x+.63,1.53,z+side*.28,.065,.067,.045,0x292a29);
  }
  function cow(x,z) {
    for(const dx of [-.6,.6]) for(const dz of [-.32,.32]){
      box(x+dx,.08,z+dz,.23,.8,.22,0xddc6a6);
      box(x+dx,.02,z+dz,.24,.17,.24,0x524941);
    }
    oval(x,1.03,z,1.08,.59,.54,0xffe9c6);
    for(const side of [-1,1]) oval(x-.28,1.13,z+.44*side,.4,.33,.13,0x594c43);
    oval(x+.91,1.46,z,.48,.46,.42,0x695544);
    oval(x+1.25,1.29,z,.33,.23,.35,0xe2a396);
    for(const side of [-1,1]){
      oval(x+.85,1.77,z+.4*side,.22,.12,.22,0x674936);
      oval(x+1.1,1.55,z+.33*side,.07,.07,.055,0x201d19);
    }
  }
  function plotLocation(i) {
    return i<20 ? [-4.9+i%4*1.93,-.7+Math.floor(i/4)*1.43] :
      [-22.4+i%4*1.93,-6.4+Math.floor((i-20)/4)*1.43];
  }
  function bake(farm,crops){
    triangles=[]; faces=[];
    if(!terrain){
      estate();
      terrain=gpu?new Float32Array(triangles):faces;
      triangles=[]; faces=[];
    }
    if(farm.animals.hen) chicken(3.2,-1.7);
    if(farm.animals.cow) cow(5.6,-2.1);
    farm.plots.forEach((plot,i)=>{
      const [x,z]=plotLocation(i);
      box(x,.02,z,1.78,.18,1.26,plot?.wet?0x634733:0x995e3a);
      for(const dz of [-.36,0,.36]) box(x,.2,z+dz,1.58,.08,.16,plot?.wet?0x76573d:0xb67e4d);
      if(plot && plot.age >= crops[plot.crop].days){
        for(const side of [-1,1]){
          box(x,.21,z+side*.59,1.73,.045,.044,0xf0c16a);
          box(x+side*.85,.21,z,.044,.045,1.21,0xf0c16a);
        }
      }
      if(plot) for(const dx of [-.4,.4]){
        const ripe=plot.age>=crops[plot.crop].days;
        const color=ripe?{carrot:0xe58332,cabbage:0x67a740,strawberry:0xd84441}[plot.crop]:0x609341;
        if(!ripe){
          for(const side of [-1,1]) oval(x+dx+side*.085,.38,z,.14,.09,.065,0x74a444);
        } else if(plot.crop==="carrot"){
          oval(x+dx,.36,z,.21,.23,.19,color);
          for(const side of [-1,0,1]) beam([x+dx,.46,z],[x+dx+side*.14,.81-Math.abs(side)*.08,z+.03],.065,0x52843e,.018,5);
        } else if(plot.crop==="cabbage"){
          oval(x+dx,.46,z,.24,.22,.24,0x9dc663);
          for(let j=0;j<5;j++)oval(x+dx+.17*Math.cos(j*1.26),.4,z+.17*Math.sin(j*1.26),.15,.15,.16,color);
        } else {
          oval(x+dx,.47,z,.27,.22,.25,0x547e41);
          for(let j=0;j<3;j++)oval(x+dx+.17*Math.cos(j*2.1),.49,z+.17*Math.sin(j*2.1),.13,.15,.13,color);
        }
      }
    });
    if(!gpu)return terrain.concat(faces);
    const all=new Float32Array(terrain.length+triangles.length);
    all.set(terrain);all.set(triangles,terrain.length);
    return all;
  }

  function paint(farm,crops,buttons){
    const key=JSON.stringify([farm.plots,Object.keys(farm.animals)]);
    if(key!==sceneKey){bakedScene=bake(farm,crops);sceneKey=key;}
    redraw=()=>frame(buttons);
    redraw();
  }
  function frame(buttons){
    width=canvas.clientWidth;height=canvas.clientHeight;
    const ratio=Math.min(devicePixelRatio,2);
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
    for(const [button,station] of stations){
      const [x,y]=project([station.x,station.y,station.z]);
      button.hidden=overview || station.district!==selectedDistrict || x<40 || x>width-40 || y<42 || y>height-12;
      button.style.left=x+"px";button.style.top=y+"px";
    }
    if(gpu){
      const c=Math.cos(angle),s=Math.sin(angle),v=Math.sin(pitch),u=Math.cos(pitch);
      const sx=2*scale/width,sy=2*scale/height;
      gpu(bakedScene,[[sx*c,0,-sx*s],[-sy*s*v,sy*u,-sy*c*v],[-s*u/100,-v/100,-c*u/100]],[-sx*(c*centerX-s*centerZ),-.16+sy*v*(s*centerX+c*centerZ),u*(s*centerX+c*centerZ)/100]);
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
      else {
        document.getElementById("status").textContent=document.getElementById("production").textContent || "No work available here yet. Check the district panel for supplies and timing.";
        document.getElementById("district-panel").scrollIntoView({block:"nearest"});
      }
    };
    document.getElementById("map-pins").append(button);
    stations.set(button,station);
  }

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
