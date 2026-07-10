"use client";

import {
  BlockquoteRules,
  BoldRules,
  CodeRules,
  HeadingRules,
  HighlightRules,
  HorizontalRuleRules,
  ItalicRules,
  MarkComboRules,
  StrikethroughRules,
  SubscriptRules,
  SuperscriptRules,
  UnderlineRules,
} from "@platejs/basic-nodes";
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  HighlightPlugin,
  HorizontalRulePlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  SubscriptPlugin,
  SuperscriptPlugin,
  UnderlinePlugin,
} from "@platejs/basic-nodes/react";
import { insertCallout } from "@platejs/callout";
import { CalloutPlugin } from "@platejs/callout/react";
import { CodeBlockRules, insertCodeBlock } from "@platejs/code-block";
import {
  CodeBlockPlugin,
  CodeLinePlugin,
  CodeSyntaxPlugin,
} from "@platejs/code-block/react";
import { IndentPlugin } from "@platejs/indent/react";
import {
  getLinkAttributes,
  insertLink,
  LinkRules,
  wrapLink,
} from "@platejs/link";
import { LinkPlugin } from "@platejs/link/react";
import {
  BulletedListRules,
  isOrderedList,
  ListStyleType,
  OrderedListRules,
  someList,
  TaskListRules,
  toggleList,
} from "@platejs/list";
import {
  ListPlugin,
  useTodoListElement,
  useTodoListElementState,
} from "@platejs/list/react";
import { MarkdownPlugin } from "@platejs/markdown";
import { insertImage } from "@platejs/media";
import { ImagePlugin } from "@platejs/media/react";
import {
  TableCellHeaderPlugin,
  TableCellPlugin,
  TablePlugin,
  TableRowPlugin,
} from "@platejs/table/react";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import {
  ArrowDownIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  BoldIcon,
  Code2Icon,
  Columns3Icon,
  Grid3X3Icon,
  GripVerticalIcon,
  HighlighterIcon,
  ImageIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  ListTodoIcon,
  MessageSquareQuoteIcon,
  MinusIcon,
  PlusIcon,
  QuoteIcon,
  Rows3Icon,
  StrikethroughIcon,
  SubscriptIcon,
  SuperscriptIcon,
  TableIcon,
  Trash2Icon,
  UnderlineIcon,
  XIcon,
} from "lucide-react";
import {
  KEYS,
  normalizeStaticValue,
  PathApi,
  type TElement,
  type TLinkElement,
  type TListElement,
  type Value,
} from "platejs";
import {
  ParagraphPlugin,
  Plate,
  PlateContainer,
  PlateContent,
  type PlateContentProps,
  PlateElement,
  type PlateElementProps,
  PlateLeaf,
  type PlateLeafProps,
  type RenderNodeWrapper,
  type RenderNodeWrapperProps,
  useEditorPlugin,
  useEditorRef,
  useEditorSelector,
  usePath,
  usePlateEditor,
  useReadOnly,
} from "platejs/react";
import type * as React from "react";
import { useState } from "react";
import remarkGfm from "remark-gfm";

export type RichTextValue = Value;

const emptyValue: RichTextValue = [
  {
    children: [{ text: "" }],
    type: KEYS.p,
  },
];

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

const BlockList: RenderNodeWrapper = (props: RenderNodeWrapperProps) => {
  const element = (props as unknown as PlateElementProps).element;
  const listType = element[KEYS.listType];

  if (!(listType && listType !== KEYS.listTodo && isOrderedList(element))) {
    return;
  }

  return (props) => <OrderedBlockList {...props} />;
};

