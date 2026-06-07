"use client";
import { useState, useEffect } from "react";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const API = `${URL}/rest/v1/messages`;
const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation"
};

export default function Home() {
  const [messages, setMessages] = useState<{id:number, name:string, message:string}[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API}?select=*&order=created_at.desc`, { 
        headers: HEADERS, 
        cache: "no-store" // يمنع الكاش على الموبايل نهائياً
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages(data);
    } catch (err: any) {
      setError("Load failed: " + err.message);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(API, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ name: name.trim(), message: message.trim() })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || `HTTP ${res.status}`);
      }
      setName(""); setMessage("");
      fetchMessages();
    } catch (err: any) {
      setError("Post failed: " + err.message);
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
          placeholder="Your Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          required 
        />
        <textarea 
          placeholder="Your Message" 
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
          {loading ? "Sending..." : "Post Message"}
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
          <p className="text-center text-gray-500 py-4">No messages yet. Be the first!</p>
        )}
      </div>
    </main>
  );
}
