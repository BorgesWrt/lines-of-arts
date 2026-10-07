export const CONTACT_EMAIL='andreyzh24@gmail.com';
export function feedbackMailto({name,email,message}){
 return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('lines-of-arts · '+name)}&body=${encodeURIComponent(`${message}\n\n${name}\n${email}`)}`;
}
export function feedbackGmail(data){
 const draft=new URL(feedbackMailto(data));
 return 'https://mail.google.com/mail/?'+new URLSearchParams({view:'cm',fs:'1',to:CONTACT_EMAIL,su:draft.searchParams.get('subject'),body:draft.searchParams.get('body')});
}
