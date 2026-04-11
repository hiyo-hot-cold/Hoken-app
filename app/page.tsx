"use client";
import QuizComponent from "@/components/QuizComponent";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // 1. 今ログインしてるか確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // 2. ログイン状態が変わったら（ログイン・ログアウトしたら）検知する
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ログインしてない時は、ログイン画面を出す
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-8">生命保険講座 対策アプリ</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google"]} // Googleログインも出せるよ！
            localization={{ variables: { sign_up: { email_label: 'メールアドレス', password_label: 'パスワード' } } }}
          />
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm">
          <p className="font-bold text-slate-600">👤 {session.user.email}</p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm bg-slate-200 px-4 py-2 rounded-xl hover:bg-red-100 hover:text-red-600 transition"
          >
            ログアウト
          </button>
        </div>

        {/* ここでクイズを呼び出す！ */}
        <QuizComponent
          userId={session.user.id} />
      </div>
    </div>
  );
}
