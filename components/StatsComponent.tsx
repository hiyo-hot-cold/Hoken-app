"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// 科目リスト（フォーカス選択用）
const SUBJECT_LIST = [
    "生命保険の概論", "保険数理・計理の基本", "診査と引受選択の知識",
    "約款法務・関連法規", "保険会計の実務と決算", "保険募集・販売戦略",
    "生保に関わる税務知識", "資産運用の基礎と実務"
];

export default function StatsComponent({ userId }: { userId: string }) {
    const [rawData, setRawData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // サマリー用State
    const [totalQuestions, setTotalQuestions] = useState(0);
    const [overallAccuracy, setOverallAccuracy] = useState(0);

    // 学習ペースグラフ用State
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [activityPeriod, setActivityPeriod] = useState<number>(7); // デフォルトは7日間

    // フォーカス科目用State
    const [focusSubject, setFocusSubject] = useState<string>(SUBJECT_LIST[0]);
    const [focusStats, setFocusStats] = useState({ answered: 0, accuracy: 0, mistakes: 0 });

    // 全科目の正答率データ用（グラフ描画用）
    const [allSubjectStats, setAllSubjectStats] = useState<any[]>([]);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('user_answers')
                    .select(`question_id, is_correct, created_at, questions ( subject )`)
                    .eq('user_id', userId);

                if (error) throw error;
                if (data) {
                    setRawData(data);

                    if (data.length > 0) {
                        const lastItem = data[data.length - 1] as any;
                        const lastQuestion = lastItem.questions;
                        const lastSub = Array.isArray(lastQuestion)
                            ? lastQuestion[0]?.subject
                            : lastQuestion?.subject;

                        if (lastSub) setFocusSubject(lastSub);
                    }
                }
            } catch (err) {
                console.error("統計取得エラー:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [userId]);

    useEffect(() => {
        if (rawData.length === 0) return;

        // 1. 全体サマリーの計算
        const total = rawData.length;
        const correct = rawData.filter(r => r.is_correct).length;
        setTotalQuestions(total);
        setOverallAccuracy(Math.round((correct / total) * 100));

        // 2. 日別の学習ペース（常に最大の30日分を計算しておく）
        const dateMap: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            dateMap[`${d.getMonth() + 1}/${d.getDate()}`] = 0;
        }
        rawData.forEach(row => {
            const dateObj = new Date(row.created_at);
            const dateStr = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
            if (dateMap[dateStr] !== undefined) {
                dateMap[dateStr]++;
            }
        });
        setDailyData(Object.keys(dateMap).map(k => ({ date: k, count: dateMap[k] })));

        // 3. フォーカス科目の詳細計算
        const focusData = rawData.filter(r => {
            const q = r.questions as any;
            const sub = Array.isArray(q) ? q[0]?.subject : q?.subject;
            return sub === focusSubject;
        });
        const focusTotal = focusData.length;
        const focusCorrect = focusData.filter(r => r.is_correct).length;

        const mistakes = focusData.filter(r => !r.is_correct).map(r => r.question_id);
        const uniqueMistakes = new Set(mistakes).size;

        setFocusStats({
            answered: focusTotal,
            accuracy: focusTotal > 0 ? Math.round((focusCorrect / focusTotal) * 100) : 0,
            mistakes: uniqueMistakes
        });

        // 4. 全科目の正答率グラフ用データ計算
        const subjectMap: any = {};
        rawData.forEach(row => {
            const q = row.questions as any;
            const subjectName = Array.isArray(q) ? q[0]?.subject : q?.subject;
            if (!subjectName) return;
            const sub = subjectName.replace(':', '');
            if (!subjectMap[sub]) subjectMap[sub] = { subject: sub, correct: 0, total: 0 };
            subjectMap[sub].total++;
            if (row.is_correct) subjectMap[sub].correct++;
        });

        const formattedStats = Object.values(subjectMap).map((item: any) => ({
            subject: item.subject,
            accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
        }));
        setAllSubjectStats(formattedStats);

    }, [rawData, focusSubject]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 mt-10">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">Analyzing...</p>
        </div>
    );

    // グラフに表示するデータを、選択された期間分だけスライスして取得
    const displayDailyData = dailyData.slice(-activityPeriod);

    return (
        <div className="space-y-6 mb-10 px-2 select-none animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

            <div className="mb-2">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] block mb-0.5">Dashboard</span>
                <h2 className="text-xl font-extrabold text-slate-900">学習アナリティクス</h2>
            </div>

            {/* 1. エグゼクティブ・サマリー */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-5 rounded-[24px] shadow-lg shadow-slate-200/40 border border-slate-50 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Answered</span>
                    <p className="text-3xl font-black text-slate-900 group-hover:scale-110 transition-transform">{totalQuestions}<span className="text-xs text-slate-400 ml-1">問</span></p>
                </div>
                <div className="bg-white p-5 rounded-[24px] shadow-lg shadow-slate-200/40 border border-slate-50 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Accuracy</span>
                    <p className="text-3xl font-black text-slate-900 group-hover:scale-110 transition-transform">{overallAccuracy}<span className="text-xs text-slate-400 ml-1">%</span></p>
                </div>
            </div>

            {/* 2. 目標フォーカス管理 */}
            <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden">
                <div className="absolute -right-6 -top-6 text-8xl opacity-5 pointer-events-none">🎯</div>

                <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center justify-between">
                    <span>現在のフォーカス科目</span>
                    <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md uppercase tracking-wider">Target</span>
                </h3>

                <div className="relative mb-6">
                    <select
                        value={focusSubject}
                        onChange={(e) => setFocusSubject(e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl p-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        {SUBJECT_LIST.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-lg">▾</div>
                </div>

                {focusStats.answered === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                        <span className="text-2xl block mb-2">🚀</span>
                        <p className="text-xs font-bold text-slate-500">まだこの科目の学習履歴がありません。<br />さっそく挑戦してデータを集めましょう！</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] font-bold text-slate-500">正答率</span>
                                <span className="text-xl font-black text-slate-900">{focusStats.accuracy}<span className="text-sm text-slate-400">%</span></span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden relative">
                                <div
                                    className={`absolute top-0 left-0 h-3 rounded-full transition-all duration-1000 ${focusStats.accuracy >= 80 ? 'bg-emerald-400' : focusStats.accuracy >= 60 ? 'bg-blue-400' : 'bg-amber-400'}`}
                                    style={{ width: `${focusStats.accuracy}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-amber-50 border border-amber-100 p-4 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">💡</span>
                                <div>
                                    <span className="block text-[10px] font-black text-amber-600 uppercase tracking-wider mb-0.5">Review Queue</span>
                                    <span className="block text-sm font-bold text-slate-800">復習待ちの問題</span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-2xl font-black text-amber-600">{focusStats.mistakes}</span>
                                <span className="text-xs font-bold text-amber-600/70 ml-1">問</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 学習ペース（AreaChart） */}
            <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-800">学習ペース</h3>

                    <div className="flex bg-slate-100 p-1 rounded-xl relative z-10">
                        {[
                            { label: '1週', value: 7 },
                            { label: '2週', value: 14 },
                            { label: '1月', value: 30 }
                        ].map(period => (
                            <button
                                key={period.value}
                                onClick={() => setActivityPeriod(period.value)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors ${activityPeriod === period.value
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                {period.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-44 w-full">
                    {/* displayDailyData を渡すことで瞬時に表示が切り替わります */}
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={displayDailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                            {/* minTickGap を小さくして、なるべく多くの日付を表示させる */}
                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" dy={10} minTickGap={15} />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />

                            {/* キモいアニメーションを完全に封印 */}
                            <Area type="monotone" dataKey="count" name="回答数" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 3, fill: '#3b82f6' }} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 4. 科目別正答率（グラデーション棒グラフ） */}
            {allSubjectStats.length > 0 && (
                <div className="bg-white p-6 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-50">
                    <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center justify-between">
                        <span>科目別正答率</span>
                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">STATUS</span>
                    </h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={allSubjectStats} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <defs>
                                    <linearGradient id="gradGreen" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradBlue" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#2563eb" stopOpacity={1} />
                                    </linearGradient>
                                    <linearGradient id="gradOrange" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#ea580c" stopOpacity={1} />
                                    </linearGradient>
                                </defs>
                                <XAxis type="number" domain={[0, 100]} fontSize={10} tickLine={false} axisLine={false} stroke="#cbd5e1" unit="%" />
                                <YAxis dataKey="subject" type="category" fontSize={10} width={110} tickLine={false} axisLine={false} stroke="#64748b" interval={0} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(8px)', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }} itemStyle={{ color: '#0f172a', fontWeight: 'bold' }} />
                                {/* こっちも一応アニメーションOFF */}
                                <Bar dataKey="accuracy" name="正答率" radius={[0, 8, 8, 0]} barSize={12} background={{ fill: '#f1f5f9', radius: 8 }} isAnimationActive={false}>
                                    {allSubjectStats.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.accuracy >= 80 ? 'url(#gradGreen)' : entry.accuracy >= 60 ? 'url(#gradBlue)' : 'url(#gradOrange)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

        </div>
    );
}