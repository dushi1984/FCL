"use client";
import { createClient } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (!error && data) setMessages(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;
    setLoading(true);
    
    const { error } = await supabase.from("messages").insert([{ name, message }]);
    
    if (!error) {
      setName("");
      setMessage("");
      fetchMessages();
    } else {
      alert("Error saving message");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen p-8 max-w-md mx-auto font-sans">
      <h1 className="text-2xl font-bold mb-6 text-center">Mini Guestbook</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input 
          type="text" 
          placeholder="Your Name" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          className="w-full p-2 border rounded" 
          required 
        />
        <textarea 
          placeholder="Your Message" 
          value={message} 
          onChange={(e) => setMessage(e.target.value)} 
          className="w-full p-2 border rounded" 
          rows={3} 
          required 
        />
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Posting..." : "Post Message"}
        </button>
      </form>

      <div className="space-y-4">
        {messages.map((msg: any) => (
          <div key={msg.id} className="p-4 bg-gray-50 rounded border">
            <p className="font-semibold text-sm text-gray-600">{msg.name}</p>
            <p className="text-gray-800">{msg.message}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="text-center text-gray-500">No messages yet. Be the first!</p>}
      </div>
    </main>
  );
}