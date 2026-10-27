(() => {
if (customElements.get('me-cinema')) return;
const COLS=['#F04A55','#F04A55','#F7B32E','#F7B32E','#E07A2C','#E07A2C','#4F86F0','#4F86F0','#F4F2EF'];
const N=96;
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const sm=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const cl=t=>t<0?0:t>1?1:t;
function cubic(a,b,c,d,t){const m=1-t;return[m*m*m*a[0]+3*m*m*t*b[0]+3*m*t*t*c[0]+t*t*t*d[0],m*m*m*a[1]+3*m*m*t*b[1]+3*m*t*t*c[1]+t*t*t*d[1]]}
function resample(p,n){const L=[0];for(let i=1;i<p.length;i++)L.push(L[i-1]+Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));const T=L[L.length-1]||1,o=[];let k=1;
  for(let j=0;j<n;j++){const s=T*j/(n-1);while(k<p.length-1&&L[k]<s)k++;const a=p[k-1],b=p[k],seg=(L[k]-L[k-1])||1,f=Math.min(1,Math.max(0,(s-L[k-1])/seg));o.push([a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]);}return o;}
function offset(p,d){return p.map((q,i)=>{const a=p[Math.max(0,i-1)],b=p[Math.min(p.length-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const l=Math.hypot(tx,ty)||1;return[q[0]-ty/l*d,q[1]+tx/l*d]})}
const LOGO={L:[[4,74],[24,74],[30,34],[60,34],[80,34],[93,46],[100,58]],R:[[196,74],[176,74],[170,34],[140,34],[120,34],[107,46],[100,58]],V:[[44,48],[66,56],[92,82],[100,108],[108,82],[134,56],[156,48]]};
const LOGOP={};for(const k in LOGO){const P=LOGO[k],o=[];for(let s=0;s<2;s++){const b=s*3;for(let i=0;i<=40;i++)o.push(cubic(P[b],P[b+1],P[b+2],P[b+3],i/40));}LOGOP[k]=resample(o,N);}
class MeCinema extends HTMLElement{
  connectedCallback(){
    Object.assign(this.style,{position:'fixed',inset:'0',zIndex:'0',pointerEvents:'none',display:'block'});
    this.c=document.createElement('canvas');Object.assign(this.c.style,{width:'100%',height:'100%',display:'block'});
    this.appendChild(this.c);this.g=this.c.getContext('2d');
    this.reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
    const R=rng(5);this.cables=[];
    for(let i=0;i<170;i++){const col=COLS[Math.floor(R()*COLS.length)];
      const grp=col==='#4F86F0'?'L':col==='#F7B32E'?'R':col==='#F4F2EF'?['L','R','V'][Math.floor(R()*3)]:'V';
      this.cables.push({u:R(),v:R(),k:R(),col,grp,w:.6+Math.pow(R(),3)*2.8,a:.45+R()*.45,ph:R()*Math.PI*2,delay:R()*1.4,dot:R()<.14,len:.15+R()*.5,sl:-.05+R()*.2});}
    this.cables.sort((a,b)=>b.w-a.w);
    this.bimg=new Image();this.bimg.onload=()=>this.buildBuilding();this.bimg.src=this.getAttribute('building-src')||'assets/rplx/render-cutout.png';
    this.onR=()=>this.build();addEventListener('resize',this.onR);this.build();
    this.t0=performance.now();const f=now=>{this.draw((now-this.t0)/1000);this.raf=requestAnimationFrame(f)};this.raf=requestAnimationFrame(f);
  }
  disconnectedCallback(){removeEventListener('resize',this.onR);cancelAnimationFrame(this.raf);}
  build(){
    const W=innerWidth,H=innerHeight,dpr=Math.min(2,devicePixelRatio||1);this.W=W;this.H=H;
    this.c.width=W*dpr;this.c.height=H*dpr;this.g.setTransform(dpr,0,0,dpr,0,0);
    const xs=j=>-.08*W+j/(N-1)*1.16*W,wide=W>900;
    const R=rng(9),bl=[];let x=-.1*W;const unit=Math.max(30,W/28);
    while(x<1.1*W){const w=unit*(1+Math.floor(R()*2.6)),tw=R()<.18;bl.push([x,x+w,H*.95-(H*(.14+R()*.3)+(tw?H*.18:0))]);x+=w+unit*.22;}
    const topAt=x=>{for(const b of bl)if(x>=b[0]&&x<b[1])return b[2];return H*.93;};
    const sky=j=>{const x=xs(j);return(topAt(x-10)+topAt(x)+topAt(x+10))/3;};
    const skyT=[];for(let j=0;j<N;j++)skyT.push(sky(j));
    const ls=Math.min(W*(wide?.46:.8)/224,H*.34/120),lox=W/2-100*ls,loy=H*.33-70*ls;
    const cx=wide?W*.72:W*.5,base=Math.min(W*(wide?.22:.5),H*.4),gr=H*.94,tp=H*.14;
    const wAt=y=>{const f=(gr-y)/(gr-tp);let w=sm((f-.4)/.05)*-.3+1;if(f>.68)w=.7-.26*sm((f-.68)/.05);return base*w;};
    this.S={flow:[],ground:[],tower:[],skyline:[],logo:[]};
    for(const c of this.cables){
      const fl=[],gd=[],sk=[];
      for(let j=0;j<N;j++){const f=j/(N-1),x=xs(j);
        const band=H*.3*(.65+.35*Math.sin(f*Math.PI*2+1));
        const lift=wide?sm((f-.35)/.5)*H*.42:0;fl.push([x,H*.9-lift+(c.u-.5)*band*(wide?.5+f*.6:.45)+Math.sin(f*Math.PI*2.4+c.u*1.2)*H*(wide?.06:.025)]);
        gd.push([x,H*.93-c.u*H*.13+Math.sin(f*Math.PI*3+c.u*4)*H*.01]);
        sk.push([x,Math.min(skyT[j]+c.u*H*.55,H*.95-2-(c.u*60)%10)]);}
      let tw=[];const g2=gr-c.v*H*.14;
      if(c.k<.12){for(let j=0;j<N;j++)tw.push([xs(j),g2]);}
      else{const lv=c.k<.3?.42:c.k<.48?.7:1;
        const yE=lv<1?gr-(gr-tp)*(lv-.03-c.v*.03):tp-(1-Math.abs(c.u-.5)*2)*H*.05;
        const xb=cx-base/2+c.u*base,r=20+c.v*40,p=[[-.08*W,g2],[xb-r,g2]];
        for(let k=1;k<=8;k++){const a=Math.PI/2*k/8;p.push([xb-r+Math.sin(a)*r,g2-(1-Math.cos(a))*r]);}
        let lx=xb;for(let y=g2-r;y>yE;y-=8){const w=wAt(y);lx=cx-w/2+c.u*w;p.push([lx,y]);}
        const r2=18+c.v*30;for(let k=1;k<=8;k++){const a=Math.PI/2*k/8;p.push([lx+(1-Math.cos(a))*r2,Math.max(H*.06,yE-Math.sin(a)*r2*.6)]);}
        const sx=lx+r2,sy=Math.max(H*.06,yE-r2*.6),L=W*c.len;
        for(let x=sx;x<Math.min(W+40,sx+L);x+=10){const d=x-sx;p.push([x,Math.max(H*.06,sy-d*c.sl+Math.sin(d*.015+c.ph)*10*Math.min(1,d/80))]);}
        tw=resample(p,N);}
      const lg=offset(LOGOP[c.grp],(c.u-.5)*15).map(q=>[lox+q[0]*ls,loy+q[1]*ls]);
      this.S.flow.push(fl);this.S.ground.push(gd);this.S.tower.push(tw);this.S.skyline.push(sk);this.S.logo.push(lg);
    }
  }
  buildBuilding(){
    const im=this.bimg,w=200,h=Math.round(200*im.height/im.width),cv=document.createElement('canvas');cv.width=w;cv.height=h;
    const g=cv.getContext('2d');g.drawImage(im,0,0,w,h);const d=g.getImageData(0,0,w,h).data,A=(x,y)=>d[(y*w+x)*4+3]>60;
    this.BN=this.cables.map(c=>{const pts=[];
      if(c.k<.68){let y=Math.floor((.05+c.u*.86)*h),xl=-1,xr=-1;
        for(let t=0;t<12&&xl<0;t++,y=Math.min(h-1,y+1)){for(let x=0;x<w;x++)if(A(x,y)){if(xl<0)xl=x;xr=x;}}
        if(xl<0){xl=w*.3;xr=w*.7;}
        for(let j=0;j<N;j++){const f=j/(N-1);pts.push([(xl+(xr-xl)*f)/w,y/h]);}}
      else{let x=Math.floor((.12+c.u*.8)*w),yt=-1,yb=-1;
        for(let y=0;y<h;y++)if(A(x,y)){if(yt<0)yt=y;yb=y;}
        if(yt<0){yt=h*.2;yb=h*.9;}
        for(let j=0;j<N;j++){const f=j/(N-1);pts.push([x/w,(yb+(yt-yb)*f)/h]);}}
      return pts;});
  }
  shape(name){
    if(name!=='building')return this.S[name]||this.S.flow;
    const el=document.querySelector('[data-cable-target]');if(!this.BN||!el)return this.S.tower;
    const r=el.getBoundingClientRect();return this.BN.map(p=>p.map(q=>[r.left+q[0]*r.width,r.top+q[1]*r.height]));
  }
  state(){
    const secs=[...document.querySelectorAll('[data-cable]')],mid=this.H*.5;
    if(!secs.length)return{a:'flow',b:'flow',t:0,da:1,db:1};
    let i=0;for(let k=0;k<secs.length;k++){if(secs[k].getBoundingClientRect().top<=mid)i=k;}
    const r=secs[i].getBoundingClientRect(),j=Math.min(secs.length-1,i+1);
    const fr=(mid-r.top)/Math.max(1,r.height),ms=+(secs[i].dataset.morph||.55),t=i===j?0:sm((fr-ms)/(1-ms));
    return{a:secs[i].dataset.cable,b:secs[j].dataset.cable,t,da:+(secs[i].dataset.dim||1),db:+(secs[j].dataset.dim||1)};
  }
  draw(time){
    const g=this.g,W=this.W,H=this.H;g.clearRect(0,0,W,H);
    const s=this.state();this.c.style.opacity=(s.da+(s.db-s.da)*s.t).toFixed(3);
    const A=this.shape(s.a),B=this.shape(s.b),tw=this.reduce?0:time;
    g.lineCap='round';g.lineJoin='round';
    const isLogo=k=>(k==='logo'?1:k==='building'?.6:0),lw=isLogo(s.a)+(isLogo(s.b)-isLogo(s.a))*s.t;
    this.cables.forEach((c,ci)=>{
      const e=this.reduce?1:1-Math.pow(1-cl((time-c.delay)/2.6),3);const end=Math.floor(N*e);if(end<2)return;
      const tt=sm(cl(s.t*1.3-c.delay*.2)),pa=A[ci],pb=B[ci],amp=(2+c.u*3)*(1-lw*.75);
      g.strokeStyle=c.col;g.globalAlpha=c.a;g.lineWidth=c.w*(1+lw*.4);g.beginPath();
      let px,py,qx,qy;
      for(let j=0;j<end;j++){const x=pa[j][0]+(pb[j][0]-pa[j][0])*tt,y=pa[j][1]+(pb[j][1]-pa[j][1])*tt+Math.sin(j*.18+tw*1.2+c.ph)*amp;
        if(j===0){g.moveTo(x,y);}else{g.quadraticCurveTo(px,py,(px+x)/2,(py+y)/2);}px=x;py=y;}
      g.lineTo(px,py);g.stroke();
      if(c.dot||e<1){g.globalAlpha=Math.min(1,c.a+.3);g.fillStyle=c.col;g.beginPath();g.arc(px,py,c.w+1.2,0,Math.PI*2);g.fill();}
    });
    g.globalAlpha=1;
  }
}
customElements.define('me-cinema',MeCinema);
})();
