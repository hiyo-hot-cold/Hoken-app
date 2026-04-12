"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import StatsComponent from "./StatsComponent";

const subjectData = [
    { name: "生命保険総論", image: "/icons/1_souron.png" },
    { name: "生命保険計理", image: "/icons/2_keiri.png" },
    { name: "危険選択", image: "/icons/3_kikensentaku.png" },
    { name: "約款と法律", image: "/icons/4_yakkantohouritsu.png" },
    { name: "生命保険会計", image: "/icons/5_kaikei.png" },
    { name: "生命保険と営業", image: "/icons/6_eigyou.png" },
    { name: "生命保険と税法", image: "/icons/7_zeihou.png" },
    { name: "資産運用", image: "/icons/8_sisan-unnyou.png" }
];

const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return email;
    const [localPart, domainPart] = email.split('@');
    return localPart.substring(0, 3) + '***@' + domainPart;
};

export default function QuizComponent({ userId, userEmail }: { userId: string, userEmail: string }) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [activeQuestions, setActiveQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isQuizLoading, setIsQuizLoading] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'quiz'>('quiz');
    const [lastSubject, setLastSubject] = useState<string | null>(null);

    // ★ 1. まず関数を定義（順番が大事！）
    const refreshLastSubject = async () => {
        // ★確認1: 関数が呼ばれたこと自体を知らせる
        console.log("--- refreshLastSubject 開始 ---");

        try {
            if (!userId) {
                console.error("❌ エラー: userId が空です！これだとDBから取れません。");
                return;
            }

            const { data, error } = await supabase
                .from('user_answers')
                .select(`id, created_at, questions ( subject )`)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (error) {
                console.error("❌ Supabaseエラー:", error);
                return;
            }

            if (data && data.length > 0) {
                const item = data[0] as any;
                const subjectName = Array.isArray(item.questions) ? item.questions[0]?.subject : item.questions?.subject;

                // ★確認2: 取れた値をハッキリ出す
                console.log("✅ DBから取れた最新の科目名:", subjectName);

                if (subjectName) {
                    setLastSubject(subjectName);
                } else {
                    console.warn("⚠️ 科目名が空っぽでした（リレーションの問題かも）");
                }
            } else {
                console.log("ℹ️ まだ一度も解答データがないみたいだよ！");
            }
        } catch (err) {
            console.error("❌ 想定外のクラッシュ:", err);
        }
        console.log("--- refreshLastSubject 終了 ---");
    };

    // ★ 2. useEffect で呼び出す
    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            const { data: qData } = await supabase.from('questions').select('*');
            setQuestions(qData || []);
            await refreshLastSubject();
            setLoading(false);
        }
        fetchData();
    }, [userId]);

    // ★ 3. ソート処理
    const sortedSubjects = [...subjectData].sort((a, b) => {
        if (a.name === lastSubject) return -1;
        if (b.name === lastSubject) return 1;
        return 0;
    });

    // --- 各種ハンドラー ---
    const handleSubjectSelect = async (sub: string) => {
        setIsQuizLoading(true);
        setSelectedSubject(sub);
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5秒のタメ
        const filtered = questions.filter(q => q.subject === sub);
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        setActiveQuestions(shuffled);
        setCurrent(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsQuizLoading(false);
    };

    const resetQuizState = () => {
        setSelectedSubject(null);
        setActiveQuestions([]);
        setCurrent(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
        refreshLastSubject(); // 戻った瞬間に並び替え！
    };

    const handleBackToMenu = () => {
        if (window.confirm("中断して戻る？")) resetQuizState();
    };

    const handleAnswer = async (selectedIndex: number) => {
        if (selectedAnswer !== null) return;
        const currentQuestion = activeQuestions[current];
        const isCorrect = selectedIndex === currentQuestion.answer;
        setSelectedAnswer(selectedIndex);
        if (isCorrect) setScore(score + 1);
        await supabase.from('user_answers').insert({
            user_id: userId,
            question_id: currentQuestion.id,
            is_correct: isCorrect
        });
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

    // --- 表示ロジック ---
    if (loading) return <div className="text-center p-20 mt-20 font-bold text-slate-400">Loading...</div>;

    const renderContent = () => {
        if (isQuizLoading) {
            return (
                <div className="flex flex-col items-center justify-center p-10 mt-20">
                    <div className="relative w-16 h-16 mb-6">
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-1">Preparing...</h3>
                    <p className="text-[10px] font-bold text-slate-400 animate-pulse tracking-widest uppercase text-center">
                        {selectedSubject}を準備中
                    </p>
                </div>
            );
        }

        if (activeTab === 'dashboard') {
            return (
                <div className="max-w-md mx-auto px-4 pt-6 select-none">
                    <StatsComponent userId={userId} />
                </div>
            );
        }

        if (!selectedSubject) {
            return (
                <div className="max-w-md mx-auto px-4 pt-6 pb-10">
                    <div className="mb-6 flex items-end justify-between px-1">
                        <div>
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-1">Select Subject</span>
                            <h2 className="text-xl font-extrabold text-slate-900">学習科目</h2>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-md italic">{subjectData.length} Items</span>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {sortedSubjects.map((sub) => {
                            const qCount = questions.filter(q => q.subject === sub.name).length;
                            const isRecent = sub.name === lastSubject;
                            return (
                                <button
                                    key={sub.name}
                                    onClick={() => handleSubjectSelect(sub.name)}
                                    disabled={qCount === 0}
                                    className={`group w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.98] flex items-center gap-4 ${isRecent
                                        ? 'bg-white border-blue-400 shadow-blue-100 shadow-xl'
                                        : 'bg-white border-white shadow-lg shadow-slate-200/50 hover:border-blue-100'
                                        } ${qCount === 0 ? 'opacity-50' : ''}`}
                                >
                                    <div className="w-14 h-14 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 select-none pointer-events-none">
                                        <img src={sub.image} alt="" className="w-full h-full object-cover" onContextMenu={(e) => e.preventDefault()} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="font-bold text-slate-900 block text-base group-hover:text-blue-600 transition-colors">{sub.name}</span>
                                            {isRecent && <span className="text-[8px] font-black bg-blue-500 text-white px-1.5 py-0.5 rounded-sm animate-pulse">RECENT</span>}
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400">{qCount}問収録</span>
                                    </div>
                                    <span className={`transition-all text-xl ${isRecent ? 'text-blue-500' : 'text-slate-200 group-hover:text-blue-500'}`}>→</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            );
        }

        const currentQuestion = activeQuestions[current];
        const isAnswered = selectedAnswer !== null;

        if (showResult) return (
            <div className="text-center p-10 max-w-md mx-auto mt-10 bg-white rounded-[40px] shadow-2xl border-2 border-white mx-4">
                <span className="text-6xl block mb-4">🎉</span>
                <p className="text-6xl font-black text-slate-950 mb-2">{score}<span className="text-2xl text-slate-400">/{activeQuestions.length}</span></p>
                <button onClick={resetQuizState} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-xl mt-6">戻る</button>
            </div>
        );

        return (
            <div className="max-w-md mx-auto px-4 pt-6">
                <div className="flex justify-between items-center mb-4 px-1">
                    <button onClick={handleBackToMenu} className="bg-white text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-black border border-slate-100 shadow-sm">← BACK</button>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider">{selectedSubject}</span>
                </div>
                <div className="bg-white p-7 rounded-[32px] shadow-2xl shadow-slate-200 border border-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 bg-blue-600 transition-all" style={{ width: `${((current + 1) / activeQuestions.length) * 100}%` }}></div>
                    <h2 className="text-lg font-extrabold text-slate-950 mb-8 leading-tight">{currentQuestion.question}</h2>
                    <div className="space-y-3">
                        {currentQuestion.options.map((opt: string, index: number) => {
                            let style = "bg-slate-50 text-slate-800 border-slate-100 hover:border-blue-200";
                            if (isAnswered) {
                                if (index === currentQuestion.answer) style = "bg-green-600 border-green-600 text-white shadow-lg";
                                else if (index === selectedAnswer) style = "bg-red-500 border-red-500 text-white";
                                else style = "bg-white text-slate-200 border-slate-50 opacity-50";
                            }
                            return <button key={index} disabled={isAnswered} onClick={() => handleAnswer(index)} className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold text-sm min-h-[70px] active:scale-[0.98] ${style}`}>{opt}</button>;
                        })}
                    </div>
                    {isAnswered && (
                        <div className="mt-6 p-5 bg-slate-900 text-white rounded-2xl animate-in fade-in zoom-in duration-300 overflow-hidden">
                            <p className="text-xs leading-relaxed mb-6">{currentQuestion.explanation || "No explanation."}</p>
                            <button onClick={handleNext} className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black text-sm shadow-lg active:scale-95">NEXT →</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 relative pb-24">
            <div className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
                <div className="max-w-md mx-auto px-5 py-3 flex items-center justify-between">
                    <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <span className="block text-[10px] font-extrabold text-slate-950">{maskEmail(userEmail)}</span>
                    </div>
                    <button onClick={() => supabase.auth.signOut()} className="text-slate-400 font-bold text-[10px] hover:text-red-500 transition-colors uppercase tracking-widest">Logout</button>
                </div>
            </div>

            {renderContent()}

            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-100 pb-safe z-50 overflow-hidden">
                <div className="max-w-md mx-auto flex justify-around p-2 gap-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'dashboard' ? 'text-blue-700 bg-blue-50 shadow-inner font-black' : 'text-slate-400 font-bold'}`}>
                        <img src="/icons/9_analysis.png" alt="" className={`w-6 h-6 object-contain transition-transform duration-300 ${activeTab === 'dashboard' ? 'scale-110' : 'scale-100'}`} />
                        <span className="text-[10px] tracking-tight">ANALYSIS</span>
                    </button>
                    <button onClick={() => setActiveTab('quiz')} className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl transition-all duration-300 ${activeTab === 'quiz' ? 'text-blue-700 bg-blue-50 shadow-inner font-black' : 'text-slate-400 font-bold'}`}>
                        <img src="/icons/10_training.png" alt="" className={`w-6 h-6 object-contain transition-transform duration-300 ${activeTab === 'quiz' ? 'scale-110' : 'scale-100'}`} />
                        <span className="text-[10px] tracking-tight">TRAINING</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