const editorPlugins = [
  ParagraphPlugin.withComponent(ParagraphElement),
  IndentPlugin.configure({
    inject: {
      targetPlugins: [...KEYS.heading, KEYS.p, KEYS.blockquote, KEYS.codeBlock],
    },
    options: {
      offset: 24,
    },
  }),
  H1Plugin.configure({
    inputRules: [HeadingRules.markdown()],
    node: { component: H1Element },
    rules: { break: { empty: "reset" } },
    shortcuts: { toggle: { keys: "mod+alt+1" } },
  }),
  H2Plugin.configure({
    inputRules: [HeadingRules.markdown()],
    node: { component: H2Element },
    rules: { break: { empty: "reset" } },
    shortcuts: { toggle: { keys: "mod+alt+2" } },
  }),
  H3Plugin.configure({
    inputRules: [HeadingRules.markdown()],
    node: { component: H3Element },
    rules: { break: { empty: "reset" } },
    shortcuts: { toggle: { keys: "mod+alt+3" } },
  }),
  BlockquotePlugin.configure({
    inputRules: [BlockquoteRules.markdown()],
    node: { component: BlockquoteElement },
    shortcuts: { toggle: { keys: "mod+shift+period" } },
  }),
  CalloutPlugin.withComponent(CalloutElement),
  CodeBlockPlugin.configure({
    inputRules: [CodeBlockRules.markdown({ on: "match" })],
    node: { component: CodeBlockElement },
    shortcuts: { toggle: { keys: "mod+alt+8" } },
  }),
  CodeLinePlugin.withComponent(CodeLineElement),
  CodeSyntaxPlugin.withComponent(CodeSyntaxLeaf),
  TablePlugin.withComponent(TableElement),
  TableRowPlugin.withComponent(TableRowElement),
  TableCellPlugin.withComponent(TableCellElement),
  TableCellHeaderPlugin.withComponent(TableCellHeaderElement),
  HorizontalRulePlugin.configure({
    inputRules: [
      HorizontalRuleRules.markdown({ variant: "-" }),
      HorizontalRuleRules.markdown({ variant: "_" }),
    ],
    node: { component: HrElement },
  }),
  ImagePlugin.withComponent(ImageElement),
  LinkPlugin.configure({
    inputRules: [
      LinkRules.markdown(),
      LinkRules.autolink({ variant: "paste" }),
      LinkRules.autolink({ variant: "space" }),
      LinkRules.autolink({ variant: "break" }),
    ],
    render: {
      node: LinkElement,
    },
  }),
  ListPlugin.configure({
    inputRules: [
      BulletedListRules.markdown({ variant: "-" }),
      BulletedListRules.markdown({ variant: "*" }),
      OrderedListRules.markdown({ variant: "." }),
      OrderedListRules.markdown({ variant: ")" }),
      TaskListRules.markdown({ checked: false }),
      TaskListRules.markdown({ checked: true }),
    ],
    inject: {
      nodeProps: {
        nodeKey: KEYS.listType,
        query: (options: unknown) => {
          const element = (
            options as {
              nodeProps: { element?: { listStyleType?: unknown } };
            }
          ).nodeProps.element;
          const listStyleType = element?.listStyleType;

          return (
            !!listStyleType &&
            listStyleType !== KEYS.listTodo &&
            !isOrderedList(element as Parameters<typeof isOrderedList>[0])
          );
        },
        transformProps: (options: unknown) => {
          const { props } = options as {
            props: {
              style?: unknown;
              [key: string]: unknown;
            };
          };
          const style =
            typeof props.style === "object" && props.style !== null
              ? props.style
              : {};

          return {
            ...props,
            role: "listitem",
            style: {
              ...style,
              display: "list-item",
            },
          };
        },
      },
      targetPlugins: [KEYS.p, ...KEYS.heading, KEYS.blockquote, KEYS.codeBlock],
    },
    render: {
      belowNodes: BlockList,
    },
  }),
  BoldPlugin.configure({
    inputRules: [
      BoldRules.markdown({ variant: "*" }),
      BoldRules.markdown({ variant: "_" }),
      MarkComboRules.markdown({ variant: "boldItalic" }),
      MarkComboRules.markdown({ variant: "boldUnderline" }),
      MarkComboRules.markdown({ variant: "boldItalicUnderline" }),
      MarkComboRules.markdown({ variant: "italicUnderline" }),
    ],
  }),
  ItalicPlugin.configure({
    inputRules: [
      ItalicRules.markdown({ variant: "*" }),
      ItalicRules.markdown({ variant: "_" }),
    ],
  }),
  UnderlinePlugin.configure({
    inputRules: [UnderlineRules.markdown()],
  }),
  StrikethroughPlugin.configure({
    inputRules: [StrikethroughRules.markdown()],
  }),
  CodePlugin.configure({
    inputRules: [CodeRules.markdown()],
    node: { component: CodeLeaf },
    shortcuts: { toggle: { keys: "mod+e" } },
  }),
  HighlightPlugin.configure({
    inputRules: [HighlightRules.markdown({ variant: "==" })],
    node: { component: HighlightLeaf },
    shortcuts: { toggle: { keys: "mod+shift+h" } },
  }),
  SubscriptPlugin.configure({
    inputRules: [SubscriptRules.markdown()],
    node: { component: SubscriptLeaf },
  }),
  SuperscriptPlugin.configure({
    inputRules: [SuperscriptRules.markdown()],
    node: { component: SuperscriptLeaf },
  }),
  MarkdownPlugin.configure({
    options: {
      remarkPlugins: [remarkGfm],
    },
  }),
];

