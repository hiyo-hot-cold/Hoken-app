"use client";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import StatsComponent from "./StatsComponent";

const subjectData = [
    { name: "生命保険総論", icon: "📚" },
    { name: "生命保険計理", icon: "📊" },
    { name: "危険選択", icon: "⚖️" },
    { name: "約款と法律", icon: "📜" },
    { name: "生命保険会計", icon: "💰" },
    { name: "生命保険と営業", icon: "🤝" },
    { name: "生命保険と税法", icon: "💴" },
    { name: "資産運用", icon: "📈" }
];

// ★メアドを伏せ字（use***@domain.com）にする関数
const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [localPart, domainPart] = email.split('@');
    if (localPart.length <= 3) {
        return localPart[0] + '***@' + domainPart;
    } else {
        return localPart.substring(0, 3) + '***@' + domainPart;
    }
};

// ★受け取るデータに userEmail を追加！
export default function QuizComponent({ userId, userEmail }: { userId: string, userEmail: string }) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [activeQuestions, setActiveQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'quiz'>('quiz');

    useEffect(() => {
        async function fetchQuestions() {
            setLoading(true);
            const { data, error } = await supabase.from('questions').select('*');
            if (error) console.error("データ取得エラー:", error);
            else setQuestions(data || []);
            setLoading(false);
        }
        fetchQuestions();
    }, []);

    const handleSubjectSelect = (sub: string) => {
        const filtered = questions.filter(q => q.subject === sub);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setActiveQuestions(shuffled);
        setSelectedSubject(sub);
        setCurrent(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
    };

    const resetQuizState = () => {
        setSelectedSubject(null);
        setActiveQuestions([]);
        setCurrent(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
    };

    const handleBackToMenu = () => {
        const confirmBack = window.confirm("本当に中断して科目選択に戻る？\n（今の正解数や進み具合はリセットされちゃうよ！）");
        if (confirmBack) resetQuizState();
    };

    const handleAnswer = async (selectedIndex: number) => {
        if (selectedAnswer !== null) return;
        const currentQuestion = activeQuestions[current];
        const isCorrect = selectedIndex === currentQuestion.answer;
        setSelectedAnswer(selectedIndex);
        if (isCorrect) setScore(score + 1);
        const { error } = await supabase.from('user_answers').insert({
            user_id: userId, // 保存にはちゃんとUUIDを使うよ！
            question_id: currentQuestion.id,
            is_correct: isCorrect
        });
        if (error) console.error("保存エラー:", error.message);
    };

    const handleNext = () => {
        const next = current + 1;
        if (next < activeQuestions.length) {
            setCurrent(next);
            setSelectedAnswer(null);
        } else {
            setShowResult(true);
        }
    };

    if (loading) {
        return (
            <div className="max-w-md mx-auto text-center p-10 mt-28">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="font-bold text-slate-600">読み込み中...⌛</p>
            </div>
        );
    }

    const renderContent = () => {
        if (activeTab === 'dashboard') {
            return (
                <div className="max-w-md mx-auto px-4 pt-8">
                    <StatsComponent userId={userId} />
                </div>
            );
        }

        if (!selectedSubject) {
            return (
                <div className="max-w-md mx-auto px-4 pt-8 pb-10">
                    <div className="mb-10 flex items-center justify-between px-1">
                        <h2 className="text-3xl font-black text-slate-950 tracking-tighter">科目を選択してね</h2>
                        <span className="text-sm font-bold text-slate-400 bg-white px-4 py-1.5 rounded-full border border-slate-100 shadow-xl shadow-slate-500/5">{subjectData.length} 科目</span>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {subjectData.map((sub) => {
                            const qCount = questions.filter(q => q.subject === sub.name).length;
                            return (
                                <button
                                    key={sub.name}
                                    onClick={() => handleSubjectSelect(sub.name)}
                                    disabled={qCount === 0}
                                    className={`group w-full text-left p-6 rounded-3xl border border-white bg-white backdrop-blur-lg shadow-2xl shadow-slate-500/10 hover:border-blue-200 transition-all active:scale-[0.98] flex items-center gap-6 ${qCount === 0 ? 'opacity-60' : ''}`}
                                >
                                    <span className="text-4xl w-16 h-16 flex items-center justify-center bg-blue-50/70 rounded-2xl group-hover:scale-110 transition-transform duration-300">{sub.icon}</span>

                                    <div className="flex-1">
                                        <span className="font-extrabold text-slate-950 block text-xl mb-1.5 group-hover:text-blue-700 transition-colors">{sub.name}</span>
                                        <span className={`text-xs font-black px-3 py-1 rounded-full inline-block ${qCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                                            {qCount}問 収録
                                        </span>
                                    </div>
                                    <span className="text-4xl text-slate-200 group-hover:text-blue-500 transition-colors group-hover:translate-x-1.5 transition-transform">→</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }

        if (activeQuestions.length === 0) {
            return (
                <div className="max-w-md mx-auto text-center p-12 bg-white rounded-[32px] shadow-2xl border border-white mx-2 mt-12">
                    <span className="text-7xl block mb-6">🚧</span>
                    <p className="mb-8 font-extrabold text-slate-800 text-lg">「{selectedSubject}」の問題はまだ準備中だよ！</p>
                    <button onClick={resetQuizState} className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-black shadow-xl active:scale-95 transition-all hover:bg-slate-800">科目選択に戻る</button>
                </div>
            );
        }

        if (showResult) {
            return (
                <div className="text-center p-12 bg-white rounded-[40px] shadow-2xl border-2 border-white mx-2 mt-12 max-w-md mx-auto">
                    <span className="text-7xl block mb-6">🏆</span>
                    <h2 className="text-xl font-bold text-slate-600 mb-1">{selectedSubject}</h2>
                    <h3 className="text-3xl font-black text-blue-600 mb-10">お疲れ様でした！✨</h3>
                    <div className="bg-slate-50 p-6 rounded-2xl mb-10">
                        <p className="text-sm text-slate-400 mb-1">正解数</p>
                        <p className="text-lg text-slate-600"><span className="text-6xl font-black text-slate-950">{score}</span> / {activeQuestions.length}</p>
                    </div>
                    <div className="space-y-4">
                        <button onClick={() => handleSubjectSelect(selectedSubject)} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all text-lg hover:bg-blue-700">違う順番で再挑戦</button>
                        <button onClick={resetQuizState} className="w-full bg-white text-slate-900 py-4 rounded-2xl font-black border border-slate-200 active:scale-95 transition-all hover:bg-slate-50">他の科目を解く</button>
                    </div>
                </div>
            );
        }

        const currentQuestion = activeQuestions[current];
        const isAnswered = selectedAnswer !== null;

        return (
            <div className="max-w-md mx-auto px-4 pt-6">
                <div className="flex justify-between items-center mb-6 px-1">
                    <button onClick={handleBackToMenu} className="bg-white/60 backdrop-blur-lg text-slate-600 px-5 py-2 rounded-full flex items-center text-xs font-bold shadow-lg shadow-slate-500/5 border border-white hover:border-blue-200 transition-all active:scale-95">
                        <span className="mr-1.5 text-sm">←</span> 戻る
                    </button>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-100 px-4 py-2 rounded-full uppercase tracking-wider">{selectedSubject}</span>
                </div>

                <div className="bg-white/90 backdrop-blur-lg p-7 sm:p-9 rounded-[32px] shadow-2xl shadow-slate-500/5 border border-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1.5 bg-blue-600 transition-all duration-500" style={{ width: `${((current + 1) / activeQuestions.length) * 100}%` }}></div>
                    <div className="text-right mb-5">
                        <span className="text-sm font-black text-slate-400">{current + 1} <span className="text-[11px] text-slate-300">/ {activeQuestions.length}</span></span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-950 mb-8 leading-relaxed tracking-tight">{currentQuestion.question}</h2>

                    <div className="space-y-4">
                        {currentQuestion.options.map((opt: string, index: number) => {
                            let buttonStyle = "border-slate-100 text-slate-800 bg-white hover:border-blue-300 shadow-lg shadow-slate-500/5";
                            if (isAnswered) {
                                if (index === currentQuestion.answer) buttonStyle = "bg-green-600 border-green-600 text-white shadow-xl shadow-green-500/30";
                                else if (index === selectedAnswer) buttonStyle = "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20";
                                else buttonStyle = "bg-white border-slate-50 text-slate-300 opacity-50";
                            }
                            return (
                                <button key={index} disabled={isAnswered} onClick={() => handleAnswer(index)} className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-bold text-sm min-h-[70px] flex items-center justify-between active:scale-[0.98] ${buttonStyle}`}>
                                    <span className="flex-1">{opt}</span>
                                    {isAnswered && index === currentQuestion.answer && <span className="text-2xl ml-3">✅</span>}
                                    {isAnswered && index === selectedAnswer && index !== currentQuestion.answer && <span className="text-2xl ml-3">❌</span>}
                                </button>
                            );
                        })}
                    </div>

                    {isAnswered && (
                        <div className="mt-8 p-6 bg-slate-950 text-white rounded-2xl animate-in fade-in zoom-in duration-300 shadow-2xl">
                            <div className="flex items-center mb-4"><span className="text-[11px] font-black bg-blue-600 px-3 py-1 rounded-full mr-2">解説</span></div>
                            <p className="text-sm leading-relaxed text-slate-300 mb-6 font-medium">{currentQuestion.explanation || "解説はまだ登録されていないよ！"}</p>
                            <button onClick={handleNext} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-base active:scale-95 shadow-xl shadow-blue-500/30 transition-transform hover:translate-y-[-2px]">
                                {current < activeQuestions.length - 1 ? "次の問題へ！" : "結果を見る"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 relative pb-32">

            {/* ★ここが完成版のトップバー！メアドは伏せ字、ボタンは1つ！ */}
            <div className="bg-white border-b border-slate-100 shadow-xl shadow-slate-500/5 sticky top-0 z-40">
                <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between gap-3">
                    <div className="bg-slate-100/70 px-4 py-2 rounded-xl border border-slate-200/60 shadow-inner">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wide">Account</span>
                        <span className="block text-sm font-extrabold text-slate-950 max-w-[200px] truncate">
                            {/* ★本物のメアド(userEmail)を伏せ字にして表示！ */}
                            {maskEmail(userEmail)}
                        </span>
                    </div>
                    <button onClick={() => supabase.auth.signOut()} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all hover:bg-slate-800 shadow-md">
                        ログアウト
                    </button>
                </div>
            </div>

            {/* メインエリア */}
            {renderContent()}

            {/* 下部タブナビゲーション */}
            <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-100 pb-safe shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.1)] z-50">
                <div className="max-w-md mx-auto flex justify-around p-3 gap-1">
                    <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center justify-center w-full pt-3 pb-2.5 rounded-2xl transition-all duration-300 gap-1.5 ${activeTab === 'dashboard' ? 'text-blue-700 bg-blue-100/70 shadow-inner' : 'text-slate-400 hover:text-slate-700'}`}>
                        <span className={`text-2xl transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110' : 'scale-100'}`}>📊</span>
                        <span className="text-[11px] font-black tracking-tight">成績・分析</span>
                    </button>

                    <button onClick={() => setActiveTab('quiz')} className={`flex flex-col items-center justify-center w-full pt-3 pb-2.5 rounded-2xl transition-all duration-300 gap-1.5 ${activeTab === 'quiz' ? 'text-blue-700 bg-blue-100/70 shadow-inner' : 'text-slate-400 hover:text-slate-700'}`}>
                        <span className={`text-2xl transition-transform duration-300 ${activeTab === 'quiz' ? 'scale-110' : 'scale-100'}`}>📝</span>
                        <span className="text-[11px] font-black tracking-tight">問題を解く</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
