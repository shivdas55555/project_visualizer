import { useMemo, useState } from 'react';
import ProblemInput from '../components/ProblemInput/ProblemInput';
import CodeViewer from '../components/CodeViewer/CodeViewer';
import ControlPanel from '../components/ControlPanel/ControlPanel';
import AlgorithmInfo from '../components/AlgorithmInfo/AlgorithmInfo';
import ExplanationPanel from '../components/ExplanationPanel/ExplanationPanel';
import AICoach from '../components/AICoach';
import DPGrid2D from '../visualizers/dp/DPGrid2D';
import DPGrid3D from '../visualizers/threeD/DPGrid3D';
import RecursionTree from '../visualizers/recursion/RecursionTree';
import GreedyPath from '../visualizers/greedy/GreedyPath';
import Legend from '../visualizers/common/Legend';
import { useStepPlayer } from '../engine/stepManager';
import { algorithmRegistry } from '../metadata/algorithmRegistry';
import { fibonacciModule } from '../algorithms/fibonacci';
import { coinChangeModule } from '../algorithms/coinChange';
import { knapsackModule } from '../algorithms/knapsack';
import type { AlgorithmModule, ProblemRepresentation, Strategy } from '../engine/types';

const modules: Record<string, AlgorithmModule> = { fibonacci: fibonacciModule, 'coin-change': coinChangeModule, knapsack: knapsackModule };
type Visualization = 'recursion-tree' | 'greedy-path' | '1d-dp' | '2d-dp';
function resolveVisualization(strategy: Strategy, dimensions: 1 | 2): Visualization {
  if (strategy === 'greedy') return 'greedy-path';
  if (strategy === 'recursion' || strategy === 'memoization') return 'recursion-tree';
  return dimensions === 2 ? '2d-dp' : '1d-dp';
}