interface RichTextEditorProps {
  "aria-label"?: string;
  className?: string;
  /** Compact surfaces (e.g. sticky widgets) rely on slash commands only. */
  hideToolbar?: boolean;
  initialValue?: RichTextValue;
  onChange?: (value: RichTextValue) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  "aria-label": ariaLabel,
  className,
  hideToolbar = false,
  initialValue,
  onChange,
  placeholder = "Write a note...",
  readOnly = false,
}: RichTextEditorProps) {
  const [slashPosition, setSlashPosition] =
    useState<SlashCommandPosition | null>(null);
  const editor = usePlateEditor({
    plugins: editorPlugins,
    value: normalizeStaticValue(initialValue ?? emptyValue),
  });

  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex min-h-[520px] w-full flex-col overflow-hidden rounded-md border bg-background shadow-xs",
          className
        )}
      >
        <Plate
          editor={editor}
          onValueChange={({ value }) => onChange?.(value)}
          readOnly={readOnly}
        >
          {!hideToolbar && <RichTextToolbar readOnly={readOnly} />}
          <EditorContainer>
            <Editor
              aria-label={ariaLabel}
              onCloseSlashCommand={() => setSlashPosition(null)}
              onSlashCommand={() => setSlashPosition(getSlashCommandPosition())}
              placeholder={placeholder}
              slashOpen={slashPosition !== null}
            />
            {slashPosition ? (
              <SlashCommandMenu
                onClose={() => setSlashPosition(null)}
                position={slashPosition}
              />
            ) : null}
          </EditorContainer>
        </Plate>
      </div>
    </TooltipProvider>
  );
}

function RichTextToolbar({ readOnly }: { readOnly: boolean }) {
  const editor = useEditorRef();
  const blockType = useEditorSelector((editor) => {
    for (const type of [KEYS.h1, KEYS.h2, KEYS.h3, KEYS.blockquote]) {
      if (editor.api.some({ match: { type } })) {
        return type;
      }
    }

    return KEYS.p;
  }, []);

  const setBlockType = (type: string) => {
    clearList(editor);
    editor.tf.setNodes({ type });
    editor.tf.focus();
  };

  return (
    <div className="flex min-h-12 flex-wrap items-center gap-1 border-b bg-muted/30 px-2 py-1.5">
      <BlockInsertMenu disabled={readOnly} />

      <Select
        disabled={readOnly}
        onValueChange={setBlockType}
        value={blockType}
      >
        <SelectTrigger
          aria-label="Block type"
          className="w-34 bg-background"
          size="sm"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value={KEYS.p}>Paragraph</SelectItem>
          <SelectItem value={KEYS.h1}>Heading 1</SelectItem>
          <SelectItem value={KEYS.h2}>Heading 2</SelectItem>
          <SelectItem value={KEYS.h3}>Heading 3</SelectItem>
          <SelectItem value={KEYS.blockquote}>Quote</SelectItem>
        </SelectContent>
      </Select>

      <Separator className="mx-1 h-6" orientation="vertical" />

      <MarkToolbarButton
        disabled={readOnly}
        icon={BoldIcon}
        label="Bold"
        mark={KEYS.bold}
      />
      <MarkToolbarButton
        disabled={readOnly}
        icon={ItalicIcon}
        label="Italic"
        mark={KEYS.italic}
      />
      <MarkToolbarButton
        disabled={readOnly}
        icon={UnderlineIcon}
        label="Underline"
        mark={KEYS.underline}
      />
      <MarkToolbarButton
        disabled={readOnly}
        icon={StrikethroughIcon}
        label="Strikethrough"
        mark={KEYS.strikethrough}
      />
      <MarkToolbarButton
        disabled={readOnly}
        icon={Code2Icon}
        label="Inline code"
        mark={KEYS.code}
      />
      <MarkToolbarButton
        disabled={readOnly}
        icon={HighlighterIcon}
        label="Highlight"
        mark={KEYS.highlight}
      />
      <MarkToolbarButton
        disabled={readOnly}
        icon={SubscriptIcon}
        label="Subscript"
        mark={KEYS.sub}
      />
      <MarkToolbarButton
        disabled={readOnly}
        icon={SuperscriptIcon}
        label="Superscript"
        mark={KEYS.sup}
      />

      <Separator className="mx-1 h-6" orientation="vertical" />

      <ListToolbarButton
        disabled={readOnly}
        icon={ListIcon}
        label="Bulleted list"
        listStyleType={ListStyleType.Disc}
      />
      <ListToolbarButton
        disabled={readOnly}
        icon={ListOrderedIcon}
        label="Numbered list"
        listStyleType={ListStyleType.Decimal}
      />
      <TodoToolbarButton disabled={readOnly} />

      <Separator className="mx-1 h-6" orientation="vertical" />

      <BlockquoteToolbarButton disabled={readOnly} />
      <LinkToolbarButton disabled={readOnly} />
      <ImageToolbarButton disabled={readOnly} />
      <TableToolbarMenu disabled={readOnly} />
    </div>
  );
}

