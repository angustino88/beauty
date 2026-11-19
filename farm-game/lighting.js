// Native WebGL2 renderer. Both passes share the same triangles and world coordinates.
function createFarmRenderer(canvas) {
  const gl = canvas.getContext("webgl2", { antialias: true, alpha: true });
  if (!gl) return null;
  const vertex = `#version 300 es
    layout(location=0) in vec3 position;
    layout(location=1) in vec3 color;
    uniform vec3 viewX, viewY, viewZ, offset;
    out vec3 point, tint;
    void main(){
      point=position; tint=color;
      gl_Position=vec4(vec3(dot(position,viewX),dot(position,viewY),dot(position,viewZ))+offset,1.);
    }`;
  const fragment = `#version 300 es
    precision highp float;
    in vec3 point,tint;
    uniform vec3 sunX,sunY,sunZ;
    uniform sampler2D shadows;
    out vec4 pixel;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){
      vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+1.),f.x),f.y);
    }
    void main(){
      vec3 n=normalize(cross(dFdx(point),dFdy(point)));
      vec3 sun=normalize(vec3(-.62,1.,.45));
      vec3 uv=vec3(dot(point,sunX),dot(point,sunY),dot(point,sunZ))*.5+.5;
      float light=0.;
      for(int x=-1;x<=1;x++)for(int y=-1;y<=1;y++){
        float depth=texture(shadows,uv.xy+vec2(x,y)/1536.).r;
        light+=step(uv.z-.0016,depth)/9.;
      }
      float diffuse=max(dot(n,sun),0.);
      vec3 shade=mix(vec3(.69,.77,.83),vec3(1.03,1.,.93),light*diffuse);
      vec3 surface=tint;
      if(point.y<.09){
        float mottling=noise(point.xz*1.3)*.13+noise(point.xz*5.)*.09;
        surface*=.87+mottling;
        if(tint.g>tint.r && tint.g>tint.b*1.2){
          surface+=vec3(.038,.016,-.019)*noise(point.xz*.45);
          surface*=1.-.11*step(.86,hash(floor(point.xz*20.)));
        }
      }
      pixel=vec4(surface*(shade+.13*max(n.y,0.)),1.);
    }`;
  function program(fs) {
    const p=gl.createProgram();
    for(const [type,source] of [[gl.VERTEX_SHADER,vertex],[gl.FRAGMENT_SHADER,fs]]) {
      const shader=gl.createShader(type);
      gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader));
      gl.attachShader(p,shader);
    }
    gl.linkProgram(p);
    if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p));
    return p;
  }
  const beauty=program(fragment);
  const depth=program('#version 300 es\nprecision highp float;void main(){}');
  const buffer=gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  for(let i=0;i<2;i++){
    gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,3,gl.FLOAT,false,24,i*12);
  }
  const shadowMap=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,shadowMap);
  gl.texStorage2D(gl.TEXTURE_2D,1,gl.DEPTH_COMPONENT24,1536,1536);
  for(const prop of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,prop,gl.NEAREST);
  for(const prop of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,prop,gl.CLAMP_TO_EDGE);
  const target=gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER,target);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,shadowMap,0);
  gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
  gl.enable(gl.DEPTH_TEST);
  const sun=[[.014,0,.019],[.016,.015,-.012],[.009,-.015,-.007]];
  function transform(p,axes,offset){
    gl.useProgram(p);
    ['viewX','viewY','viewZ'].forEach((name,i)=>gl.uniform3fv(gl.getUniformLocation(p,name),axes[i]));
    gl.uniform3fv(gl.getUniformLocation(p,'offset'),offset);
  }
  let uploaded;
  return (data,axes,offset)=>{
    if(data!==uploaded){
      uploaded=data;
      gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);
      gl.bindTexture(gl.TEXTURE_2D,null);
      gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.viewport(0,0,1536,1536);
      gl.clear(gl.DEPTH_BUFFER_BIT);transform(depth,sun,[0,0,0]);
      gl.drawArrays(gl.TRIANGLES,0,data.length/6);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    transform(beauty,axes,offset);
    ['sunX','sunY','sunZ'].forEach((name,i)=>gl.uniform3fv(gl.getUniformLocation(beauty,name),sun[i]));
    gl.bindTexture(gl.TEXTURE_2D,shadowMap);gl.drawArrays(gl.TRIANGLES,0,data.length/6);
  };
}
