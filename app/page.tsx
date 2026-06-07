"use client";
import { useState, useEffect } from "react";

type Message = { id: number; name: string; message: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load messages");
      setMessages(await res.json());
    } catch (err: any) { setError(err.message); }
  };

  useEffect(() => { fetchMessages(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: message.trim() })
      });
      if (!res.ok) throw new Error("Failed to post message");
      setName(""); setMessage("");
      fetchMessages();
    } catch (err: any) { setError(err.message); }
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
        <input type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        <textarea placeholder="Your Message" value={message} onChange={(e) => setMessage(e.target.value)} className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} required />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-3 rounded font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? "Sending..." : "Post Message"}
        </button>
      </form>

      <div className="space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="p-3 bg-gray-50 rounded border">
            <p className="font-semibold text-sm text-gray-600">{msg.name}</p>
            <p className="text-gray-800 mt-1">{msg.message}</p>
          </div>
        ))}
        {messages.length === 0 && !error && <p className="text-center text-gray-500 py-4">No messages yet. Be the first!</p>}
      </div>
    </main>
  );
}