interface ToolbarButtonProps {
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onToggle: () => void;
  pressed: boolean;
}

function ToolbarButton({
  disabled,
  icon: Icon,
  label,
  onToggle,
  pressed,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          aria-pressed={pressed}
          className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
          data-state={pressed ? "on" : "off"}
          disabled={disabled}
          onMouseDown={(event: React.MouseEvent<HTMLButtonElement>) => {
            event.preventDefault();
            onToggle();
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface MarkToolbarButtonProps {
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  mark: string;
}

function MarkToolbarButton({
  disabled,
  icon,
  label,
  mark,
}: MarkToolbarButtonProps) {
  const editor = useEditorRef();
  const pressed = useEditorSelector(
    (editor) => Boolean(editor.api.marks()?.[mark]),
    [mark]
  );

  return (
    <ToolbarButton
      disabled={disabled}
      icon={icon}
      label={label}
      onToggle={() => {
        editor.tf.toggleMark(mark);
        editor.tf.focus();
      }}
      pressed={pressed}
    />
  );
}

interface ListToolbarButtonProps {
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  listStyleType: string;
}

function ListToolbarButton({
  disabled,
  icon,
  label,
  listStyleType,
}: ListToolbarButtonProps) {
  const editor = useEditorRef();
  const pressed = useEditorSelector(
    (editor) => someList(editor, listStyleType),
    [listStyleType]
  );

  return (
    <ToolbarButton
      disabled={disabled}
      icon={icon}
      label={label}
      onToggle={() => {
        toggleList(editor, { listStyleType });
        editor.tf.focus();
      }}
      pressed={pressed}
    />
  );
}

function TodoToolbarButton({ disabled }: { disabled?: boolean }) {
  const editor = useEditorRef();
  const pressed = useEditorSelector(
    (editor) =>
      editor.api.some({
        match: { [KEYS.listType]: KEYS.listTodo },
      }),
    []
  );

  return (
    <ToolbarButton
      disabled={disabled}
      icon={ListTodoIcon}
      label="To-do list"
      onToggle={() => {
        toggleList(editor, {
          listStyleType: KEYS.listTodo,
        });
        editor.tf.focus();
      }}
      pressed={pressed}
    />
  );
}

function BlockquoteToolbarButton({ disabled }: { disabled?: boolean }) {
  const editor = useEditorRef();
  const pressed = useEditorSelector(
    (editor) => editor.api.some({ match: { type: KEYS.blockquote } }),
    []
  );

  return (
    <ToolbarButton
      disabled={disabled}
      icon={QuoteIcon}
      label="Quote"
      onToggle={() => {
        clearList(editor);
        editor.tf.toggleBlock(KEYS.blockquote, { wrap: true });
        editor.tf.focus();
      }}
      pressed={pressed}
    />
  );
}

function LinkToolbarButton({ disabled }: { disabled?: boolean }) {
  const editor = useEditorRef();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const pressed = useEditorSelector(
    (editor) => editor.api.some({ match: { type: KEYS.link } }),
    []
  );

  const submit = () => {
    const normalizedUrl = normalizeUrl(url);

    if (!normalizedUrl) {
      return;
    }

    if (editor.api.isExpanded()) {
      wrapLink(editor, { target: "_blank", url: normalizedUrl });
    } else {
      insertLink(
        editor,
        {
          target: "_blank",
          text: normalizedUrl,
          url: normalizedUrl,
        },
        { select: true }
      );
    }

    setOpen(false);
    setUrl("");
    editor.tf.focus();
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              aria-label="Link"
              aria-pressed={pressed}
              className="data-[state=on]:bg-accent data-[state=on]:text-accent-foreground"
              data-state={pressed ? "on" : "off"}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <LinkIcon className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Link</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-72 gap-2 p-2">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            autoFocus={true}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com"
            value={url}
          />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function ImageToolbarButton({ disabled }: { disabled?: boolean }) {
  const editor = useEditorRef();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");

  const submit = () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      return;
    }

    insertImage(editor, trimmedUrl, { select: true });

    setOpen(false);
    setUrl("");
    editor.tf.focus();
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              aria-label="Image"
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <ImageIcon className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Image</TooltipContent>
      </Tooltip>
      <PopoverContent align="start" className="w-72 gap-2 p-2">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <Input
            autoFocus={true}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/image.png"
            value={url}
          />
          <Button type="submit" variant="secondary">
            Add
          </Button>
        </form>
      </PopoverContent>
    </Popover>
  );
}

function TableToolbarMenu({ disabled }: { disabled?: boolean }) {
  const tableSelected = useEditorSelector(
    (editor) => editor.api.some({ match: { type: KEYS.table } }),
    []
  );
  const { editor, tf } = useEditorPlugin(TablePlugin);

  const focusEditor = () => editor.tf.focus();

  return (
    <DropdownMenu modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Table"
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <TableIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Table</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() => {
              tf.insert.table(
                { colCount: 3, header: true, rowCount: 3 },
                { select: true }
              );
              focusEditor();
            }}
          >
            <Grid3X3Icon />
            Insert table
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!tableSelected}>
              <Rows3Icon />
              Row
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48">
              <DropdownMenuItem
                onSelect={() => {
                  tf.insert.tableRow({ before: true });
                  focusEditor();
                }}
              >
                <ArrowUpIcon />
                Insert row above
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  tf.insert.tableRow();
                  focusEditor();
                }}
              >
                <ArrowDownIcon />
                Insert row below
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  tf.remove.tableRow();
                  focusEditor();
                }}
                variant="destructive"
              >
                <XIcon />
                Delete row
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={!tableSelected}>
              <Columns3Icon />
              Column
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-52">
              <DropdownMenuItem
                onSelect={() => {
                  tf.insert.tableColumn({ before: true });
                  focusEditor();
                }}
              >
                <ArrowLeftIcon />
                Insert column left
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  tf.insert.tableColumn();
                  focusEditor();
                }}
              >
                <ArrowRightIcon />
                Insert column right
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  tf.remove.tableColumn();
                  focusEditor();
                }}
                variant="destructive"
              >
                <XIcon />
                Delete column
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={!tableSelected}
            onSelect={() => {
              tf.remove.table();
              focusEditor();
            }}
            variant="destructive"
          >
            <Trash2Icon />
            Delete table
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BlockInsertMenu({ disabled }: { disabled?: boolean }) {
  const editor = useEditorRef();

  const insert = (type: InsertBlockType) => {
    insertBlock(editor, type);
    editor.tf.focus();
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              aria-label="Insert block"
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <PlusIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Insert block</TooltipContent>
      </Tooltip>
      <DropdownMenuContent className="w-56">
        {insertBlockItems.map((item) => (
          <DropdownMenuItem key={item.type} onSelect={() => insert(item.type)}>
            <item.icon />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type InsertBlockType =
  | "callout"
  | "code"
  | "h1"
  | "h2"
  | "h3"
  | "hr"
  | "ol"
  | "paragraph"
  | "quote"
  | "table"
  | "todo"
  | "ul";

const insertBlockItems: {
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  type: InsertBlockType;
}[] = [
  {
    description: "Highlight an important note.",
    icon: MessageSquareQuoteIcon,
    label: "Callout",
    type: "callout",
  },
  {
    description: "Track a task with a checkbox.",
    icon: ListTodoIcon,
    label: "To-do list",
    type: "todo",
  },
  {
    description: "Create a simple unordered list.",
    icon: ListIcon,
    label: "Bulleted list",
    type: "ul",
  },
  {
    description: "Create an ordered sequence.",
    icon: ListOrderedIcon,
    label: "Numbered list",
    type: "ol",
  },
  {
    description: "Add formatted code.",
    icon: Code2Icon,
    label: "Code block",
    type: "code",
  },
  {
    description: "Insert rows and columns.",
    icon: TableIcon,
    label: "Table",
    type: "table",
  },
  {
    description: "Set text apart as a quote.",
    icon: QuoteIcon,
    label: "Quote",
    type: "quote",
  },
  {
    description: "Separate content with a divider.",
    icon: MinusIcon,
    label: "Divider",
    type: "hr",
  },
];

const SLASH_MENU_WIDTH = 328;
const SLASH_MENU_MAX_HEIGHT = 420;
const SLASH_MENU_VIEWPORT_MARGIN = 8;

interface SlashCommandPosition {
  left: number;
  top: number;
}

function getSlashCommandPosition(): SlashCommandPosition {
  const domSelection = window.getSelection();
  const range =
    domSelection && domSelection.rangeCount > 0
      ? domSelection.getRangeAt(0)
      : null;
  const rect = range?.getBoundingClientRect();

  const left = rect?.left ?? 0;
  const top = rect ? rect.bottom + 6 : 0;

  return {
    left: Math.min(
      Math.max(left, SLASH_MENU_VIEWPORT_MARGIN),
      window.innerWidth - SLASH_MENU_WIDTH - SLASH_MENU_VIEWPORT_MARGIN
    ),
    top:
      top + SLASH_MENU_MAX_HEIGHT > window.innerHeight
        ? Math.max(
            SLASH_MENU_VIEWPORT_MARGIN,
            (rect?.top ?? top) - SLASH_MENU_MAX_HEIGHT - 6
          )
        : top,
  };
}

function SlashCommandMenu({
  onClose,
  position,
}: {
  onClose: () => void;
  position: SlashCommandPosition;
}) {
  const editor = useEditorRef();

  return (
    <div
      className="fixed z-30 w-82 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-xl ring-1 ring-foreground/10"
      style={{ left: position.left, top: position.top }}
    >
      <div className="flex items-start justify-between gap-2 border-b px-3 py-2">
        <div>
          <div className="font-medium text-sm">Insert block</div>
          <div className="text-muted-foreground text-xs">
            Choose a Notion-style block for this line.
          </div>
        </div>
        <Button
          aria-label="Close"
          className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
          onMouseDown={(event) => {
            event.preventDefault();
            onClose();
          }}
          size="icon-sm"
          type="button"
          variant="ghost"
        >
          <XIcon className="size-3.5" />
        </Button>
      </div>
      <div className="max-h-80 overflow-y-auto p-1.5">
        {insertBlockItems.map((item) => (
          <button
            className="flex w-full items-start gap-3 rounded-sm px-2.5 py-2 text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
            key={item.type}
            onMouseDown={(event) => {
              event.preventDefault();
              insertBlock(editor, item.type);
              onClose();
              editor.tf.focus();
            }}
            type="button"
          >
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-sm border bg-background text-muted-foreground">
              <item.icon className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-sm">{item.label}</span>
              <span className="block text-muted-foreground text-xs">
                {item.description}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div className="border-t px-3 py-2 text-muted-foreground text-xs">
        Press Esc, click X, or pick a block to close.
      </div>
    </div>
  );
}

function insertBlock(
  editor: ReturnType<typeof useEditorRef>,
  type: InsertBlockType
) {
  if (type === "table") {
    editor
      .getTransforms(TablePlugin)
      .insert.table(
        { colCount: 3, header: true, rowCount: 3 },
        { select: true }
      );
    return;
  }

  if (type === "code") {
    insertCodeBlock(editor, { select: true });
    return;
  }

  if (type === "callout") {
    insertCallout(editor, { select: true });
    return;
  }

  if (type === "hr") {
    clearList(editor);
    editor.tf.setNodes({ type: KEYS.hr });
    editor.tf.insertNodes({ children: [{ text: "" }], type: KEYS.p });
    return;
  }

  if (type === "todo") {
    toggleList(editor, {
      listStyleType: KEYS.listTodo,
    });
    return;
  }

  if (type === "ul" || type === "ol") {
    toggleList(editor, {
      listStyleType: type === "ul" ? ListStyleType.Disc : ListStyleType.Decimal,
    });
    return;
  }

  clearList(editor);

  if (type === "quote") {
    editor.tf.toggleBlock(KEYS.blockquote, { wrap: true });
    return;
  }

  let nextType: string = KEYS.p;

  if (type === "h1") {
    nextType = KEYS.h1;
  } else if (type === "h2") {
    nextType = KEYS.h2;
  } else if (type === "h3") {
    nextType = KEYS.h3;
  }

  editor.tf.setNodes({ type: nextType });
}

function clearList(editor: ReturnType<typeof useEditorRef>) {
  editor.tf.unsetNodes([KEYS.listType, KEYS.listChecked, KEYS.indent]);
}

function normalizeUrl(url: string) {
  const value = url.trim();

  if (!value) {
    return "";
  }

  if (value.startsWith("/") || value.startsWith("#")) {
    return value;
  }

  return ABSOLUTE_URL_PATTERN.test(value) ? value : `https://${value}`;
}

const editorContainerVariants = cva(
  "relative min-h-0 flex-1 cursor-text select-text overflow-y-auto caret-primary selection:bg-primary/20 focus-visible:outline-none",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "h-full",
      },
    },
  }
);

function EditorContainer({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof editorContainerVariants>) {
  return (
    <PlateContainer
      className={cn(editorContainerVariants({ variant }), className)}
      {...props}
    />
  );
}

const editorVariants = cva(
  cn(
    "group/editor relative size-full min-h-[460px] w-full cursor-text select-text overflow-x-hidden whitespace-break-spaces break-words px-4 py-4 text-base",
    "rounded-none ring-offset-background focus-visible:outline-none",
    "placeholder:text-muted-foreground/80 **:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!",
    "[&_strong]:font-bold"
  ),
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "",
      },
    },
  }
);

interface EditorProps
  extends PlateContentProps,
    VariantProps<typeof editorVariants> {
  onCloseSlashCommand: () => void;
  onSlashCommand: () => void;
  slashOpen: boolean;
}

function Editor({
  className,
  onKeyDown,
  onCloseSlashCommand,
  onSlashCommand,
  slashOpen,
  variant,
  ...props
}: EditorProps) {
  const editor = useEditorRef();

  return (
    <PlateContent
      className={cn(editorVariants({ variant }), className)}
      disableDefaultStyles
      onKeyDown={(event: React.KeyboardEvent<HTMLDivElement>) => {
        if (event.key === "/" && isSlashCommandAvailable(editor)) {
          event.preventDefault();
          onSlashCommand();
          return;
        }

        if (event.key === "Escape" && slashOpen) {
          event.preventDefault();
          onCloseSlashCommand();
          return;
        }

        onKeyDown?.(event);
      }}
      {...props}
    />
  );
}

function isSlashCommandAvailable(editor: ReturnType<typeof useEditorRef>) {
  const block = editor.api.block();

  if (!block) {
    return false;
  }

  return editor.api.isEmpty(block[0]) && editor.api.isAt({ start: true });
}

function BlockHandle({ element }: { element: PlateElementProps["element"] }) {
  const editor = useEditorRef();
  const path = usePath();
  const readOnly = useReadOnly();

  if (readOnly || !path || path.length !== 1) {
    return null;
  }

  const blockIndex = path[0] ?? 0;
  const lastBlockIndex = editor.children.length - 1;
  const canMoveUp = PathApi.hasPrevious(path);
  const canMoveDown = blockIndex < lastBlockIndex;
  const isTable = element.type === KEYS.table;

  const moveBlock = (direction: "down" | "up") => {
    const entry = editor.api.node(path);
    const targetPath =
      direction === "up" ? PathApi.previous(path) : PathApi.next(path);

    if (!entry) {
      return;
    }

    editor.tf.withoutNormalizing(() => {
      editor.tf.removeNodes({ at: path });
      editor.tf.insertNodes(entry[0], { at: targetPath, select: true });
    });
    editor.tf.focus();
  };

  const deleteBlock = () => {
    editor.tf.removeNodes({ at: path });
    editor.tf.focus();
  };

  return (
    <div
      className="absolute top-1 -left-7 z-10 opacity-0 transition-opacity group-focus-within/block:opacity-100 group-hover/block:opacity-100"
      contentEditable={false}
    >
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label="Block actions"
            className="size-7 cursor-grab bg-background/95 text-muted-foreground shadow-xs hover:text-foreground"
            onMouseDown={(event) => event.preventDefault()}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <GripVerticalIcon className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48" side="left">
          <DropdownMenuLabel>Block</DropdownMenuLabel>
          <DropdownMenuItem
            disabled={!canMoveUp}
            onSelect={() => moveBlock("up")}
          >
            <ArrowUpIcon />
            Move up
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!canMoveDown}
            onSelect={() => moveBlock("down")}
          >
            <ArrowDownIcon />
            Move down
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={deleteBlock} variant="destructive">
            <Trash2Icon />
            {isTable ? "Delete table" : "Delete block"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ParagraphElement(props: PlateElementProps) {
  const listStyleType = props.element[KEYS.listType] as string | undefined;

  if (listStyleType === KEYS.listTodo) {
    return <TodoElement {...props} />;
  }

  return (
    <PlateElement {...props} className="group/block relative m-0 px-0 py-1">
      <BlockHandle element={props.element} />
      {props.children}
    </PlateElement>
  );
}

function OrderedBlockList(
  props: PlateElementProps & { lineBreakBadge?: React.ReactNode }
) {
  const { listStart, listStyleType } = props.element as TListElement;
  const normalizedStart = typeof listStart === "number" ? listStart : undefined;
  const normalizedListStyleType =
    typeof listStyleType === "string" ? listStyleType : undefined;

  return (
    <ol
      className="relative m-0 p-0 ps-6"
      start={normalizedStart}
      style={{ listStyleType: normalizedListStyleType }}
    >
      <li>
        {props.children}
        {props.lineBreakBadge}
      </li>
    </ol>
  );
}

function TodoElement(props: PlateElementProps) {
  const state = useTodoListElementState({ element: props.element });
  const { checkboxProps } = useTodoListElement(state);
  const readOnly = useReadOnly();

  return (
    <PlateElement
      {...props}
      className="group/block relative m-0 flex gap-2 px-0 py-1"
    >
      <BlockHandle element={props.element} />
      <span contentEditable={false}>
        <input
          checked={checkboxProps.checked}
          className="mt-1 size-4 rounded border border-input accent-primary"
          disabled={readOnly}
          onChange={(event) =>
            checkboxProps.onCheckedChange(event.target.checked)
          }
          onMouseDown={checkboxProps.onMouseDown}
          type="checkbox"
        />
      </span>
      <span
        className={cn(
          "min-w-0 flex-1",
          Boolean(props.element[KEYS.listChecked]) &&
            "text-muted-foreground line-through"
        )}
      >
        {props.children}
      </span>
    </PlateElement>
  );
}

const headingVariants = cva("relative mb-1", {
  variants: {
    variant: {
      h1: "mt-3 pb-1 font-bold text-3xl",
      h2: "mt-2 pb-px font-semibold text-2xl",
      h3: "mt-2 pb-px font-semibold text-xl",
    },
  },
});

function HeadingElement({
  variant = "h1",
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <PlateElement
      as={variant ?? "h1"}
      className={cn("group/block", headingVariants({ variant }))}
      {...props}
    >
      <BlockHandle element={props.element} />
      {props.children}
    </PlateElement>
  );
}

function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />;
}

function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

function BlockquoteElement(props: PlateElementProps) {
  return (
    <PlateElement
      as="blockquote"
      className="group/block relative my-2 border-primary/40 border-l-2 pl-4 text-muted-foreground"
      {...props}
    >
      <BlockHandle element={props.element} />
      {props.children}
    </PlateElement>
  );
}

function CalloutElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      className="group/block relative my-2 rounded-md border bg-muted/50 px-4 py-3"
    >
      <BlockHandle element={props.element} />
      <div className="flex gap-3">
        <span contentEditable={false}>
          <MessageSquareQuoteIcon
            aria-hidden={true}
            className="mt-1 size-4 shrink-0 text-muted-foreground"
          />
        </span>
        <div className="min-w-0 flex-1">{props.children}</div>
      </div>
    </PlateElement>
  );
}

function CodeBlockElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} className="group/block relative my-2">
      <BlockHandle element={props.element} />
      <pre className="overflow-x-auto rounded-md bg-muted p-4 font-mono text-sm">
        <code>{props.children}</code>
      </pre>
    </PlateElement>
  );
}

