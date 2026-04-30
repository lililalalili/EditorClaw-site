/* LLM Adding Knowledge Quiz System - fixed robust version
   修复重点：
   1) localStorage 在 file:// 或受限浏览器环境下不可用时，不再中断初始化；
   2) 采用事件委托，按钮即使在动态生成内容中也能稳定响应；
   3) 增加缺失元素与异常保护，便于本地双击打开和 GitHub Pages 部署。
*/
(function(){
  'use strict';

  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const letters = ['A','B','C','D','E','F'];
  const DEFAULT_STORE = {mistakes:[], favorites:[], stats:{attempts:0, correct:0, byModule:{}}};
  let memoryStore = JSON.parse(JSON.stringify(DEFAULT_STORE));
  let storageOK = true;

  if (!Array.isArray(window.QUESTION_BANK) && typeof QUESTION_BANK === 'undefined') {
    document.addEventListener('DOMContentLoaded', function(){
      document.body.insertAdjacentHTML('afterbegin', '<div style="padding:14px;background:#fff3cd;border:1px solid #ffe69c;margin:12px;border-radius:10px">题库数据未加载。请确认 assets/data.js 与 index.html 位于同一文件夹结构中。</div>');
    });
    return;
  }

  const BANK = window.QUESTION_BANK || QUESTION_BANK;
  const modules = ['全部模块', ...new Set(BANK.map(q => q.module))];
  const state = { practice: [], practiceIndex: 0, practiceCorrect: 0, exam: [], examEnd: null, examTimer: null, examSubmitted: false };

  function cloneDefaultStore(){ return JSON.parse(JSON.stringify(DEFAULT_STORE)); }

  function normalizeStore(s){
    if(!s || typeof s !== 'object') s = cloneDefaultStore();
    if(!Array.isArray(s.mistakes)) s.mistakes = [];
    if(!Array.isArray(s.favorites)) s.favorites = [];
    if(!s.stats || typeof s.stats !== 'object') s.stats = {attempts:0, correct:0, byModule:{}};
    if(typeof s.stats.attempts !== 'number') s.stats.attempts = 0;
    if(typeof s.stats.correct !== 'number') s.stats.correct = 0;
    if(!s.stats.byModule || typeof s.stats.byModule !== 'object') s.stats.byModule = {};
    return s;
  }

  function getStore(){
    try{
      const raw = localStorage.getItem('llmQuizStore');
      const parsed = raw ? JSON.parse(raw) : cloneDefaultStore();
      memoryStore = normalizeStore(parsed);
      storageOK = true;
      return memoryStore;
    }catch(err){
      storageOK = false;
      memoryStore = normalizeStore(memoryStore);
      return memoryStore;
    }
  }

  function setStore(s){
    memoryStore = normalizeStore(s);
    try{
      localStorage.setItem('llmQuizStore', JSON.stringify(memoryStore));
      storageOK = true;
    }catch(err){
      storageOK = false;
    }
  }

  function clearStore(){
    memoryStore = cloneDefaultStore();
    try{ localStorage.removeItem('llmQuizStore'); storageOK = true; }catch(err){ storageOK = false; }
  }

  function ensureModuleStats(store, module){
    if(!store.stats.byModule[module]) store.stats.byModule[module]={attempts:0,correct:0};
  }
  function shuffle(arr){ return [...arr].sort(() => Math.random() - 0.5); }
  function typeName(t){ return t==='single'?'单选题':'多选题'; }
  function answerText(q){ return q.answer.map(i => letters[i]).join('、'); }
  function sameAnswer(a,b){
    const aa = [...a].sort((x,y)=>x-y);
    const bb = [...b].sort((x,y)=>x-y);
    return aa.length===bb.length && aa.every((v,i)=>v===bb[i]);
  }
  function escapeHTML(s){
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function safeScrollTop(){
    try{ window.scrollTo({top:0, behavior:'smooth'}); }catch(e){ window.scrollTo(0,0); }
  }
  function alertMsg(msg){ window.alert(msg); }

  function filterQuestions(module='all', type='all', keyword=''){
    const kw = String(keyword || '').trim().toLowerCase();
    return BANK.filter(q =>
      (module==='all'||q.module===module) &&
      (type==='all'||q.type===type) &&
      (!kw || (q.stem + ' ' + q.options.join(' ') + ' ' + q.explanation + ' ' + q.module).toLowerCase().includes(kw))
    );
  }

  function fillSelect(select, includeAll=true){
    if(!select) return;
    select.innerHTML = '';
    modules.forEach((m,i)=>{
      if(!includeAll && i===0) return;
      const opt = document.createElement('option');
      opt.value = i===0?'all':m;
      opt.textContent = m;
      select.appendChild(opt);
    });
  }

  function goto(view){
    const target = $('#'+view);
    if(!target) return;
    $$('.view').forEach(v=>v.classList.remove('active'));
    target.classList.add('active');
    $$('.nav').forEach(n=>n.classList.toggle('active', n.dataset.view===view));
    if(view==='bank') renderBank();
    if(view==='mistakes') renderMistakes();
    if(view==='stats') renderStats();
    safeScrollTop();
  }

  function renderSummary(){
    const el = $('#summaryCards');
    if(!el) return;
    const singles = BANK.filter(q=>q.type==='single').length;
    const multis = BANK.filter(q=>q.type==='multiple').length;
    const countModules = new Set(BANK.map(q=>q.module)).size;
    el.innerHTML = [
      ['题库总量', BANK.length], ['单选题', singles], ['多选题', multis], ['知识模块', countModules]
    ].map(([label,num])=>`<div class="card"><div class="num">${num}</div><div class="label">${label}</div></div>`).join('');
  }

  function renderStorageNotice(){
    const existing = $('#storageNotice');
    if(existing) existing.remove();
    if(storageOK) return;
    const home = $('#home');
    if(home){
      home.insertAdjacentHTML('afterbegin', '<div id="storageNotice" class="notice"><strong>提示：</strong>当前浏览器限制了 localStorage，本次仍可刷题和考试，但错题本/学习统计可能只能在当前页面会话中临时保存。建议使用 Chrome/Edge 正常模式打开，或用 <code>python -m http.server 8000</code> 方式访问。</div>');
    }
  }

  function renderQuestionCard(q, opts={showAnswer:false, interactive:false, name:'q', selected:[]}){
    const inputType = q.type==='single'?'radio':'checkbox';
    const selected = Array.isArray(opts.selected) ? opts.selected : [];
    const optsHtml = q.options.map((op,i)=>{
      const isChecked = selected.includes(i) ? 'checked' : '';
      const cls = opts.showAnswer ? (q.answer.includes(i)?' correct':'') : '';
      return `<label class="option${cls}"><input type="${inputType}" name="${escapeHTML(opts.name)}" value="${i}" ${isChecked} ${opts.interactive?'':'disabled'}><span><b>${letters[i]}.</b> ${escapeHTML(op)}</span></label>`;
    }).join('');
    return `<article class="question-card" data-id="${escapeHTML(q.id)}">
      <div class="q-head"><div><span class="badge module">${escapeHTML(q.module)}</span><span class="badge ${q.type}">${typeName(q.type)}</span><span class="badge">${escapeHTML(q.difficulty)}</span></div><span class="badge">${escapeHTML(q.id)}</span></div>
      <h3 class="q-title">${escapeHTML(q.stem)}</h3>
      <div class="options">${optsHtml}</div>
      <div class="answer-box ${opts.showAnswer?'':'hidden'}"><p><strong>正确答案：</strong>${answerText(q)}</p><p><strong>解析：</strong>${escapeHTML(q.explanation)}</p></div>
    </article>`;
  }

  function renderBank(){
    const list = $('#bankList');
    if(!list) return;
    const qs = filterQuestions($('#bankModule')?.value || 'all', $('#bankType')?.value || 'all', $('#bankSearch')?.value || '');
    list.innerHTML = qs.map(q => renderQuestionCard(q,{showAnswer:false})).join('') || '<div class="panel">没有找到匹配题目。</div>';
  }

  function cssAttrEscape(name){
    // name 只由本系统生成；这里保留兼容性，避免老浏览器缺少 CSS.escape 导致按钮失效。
    if(window.CSS && typeof CSS.escape === 'function') return CSS.escape(name);
    return String(name).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  function getSelected(container, name){
    return $$(`input[name="${cssAttrEscape(name)}"]:checked`, container).map(i=>Number(i.value));
  }

  function recordAttempt(q, correct){
    const s = getStore();
    s.stats.attempts++;
    if(correct) s.stats.correct++;
    ensureModuleStats(s, q.module);
    s.stats.byModule[q.module].attempts++;
    if(correct) s.stats.byModule[q.module].correct++;
    if(!correct && !s.mistakes.includes(q.id)) s.mistakes.push(q.id);
    setStore(s);
    renderStorageNotice();
  }

  function startPractice(customQs=null){
    let qs = customQs;
    if(!qs){
      qs = filterQuestions($('#practiceModule')?.value || 'all', $('#practiceType')?.value || 'all', '');
      qs = ($('#practiceOrder')?.value || 'random') === 'random' ? shuffle(qs) : qs;
      const count = Math.max(1, Math.min(Number($('#practiceCount')?.value)||20, qs.length));
      qs = qs.slice(0, count);
    }
    state.practice = qs;
    state.practiceIndex = 0;
    state.practiceCorrect = 0;
    renderPracticeQuestion();
    goto('practice');
  }

  function renderPracticeQuestion(){
    const area = $('#practiceArea');
    if(!area) return;
    if(!state.practice.length){ area.innerHTML = '<div class="panel">没有可练习的题目。</div>'; return; }
    const q = state.practice[state.practiceIndex];
    const pct = Math.round((state.practiceIndex)/state.practice.length*100);
    area.innerHTML = `<div class="panel"><div class="practice-meta"><b>第 ${state.practiceIndex+1} / ${state.practice.length} 题</b><span>当前正确：${state.practiceCorrect}</span></div><div class="progress-wrap"><div class="progress-bar" style="width:${pct}%"></div></div></div>
    ${renderQuestionCard(q,{interactive:true,name:'practiceAnswer'})}
    <div class="panel"><button type="button" id="submitPractice" class="primary">提交本题</button> <button type="button" id="nextPractice" class="secondary hidden">下一题</button></div>`;
  }

  function submitPracticeAnswer(){
    if(!state.practice.length) return;
    const q = state.practice[state.practiceIndex];
    const card = $('#practiceArea .question-card');
    if(!card) return;
    const selected = getSelected(card,'practiceAnswer');
    if(!selected.length){ alertMsg('请先选择答案。'); return; }
    const correct = sameAnswer(selected, q.answer);
    if(correct) state.practiceCorrect++;
    recordAttempt(q, correct);
    $$('.option', card).forEach((el,i)=>{
      if(q.answer.includes(i)) el.classList.add('correct');
      if(selected.includes(i)&&!q.answer.includes(i)) el.classList.add('wrong');
    });
    const ans = $('.answer-box', card);
    ans.classList.remove('hidden');
    $('#submitPractice')?.classList.add('hidden');
    $('#nextPractice')?.classList.remove('hidden');
    const msg = document.createElement('p');
    msg.className = correct?'result-ok':'result-bad';
    msg.textContent = correct?'回答正确！':'回答错误，已加入错题本。';
    ans.prepend(msg);
  }

  function nextPracticeQuestion(){
    state.practiceIndex++;
    if(state.practiceIndex>=state.practice.length) renderPracticeDone();
    else renderPracticeQuestion();
  }

  function renderPracticeDone(){
    const pct = state.practice.length ? Math.round(state.practiceCorrect/state.practice.length*100) : 0;
    const area = $('#practiceArea');
    if(area){
      area.innerHTML = `<div class="panel"><h2>练习完成</h2><p class="result-ok">得分：${state.practiceCorrect} / ${state.practice.length}（${pct}%）</p><button type="button" class="primary" data-action="practice-again">再练一组</button> <button type="button" class="secondary" data-goto="mistakes">查看错题</button></div>`;
    }
  }

  function startExam(){
    let qs = filterQuestions($('#examModule')?.value || 'all', $('#examType')?.value || 'all', '');
    qs = shuffle(qs).slice(0, Math.min(Number($('#examCount')?.value)||50, qs.length));
    const area = $('#examArea');
    if(!qs.length){ if(area) area.innerHTML='<div class="panel">没有可考试的题目。</div>'; return; }
    state.exam = qs;
    state.examSubmitted = false;
    state.examEnd = Date.now() + (Number($('#examMinutes')?.value)||60)*60*1000;
    renderExam();
    clearInterval(state.examTimer);
    state.examTimer = setInterval(updateTimer,1000);
    updateTimer();
    goto('exam');
  }

  function renderExam(){
    const area = $('#examArea');
    if(!area) return;
    area.innerHTML = `<div class="exam-sticky"><div><b>模拟考试进行中</b> · 共 ${state.exam.length} 题</div><div class="timer" id="timer"></div><button type="button" id="submitExam" class="primary small">交卷</button></div>` +
    state.exam.map((q,idx)=>renderQuestionCard(q,{interactive:true,name:`exam_${idx}`})).join('');
  }

  function updateTimer(){
    if(!state.examEnd || state.examSubmitted) return;
    const left = Math.max(0, state.examEnd - Date.now());
    const m = Math.floor(left/60000), s = Math.floor((left%60000)/1000);
    const t = $('#timer');
    if(t) t.textContent = `剩余 ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    if(left<=0){ clearInterval(state.examTimer); submitExam(); }
  }

  function submitExam(){
    if(state.examSubmitted) return;
    state.examSubmitted = true;
    clearInterval(state.examTimer);
    if(!state.exam.length) return;
    let correctCount=0;
    const cards = $$('#examArea .question-card');
    const results = state.exam.map((q,idx)=>{
      const card = cards[idx];
      const selected = card ? getSelected(card,`exam_${idx}`) : [];
      const correct = sameAnswer(selected, q.answer);
      if(correct) correctCount++;
      recordAttempt(q, correct);
      return {q,idx,selected,correct};
    });
    const pct = Math.round(correctCount/state.exam.length*100);
    const area = $('#examArea');
    if(area){
      area.innerHTML = `<div class="panel"><h2>考试结果</h2><p class="${pct>=80?'result-ok':'result-bad'}">得分：${correctCount} / ${state.exam.length}（${pct}%）</p><p>下面为逐题解析。错误题目已自动加入错题本。</p><button type="button" class="primary" data-action="exam-again">再考一次</button> <button type="button" class="secondary" data-goto="mistakes">查看错题本</button></div>` + results.map(r=>{
        const html = renderQuestionCard(r.q,{showAnswer:true,interactive:false,selected:r.selected,name:`done_${r.idx}`});
        return html.replace('<p><strong>正确答案', `<p class="${r.correct?'result-ok':'result-bad'}">${r.correct?'正确':'错误'}，你的答案：${r.selected.length?r.selected.map(i=>letters[i]).join('、'):'未作答'}</p><p><strong>正确答案`);
      }).join('');
    }
  }

  function renderMistakes(){
    const list = $('#mistakeList');
    if(!list) return;
    const s = getStore();
    const qs = s.mistakes.map(id=>BANK.find(q=>q.id===id)).filter(Boolean);
    list.innerHTML = qs.length ? qs.map(q=>renderQuestionCard(q,{showAnswer:true})).join('') : '<div class="panel">暂无错题。完成练习或考试后，答错的题会自动收录到这里。</div>';
    renderStorageNotice();
  }

  function renderStats(){
    const s = getStore();
    const cards = $('#statsCards');
    if(cards){
      const acc = s.stats.attempts ? Math.round(s.stats.correct/s.stats.attempts*100) : 0;
      cards.innerHTML = [ ['累计作答',s.stats.attempts], ['累计正确',s.stats.correct], ['总正确率',acc+'%'], ['错题数量',s.mistakes.length] ].map(([label,num])=>`<div class="card"><div class="num">${num}</div><div class="label">${label}</div></div>`).join('');
    }
    const moduleStats = $('#moduleStats');
    if(moduleStats){
      const rows = Object.entries(s.stats.byModule).sort().map(([m,v])=>{ const p = v.attempts?Math.round(v.correct/v.attempts*100):0; return `<div class="module-row"><div>${escapeHTML(m)}</div><div class="bar-bg"><div class="bar-fill" style="width:${p}%"></div></div><div>${p}%</div></div>`; }).join('');
      moduleStats.innerHTML = rows || '<p>暂无统计数据。</p>';
    }
    renderStorageNotice();
  }

  function clearMistakes(){
    if(!confirm('确认清空错题本？')) return;
    const s=getStore();
    s.mistakes=[];
    setStore(s);
    renderMistakes();
    renderStats();
  }

  function reviewMistakes(){
    const s=getStore();
    const qs=s.mistakes.map(id=>BANK.find(q=>q.id===id)).filter(Boolean);
    if(!qs.length){ alertMsg('错题本为空。'); return; }
    startPractice(shuffle(qs));
  }

  function resetStats(){
    if(!confirm('确认重置所有学习统计和错题？')) return;
    clearStore();
    renderStats();
    renderMistakes();
  }

  function bindEvents(){
    document.addEventListener('click', function(e){
      const gotoBtn = e.target.closest('[data-goto]');
      if(gotoBtn){ e.preventDefault(); goto(gotoBtn.dataset.goto); return; }

      const nav = e.target.closest('.nav[data-view]');
      if(nav){ e.preventDefault(); goto(nav.dataset.view); return; }

      const action = e.target.closest('[data-action]');
      if(action){
        e.preventDefault();
        if(action.dataset.action === 'practice-again') startPractice();
        if(action.dataset.action === 'exam-again') startExam();
        return;
      }

      if(e.target.closest('#startPractice')){ e.preventDefault(); startPractice(); return; }
      if(e.target.closest('#submitPractice')){ e.preventDefault(); submitPracticeAnswer(); return; }
      if(e.target.closest('#nextPractice')){ e.preventDefault(); nextPracticeQuestion(); return; }
      if(e.target.closest('#startExam')){ e.preventDefault(); startExam(); return; }
      if(e.target.closest('#submitExam')){ e.preventDefault(); submitExam(); return; }
      if(e.target.closest('#clearMistakes')){ e.preventDefault(); clearMistakes(); return; }
      if(e.target.closest('#reviewMistakes')){ e.preventDefault(); reviewMistakes(); return; }
      if(e.target.closest('#resetStats')){ e.preventDefault(); resetStats(); return; }
      if(e.target.closest('#expandAll')){ e.preventDefault(); $$('#bankList .answer-box').forEach(x=>x.classList.toggle('hidden')); return; }

      const bankCard = e.target.closest('#bankList .question-card');
      if(bankCard && !e.target.closest('input')){
        const box = $('.answer-box', bankCard);
        if(box) box.classList.toggle('hidden');
      }
    });

    ['bankModule','bankType','bankSearch'].forEach(id=>{
      const el = $('#'+id);
      if(el) el.addEventListener('input', renderBank);
      if(el) el.addEventListener('change', renderBank);
    });
  }

  function init(){
    try{
      ['bankModule','practiceModule','examModule'].forEach(id=>fillSelect($('#'+id)));
      bindEvents();
      renderSummary();
      renderBank();
      renderStats();
      renderStorageNotice();
    }catch(err){
      console.error(err);
      const msg = escapeHTML(err && err.message ? err.message : String(err));
      document.body.insertAdjacentHTML('afterbegin', `<div class="notice" style="margin:12px"><strong>页面初始化遇到问题：</strong>${msg}<br>请确认 assets/data.js 和 assets/app.js 文件完整，或使用修复版 ZIP 重新解压。</div>`);
    }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
