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
    const [activeQuestions, setActiveQuestions] = useState<any[]>([]); // 【新機能】シャッフルされた今の科目の問題
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

    // --- 【新機能】科目を選んだ時の処理（シャッフルするよ！） ---
    const handleSubjectSelect = (sub: string) => {
        const filtered = questions.filter(q => q.subject === sub);
        // 問題をランダムにシャッフル！
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);

        setActiveQuestions(shuffled);
        setSelectedSubject(sub);
        setCurrent(0);
        setScore(0);
        setSelectedAnswer(null);
        setShowResult(false);
    };

    // --- 【修正】状態をすべてリセットする共通関数 ---
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
        if (confirmBack) {
            resetQuizState(); // バグ修正：共通リセット関数を呼ぶ
        }
    };

    const handleAnswer = async (selectedIndex: number) => {
        if (selectedAnswer !== null) return;
        const currentQuestion = activeQuestions[current];
        const isCorrect = selectedIndex === currentQuestion.answer;

        setSelectedAnswer(selectedIndex);

        if (isCorrect) {
            setScore(score + 1);
        }

        // --- 【修正】DBへ保存する処理は、関数の「中」に書くよ！ ---
        const { error } = await supabase.from('user_answers').insert({
            user_id: userId,
            question_id: currentQuestion.id, // questionsテーブルのid
            is_correct: isCorrect
        });

        // ここを書き換え！
        if (error) {
            console.error("履歴の保存に失敗しちゃった...💦", error.message, error.details, error.hint);
            alert(`保存エラー: ${error.message}`); // 画面にもポップアップで出してみる！
        }

    }; // ← ★ココ！ここで handleAnswer 関数を閉じるのが正解だよ！

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
        // ...（これ以降はそのまま！）

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
                {/* ★統計コンポーネント（ダッシュボード） */}
                <StatsComponent userId={userId} />

                <div className="bg-white p-6 rounded-3xl shadow-xl border-b-4 border-blue-100">
                    <h2 className="text-xl font-black text-slate-800 mb-6 text-center">科目を選択してね！📝</h2>
                    <div className="grid grid-cols-1 gap-3">
                        {subjects.map((sub) => {
                            // 【新機能】その科目の問題数を計算
                            const qCount = questions.filter(q => q.subject === sub).length;

                            return (
                                <button
                                    key={sub}
                                    onClick={() => handleSubjectSelect(sub)}
                                    className="w-full text-left p-4 rounded-xl border-2 border-slate-100 bg-slate-50 hover:border-blue-400 hover:bg-blue-50 transition-all active:scale-95 flex justify-between items-center"
                                >
                                    <span className="font-bold text-slate-700">{sub}</span>
                                    {/* 問題数を表示するバッジ */}
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

    // 2. 問題がない時の画面

    if (activeQuestions.length === 0) {
        return (
            <div className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl shadow-lg border-4 border-blue-100 mx-2">
                <p className="mb-4 font-bold text-slate-600">「{selectedSubject}」の問題はまだ準備中だよ！💦</p>
                <button onClick={resetQuizState} className="bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-md active:scale-95">戻る</button>
            </div>
        );
    }

    // 3. 結果画面
    if (showResult) {
        return (
            <div className="text-center p-8 bg-white rounded-3xl shadow-lg border-4 border-blue-100 mx-2 max-w-md mx-auto">
                <h2 className="text-xl font-bold mb-2">{selectedSubject}</h2>
                <h3 className="text-2xl font-black text-blue-600 mb-6">全問終了！✨</h3>
                <p className="text-lg text-slate-600 mb-6">正解数: <span className="text-3xl font-black text-slate-800">{score}</span> / {activeQuestions.length}</p>
                <div className="space-y-3">
                    <button onClick={() => handleSubjectSelect(selectedSubject)} className="w-full bg-blue-500 text-white py-4 rounded-xl font-bold shadow-md active:scale-95">違う順番でもう一度挑戦</button>
                    {/* 【バグ修正】ここで共通リセット関数を呼ぶようにしたよ！ */}
                    <button onClick={resetQuizState} className="w-full bg-slate-100 text-slate-600 py-4 rounded-xl font-bold active:scale-95">科目を選び直す</button>
                </div>
            </div>
        );
    }

    // 4. クイズ画面
    const currentQuestion = activeQuestions[current];
    const isAnswered = selectedAnswer !== null;

    return (
        <div className="max-w-md mx-auto px-2 pb-10">
            <div className="flex justify-between items-center mb-4 px-2">
                <button
                    onClick={handleBackToMenu}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-full flex items-center text-xs font-bold shadow-sm hover:bg-slate-200 transition-all active:scale-95"
                >
                    <span className="mr-1.5 text-sm">←</span> 科目を選び直す
                </button>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-wider border border-blue-100">
                    {selectedSubject}
                </span>
            </div>

            <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-xl border-b-4 border-blue-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: `${((current + 1) / activeQuestions.length) * 100}%` }}></div>

                <div className="text-right mb-4">
                    <span className="text-sm font-black text-slate-400">{current + 1} <span className="text-[10px] text-slate-300">/ {activeQuestions.length}</span></span>
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
                            {current < activeQuestions.length - 1 ? "次の問題！" : "結果を見る"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
