"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";

export default function StatsComponent({ userId }: { userId: string }) {
    const [stats, setStats] = useState<any[]>([]);
    const [dailyData, setDailyData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('user_answers')
                    .select(`is_correct, created_at, questions ( subject )`)
                    .eq('user_id', userId);

                if (error) throw error;
                if (data) processStats(data);
            } catch (err) {
                console.error("統計取得エラー:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, [userId]);

    const processStats = (data: any[]) => {
        const subjectMap: any = {};
        data.forEach(row => {
            const subjectName = row.questions?.subject;
            if (!subjectName) return;
            const sub = subjectName.replace(':', '');
            if (!subjectMap[sub]) subjectMap[sub] = { subject: sub, correct: 0, total: 0 };
            subjectMap[sub].total++;
            if (row.is_correct) subjectMap[sub].correct++;
        });

        const formattedStats = Object.values(subjectMap).map((item: any) => ({
            subject: item.subject,
            accuracy: item.total > 0 ? Math.round((item.correct / item.total) * 100) : 0,
            count: item.total
        }));
        setStats(formattedStats);

        const dateMap: any = {};
        data.forEach(row => {
            const date = new Date(row.created_at).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            dateMap[date] = (dateMap[date] || 0) + 1;
        });

        const formattedDaily = Object.keys(dateMap).map(date => ({
            date: date,
            count: dateMap[date]
        })).slice(-7);
        setDailyData(formattedDaily);
    };

    if (loading) return <div className="p-10 text-center text-xs text-slate-400">分析中...⌛</div>;
    if (stats.length === 0) return <div className="p-10 text-center text-xs text-slate-400">データがまだないよ！</div>;

    return (
        <div className="space-y-8 mb-10 px-2 select-none">
            {/* 1. 科目別正答率 */}
            <div className="bg-white p-6 rounded-[32px] shadow-2xl border-b-4 border-blue-100/50">
                <h3 className="text-base font-black text-slate-800 mb-6 flex items-center justify-between">
                    <span className="flex items-center">
                        <img src="/icons/11_seitouritsu.png" alt="" className="w-6 h-6 object-contain mr-2 pointer-events-none" />
                        科目別正答率
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">STATUS</span>
                </h3>
                <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <BarChart data={stats} layout="vertical" margin={{ left: -10, right: 10 }}>
                            <XAxis type="number" domain={[0, 100]} fontSize={10} tickLine={false} axisLine={false} stroke="#cbd5e1" unit="%" />
                            <YAxis dataKey="subject" type="category" fontSize={11} width={100} tickLine={false} axisLine={false} stroke="#64748b" />
                            <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Bar dataKey="accuracy" radius={[0, 12, 12, 0]} barSize={16}>
                                {stats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.accuracy >= 70 ? '#10b981' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. 学習ペース */}
            <div className="bg-white p-6 rounded-[32px] shadow-2xl border-b-4 border-blue-100/50">
                <h3 className="text-base font-black text-slate-800 mb-6 flex items-center justify-between">
                    <span className="flex items-center">
                        <img src="/icons/12_pace.png" alt="" className="w-6 h-6 object-contain mr-2 pointer-events-none" />
                        最近の学習ペース
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase">ACTIVITY</span>
                </h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <LineChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="date" fontSize={10} tickLine={false} axisLine={false} stroke="#cbd5e1" />
                            <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="#cbd5e1" width={30} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#ffffff', stroke: '#3b82f6', strokeWidth: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
