"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { lowlight } from "lowlight/lib/common.js";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Underline from "@tiptap/extension-underline";
import CharacterCount from "@tiptap/extension-character-count";
import { ListItem } from "@tiptap/extension-list-item";

import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import Link from "@tiptap/extension-link";

import {
  FaBold,
  FaItalic,
  FaUnderline,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaUndo,
  FaRedo,
  FaImage,
  FaCode,
  FaHeading,
  FaMinus,
  FaTable,
  FaParagraph,
  FaLink,
} from "react-icons/fa";
import { useEffect } from "react";

export default function TiptapEditor({ value, onChange }: any) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-lg shadow-md",
        },
      }),
      Underline,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: true,
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
          class: "text-blue-600 underline dark:text-blue-400",
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse border border-gray-300",
        },
      }),
      TableRow,
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-gray-300 px-4 py-2",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-gray-300 px-4 py-2 bg-gray-100 font-bold",
        },
      }),
      CharacterCount.configure({
        limit: 20000,
        mode: "textSize",
        wordCounter: (text) => {
          const cleaned = text.replace(/<[^>]+>/g, " "); // remove HTML
          return cleaned
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0).length;
        },
      }),
    ],
    immediatelyRender: false,
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-lg dark:prose-invert prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic max-w-none min-h-[400px] bg-white dark:bg-gray-900 p-6 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const Button = ({ onClick, icon: Icon, active, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`
        p-2.5 rounded-lg transition-all duration-200 border shadow-sm
        flex items-center justify-center
        ${
          active
            ? "bg-blue-500 text-white border-blue-500 shadow-blue-500/20"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-md"
        }
      `}
    >
      <Icon size={16} />
    </button>
  );

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <Button
            title="Bold"
            icon={FaBold}
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <Button
            title="Italic"
            icon={FaItalic}
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <Button
            title="Underline"
            icon={FaUnderline}
            active={editor?.isActive("underline")}
            onClick={() => editor?.chain().focus().toggleUnderline().run()}
          />
        </div>

        {/* Headings & Paragraph */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <select
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg p-2 border border-gray-300 dark:border-gray-600 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            onChange={(e) => {
              const value = e.target.value;

              if (value === "paragraph") {
                editor?.chain().focus().setParagraph().run();
              } else if (value === "2" || value === "3" || value === "4") {
                const level = parseInt(value) as 2 | 3 | 4;
                editor?.chain().focus().toggleHeading({ level }).run();
              }
            }}
            value={
              editor?.isActive("heading", { level: 2 })
                ? "2"
                : editor?.isActive("heading", { level: 3 })
                ? "3"
                : editor?.isActive("heading", { level: 4 })
                ? "4"
                : "paragraph"
            }
          >
            <option value="paragraph">Paragraph</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
          </select>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <Button
            title="Bullet List"
            icon={FaListUl}
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <Button
            title="Numbered List"
            icon={FaListOl}
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
        </div>

        {/* Blocks */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <Button
            title="Blockquote"
            icon={FaQuoteLeft}
            active={editor?.isActive("blockquote")}
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          />
          <Button
            title="Code Block"
            icon={FaCode}
            active={editor?.isActive("codeBlock")}
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          />
          <Button
            title="Horizontal Rule"
            icon={FaMinus}
            onClick={() => editor?.chain().focus().setHorizontalRule().run()}
          />
        </div>

        {/* Media */}
        <div className="flex items-center gap-1 pr-2 border-r border-gray-300 dark:border-gray-600">
          <Button title="Insert Image" icon={FaImage} onClick={addImage} />
          <Button title="Insert Table" icon={FaTable} onClick={addTable} />
        </div>

        <Button
          title="Insert Link"
          icon={FaLink}
          onClick={() => {
            const url = window.prompt("Enter URL:");
            if (url) {
              editor
                ?.chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            }
          }}
        />

        {/* History */}
        <div className="flex items-center gap-1">
          <Button
            title="Undo"
            icon={FaUndo}
            onClick={() => editor?.chain().focus().undo().run()}
          />
          <Button
            title="Redo"
            icon={FaRedo}
            onClick={() => editor?.chain().focus().redo().run()}
          />
        </div>
      </div>

      {/* Editor Content */}
      <div className="relative">
        <EditorContent editor={editor} />

        {/* Word Count */}
        {editor && (
          <div className="absolute bottom-3 right-3 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700">
            {editor.storage.characterCount.words()} words
          </div>
        )}
      </div>
    </div>
  );
}
