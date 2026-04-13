"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import StatsComponent from "./StatsComponent";

const subjectData = [
    { name: "生保の基礎理論と仕組み", image: "/icons/1_souron.png" },
    { name: "保険数理・計理の基本", image: "/icons/2_keiri.png" },
    { name: "診査と引受選択の知識", image: "/icons/3_kikensentaku.png" },
    { name: "約款法務・関連法規", image: "/icons/4_yakkantohouritsu.png" },
    { name: "保険会計の実務と決算", image: "/icons/5_kaikei.png" },
    { name: "営業推進とコンプライアンス", image: "/icons/6_eigyou.png" },
    { name: "生命保険に関わる税務知識", image: "/icons/7_zeihou.png" },
    { name: "資産運用の基礎と実務", image: "/icons/8_sisan-unnyou.png" }
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

    // プライバシーポリシー用のステート
    const [showPrivacy, setShowPrivacy] = useState(false);

    const refreshLastSubject = async () => {
        try {
            if (!userId) return;
            const { data, error } = await supabase
                .from('user_answers')
                .select(`id, created_at, questions ( subject )`)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1);

            if (!error && data && data.length > 0) {
                const item = data[0] as any;
                const subjectName = Array.isArray(item.questions) ? item.questions[0]?.subject : item.questions?.subject;
                if (subjectName) setLastSubject(subjectName);
            }
        } catch (err) {
            console.error(err);
        }
    };

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

    const sortedSubjects = [...subjectData].sort((a, b) => {
        if (a.name === lastSubject) return -1;
        if (b.name === lastSubject) return 1;
        return 0;
    });

    const handleSubjectSelect = async (sub: string) => {
        setIsQuizLoading(true);
        setSelectedSubject(sub);
        await new Promise(resolve => setTimeout(resolve, 500));
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
        refreshLastSubject();
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
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-1">InsurMaster</span>
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

            {/* フッター領域にプライバシーポリシーのリンクを追加 */}
            {!isQuizLoading && !selectedSubject && (
                <div className="max-w-md mx-auto py-12 text-center border-t border-slate-100 mt-10 mb-8">
                    <p className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">
                        © 2026 Hiyo. All Rights Reserved.
                    </p>
                    <div className="mt-3">
                        <button
                            onClick={() => setShowPrivacy(true)}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-600 transition-colors underline underline-offset-2"
                        >
                            プライバシーポリシー
                        </button>
                    </div>
                </div>
            )}

            {/* 下部固定ナビゲーション */}
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg border-t border-slate-100 pb-safe z-40 overflow-hidden">
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

            {/* プライバシーポリシーのモーダル (z-50で最前面に) */}
            {showPrivacy && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPrivacy(false)}>
                    <div
                        className="bg-white w-full max-w-sm max-h-[85vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 overflow-y-auto">
                            <h3 className="font-black text-slate-900 text-xl mb-6 border-b pb-4">プライバシーポリシー</h3>

                            <div className="space-y-5 text-xs text-slate-600 leading-relaxed">
                                <section>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">1. 情報の収集と利用</h4>
                                    <p>本アプリ「InsurMaster」は、ユーザーの学習体験の向上とアカウント管理を目的として、認証情報（メールアドレス）および学習履歴（クイズのスコア、解答データ等）を収集・利用します。これらの情報は本アプリの機能提供にのみ使用されます。</p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">2. 知的財産権およびコンテンツの保護（重要）</h4>
                                    <p>
                                        本アプリ内で提供される学習コンテンツ（問題文、独自の解説ロジック、UIデザイン等）に関する著作権は、すべて本アプリ開発者に帰属します。<br />
                                        一般社団法人生命保険協会が著作権を有する公式テキスト等の無断転載は行っておりませんが、本アプリの独自コンテンツに対するスクリーンショット撮影、OCR（光学文字認識）によるテキスト抽出、AIの学習データとしての利用、自動化プログラム（スクレイピング等）によるデータ収集、および無断複製・転載・頒布を固く禁じます。
                                    </p>
                                </section>

                                <section className="mt-4">
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">3. 禁止事項と違反時の措置</h4>
                                    <p>
                                        前項の禁止行為、または本アプリの運営を妨害する行為（不正アクセス、リバースエンジニアリング等）が検知された場合、事前の通知なく当該ユーザーのアカウントおよびアクセスを即時停止（BAN）します。<br />
                                        また、悪質な著作権侵害が発覚した場合は、アクセスログおよびシステム上の追跡情報（動的ウォーターマーク等）に基づき、法的措置および損害賠償請求を行う場合があります。
                                    </p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">4. 第三者へのデータ提供</h4>
                                    <p>ユーザーの同意なく、収集した個人情報を第三者に提供することはありません。ただし、インフラストラクチャサービス（Supabase等）の提供範囲において必要な処理が行われる場合があります。</p>
                                </section>

                                <section>
                                    <h4 className="font-bold text-slate-800 text-sm mb-1">5. 免責事項</h4>
                                    <p>本アプリのコンテンツは正確性を期しておりますが、その内容や試験の合格を保証するものではありません。本アプリの利用により生じたいかなる結果・損害についても、開発者は責任を負いかねます。</p>
                                </section>
                            </div>
                        </div>
                        <div className="p-4 border-t bg-slate-50">
                            <button
                                onClick={() => setShowPrivacy(false)}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-black text-sm transition-colors active:scale-95"
                            >
                                閉じる
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
