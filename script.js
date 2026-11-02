const jobInput=document.querySelector('#job-input');
const resumeInput=document.querySelector('#resume-input');
const analyzeButton=document.querySelector('#analyze-button');
const results=document.querySelector('#results');
let toastTimer;

const samples={job:`Pessoa Desenvolvedora Front-end Jr — React e TypeScript

Estamos buscando uma pessoa desenvolvedora front-end para criar interfaces digitais acessíveis, responsivas e de alta qualidade.

Responsabilidades:
• Desenvolver interfaces com React e TypeScript
• Criar componentes reutilizáveis e colaborar com design no Figma
• Integrar APIs REST e trabalhar com Git em equipe
• Garantir responsividade, acessibilidade e qualidade de código

Requisitos:
• HTML, CSS, JavaScript, React e TypeScript
• Familiaridade com testes automatizados e metodologias ágeis
• Comunicação, trabalho em equipe e vontade de aprender
• Diferencial: Next.js, design systems e testes com Jest` ,resume:`ALBERICO JUNIOR
Desenvolvedor Front-end Jr
Recife, PE | alberico@email.com | linkedin.com/in/albericojr | github.com/albericojr

RESUMO PROFISSIONAL
Estudante de Sistemas de Informação com experiência em projetos pessoais de desenvolvimento web e mobile. Interesse em criar interfaces intuitivas e acessíveis, trabalhando com React, JavaScript e TypeScript.

PROJETOS
Portfólio pessoal — React, Next.js, Tailwind CSS
Desenvolvimento de site responsivo para apresentar projetos, habilidades e canais de contato.

Aplicativo UpFit — React Native, Expo, TypeScript
Aplicativo de acompanhamento de treinos com autenticação, registro de progresso e modo escuro.

HABILIDADES
React, JavaScript, TypeScript, HTML, CSS, Next.js, React Native, Git, GitHub, Figma, Tailwind CSS

FORMAÇÃO
Sistemas de Informação — Em andamento
`};

const synonyms={javascript:['javascript','js','ecmascript'],typescript:['typescript','ts'],react:['react','react.js','reactjs'],reactnative:['react native','react-native'],html:['html','html5'],css:['css','css3','tailwind css','sass'],git:['git','github','versionamento'],figma:['figma'],acessibilidade:['acessibilidade','accessibility','wcag','a11y'],responsividade:['responsividade','responsivo','responsive'],api:['apis rest','api rest','rest api','apis','integração de api'],testes:['testes automatizados','testes','jest','testing'],nextjs:['next.js','nextjs'],comunicacao:['comunicação','comunicação clara'],equipe:['trabalho em equipe','equipe','colaboração'],agil:['metodologias ágeis','ágil','scrum','kanban'],designsystem:['design system','design systems'],figma:['figma'],componentes:['componentes reutilizáveis','componentes'],java:['java'],python:['python'],sql:['sql'],node:['node.js','nodejs','node'],lideranca:['liderança','liderar'],gestao:['gestão de projetos','gestão'],ingles:['inglês','english'],cloud:['aws','azure','cloud']};
const canonical={javascript:'JavaScript',typescript:'TypeScript',react:'React',reactnative:'React Native',html:'HTML',css:'CSS',git:'Git / GitHub',figma:'Figma',acessibilidade:'Acessibilidade',responsividade:'Responsividade',api:'APIs REST',testes:'Testes automatizados',nextjs:'Next.js',comunicacao:'Comunicação',equipe:'Trabalho em equipe',agil:'Metodologias ágeis',designsystem:'Design system',componentes:'Componentes reutilizáveis',java:'Java',python:'Python',sql:'SQL',node:'Node.js',lideranca:'Liderança',gestao:'Gestão de projetos',ingles:'Inglês',cloud:'Cloud'};
const stopWords=new Set('a ao aos as o os de da das do dos em na nas no nos por para com sem sob sobre e ou que se um uma umas uns sua seu suas seus como mais menos muito pela pelo pelas pelos este esta esse essa isso ele ela eles elas ser ter estar foi são está estão tem temos será pode podem experiência anos ano conhecimento domínio desejável diferencial buscamos pessoa profissional responsabilidades requisitos qualificações trabalho vaga perfil habilidade habilidades cursando formado formado superior graduação'.split(' '));

