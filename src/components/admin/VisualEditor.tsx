"use client";

import { useEffect, useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { Placeholder } from "@tiptap/extensions";

/**
 * Word-processor style editor for blog posts (stores HTML). Pasting from Google Docs, Word,
 * Notion or ChatGPT keeps headings, bold/italic, links, lists, quotes and tables. The HTML is
 * cleaned again on the server when the post is saved, so nothing unsafe reaches the site.
 */
type Props = {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<string | null>;
  uploading: boolean;
};

export function VisualEditor({ value, onChange, onUploadImage, uploading }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const lastEmitted = useRef(value);

  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        link: { openOnClick: false, autolink: true, linkOnPaste: true, HTMLAttributes: { rel: null, target: null } },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Start writing, or paste your article from Google Docs, Word or ChatGPT…" }),
    ],
    content: value || "",
    editorProps: {
      attributes: { class: "blog-prose visual-editor min-h-[60vh] p-5 outline-none md:p-7", spellcheck: "true", "aria-label": "Post content" },
      transformPastedHTML: cleanPastedHtml,
      // Images pasted or dropped as files are uploaded instead of embedded as data.
      handlePaste: (_view, event) => {
        const file = [...(event.clipboardData?.files ?? [])].find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        void insertUploaded(file);
        return true;
      },
      handleDrop: (_view, event) => {
        const file = [...((event as DragEvent).dataTransfer?.files ?? [])].find((f) => f.type.startsWith("image/"));
        if (!file) return false;
        event.preventDefault();
        void insertUploaded(file);
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? "" : ed.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
  });

  // Content replaced from outside (format conversion, HTML tab edits): load it without
  // echoing an update back.
  useEffect(() => {
    if (editor && value !== lastEmitted.current) {
      lastEmitted.current = value;
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  async function insertUploaded(file: File) {
    const url = await onUploadImage(file);
    if (url && editor) editor.chain().focus().setImage({ src: url, alt: "" }).run();
  }

  if (!editor) return <div className="min-h-[60vh] p-5 text-sm text-mute">Loading editor…</div>;

  return (
    <div>
      <Toolbar editor={editor} onImage={() => fileRef.current?.click()} uploading={uploading} />
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void insertUploaded(f);
        }}
      />
      <div data-lenis-prevent>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

/**
 * Tidies HTML pasted from Google Docs / Word before the editor reads it:
 * - H1 becomes H2 (the post title is the page's H1) and H5/H6 become H4
 * - link text loses the underline/colour styling Docs adds, so it doesn't turn into <u>
 * - Word's hidden markup (o:p tags, conditional comments) is dropped
 */
function cleanPastedHtml(html: string) {
  if (typeof DOMParser === "undefined") return html;
  const doc = new DOMParser().parseFromString(html.replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, ""), "text/html");
  const retag = (el: Element, tag: string) => {
    const n = doc.createElement(tag);
    n.innerHTML = el.innerHTML;
    el.replaceWith(n);
  };
  doc.querySelectorAll("h1").forEach((h) => retag(h, "h2"));
  doc.querySelectorAll("h5, h6").forEach((h) => retag(h, "h4"));
  doc.querySelectorAll("a [style], a[style]").forEach((el) => {
    const s = (el as HTMLElement).style;
    s.removeProperty("text-decoration");
    s.removeProperty("text-decoration-line");
    s.removeProperty("color");
  });
  doc.querySelectorAll("a u").forEach((u) => u.replaceWith(...Array.from(u.childNodes)));
  doc.querySelectorAll("o\\:p").forEach((el) => el.remove());
  return doc.body.innerHTML;
}

function Toolbar({ editor, onImage, uploading }: { editor: Editor; onImage: () => void; uploading: boolean }) {
  const c = () => editor.chain().focus();
  const inTable = editor.isActive("table");
  const btn = (label: string, title: string, run: () => void, active = false, disabled = false) => (
    <button
      key={title}
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
      className={`rounded px-2.5 py-1.5 text-xs transition-colors disabled:opacity-30 ${active ? "bg-bone text-ink" : "text-bone-dim hover:bg-ink-3 hover:text-bone"}`}
    >
      {label}
    </button>
  );
  const sep = (k: string) => <span key={k} aria-hidden="true" className="mx-1 h-4 w-px bg-line-2" />;

  const setLink = () => {
    const prev = (editor.getAttributes("link").href as string) ?? "";
    const url = window.prompt("Link URL (leave empty to remove the link)", prev || "https://");
    if (url === null) return;
    if (!url.trim() || url.trim() === "https://") return void c().extendMarkRange("link").unsetLink().run();
    const href = /^(https?:|mailto:|tel:|\/|#)/i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
    c().extendMarkRange("link").setLink({ href }).run();
  };
  const editAlt = () => {
    const prev = (editor.getAttributes("image").alt as string) ?? "";
    const alt = window.prompt("Describe this image (alt text, for SEO and screen readers)", prev);
    if (alt !== null) c().updateAttributes("image", { alt: alt.trim() }).run();
  };

  return (
    <div className="sticky top-16 z-10 flex flex-wrap items-center gap-0.5 border-b border-line bg-ink-2/95 px-2 py-1.5 backdrop-blur" role="toolbar" aria-label="Formatting">
      {btn("¶", "Paragraph", () => c().setParagraph().run(), editor.isActive("paragraph"))}
      {btn("H2", "Heading 2 (section)", () => c().toggleHeading({ level: 2 }).run(), editor.isActive("heading", { level: 2 }))}
      {btn("H3", "Heading 3 (sub-section)", () => c().toggleHeading({ level: 3 }).run(), editor.isActive("heading", { level: 3 }))}
      {btn("H4", "Heading 4", () => c().toggleHeading({ level: 4 }).run(), editor.isActive("heading", { level: 4 }))}
      {sep("s1")}
      {btn("B", "Bold", () => c().toggleBold().run(), editor.isActive("bold"))}
      {btn("I", "Italic", () => c().toggleItalic().run(), editor.isActive("italic"))}
      {btn("U", "Underline", () => c().toggleUnderline().run(), editor.isActive("underline"))}
      {btn("S", "Strikethrough", () => c().toggleStrike().run(), editor.isActive("strike"))}
      {btn("Link", "Add or edit link", setLink, editor.isActive("link"))}
      {sep("s2")}
      {btn("• List", "Bulleted list", () => c().toggleBulletList().run(), editor.isActive("bulletList"))}
      {btn("1. List", "Numbered list", () => c().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {btn("Quote", "Quote", () => c().toggleBlockquote().run(), editor.isActive("blockquote"))}
      {btn("Code", "Code block", () => c().toggleCodeBlock().run(), editor.isActive("codeBlock"))}
      {btn("—", "Divider", () => c().setHorizontalRule().run())}
      {sep("s3")}
      {btn(uploading ? "Uploading…" : "Image", "Upload and insert an image", onImage, false, uploading)}
      {editor.isActive("image") && btn("Alt text", "Edit image alt text", editAlt)}
      {btn("Table", "Insert table", () => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(), inTable, inTable)}
      {inTable && (
        <>
          {btn("+ Row", "Add row below", () => c().addRowAfter().run())}
          {btn("+ Col", "Add column right", () => c().addColumnAfter().run())}
          {btn("− Row", "Delete row", () => c().deleteRow().run())}
          {btn("− Col", "Delete column", () => c().deleteColumn().run())}
          {btn("✕ Table", "Delete table", () => c().deleteTable().run())}
        </>
      )}
      {sep("s4")}
      {btn("Clear", "Clear formatting", () => c().unsetAllMarks().clearNodes().run())}
      {btn("↶", "Undo (Ctrl+Z)", () => c().undo().run(), false, !editor.can().undo())}
      {btn("↷", "Redo (Ctrl+Shift+Z)", () => c().redo().run(), false, !editor.can().redo())}
    </div>
  );
}
