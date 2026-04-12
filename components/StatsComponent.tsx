"use client";
import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";

export default function StatsComponent({ userId }: { userId: string }) {
    const [stats, setStats] = useState<any[]>([]);
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            setLoading(true);
            // user_answers と questions を結合して取得！
            const { data, error } = await supabase
                .from('user_answers')
                .select(`
                    is_correct,
                    created_at,
                    questions ( subject )
                `)
                .eq('user_id', userId);

            // ★エラーデバッグ用のコードを追加（昨日の「なんだこれー（image_10.png）」への対策！）
            if (error) {
                console.error("統計取得エラー:", error.message, error.details, error.hint);
            } else if (data) {
                processStats(data);
            }
            setLoading(false);
        }
        fetchStats();
    }, [userId]);

    const processStats = (data: any[]) => {
        // --- 1. 科目ごとの正答率集計 ---
        const subjectMap: any = {};
        data.forEach(row => {
            // 科目名から不要な記号を消す！（「:生命保険総論」→「生命保険総論」）
            const sub = row.questions.subject.replace(':', '');
            if (!subjectMap[sub]) subjectMap[sub] = { subject: sub, correct: 0, total: 0 };
            subjectMap[sub].total++;
            if (row.is_correct) subjectMap[sub].correct++;
        });

        const formattedStats = Object.values(subjectMap).map((item: any) => ({
            subject: item.subject,
            // 正答率を計算。データがない場合は0に
            accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
            count: item.total
        }));
        setStats(formattedStats);

        // --- 2. 日ごとの解答数集計 ---
        const dateMap: any = {};
        data.forEach(row => {
            // 日付と曜日を表示するように！（「Apr 12, Sun」みたいな形式に）
            const date = new Date(row.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            dateMap[date] = (dateMap[date] || 0) + 1;
        });

        const formattedDaily = Object.keys(dateMap).map(date => ({
            date: date,
            count: dateMap[date]
        })).slice(-7); // 直近7日分
        setDailyData(formattedDaily);
    };

    if (loading) return <div className="p-10 text-center text-xs text-slate-400 bg-blue-50/50 rounded-3xl">分析中...⌛</div>;
    // データがない場合はダッシュボード自体を表示しない
    if (stats.length === 0) return null;

    return (
        <div className="space-y-8 mb-10 px-2 sm:px-0">
            {/* 1. 科目別正答率グラフ（BarChart） */}
            <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-2xl border-b-4 border-blue-100/50">
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-6 flex items-center justify-between">
                    <span className="flex items-center"><span className="mr-2 text-xl">🎯</span> 科目別正答率</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">STATUS</span>
                </h3>
                <div className="h-60 sm:h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart data={stats} layout="vertical" margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                            {/* X軸（％）の目盛りを0, 50, 100に */}
                            <XAxis type="number" domain={[0, 100]} fontSize={10} tickLine={false} axisLine={false} stroke="#cbd5e1" ticks={[0, 50, 100]} unit="%" />
                            {/* Y軸（科目名）の表示を綺麗に */}
                            <YAxis dataKey="subject" type="category" fontSize={11} width={100} tickLine={false} axisLine={false} stroke="#64748b" interval={0} />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            {/* バーを角丸にして、色を正答率に応じて変更 */}
                            <Bar dataKey="accuracy" radius={[0, 12, 12, 0]} barSize={16}>
                                {stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.accuracy >= 70 ? '#10b981' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. 日ごとの学習ペースグラフ（LineChart） */}
            <div className="bg-white p-6 sm:p-8 rounded-[32px] shadow-2xl border-b-4 border-blue-100/50">
                <h3 className="text-base sm:text-lg font-black text-slate-800 mb-6 flex items-center justify-between">
                    <span className="flex items-center"><span className="mr-2 text-xl">📈</span> 最近の学習ペース</span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider">ACTIVITY</span>
                </h3>
                <div className="h-48 sm:h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <LineChart data={dailyData} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            {/* X軸の日付・曜日表示を綺麗に */}
                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="#cbd5e1" />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#cbd5e1" width={30} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            {/* 線と点のデザインを洗練 */}
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 3 }} activeDot={{ r: 6, fill: '#3b82f6' }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
