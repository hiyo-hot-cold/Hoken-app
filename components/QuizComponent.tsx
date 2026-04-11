"use client";
import { useState } from "react";
import { quizData, subjects } from '../data/questions';

export default function QuizComponent() {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // --- 【新機能】科目選択に戻る処理 ---
  const handleBackToMenu = () => {
    if (confirm("科目選択に戻る？（今の進捗は消えちゃうよ！）")) {
      setSelectedSubject(null);
      setCurrent(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const filteredQuestions = selectedSubject 
    ? quizData.filter(q => q.subject === selectedSubject)
    : [];

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

  // 2. 結果画面
  if (showResult) {
    return (
      <div className="text-center p-8 bg-white rounded-3xl shadow-lg border-4 border-blue-100 mx-2">
        <h2 className="text-xl font-bold mb-4">{selectedSubject} 終了！✨</h2>
        <p className="text-lg text-slate-600">正解数: <span className="text-blue-600 font-bold">{score}</span> / {filteredQuestions.length}</p>
        <button onClick={() => window.location.reload()} className="mt-6 w-full bg-blue-500 text-white py-4 rounded-xl font-bold shadow-md active:scale-95">もう一度挑戦</button>
        <button onClick={() => setSelectedSubject(null)} className="mt-3 w-full text-slate-400 font-bold py-2">科目を選び直す</button>
      </div>
    );
  }

  // 3. クイズ画面（ここに「戻る」を追加！）
  const currentQuestion = filteredQuestions[current];
  const isAnswered = selectedAnswer !== null;

  return (
    <div className="max-w-md mx-auto px-2 pb-10">
      <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-xl border-b-4 border-blue-100 relative">
        
        {/* --- 戻るボタン --- */}
        <button 
          onClick={handleBackToMenu}
          className="absolute -top-12 left-2 text-white/80 hover:text-white flex items-center text-sm font-bold transition-all"
        >
          <span className="mr-1">←</span> 科目を選び直す
        </button>

        <div className="flex justify-between items-end mb-4 border-b pb-2">
          <span className="text-[10px] font-black text-blue-500 uppercase">{selectedSubject}</span>
          <div className="text-right">
            <span className="text-sm font-black text-slate-800">{current + 1} / {filteredQuestions.length}</span>
          </div>
        </div>

        <h2 className="text-lg font-bold text-slate-800 mb-6 leading-snug">
          {currentQuestion.question}
        </h2>

        <div className="space-y-3">
          {currentQuestion.options.map((opt, index) => {
            let buttonStyle = "border-slate-100 text-slate-700 bg-slate-50";
            if (isAnswered) {
              if (index === currentQuestion.answer) buttonStyle = "bg-green-500 border-green-500 text-white shadow-md"; 
              else if (index === selectedAnswer) buttonStyle = "bg-red-400 border-red-400 text-white"; 
              else buttonStyle = "bg-white border-slate-50 text-slate-300 opacity-50"; 
            }
            return (
              <button
                key={opt}
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
          <div className="mt-6 p-5 bg-slate-900 text-white rounded-2xl animate-in fade-in zoom-in duration-300">
            <p className="text-xs leading-relaxed text-slate-300 mb-4">{currentQuestion.explanation}</p>
            <button onClick={handleNext} className="w-full bg-white text-slate-900 py-3 rounded-lg font-black text-sm active:scale-95 transition-all shadow-lg">
              {current < filteredQuestions.length - 1 ? "NEXT" : "RESULT"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
