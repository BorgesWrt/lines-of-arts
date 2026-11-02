import React,{useContext} from 'react';
import {LocaleContext,translate} from '../utils/i18n.js';
export default function Feedback(){
 const locale=useContext(LocaleContext);
 const soon={ru:'Канал проекта скоро появится',en:'Project channel coming soon',es:'Próximamente: canal del proyecto',de:'Projektkanal folgt in Kürze'};
 return <div className="dialog-content feedback-content"><h2>{translate('Обратная связь',locale)}</h2><a className="contact-email" href="https://t.me/andrey_2410" target="_blank" rel="noreferrer">Telegram · @andrey_2410 ↗</a><p>{soon[locale]}</p></div>;
}
