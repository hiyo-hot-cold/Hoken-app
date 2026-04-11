"use client";
import { useState } from "react";
import { quizData } from '../data/questions';

export default function QuizComponent() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  // 回答状況を管理する新しいステート（nullなら未回答）
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  // 回答ボタンを押した時の処理
  const handleAnswer = (selectedIndex: number) => {
    if (selectedAnswer !== null) return; // すでに回答済みなら何もしない

    setSelectedAnswer(selectedIndex);
    if (selectedIndex === quizData[current].answer) {
      setScore(score + 1);
    }
  };

  // 「次の問題へ」ボタンを押した時の処理
  const handleNext = () => {
    const next = current + 1;
    if (next < quizData.length) {
      setCurrent(next);
      setSelectedAnswer(null); // 回答状況をリセット
    } else {
      setShowResult(true);
    }
  };

  // 結果画面
  if (showResult) {
    return (
      <div className="text-center p-8 bg-white rounded-3xl shadow-lg border-4 border-blue-100">
        <h2 className="text-2xl font-bold mb-4">お疲れ様、ヒヨウちゃん！✨</h2>
        <p className="text-xl text-slate-600">正解数: <span className="text-blue-600 font-bold">{score}</span> / {quizData.length}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-6 bg-blue-500 text-white px-8 py-3 rounded-full font-bold hover:bg-blue-600 shadow-md transition-all"
        >
          もう一度挑戦する
        </button>
      </div>
    );
  }

  const currentQuestion = quizData[current];
  const isAnswered = selectedAnswer !== null;

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-3xl shadow-xl border-4 border-blue-50">
      {/* 問題文エリア */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Question {current + 1}</span>
          <span className="text-xs font-medium text-slate-400">{current + 1} / {quizData.length}</span>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mt-2 leading-snug">
          {currentQuestion.question}
        </h2>
      </div>

      {/* 選択肢ボタン */}
      <div className="space-y-3">
        {currentQuestion.options.map((opt, index) => {
          // 色分けのロジック
          let buttonStyle = "border-slate-100 text-slate-700";
          if (isAnswered) {
            if (index === currentQuestion.answer) {
              buttonStyle = "bg-green-100 border-green-500 text-green-700 shadow-sm"; // 正解
            } else if (index === selectedAnswer) {
              buttonStyle = "bg-red-100 border-red-500 text-red-700"; // ヒヨウちゃんが選んだ不正解
            } else {
              buttonStyle = "border-slate-50 text-slate-300"; // それ以外（薄くする）
            }
          }

          return (
            <button
              key={opt}
              disabled={isAnswered}
              onClick={() => handleAnswer(index)}
              className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-medium ${buttonStyle} ${!isAnswered && 'hover:border-blue-400 hover:bg-blue-50'}`}
            >
              <div className="flex justify-between items-center">
                <span>{opt}</span>
                {isAnswered && index === currentQuestion.answer && <span>✅</span>}
                {isAnswered && index === selectedAnswer && index !== currentQuestion.answer && <span>❌</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* 解説エリア（回答後に表示） */}
      {isAnswered && (
        <div className="mt-8 p-6 bg-blue-50 rounded-2xl border-2 border-blue-200 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center mb-3">
            <span className="text-lg font-bold text-blue-800">💡 解説</span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {currentQuestion.explanation}
          </p>
          <button
            onClick={handleNext}
            className="w-full mt-6 bg-slate-800 text-white p-4 rounded-xl font-bold hover:bg-slate-700 shadow-lg transition-all active:scale-95"
          >
            {current < quizData.length - 1 ? "次の問題へ" : "結果を見る"}
          </button>
        </div>
      )}
    </div>
  );
}
