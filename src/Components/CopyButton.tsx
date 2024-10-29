import React, { useState } from 'react';

type CopyButtonProps = {
  textToCopy: string;
};

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
    });
  };

  return (
    <button onClick={copyToClipboard} aria-label="Copy to clipboard" className="flex items-center">
      <img
        src={copied ? "./images/check.svg" : "./images/content_copy.svg"}
        alt={copied ? "Copied" : "Copy"}
        className="w-6 h-6 cursor-pointer transition-transform duration-200"
      />
    </button>
  );
};

export default CopyButton;
