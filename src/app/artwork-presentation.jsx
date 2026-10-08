import React,{useState} from 'react';
export default function ArtworkPresentation({painting,Image,children}){
 const [portrait,setPortrait]=useState(false);
 return <figure className={`artwork-presentation ${portrait?'portrait':'landscape'}`}>
  <figcaption>{children}</figcaption>
  <div className="presentation-image"><Image painting={painting} onLoad={event=>setPortrait(event.currentTarget.naturalHeight>event.currentTarget.naturalWidth*1.1)}/></div>
 </figure>;
}
