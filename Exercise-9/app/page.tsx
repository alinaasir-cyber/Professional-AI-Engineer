"use client";

import { useState } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  eventName: string;
  payload: Record<string, unknown>;
  responseIds?: string[];
  status: "success" | "error";
  message?: string;
}

interface PendingApproval {
  requestId: string;
  action: string;
  requestedBy: string;
  createdAt: string;
  status: "WAITING" | "APPROVED" | "REJECTED";
}

export default function Home() {
  // Logs state
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Card 1: Multi-step states
  const [dataSource, setDataSource] = useState("api");

  // Card 2: Delay step states
  const [emailList, setEmailList] = useState(
    "alice@example.com\nbob@example.com\ncharlie@example.com"
  );
  const [delayDuration, setDelayDuration] = useState("2s");

  // Card 3: Approval workflow states
  const [approvalRequestId, setApprovalRequestId] = useState("req_1001");
  const [approvalAction, setApprovalAction] = useState("Deploy AI Agent v2.0 to Production");
  const [approvalRequester, setApprovalRequester] = useState("Senior AI Engineer");
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [approverName, setApproverName] = useState("Abdinaasir (Human Reviewer)");

  // Card 4: Code Writer Agent states (@inngest/agent-kit)
  const [codePrompt, setCodePrompt] = useState(
    "Write a TypeScript utility function to calculate Fibonacci numbers with memoization"
  );

  // Section 5: 5 AI Agents + Supervisor Router Pipeline
  const [multiAgentTopic, setMultiAgentTopic] = useState(
    "The Rise of Autonomous AI Agents in 2026"
  );

  // Helper to append logs
  const addLog = (entry: Omit<LogEntry, "id" | "timestamp">) => {
    const newLog: LogEntry = {
      ...entry,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Generic event sender
  const sendEvent = async (name: string, data: Record<string, unknown>, actionKey: string) => {
    setLoadingAction(actionKey);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, data }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        addLog({
          eventName: name,
          payload: data,
          responseIds: json.ids,
          status: "success",
          message: `Successfully emitted event [${name}]`,
        });
        return json;
      } else {
        throw new Error(json.error || "Event emission failed");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error sending event";
      addLog({
        eventName: name,
        payload: data,
        status: "error",
        message: msg,
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // 1. Trigger Multi-Step
  const handleTriggerMultiStep = async () => {
    await sendEvent(
      "data/process",
      { source: dataSource.trim() || "api" },
      "multi-step"
    );
  };

  // 2. Trigger Delay Step (Rate-Limited Email Sender)
  const handleTriggerEmailDelay = async () => {
    const emails = emailList
      .split("\n")
      .map((e) => e.trim())
      .filter((e) => e.length > 0);

    if (emails.length === 0) {
      alert("Fadlan geli ugu yaraan hal email!");
      return;
    }

    await sendEvent(
      "email/send-batch",
      {
        emails,
        delay: delayDuration,
      },
      "email-delay"
    );
  };

  // 3a. Start Approval Request (Wait for Event)
  const handleStartApproval = async () => {
    const reqId = approvalRequestId.trim() || `req_${Date.now().toString().slice(-6)}`;
    const action = approvalAction.trim() || "AI Action Approval";
    const requestedBy = approvalRequester.trim() || "AI Agent";

    const res = await sendEvent(
      "approval/requested",
      {
        requestId: reqId,
        action,
        requestedBy,
      },
      "approval-start"
    );

    if (res?.success) {
      setPendingApprovals((prev) => [
        {
          requestId: reqId,
          action,
          requestedBy,
          createdAt: new Date().toLocaleTimeString(),
          status: "WAITING",
        },
        ...prev,
      ]);
      setApprovalRequestId(`req_${Date.now().toString().slice(-6)}`);
    }
  };

  // 3b. Human-in-the-Loop: Respond with Approve or Reject
  const handleApprovalResponse = async (requestId: string, approved: boolean) => {
    await sendEvent(
      "approval/responded",
      {
        requestId,
        approved,
        approver: approverName.trim() || "Human Reviewer",
        comments: approved
          ? "Approved manually by human reviewer in UI"
          : "Rejected manually by human reviewer in UI",
      },
      `respond-${requestId}-${approved ? "yes" : "no"}`
    );

    setPendingApprovals((prev) =>
      prev.map((item) =>
        item.requestId === requestId
          ? { ...item, status: approved ? "APPROVED" : "REJECTED" }
          : item
      )
    );
  };

  // 4. Trigger Code Writer AI Agent (@inngest/agent-kit)
  const handleTriggerCodeWriter = async () => {
    await sendEvent(
      "agent/code-writer",
      { prompt: codePrompt.trim() },
      "code-writer"
    );
  };

  // 5. Trigger Multi-Agent Network (5 Agents + Supervisor Router)
  const handleTriggerMultiAgentNetwork = async () => {
    await sendEvent(
      "multi-agent/publish",
      { topic: multiAgentTopic.trim() },
      "multi-agent-publish"
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Professional AI Engineer Track • Exercise #8
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Inngest for AI Agents: The Essentials
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Dhisidda 3-da shaqo ee Inngest (Multi-Step, Delay Step, &amp; Human-in-the-Loop) iyo kicin toos ah oo Frontend-ka ah.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="http://localhost:8288"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition shadow-sm hover:shadow-indigo-500/20"
            >
              <span>Fur Inngest Dashboard</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </header>

        {/* Inngest Dev Server Command Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-200">Terminal-ka ka kici Inngest Dev Server:</p>
              <code className="text-xs text-indigo-300 font-mono">
                npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
              </code>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText("npx inngest-cli@latest dev -u http://localhost:3000/api/inngest");
              alert("Waxaa la koobiyeeyay amarka Inngest dev server!");
            }}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-medium border border-slate-700 transition"
          >
            Koobiyeyso Amarka
          </button>
        </div>

        {/* Workflows & AI Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Multi-Step */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 rounded-md">
                  2.1b Multi-Step
                </span>
                <span className="text-xs font-mono text-slate-400">step.run()</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                Data Processor (3 Steps)
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Waxay qabataa 3 tallaabo oo is-xiga: <code>fetch-data</code> → <code>transform-data</code> → <code>summarize-and-save</code>.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Data Source:
                  </label>
                  <input
                    type="text"
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value)}
                    placeholder="tusaale: api, database, support"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-xs space-y-1.5">
                  <div className="flex items-center text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-slate-800 inline-flex items-center justify-center text-[10px] mr-2">1</span>
                    <span>Step 1: Fetch mock records</span>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-slate-800 inline-flex items-center justify-center text-[10px] mr-2">2</span>
                    <span>Step 2: Sentiment &amp; rating filter</span>
                  </div>
                  <div className="flex items-center text-slate-400">
                    <span className="w-4 h-4 rounded-full bg-slate-800 inline-flex items-center justify-center text-[10px] mr-2">3</span>
                    <span>Step 3: Save analysis summary</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleTriggerMultiStep}
              disabled={loadingAction === "multi-step"}
              className="mt-6 w-full py-2.5 px-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-800 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {loadingAction === "multi-step" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Waa la dirayaa...</span>
                </>
              ) : (
                <>
                  <span>Kici data/process</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Card 2: Delay Step */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-md">
                  2.2 Delay Step
                </span>
                <span className="text-xs font-mono text-slate-400">step.sleep()</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                Rate-Limited Email Sender
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Waxay emails-ka u diraysaa mid mid iyadoo hakad (delay) u dhaxaysiinaysa diris kasta.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Emails (Mid kasta sadar gooni ah):
                  </label>
                  <textarea
                    rows={3}
                    value={emailList}
                    onChange={(e) => setEmailList(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mudada Hakadka (Delay Interval):
                  </label>
                  <select
                    value={delayDuration}
                    onChange={(e) => setDelayDuration(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="2s">2 ilbiriqsi (2s)</option>
                    <option value="5s">5 ilbiriqsi (5s)</option>
                    <option value="10s">10 ilbiriqsi (10s)</option>
                    <option value="30s">30 ilbiriqsi (30s)</option>
                    <option value="1m">1 daqiiqo (1m)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleTriggerEmailDelay}
              disabled={loadingAction === "email-delay"}
              className="mt-6 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {loadingAction === "email-delay" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Waa la dirayaa...</span>
                </>
              ) : (
                <>
                  <span>Kici email/send-batch</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Card 3: Wait for Event */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-400/10 border border-rose-400/20 px-2.5 py-1 rounded-md">
                  2.3 Wait For Event
                </span>
                <span className="text-xs font-mono text-slate-400">step.waitForEvent()</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                Approval Workflow (Human-in-the-Loop)
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                AI Agent-ku wuxuu shaqada hakinayaa ilaa qof bini-aadam ah uu badhanka Ogolaanshaha gujiyo.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Request ID:
                  </label>
                  <input
                    type="text"
                    value={approvalRequestId}
                    onChange={(e) => setApprovalRequestId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hawsha Ogolaanshaha (Action):
                  </label>
                  <input
                    type="text"
                    value={approvalAction}
                    onChange={(e) => setApprovalAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Magaca Reviewer-ka (Approver):
                  </label>
                  <input
                    type="text"
                    value={approverName}
                    onChange={(e) => setApproverName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleStartApproval}
              disabled={loadingAction === "approval-start"}
              className="mt-6 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {loadingAction === "approval-start" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Waa la dirayaa...</span>
                </>
              ) : (
                <>
                  <span>Bilaab Approval Workflow</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Card 4: Code Writer AI Agent (@inngest/agent-kit) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-700 transition shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2.5 py-1 rounded-md">
                  Agent Kit
                </span>
                <span className="text-xs font-mono text-slate-400">createAgent()</span>
              </div>
              <h2 className="text-lg font-bold text-white mb-1">
                Code Writer Agent
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                AI Agent leh awoodda qorista TypeScript nadiif ah oo ku shaqaynaya <code>gpt-4o-mini</code>.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Waxaad rabto inuu code-ka ka qoro (Prompt):
                  </label>
                  <textarea
                    rows={4}
                    value={codePrompt}
                    onChange={(e) => setCodePrompt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 resize-none font-mono"
                    placeholder="Geli waxaad rabto inuu code-ka kuu qoro..."
                  />
                </div>
                <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-purple-400 font-semibold">System: </span>
                  Expert TypeScript programmer. Outputs XML &lt;file name=&apos;...&apos;&gt;
                </div>
              </div>
            </div>

            <button
              onClick={handleTriggerCodeWriter}
              disabled={loadingAction === "code-writer"}
              className="mt-6 w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
            >
              {loadingAction === "code-writer" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Agent-ku wuu qorayaa...</span>
                </>
              ) : (
                <>
                  <span>Kici Code Writer Agent</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section: 5 AI Agents + Supervisor Router Architecture */}
        <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-1">
                Multi-AI Agent System
              </div>
              <h2 className="text-xl font-extrabold text-white">
                5 Autonomous AI Agents + Supervisor Router (Shared State)
              </h2>
              <p className="text-xs text-slate-400">
                Qaab-dhismeedka rasmiga ah ee casharka: 5 Agent oo wadaaga hal xaalad (Shared State) iyadoo Supervisor Router-ku hagaayo.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={multiAgentTopic}
                onChange={(e) => setMultiAgentTopic(e.target.value)}
                placeholder="Topic: tusaale, AI Agents 2026"
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-64"
              />
              <button
                onClick={handleTriggerMultiAgentNetwork}
                disabled={loadingAction === "multi-agent-publish"}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
              >
                {loadingAction === "multi-agent-publish" ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                    <span>Waa la kicinayaa...</span>
                  </>
                ) : (
                  <>
                    <span>Kici 5-ta Agent Pipeline</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Architecture Diagram Representation */}
          <div className="space-y-4">
            {/* Top: Supervisor Router */}
            <div className="flex justify-center">
              <div className="w-full max-w-md bg-indigo-950/40 border-2 border-indigo-500/40 rounded-xl p-3 text-center shadow-md">
                <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold block">
                  ORCHESTRATOR
                </span>
                <span className="text-sm font-bold text-white">
                  SUPERVISOR ROUTER
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Wuxuu eegaa <code>network.state.data</code> wuxuuna go&apos;aamiyaa agent-ka ku xiga.
                </p>
              </div>
            </div>

            {/* Arrows Down */}
            <div className="flex justify-center text-indigo-500/50">
              <svg className="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>

            {/* 5 Agents Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {/* Agent 1 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center hover:border-indigo-500/40 transition">
                <span className="text-[10px] font-mono text-cyan-400 font-bold block mb-0.5">Agent 1</span>
                <h4 className="text-xs font-bold text-white mb-1">News Scout</h4>
                <p className="text-[10px] text-slate-400">
                  Wuxuu soo helaa wararka &amp; xogta cusub.
                </p>
                <div className="mt-2 text-[9px] font-mono text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  writes: state.news
                </div>
              </div>

              {/* Agent 2 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center hover:border-indigo-500/40 transition">
                <span className="text-[10px] font-mono text-amber-400 font-bold block mb-0.5">Agent 2</span>
                <h4 className="text-xs font-bold text-white mb-1">Sentiment Analyzer</h4>
                <p className="text-[10px] text-slate-400">
                  Falanqaynta dareenka &amp; niyadda dadweynaha.
                </p>
                <div className="mt-2 text-[9px] font-mono text-amber-300 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/40">
                  writes: state.sentiment
                </div>
              </div>

              {/* Agent 3 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center hover:border-indigo-500/40 transition">
                <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-0.5">Agent 3</span>
                <h4 className="text-xs font-bold text-white mb-1">Content Creator</h4>
                <p className="text-[10px] text-slate-400">
                  Qorista maqaalka, qoraalka &amp; hooks-ka.
                </p>
                <div className="mt-2 text-[9px] font-mono text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  writes: state.content
                </div>
              </div>

              {/* Agent 4 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center hover:border-indigo-500/40 transition">
                <span className="text-[10px] font-mono text-purple-400 font-bold block mb-0.5">Agent 4</span>
                <h4 className="text-xs font-bold text-white mb-1">Poster Designer</h4>
                <p className="text-[10px] text-slate-400">
                  Naqshadaynta boorarka &amp; AI Image Prompts.
                </p>
                <div className="mt-2 text-[9px] font-mono text-purple-300 bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-800/40">
                  writes: state.poster
                </div>
              </div>

              {/* Agent 5 */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-center hover:border-indigo-500/40 transition">
                <span className="text-[10px] font-mono text-rose-400 font-bold block mb-0.5">Agent 5</span>
                <h4 className="text-xs font-bold text-white mb-1">Moderator</h4>
                <p className="text-[10px] text-slate-400">
                  Hubinta badbaadada, tayada &amp; ogolaanshaha.
                </p>
                <div className="mt-2 text-[9px] font-mono text-rose-300 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-800/40">
                  writes: state.moderation
                </div>
              </div>
            </div>

            {/* Bottom: Shared State Box */}
            <div className="bg-slate-950 border-2 border-dashed border-indigo-500/30 rounded-xl p-4 text-center">
              <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                SHARED STATE CONTRACT (network.state.data)
              </span>
              <p className="text-xs text-slate-300 mt-1">
                Dhammaan 5-ta Agent waxay wax ku qoraan kuna akhristaan hal xaalad oo wadaag ah:
              </p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px] font-mono">
                <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-cyan-400">news</span>
                <span className="text-slate-600">→</span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-amber-400">sentiment</span>
                <span className="text-slate-600">→</span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-emerald-400">content</span>
                <span className="text-slate-600">→</span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-purple-400">poster</span>
                <span className="text-slate-600">→</span>
                <span className="bg-slate-900 border border-slate-800 px-2 py-1 rounded text-rose-400">moderation</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Pending Human Approvals (Active wait states) */}
        {pendingApprovals.length > 0 && (
          <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  Human Approval Panel (Human-in-the-Loop)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Shaqooyinkan hadda waxay ku jiraan <code>step.waitForEvent()</code> waxayna sugayaan go&apos;aankaaga!
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono">
                {pendingApprovals.filter((x) => x.status === "WAITING").length} Sugaya
              </span>
            </div>

            <div className="space-y-3">
              {pendingApprovals.map((req) => (
                <div
                  key={req.requestId}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                        {req.requestId}
                      </span>
                      <span className="text-xs text-slate-400">Bilaabmay: {req.createdAt}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold ${
                          req.status === "WAITING"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : req.status === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{req.action}</p>
                    <p className="text-xs text-slate-400">Waxaa codsaday: {req.requestedBy}</p>
                  </div>

                  {req.status === "WAITING" ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprovalResponse(req.requestId, true)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Ogolaaw (Approve)</span>
                      </button>
                      <button
                        onClick={() => handleApprovalResponse(req.requestId, false)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Diid (Reject)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-slate-400 italic">
                      Go&apos;aanka waa la gudbiyey ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Logs & Output Console */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Dhacdooyinka la Diray (Live Event Logs)
              </h3>
              <p className="text-xs text-slate-400">
                Dhacdo kasta oo aad kor ka kiciso halkan ayay ku soo muuqanaysaa, iyadoo Inngest u dirtay Event ID.
              </p>
            </div>
            {logs.length > 0 && (
              <button
                onClick={() => setLogs([])}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Nadiifi Logs
              </button>
            )}
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
              Weli wax event ah lama dirin. Guji mid ka mid ah badhamada kore si aad u kiciso shaqo!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-xl border text-xs font-mono transition ${
                    log.status === "success"
                      ? "bg-slate-950 border-emerald-500/20 text-slate-300"
                      : "bg-rose-950/20 border-rose-500/30 text-rose-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-indigo-400">{log.eventName}</span>
                    <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                  </div>
                  {log.message && <p className="mb-1.5 text-slate-400">{log.message}</p>}
                  {log.responseIds && log.responseIds.length > 0 && (
                    <div className="text-[11px] text-emerald-400 mb-1">
                      Event IDs: {log.responseIds.join(", ")}
                    </div>
                  )}
                  <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80 overflow-x-auto text-[11px]">
                    <span className="text-slate-500">Payload: </span>
                    {JSON.stringify(log.payload)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
