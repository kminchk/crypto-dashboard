import { useEffect, useState } from "react";
import MiniChart from "./MiniChart";

export default function PriceTracker() {
  const [currentPrices, setCurrentPrices] = useState({});
  const [selectedCoin, setSelectedCoin] = useState("KUB");
  const [buyList, setBuyList] = useState(() => {
    const saved = localStorage.getItem("buyList");
    return saved ? JSON.parse(saved) : [];
  });
  const [targetProfit, setTargetProfit] = useState(10);

  // ดึงราคาปัจจุบัน (ทุก 2 วินาที + ราคากลาง)
  const fetchPrices = async () => {
    try {
      const res = await fetch("https://api.bitkub.com/api/market/ticker");
      const data = await res.json();
      const getPrice = (coin) => {
        const d = data[`THB_${coin}`];
        if (!d) return null;
        return d.bid && d.ask ? (d.bid + d.ask) / 2 : d.last;
      };
      setCurrentPrices({
        KUB: getPrice("KUB"),
        VELO: getPrice("VELO"),
        UNI: getPrice("UNI"),
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  };

  // เพิ่มราคาซื้อ
  const addBuyPrice = (price) => {
    if (!price) return;
    const newList = [...buyList, { coin: selectedCoin, price: parseFloat(price) }];
    setBuyList(newList);
    localStorage.setItem("buyList", JSON.stringify(newList));
  };

  // ลบรายการเดียว
  const removeItem = (index) => {
    const newList = buyList.filter((_, i) => i !== index);
    setBuyList(newList);
    localStorage.setItem("buyList", JSON.stringify(newList));
  };

  // คำนวณรวมพอร์ต
  const calcPortfolio = () => {
    let totalDiff = 0;
    let totalInvest = 0;
    buyList.forEach((item) => {
      const current = currentPrices[item.coin];
      if (current) {
        totalDiff += (current - item.price);
        totalInvest += item.price;
      }
    });
    const percent = totalInvest ? (totalDiff / totalInvest) * 100 : 0;
    return { totalDiff, percent };
  };

  const { totalDiff, percent } = calcPortfolio();

  // แจ้งเตือนเมื่อถึงเป้ากำไร
  useEffect(() => {
    if (percent >= targetProfit && buyList.length > 0) {
      alert(`พอร์ตกำไรเกิน ${targetProfit}% แล้ว!`);
      const audio = new Audio(
        "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
      );
      audio.play();
    }
  }, [percent, targetProfit, buyList]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 2000); // ดึงถี่ขึ้น
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold mb-6 drop-shadow-lg">
        Crypto Portfolio Tracker
      </h1>

      {/* เลือกเหรียญ + ราคาปัจจุบัน */}
      <div className="bg-gray-800 bg-opacity-80 shadow-xl rounded-2xl p-6 w-full max-w-lg text-center mb-6">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="text-lg">เลือกเหรียญ:</label>
            <select
              className="text-black p-2 rounded-lg font-semibold shadow"
              value={selectedCoin}
              onChange={(e) => setSelectedCoin(e.target.value)}
            >
              <option value="KUB">KUB</option>
              <option value="VELO">VELO</option>
              <option value="UNI">UNI</option>
            </select>
          </div>
          <p className="text-2xl">
            ราคาปัจจุบัน {selectedCoin}:{" "}
            {currentPrices[selectedCoin] ? (
              <span className="font-bold text-green-400 drop-shadow">
                {currentPrices[selectedCoin].toFixed(2)} ฿
              </span>
            ) : (
              "กำลังโหลด..."
            )}
          </p>
        </div>
        <MiniChart coin={selectedCoin} price={currentPrices[selectedCoin]} />
      </div>

      {/* เพิ่มราคาซื้อ */}
      <div className="bg-gray-800 bg-opacity-80 shadow-xl rounded-2xl p-6 w-full max-w-lg mb-6 flex flex-col items-center gap-4">
        <div className="flex gap-3 w-full justify-center">
          <input
            type="number"
            placeholder="ราคาที่ซื้อ (บาท)"
            className="p-3 rounded-lg text-black w-48 shadow-inner"
            onKeyDown={(e) => {
              if (e.key === "Enter") addBuyPrice(e.target.value);
            }}
          />
          <button
            onClick={() =>
              addBuyPrice(document.querySelector("input[type='number']").value)
            }
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl font-bold shadow hover:scale-105 transition"
          >
            + เพิ่ม
          </button>
        </div>

        {/* รายการซื้อ พร้อมปุ่มลบ */}
        <div className="w-full bg-gray-700 bg-opacity-60 p-4 rounded-xl">
          <h2 className="text-xl font-bold mb-2">รายการซื้อ</h2>
          {buyList.length === 0 && (
            <p className="text-gray-400 text-center">ยังไม่มีข้อมูล</p>
          )}
          {buyList.map((item, idx) => {
            const current = currentPrices[item.coin];
            const diffPercent = current
              ? ((current - item.price) / item.price) * 100
              : 0;
            return (
              <div
                key={idx}
                className="flex justify-between items-center py-2 border-b border-gray-600"
              >
                <span>
                  {item.coin} - {item.price} ฿
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className={
                      diffPercent >= 0
                        ? "text-green-400 font-semibold"
                        : "text-red-400 font-semibold"
                    }
                  >
                    {diffPercent.toFixed(2)}%
                  </span>
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-red-400 hover:text-red-600 font-bold"
                  >
                    ❌
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* รวมพอร์ต */}
      {buyList.length > 0 && (
        <div className="bg-gray-800 bg-opacity-80 shadow-xl rounded-2xl p-6 w-full max-w-lg text-center mb-6">
          <h2 className="text-2xl font-bold">
            รวมพอร์ต:{" "}
            <span
              className={percent >= 0 ? "text-green-400" : "text-red-400"}
            >
              {percent.toFixed(2)}% ({totalDiff.toFixed(2)} ฿)
            </span>
          </h2>
        </div>
      )}

      {/* ตั้งเป้ากำไร */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <div className="flex items-center gap-3 bg-gray-800 bg-opacity-70 p-4 rounded-xl">
          <label className="font-semibold">ตั้งเป้ากำไร (%):</label>
          <input
            type="number"
            className="text-black p-2 rounded-lg w-24"
            value={targetProfit}
            onChange={(e) => setTargetProfit(Number(e.target.value))}
          />
        </div>
      </div>

      {/* Note การเทรด */}
      <div className="bg-gray-800 bg-opacity-70 p-6 rounded-2xl max-w-lg text-sm text-gray-300 shadow">
        <h2 className="text-xl font-bold text-white mb-3">📝 Note การเทรด</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong className="text-yellow-300">KUB:</strong> 20:00–00:00 น. – เหมาะสำหรับเก็บ 5–10%.
          </li>
          <li>
            <strong className="text-yellow-300">VELO:</strong> 18:00–01:00 น. – ผันผวนสูง (ตั้ง Stop‑Loss).
          </li>
          <li>
            <strong className="text-yellow-300">UNI:</strong> 20:00–00:00 น. – เทรดปลอดภัยกว่า VELO.
          </li>
        </ul>
      </div>
    </div>
  );
}
