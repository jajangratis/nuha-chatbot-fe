import { splitMentionText } from "@/lib/ticket-mentions";

/** Chip mention di editor & tampilan baca — selaras ClickUp-style pill */
export const MENTION_CHIP_CLASS =
  "mx-0.5 inline-flex max-w-[12rem] cursor-default select-none items-center rounded-full bg-[#E8F9F8] px-1.5 py-0.5 align-baseline text-[12px] font-semibold text-[#014547] ring-1 ring-[#07C5BA]/20";

const ZWSP = "\u200B";

function stripZwsp(text: string) {
  return text.replace(/\u200B/g, "");
}

function mentionTokenFromEl(el: HTMLElement) {
  const name = el.dataset.mentionName ?? "";
  const id = el.dataset.mentionId ?? "";
  return `@[${name}](user:${id})`;
}

export function createMentionChipElement(name: string, userId: string) {
  const span = document.createElement("span");
  span.contentEditable = "false";
  span.dataset.mentionId = userId;
  span.dataset.mentionName = name;
  span.className = MENTION_CHIP_CLASS;
  span.textContent = `@${name}`;
  return span;
}

export function serializeMentionEditor(root: HTMLElement): string {
  let out = "";

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += stripZwsp(node.textContent ?? "");
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const el = node as HTMLElement;
    if (el.dataset.mentionId) {
      out += mentionTokenFromEl(el);
      return;
    }
    if (el.tagName === "BR") {
      out += "\n";
      return;
    }
    el.childNodes.forEach(walk);
  };

  root.childNodes.forEach(walk);
  return out;
}

export function renderMentionEditorContent(root: HTMLElement, text: string) {
  root.innerHTML = "";
  const parts = splitMentionText(text);

  for (const part of parts) {
    if (part.type === "mention") {
      root.appendChild(createMentionChipElement(part.name, part.userId));
      root.appendChild(document.createTextNode(ZWSP));
      continue;
    }
    const lines = part.value.split("\n");
    lines.forEach((line, i) => {
      if (line) root.appendChild(document.createTextNode(line));
      if (i < lines.length - 1) root.appendChild(document.createElement("br"));
    });
  }
}

export function getMentionEditorCursor(root: HTMLElement): number {
  const sel = window.getSelection();
  if (!sel?.rangeCount) return serializeMentionEditor(root).length;

  const range = sel.getRangeAt(0);
  if (!root.contains(range.endContainer)) return serializeMentionEditor(root).length;

  const pre = document.createRange();
  pre.selectNodeContents(root);
  pre.setEnd(range.endContainer, range.endOffset);
  const tmp = document.createElement("div");
  tmp.appendChild(pre.cloneContents());
  return serializeMentionEditor(tmp).length;
}

export function setMentionEditorCursor(root: HTMLElement, target: number) {
  const sel = window.getSelection();
  if (!sel) return;

  const range = document.createRange();
  let pos = 0;
  let placed = false;

  const placeInText = (node: Text, offset: number) => {
    range.setStart(node, offset);
    range.collapse(true);
    placed = true;
  };

  const walk = (node: Node): boolean => {
    if (placed) return true;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = stripZwsp(node.textContent ?? "");
      const len = text.length;
      if (pos + len >= target) {
        placeInText(node as Text, target - pos);
        return true;
      }
      pos += len;
      return false;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return false;

    const el = node as HTMLElement;
    if (el.dataset.mentionId) {
      const token = mentionTokenFromEl(el);
      if (pos + token.length >= target) {
        const after = el.nextSibling;
        if (after?.nodeType === Node.TEXT_NODE) {
          placeInText(after as Text, 0);
        } else {
          range.setStartAfter(el);
          range.collapse(true);
          placed = true;
        }
        return true;
      }
      pos += token.length;
      return false;
    }

    if (el.tagName === "BR") {
      if (pos + 1 >= target) {
        range.setStartBefore(el);
        range.collapse(true);
        placed = true;
        return true;
      }
      pos += 1;
      return false;
    }

    for (const child of Array.from(el.childNodes)) {
      if (walk(child)) return true;
    }
    return false;
  };

  for (const child of Array.from(root.childNodes)) {
    if (walk(child)) break;
  }

  if (!placed) {
    range.selectNodeContents(root);
    range.collapse(false);
  }

  sel.removeAllRanges();
  sel.addRange(range);
}
