const form=document.querySelector('#pledgeForm'),count=document.querySelector('#pledgeCount'),success=document.querySelector('#successState'),statusNode=document.querySelector('#formStatus');
const FALLBACK_COUNT=12840;
const format=n=>new Intl.NumberFormat('en-IN').format(Number(n)||0);
let displayed=0;function showCount(n){const target=Number(n)||0;const start=displayed;const delta=target-start;const started=performance.now();function tick(now){const progress=Math.min((now-started)/900,1);displayed=Math.round(start+delta*(1-Math.pow(1-progress,3)));count.textContent=format(displayed);if(progress<1)requestAnimationFrame(tick);else displayed=target;};requestAnimationFrame(tick);const s=document.querySelector('#successCount');if(s)s.textContent=format(target)}
async function refresh(){try{const r=await fetch('/api/pledges',{cache:'no-store'});if(!r.ok)throw Error();const value=Number((await r.json()).count);showCount(value>0?value:FALLBACK_COUNT)}catch{if(displayed===0)showCount(FALLBACK_COUNT)}}
form.addEventListener('submit',async e=>{e.preventDefault();statusNode.textContent='';form.querySelectorAll('.field').forEach(x=>{x.classList.remove('invalid');x.querySelector('small').textContent=''});
const data=Object.fromEntries(new FormData(form));data.consent=form.elements.consent.checked;const bad=[];if(!data.name||data.name.trim().length<2)bad.push(['name','Please enter your full name.']);if(!/^[+()\d\s-]{8,18}$/.test(data.phone||''))bad.push(['phone','Enter a valid mobile number.']);if(data.email&&!form.elements.email.validity.valid)bad.push(['email','Enter a valid email address.']);if(!data.city?.trim())bad.push(['city','Please enter your city.']);bad.forEach(([n,m])=>{const f=form.elements[n].closest('.field');f.classList.add('invalid');f.querySelector('small').textContent=m});if(!data.consent)statusNode.textContent='Please accept the pledge to continue.';if(bad.length||!data.consent)return;
const btn=form.querySelector('.submit');btn.disabled=true;btn.textContent='Adding your pledge…';try{const r=await fetch('/api/pledges',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}),v=await r.json();if(!r.ok)throw Error(v.message);showCount(v.count);form.hidden=true;success.hidden=false}catch(err){statusNode.textContent=err.message||'We could not save your pledge. Please try again.'}finally{btn.disabled=false;btn.innerHTML='Confirm my pledge <span>↗</span>'}});
document.querySelector('#pledgeAgain').addEventListener('click',()=>{form.reset();success.hidden=true;form.hidden=false;form.elements.name.focus()});document.querySelector('#year').textContent=new Date().getFullYear();showCount(FALLBACK_COUNT);setTimeout(refresh,1100);setInterval(refresh,30000);
document.addEventListener('DOMContentLoaded',()=>{
  const rtbLabels=['Sustainable & natural Emulsion','Recycled packaging','Air Purification Tech','High Sheen'];
  const rtbIcons=['sustainable & natural emulsion.png','recycle packaging.png','air purification tech.png','high sheen.png'];
  document.querySelectorAll('.product-points article').forEach((article,i)=>{
    const title=article.querySelector('h3'); if(title&&rtbLabels[i]) title.textContent=rtbLabels[i];
    const icon=article.querySelector('b'); if(icon&&rtbIcons[i]) icon.innerHTML=`<img src="assets/${rtbIcons[i]}" alt="" aria-hidden="true">`;
  });
  const kv=document.querySelector('.kv-banner'), impact=document.querySelector('.impact');
  if(kv&&impact) impact.parentNode.insertBefore(kv,impact);
});
