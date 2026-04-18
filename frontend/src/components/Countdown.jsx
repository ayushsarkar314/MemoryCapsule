import { useState, useEffect } from 'react';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

const Countdown = ({ targetDate, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState({});

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const totalSecs = differenceInSeconds(target, now);

      if (totalSecs <= 0) {
        setTimeLeft({ done: true });
        if (onComplete) onComplete();
        return;
      }

      const days = Math.floor(totalSecs / 86400);
      const hours = Math.floor((totalSecs % 86400) / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      setTimeLeft({ days, hours, minutes, seconds });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [targetDate, onComplete]);

  if (timeLeft.done) return (
    <div style={{ textAlign: 'center', color: 'var(--color-sage)', fontWeight: 600 }}>
      🔓 Unlocked!
    </div>
  );

  const units = [
    { label: 'days',    value: timeLeft.days },
    { label: 'hours',   value: timeLeft.hours },
    { label: 'minutes', value: timeLeft.minutes },
    { label: 'seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="countdown-display" style={{ justifyContent: 'center' }}>
      {units.map(({ label, value }, i) => (
        <>
          <div key={label} className="countdown-unit">
            <span className="countdown-number">{String(value).padStart(2, '0')}</span>
            <span className="countdown-label">{label}</span>
          </div>
          {i < 3 && <span className="countdown-sep">:</span>}
        </>
      ))}
    </div>
  );
};

export default Countdown;
