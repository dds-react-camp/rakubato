import React from 'react';
import './TutorialBubble.scss';

interface TutorialBubbleProps {
  currentStep: number;
  onNext: () => void;
}

const tutorialSteps = [
  {
    text: '横にスクロールすることで商品の比較ができます。',
    style: { top: '35%', left: '40%', transform: 'translate(-50%, -50%)', width: '225px' },
  },
  {
    text: 'マッチアップ表示・コレクション表示の切り替えができます。',
    style: { top: '6%', right: '5%', width: '300px' },
  },
  {
    text: '『バトルを開始』ボタンを押すことで、商品同士のバトル動画が見られます。（別ウィンドウが開きます）',
    style: { top: '47%', left: '50%', transform: 'translate(-50%, 100px)', width: '300px' },
  },
  {
    text: '気になる商品はハートボタンでお気に入りに追加できます。',
    style: { top: '15%', right: '15%', width: '250px' },
  },
];

const TutorialBubble: React.FC<TutorialBubbleProps> = ({
  currentStep,
  onNext,
}) => {
  if (currentStep === 0 || currentStep > tutorialSteps.length) {
    return null;
  }

  const { text, style } = tutorialSteps[currentStep - 1];
  const isLastStep = currentStep === tutorialSteps.length;

  return (
    <div className="tutorial-bubble-wrapper" style={style}>
      <div className="tutorial-bubble">
        <p>{text}</p>
        <button onClick={onNext} className="tutorial-bubble-button">
          {isLastStep ? '閉じる' : '次へ'}
        </button>
      </div>
    </div>
  );
};

export default TutorialBubble;
