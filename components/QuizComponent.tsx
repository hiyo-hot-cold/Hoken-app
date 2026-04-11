"use client";
import { useState } from "react";
import { quizData } from '../data/questions';

export default function QuizComponent() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswer = (selectedIndex: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(selectedIndex);
    if (selectedIndex === quizData[current].answer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    const next = current + 1;
    if (next < quizData.length) {
      setCurrent(next);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  if (showResult) {
    return (
      <div className="text-center p-6 bg-white rounded-2xl shadow-lg border border-blue-100 mx-2">
        <h2 className="text-xl font-bold mb-4">お疲れ様、ヒヨウちゃん！✨</h2>
        <p className="text-lg text-slate-600">正解数: <span className="text-blue-600 font-bold">{score}</span> / {quizData.length}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 w-full bg-blue-500 text-white py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all"
        >
          もう一度挑戦する
        </button>
      </div>
    );
  }

  const currentQuestion = quizData[current];
  const isAnswered = selectedAnswer !== null;

  return (
    <div className="max-w-md mx-auto px-2 pb-10"> {/* 左右に少しだけ余裕を持たせる */}
      <div className="bg-white p-5 sm:p-8 rounded-3xl shadow-xl border-b-4 border-blue-100">
        
        {/* プログレスバーっぽく上部に情報を配置 */}
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Current Question</span>
            <div className="text-2xl font-black text-slate-800 leading-none">{current + 1}<span className="text-sm text-slate-300 font-normal"> / {quizData.length}</span></div>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-black text-green-400 uppercase tracking-tighter">Correct</span>
             <div className="text-xl font-black text-slate-800 leading-none">{score}</div>
          </div>
        </div>

        {/* 問題文：スマホで見やすいサイズに */}
        <h2 className="text-lg font-bold text-slate-800 mb-6 leading-snug min-h-[3rem]">
          {currentQuestion.question}
        </h2>

        {/* 選択肢ボタン：高さを確保して押しやすく */}
        <div className="space-y-3">
          {currentQuestion.options.map((opt, index) => {
            let buttonStyle = "border-slate-100 text-slate-700 bg-slate-50";
            if (isAnswered) {
              if (index === currentQuestion.answer) {
                buttonStyle = "bg-green-500 border-green-500 text-white shadow-md z-10 scale-[1.02]"; 
              } else if (index === selectedAnswer) {
                buttonStyle = "bg-red-400 border-red-400 text-white opacity-90"; 
              } else {
                buttonStyle = "bg-white border-slate-50 text-slate-300 opacity-50"; 
              }
            }

            return (
              <button
                key={opt}
                disabled={isAnswered}
                onClick={() => handleAnswer(index)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all font-bold text-sm min-h-[60px] flex items-center justify-between active:scale-[0.98] ${buttonStyle}`}
              >
                <span>{opt}</span>
                {isAnswered && index === currentQuestion.answer && <span className="text-xl">⚪︎</span>}
                {isAnswered && index === selectedAnswer && index !== currentQuestion.answer && <span className="text-xl">×</span>}
              </button>
            );
          })}
        </div>

        {/* 解説エリア：スマホの画面下部を有効活用 */}
        {isAnswered && (
          <div className="mt-6 p-5 bg-slate-900 text-white rounded-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center mb-2">
              <span className="text-xs font-bold bg-blue-500 px-2 py-0.5 rounded mr-2">解説</span>
              <span className="text-sm font-bold">{selectedAnswer === currentQuestion.answer ? "その通り！" : "惜しいっ！"}</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-300 mb-4">
              {currentQuestion.explanation}
            </p>
            <button
              onClick={handleNext}
              className="w-full bg-white text-slate-900 py-3 rounded-lg font-black text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-white/10 shadow-lg"
            >
              {current < quizData.length - 1 ? "NEXT QUESTION" : "SHOW RESULT"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