function CodeLineElement(props: PlateElementProps) {
  return <PlateElement {...props} as="div" className="min-h-5" />;
}

function CodeSyntaxLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props}>{props.children}</PlateLeaf>;
}

function LinkElement(props: PlateElementProps<TLinkElement>) {
  const linkAttributes = getLinkAttributes(props.editor, props.element);
  const linkRel =
    typeof linkAttributes.rel === "string" ? linkAttributes.rel : undefined;

  return (
    <PlateElement
      {...props}
      as="a"
      attributes={{
        ...props.attributes,
        ...linkAttributes,
        rel:
          linkAttributes.target === "_blank" ? "noopener noreferrer" : linkRel,
      }}
      className="font-medium text-primary underline underline-offset-4"
    >
      {props.children}
    </PlateElement>
  );
}

function TableElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} className="group/block relative my-3">
      <BlockHandle element={props.element} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-96 border-collapse border text-sm">
          <tbody>{props.children}</tbody>
        </table>
      </div>
    </PlateElement>
  );
}

function TableRowElement(props: PlateElementProps) {
  return <PlateElement {...props} as="tr" />;
}

function TableCellElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="td"
      className="min-w-24 border px-3 py-2 align-top"
    />
  );
}

function TableCellHeaderElement(props: PlateElementProps) {
  return (
    <PlateElement
      {...props}
      as="th"
      className="min-w-24 border bg-muted px-3 py-2 text-left align-top font-medium"
    />
  );
}

function CodeLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf
      {...props}
      as="code"
      className="rounded bg-muted px-1 py-0.5 font-mono text-sm"
    >
      {props.children}
    </PlateLeaf>
  );
}

function HighlightLeaf(props: PlateLeafProps) {
  return (
    <PlateLeaf {...props} as="mark" className="rounded bg-yellow-300/40 px-0.5">
      {props.children}
    </PlateLeaf>
  );
}

function SubscriptLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} as="sub" />;
}

function SuperscriptLeaf(props: PlateLeafProps) {
  return <PlateLeaf {...props} as="sup" />;
}

function HrElement(props: PlateElementProps) {
  return (
    <PlateElement {...props} className="group/block relative my-4">
      <BlockHandle element={props.element} />
      <hr className="border-border" contentEditable={false} />
    </PlateElement>
  );
}

interface TImageElement extends TElement {
  alt?: string;
  url: string;
}

function ImageElement(props: PlateElementProps<TImageElement>) {
  return (
    <PlateElement {...props} className="group/block relative my-2">
      <BlockHandle element={props.element} />
      {/* biome-ignore lint/performance/noImgElement: pasted image URLs are arbitrary remote hosts, incompatible with next/image's static domain allowlist */}
      {/* biome-ignore lint/correctness/useImageSize: source images have unknown intrinsic dimensions and are scaled responsively */}
      <img
        alt={props.element.alt ?? ""}
        className="max-h-[600px] w-full rounded-md object-contain"
        contentEditable={false}
        src={props.element.url}
      />
    </PlateElement>
  );
}
