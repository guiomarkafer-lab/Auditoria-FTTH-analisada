import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, Send, Loader2, Bot, AlertCircle } from 'lucide-react';
import { generateSmartLocalAnalysis } from '../utils/auditEngine';

interface GeminiModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'technician' | 'supervisor';
  targetName: string;
  targetMetrics: any;
}

export const GeminiModal: React.FC<GeminiModalProps> = ({
  isOpen,
  onClose,
  type,
  targetName,
  targetMetrics,
}) => {
  const [loading, setLoading] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [customQuestion, setCustomQuestion] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAiOnline, setIsAiOnline] = useState(true);

  const fetchAnalysis = async (customPrompt?: string) => {
    if (!targetName) return;
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contextType: type,
          targetName,
          targetMetrics,
          prompt: customPrompt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setAnalysisText(data.text);
        setIsAiOnline(true);
      } else {
        // Fallback to local intelligent analysis
        setIsAiOnline(false);
        const fallback = generateSmartLocalAnalysis(type, targetName, targetMetrics);
        setAnalysisText(fallback);
        if (data.error && !data.fallback) {
          setErrorMsg(data.error);
        }
      }
    } catch (err: any) {
      setIsAiOnline(false);
      const fallback = generateSmartLocalAnalysis(type, targetName, targetMetrics);
      setAnalysisText(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && targetName) {
      setCustomQuestion('');
      fetchAnalysis();
    }
  }, [isOpen, targetName]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(analysisText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim() || loading) return;
    const prompt = `Pergunta adicional do usuário sobre ${type === 'supervisor' ? 'o supervisor' : 'o instalador'} "${targetName}":
"${customQuestion}"

Dados do profissional:
${JSON.stringify(targetMetrics, null, 2)}

Por favor responda com embasamento técnico em redes FTTx/GPON e boas práticas operacionais Sebratel.`;
    fetchAnalysis(prompt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 p-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white">Análise Inteligente Gemini</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                  gemini-3.8-flash
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {type === 'supervisor' ? 'Diagnóstico de Equipe de Supervisão' : 'Coaching Técnico do Instalador'}:{' '}
                <b className="text-white">{targetName}</b>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs flex items-center gap-1.5"
              title="Copiar parecer"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span className="hidden sm:inline">{isCopied ? 'Copiado!' : 'Copiar'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-sm font-medium">O Gemini está analisando os dados da rede FTTx...</p>
              <p className="text-xs text-slate-500">Correlacionando itens de conectorização, sinal RX e ancoragem</p>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed space-y-3 whitespace-pre-wrap font-sans bg-slate-950/50 p-5 rounded-xl border border-slate-800/80">
              {analysisText}
            </div>
          )}
        </div>

        {/* Footer Question Input */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Bot className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Pergunte ao Gemini (ex: como treinar esse instalador para evitar atenuamento no RX?)..."
                disabled={loading}
                className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !customQuestion.trim()}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Enviar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
