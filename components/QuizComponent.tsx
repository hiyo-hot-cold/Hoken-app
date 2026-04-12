"use client";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import StatsComponent from "./StatsComponent";

const subjects = [
    "生命保険総論", "生命保険計理", "危険選択", "約款と法律",
    "生命保険会計", "生命保険と営業", "生命保険と税法", "資産運用"
];

export default function QuizComponent({ userId }: { userId: string }) {
    const [questions, setQuestions] = useState<any[]>([]);
    const [activeQuestions, setActiveQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    // ★【新機能】今どっちのタブを開いているかを管理するState
    const [activeTab, setActiveTab] = useState<'dashboard' | 'quiz'>('dashboard');

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
            user_id: userId,
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
            <div className="max-w-md mx-auto text-center p-10 mt-10">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="font-bold text-slate-600">読み込み中...⌛</p>
            </div>
        );
    }

    // --- ★【新構造】メインの表示エリアを切り替える関数 ---
    const renderContent = () => {
        // 1. ダッシュボードタブの場合
        if (activeTab === 'dashboard') {
            return (
                <div className="max-w-md mx-auto px-2 pt-6">
                    <h2 className="text-xl font-black text-slate-800 mb-6 px-2">学習ダッシュボード 📊</h2>
                    <StatsComponent userId={userId} />
                </div>
            );
        }

        // 2. クイズタブの場合（ここから下は今までのクイズ機能！）
        if (!selectedSubject) {
            return (
                <div className="max-w-md mx-auto px-2 pt-6">
                    <div className="bg-white p-6 rounded-[32px] shadow-xl border-b-4 border-blue-100">
                        <h2 className="text-xl font-black text-slate-800 mb-6 text-center">科目を選択してね！📝</h2>
                        <div className="grid grid-cols-1 gap-3">
                            {subjects.map((sub) => {
                                const qCount = questions.filter(q => q.subject === sub).length;
                                return (
                                    <button
                                        key={sub}
                                        onClick={() => handleSubjectSelect(sub)}
                                        className="w-full text-left p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-95 flex justify-between items-center"
                                    >
                                        <span className="font-bold text-slate-700">{sub}</span>
                                        <span className={`text-xs font-black px-2 py-1 rounded-full ${qCount > 0 ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                                            {qCount}問
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        if (activeQuestions.length === 0) {
            return (
                <div className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl shadow-lg border-4 border-blue-100 mx-2 mt-6">
                    <p className="mb-4 font-bold text-slate-600">「{selectedSubject}」の問題はまだ準備中だよ！💦</p>
                    <button onClick={resetQuizState} className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-md active:scale-95">戻る</button>
                </div>
            );
        }

        if (showResult) {
            return (
                <div className="text-center p-8 bg-white rounded-[32px] shadow-lg border-4 border-blue-100 mx-2 mt-6 max-w-md mx-auto">
                    <h2 className="text-xl font-bold mb-2">{selectedSubject}</h2>
                    <h3 className="text-2xl font-black text-blue-600 mb-6">全問終了！✨</h3>
                    <p className="text-lg text-slate-600 mb-6">正解数: <span className="text-4xl font-black text-slate-800">{score}</span> / {activeQuestions.length}</p>
                    <div className="space-y-3">
                        <button onClick={() => handleSubjectSelect(selectedSubject)} className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold shadow-md active:scale-95">違う順番でもう一度挑戦</button>
                        <button onClick={resetQuizState} className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold active:scale-95">科目を選び直す</button>
                    </div>
                </div>
            );
        }

        const currentQuestion = activeQuestions[current];
        const isAnswered = selectedAnswer !== null;

        return (
            <div className="max-w-md mx-auto px-2 pt-6">
                <div className="flex justify-between items-center mb-4 px-2">
                    <button onClick={handleBackToMenu} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full flex items-center text-xs font-bold shadow-sm hover:bg-slate-200 transition-all active:scale-95">
                        <span className="mr-1.5 text-sm">←</span> 戻る
                    </button>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider border border-blue-100">{selectedSubject}</span>
                </div>

                <div className="bg-white p-5 sm:p-8 rounded-[32px] shadow-xl border-b-4 border-blue-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: `${((current + 1) / activeQuestions.length) * 100}%` }}></div>
                    <div className="text-right mb-4">
                        <span className="text-sm font-black text-slate-400">{current + 1} <span className="text-[10px] text-slate-300">/ {activeQuestions.length}</span></span>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">{currentQuestion.question}</h2>

                    <div className="space-y-3">
                        {currentQuestion.options.map((opt: string, index: number) => {
                            let buttonStyle = "border-slate-100 text-slate-700 bg-slate-50 hover:border-blue-300";
                            if (isAnswered) {
                                if (index === currentQuestion.answer) buttonStyle = "bg-green-500 border-green-500 text-white shadow-md";
                                else if (index === selectedAnswer) buttonStyle = "bg-red-400 border-red-400 text-white";
                                else buttonStyle = "bg-white border-slate-50 text-slate-300 opacity-50";
                            }
                            return (
                                <button key={index} disabled={isAnswered} onClick={() => handleAnswer(index)} className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold text-sm min-h-[60px] flex items-center justify-between active:scale-[0.98] ${buttonStyle}`}>
                                    <span>{opt}</span>
                                </button>
                            );
                        })}
                    </div>

                    {isAnswered && (
                        <div className="mt-6 p-5 bg-slate-900 text-white rounded-2xl animate-in fade-in zoom-in duration-300 shadow-2xl">
                            <div className="flex items-center mb-3"><span className="text-[10px] font-black bg-blue-500 px-2 py-0.5 rounded mr-2">解説！</span></div>
                            <p className="text-xs leading-relaxed text-slate-300 mb-4">{currentQuestion.explanation || "解説はまだ登録されていないよ！"}</p>
                            <button onClick={handleNext} className="w-full bg-white text-slate-900 py-3 rounded-lg font-black text-sm active:scale-95 shadow-lg transition-transform hover:translate-y-[-2px]">
                                {current < activeQuestions.length - 1 ? "次の問題！" : "結果を見る"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        // ★下のタブバーが隠れないように padding-bottom (pb-24) を設定
        <div className="min-h-screen bg-slate-50 relative pb-28">

            {/* メインエリアの描画 */}
            {renderContent()}

            {/* ★【新機能】下部固定タブナビゲーション */}
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-50">
                <div className="max-w-md mx-auto flex justify-around p-2">
                    {/* ダッシュボードタブ */}
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex flex-col items-center justify-center w-full py-3 rounded-2xl transition-all duration-300 ${activeTab === 'dashboard' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                            }`}
                    >
                        <span className={`text-2xl mb-1 transition-transform ${activeTab === 'dashboard' ? 'scale-110' : 'scale-100'}`}>📊</span>
                        <span className="text-[10px] font-black tracking-wider">成績・分析</span>
                    </button>

                    {/* クイズ（問題）タブ */}
                    <button
                        onClick={() => setActiveTab('quiz')}
                        className={`flex flex-col items-center justify-center w-full py-3 rounded-2xl transition-all duration-300 ${activeTab === 'quiz' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                            }`}
                    >
                        <span className={`text-2xl mb-1 transition-transform ${activeTab === 'quiz' ? 'scale-110' : 'scale-100'}`}>📝</span>
                        <span className="text-[10px] font-black tracking-wider">問題を解く</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
