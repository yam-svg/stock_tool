import React from "react";
import { Trash2, Edit2, FolderInput, MoreVertical } from "lucide-react";
import { Stock, StockQuote, StockGroup } from "../../shared/types";

interface StockListProps {
  darkMode: boolean;
  stocks: Stock[];
  quotes: Record<string, StockQuote>;
  groups: StockGroup[];
  onDelete: (id: string) => void;
  onEdit: (stock: Stock) => void;
  onMove: (stockId: string, groupId: string) => void;
}

export const StockList: React.FC<StockListProps> = ({
  darkMode,
  stocks,
  quotes,
  groups,
  onDelete,
  onEdit,
  onMove,
}) => {
  const [showMenuId, setShowMenuId] = React.useState<string | null>(null);
  const [showMoveMenuId, setShowMoveMenuId] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenuId(null);
        setShowMoveMenuId(null);
      }
    };

    if (showMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMenuId]);

  return (
    <div
      className={`rounded-lg overflow-hidden border ${
        darkMode ? "border-gray-700/50 bg-gray-800/50" : "border-gray-200/50 bg-white/50"
      } backdrop-blur-sm`}
    >
      {/* 表头 */}
      <div
        className={`grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold ${
          darkMode ? "bg-gray-700/50" : "bg-gray-100/50"
        }`}
      >
        <div className="col-span-2">股票代码</div>
        <div className="col-span-2">股票名称</div>
        <div className="col-span-1 text-right">持仓数量</div>
        <div className="col-span-1 text-right">成本价</div>
        <div className="col-span-1 text-right">当前价</div>
        <div className="col-span-2 text-right">市值</div>
        <div className="col-span-2 text-right">收益</div>
        <div className="col-span-1 text-center">操作</div>
      </div>

      {/* 表格内容 */}
      <div className="divide-y divide-gray-200/50 dark:divide-gray-700/50">
        {stocks.map((stock) => {
          const quote = quotes[stock.symbol];
          const currentPrice = quote?.price || 0;
          const cost = stock.costPrice * stock.quantity;
          const marketValue = currentPrice * stock.quantity;
          const profit = marketValue - cost;
          const profitRate = stock.costPrice !== 0
            ? ((currentPrice - stock.costPrice) / stock.costPrice) * 100
            : 0;

          return (
            <div
              key={stock.id}
              className={`grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:${
                darkMode ? "bg-gray-700/30" : "bg-gray-50/50"
              } transition-colors`}
            >
              <div className="col-span-2 flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    currentPrice >= stock.costPrice ? "bg-red-500" : "bg-green-500"
                  }`}
                ></div>
                <span className="text-gray-500">{stock.symbol}</span>
              </div>
              <div className="col-span-2 font-medium">{stock.name}</div>
              <div className="col-span-1 text-right">{stock.quantity}</div>
              <div className="col-span-1 text-right">¥{stock.costPrice.toFixed(2)}</div>
              <div className={`col-span-1 text-right font-bold ${
                (quote?.change || 0) >= 0 ? "text-red-500" : "text-green-500"
              }`}>
                ¥{currentPrice ? currentPrice.toFixed(2) : "-"}
              </div>
              <div className="col-span-2 text-right">
                <div className="font-medium">¥{marketValue.toFixed(2)}</div>
              </div>
              <div className="col-span-2 text-right">
                <div className={`font-bold ${profit >= 0 ? "text-red-500" : "text-green-500"}`}>
                  ¥{profit.toFixed(2)}
                </div>
                <div
                  className={`text-xs ${
                    profitRate >= 0 ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {profitRate >= 0 ? "+" : ""}
                  {profitRate.toFixed(2)}%
                </div>
              </div>
              <div className="col-span-1 flex justify-center items-center">
                <div className="relative" ref={showMenuId === stock.id ? menuRef : null}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenuId(showMenuId === stock.id ? null : stock.id);
                      if (showMenuId !== stock.id) setShowMoveMenuId(null);
                    }}
                    className={`p-1.5 rounded-lg transition-colors ${
                      darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                    }`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showMenuId === stock.id && (
                    <div
                      className={`absolute right-0 top-full mt-2 w-32 rounded-lg shadow-lg z-20 overflow-hidden border ${
                        darkMode
                          ? "bg-gray-800 border-gray-700"
                          : "bg-white border-gray-200"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          onEdit(stock);
                          setShowMenuId(null);
                        }}
                        className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 ${
                          darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>编辑</span>
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShowMoveMenuId(showMoveMenuId === stock.id ? null : stock.id)}
                          className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between ${
                            darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <FolderInput className="w-3.5 h-3.5" />
                            <span>移动到</span>
                          </div>
                        </button>
                        {showMoveMenuId === stock.id && (
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
                                  setShowMenuId(null);
                                  setShowMoveMenuId(null);
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

                      <button
                        onClick={() => {
                          if (confirm(`确定要删除${stock.name}吗？`)) {
                            onDelete(stock.id);
                            setShowMenuId(null);
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
          );
        })}
      </div>
    </div>
  );
};

