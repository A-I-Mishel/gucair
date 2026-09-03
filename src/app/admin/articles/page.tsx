'use client';
import { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { Article } from "@/types";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/primitives";

function Toolbar({ onImage }: { onImage: (f: File) => void }) {
  return (
    <div className="flex flex-wrap gap-1 border-b border-slate-200 p-2" role="toolbar" aria-label="Editor toolbar">
      <label className="cursor-pointer rounded-md border px-2 py-1 text-xs hover:bg-slate-100">
        Image
        <input type="file" accept="image/*" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImage(f); e.target.value = ""; }} />
      </label>
    </div>
  );
}

export default function AdminArticlesPage() {
  const [rows, setRows] = useState<Article[]>([]);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [msg, setMsg] = useState("");

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: "",
    immediatelyRender: false,
    editorProps: { attributes: { class: "min-h-[200px] p-3 text-sm focus:outline-none" } },
  });

  const load = async () => {
    const snap = await getDocs(collection(db, "articles"));
    setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Article));
  };
  useEffect(() => { load(); }, []);

  const insertImage = async (f: File) => {
    try {
      const url = await uploadToCloudinary(f, "gucair/articles");
      editor?.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Image upload failed");
    }
  };

  const create = async () => {
    setMsg("");
    try {
      const html = editor?.getHTML() ?? "";
      if (!title.trim() || !html.replace(/<[^>]*>/g, "").trim()) throw new Error("Title and content required.");
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
      await addDoc(collection(db, "articles"), {
        title: title.trim(),
        slug,
        content: html,
        excerpt: text.slice(0, 160),
        authorId: auth.currentUser?.uid ?? "admin",
        imageUrl: null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: "draft",
        publishedAt: null,
        createdAt: serverTimestamp(),
      });
      setTitle("");
      setTags("");
      editor?.commands.clearContent();
      setMsg("Draft created.");
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Create failed");
    }
  };

  const publish = async (id: string, status: "draft" | "published") => {
    await updateDoc(doc(db, "articles", id), { status, publishedAt: status === "published" ? serverTimestamp() : null });
    load();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-[#1e3a5f]">Articles</h1>
      <div className="rounded-xl border p-4 space-y-3">
        <div><Label htmlFor="art-title">Title</Label><Input id="art-title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label htmlFor="art-tags">Tags (comma-separated)</Label><Input id="art-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="AI policy, rankings" /></div>
        <div className="rounded-md border" aria-label="Article body editor">
          <Toolbar onImage={insertImage} />
          <EditorContent editor={editor} />
        </div>
        <Button onClick={create}>Create draft</Button>
        {msg && <p className="text-sm text-slate-600" role="status">{msg}</p>}
      </div>
      <div className="space-y-2">
        {rows.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border p-3 text-sm">
            <span className="font-medium">{a.title} <span className="text-slate-400">({a.status})</span></span>
            <span className="space-x-1">
              <Button size="sm" variant="outline" onClick={() => publish(a.id, a.status === "published" ? "draft" : "published")}>
                {a.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              <Button size="sm" variant="destructive" onClick={async () => { await deleteDoc(doc(db, "articles", a.id)); load(); }}>Delete</Button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
