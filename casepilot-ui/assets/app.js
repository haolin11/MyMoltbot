/* CasePilot demo app logic (static)
   Product shape: document-first (proposal) + continuous chat collaboration.
   - User chats → generates initial draft document
   - User can edit document directly (contenteditable)
   - Evidence / metrics / boundaries exist as lightweight side cards
*/
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const store = {
    get(key, fallback = null) {
      try {
        const v = localStorage.getItem(key);
        return v ? JSON.parse(v) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
  };

  const pad = (n) => String(n).padStart(2, "0");
  function nowISO() {
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function uid() {
    return Math.random().toString(16).slice(2) + Date.now().toString(16);
  }

  function esc(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ============ seed ============
  function seedState(state) {
    if (state.seeded) return;
    state.seeded = true;

    state.meta = state.meta || { title: "新方案", updatedAt: null, runId: "draft" };

    state.messages = state.messages || [
      { id: uid(), role: "ai", ts: nowISO(), text: "把需求告诉我，我来生成初版方案书。" },
    ];

    state.todos = state.todos || [
      { id: uid(), text: "确认验收角色（甲方/交付/安全）", done: false },
      { id: uid(), text: "确认验收用例集覆盖范围", done: false },
      { id: uid(), text: "确认数据来源优先级", done: false },
      { id: uid(), text: "确认不适用边界与降级策略", done: false },
    ];

    state.artifacts = state.artifacts || {
      evidence: [
        { type: "公开论文", ref: "arXiv:2304.xxxxx", note: "基线参考" },
        { type: "行业基准", ref: "SOTA 2024", note: "口径对齐" },
        { type: "历史项目", ref: "Project #8821", note: "边界估算" },
      ],
      metrics: [
        { name: "可追溯覆盖率", formula: "可追溯回答/总回答", target: "≥ 95%" },
        { name: "验收通过率", formula: "通过用例/总用例", target: "≥ 90%" },
        { name: "单次成本", formula: "tokens+检索+存储", target: "≤ ¥0.30" },
      ],
      boundaries: [
        { title: "无证据拒答", text: "无来源时拒答或转人工" },
        { title: "高风险复核", text: "法律/财务需人工审核" },
      ],
    };

    state.doc = state.doc || {
      overview: "",
      arch: "",
      metrics: "",
      boundaries: "",
      deliverables: "",
    };
  }

  // ============ document generation (fake but structured) ============
  function generateDraftFromNeed(need) {
    const title = need.trim().slice(0, 20) || "新方案";

    const overview = `目标：基于需求生成可追溯、可验收的交付级方案书。

范围：${need.trim()}

核心交付：技术方案 + 验收指标口径 + 风险边界声明 + 交付物清单。`;

    const arch = `推荐架构：

1. 业务入口层
   - Web / IM / 工单系统接入

2. 检索层（可追溯）
   - 关键词 + 向量 + 规则召回
   - 强制引用来源

3. 生成层
   - 置信阈值判断
   - 低置信度拒答或转人工

4. 评测层
   - 用例集验收
   - 失败模式库`;

    const metrics = `指标定义：

1. 可追溯覆盖率
   公式：可追溯回答数 / 总回答数
   目标：≥ 95%

2. 验收通过率
   公式：通过用例数 / 总用例数
   目标：≥ 90%

3. 单次成本
   公式：(tokens + 检索 + 存储) / 请求
   目标：≤ ¥0.30`;

    const boundaries = `不适用边界：

• 证据不足场景
  处理：拒答并说明原因，或转人工

• 高风险领域（法律/财务/安全）
  处理：输出风险标记 + 强制人工复核

• 意图不清场景
  处理：生成澄清问题，确认后继续`;

    const deliverables = `交付物清单：

□ 技术方案书（本文档）
□ 系统架构图
□ 接口定义文档
□ 验收指标口径表
□ 验收用例集（含边界用例）
□ 风险边界声明
□ 失败模式库模板`;

    return { title, doc: { overview, arch, metrics, boundaries, deliverables } };
  }

  // ============ render bits ============
  function renderStatus(state) {
    const el = $("#cp-status");
    if (!el) return;
    el.textContent = state.meta.updatedAt ? `已保存 · ${state.meta.updatedAt}` : "未保存";
  }

  function renderTitle(state) {
    const el = $("#cp-title");
    if (el) el.textContent = state.meta.title || "新方案";

    const go = $("#cp-go-detail");
    if (go) go.href = `P-SOLUTION_DETAIL.html#run=${encodeURIComponent(state.meta.runId || "draft")}`;
  }

  function renderChat(state) {
    const el = $("#cp-chat");
    if (!el) return;

    el.innerHTML = (state.messages || [])
      .map((m) => {
        const role = m.role === "user" ? "user" : "ai";
        const label = role === "user" ? "你" : "CasePilot";
        return `<div class="cp-msg ${role}">
          <div class="meta">
            <span class="font-medium">${label}</span>
            <span>${esc(m.ts || "")}</span>
          </div>
          <div class="mt-2 text-sm leading-relaxed">${esc(m.text || "")}</div>
        </div>`;
      })
      .join("");

    el.scrollTop = el.scrollHeight;
  }

  function renderTodos(state) {
    const el = $("#cp-todos");
    if (!el) return;

    el.innerHTML = (state.todos || [])
      .map(
        (t) => `<div class="cp-todo ${t.done ? "done" : ""}">
          <label class="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" data-todo-id="${t.id}" ${t.done ? "checked" : ""} />
            <span class="text-sm">${esc(t.text)}</span>
          </label>
        </div>`
      )
      .join("");

    const btn = $("#cp-generate");
    if (btn) btn.disabled = (state.todos || []).some((x) => !x.done);
  }

  function renderArtifacts(state) {
    const a = state.artifacts || {};

    // Evidence
    const ev = $("#cp-evidence");
    if (ev) {
      ev.innerHTML = (a.evidence || [])
        .map(
          (x) => `<div class="cp-mini-card">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">${esc(x.type)}</span>
              <span class="cp-pill text-[10px]">引用</span>
            </div>
            <div class="mt-1 text-xs text-text-secondary">${esc(x.ref)}</div>
          </div>`
        )
        .join("");
    }

    // Metrics
    const met = $("#cp-metrics");
    if (met) {
      met.innerHTML = (a.metrics || [])
        .map(
          (m) => `<div class="cp-mini-card">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">${esc(m.name)}</span>
              <span class="cp-pill-warn text-[10px]">指标</span>
            </div>
            <div class="mt-1 text-xs text-text-secondary">${esc(m.target)}</div>
          </div>`
        )
        .join("");
    }

    const metCount = $("#cp-metrics-count");
    if (metCount) metCount.textContent = `${(a.metrics || []).length} 项`;

    // Boundaries
    const bd = $("#cp-boundaries");
    if (bd) {
      bd.innerHTML = (a.boundaries || [])
        .map(
          (b) => `<div class="cp-mini-card">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">${esc(b.title)}</span>
              <span class="cp-pill-primary text-[10px]">边界</span>
            </div>
            <div class="mt-1 text-xs text-text-secondary">${esc(b.text)}</div>
          </div>`
        )
        .join("");
    }

    const bdCount = $("#cp-boundaries-count");
    if (bdCount) bdCount.textContent = `${(a.boundaries || []).length} 项`;
  }

  function renderDocument(state) {
    const map = {
      overview: "#cp-doc-overview",
      arch: "#cp-doc-arch",
      metrics: "#cp-doc-metrics",
      boundaries: "#cp-doc-boundaries",
      deliverables: "#cp-doc-deliverables",
    };

    Object.entries(map).forEach(([k, sel]) => {
      const el = $(sel);
      if (!el) return;
      const v = state.doc?.[k] || "";
      if (el.innerText !== v) el.innerText = v;
    });
  }

  function persist(state) {
    state.meta.updatedAt = nowISO();
    store.set("cp.collab.docfirst", state);

    // History list
    const hist = store.get("cp.history", []);
    const entry = {
      id: state.meta.runId || "draft",
      title: state.meta.title || "新方案",
      updatedAt: state.meta.updatedAt,
      score: `${(state.todos || []).filter((x) => x.done).length}/${(state.todos || []).length}`,
    };
    store.set(
      "cp.history",
      [entry, ...hist.filter((h) => h.id !== entry.id)].slice(0, 20)
    );
  }

  function renderAll(state) {
    renderTitle(state);
    renderStatus(state);
    renderChat(state);
    renderTodos(state);
    renderArtifacts(state);
    renderDocument(state);
  }

  // ============ generator page ============
  function mountGenerator() {
    const root = document.querySelector('[data-page="generator"]');
    if (!root) return;

    const state = store.get("cp.collab.docfirst", { seeded: false });
    seedState(state);

    function addMsg(role, text) {
      state.messages.push({ id: uid(), role, text, ts: nowISO() });
    }

    function ensureDraft(need) {
      const waiting =
        !state.doc?.overview ||
        state.doc?.overview?.includes("等待") ||
        state.doc?.overview === "";

      if (!waiting) return;
      const draft = generateDraftFromNeed(need);
      state.meta.title = draft.title;
      state.doc = draft.doc;
    }

    function handleSend(text) {
      const trimmed = String(text || "").trim();
      if (!trimmed) return;

      addMsg("user", trimmed);
      ensureDraft(trimmed);

      const nextTodo = (state.todos || []).find((x) => !x.done);
      if (nextTodo) {
        addMsg("ai", `已生成初版方案书。下一步请确认：${nextTodo.text}`);
      } else {
        addMsg("ai", "方案已就绪，可以导出或继续修改。");
      }

      persist(state);
      renderAll(state);
    }

    // Send button
    const input = $("#cp-input");
    const send = $("#cp-send");
    if (send && input) {
      send.addEventListener("click", () => {
        handleSend(input.value);
        input.value = "";
        input.focus();
      });
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          handleSend(input.value);
          input.value = "";
        }
      });
    }

    // Document edit
    document.addEventListener("input", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      const key = el.getAttribute("data-doc");
      if (!key) return;
      state.doc = state.doc || {};
      state.doc[key] = el.innerText || "";
      persist(state);
      renderStatus(state);
    });

    // Todo toggle
    document.addEventListener("change", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;
      const id = el.getAttribute("data-todo-id");
      if (!id) return;
      const item = (state.todos || []).find((t) => t.id === id);
      if (!item) return;
      item.done = el.checked;
      persist(state);
      renderTodos(state);
      renderStatus(state);
    });

    // Generate draft button
    const genDraft = $("#cp-generate-draft");
    if (genDraft) {
      genDraft.addEventListener("click", () => {
        const seedNeed = "交付级 AI 方案：可追溯、可验收、边界清晰";
        ensureDraft(seedNeed);
        addMsg("ai", "已生成初版方案书，请查看左侧文档区域。");
        persist(state);
        renderAll(state);
      });
    }

    // Generate package button
    const gen = $("#cp-generate");
    if (gen) {
      gen.addEventListener("click", () => {
        if ((state.todos || []).some((x) => !x.done)) return;
        state.meta.runId = uid();
        persist(state);
        window.location.href = `P-SOLUTION_DETAIL.html#run=${encodeURIComponent(state.meta.runId)}`;
      });
    }

    // Initial render
    persist(state);
    renderAll(state);
  }

  function mountHistory() {
    const el = document.querySelector("[data-history]");
    if (!el) return;

    const hist = store.get("cp.history", []);
    if (!hist.length) {
      el.innerHTML = `<div class="text-sm text-text-secondary">暂无历史</div>`;
      return;
    }

    el.innerHTML = hist
      .slice(0, 5)
      .map(
        (h) => `<a class="block cp-mini-card cp-card-hover" href="P-SOLUTION_DETAIL.html#run=${encodeURIComponent(h.id)}">
          <div class="flex items-center justify-between">
            <span class="font-medium text-sm">${esc(h.title)}</span>
            <span class="cp-pill text-[10px]">${esc(h.score || "-")}</span>
          </div>
          <div class="mt-1 text-xs text-text-secondary">${esc(h.updatedAt || "")}</div>
        </a>`
      )
      .join("");
  }

  function mountAuth() {
    const page = document.querySelector('[data-page="auth"]');
    if (!page) return;

    const tabs = $$('[data-tab]');
    const panels = $$('[data-panel]');

    function setTab(name) {
      tabs.forEach((t) => {
        const active = t.getAttribute("data-tab") === name;
        t.classList.toggle("active", active);
      });
      panels.forEach((p) => p.classList.toggle("hidden", p.getAttribute("data-panel") !== name));
    }

    tabs.forEach((t) => t.addEventListener("click", () => setTab(t.getAttribute("data-tab"))));

    const msg = $("#cp-auth-msg");
    const show = (text) => {
      if (!msg) return;
      msg.textContent = text;
      msg.classList.remove("hidden");
    };

    function fakeAuth(email) {
      store.set("cp.auth.user", { name: email.split("@")[0] || "用户", email, at: nowISO() });
    }

    const formLogin = $("#cp-login-form");
    if (formLogin) {
      formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = $("#cp-login-email")?.value?.trim();
        if (!email) return;
        fakeAuth(email);
        show("登录成功");
        setTimeout(() => (window.location.href = "P-SOLUTION_GENERATOR.html"), 350);
      });
    }

    const formReg = $("#cp-register-form");
    if (formReg) {
      formReg.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = $("#cp-reg-email")?.value?.trim();
        if (!email) return;
        fakeAuth(email);
        show("注册成功");
        setTimeout(() => (window.location.href = "P-SOLUTION_GENERATOR.html"), 450);
      });
    }

    setTab("login");
  }

  document.addEventListener("DOMContentLoaded", () => {
    mountGenerator();
    mountHistory();
    mountAuth();
  });
})();
