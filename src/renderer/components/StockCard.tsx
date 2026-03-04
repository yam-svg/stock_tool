import React from "react";
import { Stock, StockQuote, StockGroup } from "../../shared/types";
import { StockActionMenu } from "./StockActionMenu";

interface StockCardProps {
  darkMode: boolean;
  stock: Stock;
  quote?: StockQuote;
  groups: StockGroup[];
  onDelete: (id: string) => void;
  onEdit: (stock: Stock) => void;
  onMove: (stockId: string, groupId: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  darkMode,
  stock,
  quote,
  groups,
  onDelete,
  onEdit,
  onMove,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [flashColor, setFlashColor] = React.useState<"red" | "green" | null>(null);
  const prevPriceRef = React.useRef<number>(quote?.price || 0);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // 价格更新闪烁效果
  React.useEffect(() => {
    const currentPrice = quote?.price || 0;
    if (currentPrice !== prevPriceRef.current && prevPriceRef.current !== 0) {
      if (currentPrice > prevPriceRef.current) {
        setFlashColor("red");
      } else if (currentPrice < prevPriceRef.current) {
        setFlashColor("green");
      }

      const timer = setTimeout(() => {
        setFlashColor(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
    prevPriceRef.current = currentPrice;
  }, [quote?.price]);

  const currentPrice = quote?.price || 0;
  const profit =
    currentPrice * stock.quantity - stock.costPrice * stock.quantity;
  const profitRate =
    stock.costPrice !== 0
      ? ((currentPrice - stock.costPrice) / stock.costPrice) * 100
      : 0;

  return (
    <div
      className={`rounded-lg p-3 shadow-sm relative transition-colors duration-500 ${
        flashColor === "red"
          ? "bg-red-500/20"
          : flashColor === "green"
          ? "bg-green-500/20"
          : darkMode
          ? "bg-gray-800/50"
          : "bg-white/50"
      } border ${
        darkMode ? "border-gray-700/50" : "border-gray-200/50"
      } backdrop-blur-sm`}
    >
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              currentPrice >= stock.costPrice ? "text-red-500 bg-red-500" : "text-green-500 bg-green-500"
            }`}
          ></div>
          <div>
            <h3 className="font-semibold text-sm">{stock.name}</h3>
            <p className="text-xs text-gray-500">{stock.symbol}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-xs text-gray-500">当前价</div>
            <div className={`font-bold text-base text-blue-500`}>
              ¥{currentPrice || "-"}
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            {/* 操作菜单 */}
            <StockActionMenu
              darkMode={darkMode}
              stock={stock}
              groups={groups}
              isOpen={showMenu}
              onToggle={(e) => {
                e.stopPropagation?.();
                setShowMenu(!showMenu);
              }}
              onEdit={onEdit}
              onMove={onMove}
              onDelete={onDelete}
              menuPosition="absolute"
            />
          </div>
        </div>
      </div>

      {/* 详细数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div>
          <div className="text-gray-500">买入价</div>
          <div className="font-medium">¥{stock.costPrice || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">数量</div>
          <div className="font-medium">{stock.quantity}</div>
        </div>
        <div>
          <div className="text-gray-500">收益</div>
          <div
            className={`font-bold ${
              profit >= 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {profit ? "¥" + profit.toFixed(2) : "-"}
          </div>
        </div>
        <div>
          <div className="text-gray-500">收益率</div>
          <div
            className={`font-bold ${
              profitRate >= 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {profitRate ? profitRate.toFixed(2) + "%" : "-"}
          </div>
        </div>
        <div>
          <div className="text-gray-500">涨跌额</div>
          <div
            className={`font-bold ${
              (quote?.change || 0) >= 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {quote?.change ? "¥" + quote.change.toFixed(4) : "-"}
          </div>
        </div>
        <div>
          <div className="text-gray-500">涨跌幅</div>
          <div
            className={`font-bold ${
              (quote?.changePercent || 0) >= 0 ? "text-red-500" : "text-green-500"
            }`}
          >
            {quote?.changePercent ? quote.changePercent.toFixed(2) + "%" : "-"}
          </div>
        </div>
      </div>
    </div>
  );
};
