interface CodeViewProps {
  code: string;
  language?: string;
}

export function CodeView({ code, language }: CodeViewProps) {
  return (
    <div className="artifact-code" data-language={language}>
      <pre className="artifact-code__pre">{code}</pre>
    </div>
  );
}
