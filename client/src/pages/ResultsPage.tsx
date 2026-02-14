import { useParams } from "wouter";
import { useAssessment } from "@/hooks/use-assessments";
import { Navbar } from "@/components/Navbar";
import { Loader2, Download, Printer, Briefcase, BookOpen, Share2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from "recharts";
import { api } from "@shared/routes";
import { useLanguage } from "@/components/LanguageProvider";
import html2pdf from "html2pdf.js";
import { useRef } from "react";

// Define RIASEC Data Structure for Chart
interface RiasecScore {
  subject: string;
  A: number;
  fullMark: number;
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>();
  const assessmentId = parseInt(id!);
  const { t } = useLanguage();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const { data: assessment, isLoading } = useAssessment(assessmentId);

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;

    const element = contentRef.current;
    const opt = {
      margin: 10,
      filename: `assessment-results-${assessmentId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const RIASEC_LABELS: Record<string, string> = {
    R: 'Realistic',
    I: 'Investigative',
    A: 'Artistic',
    S: 'Social',
    E: 'Enterprising',
    C: 'Conventional'
  };

  const RIASEC_DESCRIPTIONS: Record<string, string> = {
    R: 'Practical, physical, hands-on, tool-oriented',
    I: 'Analytical, intellectual, scientific, explorative',
    A: 'Creative, original, independent, chaotic',
    S: 'Cooperative, supporting, helping, healing',
    E: 'Competitive, environments, leadership, persuading',
    C: 'Detail-oriented, organizing, clerical'
  };

  if (isLoading || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Parse scores for Recharts
  const scores = assessment.scores as Record<string, number> || {};
  const chartData: RiasecScore[] = Object.keys(RIASEC_LABELS).map(key => ({
    subject: RIASEC_LABELS[key],
    code: key,
    A: scores[key] || 0,
    fullMark: 16, // Max score per category is 16 (4 questions * 4 weight)
  }));

  // Find top 3 RIASEC codes
  const riasecKeys = ['R', 'I', 'A', 'S', 'E', 'C'];
  const topCodes = Object.entries(scores)
    .filter(([code]) => riasecKeys.includes(code))
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([code]) => code);

  return (
    <div className="min-h-screen bg-background print:bg-white">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl print:max-w-none">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 print:hidden">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">{t('assessmentResults')}</h1>
            <p className="text-muted-foreground">{t('resultDescription1')}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button shadow="lg" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8" ref={contentRef}>
          {/* Main Chart Section */}
          <div className="lg:col-span-2 space-y-8">
            <Card className="shadow-lg border-0 overflow-hidden bg-card">
              <CardHeader className="bg-slate-900 dark:bg-slate-950 text-white pb-8">
                <CardTitle className="text-white">{t('personalityProfile')}</CardTitle>
                <CardDescription className="text-slate-300">
                  {t('resultDescription2')}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-8 flex justify-center bg-white dark:bg-slate-900 min-h-[400px]">
                 <ResponsiveContainer width="100%" height={400}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 16]} tick={false} axisLine={false} />
                      <Radar
                        name="Score"
                        dataKey="A"
                        stroke="hsl(221, 83%, 53%)"
                        strokeWidth={3}
                        fill="hsl(221, 83%, 53%)"
                        fillOpacity={0.2}
                      />
                      <Tooltip />
                    </RadarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {topCodes.map((code, index) => (
                <Card key={code} className={`border-l-4 ${index === 0 ? 'border-l-primary' : index === 1 ? 'border-l-secondary' : 'border-l-orange-400'} bg-card`}>
                  <CardHeader className="pb-2">
                    <Badge variant="secondary" className="w-fit mb-2">
                      #{index + 1} {t('dominantTrait')}
                    </Badge>
                    <CardTitle className="text-lg">{RIASEC_LABELS[code]}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {RIASEC_DESCRIPTIONS[code]}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Side Panel - Recommendations */}
          <div className="space-y-6">
             <Card className="bg-card shadow-md">
               <CardHeader>
                 <div className="flex items-center gap-2 text-primary mb-2">
                   <Briefcase className="w-5 h-5" />
                   <span className="font-bold text-sm uppercase tracking-wider">{t('recommendedCareers')}</span>
                 </div>
                 <CardTitle className="text-xl">{t('recommendedCareers')}</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Mock Data - replace with real recommendations */}
                 {["Software Engineer", "Data Analyst", "Systems Architect"].map((career) => (
                   <div key={career} className="p-3 bg-background rounded-lg border shadow-sm flex justify-between items-center group cursor-pointer hover:border-primary transition-colors">
                     <span className="font-medium text-foreground">{career}</span>
                     <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                   </div>
                 ))}
               </CardContent>
             </Card>

             <Card className="bg-card shadow-md">
               <CardHeader>
                 <div className="flex items-center gap-2 text-green-600 mb-2">
                   <BookOpen className="w-5 h-5" />
                   <span className="font-bold text-sm uppercase tracking-wider">{t('suggestedCourses')}</span>
                 </div>
                 <CardTitle className="text-xl">{t('suggestedCourses')}</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Mock Data */}
                 {["B.Sc. Computer Science", "B.Tech Information Technology", "Data Science Certification"].map((course) => (
                   <div key={course} className="p-3 bg-background rounded-lg border shadow-sm flex justify-between items-center">
                     <span className="font-medium text-foreground">{course}</span>
                   </div>
                 ))}
               </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
