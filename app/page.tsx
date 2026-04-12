"use client";
import QuizComponent from "@/components/QuizComponent";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl">
          <h1 className="text-2xl font-bold text-center mb-8">生命保険講座 対策アプリ</h1>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google"]}
            localization={{ variables: { sign_up: { email_label: 'メールアドレス', password_label: 'パスワード' } } }}
          />
        </div>
      </div>
    );
  }

  return (
    // ★古いヘッダー（余分なログアウトボタン）を完全削除！
    // クイズ側に、内部ID(userId)と、本物のメアド(userEmail)の両方を渡すよ！
    <QuizComponent
      userId={session.user.id}
      userEmail={session.user.email}
    />
  );
}
