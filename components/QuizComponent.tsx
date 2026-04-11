"use client";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

const subjects = [
    "生命保険総論", "生命保険計理", "危険選択", "約款と法律",
    "生命保険会計", "生命保険と営業", "生命保険と税法", "資産運用"
];

export default function QuizComponent() {
    const [questions, setQuestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [current, setCurrent] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

    useEffect(() => {
        async function fetchQuestions() {
            setLoading(true);
            const { data, error } = await supabase
                .from('questions')
                .select('*');

            if (error) {
                console.error("データ取得エラー:", error);
            } else {
                setQuestions(data || []);
            }
            setLoading(false);
        }
        fetchQuestions();
    }, []);

    const filteredQuestions = selectedSubject
        ? questions.filter(q => q.subject === selectedSubject)
        : [];

    // --- 【リクエスト分】科目選択に戻る処理（リマインド付き） ---
    const handleBackToMenu = () => {
        const confirmBack = window.confirm("本当に中断して科目選択に戻る？\n（今の正解数や進み具合はリセットされちゃうよ！）");

        if (confirmBack) {
            setSelectedSubject(null);
            setCurrent(0);
            setScore(0);
            setSelectedAnswer(null);
            setShowResult(false);
        }
    };

    const handleAnswer = (selectedIndex: number) => {
        if (selectedAnswer !== null) return;
        setSelectedAnswer(selectedIndex);
        if (selectedIndex === filteredQuestions[current].answer) {
            setScore(score + 1);
        }
    };

    const handleNext = () => {
        const next = current + 1;
        if (next < filteredQuestions.length) {
            setCurrent(next);
            setSelectedAnswer(null);
        } else {
            setShowResult(true);
        }
    };

    if (loading) {
        return (
            <div className="max-w-md mx-auto text-center p-10">
                <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="font-bold text-slate-600">DBから問題を読み込み中...⌛</p>
            </div>
        );
    }

    // 1. 科目選択画面
    if (!selectedSubject) {
        return (
            <div className="max-w-md mx-auto px-2">
                <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-blue-100">
                    <h2 className="text-xl font-black text-slate-800 mb-6 text-center">科目を選択してね！📝</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {subjects.map((sub) => (
                            <button
                                key={sub}
                                onClick={() => setSelectedSubject(sub)}
                                className="w-full text-left p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all font-bold text-slate-700 active:scale-95"
                            >
                                {sub}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 2. 問題がない時の画面
    if (filteredQuestions.length === 0) {
        return (
            <div className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl shadow-lg border-4 border-blue-100 mx-2">
                <p className="mb-4 font-bold text-slate-600">「{selectedSubject}」の問題はまだ準備中だよ！💦</p>
                <button onClick={() => setSelectedSubject(null)} className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-md active:scale-95">戻る</button>
            </div>
        );
    }

    // 3. 結果画面
    if (showResult) {
        return (
            <div className="text-center p-8 bg-white rounded-3xl shadow-lg border-4 border-blue-100 mx-2 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-2">{selectedSubject}</h2>
                <h3 className="text-2xl font-black text-blue-600 mb-6">全問終了！✨</h3>
                <p className="text-lg text-slate-600 mb-6">正解数: <span className="text-3xl font-black text-slate-800">{score}</span> / {filteredQuestions.length}</p>
                <div className="space-y-3">
                    <button onClick={() => { setCurrent(0); setScore(0); setSelectedAnswer(null); setShowResult(false); }} className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold shadow-md active:scale-95">もう一度挑戦</button>
                    <button onClick={() => setSelectedSubject(null)} className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold active:scale-95">科目を選び直す</button>
                </div>
            </div>
        );
    }

    // 4. クイズ画面
    const currentQuestion = filteredQuestions[current];
    const isAnswered = selectedAnswer !== null;

    return (
        <div className="max-w-md mx-auto px-2 pb-10">
            {/* --- ヘッダーエリア：戻るボタン（修正版） --- */}
            <div className="flex justify-between items-center mb-4 px-2">
                <button
                    onClick={handleBackToMenu}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full flex items-center text-xs font-bold shadow-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                    <span className="mr-1.5 text-sm">←</span> 科目を選び直す
                </button>

                {/* 右側の科目名タグも、見やすいように少し濃くしたよ */}
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider border border-blue-100">
                    {selectedSubject}
                </span>
            </div>


            <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-xl border-b-4 border-blue-100 relative overflow-hidden">
                {/* プログレスバー（おまけ！） */}
                <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: `${((current + 1) / filteredQuestions.length) * 100}%` }}></div>

                <div className="text-right mb-4">
                    <span className="text-sm font-black text-slate-400">{current + 1} <span className="text-[10px] text-slate-300">/ {filteredQuestions.length}</span></span>
                </div>

                <h2 className="text-lg font-bold text-slate-800 mb-6 leading-relaxed">
                    {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                    {currentQuestion.options.map((opt: string, index: number) => {
                        let buttonStyle = "border-slate-100 text-slate-700 bg-slate-50";
                        if (isAnswered) {
                            if (index === currentQuestion.answer) buttonStyle = "bg-green-500 border-green-500 text-white shadow-md";
                            else if (index === selectedAnswer) buttonStyle = "bg-red-400 border-red-400 text-white";
                            else buttonStyle = "bg-white border-slate-50 text-slate-300 opacity-50";
                        }
                        return (
                            <button
                                key={index}
                                disabled={isAnswered}
                                onClick={() => handleAnswer(index)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold text-sm min-h-[60px] flex items-center justify-between active:scale-[0.98] ${buttonStyle}`}
                            >
                                <span>{opt}</span>
                            </button>
                        );
                    })}
                </div>

                {isAnswered && (
                    <div className="mt-6 p-5 bg-slate-900 text-white rounded-2xl animate-in fade-in zoom-in duration-300 shadow-2xl">
                        <div className="flex items-center mb-3">
                            <span className="text-[10px] font-black bg-blue-500 px-2 py-0.5 rounded mr-2">解説！</span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-300 mb-4">{currentQuestion.explanation || "解説はまだ登録されていないよ！"}</p>
                        <button onClick={handleNext} className="w-full bg-white text-slate-900 py-3 rounded-lg font-black text-sm active:scale-95 shadow-lg transition-transform hover:translate-y-[-2px]">
                            {current < filteredQuestions.length - 1 ? "NEXT QUESTION" : "SEE RESULTS"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
