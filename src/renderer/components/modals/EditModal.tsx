import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Input, Button } from '../../ui';

interface EditModalProps {
  darkMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  initialData: {
    name: string;
    price: number;
    quantity: number;
  };
  onSubmit: (data: { name: string; price: number; quantity: number }) => void;
  isSubmitting?: boolean;
}

export const EditModal: React.FC<EditModalProps> = ({
  darkMode,
  isOpen,
  onClose,
  title,
  initialData,
  onSubmit,
  isSubmitting,
}) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = '名称不能为空';
    if (formData.price < 0) newErrors.price = '价格不能为负数';
    if (formData.quantity < 0) newErrors.quantity = '数量不能为负数';

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className={`relative w-full max-w-md rounded-xl shadow-2xl overflow-hidden border ${
        darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'
      }`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <Input
            label="名称"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            darkMode={darkMode}
            error={errors.name}
          />
          <Input
            label="买入价格 / 单位成本"
            type="number"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            darkMode={darkMode}
            error={errors.price}
          />
          <Input
            label="持仓数量 / 份额"
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
            darkMode={darkMode}
            error={errors.quantity}
          />
        </div>

        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-end space-x-3`}>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            取消
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit} 
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            保存修改
          </Button>
        </div>
      </div>
    </div>
  );
};
