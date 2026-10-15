/** A lightweight, hand-built WebGL sculpture — no CDN, no dependencies. */
const canvas = document.querySelector('#world-canvas');
const zone = document.querySelector('.sculpture-zone');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

function createSculpture() {
  if (!canvas || !zone) return;
  let gl;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'low-power' }); } catch (_) { return; }
  if (!gl) return;
  const vertex = `
    attribute vec3 a_pos;
    attribute vec3 a_normal;
    uniform mat4 u_mvp;
    uniform mat4 u_model;
    uniform float u_time;
    uniform float u_deform;
    varying vec3 v_normal;
    varying vec3 v_world;
    void main() {
      float ripple = sin(a_pos.y * 4.3 + u_time * 1.35) * sin(a_pos.x * 3.7 - u_time * 0.9);
      ripple += 0.6 * sin(a_pos.z * 6.2 + a_pos.x * 2.4 + u_time * 0.75);
      vec3 p = a_pos + a_normal * ripple * 0.064 * u_deform;
      vec4 world = u_model * vec4(p, 1.0);
      v_world = world.xyz;
      v_normal = normalize(mat3(u_model) * (a_normal + vec3(ripple * 0.018 * u_deform)));
      gl_Position = u_mvp * vec4(p, 1.0);
    }
  `;
  const fragment = `
    precision highp float;
    varying vec3 v_normal;
    varying vec3 v_world;
    uniform float u_material;
    uniform float u_time;
    uniform float u_mood;
    void main() {
      vec3 n = normalize(v_normal);
      vec3 eye = normalize(vec3(0.0, 0.0, 8.5) - v_world);
      vec3 light = normalize(vec3(-0.8, 1.2, 2.4));
      float diff = max(dot(n, light), 0.0) * 0.67 + 0.28;
      float rim = pow(1.0 - max(dot(n, eye), 0.0), 2.2);
      float spec = pow(max(dot(reflect(-light,n),eye),0.0), 27.0);
      float swirl = sin(v_world.y * 2.65 + v_world.x * 1.65 + u_time*.18) * .5 + .5;
      vec3 peach = vec3(.98,.72,.62);
      vec3 lilac = vec3(.67,.64,.88);
      vec3 cream = vec3(1.0,.91,.71);
      if (u_mood > .5 && u_mood < 1.5) { peach = vec3(.84,.68,.93); lilac=vec3(.69,.72,.94); cream=vec3(.98,.85,.94); }
      if (u_mood > 1.5) { peach = vec3(.77,.85,.62); lilac=vec3(.56,.76,.73); cream=vec3(.99,.88,.67); }
      vec3 col;
      if(u_material < .5) {
        col = mix(peach,lilac,clamp(.25 + (v_world.y+.5)*.22+swirl*.38,0.,1.));
        col = mix(col,cream, pow(max(dot(n,normalize(vec3(-.4,.8,1.))),0.),3.)*.52);
      } else if (u_material < 1.5) {
        col = mix(lilac,vec3(.96,.84,.92),.40 + .28*n.y);
      } else if (u_material < 2.5) {
        col = mix(cream,peach,.30 + .30*n.x);
      } else {
        col = mix(cream,vec3(.95,.77,.69),.30 + .30*n.y);
      }
      col *= diff;
      col += vec3(.87,.76,.88) * rim * .52;
      col += vec3(1.0,.96,.88) * spec * .7;
      col = pow(col, vec3(.90));
      gl_FragColor = vec4(clamp(col,0.,1.),1.);
    }
  `;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(shader) || 'shader');
    return shader;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(program) || 'link');
  } catch (error) { console.warn('3D artwork: CSS fallback active.', error); return; }
  gl.useProgram(program);
  const attr = { pos: gl.getAttribLocation(program, 'a_pos'), normal: gl.getAttribLocation(program, 'a_normal') };
  const uniform = {
    mvp: gl.getUniformLocation(program, 'u_mvp'), model: gl.getUniformLocation(program, 'u_model'),
    time: gl.getUniformLocation(program, 'u_time'), deform: gl.getUniformLocation(program, 'u_deform'),
    material: gl.getUniformLocation(program, 'u_material'), mood: gl.getUniformLocation(program, 'u_mood')
  };
  function buildMesh(vertices, normals, indices) {
    const position = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,position); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    const normal = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,normal); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(normals),gl.STATIC_DRAW);
    const index = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    return { position,normal,index,count:indices.length };
  }
  function sphere(radius=1.0, cols=64, rows=48) {
    const p=[],n=[],idx=[];
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
      const theta=y/rows*Math.PI,phi=x/cols*Math.PI*2;
      const nx=Math.sin(theta)*Math.cos(phi),ny=Math.cos(theta),nz=Math.sin(theta)*Math.sin(phi);
      p.push(nx*radius,ny*radius,nz*radius);n.push(nx,ny,nz);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x,b=a+cols+1;
      idx.push(a,a+1,b,b,a+1,b+1);
    }
    return buildMesh(p,n,idx);
  }
  function torus(radius=1.98,tube=.21,cols=144,rows=24){
    const p=[],n=[],idx=[];
    for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
      const u=x/cols*Math.PI*2,v=y/rows*Math.PI*2;
      const cv=Math.cos(v),su=Math.sin(u),cu=Math.cos(u),sv=Math.sin(v);
      p.push((radius+tube*cv)*cu,(radius+tube*cv)*su,tube*sv);
      n.push(cv*cu,cv*su,sv);
    }
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const a=y*(cols+1)+x,b=a+cols+1;
      idx.push(a,a+1,b,b,a+1,b+1);
    }
    return buildMesh(p,n,idx);
  }
  const meshOrb=sphere(1.58), meshRing=torus(), meshRing2=torus(2.12,.12), meshSeed=sphere(.22,20,16);
  // Explicit column-major matrices, applied from right to left.
  const I=()=>new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
  function multiply(a,b){const m=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)m[c*4+r]+=a[k*4+r]*b[c*4+k];return m;}
  function rx(t){const m=I(),c=Math.cos(t),s=Math.sin(t);m[5]=c;m[6]=s;m[9]=-s;m[10]=c;return m;}
  function ry(t){const m=I(),c=Math.cos(t),s=Math.sin(t);m[0]=c;m[2]=-s;m[8]=s;m[10]=c;return m;}
  function rz(t){const m=I(),c=Math.cos(t),s=Math.sin(t);m[0]=c;m[1]=s;m[4]=-s;m[5]=c;return m;}
  function translate(x,y,z){const m=I();m[12]=x;m[13]=y;m[14]=z;return m;}
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),m=new Float32Array(16);m[0]=f/aspect;m[5]=f;m[10]=(far+near)/(near-far);m[11]=-1;m[14]=2*far*near/(near-far);return m;}
  const view=translate(0,0,-8.15);
  const mouse={x:0,y:0,tx:0,ty:0,drag:false,last:0};
  let spin=0,visible=true,frameId=0,phase=0,lastFrame=0,stillFrame=false;
  const smallScreen=matchMedia('(max-width: 650px)');
  function resize() {
    const rect=canvas.getBoundingClientRect();
    const dpr=Math.min(devicePixelRatio||1,smallScreen.matches?1.5:1.8);
    const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  }
  function drawMesh(mesh,model,mat,deform,time,pv){
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.position);gl.enableVertexAttribArray(attr.pos);gl.vertexAttribPointer(attr.pos,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ARRAY_BUFFER,mesh.normal);gl.enableVertexAttribArray(attr.normal);gl.vertexAttribPointer(attr.normal,3,gl.FLOAT,false,0,0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.index);
    gl.uniformMatrix4fv(uniform.model,false,model);
    gl.uniformMatrix4fv(uniform.mvp,false,multiply(pv,model));
    gl.uniform1f(uniform.material,mat);gl.uniform1f(uniform.deform,deform);gl.uniform1f(uniform.time,time);
    gl.drawElements(gl.TRIANGLES,mesh.count,gl.UNSIGNED_SHORT,0);
  }
  function render(ms){
    frameId=0;
    if(!visible || document.hidden)return;
    if(!reduceMotion.matches && smallScreen.matches && ms-lastFrame<31){frameId=requestAnimationFrame(render);return;}
    lastFrame=ms;
    resize();
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    mouse.x+=(mouse.tx-mouse.x)*.075;mouse.y+=(mouse.ty-mouse.y)*.075;
    const t=reduceMotion.matches ? 0 : ms*.001;
    const ratio=canvas.width/canvas.height;
    const pv=multiply(perspective(40*Math.PI/180,ratio,.1,50),view);
    const palette={apricot:0,lavender:1,mint:2};
    gl.uniform1f(uniform.mood,palette[document.body.dataset.sky]??0);
    const overall=multiply(ry(t*.105+mouse.x*.45+spin),multiply(rx(-.2+mouse.y*.31),rz(.11)));
    const bob=translate(0,reduceMotion.matches?0:Math.sin(t*.86)*.12,0);
    const core=multiply(bob,overall);
    drawMesh(meshRing2,multiply(core,multiply(rx(1.12),ry(t*.11))),2,0,t,pv);
    drawMesh(meshRing,multiply(core,multiply(rx(.52),ry(-.65))),1,0,t,pv);
    drawMesh(meshOrb,multiply(core,ry(t*.11)),0,1,t,pv);
    const seed1=multiply(core,translate(Math.cos(t*.55+1)*2.1,Math.sin(t*.6)*.7,Math.sin(t*.55+1)*1.0));
    drawMesh(meshSeed,seed1,3,0,t,pv);
    const seed2=multiply(core,translate(Math.cos(t*.45+4)*1.95,Math.sin(t*.6+2)*1.1,Math.sin(t*.45+4)*1.0));
    drawMesh(meshSeed,seed2,2,0,t,pv);
    stillFrame=true;
    if(!reduceMotion.matches)frameId=requestAnimationFrame(render);
  }
  function wake(){if(!frameId && visible){frameId=requestAnimationFrame(render)}}
  function setPointer(clientX,clientY){const rect=canvas.getBoundingClientRect();mouse.tx=Math.max(-1,Math.min(1,2*(clientX-rect.left)/rect.width-1));mouse.ty=Math.max(-1,Math.min(1,2*(clientY-rect.top)/rect.height-1));if(reduceMotion.matches)wake();}
  canvas.addEventListener('pointerdown',event=>{mouse.drag=true;mouse.last=event.clientX;});
  canvas.addEventListener('pointerup',()=>{mouse.drag=false});
  canvas.addEventListener('pointercancel',()=>{mouse.drag=false});
  canvas.addEventListener('pointerleave',()=>{mouse.drag=false;mouse.tx=0;mouse.ty=0});
  canvas.addEventListener('pointermove',event=>{setPointer(event.clientX,event.clientY);if(mouse.drag){spin+=(event.clientX-mouse.last)*.008;mouse.last=event.clientX;}});
  canvas.addEventListener('thach:reimagine',()=>{spin+=1.25;wake()});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();visible=false;cancelAnimationFrame(frameId);frameId=0;zone.classList.remove('webgl-ready')});
  canvas.addEventListener('webglcontextrestored',()=>{location.reload()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)wake()});
  if('IntersectionObserver' in window){const obs=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{cancelAnimationFrame(frameId);frameId=0;}},{threshold:.01});obs.observe(canvas);}
  if('ResizeObserver' in window){new ResizeObserver(()=>{resize();if(reduceMotion.matches)wake()}).observe(canvas)}
  if(reduceMotion.addEventListener)reduceMotion.addEventListener('change',wake);
  // Hide the fallback only after geometry and shaders are ready to draw.
  zone.classList.add('webgl-ready');
  wake();
}
try{createSculpture()}catch(error){console.warn('3D artwork: using the CSS alternative.',error);zone?.classList.remove('webgl-ready')}
