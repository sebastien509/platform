
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STATUS_MESSAGES = [
  'Understanding your venture',
  'Connecting the right systems',
  'Preparing your workspace',
  'Getting things ready',
];

const IV_WORDMARK =
  'https://res.cloudinary.com/dvcmopd4q/image/upload/e_trim/v1789515611/Branding_IV_text_Color_Blue_vovyzb.png';

const POSITIONS = [
  'c1 r1',
  'c2 r1',
  'c3 r1',
  'c4 r1',
  'c5 r1',
  'c6 r1',
  'c7 r2',
  'c8 r2',
  'c9 r2',
  'c10 r2',
  'c11 r2',
  'c12 r2',
  'c13 r2',
  'c14 r2',
  'c15 r2',
  'c16 r2',
  'c17 r2',
  'c18 r2',
  'c19 r3',
  'c20 r3',
  'c21 r3',
  'c22 r3',
  'c23 r3',
  'c24 r3',
  'c25 r3',
  'c26 r3',
  'c28 r3',
  'c29 r3',
  'c30 r3',
  'c31 r3',
  'c32 r3',
  'c33 r3',
  'c34 r3',
  'c35 r3',
  'c36 r3',
  'c37 r3',
];

interface IVLoadingScreenProps {
  message?: string;
}

export function IVLoadingScreen({
  message,
}: IVLoadingScreenProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(
        (i) => (i + 1) % STATUS_MESSAGES.length
      );
    }, 2200);

    return () => clearInterval(interval);
  }, []);

  const displayMessage =
    message ?? STATUS_MESSAGES[msgIndex];

  return (
    <motion.div
      className="iv-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="Loading platform"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Warm ambient background */}
      <div
        className="iv-loading-screen__ambient"
        aria-hidden="true"
      >
        <div className="iv-loading-screen__orb iv-loading-screen__orb--one" />
        <div className="iv-loading-screen__orb iv-loading-screen__orb--two" />
        <div className="iv-loading-screen__grid" />
      </div>

      <div className="iv-loading-screen__content">
        {/* Official IV wordmark */}
        <div className="iv-loading-screen__brand">
          <img
            src={IV_WORDMARK}
            alt="IV by InthraOS"
            className="iv-loading-screen__wordmark-img"
          />
        </div>

        {/* Existing hex-brick network */}
        <div
          className="iv-hex-net"
          aria-hidden="true"
        >
          <div className="iv-hex-node iv-hex-node--center">
            <HexBricks />
          </div>

          {POSITIONS.map((classes, i) => (
            <div
              key={i}
              className={`iv-hex-node ${classes
                .split(' ')
                .map((c) => `iv-hex-node--${c}`)
                .join(' ')}`}
            >
              <HexBricks />
            </div>
          ))}
        </div>

        {/* Rotating status */}
        <div className="iv-loading-screen__status">
          <div
            key={displayMessage}
            className="iv-loading-screen__status-message"
          >
            {displayMessage}
          </div>

          <div className="iv-loading-screen__status-description">
            Building the space for what's next.
          </div>

          <div className="iv-loading-screen__status-meta">
            <span className="iv-loading-screen__status-dot" />
            IV Platform
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HexBricks() {
  return (
    <>
      <div className="iv-hex-brick" />
      <div className="iv-hex-brick iv-hex-brick--b" />
      <div className="iv-hex-brick iv-hex-brick--c" />
    </>
  );
}
