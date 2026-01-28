/* CasePilot demo app logic (static)
   Goal: Notion-like workspace + continuous chat, minimal explanatory text.
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

  function htmlEscape(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function seedArtifacts(state) {
    if (state.artifactsSeeded) return;

    state.artifactsSeeded = true;

    state.artifacts = state.artifacts || {
      evidence: [
        { type: "公开论文", ref: "arXiv:2304.xxxxx", note: "基线参考（示例）" },
        { type: "行业基准", ref: "SOTA Performance 2024", note: "指标口径对齐（示例）" },
        { type: "历史项目", ref: "Platform Project ID #8821", note: "成本与边界估算（示例）" },
      ],
      metrics: [
        {
          name: "可追溯覆盖率",
          formula: "可追溯回答数 / 总回答数",
          target: "≥ 95%",
        },
        {
          name: "验收通过率",
          formula: "通过用例数 / 总用例数",
          target: "≥ 90%",
        },
        {
          name: "成本上限",
          formula: "(tokens + 检索 + 存储) / 单次请求",
          target: "≤ ¥0.30",
        },
      ],
      boundaries: [
        { title: "缺证据拒答", text: "无法给出处 → 拒答 / 转人工" },
        { title: "高风险领域", text: "法律/财务 → 标注风险 + 人工复核" },
        { title: "意图不清", text: "进入澄清 → 生成确认清单" },
      ],
      deliverables: [
        { name: "技术方案报告", items: ["架构图", "模块边界", "接口定义", "部署拓扑"] },
        { name: "验收指标与口径", items: ["指标公式", "口径定义", "验收用例集", "阈值"] },
        { name: "风险边界声明", items: ["不适用场景", "降级策略", "失败模式库"] },
      ],
    };

    state.todos = state.todos || [
      { id: uid(), text: "确认验收角色（甲方/交付/安全）", done: false, tag: "协作" },
      { id: uid(), text: "定义验收用例集（覆盖关键流程）", done: false, tag: "可验收" },
      { id: uid(), text: "补齐数据来源优先级（内部/公开/历史）", done: false, tag: "可追溯" },
      { id: uid(), text: "声明不适用边界与降级策略", done: false, tag: "边界" },
    ];

    state.messages = state.messages || [
      {
        id: uid(),
        role: "ai",
        ts: nowISO(),
        text: "把需求发我一句话。然后我会给你一份【确认清单】。",
      },
    ];

    state.meta = state.meta || {
      title: "",
      updatedAt: null,
      runId: null,
    };
  }

  function deriveNextAiTurn(state, userText) {
    // Rule-based: ask the next missing item as a short question.
    const t = userText.toLowerCase();

    if (!state.meta.title && userText.trim().length >= 6) {
      state.meta.title = userText.trim().slice(0, 28);
    }

    // lightweight intent mapping
    const wantsRag = t.includes("知识") || t.includes("rag") || t.includes("问答");
    const wants客服 = t.includes("客服") || t.includes("工单");

    if (wantsRag || wants客服) {
      state.artifacts.boundaries[0].text = "无来源/证据不足 → 拒答 / 转人工";
    }

    // pick next todo not done
    const next = (state.todos || []).find((x) => !x.done);
    if (next) {
      const qMap = {
        "确认验收角色（甲方/交付/安全）": "验收谁说了算？（甲方/交付/安全/合规）",
        "定义验收用例集（覆盖关键流程）": "验收用例怎么选？给我 3 条关键流程。",
        "补齐数据来源优先级（内部/公开/历史）": "数据来源优先级？（内部知识库/公开资料/历史项目）",
        "声明不适用边界与降级策略": "哪些情况必须拒答或转人工？",
      };
      return qMap[next.text] || "我需要你确认：验收口径/边界/证据。";
    }

    // otherwise offer generate
    return "已齐。点右侧【生成方案包】即可。";
  }

  function renderGenerator(state) {
    const titleEl = $("#cp-title");
    if (titleEl) titleEl.textContent = state.meta.title || "新方案";

    const statusEl = $("#cp-status");
    if (statusEl) statusEl.textContent = state.meta.updatedAt ? `已保存 · ${state.meta.updatedAt}` : "未保存";

    // messages
    const chatEl = $("#cp-chat");
    if (chatEl) {
      chatEl.innerHTML = (state.messages || [])
        .map((m) => {
          const role = m.role === "user" ? "user" : "ai";
          const label = role === "user" ? "你" : "CasePilot";
          return `<div class="cp-msg ${role}">
            <div class="meta flex items-center justify-between">
              <span>${label}</span>
              <span>${htmlEscape(m.ts || "")}</span>
            </div>
            <div class="mt-2 text-sm leading-relaxed">${htmlEscape(m.text || "")}</div>
          </div>`;
        })
        .join("");
      chatEl.scrollTop = chatEl.scrollHeight;
    }

    // todos
    const todoEl = $("#cp-todos");
    if (todoEl) {
      todoEl.innerHTML = (state.todos || [])
        .map((t) => {
          const tag = t.tag || "";
          const pillClass = tag === "可验收" ? "cp-pill-warn" : tag === "可追溯" ? "cp-pill" : "cp-pill-primary";
          return `<div class="cp-todo ${t.done ? "done" : ""}">
            <label class="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" class="mt-1" data-todo-id="${t.id}" ${t.done ? "checked" : ""} />
              <div class="flex-1">
                <div class="text-sm font-semibold">${htmlEscape(t.text)}</div>
                <div class="mt-2 inline-flex text-xs px-2 py-1 rounded-full ${pillClass}">${htmlEscape(tag)}</div>
              </div>
            </label>
          </div>`;
        })
        .join("");
    }

    // artifacts
    const ev = $("#cp-evidence");
    if (ev) {
      ev.innerHTML = (state.artifacts.evidence || [])
        .map((x) =>
          `<div class="cp-card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold text-sm">${htmlEscape(x.type)}</div>
              <span class="cp-pill text-xs px-2 py-1 rounded-full">可追溯</span>
            </div>
            <div class="mt-2 text-xs text-text-secondary">${htmlEscape(x.ref)}</div>
            <div class="mt-2 text-sm">${htmlEscape(x.note || "")}</div>
          </div>`
        )
        .join("");
    }

    const met = $("#cp-metrics");
    if (met) {
      met.innerHTML = (state.artifacts.metrics || [])
        .map((m) =>
          `<div class="cp-card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold text-sm">${htmlEscape(m.name)}</div>
              <span class="cp-pill-warn text-xs px-2 py-1 rounded-full">可验收</span>
            </div>
            <div class="mt-2 text-xs text-text-secondary">公式：${htmlEscape(m.formula)}</div>
            <div class="mt-1 text-xs text-text-secondary">目标：${htmlEscape(m.target)}</div>
          </div>`
        )
        .join("");
    }

    const bd = $("#cp-boundaries");
    if (bd) {
      bd.innerHTML = (state.artifacts.boundaries || [])
        .map((b) =>
          `<div class="cp-card p-4">
            <div class="flex items-center justify-between gap-3">
              <div class="font-semibold text-sm">${htmlEscape(b.title)}</div>
              <span class="cp-pill-primary text-xs px-2 py-1 rounded-full">边界</span>
            </div>
            <div class="mt-2 text-sm text-text-secondary">${htmlEscape(b.text)}</div>
          </div>`
        )
        .join("");
    }

    const del = $("#cp-deliverables");
    if (del) {
      del.innerHTML = (state.artifacts.deliverables || [])
        .map(
          (d) => `<div class="cp-card p-4">
            <div class="font-semibold text-sm">${htmlEscape(d.name)}</div>
            <ul class="mt-2 text-sm text-text-secondary list-disc pl-5">
              ${(d.items || []).map((i) => `<li>${htmlEscape(i)}</li>`).join("")}
            </ul>
          </div>`
        )
        .join("");
    }

    const goDetail = $("#cp-go-detail");
    if (goDetail) {
      const run = state.meta.runId || "demo";
      goDetail.href = `P-SOLUTION_DETAIL.html#run=${encodeURIComponent(run)}`;
    }

    const genBtn = $("#cp-generate");
    if (genBtn) genBtn.disabled = (state.todos || []).some((x) => !x.done);
  }

  function mountGenerator() {
    const root = document.querySelector('[data-page="generator"]');
    if (!root) return;

    const state = store.get("cp.collab.state", {
      artifactsSeeded: false,
      meta: { title: "", updatedAt: null, runId: null },
      messages: [],
      todos: [],
      artifacts: null,
    });

    seedArtifacts(state);

    function persist() {
      state.meta.updatedAt = nowISO();
      store.set("cp.collab.state", state);

      // history
      const hist = store.get("cp.history", []);
      const id = state.meta.runId || "draft";
      const entry = {
        id,
        title: state.meta.title || "新方案",
        updatedAt: state.meta.updatedAt,
        score: `${(state.todos || []).filter((x) => x.done).length}/${(state.todos || []).length}`,
      };
      const next = [entry, ...hist.filter((h) => h.id !== id)].slice(0, 20);
      store.set("cp.history", next);
    }

    function addMsg(role, text) {
      state.messages.push({ id: uid(), role, text, ts: nowISO() });
    }

    function handleSend(text) {
      const trimmed = String(text || "").trim();
      if (!trimmed) return;
      addMsg("user", trimmed);

      // small, product-like response (no essays)
      const ai = deriveNextAiTurn(state, trimmed);
      addMsg("ai", ai);

      persist();
      renderGenerator(state);
    }

    // send
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

    // todo toggle
    document.addEventListener("change", (e) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement)) return;
      const id = el.getAttribute("data-todo-id");
      if (!id) return;
      const item = (state.todos || []).find((t) => t.id === id);
      if (!item) return;
      item.done = el.checked;
      persist();
      renderGenerator(state);
    });

    // generate
    const gen = $("#cp-generate");
    if (gen) {
      gen.addEventListener("click", () => {
        if ((state.todos || []).some((x) => !x.done)) return;
        state.meta.runId = uid();
        persist();
        window.location.href = `P-SOLUTION_DETAIL.html#run=${encodeURIComponent(state.meta.runId)}`;
      });
    }

    // initial
    persist();
    renderGenerator(state);
  }

  function mountHistory() {
    const el = document.querySelector("[data-history]");
    if (!el) return;

    const hist = store.get("cp.history", []);
    if (!hist.length) {
      el.innerHTML = `<div class="text-sm text-text-secondary">暂无。去生成器开始一条对话。</div>`;
      return;
    }

    el.innerHTML = hist
      .map(
        (h) => `<a class="block cp-card cp-card-hover p-4" href="P-SOLUTION_DETAIL.html#run=${encodeURIComponent(
          h.id
        )}">
          <div class="flex items-center justify-between gap-3">
            <div class="font-semibold">${htmlEscape(h.title)}</div>
            <span class="cp-pill text-xs px-2 py-1 rounded-full">完成度 ${htmlEscape(h.score || "-")}</span>
          </div>
          <div class="mt-1 text-xs text-text-secondary">更新：${htmlEscape(h.updatedAt || "")}</div>
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
      store.set("cp.auth.user", { name: (email.split("@")[0] || "用户"), email, at: nowISO() });
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
