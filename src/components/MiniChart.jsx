import { useEffect, useState } from "react";

export default function MiniChart({ coin, price }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (price) {
      setHistory((prev) => [...prev.slice(-19), price]); // เก็บ 20 จุดล่าสุด
    }
  }, [price]);

  return (
    <div className="bg-gray-800 p-3 rounded mb-4 w-64">
      <h3 className="text-sm text-gray-400 mb-2">กราฟ {coin} (เรียลไทม์)</h3>
      <svg viewBox="0 0 200 60" className="w-full h-16">
        {history.map((p, i) => {
          const x = (i / (history.length - 1 || 1)) * 200;
          const y =
            60 -
            ((p - Math.min(...history)) /
              (Math.max(...history) - Math.min(...history) || 1)) *
              60;
          return <circle key={i} cx={x} cy={y} r="2" fill="#4ade80" />;
        })}
      </svg>
    </div>
  );
}
