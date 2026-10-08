import React from 'react';
export function SpectrumTrack({group,density,x,y}) {
 const m=group.movement;const row=y(group.y);
 return <g opacity={1-group.openness} className="spectrum-track">
  {density.start<m.start&&<line x1={x(density.start)} x2={x(m.start)} y1={row} y2={row} stroke={m.color} strokeOpacity=".55" strokeWidth="1" strokeDasharray="3 5"/>}
  {density.end>m.end&&<line x1={x(m.end)} x2={x(density.end)} y1={row} y2={row} stroke={m.color} strokeOpacity=".55" strokeWidth="1" strokeDasharray="3 5"/>}
  <rect x={x(m.start)} y={row-4} width={Math.max(0,x(m.end)-x(m.start))} height="8" rx="4" fill={m.color} fillOpacity=".13"/>
  <line x1={x(m.start)} x2={x(m.end)} y1={row} y2={row} stroke={m.color} strokeOpacity=".8" strokeWidth="1.5"/>
  {[m.start,m.end].map(year=><circle key={year} cx={x(year)} cy={row} r="2.5" fill={m.color}/>)}
 </g>;
}
export function SpectrumBins({group,density,maximum,x,y,width,height,onHover,onLeave,onOpen}) {
 const m=group.movement;const baseline=y(group.y);
 if(baseline<100||baseline>height-42)return null;
 return density.bins.map(bin=>{
  const center=x((bin.start+bin.end)/2);
  if(center<20||center>width-20)return null;
  const barWidth=Math.max(3,Math.min(12,(x(bin.end)-x(bin.start))*.55));
  const barHeight=3+25*bin.count/maximum;
  const outside=(bin.start+bin.end)/2<m.start||(bin.start+bin.end)/2>m.end;
  const hover=()=>onHover({kind:'density',title:m.title,from:bin.start,to:bin.end-1,count:bin.count,x:center,y:baseline-barHeight-14});
  return <button key={`${m.id}-${bin.start}`} className={`spectrum-bin ${outside?'outside':''}`} style={{left:center,top:baseline-barHeight-9,width:Math.max(16,barWidth),height:barHeight+9,opacity:1-group.openness,'--color':m.color,'--bar-width':`${barWidth}px`,'--bar-height':`${barHeight}px`}} aria-label={`${m.title} · ${bin.start}–${bin.end-1} · ${bin.count}`} onMouseEnter={hover} onMouseLeave={onLeave} onFocus={hover} onBlur={onLeave} onClick={()=>onOpen(m.id)}><i/></button>;
 });
}
