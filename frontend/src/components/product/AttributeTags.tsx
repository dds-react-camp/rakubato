import React from 'react';

interface AttributeTagsProps {
  attributes: string[];
}

const AttributeTags: React.FC<AttributeTagsProps> = ({ attributes }) => {
  const attributeNames: { [key: string]: string } = {
    performance: '高性能',
    lightweight: '軽量',
    camera: '高画質',
    battery: 'バッテリー',
    waterproof: '防水',
  };

  return (
    <div className="attribute-tags">
      {attributes.map((attr) => (
        <span key={attr} className={`attribute-tag ${attr}`}>
          {attributeNames[attr] || attr}
        </span>
      ))}
    </div>
  );
};

export default AttributeTags;
