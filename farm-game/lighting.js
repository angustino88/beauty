// The colour, coverage and shadow passes use the same world positions and leaf silhouettes.
const SURFACE = Object.freeze({ plain:0, grass:1, soil:2, timber:3, stone:4, leaf:5, water:6, roof:7, sand:8, glass:9, lamp:10, coat:11, feathers:12 });
const VERTEX_FLOATS = 13; // position, albedo, normal, material, texture coordinates, motion group
function createFarmRenderer(canvas, invalidate) {
  const gl = canvas.getContext("webgl2", { antialias:true, alpha:true, powerPreference:"high-performance" });
  if (!gl) return null;

  const vertex = `#version 300 es
    layout(location=0) in vec3 position;
    layout(location=1) in vec3 color;
    layout(location=2) in vec3 normal;
    layout(location=3) in float material;
    layout(location=4) in vec2 uv;
    layout(location=5) in float movement;
    uniform vec3 viewX, viewY, viewZ, offset;
    uniform float clock;
    uniform bool mirror;
    out vec3 point, tint, worldNormal;
    out vec2 texcoord;
    flat out int surface;
    void main(){
      point=position; tint=color; worldNormal=normal; texcoord=uv; surface=int(material+.5);
      if(movement==1.){
        float a=clock*.23;
        mat2 turn=mat2(cos(a),sin(a),-sin(a),cos(a));
        vec2 hub=vec2(.05,2.7);
        point.xy=hub+turn*(point.xy-hub);
        worldNormal.xy=turn*normal.xy;
      }else if(surface==5){
        float sway=sin(clock*1.65+point.x*.65+point.z)*uv.y;
        point.xz+=vec2(.045,.022)*sway;
      }else if(movement==2.){
        point.y+=.026*sin(clock*1.5+point.x*.6);
        point.z+=.035*sin(clock*.8);
      }else if(movement==3.){
        point.y+=max(0.,point.y-.35)*.019*sin(clock*2.);
      }else if(movement==4.){
        point.x+=.045*max(0.,point.y-.24)*sin(clock*1.8+point.x+point.z*.6);
      }
      vec3 projected=point;
      if(mirror)projected.y=-.08-projected.y;
      gl_Position=vec4(vec3(dot(projected,viewX),dot(projected,viewY),dot(projected,viewZ))+offset,1.);
    }`;
  const coverage = `
    precision highp float;
    precision highp sampler2DArray;
    in vec2 texcoord;
    flat in int surface;
    uniform sampler2DArray surfaces;
    uniform int loaded;
    bool hasLayer(int i){return (loaded & (1<<i))!=0;}
    vec4 leafSample(){
      if(hasLayer(4)) return texture(surfaces,vec3(texcoord.x,1.-texcoord.y,4.));
      float d=length((texcoord-.5)*vec2(2.,2.3));
      return vec4(.22,.42,.1,1.-smoothstep(.8,1.,d));
    }`;
  const fragment = `#version 300 es
    ${coverage}
    in vec3 point,tint,worldNormal;
    uniform vec3 sunX,sunY,sunZ,shadowOffset,sun,eyeDir,sunColor;
    uniform sampler2D shadows, riverReflection;
    uniform bool mirror;
    uniform vec2 resolution;
    uniform float clock, rain, dusk;
    out vec4 pixel;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
    }
    vec2 surfaceUV(vec3 n) {
      vec3 a=abs(n);
      if(a.y>max(a.x,a.z))return point.xz;
      return a.x>a.z ? vec2(point.z,-point.y) : vec2(point.x,-point.y);
    }
    float sunlight(vec3 n){
      vec3 pos=vec3(dot(point,sunX),dot(point,sunY),dot(point,sunZ))+shadowOffset;
      vec3 coord=pos*.5+.5;
      if(any(greaterThan(abs(pos),vec3(.997))))return 1.;
      float bias=.00024+.00037*(1.-max(dot(n,sun),0.));
      float lit=0.;
      for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
        float d=texture(shadows,coord.xy+vec2(x,y)*1.3/2048.).r;
        lit+=step(coord.z-bias,d);
      }
      return lit/9.;
    }
    void main(){
      if(mirror && (point.y<.035 || surface==6))discard;
      vec3 n=normalize(worldNormal);
      if(dot(n,eyeDir)<0.)n=-n;
      vec3 base=tint;
      float rough=.78, transmission=0.;
      vec2 uv=surfaceUV(n);
      if(surface>=1 && surface<=4){
        int layer=surface-1;
        vec2 tile=surface==1 ? uv*.54 : surface==2 ? uv*.97 : surface==3 ? uv*vec2(.73,1.1) : uv*.69;
        if(hasLayer(layer)){
          vec3 tex=texture(surfaces,vec3(tile,float(layer))).rgb;
          if(surface==1){
            float variation=mix(.86,1.12,noise(point.xz*.32));
            base=mix(tint*.76,tex*1.28,.86)*variation;
          }else if(surface==2){
            base=mix(tint*.82,tex*mix(.92,1.48,smoothstep(.39,.68,tint.r)),.8);
          }else if(surface==3){
            base=tex*(.58+1.15*tint);
          }else{
            base=tex*(.65+.62*tint);
          }
          float luma=dot(tex,vec3(.26,.58,.16));
          // Relief from the local height gradient in the same projection as the scan.
          vec3 a=cross(dFdy(point),n), b=cross(n,dFdx(point));
          float det=dot(dFdx(point),a);
          vec3 gradient=sign(det)*(dFdx(luma)*a+dFdy(luma)*b);
          n=normalize(max(abs(det),.000001)*n-gradient*(surface==4?.055:.019));
        }
      }else if(surface==5){
        vec4 leaf=leafSample();
        if(leaf.a<.42)discard;
        base=leaf.rgb*(.84+.30*tint);transmission=.19;rough=.55;
        n=normalize(n*.5+vec3(0,.68,0));
      }else if(surface==6){
        float flow=clock*.68;
        float a=sin(point.z*6.8+point.x*1.7-flow);
        float b=sin(point.x*8.5-point.z*2.8+flow*.79);
        n=normalize(vec3(a*.105,1.,b*.12));
        float edge=abs(point.x-(8.1+1.1*sin(point.z*.4)))/(1.02+3.6*exp(-pow(abs(point.z-10.),2.)/22.));
        vec3 bed=mix(vec3(.10,.29,.28),vec3(.42,.53,.38),smoothstep(.36,1.,edge));
        float fresnel=.15+.63*pow(1.-max(dot(eyeDir,n),0.),2.);
        vec2 reflectedUV=gl_FragCoord.xy/resolution+vec2(a,b)*vec2(.002,.0035);
        vec4 bank=texture(riverReflection,clamp(reflectedUV,.002,.998));
        vec3 reflected=mix(vec3(.63,.77,.85),bank.rgb,bank.a);
        base=mix(bed,reflected,.26+fresnel*.65);
        base+=.075*pow(max(a*b,0.),7.)*smoothstep(.45,1.,edge);rough=.16;
      }else if(surface==7){
        vec2 tile=vec2(uv.x*5.,uv.y*7.);
        tile.x+=mod(floor(tile.y),2.)*.5;
        vec2 seam=min(fract(tile),1.-fract(tile));
        float course=smoothstep(0.,.07,min(seam.x,seam.y));
        base*=mix(.58,1.04,course)*(.86+.20*hash(floor(tile)));
        rough=.66;
      }else if(surface==8){
        float grit=hasLayer(1)?texture(surfaces,vec3(uv*.83,1.)).r:noise(uv*18.);
        float shoulder=abs(texcoord.y*2.-1.);
        float grain=noise(point.xz*22.);
        if(shoulder>.81+grain*.19)discard;
        float rut=(1.-smoothstep(0.,.14,abs(shoulder-.48)));
        base*=.57+.80*grit+.15*grain-rut*.07;
      }else if(surface==9){
        base=mix(vec3(.16,.29,.29),vec3(.69,.8,.78),smoothstep(.2,.95,reflect(-eyeDir,n).y));
        rough=.22;
      }else if(surface==11 || surface==12){
        float strand=noise(uv*vec2(126.,32.));
        base*=.88+.16*strand+.045*noise(uv*16.);
        if(surface==12)base*=.89+.13*smoothstep(.03,.37,abs(fract(uv.y*9.+sin(uv.x*17.)*.27)-.5));
        rough=.91;
      }
      float wet=rain*(surface==5?.32:.65);
      base*=1.-wet*.18;rough=mix(rough,.28,wet);
      float visibility=sunlight(n);
      float sky=.5+.5*n.y;
      vec3 ambient=mix(vec3(.26,.25,.19),vec3(.58,.68,.77),sky);
      ambient=mix(ambient,vec3(.68,.72,.76),rain*.55);
      float diffuse=max(dot(n,sun),0.);
      vec3 halfDir=normalize(sun+eyeDir);
      float shine=pow(max(dot(n,halfDir),0.),mix(210.,6.,rough));
      vec3 direct=sunColor*(1.-rain*.78)*visibility;
      vec3 linear=pow(max(base,vec3(.001)),vec3(2.2))*(ambient*(1.-dusk*.27)+direct*(diffuse+transmission));
      linear+=direct*shine*pow(1.-rough,2.)*.46;
      if(surface==10)linear+=vec3(1.3,.65,.12)*(1.+dusk);
      pixel=vec4(pow(1.-exp(-linear*1.18),vec3(1./2.2)),1.);
    }`;
  function program(fs) {
    const p=gl.createProgram();
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fs]]){
      const shader=gl.createShader(type);
      gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
      gl.attachShader(p,shader);gl.deleteShader(shader);
    }
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));
    const uniforms={};
    for(let i=0;i<gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);i++){
      const {name}=gl.getActiveUniform(p,i);
      uniforms[name]=gl.getUniformLocation(p,name);
    }
    return {p,uniforms};
  }
  const beauty=program(fragment);
  const depth=program(`#version 300 es
    ${coverage}
    void main(){if(surface==5 && leafSample().a<.42)discard;}`);
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  let offset=0;
  [3,3,3,1,2,1].forEach((size,attribute)=>{
    gl.enableVertexAttribArray(attribute);
    gl.vertexAttribPointer(attribute,size,gl.FLOAT,false,VERTEX_FLOATS*4,offset*4);
    offset+=size;
  });

  const shadowMap=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,shadowMap);
  gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,2048,2048);
  for(const param of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,param,gl.NEAREST);
  for(const param of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,param,gl.CLAMP_TO_EDGE);
  const target=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,target);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowMap,0);
  gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error("Shadow target unavailable");
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  gl.enable(gl.DEPTH_TEST);

  const textures=gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D_ARRAY,textures);
  gl.texStorage3D(gl.TEXTURE_2D_ARRAY,10,gl.RGBA8,512,512,5);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  let loaded=0,shadowEpoch=-1,shadowView="";
  ["meadow","soil","oak","stone","apple-leaves"].forEach((name,layer)=>{
    const image=new Image();
    image.onload=()=>{
      if(gl.isContextLost())return;
      try{
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D_ARRAY,textures);
        gl.texSubImage3D(gl.TEXTURE_2D_ARRAY,0,0,0,layer,512,512,1,gl.RGBA,gl.UNSIGNED_BYTE,image);
        gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
        loaded|=1<<layer;
        shadowView="";
        invalidate();
      }catch{
        // Some browsers isolate file: images from WebGL. Keep the procedural materials.
      }
    };
    image.src="art/"+name+".webp";
  });
  function transform(program,axes,origin,time){
    const u=program.uniforms;
    gl.useProgram(program.p);
    gl.uniform3fv(u.viewX,axes[0]);gl.uniform3fv(u.viewY,axes[1]);gl.uniform3fv(u.viewZ,axes[2]);
    gl.uniform3fv(u.offset,origin);gl.uniform1f(u.clock,time);
    gl.uniform1i(u.surfaces,1);gl.uniform1i(u.loaded,loaded);
    gl.uniform1i(u.mirror,0);
  }
  function unit(v){const l=Math.hypot(...v);return v.map(x=>x/l);}
  function projection(sun,extent,x,z){
    const right=unit([sun[2],0,-sun[0]]);
    const up=[sun[1]*right[2],sun[2]*right[0]-sun[0]*right[2],-sun[1]*right[0]];
    const axes=[right.map(v=>v/extent),up.map(v=>v/extent),sun.map(v=>-v/95)];
    return {axes,origin:axes.map(a=>-a[0]*x-a[2]*z)};
  }
  const sky={
    morning:{sun:unit([-.87,.75,.52]),color:[1.69,1.43,1.11],dusk:0},
    noon:{sun:unit([-.39,1.35,.4]),color:[1.45,1.48,1.39],dusk:0},
    evening:{sun:unit([.94,.47,-.34]),color:[1.92,1.22,.79],dusk:.72}
  };
  // The river reflects the actual opposite bank from a camera mirrored about the water plane.
  const reflection=gl.createTexture(), reflectedTarget=gl.createFramebuffer(), reflectedDepth=gl.createRenderbuffer();
  let reflectW=0,reflectH=0,reflectedView="",reflectedEpoch=-1;
  function resizeReflection(w,h){
    if(w===reflectW && h===reflectH)return;
    reflectW=w;reflectH=h;reflectedView="";
    gl.bindTexture(gl.TEXTURE_2D,reflection);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
    for(const key of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,key,gl.LINEAR);
    for(const key of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,key,gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER,reflectedTarget);
    gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,reflection,0);
    gl.bindRenderbuffer(gl.RENDERBUFFER,reflectedDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,w,h);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,reflectedDepth);
  }
  let uploaded;
  return (data,camera,time)=>{
    const {axes,origin,eye,x,z,extent,light,rain}=camera;
    const atmosphere=sky[light]||sky.morning;
    const lightView=projection(atmosphere.sun,extent,x,z);
    const key=[light,x,z,extent].join("/");
    const epoch=Math.floor(time*2);
    const changed=data!==uploaded;
    gl.activeTexture(gl.TEXTURE0);
    if(changed){
      gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
      uploaded=data;
    }
    if(changed||key!==shadowView||epoch!==shadowEpoch){
      shadowView=key; shadowEpoch=epoch;
      gl.bindTexture(gl.TEXTURE_2D,null);
      gl.bindFramebuffer(gl.FRAMEBUFFER,target);
      gl.viewport(0,0,2048,2048);gl.clear(gl.DEPTH_BUFFER_BIT);
      transform(depth,lightView.axes,lightView.origin,time);
      gl.drawArrays(gl.TRIANGLES,0,data.length/VERTEX_FLOATS);
    }
    gl.activeTexture(gl.TEXTURE2);
    resizeReflection(Math.max(1,canvas.width>>1),Math.max(1,canvas.height>>1));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D,shadowMap);
    transform(beauty,axes,origin,time);
    const u=beauty.uniforms;
    [u.sunX,u.sunY,u.sunZ].forEach((location,i)=>gl.uniform3fv(location,lightView.axes[i]));
    gl.uniform3fv(u.shadowOffset,lightView.origin);
    gl.uniform3fv(u.sun,atmosphere.sun);gl.uniform3fv(u.sunColor,atmosphere.color);
    gl.uniform1f(u.rain,rain?1:0);gl.uniform1f(u.dusk,atmosphere.dusk);
    gl.uniform1i(u.shadows,0);gl.uniform1i(u.riverReflection,2);
    gl.uniform2f(u.resolution,canvas.width,canvas.height);
    gl.activeTexture(gl.TEXTURE2);
    const reflectionKey=[key,...eye,rain,loaded,canvas.width,canvas.height].join("/");
    if(changed || reflectionKey!==reflectedView || epoch!==reflectedEpoch){
      reflectedView=reflectionKey;reflectedEpoch=epoch;
      // Bind a separate complete texture while rendering into the reflection.
      gl.bindTexture(gl.TEXTURE_2D,shadowMap);
      gl.bindFramebuffer(gl.FRAMEBUFFER,reflectedTarget);
      gl.viewport(0,0,reflectW,reflectH);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform1i(u.mirror,1);gl.uniform3f(u.eyeDir,eye[0],-eye[1],eye[2]);
      gl.drawArrays(gl.TRIANGLES,0,data.length/VERTEX_FLOATS);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.uniform1i(u.mirror,0);gl.uniform3fv(u.eyeDir,eye);
    gl.bindTexture(gl.TEXTURE_2D,reflection);
    gl.drawArrays(gl.TRIANGLES,0,data.length/VERTEX_FLOATS);
  };
}
