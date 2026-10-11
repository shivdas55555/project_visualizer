import { useState } from 'react';
import type { ProblemRepresentation, Strategy } from '../engine/types';

type Props = { representation: ProblemRepresentation | null; strategy: Strategy; currentNote?: string };

function localAnswer(question: string, rep: ProblemRepresentation | null, strategy: Strategy) {
  const q = question.toLowerCase();
  const kind = rep?.problemType ?? 'this problem';
  if (q.includes('greedy') || strategy === 'greedy') {
    if (kind === 'coin-change') return 'Greedy takes the locally largest coin first. For coins [1, 3, 4] and target 6, it picks 4, then 1, then 1 (3 coins). But 3 + 3 uses only 2 coins. The locally best move does not guarantee the globally best answer, so use DP when choices overlap and you need to compare alternatives.';
    return 'Greedy commits to the best-looking local choice without revisiting it. It works only when the problem has a proven greedy-choice property. Try to find a counterexample where one early choice blocks a better complete solution; if you can, compare alternatives with dynamic programming.';
  }
  if (q.includes('tabul') || q.includes('bottom') || q.includes('memo')) return 'Memoization is top-down: start from the requested state, recurse into smaller states, and cache each answer. Tabulation is bottom-up: write the same recurrence as a table, order states so dependencies are ready first, initialize base cases, then fill the table. The recurrence stays the same; only the evaluation order changes.';
  if (q.includes('3d') || q.includes('dimension') || q.includes('state')) return 'A DP state records everything needed to describe a smaller subproblem. If the answer depends on three changing variables, you may need dp[i][j][k]. Each axis is one state variable; transitions move between neighboring states. Before coding, explain what each index means and identify the base cases.';
  return `Let's reason about ${kind}. First define the state in one sentence, then write the transition and base case. Current view: ${strategy}. ${rep ? `The visualizer has parsed this as ${rep.problemType}; step through the trace to see how states change.` : 'Paste a problem and choose Analyze to start.'}`;
}

export default function AICoach({ representation, strategy, currentNote }: Props) {
  const [question, setQuestion] = useState('Why might greedy fail here?');
  const [answer, setAnswer] = useState('Ask me about the recurrence, greedy choices, memoization, tabulation, or the current step.');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);

  const ask = async (prompt = question) => {
    if (!prompt.trim()) return;
    setBusy(true);
    try {
      // Optional server endpoint: keep provider/API keys on the server, never in Vite env.
      const response = await fetch('/api/coach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: prompt, problemType: representation?.problemType, input: representation?.input, strategy, currentNote }),
      });
      if (!response.ok) throw new Error('Coach endpoint is not configured');
      const data = await response.json();
      setAnswer(data.answer ?? data.explanation ?? localAnswer(prompt, representation, strategy));
    } catch {
      setAnswer(`${localAnswer(prompt, representation, strategy)}\n\nLocal guidance is active. To enable generated AI answers, connect a secure backend POST /api/coach endpoint.`);
    } finally { setBusy(false); }
  };

  const listen = () => {
    const w = window as any;
    const Recognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Recognition) { setAnswer('Voice input is not supported in this browser. Try a recent version of Chrome or Edge, or type your question.'); return; }
    const recognition = new Recognition();
    recognition.lang = 'en-US'; recognition.interimResults = false; recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setAnswer('I could not hear that clearly. Please try again or type your question.'); };
    recognition.onresult = (event: any) => { const transcript = event.results?.[0]?.[0]?.transcript ?? ''; setQuestion(transcript); void ask(transcript); };
    recognition.start();
  };

  return <section className="coach-card">
    <div className="coach-heading"><div className="coach-orb">✦</div><div><div className="eyebrow">YOUR STUDY PARTNER</div><h3>Algo Coach <span className="live-dot" /></h3></div><span className="coach-tag">AI LAB</span></div>
    <p className="coach-subtitle">Talk through the idea, not just the code.</p>
    <div className="coach-prompts">
      {['Why does greedy fail?', 'Memoization → tabulation', 'Explain this state'].map((item) => <button key={item} onClick={() => { setQuestion(item); void ask(item); }}>{item}</button>)}
    </div>
    <label className="sr-only" htmlFor="coach-question">Ask Algo Coach</label>
    <textarea id="coach-question" value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="Ask why a choice works, or where the recurrence comes from…" />
    <div className="coach-actions"><button className={`mic-btn ${listening ? 'listening' : ''}`} onClick={listen} title="Ask by voice">{listening ? '◉ Listening…' : '🎙 Talk'}</button><button className="ask-btn" onClick={() => void ask()} disabled={busy}>{busy ? 'Thinking…' : 'Ask coach ↗'}</button></div>
    <div className="coach-answer"><div className="answer-label"><span>✦</span> EXPLANATION</div><p>{answer}</p></div>
  </section>;
}
