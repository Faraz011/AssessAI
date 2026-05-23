"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingDown, DollarSign, Users, Zap } from "lucide-react";
import { getApiUrl } from "@/lib/api-config";

interface CostProjection {
  scenario: {
    currentUsers: number;
    targetUsers: number;
    teacherFraction: string;
    assessmentsPerTeacherPerWeek: number;
    expectedCacheHitRate: string;
  };
  currentScale: {
    monthlyAssessments: number;
    monthlyCost: string;
    monthlyCostNumeric: number;
  };
  targetScale: {
    monthlyAssessments: number;
    cachedAssessments: number;
    nonCachedAssessments: number;
    oldSystemMonthlyCost: string;
    oldSystemMonthlyCostNumeric: number;
    newSystemMonthlyCost: string;
    newSystemMonthlyCostNumeric: number;
  };
  savings: {
    monthlySavings: string;
    monthlySavingsNumeric: number;
    savingsPercent: number;
    annualSavings: string;
    annualSavingsNumeric: number;
  };
}

export default function StatsPage() {
  const [data, setData] = useState<CostProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${getApiUrl()}/api/assessment/cost-projection`,
        );
        if (!response.ok) throw new Error("Failed to fetch cost projection");
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Cost Projections
            </h1>
            <p className="text-gray-600">
              Scaling analysis with caching optimization
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back Home
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            <p className="text-gray-600 mt-4">Loading cost projections...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700 font-medium">
              Error loading data: {error}
            </p>
          </div>
        )}

        {/* Main Content */}
        {data && !loading && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              {/* Current Monthly Cost */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-medium">
                    Current Monthly Cost
                  </h3>
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {data.currentScale.monthlyCost}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {data.currentScale.monthlyAssessments.toLocaleString()}{" "}
                  assessments
                </p>
              </div>

              {/* Potential Monthly Savings */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-medium">Monthly Savings</h3>
                  <TrendingDown className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {data.savings.monthlySavings}
                </p>
                <p className="text-sm text-green-600 mt-2 font-semibold">
                  {data.savings.savingsPercent.toFixed(1)}% reduction
                </p>
              </div>

              {/* Annual Savings */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-medium">Annual Savings</h3>
                  <Zap className="w-5 h-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {data.savings.annualSavings}
                </p>
                <p className="text-sm text-gray-500 mt-2">12 months</p>
              </div>

              {/* Cache Hit Rate */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-600 font-medium">Cache Hit Rate</h3>
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {data.scenario.expectedCacheHitRate}
                </p>
                <p className="text-sm text-gray-500 mt-2">EdTech repetition</p>
              </div>
            </div>

            {/* Scenario Details */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Scenario Parameters
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Users</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.scenario.currentUsers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Target Users</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.scenario.targetUsers.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Teacher Fraction</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.scenario.teacherFraction}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Assessments/Teacher/Week
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.scenario.assessmentsPerTeacherPerWeek}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Cache Hit Rate</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {data.scenario.expectedCacheHitRate}
                  </p>
                </div>
              </div>
            </div>

            {/* Detailed Breakdown Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        Current Scale (1K Users)
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        Target Scale (5K Users) - Old System
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                        Target Scale (5K Users) - New System
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        Monthly Assessments
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {data.currentScale.monthlyAssessments.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {data.targetScale.monthlyAssessments.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {data.targetScale.monthlyAssessments.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        Cached Assessments (35%)
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        —
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        —
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-purple-600">
                        {data.targetScale.cachedAssessments.toLocaleString()}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50 transition bg-blue-50">
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        Monthly Cost
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-blue-900">
                        {data.currentScale.monthlyCost}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-blue-900">
                        {data.targetScale.oldSystemMonthlyCost}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-green-700">
                        {data.targetScale.newSystemMonthlyCost}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Savings Summary */}
            <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Savings Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    At Target Scale (5K Users)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Old System (GPT-4):</span>
                      <span className="font-semibold text-gray-900">
                        {data.targetScale.oldSystemMonthlyCost}/month
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">
                        New System (Haiku + Cache):
                      </span>
                      <span className="font-semibold text-gray-900">
                        {data.targetScale.newSystemMonthlyCost}/month
                      </span>
                    </div>
                    <div className="h-px bg-gray-300 my-3"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        Monthly Savings:
                      </span>
                      <span className="text-2xl font-bold text-green-700">
                        {data.savings.monthlySavings}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Annual Impact
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Annual Savings:</span>
                      <span className="font-semibold text-gray-900">
                        {data.savings.annualSavings}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Cost Reduction:</span>
                      <span className="font-semibold text-green-700 text-lg">
                        {data.savings.savingsPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-px bg-gray-300 my-3"></div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <p className="text-sm text-green-900">
                        🚀 <strong>Result:</strong> Scaling to 5K users costs{" "}
                        <strong>
                          {data.savings.savingsPercent.toFixed(0)}% less
                        </strong>{" "}
                        than current system
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technical Details */}
            <div className="mt-8 bg-gray-50 rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                How the Savings Work
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">→</span>
                  <span>
                    <strong>Model Switch:</strong> GPT-4 (₹12/assessment) →
                    Claude Haiku (₹3.5/assessment)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">→</span>
                  <span>
                    <strong>Caching:</strong> 35% of requests served from cache
                    (EdTech topics repeat frequently)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">→</span>
                  <span>
                    <strong>Effective Cost:</strong> Only 65% of assessments
                    charged at Haiku rate
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-purple-600 font-bold">→</span>
                  <span>
                    <strong>Result:</strong>{" "}
                    {data.savings.savingsPercent.toFixed(1)}% cost reduction at
                    scale while improving latency and user experience
                  </span>
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
