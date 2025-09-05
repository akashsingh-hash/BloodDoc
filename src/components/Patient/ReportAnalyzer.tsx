import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Zap, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ReportAnalysis } from '../../types';
import { patientService } from '../../services/patientService';

const ReportAnalyzer: React.FC = () => {
  const [reportText, setReportText] = useState('');
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!reportText.trim()) return;

    setLoading(true);
    setAnalysis(null); // Clear previous analysis
    try {
      const result = await patientService.analyzeReport(reportText);
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing report:', error);
      setAnalysis({
        patientName: 'Error',
        summary: 'Failed to analyze report. Please try again.',
        importantTopics: ['Error'],
        recommendations: ['Check your internet connection and ensure the report format is correct.'],
        urgency: 'critical',
        bloodTestResults: undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-500';
      case 'urgent': return 'text-orange-500';
      case 'moderate': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-[#838F6F]';
    }
  };

  return (
    <div className="bg-[#1a1a1a]/60 backdrop-blur-md border border-[#710014]/30 rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-[#F2F1ED] flex items-center">
          <FileText className="h-6 w-6 text-[#838F6F] mr-2" />
          AI Medical Report Analyzer
        </h3>
        <div className="flex items-center text-[#838F6F] text-sm">
          <Zap className="h-4 w-4 mr-1" />
          <span>Powered by Gemini AI</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#F2F1ED] mb-2">
              Medical Report Text
            </label>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 bg-[#161616]/50 border border-[#838F6F]/30 rounded-xl text-[#F2F1ED] placeholder-[#838F6F] focus:outline-none focus:border-[#710014] focus:ring-2 focus:ring-[#710014]/20 resize-none"
              placeholder="Paste your medical report here for AI analysis..."
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={loading || !reportText.trim()}
            className="w-full bg-gradient-to-r from-[#710014] to-[#838F6F] hover:from-[#8a0018] hover:to-[#94a082] text-[#F2F1ED] py-3 px-4 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#F2F1ED] mr-2"></div>
                Analyzing Report...
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 mr-2" />
                Analyze Report
              </>
            )}
          </motion.button>
        </div>

        {/* Analysis Results */}
        <div>
          {analysis ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Patient Name & Urgency */}
              <div className="bg-[#161616]/40 border border-[#710014]/20 rounded-xl p-4 flex items-center justify-between">
                <h4 className="text-lg font-medium text-[#F2F1ED]">
                  Patient: <span className="text-[#838F6F]">{analysis.patientName || 'Unknown'}</span>
                </h4>
                <span className={`text-sm font-semibold ${getUrgencyColor(analysis.urgency)}`}>
                  {analysis.urgency.toUpperCase()}
                </span>
              </div>

              {analysis.bloodTestResults && (
                <div className="bg-[#161616]/40 border border-[#838F6F]/20 rounded-xl p-4">
                  <h4 className="text-lg font-medium text-[#F2F1ED] mb-3">Blood Test Results</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {analysis.bloodTestResults.bloodType && (
                      <div className="text-[#838F6F]">
                        Blood Type: <span className="text-[#F2F1ED] font-medium">{analysis.bloodTestResults.bloodType}</span>
                      </div>
                    )}
                    {analysis.bloodTestResults.hemoglobin && (
                      <div className="text-[#838F6F]">
                        Hemoglobin: <span className="text-[#F2F1ED] font-medium">{analysis.bloodTestResults.hemoglobin} g/dL</span>
                      </div>
                    )}
                    {analysis.bloodTestResults.whiteBloodCells && (
                      <div className="text-[#838F6F]">
                        WBC: <span className="text-[#F2F1ED] font-medium">{analysis.bloodTestResults.whiteBloodCells}</span>
                      </div>
                    )}
                    {analysis.bloodTestResults.platelets && (
                      <div className="text-[#838F6F]">
                        Platelets: <span className="text-[#F2F1ED] font-medium">{analysis.bloodTestResults.platelets}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-[#161616]/40 border border-[#838F6F]/20 rounded-xl p-4">
                <h4 className="text-lg font-medium text-[#F2F1ED] mb-3">Summary</h4>
                <div className="prose prose-invert prose-sm max-w-none text-[#F2F1ED] leading-relaxed">
                  <ReactMarkdown>
                    {analysis.summary}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Important Topics */}
              {analysis.importantTopics && analysis.importantTopics.length > 0 && (
                <div className="bg-[#161616]/40 border border-[#838F6F]/20 rounded-xl p-4">
                  <h4 className="text-lg font-medium text-[#F2F1ED] mb-3">Important Topics</h4>
                  <ul className="space-y-2">
                    {analysis.importantTopics.map((topic, index) => (
                      <li key={index} className="flex items-start text-[#F2F1ED]">
                        <CheckCircle className="h-4 w-4 mr-2 text-[#838F6F] mt-0.5 flex-shrink-0" />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div className="bg-[#161616]/40 border border-green-500/20 rounded-xl p-4">
                  <h4 className="text-lg font-medium text-[#F2F1ED] mb-3">Recommendations</h4>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start text-[#F2F1ED]">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-[#838F6F] mx-auto mb-4" />
              <p className="text-[#838F6F] text-lg">Paste your medical report above</p>
              <p className="text-[#838F6F]/60 text-sm">AI will analyze and provide insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportAnalyzer;
