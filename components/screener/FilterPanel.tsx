"use client";

import { useState } from "react";
import { Card, CardHeader, CardContent, Button } from "@/components/ui";
import { ScreeningCriteria } from "@/types/stock";
import { Filter, RotateCcw } from "lucide-react";

interface FilterPanelProps {
  criteria: ScreeningCriteria;
  onChange: (criteria: ScreeningCriteria) => void;
}

export function FilterPanel({ criteria, onChange }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const handleReset = () => {
    onChange({});
  };

  const updateCriteria = (key: keyof ScreeningCriteria, value: number | undefined) => {
    onChange({
      ...criteria,
      [key]: value,
    });
  };

  return (
    <Card>
      <CardHeader
        title="スクリーニング条件"
        subtitle="バフェット基準でフィルタリング"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              リセット
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        }
      />
      {isOpen && (
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 最小ROE */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                最小ROE (%)
              </label>
              <input
                type="number"
                value={criteria.minROE ?? ""}
                onChange={(e) =>
                  updateCriteria(
                    "minROE",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="15"
                className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-primary focus:border-gold focus:outline-none"
              />
            </div>

            {/* 最大PER */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                最大PER
              </label>
              <input
                type="number"
                value={criteria.maxPE ?? ""}
                onChange={(e) =>
                  updateCriteria(
                    "maxPE",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="30"
                className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-primary focus:border-gold focus:outline-none"
              />
            </div>

            {/* 最小堀スコア */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                最小堀スコア
              </label>
              <input
                type="number"
                value={criteria.minMoatScore ?? ""}
                onChange={(e) =>
                  updateCriteria(
                    "minMoatScore",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="70"
                className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-primary focus:border-gold focus:outline-none"
              />
            </div>

            {/* 最小安全マージン */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">
                最小安全マージン (%)
              </label>
              <input
                type="number"
                value={criteria.minSafetyMargin ?? ""}
                onChange={(e) =>
                  updateCriteria(
                    "minSafetyMargin",
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                placeholder="0"
                className="w-full px-3 py-2 bg-surface-light border border-surface-light rounded-lg text-text-primary focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          {/* プリセット */}
          <div className="mt-4 pt-4 border-t border-surface-light">
            <p className="text-sm text-text-secondary mb-2">プリセット</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    minROE: 15,
                    minMoatScore: 70,
                    minSafetyMargin: 0,
                  })
                }
              >
                バフェット基準
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    minROE: 20,
                    maxPE: 25,
                    minMoatScore: 80,
                  })
                }
              >
                厳選銘柄
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    maxPE: 15,
                    minSafetyMargin: 20,
                  })
                }
              >
                割安株
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  onChange({
                    minROE: 25,
                    minMoatScore: 85,
                  })
                }
              >
                10倍株候補
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
