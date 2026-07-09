import type {
  NoteDocument,
  NoteElementNode,
  NoteNode,
  NoteTextNode,
} from "@workspace/core/features/notes/domain/note-types";

const emptyDocument: NoteDocument = [{ children: [{ text: "" }], type: "p" }];

const legacyBlockTypes = new Set([
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
  "quote",
  "codeBlock",
  "table",
  "callout",
  "pageLink",
  "divider",
]);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTextNode(value: unknown): value is NoteTextNode {
  return isRecord(value) && typeof value.text === "string";
}

function isElementNode(value: unknown): value is NoteElementNode {
  return isRecord(value) && Array.isArray(value.children);
}

function isLegacyBlock(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.type === "string" &&
    legacyBlockTypes.has(value.type) &&
    ("content" in value || "props" in value || "id" in value)
  );
}

function sanitizeTextNode(node: NoteTextNode): NoteTextNode {
  return { ...node, text: node.text };
}

function sanitizeElementNode(node: NoteElementNode): NoteElementNode {
  const { children, ...rest } = node;
  return {
    ...rest,
    children: children.map(sanitizeNode),
  };
}

function sanitizeNode(node: NoteNode): NoteNode {
  if (isTextNode(node)) {
    return sanitizeTextNode(node);
  }
  if (isElementNode(node)) {
    return sanitizeElementNode(node);
  }
  return { text: "" };
}

function firstText(value: unknown): string {
  const parts: string[] = [];
  collectText(value, parts);
  return parts.join("");
}

function collectText(value: unknown, out: string[]): void {
  if (typeof value === "string") {
    out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectText(item, out);
    }
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  if (typeof value.text === "string") {
    out.push(value.text);
  }
  if ("content" in value) {
    collectText(value.content, out);
  }
  if ("children" in value) {
    collectText(value.children, out);
  }
}

function stylesToMarks(styles: unknown): JsonRecord {
  if (!isRecord(styles)) {
    return {};
  }
  return {
    ...(styles.bold === true ? { bold: true } : {}),
    ...(styles.italic === true ? { italic: true } : {}),
    ...(styles.underline === true ? { underline: true } : {}),
    ...(styles.strike === true || styles.strikethrough === true
      ? { strikethrough: true }
      : {}),
    ...(styles.code === true ? { code: true } : {}),
    ...(styles.backgroundColor ? { highlight: true } : {}),
  };
}

function legacyInlineToPlate(content: unknown): NoteNode[] {
  if (typeof content === "string") {
    return [{ text: content }];
  }
  if (!Array.isArray(content)) {
    return [{ text: "" }];
  }
  const nodes: NoteNode[] = [];
  for (const item of content) {
    if (typeof item === "string") {
      nodes.push({ text: item });
      continue;
    }
    if (!isRecord(item)) {
      continue;
    }
    if (typeof item.text === "string") {
      nodes.push({ ...stylesToMarks(item.styles), text: item.text });
      continue;
    }
    if (item.type === "link") {
      let url = "";
      if (typeof item.href === "string") {
        url = item.href;
      } else if (typeof item.url === "string") {
        url = item.url;
      }
      nodes.push({
        children: legacyInlineToPlate(item.content),
        target: "_blank",
        type: "a",
        url,
      });
    }
  }
  return nodes.length > 0 ? nodes : [{ text: "" }];
}

function getProps(block: JsonRecord): JsonRecord {
  return isRecord(block.props) ? block.props : {};
}

function legacyTableToPlate(block: JsonRecord): NoteElementNode {
  const content = isRecord(block.content) ? block.content : {};
  const rows = Array.isArray(content.rows) ? content.rows : [];
  return {
    type: "table",
    children: rows.map((row, rowIndex) => {
      const rowRecord = isRecord(row) ? row : {};
      const cells = Array.isArray(rowRecord.cells) ? rowRecord.cells : [];
      return {
        type: "tr",
        children: cells.map((cell) => ({
          type: rowIndex === 0 ? "th" : "td",
          children: [{ text: firstText(cell) }],
        })),
      };
    }),
  };
}

function legacyBlockToPlate(block: JsonRecord): NoteElementNode {
  const type = typeof block.type === "string" ? block.type : "paragraph";
  const props = getProps(block);
  const inlineChildren = legacyInlineToPlate(block.content);

  if (type === "heading") {
    const level =
      props.level === 1 || props.level === 2 || props.level === 3
        ? props.level
        : 1;
    return { children: inlineChildren, type: `h${level}` };
  }
  if (type === "quote") {
    return { children: inlineChildren, type: "blockquote" };
  }
  if (type === "codeBlock") {
    const code = firstText(block.content);
    return {
      type: "code_block",
      children: [{ children: [{ text: code }], type: "code_line" }],
    };
  }
  if (type === "table") {
    return legacyTableToPlate(block);
  }
  if (type === "callout") {
    return {
      type: "callout",
      children: [{ children: inlineChildren, type: "p" }],
    };
  }
  if (type === "pageLink") {
    return { children: [{ text: "Linked page" }], type: "p" };
  }
  if (type === "divider") {
    return { children: [{ text: "---" }], type: "p" };
  }

  const base: NoteElementNode = { children: inlineChildren, type: "p" };
  if (type === "bulletListItem") {
    return { ...base, indent: 1, listStyleType: "disc" };
  }
  if (type === "numberedListItem") {
    return { ...base, indent: 1, listStyleType: "decimal" };
  }
  if (type === "checkListItem") {
    return {
      ...base,
      checked: props.checked === true,
      indent: 1,
      listStyleType: "todo",
    };
  }
  return base;
}

export function noteDocumentToPlateValue(document: NoteDocument): NoteDocument {
  if (document.length === 0) {
    return emptyDocument;
  }
  return document.map((node) => {
    if (isLegacyBlock(node)) {
      return legacyBlockToPlate(node);
    }
    return sanitizeElementNode(node);
  });
}

export function plateValueToNoteDocument(value: NoteDocument): NoteDocument {
  if (value.length === 0) {
    return emptyDocument;
  }
  return value.map(sanitizeElementNode);
}
