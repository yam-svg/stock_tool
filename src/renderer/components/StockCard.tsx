import React from "react";
import { Trash2, MoreVertical, FolderInput } from "lucide-react";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  costPrice: number;
  quantity: number;
}

interface StockQuote {
  price?: number;
}

interface Group {
  id: string;
  name: string;
}

interface StockCardProps {
  darkMode: boolean;
  stock: Stock;
  quote?: StockQuote;
  groups: Group[];
  onDelete: (id: string) => void;
  onMove: (stockId: string, groupId: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  darkMode,
  stock,
  quote,
  groups,
  onDelete,
  onMove,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showMoveMenu, setShowMoveMenu] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
        setShowMoveMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenu]);

  const currentPrice = quote?.price || 0;
  const profit =
    currentPrice * stock.quantity - stock.costPrice * stock.quantity;
  const profitRate =
    stock.costPrice !== 0
      ? ((currentPrice - stock.costPrice) / stock.costPrice) * 100
      : 0;

  return (
    <div
      className={`rounded-lg p-4 shadow-sm relative ${
        darkMode
          ? "bg-gray-800/50 border border-gray-700/50"
          : "bg-white/50 border border-gray-200/50"
      } backdrop-blur-sm`}
    >
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-3 h-3 rounded-full ${
              currentPrice >= stock.costPrice ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <div>
            <h3 className="font-semibold">{stock.name}</h3>
            <p className="text-sm text-gray-500">{stock.symbol}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm text-gray-500">当前价</div>
            <div className="font-bold text-lg">
              ¥{currentPrice?.toFixed(2) || "-"}
            </div>
          </div>

          <div className="relative" ref={menuRef}>
            {/* 操作按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
                if (showMenu) setShowMoveMenu(false);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* 操作菜单 - 点击显示 */}
            {showMenu && (
              <div
                className={`absolute right-0 top-full mt-2 w-32 rounded-lg shadow-lg z-20 overflow-hidden border ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* 移动到分组 */}
                <div className="relative">
                  <button
                    onClick={() => setShowMoveMenu(!showMoveMenu)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <FolderInput className="w-3.5 h-3.5" />
                      <span>移动到</span>
                    </div>
                  </button>
                  {showMoveMenu && (
                    <div
                      className={`absolute left-full top-0 ml-1 w-40 rounded-lg shadow-lg z-20 overflow-hidden border ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {groups.map((group) => (
                        <button
                          key={group.id}
                          onClick={() => {
                            onMove(stock.id, group.id);
                            setShowMenu(false);
                            setShowMoveMenu(false);
                          }}
                          className={`w-full px-3 py-2 text-sm text-left ${
                            darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                        >
                          {group.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 删除 */}
                <button
                  onClick={() => {
                    if (confirm(`确定要删除${stock.name}吗？`)) {
                      onDelete(stock.id);
                      setShowMenu(false);
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 text-red-500 ${
                    darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 详细数据 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-500">买入价</div>
          <div className="font-medium">¥{stock.costPrice?.toFixed(2) || "-"}</div>
        </div>
        <div>
          <div className="text-gray-500">数量</div>
          <div className="font-medium">{stock.quantity}</div>
        </div>
        <div>
          <div className="text-gray-500">收益</div>
          <div
            className={`font-bold ${
              profit >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {profit ? "¥" + profit.toFixed(2) : "-"}
          </div>
        </div>
        <div>
          <div className="text-gray-500">收益率</div>
          <div
            className={`font-bold ${
              profitRate >= 0 ? "text-green-500" : "text-red-500"
            }`}
          >
            {profitRate ? profitRate.toFixed(2) + "%" : "-"}
          </div>
        </div>
      </div>
    </div>
  );
};
