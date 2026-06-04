"use client";

import type { Components } from "react-markdown";
import type { Element } from "hast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MarkdownImage } from "@/components/MarkdownImage";

type ChatMarkdownProps = {
  content: string;
};

function nodeContainsImage(node: unknown): boolean {
  if (!node || typeof node !== "object" || !("children" in node)) return false;
  const children = (node as { children?: unknown[] }).children ?? [];
  for (const child of children) {
    if (typeof child !== "object" || child === null) continue;
    if ("tagName" in child && (child as Element).tagName === "img") return true;
    if ("children" in child && nodeContainsImage(child)) return true;
  }
  return false;
}

const paragraphClass = "mb-2 last:mb-0 [&:not(:first-child)]:mt-0";

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-2 mt-1 text-base font-bold text-[#014547] first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-1.5 mt-3 text-sm font-bold text-[#014547] first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-1 mt-2.5 text-sm font-semibold text-[#0B6463] first:mt-0">
      {children}
    </h3>
  ),
  p: ({ node, children }) =>
    nodeContainsImage(node) ? (
      <div className={paragraphClass}>{children}</div>
    ) : (
      <p className={paragraphClass}>{children}</p>
    ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[#014547]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-[#0B1D15]/90">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-[#07C5BA] underline decoration-[#07C5BA]/40 underline-offset-2 transition hover:text-[#014547] hover:decoration-[#014547]"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="my-3 border-0 border-t border-[#E8E8E8]" />,
  img: ({ src, alt }) => (
    <MarkdownImage
      src={typeof src === "string" ? src : undefined}
      alt={typeof alt === "string" ? alt : undefined}
    />
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-[3px] border-[#AAE053] bg-[#F8FBF3] py-1.5 pl-3 pr-2 text-[#0B1D15]/90">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className);
    if (isBlock) {
      return (
        <code className="block overflow-x-auto rounded-lg bg-[#F5F5F5] p-2 text-xs text-[#014547]">
          {children}
        </code>
      );
    }
    return (
      <code className="rounded bg-[#F0F7E8] px-1 py-0.5 text-xs font-medium text-[#014547]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-[#F5F5F5] p-2 text-xs last:mb-0">
      {children}
    </pre>
  ),
};

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="chat-markdown text-sm leading-relaxed text-[#0B1D15]">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
