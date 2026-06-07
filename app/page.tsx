"use client";
import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

// تكوين Supabase عشان يتجنب مشاكل iOS Safari
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false, detectSessionInUrl: false, autoRefreshToken: false },
    global: { headers: { "X-Client-Info": "ios-safe-guestbook" } }
  }
);

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setError("");
    // إضافة timestamp عشان سافاري ميخبيش النتيجة
    const timestamp = Date.now();
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    
    if (error) setError("فشل في جلب الرسائل: " + error.message);
    else if (data) setMessages(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setLoading(true);
    setError("");
    
    const { error } = await supabase.from("messages").insert([{ name: name.trim(), message: message.trim() }]);
    
    if (error) {
      setError("فشل في الإرسال: " + error.message);
    } else {
      setName("");
      setMessage("");
      fetchMessages();
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-6 max-w-md mx-auto font-sans bg-white text-gray-900">
      <h1 className="text-2xl font-bold mb-4 text-center">Mini Guestbook</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-500 text-red-700 px-3 py-2 rounded mb-4 text-sm font-mono">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3 mb-6">
        <input 
          type="text" 
          placeholder="الاسم" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required 
        />
        <textarea 
          placeholder="الرسالة" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          required 
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? "جاري الإرسال..." : "إرسال"}
        </button>
      </form>

      <div className="space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="font-semibold text-sm text-gray-600">{msg.name}</p>
            <p className="text-gray-800 mt-1">{msg.message}</p>
          </div>
        ))}
        {messages.length === 0 && !error && (
          <p className="text-center text-gray-500 py-4">مفيش رسائل لسه. ابدأ الأول!</p>
        )}
      </div>
    </main>
  );
}
