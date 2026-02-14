import { useState } from "react";
import { useQuestions, useUpdateQuestion } from "@/hooks/use-questions";
import { Navbar } from "@/components/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Loader2, Users, FileQuestion, Briefcase, Search, Filter, Brain, Heart, Lightbulb } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Question } from "@shared/schema";
import { useLanguage } from "@/components/LanguageProvider";

const sectionConfig: Record<string, { label: string; icon: typeof Brain; color: string; bgColor: string }> = {
  INTEREST: { label: "Interest", icon: Heart, color: "text-pink-600", bgColor: "bg-pink-100" },
  APTITUDE: { label: "Aptitude", icon: Brain, color: "text-blue-600", bgColor: "bg-blue-100" },
  PERSONALITY: { label: "Personality", icon: Lightbulb, color: "text-amber-600", bgColor: "bg-amber-100" },
};

export default function AdminPage() {
  const { data: questions, isLoading } = useQuestions();
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { t } = useLanguage();

  const filteredQuestions = questions?.filter(q => {
    const matchesSection = sectionFilter === "all" || q.section === sectionFilter;
    const matchesSearch = q.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesSearch;
  });

  const stats = {
    total: questions?.length || 0,
    interest: questions?.filter(q => q.section === "INTEREST").length || 0,
    aptitude: questions?.filter(q => q.section === "APTITUDE").length || 0,
    personality: questions?.filter(q => q.section === "PERSONALITY").length || 0,
    active: questions?.filter(q => q.isActive).length || 0,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground" data-testid="text-admin-title">Admin Dashboard</h1>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <StatsCard 
              title="Total Questions" 
              value={stats.total.toString()}
              icon={<FileQuestion className="w-5 h-5 text-primary" />} 
              subtitle={`${stats.active} active`}
            />
            <StatsCard 
              title="RIASEC Interest" 
              value={stats.interest.toString()}
              icon={<Heart className="w-5 h-5 text-pink-600" />}
            />
            <StatsCard 
              title="Aptitude" 
              value={stats.aptitude.toString()}
              icon={<Brain className="w-5 h-5 text-blue-600" />}
            />
            <StatsCard 
              title="Personality" 
              value={stats.personality.toString()}
              icon={<Lightbulb className="w-5 h-5 text-amber-600" />}
            />
          </div>

          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="questions" data-testid="tab-questions">Questions Database</TabsTrigger>
              <TabsTrigger value="careers" data-testid="tab-careers">Career Paths</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">User Management</TabsTrigger>
            </TabsList>

            <TabsContent value="questions">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>{t('assessmentQuestions')}</CardTitle>
                      <CardDescription>{t('manageItemsDescription')}</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          placeholder={t('searchQuestions')} 
                          className="pl-9 w-64"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          data-testid="input-search-questions"
                        />
                      </div>
                      <Select value={sectionFilter} onValueChange={setSectionFilter}>
                        <SelectTrigger className="w-40" data-testid="select-section-filter">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sections</SelectItem>
                          <SelectItem value="INTEREST">Interest (RIASEC)</SelectItem>
                          <SelectItem value="APTITUDE">Aptitude</SelectItem>
                          <SelectItem value="PERSONALITY">Personality</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">ID</TableHead>
                          <TableHead>Question Text</TableHead>
                          <TableHead className="w-[120px]">Section</TableHead>
                          <TableHead className="w-[100px]">Code</TableHead>
                          <TableHead className="w-[80px] text-center">Active</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredQuestions?.map((q) => (
                          <QuestionRow key={q.id} question={q} />
                        ))}
                        {filteredQuestions?.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              {t('noQuestionsFound2')}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-4 text-sm text-muted-foreground">
                    Showing {filteredQuestions?.length || 0} of {stats.total} questions
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="careers">
              <Card>
                <CardContent className="p-8 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('CMsoon')}</p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="users">
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{t('UMsoon')}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function QuestionRow({ question }: { question: Question & { options: any[] } }) {
  const updateQuestion = useUpdateQuestion();
  const sectionInfo = sectionConfig[question.section] || sectionConfig.INTEREST;
  const SectionIcon = sectionInfo.icon;

  const handleToggleActive = async () => {
    await updateQuestion.mutateAsync({
      id: question.id,
      data: { isActive: !question.isActive }
    });
  };

  const getCode = () => {
    if (question.riasecCode) return question.riasecCode;
    if (question.subcategory) {
      const abbr: Record<string, string> = {
        LOGICAL: "LOG",
        NUMERICAL: "NUM", 
        VERBAL: "VER",
        LEADERSHIP: "LDR",
        TEAMWORK: "TWK",
        DISCIPLINE: "DSC"
      };
      return abbr[question.subcategory] || question.subcategory;
    }
    return "-";
  };

  return (
    <TableRow className={!question.isActive ? "opacity-50" : ""} data-testid={`row-question-${question.id}`}>
      <TableCell className="font-mono text-muted-foreground">{question.id}</TableCell>
      <TableCell className="max-w-md">
        <span className="line-clamp-2">{question.text}</span>
      </TableCell>
      <TableCell>
        <Badge variant="secondary" className={`${sectionInfo.bgColor} ${sectionInfo.color} border-none`}>
          <SectionIcon className="w-3 h-3 mr-1" />
          {sectionInfo.label}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="font-bold text-foreground">{getCode()}</span>
      </TableCell>
      <TableCell className="text-center">
        <Switch 
          checked={question.isActive} 
          onCheckedChange={handleToggleActive}
          disabled={updateQuestion.isPending}
          data-testid={`switch-active-${question.id}`}
        />
      </TableCell>
    </TableRow>
  );
}

function StatsCard({ title, value, icon, subtitle }: { title: string, value: string, icon: React.ReactNode, subtitle?: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-2 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="p-2 bg-muted rounded-full">{icon}</div>
        </div>
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-foreground">{value}</span>
          {subtitle && <span className="text-xs text-muted-foreground mt-1">{subtitle}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