function normalized(text){return text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function words(text){return normalized(text).replace(/[^a-z0-9+#.\s-]/g,' ').split(/\s+/).filter(w=>w.length>2&&!stopWords.has(w))}
function extractKeywords(job,resume){
  const clean=normalized(job),resumeClean=normalized(resume),found=[];
  Object.keys(canonical).forEach(key=>{const aliases=synonyms[key]||[key];if(aliases.some(a=>clean.includes(normalized(a)))&&!found.includes(key))found.push(key)});
  const frequency=new Map();
  const tokens=words(job);
  tokens.forEach((word,i)=>{if(word.length<4||stopWords.has(word))return;const phrase=word;if(!frequency.has(phrase))frequency.set(phrase,0);frequency.set(phrase,frequency.get(phrase)+1);
    const pair=tokens[i+1]?`${word} ${tokens[i+1]}`:'';if(pair&&pair.length>7&&!stopWords.has(tokens[i+1])){frequency.set(pair,(frequency.get(pair)||0)+1)}
  });
  [...frequency.entries()].filter(([term,count])=>count>1&&term.includes(' ')).sort((a,b)=>b[1]-a[1]).slice(0,7).forEach(([term])=>{if(!found.some(k=>normalized(canonical[k])===term))found.push(term)});
  return found.slice(0,18).map(k=>{const label=canonical[k]||k.replace(/\b\w/g,c=>c.toUpperCase());const aliases=synonyms[k]||[k];return{label,matched:aliases.some(a=>resumeClean.includes(normalized(a)))||resumeClean.includes(normalized(label))}});
}
function organizeResume(raw){
  const lines=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const headingSet=['resumo profissional','objetivo','experiência profissional','experiencia profissional','experiência','experiencia','projetos','formação','formacao','educação','educacao','habilidades','competências','competencias','certificações','certificacoes','idiomas','contato'];
  const output=[];let currentHeading='';
  lines.forEach((line,index)=>{
    const clean=line.replace(/^#{1,6}\s*/, '').replace(/^[•*-]\s*/, '');
    const normalizedLine=normalized(clean).replace(/:$/,'');
    const isHeading=headingSet.includes(normalizedLine);
    if(isHeading){if(output.length)output.push('');currentHeading=clean.toUpperCase();output.push(currentHeading);return}
    if(index===0){output.push(clean.toUpperCase());return}
    if(index===1&&!currentHeading){output.push(clean);return}
    output.push(clean);
  });
  return output.join('\n').trim();
}
function showToast(message){const node=document.querySelector('#toast');node.textContent=message;node.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('show'),2600)}
function setCount(input,id){document.querySelector(id).textContent=input.value.length.toLocaleString('pt-BR')}
jobInput.addEventListener('input',()=>setCount(jobInput,'#job-count'));
resumeInput.addEventListener('input',()=>setCount(resumeInput,'#resume-count'));
document.querySelector('#load-sample').addEventListener('click',()=>{jobInput.value=samples.job;resumeInput.value=samples.resume;setCount(jobInput,'#job-count');setCount(resumeInput,'#resume-count');showToast('Exemplo preenchido. Agora é só analisar.');});
document.querySelector('.menu-toggle').addEventListener('click',e=>{const menu=document.querySelector('.nav-links');const open=menu.classList.toggle('open');e.currentTarget.setAttribute('aria-expanded',String(open));});
document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>{document.querySelector('.nav-links').classList.remove('open');document.querySelector('.menu-toggle').setAttribute('aria-expanded','false')}));

analyzeButton.addEventListener('click',()=>{
  const job=jobInput.value.trim(),resume=resumeInput.value.trim();
  if(!job||!resume){showToast('Cole a descrição da vaga e o currículo para continuar.');(!job?jobInput:resumeInput).focus();return}
  if(job.length<40){showToast('Cole uma descrição de vaga um pouco mais completa.');jobInput.focus();return}
  if(resume.length<35){showToast('Adicione mais conteúdo do seu currículo para analisar.');resumeInput.focus();return}
  analyzeButton.disabled=true;analyzeButton.innerHTML='Analisando... <span>✳</span>';
  setTimeout(()=>{
    const keywords=extractKeywords(job,resume);const matched=keywords.filter(x=>x.matched),missing=keywords.filter(x=>!x.matched);
    const base=keywords.length?Math.round(matched.length/keywords.length*100):0;
    const score=Math.min(98,Math.max(8,Math.round(base*.86+Math.min(words(resume).length/280,1)*14)));
    document.querySelector('#score-number').textContent=score;
    document.querySelector('#keyword-total').textContent=`${keywords.length} ${keywords.length===1?'termo':'termos'}`;
    document.querySelector('#matched-keywords').innerHTML=matched.length?matched.map(k=>`<span class="result-chip">${escapeHtml(k.label)}</span>`).join(''):'<span class="hint-copy">Nenhum termo claro identificado ainda.</span>';
    document.querySelector('#missing-keywords').innerHTML=missing.length?missing.map(k=>`<span class="result-chip missing">${escapeHtml(k.label)}</span>`).join(''):'<span class="result-chip">Tudo localizado neste recorte ✓</span>';
    document.querySelector('#resume-output').textContent=organizeResume(resume);
    document.querySelector('#score-title').textContent=score>=75?'Boa compatibilidade':score>=45?'Boa base para começar':'Há pontos para explorar';
    document.querySelector('#score-description').textContent=score>=75?'Muitos requisitos aparecem no seu currículo.':score>=45?'Você já atende a alguns pontos da descrição.':'Veja os requisitos e avalie o que faz sentido destacar.';
    document.querySelector('#large-ring').style.background=`conic-gradient(var(--violet) 0deg ${score*3.6}deg,#eeecf8 ${score*3.6}deg 360deg)`;
    document.querySelector('#score-fill').style.width=`${score}%`;
    results.classList.remove('hidden');analyzeButton.disabled=false;analyzeButton.innerHTML='Analisar novamente <span>→</span>';
    results.scrollIntoView({behavior:'smooth',block:'start'});
  },550);
});
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
document.querySelector('#reset-button').addEventListener('click',()=>{results.classList.add('hidden');document.querySelector('#analise').scrollIntoView({behavior:'smooth'});});
document.querySelector('#copy-button').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(document.querySelector('#resume-output').textContent);showToast('Currículo copiado para a área de transferência.')}catch{showToast('Não foi possível copiar. Selecione e copie o texto manualmente.')}});
document.querySelector('#pdf-button').addEventListener('click',()=>{
  const content=document.querySelector('#resume-output').textContent;
  const w=window.open('','_blank','width=850,height=900');
  if(!w){showToast('Permita a janela de impressão para salvar em PDF.');return}
  const safe=escapeHtml(content);
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Currículo ATS friendly</title><style>@page{size:A4;margin:18mm}body{font:11pt/1.65 Arial,sans-serif;color:#202332}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}h1{font:700 10pt Arial;color:#6b55e9;margin-bottom:20px}.notice{font:9pt Arial;color:#687767;border-top:1px solid #ddd;padding-top:10px;margin-top:20px}</style></head><body><h1>CURRÍCULO · VERSÃO ORGANIZADA</h1><pre>${safe}</pre><div class="notice">Conteúdo preservado conforme fornecido. Revise os dados antes de enviar.</div><script>window.onload=()=>{window.print()}<\/script></body></html>`);
  w.document.close();
});

const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');observer.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
