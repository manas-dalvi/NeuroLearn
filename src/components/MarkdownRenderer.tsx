import React from "react";
import ReactMarkdown from "react-markdown";

const keywords = [
  "Hierarchical Temporal Memory", "HTM", "neocortex", "SDRs", 
  "Sparse Distributed Representations", "neurons", "predictions", "learning", "brain",
  "patterns", "predictive", "sparsity"
];

const highlightKeywords = (text: string) => {
  if (!text || typeof text !== "string") return text;
  
  const pattern = keywords.map(kw => kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
  const regex = new RegExp(`\\b(${pattern})\\b`, "gi");
  
  const parts = text.split(regex);
  if (parts.length === 1) return text;
  
  return parts.map((part, index) => {
    const isKeyword = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
    if (isKeyword) {
      return (
        <span key={index} className="important-word-highlight">
          {part}
        </span>
      );
    }
    return part;
  });
};

const highlightChildren = (node: any): any => {
  if (typeof node === "string") {
    return highlightKeywords(node);
  }
  if (Array.isArray(node)) {
    return node.map((child, i) => (
      <React.Fragment key={i}>{highlightChildren(child)}</React.Fragment>
    ));
  }
  if (node && node.props && node.props.children) {
    return React.cloneElement(node, {
      ...node.props,
      children: highlightChildren(node.props.children)
    });
  }
  return node;
};

interface Props {
  content: string;
  className?: string;
  enableHighlighting?: boolean;
}

export default function MarkdownRenderer({ content, className = "", enableHighlighting = true }: Props) {
  const components = {
    ul: ({ children, ...props }: any) => <ul className="list-disc pl-5 my-2 space-y-1 text-left" {...props}>{children}</ul>,
    ol: ({ children, ...props }: any) => <ol className="list-decimal pl-5 my-2 space-y-1 text-left" {...props}>{children}</ol>,
    li: ({ children, ...props }: any) => <li className="mb-1 text-left" {...props}>{enableHighlighting ? highlightChildren(children) : children}</li>,
    h1: ({ children, ...props }: any) => <h1 className="text-lg font-black mt-4 mb-2 text-left" {...props}>{enableHighlighting ? highlightChildren(children) : children}</h1>,
    h2: ({ children, ...props }: any) => <h2 className="text-base font-bold mt-3 mb-1.5 text-left" {...props}>{enableHighlighting ? highlightChildren(children) : children}</h2>,
    h3: ({ children, ...props }: any) => <h3 className="text-sm font-bold mt-2 mb-1 text-left" {...props}>{enableHighlighting ? highlightChildren(children) : children}</h3>,
    h4: ({ children, ...props }: any) => <h4 className="text-xs font-bold mt-2 mb-1 text-left" {...props}>{enableHighlighting ? highlightChildren(children) : children}</h4>,
    p: ({ children, ...props }: any) => <p className="mb-2 leading-relaxed text-left" {...props}>{enableHighlighting ? highlightChildren(children) : children}</p>,
    strong: ({ children, ...props }: any) => <strong className="font-bold" {...props}>{enableHighlighting ? highlightChildren(children) : children}</strong>,
    em: ({ children, ...props }: any) => <em className="italic" {...props}>{enableHighlighting ? highlightChildren(children) : children}</em>,
  };

  return (
    <div className={`text-left ${className}`}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
