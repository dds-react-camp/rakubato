import React, { useEffect, useRef } from 'react';
import './DescriptionBubble.scss';

interface DescriptionBubbleProps {
  name: string;
  description: string[];
}

const DescriptionBubble: React.FC<DescriptionBubbleProps> = ({ name, description }) => {
  const lastParagraphRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (lastParagraphRef.current) {
      // 最新の段落が表示されるようにスクロール
      lastParagraphRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [description]);

  return (
    <div className="description-bubble">
      <p>{name}</p>
      <div className="description-content">
        {description.map((paragraph, index) => (
          <p 
            key={index}
            // 最後の段落にのみrefを割り当てる
            ref={index === description.length - 1 ? lastParagraphRef : null}
          >
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
};

export default DescriptionBubble;