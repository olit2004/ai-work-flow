import React, { useState, useRef } from "react";
import { Download, Copy, Check, FileText, Loader2, Sparkles, BarChart, ShieldAlert } from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";

export default function ResultViewer({ finalResult, workflow, topic }) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const contentRef = useRef(null);

  const handleCopy = () => {
    if (!finalResult) return;
    navigator.clipboard.writeText(finalResult).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadPDF = async () => {
    console.log("PDF generation triggered. finalResult length:", finalResult?.length, "topic:", topic);
    if (!finalResult || downloading) {
      console.warn("PDF download skipped. finalResult exists:", !!finalResult, "downloading status:", downloading);
      return;
    }
    setDownloading(true);

    try {
      const element = contentRef.current;
      console.log("Target DOM element for PDF generation:", element);
      if (!element) {
        throw new Error("Content element reference contentRef.current is null");
      }

      console.log("Rendering element using html2canvas-pro...");
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true
      });

      console.log("Canvas generated successfully. Canvas dimensions:", canvas.width, "x", canvas.height);
      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      console.log("Creating jsPDF instance...");
      const pdf = new jsPDF("p", "in", "letter");
      const pageWidth = 8.5;
      const pageHeight = 11;
      const margin = 0.75;
      
      const contentWidth = pageWidth - (margin * 2); // 7.0 inches
      const contentHeight = pageHeight - (margin * 2); // 9.5 inches
      
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      console.log("Adding first page to PDF. Image height in PDF inches:", imgHeight);
      pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);
      heightLeft -= contentHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        console.log("Adding extra page to PDF. Shift offset position:", position);
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", margin, margin + position, imgWidth, imgHeight);
        heightLeft -= contentHeight;
      }
      
      const filename = `quantflow-report-${topic ? topic.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "output"}.pdf`;
      console.log("Saving PDF as file:", filename);
      pdf.save(filename);
      console.log("PDF download successful");
    } catch (error) {
      console.error("PDF generation failed with error detail:", error);
      alert(`Failed to generate PDF. Error: ${error.message}`);
    } finally {
      setDownloading(false);
    }
  };

  // Custom Markdown to React Parser
  const parseMarkdownToReact = (text) => {
    console.log("parseMarkdownToReact called with text length:", text ? text.length : 0);
    if (!text) return null;
    
    const lines = text.split("\n");
    console.log("parseMarkdownToReact split lines:", lines);
    const elements = [];
    let currentList = [];
    let inCodeBlock = false;
    let codeLines = [];
    let codeLanguage = "";
    
    const inlineParse = (txt) => {
      console.log("inlineParse input:", JSON.stringify(txt));
      const parts = [];
      let remaining = txt;
      
      while (remaining) {
        const boldIdx = remaining.indexOf("**");
        const codeIdx = remaining.indexOf("`");
        let italicIdx = -1;
        
        let i = 0;
        while (i < remaining.length) {
          if (remaining[i] === "*" && remaining[i+1] !== "*" && (i === 0 || remaining[i-1] !== "*")) {
            italicIdx = i;
            break;
          }
          i++;
        }
        
        const indices = [
          { type: "bold", index: boldIdx },
          { type: "italic", index: italicIdx },
          { type: "code", index: codeIdx }
        ].filter(item => item.index !== -1);
        
        if (indices.length === 0) {
          parts.push(remaining);
          break;
        }
        
        indices.sort((a, b) => a.index - b.index);
        const nextToken = indices[0];
        
        if (nextToken.index > 0) {
          parts.push(remaining.substring(0, nextToken.index));
        }
        
        remaining = remaining.substring(nextToken.index);
        
        if (nextToken.type === "bold") {
          const closeIdx = remaining.indexOf("**", 2);
          if (closeIdx !== -1) {
            parts.push(
              <strong key={parts.length} className="font-bold text-slate-900">
                {remaining.substring(2, closeIdx)}
              </strong>
            );
            remaining = remaining.substring(closeIdx + 2);
          } else {
            parts.push(remaining);
            break;
          }
        } else if (nextToken.type === "italic") {
          const closeIdx = remaining.indexOf("*", 1);
          if (closeIdx !== -1) {
            parts.push(
              <em key={parts.length} className="italic text-slate-800">
                {remaining.substring(1, closeIdx)}
              </em>
            );
            remaining = remaining.substring(closeIdx + 1);
          } else {
            parts.push(remaining);
            break;
          }
        } else if (nextToken.type === "code") {
          const closeIdx = remaining.indexOf("`", 1);
          if (closeIdx !== -1) {
            parts.push(
              <code key={parts.length} className="px-1.5 py-0.5 rounded bg-orange-50 border border-orange-100 font-mono text-xs text-orange-600 font-semibold">
                {remaining.substring(1, closeIdx)}
              </code>
            );
            remaining = remaining.substring(closeIdx + 1);
          } else {
            parts.push(remaining);
            break;
          }
        }
      }
      
      console.log("inlineParse returning:", parts.length > 0 ? parts : txt);
      return parts.length > 0 ? parts : txt;
    };

    const flushList = (key) => {
      if (currentList.length > 0) {
        console.log("flushing list:", currentList);
        elements.push(
          <ul key={`ul-${key}`} className="list-disc pl-6 my-4 space-y-2 text-slate-700">
            {currentList.map((item, idx) => (
              <li key={idx} className="marker:text-orange-500 pl-1 leading-relaxed">
                {inlineParse(item)}
              </li>
            ))}
          </ul>
        );
        currentList = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code blocks
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          const codeText = codeLines.join("\n");
          elements.push(
            <div key={`code-${i}`} className="relative my-6 group">
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button 
                  onClick={() => navigator.clipboard.writeText(codeText)}
                  className="px-2 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:text-white transition-all shadow-md cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </button>
              </div>
              {codeLanguage && (
                <span className="absolute top-3 left-4 text-xs font-mono text-slate-500 font-semibold uppercase tracking-wider">
                  {codeLanguage}
                </span>
              )}
              <pre className="overflow-x-auto p-5 pt-10 rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-sm leading-relaxed shadow-inner">
                <code>{codeText}</code>
              </pre>
            </div>
          );
          codeLines = [];
          inCodeBlock = false;
        } else {
          flushList(i);
          inCodeBlock = true;
          codeLanguage = trimmed.substring(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeLines.push(line);
        continue;
      }

      // Headers
      if (trimmed.startsWith("# ")) {
        flushList(i);
        elements.push(
          <h1 key={`h1-${i}`} className="text-3xl font-extrabold tracking-tight text-slate-900 mt-8 mb-4 border-b border-slate-100 pb-3 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
            {inlineParse(trimmed.substring(2))}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        flushList(i);
        elements.push(
          <h2 key={`h2-${i}`} className="text-2xl font-bold tracking-tight text-slate-800 mt-7 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-6 rounded bg-gradient-to-b from-orange-500 to-amber-500 inline-block"></span>
            {inlineParse(trimmed.substring(3))}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        flushList(i);
        elements.push(
          <h3 key={`h3-${i}`} className="text-xl font-semibold text-slate-800 mt-6 mb-2">
            {inlineParse(trimmed.substring(4))}
          </h3>
        );
      } else if (trimmed.startsWith("#### ")) {
        flushList(i);
        elements.push(
          <h4 key={`h4-${i}`} className="text-lg font-semibold text-slate-700 mt-5 mb-2">
            {inlineParse(trimmed.substring(5))}
          </h4>
        );
      }
      // Lists
      else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        currentList.push(trimmed.substring(2));
      }
      // Blockquotes
      else if (trimmed.startsWith("> ")) {
        flushList(i);
        elements.push(
          <blockquote key={`quote-${i}`} className="pl-4 py-1.5 border-l-4 border-orange-400 text-slate-600 italic my-5 bg-orange-50/40 rounded-r-xl">
            {inlineParse(trimmed.substring(2))}
          </blockquote>
        );
      }
      // Empty line
      else if (trimmed === "") {
        flushList(i);
      }
      // Normal paragraph
      else {
        flushList(i);
        elements.push(
          <p key={`p-${i}`} className="my-3.5 text-slate-700 leading-relaxed text-[15px]">
            {inlineParse(line)}
          </p>
        );
      }
    }

    flushList(lines.length);
    console.log("parseMarkdownToReact final generated elements array:", elements);
    return elements;
  };

  return (
    <div className="mt-12 bg-white/95 backdrop-blur-md border border-orange-100 rounded-3xl p-8 shadow-md relative overflow-hidden transition-all duration-300 hover:shadow-lg">
      
      {/* Glow highlight */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Actions Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-50 border border-orange-100 rounded-xl">
            <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Pipeline Output Document
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified by algebraic quantale metrics
            </p>
          </div>
        </div>

        {finalResult && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-800 transition-all cursor-pointer"
              title="Copy markdown text"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy raw</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-sm font-semibold shadow-md shadow-orange-500/10 hover:shadow-orange-500/20 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Exporting PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {finalResult ? (
        /* Document Capture Wrapper */
        <div 
          ref={contentRef} 
          className="bg-white text-slate-900"
        >
          {/* Cover / Document Header (Rendered inside PDF & display) */}
          <div className="mb-8 p-6 bg-slate-50/50 border border-slate-100 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-widest">
                <FileText className="w-3.5 h-3.5" />
                <span>Generated Research Brief</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mt-1">
                {topic ? `Topic: ${topic}` : "AI Content Pipeline Output"}
              </h3>
            </div>
            
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
              {workflow && (
                <div className="flex items-center gap-1.5">
                  <BarChart className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Workflow: <strong className="text-slate-700">{workflow.name}</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Date: <strong className="text-slate-700">{new Date().toLocaleDateString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Formatted Markdown Content */}
          <div className="prose max-w-none text-slate-800 px-2 leading-relaxed">
            {parseMarkdownToReact(finalResult)}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-slate-400 text-sm">
            Execute a workflow to see the generated result here...
          </p>
        </div>
      )}
    </div>
  );
}
