/* CasePilot demo app logic (static) */
(function () {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const store = {
    get(key, fallback=null){
      try{ const v=localStorage.getItem(key); return v?JSON.parse(v):fallback; }catch{ return fallback; }
    },
    set(key, value){
      try{ localStorage.setItem(key, JSON.stringify(value)); }catch{}
    }
  };

  function nowISO(){
    const d=new Date();
    const pad=n=>String(n).padStart(2,'0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function uid(){ return Math.random().toString(16).slice(2)+Date.now().toString(16); }

  function mountGenerator(){
    const root = document.querySelector('[data-page="generator"]');
    if(!root) return;

    const state = store.get('cp.generator.state', {
      step: 1,
      title: '',
      problem: '',
      domain: '企业内部知识问答',
      constraints: ['需要可验收指标','需要可追溯数据来源','需要明确不适用边界'],
      evidence: [],
      risks: [],
      metrics: [],
      deliverables: [],
      lastSavedAt: null,
      runId: null,
    });

    function setStep(step){
      state.step = step;
      store.set('cp.generator.state', state);
      render();
      window.scrollTo({top:0, behavior:'smooth'});
    }

    function addEvidence(item){
      state.evidence.unshift(item);
      store.set('cp.generator.state', state);
      render();
    }

    function seedIfNeeded(){
      if(state.evidence.length) return;
      state.evidence = [
        {type:'公开论文', ref:'arXiv:2304.xxxxx', note:'用于推理/检索增强的基线参考（示例）'},
        {type:'行业基准', ref:'SOTA Performance 2024', note:'用于对齐验收指标口径（示例）'},
        {type:'历史项目', ref:'Platform Project ID #8821', note:'用于估算吞吐/成本与边界（示例）'},
      ];

      state.risks = [
        {area:'技术路线', risk:'检索质量不足导致答案不可信', guard:'引入引用强制 + 低置信拒答'},
        {area:'指标假设', risk:'只写“准确率95%”但口径不清', guard:'指标公式+口径+验收数据集定义'},
        {area:'数据/场景', risk:'训练/评测数据与线上场景偏差', guard:'场景分层评测 + 失效模式库沉淀'},
      ];

      state.metrics = [
        {name:'可追溯覆盖率', formula:'可追溯回答数 / 总回答数', target:'≥ 95%', note:'每条关键结论必须给出处'},
        {name:'验收通过率', formula:'通过用例数 / 总用例数', target:'≥ 90%', note:'用例覆盖关键业务路径'},
        {name:'成本上限', formula:'(tokens + 检索 + 存储) / 单次请求', target:'≤ ¥0.30', note:'以真实流量估算'},
      ];

      state.deliverables = [
        {name:'技术方案报告', items:['架构图','模块边界','接口定义','部署拓扑']},
        {name:'验收指标与口径', items:['指标公式','数据口径','验收用例集','通过阈值']},
        {name:'风险边界声明', items:['不适用场景','降级策略','失败模式库']},
      ];

      store.set('cp.generator.state', state);
    }

    function render(){
      seedIfNeeded();

      // step pills
      $$('.cp-step').forEach(el=>{
        const s = Number(el.getAttribute('data-step'));
        el.classList.toggle('cp-step-active', s===state.step);
        el.classList.toggle('cp-step-done', s<state.step);
      });

      // panels
      $$('.cp-panel').forEach(el=>{
        const s = Number(el.getAttribute('data-step'));
        el.classList.toggle('hidden', s!==state.step);
      });

      // bind inputs
      const title = $('#cp-title');
      if(title && title.value!==state.title) title.value = state.title;
      const problem = $('#cp-problem');
      if(problem && problem.value!==state.problem) problem.value = state.problem;

      // evidence list
      const ev = $('#cp-evidence');
      if(ev){
        ev.innerHTML = state.evidence.map(x=>
          `<div class="rounded-xl border border-border-light bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold">${x.type}</div>
              <span class="cp-badge text-xs px-2 py-1 rounded-full">可追溯</span>
            </div>
            <div class="mt-1 text-sm text-text-secondary">${x.ref}</div>
            <div class="mt-2 text-sm">${x.note}</div>
          </div>`
        ).join('');
      }

      const risks = $('#cp-risks');
      if(risks){
        risks.innerHTML = state.risks.map(r=>
          `<div class="rounded-xl border border-border-light bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold">${r.area}</div>
              <span class="cp-badge text-xs px-2 py-1 rounded-full">风险建模</span>
            </div>
            <div class="mt-2 text-sm text-text-secondary">风险：${r.risk}</div>
            <div class="mt-2 text-sm">护栏：${r.guard}</div>
          </div>`
        ).join('');
      }

      const metrics = $('#cp-metrics');
      if(metrics){
        metrics.innerHTML = state.metrics.map(m=>
          `<div class="rounded-xl border border-border-light bg-white p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold">${m.name}</div>
              <span class="cp-badge text-xs px-2 py-1 rounded-full">可验收</span>
            </div>
            <div class="mt-2 text-sm"><span class="text-text-secondary">公式：</span>${m.formula}</div>
            <div class="mt-1 text-sm"><span class="text-text-secondary">目标：</span>${m.target}</div>
            <div class="mt-1 text-sm text-text-secondary">${m.note}</div>
          </div>`
        ).join('');
      }

      const del = $('#cp-deliverables');
      if(del){
        del.innerHTML = state.deliverables.map(d=>
          `<div class="rounded-xl border border-border-light bg-white p-4">
            <div class="font-semibold">${d.name}</div>
            <ul class="mt-2 text-sm text-text-secondary list-disc pl-5">
              ${d.items.map(i=>`<li>${i}</li>`).join('')}
            </ul>
          </div>`
        ).join('');
      }

      const status = $('#cp-status');
      if(status){
        status.textContent = state.lastSavedAt ? `已保存 · ${state.lastSavedAt}` : '未保存';
      }

      const goDetail = $('#cp-go-detail');
      if(goDetail){
        goDetail.href = `P-SOLUTION_DETAIL.html#run=${encodeURIComponent(state.runId||'demo')}`;
      }
    }

    function saveDraft(){
      state.lastSavedAt = nowISO();
      store.set('cp.generator.state', state);
      store.set('cp.generator.lastDraft', {
        id: state.runId || uid(),
        title: state.title || '未命名方案',
        updatedAt: state.lastSavedAt,
        summary: '交付级方案包（含指标、边界、追溯）',
      });
      render();
    }

    // events
    document.addEventListener('click', (e)=>{
      const t = e.target.closest('[data-action]');
      if(!t) return;
      const act = t.getAttribute('data-action');
      if(act==='next'){
        saveDraft();
        setStep(Math.min(4, state.step+1));
      }
      if(act==='prev'){
        setStep(Math.max(1, state.step-1));
      }
      if(act==='generate'){
        state.runId = uid();
        state.lastSavedAt = nowISO();
        store.set('cp.generator.state', state);
        const hist = store.get('cp.generator.history', []);
        hist.unshift({
          id: state.runId,
          title: state.title || '交付级方案',
          updatedAt: state.lastSavedAt,
          trend: '可信生成',
        });
        store.set('cp.generator.history', hist.slice(0,12));
        render();
        // soft navigate
        window.location.href = `P-SOLUTION_DETAIL.html#run=${encodeURIComponent(state.runId)}`;
      }
      if(act==='add-evidence'){
        const type = $('#cp-evidence-type')?.value || '公开论文';
        const ref = $('#cp-evidence-ref')?.value?.trim();
        const note = $('#cp-evidence-note')?.value?.trim();
        if(!ref) return;
        addEvidence({type, ref, note: note||'（示例）'});
        $('#cp-evidence-ref').value='';
        if($('#cp-evidence-note')) $('#cp-evidence-note').value='';
      }
    });

    document.addEventListener('input', (e)=>{
      if(e.target?.id==='cp-title'){ state.title = e.target.value; store.set('cp.generator.state', state); }
      if(e.target?.id==='cp-problem'){ state.problem = e.target.value; store.set('cp.generator.state', state); }
    });

    render();
  }

  function mountHistory(){
    const el = document.querySelector('[data-history]');
    if(!el) return;
    const hist = store.get('cp.generator.history', []);
    if(!hist.length){
      el.innerHTML = `<div class="text-sm text-text-secondary">暂无历史记录（你可以先去“方案生成器”生成一个示例方案）。</div>`;
      return;
    }
    el.innerHTML = hist.map(h=>
      `<a class="block rounded-xl border border-border-light bg-white p-4 hover:shadow-card-hover transition" href="P-SOLUTION_DETAIL.html#run=${encodeURIComponent(h.id)}">
        <div class="flex items-center justify-between gap-3">
          <div class="font-semibold">${h.title}</div>
          <span class="cp-badge text-xs px-2 py-1 rounded-full">${h.trend||'方案包'}</span>
        </div>
        <div class="mt-1 text-xs text-text-secondary">更新：${h.updatedAt||''}</div>
      </a>`
    ).join('');
  }

  function mountAuth(){
    const page = document.querySelector('[data-page="auth"]');
    if(!page) return;
    const tabs = $$('[data-tab]');
    const panels = $$('[data-panel]');
    function setTab(name){
      tabs.forEach(t=>t.classList.toggle('nav-link-active', t.getAttribute('data-tab')===name));
      panels.forEach(p=>p.classList.toggle('hidden', p.getAttribute('data-panel')!==name));
    }
    tabs.forEach(t=>t.addEventListener('click', ()=>setTab(t.getAttribute('data-tab'))));

    const formLogin = $('#cp-login-form');
    const formReg = $('#cp-register-form');
    const msg = $('#cp-auth-msg');

    function show(text, ok=true){
      if(!msg) return;
      msg.textContent = text;
      msg.classList.remove('hidden');
      msg.classList.toggle('border-danger', !ok);
      msg.classList.toggle('border-success', ok);
    }

    function fakeAuth(email){
      store.set('cp.auth.user', {name: email.split('@')[0]||'用户', email, at: nowISO()});
    }

    if(formLogin){
      formLogin.addEventListener('submit', (e)=>{
        e.preventDefault();
        const email = $('#cp-login-email')?.value?.trim();
        if(!email) return;
        fakeAuth(email);
        show('登录成功（演示）');
        setTimeout(()=>{ window.location.href='P-SOLUTION_GENERATOR.html'; }, 500);
      });
    }

    if(formReg){
      formReg.addEventListener('submit', (e)=>{
        e.preventDefault();
        const email = $('#cp-reg-email')?.value?.trim();
        if(!email) return;
        fakeAuth(email);
        show('注册成功（演示）');
        setTimeout(()=>{ window.location.href='P-SOLUTION_GENERATOR.html'; }, 600);
      });
    }

    setTab('login');
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    mountGenerator();
    mountHistory();
    mountAuth();
  });
})();
