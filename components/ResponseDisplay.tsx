import React from 'react';
import { Spinner } from './Spinner';
import { GroundingChunk } from '@google/genai';

interface ResponseDisplayProps {
  response: string;
  isLoading: boolean;
  sources?: GroundingChunk[];
}

// A simple markdown-to-html renderer
const SimpleMarkdownRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    const listItems: React.ReactNode[] = [];
    let inList = false;

    const renderLine = (line: string, index: number) => {
        if (line.startsWith('# ')) {
            return <h1 key={index} className="text-2xl font-bold mt-4 mb-2">{line.substring(2)}</h1>;
        }
        if (line.startsWith('## ')) {
            return <h2 key={index} className="text-xl font-bold mt-3 mb-2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-lg font-bold mt-2 mb-1">{line.substring(4)}</h3>;
        }
        if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            const content = line.trim().substring(2);
            // Handle bold text **text**
            const parts = content.split('**');
            const renderedContent = parts.map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            );
            return <li key={index} className="ml-6 list-disc">{renderedContent}</li>;
        }
        if (line.trim() === '') {
            return <br key={index} />;
        }
        // Handle bold text **text**
        const parts = line.split('**');
        const renderedLine = parts.map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
        );

        return <p key={index} className="my-1">{renderedLine}</p>;
    };

    return (
        <div>
            {lines.map((line, index) => renderLine(line, index))}
        </div>
    );
};


export const ResponseDisplay: React.FC<ResponseDisplayProps> = ({ response, isLoading, sources }) => {
  const webSources = sources?.filter(s => s.web);

  return (
    <div className="w-full h-full min-h-[300px] flex flex-col bg-gray-900/70 rounded-lg prose prose-invert prose-p:text-gray-300 prose-headings:text-white prose-strong:text-white">
      <div className="flex-grow overflow-y-auto p-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full">
            <Spinner />
            <p className="mt-4 text-gray-400">Your stylist is thinking...</p>
          </div>
        )}
        {!isLoading && !response && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500">Your fashion advice will appear here.</p>
             <p className="text-sm text-gray-600">Upload an image and ask a question to get started.</p>
          </div>
        )}
        {!isLoading && response && (
          <SimpleMarkdownRenderer content={response} />
        )}
      </div>
      {!isLoading && webSources && webSources.length > 0 && (
        <div className="mt-4 p-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-gray-400 mb-2">Sources</h4>
            <ul className="space-y-1 text-left">
                {webSources.map((source, index) => (
                    <li key={index} className="text-xs list-none p-0 m-0">
                        <a 
                            href={source.web.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-purple-400 hover:text-purple-300 hover:underline truncate block"
                            title={source.web.title || source.web.uri}
                        >
                           {index + 1}. {source.web.title || source.web.uri}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
};