export default function App() {
  const [representation, setRepresentation] = useState<ProblemRepresentation | null>(null);
  const [strategy, setStrategy] = useState<Strategy>('tabulation');
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [compareMode, setCompareMode] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const meta = representation ? algorithmRegistry[representation.problemType] : null;
  const module = representation ? modules[representation.problemType] : null;
  const mainTrace = useMemo(() => (!representation || !module ? [] : module.generateTrace(representation.input, strategy)), [representation, module, strategy]);
  const player = useStepPlayer(mainTrace);
  const tabTrace = useMemo(() => representation?.problemType === 'coin-change' ? coinChangeModule.generateTrace(representation.input, 'tabulation') : [], [representation]);
  const greedyTrace = useMemo(() => representation?.problemType === 'coin-change' ? coinChangeModule.generateTrace(representation.input, 'greedy') : [], [representation]);
  const tabPlayer = useStepPlayer(tabTrace);
  const greedyPlayer = useStepPlayer(greedyTrace);
  const handleParsed = (rep: ProblemRepresentation) => { setRepresentation(rep); setStrategy(rep.strategy); setViewMode('2d'); setCompareMode(false); };
  const visualization = representation ? resolveVisualization(strategy, representation.state.dimensions) : null;
  const code = module?.code[strategy] ?? Object.values(module?.code ?? {})[0] ?? '';

  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark">⌘</div><div className="brand-copy"><strong>Algo<span>Studio</span></strong><small>MAKE ALGORITHMS CLICK</small></div><div className="topbar-center"><span className="status-pulse" /> INTERACTIVE LEARNING ENVIRONMENT</div><div className="topbar-right"><span className="top-pill">BETA</span><div className="avatar">A</div></div></header>
    <div className="workspace">
      <aside className="left-rail"><div className="section-kicker">01 / INPUT</div><h2>Bring a problem.</h2><p className="muted-copy">Paste a statement or choose a playground example. We'll turn it into something you can explore.</p><ProblemInput onParsed={handleParsed} />
        <div className="rail-divider" /><button className="code-toggle" onClick={() => setShowCode(!showCode)}><span>⌘</span> Source code <span className="toggle-state">{showCode ? '−' : '+'}</span></button>{showCode && module && <CodeViewer code={code} activeLine={player.currentStep?.codeLine} />}
        <div className="sidebar-foot"><span className="foot-spark">✦</span><span>Understand the <b>why</b>, not just the answer.</span></div>
      </aside>

      <main className="center-stage"><div className="stage-header"><div><div className="section-kicker">02 / VISUAL LAB</div><h1>{meta?.label ?? 'See the algorithm think'}<span className="title-dot">.</span></h1><p>{representation ? 'Explore every state, transition, and decision in the execution.' : 'A visual playground for recursion, dynamic programming, and greedy choices.'}</p></div>{representation && <div className="stage-badges"><span className="soft-badge">{strategy.toUpperCase()}</span><span className="soft-badge purple">{viewMode.toUpperCase()} VIEW</span></div>}</div>
        {!representation ? <div className="welcome-panel"><div className="welcome-glow"/><div className="hero-kicker"><span>✦</span> LEARN BY SEEING</div><h2>Complex ideas.<br/><em>Clear in motion.</em></h2><p>Watch recursion unfold, trace DP states, compare greedy decisions, and ask your AI study partner when something doesn't click.</p><div className="feature-row"><div className="feature-tile"><span className="feature-icon blue">◉</span><b>Step-by-step</b><small>Play every transition</small></div><div className="feature-tile"><span className="feature-icon purple">◇</span><b>3D exploration</b><small>See state spaces</small></div><div className="feature-tile"><span className="feature-icon mint">✦</span><b>AI study buddy</b><small>Ask why, anytime</small></div></div><div className="welcome-hint"><span>↖</span> Start with a sample problem in the left panel <span className="hint-line"/></div></div> : <>
          <div className="visual-card"><div className="visual-toolbar"><div className="window-dots"><i/><i/><i/></div><span className="visual-label">LIVE EXECUTION CANVAS</span><span className="step-counter">STEP {player.total ? String(player.currentIndex + 1).padStart(2, '0') : '00'} <b>/ {String(player.total).padStart(2, '0')}</b></span></div><div className="visual-inner"><Legend />
            {compareMode ? <div className="compare-grid"><section className="compare-pane"><div className="compare-title"><span className="compare-dot dp"/>DYNAMIC PROGRAMMING</div><div className="compare-content"><DPGrid2D trace={tabTrace} stepsSoFar={tabPlayer.stepsSoFar} dimensions={1}/></div><ControlPanel player={tabPlayer} strategies={['tabulation']} strategy="tabulation" onStrategyChange={() => {}} supports3D={false} viewMode="2d" onViewModeChange={() => {}} supportsGreedyComparison={false} compareMode={false} onCompareModeChange={() => {}}/></section><section className="compare-pane"><div className="compare-title"><span className="compare-dot greedy"/>GREEDY APPROACH</div><div className="compare-content"><GreedyPath stepsSoFar={greedyPlayer.stepsSoFar}/></div><ControlPanel player={greedyPlayer} strategies={['greedy']} strategy="greedy" onStrategyChange={() => {}} supports3D={false} viewMode="2d" onViewModeChange={() => {}} supportsGreedyComparison={false} compareMode={false} onCompareModeChange={() => {}}/></section></div> : <div className="canvas-content">{visualization === 'recursion-tree' && <RecursionTree stepsSoFar={player.stepsSoFar}/>}{visualization === 'greedy-path' && <GreedyPath stepsSoFar={player.stepsSoFar}/>}{visualization === '1d-dp' && <DPGrid2D trace={mainTrace} stepsSoFar={player.stepsSoFar} dimensions={1}/>}{visualization === '2d-dp' && (viewMode === '3d' ? <DPGrid3D trace={mainTrace} stepsSoFar={player.stepsSoFar}/> : <DPGrid2D trace={mainTrace} stepsSoFar={player.stepsSoFar} dimensions={2}/>)}</div>}
          </div></div>
          {!compareMode && <div className="playback-card"><div className="playback-label"><span className="play-icon">▶</span><div><b>Execution controls</b><small>Pause, step, or change the pace</small></div></div><ControlPanel player={player} strategies={meta?.strategies ?? [strategy]} strategy={strategy} onStrategyChange={setStrategy} supports3D={Boolean(meta?.supports3D && representation.state.dimensions === 2)} viewMode={viewMode} onViewModeChange={setViewMode} supportsGreedyComparison={Boolean(meta?.supportsGreedyComparison)} compareMode={compareMode} onCompareModeChange={setCompareMode}/></div>}
          </>}
      </main>

      <aside className="right-rail"><div className="section-kicker">03 / YOUR GUIDE</div>{representation && meta && <AlgorithmInfo meta={meta} representation={representation} strategy={strategy} currentStep={player.currentStep}/>}<div className="explanation-wrap"><div className="panel-heading"><div><span className="panel-icon">↗</span><b>What just happened?</b></div><span className="live-label">LIVE</span></div><ExplanationPanel stepsSoFar={compareMode ? tabPlayer.stepsSoFar : player.stepsSoFar}/></div><AICoach representation={representation} strategy={strategy} currentNote={player.currentStep?.note}/><div className="concept-card"><div className="concept-icon">⌁</div><div><b>Remember the transformation</b><p>Memoization caches answers during recursion. Tabulation fills the same recurrence in dependency order—often removing call-stack overhead.</p></div></div></aside>
    </div><footer className="app-footer"><span>✦ ALGOSTUDIO</span><span>Built for curiosity, powered by clear thinking.</span><span>LEARN · TRACE · UNDERSTAND</span></footer>
  </div>;
}
