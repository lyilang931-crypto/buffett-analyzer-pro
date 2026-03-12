"use client";

import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ScoreBadge,
  Badge,
} from "@/components/ui";
import { BuffettAnalysis } from "@/types/stock";
import { TrendingUp, ChevronRight } from "lucide-react";
import { formatPercent } from "@/lib/utils";

interface StockTableProps {
  stocks: BuffettAnalysis[];
}

export function StockTable({ stocks }: StockTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow hover={false}>
          <TableHead>順位</TableHead>
          <TableHead>銘柄</TableHead>
          <TableHead align="center">総合スコア</TableHead>
          <TableHead align="center">堀スコア</TableHead>
          <TableHead align="center">ROE (5Y)</TableHead>
          <TableHead align="center">PER</TableHead>
          <TableHead align="center">安全マージン</TableHead>
          <TableHead align="center">10倍ポテンシャル</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {stocks.map((stock, index) => (
          <TableRow key={stock.symbol}>
            <TableCell>
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gold/10">
                <span className="text-gold font-bold text-sm">{index + 1}</span>
              </div>
            </TableCell>
            <TableCell>
              <Link
                href={`/stock/${stock.symbol}`}
                className="group flex items-center gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary group-hover:text-gold transition-colors">
                      {stock.symbol}
                    </span>
                    {stock.tenBaggerPotential.score >= 70 && (
                      <Badge variant="gold">
                        <TrendingUp className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-text-secondary">{stock.name}</p>
                </div>
              </Link>
            </TableCell>
            <TableCell align="center">
              <ScoreBadge score={stock.overallScore} />
            </TableCell>
            <TableCell align="center">
              <span className="mono-number text-gold">{stock.moatScore}</span>
            </TableCell>
            <TableCell align="center">
              <span
                className={`mono-number ${
                  stock.roeAnalysis.fiveYearAvgROE >= 15
                    ? "text-success"
                    : "text-text-primary"
                }`}
              >
                {stock.roeAnalysis.fiveYearAvgROE.toFixed(1)}%
              </span>
            </TableCell>
            <TableCell align="center">
              <span
                className={`mono-number ${
                  stock.valuation.isUndervalued ? "text-success" : "text-text-primary"
                }`}
              >
                {stock.valuation.currentPE.toFixed(1)}
              </span>
            </TableCell>
            <TableCell align="center">
              <span
                className={`mono-number ${
                  stock.safetyMargin.marginPercent >= 0
                    ? "text-success"
                    : "text-danger"
                }`}
              >
                {formatPercent(stock.safetyMargin.marginPercent)}
              </span>
            </TableCell>
            <TableCell align="center">
              <div className="flex items-center justify-center gap-2">
                <div className="w-20 h-2 bg-surface-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full"
                    style={{ width: `${stock.tenBaggerPotential.score}%` }}
                  />
                </div>
                <span className="mono-number text-sm text-text-secondary">
                  {stock.tenBaggerPotential.score}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <Link
                href={`/stock/${stock.symbol}`}
                className="p-2 rounded-lg hover:bg-surface-light transition-colors inline-flex"
              >
                <ChevronRight className="h-5 w-5 text-text-secondary" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
