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
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
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
      { id: uid(), role: "ai", ts: nowISO(), text: "把需求发我一句话。我会生成一份初版方案书。" },
    ];

    state.todos = state.todos || [
      { id: uid(), text: "验收角色（甲方/交付/安全）", done: false },
      { id: uid(), text: "验收用例集（关键流程）", done: false },
      { id: uid(), text: "数据来源优先级（内部/公开/历史）", done: false },
      { id: uid(), text: "不适用边界 & 降级策略", done: false },
    ];

    state.artifacts = state.artifacts || {
      evidence: [
        { type: "公开论文", ref: "arXiv:2304.xxxxx", note: "基线参考" },
        { type: "行业基准", ref: "SOTA Performance 2024", note: "口径对齐" },
        { type: "历史项目", ref: "Project ID #8821", note: "成本/边界估算" },
      ],
      metrics: [
        { name: "可追溯覆盖率", formula: "可追溯回答数/总回答数", target: "≥ 95%" },
        { name: "验收通过率", formula: "通过用例数/总用例数", target: "≥ 90%" },
        { name: "成本上限", formula: "(tokens+检索+存储)/次", target: "≤ ¥0.30" },
      ],
      boundaries: [
        { title: "缺证据拒答", text: "无法给出处 → 拒答/转人工" },
        { title: "高风险复核", text: "法律/财务 → 标注风险 + 人工复核" },
      ],
    };

    state.doc = state.doc || {
      overview: "（等待生成）",
      arch: "（等待生成）",
      metrics: "（等待生成）",
      boundaries: "（等待生成）",
      deliverables: "（等待生成）",
    };
  }

  // ============ document generation (fake but structured) ============
  function generateDraftFromNeed(need) {
    const title = need.trim().slice(0, 18) || "新方案";

    const overview = `目标：将需求转化为可验收、可追溯的交付级方案书。\n\n范围：${need.trim()}\n\n交付输出：技术方案报告 + 验收指标口径 + 风险边界声明 + 交付清单。`;

    const arch = `推荐架构：\n- 业务入口：Web/IM/工单系统\n- 检索层：关键词 + 向量 + 规则召回（可追溯）\n- 生成层：引用强制 + 置信阈值 + 拒答/转人工\n- 评测层：用例集 + 指标口径 + 失败模式库\n\n关键约束：所有关键结论必须附来源；无来源则拒答。`;

    const metrics = `指标（示例口径）：\n1) 可追溯覆盖率 = 可追溯回答数 / 总回答数，目标 ≥ 95%\n2) 验收通过率 = 通过用例数 / 总用例数，目标 ≥ 90%\n3) 成本上限 = (tokens + 检索 + 存储) / 次，目标 ≤ ¥0.30\n\n验收用例：覆盖 3~5 条关键业务流程，包含失败/边界用例。`;

    const boundaries = `不适用边界（示例）：\n- 证据不足：无法给出来源 → 拒答/转人工\n- 高风险领域：法律/财务/安全 → 输出风险标记 + 人工复核\n- 意图不清：进入澄清，生成确认清单后再继续\n\n降级策略：检索降级（关键词→规则）/模型降级（便宜模型→更强模型）/人工兜底。`;

    const deliverables = `交付物：\n- 方案书（本页，可编辑）\n- 架构图与接口定义\n- 验收指标与口径定义\n- 验收用例集（含边界用例）\n- 风险边界声明 & 失败模式库模板`;

    return {
      title,
      doc: { overview, arch, metrics, boundaries, deliverables },
    };
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
          <div class="meta flex items-center justify-between">
            <span>${label}</span>
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
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="mt-1" data-todo-id="${t.id}" ${t.done ? "checked" : ""} />
            <div class="flex-1">
              <div class="text-sm font-semibold">${esc(t.text)}</div>
            </div>
          </label>
        </div>`
      )
      .join("");

    const btn = $("#cp-generate");
    if (btn) btn.disabled = (state.todos || []).some((x) => !x.done);
  }

  function renderArtifacts(state) {
    const a = state.artifacts || {};

    const ev = $("#cp-evidence");
    if (ev) {
      ev.innerHTML = (a.evidence || [])
        .map(
          (x) => `<div class="cp-card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold text-sm">${esc(x.type)}</div>
              <span class="text-xs cp-pill px-2 py-1 rounded-full">可追溯</span>
            </div>
            <div class="mt-2 text-xs text-text-secondary">${esc(x.ref)}</div>
            <div class="mt-2 text-sm">${esc(x.note || "")}</div>
          </div>`
        )
        .join("");
    }

    const met = $("#cp-metrics");
    if (met) {
      met.innerHTML = (a.metrics || [])
        .map(
          (m) => `<div class="cp-card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold text-sm">${esc(m.name)}</div>
              <span class="text-xs cp-pill-warn px-2 py-1 rounded-full">可验收</span>
            </div>
            <div class="mt-2 text-xs text-text-secondary">${esc(m.formula)} · ${esc(m.target)}</div>
          </div>`
        )
        .join("");
    }

    const bd = $("#cp-boundaries");
    if (bd) {
      bd.innerHTML = (a.boundaries || [])
        .map(
          (b) => `<div class="cp-card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold text-sm">${esc(b.title)}</div>
              <span class="text-xs cp-pill-primary px-2 py-1 rounded-full">边界</span>
            </div>
            <div class="mt-2 text-xs text-text-secondary">${esc(b.text)}</div>
          </div>`
        )
        .join("");
    }
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
      // keep plain text (not HTML)
      if (el.innerText !== v) el.innerText = v;
    });
  }

  function persist(state) {
    state.meta.updatedAt = nowISO();
    store.set("cp.collab.docfirst", state);

    // history list
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
      // If doc is still waiting, generate now.
      const waiting =
        state.doc?.overview?.includes("等待") ||
        state.doc?.arch?.includes("等待") ||
        state.doc?.metrics?.includes("等待");

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

      // Keep responses short (product, not explanation)
      const nextTodo = (state.todos || []).find((x) => !x.done);
      if (nextTodo) {
        addMsg("ai", `下一步：${nextTodo.text}`);
      } else {
        addMsg("ai", "已齐。你可以继续改文档，或点『生成方案包』。" );
      }

      persist(state);
      renderAll(state);
    }

    // actions
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
          handleSend(input.value);
          input.value = "";
        }
      });
    }

    // doc edit
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

    // todo toggle
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

    // generate draft button
    const genDraft = $("#cp-generate-draft");
    if (genDraft) {
      genDraft.addEventListener("click", () => {
        const seedNeed = "做一个交付级 AI 方案：可追溯、可验收、边界清晰";
        ensureDraft(seedNeed);
        addMsg("ai", "已生成初版方案书（可编辑）。" );
        persist(state);
        renderAll(state);
      });
    }

    // open chat button
    const openChat = $("#cp-open-chat");
    if (openChat) {
      openChat.addEventListener("click", () => {
        // focus input, and switch to chat pane
        const tab = document.querySelector('[data-pane-tab="chat"]');
        if (tab) tab.click();
        setTimeout(() => input?.focus(), 0);
      });
    }

    // generate package button
    const gen = $("#cp-generate");
    if (gen) {
      gen.addEventListener("click", () => {
        if ((state.todos || []).some((x) => !x.done)) return;
        state.meta.runId = uid();
        persist(state);
        window.location.href = `P-SOLUTION_DETAIL.html#run=${encodeURIComponent(state.meta.runId)}`;
      });
    }

    // initial
    persist(state);
    renderAll(state);
  }

  function mountHistory() {
    const el = document.querySelector("[data-history]");
    if (!el) return;

    const hist = store.get("cp.history", []);
    if (!hist.length) {
      el.innerHTML = `<div class="text-sm text-text-secondary">暂无。去协作生成。</div>`;
      return;
    }

    el.innerHTML = hist
      .map(
        (h) => `<a class="block cp-card cp-card-hover p-4" href="P-SOLUTION_DETAIL.html#run=${encodeURIComponent(
          h.id
        )}">
          <div class="flex items-center justify-between gap-3">
            <div class="font-semibold">${esc(h.title)}</div>
            <span class="cp-pill text-xs px-2 py-1 rounded-full">完成度 ${esc(h.score || "-")}</span>
          </div>
          <div class="mt-1 text-xs text-text-secondary">更新：${esc(h.updatedAt || "")}</div>
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
        t.classList.toggle("nav-link-active", active);
        t.classList.toggle("text-text-secondary", !active);
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
        show("登录成功（演示）");
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
        show("注册成功（演示）");
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
