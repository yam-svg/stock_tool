import React from "react";
import { Trash2, Edit2, FolderInput, MoreVertical } from "lucide-react";
import { Stock, StockGroup } from "../../shared/types";
import { MoveModal } from "./MoveModal";
interface StockActionMenuProps {
  darkMode: boolean;
  stock: Stock;
  groups: StockGroup[];
  isOpen: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onEdit: (stock: Stock) => void;
  onMove: (stockId: string, groupId: string) => void;
  onDelete: (id: string) => void;
  menuPosition?: "absolute" | "fixed";
  buttonClassName?: string;
}
export const StockActionMenu: React.FC<StockActionMenuProps> = ({
  darkMode,
  stock,
  groups,
  isOpen,
  onToggle,
  onEdit,
  onMove,
  onDelete,
  menuPosition = "absolute",
  buttonClassName,
}) => {
  const [showMoveModal, setShowMoveModal] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  // 点击外部关闭菜单
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        if (isOpen) {
          onToggle(event as any);
        }
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle]);
  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* 操作按钮 */}
        <button
          onClick={onToggle}
          className={
            buttonClassName ||
            `p-1.5 rounded-lg transition-colors ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`
          }
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {/* 操作菜单 */}
        {isOpen && (
          <div
            className={`${menuPosition} w-40 rounded-lg shadow-lg z-50 overflow-hidden border ${
              darkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } ${
              menuPosition === "absolute"
                ? "right-0 top-full mt-2"
                : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 编辑 */}
            <button
              onClick={() => {
                onEdit(stock);
                onToggle({} as any);
              }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>编辑</span>
            </button>
            {/* 移动到分组 */}
            <button
              onClick={() => {
                setShowMoveModal(true);
                onToggle({} as any);
              }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center space-x-2 ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <FolderInput className="w-3.5 h-3.5" />
              <span>移动到</span>
            </button>
            {/* 删除 */}
            <button
              onClick={() => {
                if (confirm(`确定要删除${stock.name}吗？`)) {
                  onDelete(stock.id);
                  onToggle({} as any);
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
      {/* 移动分组模态框 */}
      <MoveModal
        darkMode={darkMode}
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onMove={(groupId) => {
          onMove(stock.id, groupId);
          setShowMoveModal(false);
        }}
        groups={groups}
        currentGroupId={stock.groupId}
        title={`移动 ${stock.name}`}
      />
    </>
  );
};
