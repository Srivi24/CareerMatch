import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Search, GraduationCap, Briefcase, Clock, Info, BookOpen, Building2 } from "lucide-react";
import { useState } from "react";
import { type Programme, type EngineeringBranch, type Career } from "@shared/schema";
import { useLanguage } from "@/components/LanguageProvider";

export default function CareersCoursesPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [progStreamFilter, setProgStreamFilter] = useState("All");
  const [careerStreamFilter, setCareerStreamFilter] = useState("All");
  const [degreeFilter, setDegreeFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("programmes");

  const { data: programmes, isLoading: loadingProgs } = useQuery<(Programme & { branch?: EngineeringBranch })[]>({
    queryKey: ["/api/programmes"],
  });

  const { data: careers, isLoading: loadingCareers } = useQuery<Career[]>({
    queryKey: ["/api/careers"],
  });

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearch("");
  };

  if (loadingProgs || loadingCareers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" data-testid="loading-spinner" />
      </div>
    );
  }

  const filteredProgrammes = programmes?.filter(p => {
    const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase()) || 
                         p.branch?.name.toLowerCase().includes(search.toLowerCase()) ||
                         p.shortDescription?.toLowerCase().includes(search.toLowerCase());
    const matchesStream = progStreamFilter === "All" || p.stream === progStreamFilter;
    const matchesDegree = degreeFilter === "All" || p.degreeType === degreeFilter;
    return matchesSearch && matchesStream && matchesDegree;
  });

  const filteredCareers = careers?.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
                         c.description.toLowerCase().includes(search.toLowerCase());
    const matchesStream = careerStreamFilter === "All" || c.stream === careerStreamFilter;
    return matchesSearch && matchesStream;
  });

  const groupedProgrammes = filteredProgrammes?.reduce((acc, p) => {
    const key = p.stream === "ENGINEERING" ? p.branch?.name || "Other Engineering" : p.stream;
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {} as Record<string, (Programme & { branch?: EngineeringBranch })[]>);

  const streams = ["All", "ENGINEERING", "SCIENCE", "ARTS", "COMMERCE", "MANAGEMENT", "SOCIAL_WORK"];
  const degrees = ["All", "B.E.", "B.Tech", "B.Sc.", "B.A.", "B.Com.", "B.C.A.", "B.B.A.", "B.S.W."];
  const careerStreams = ["All", "Science", "Commerce", "Arts", "Vocational"];

  const totalProgrammes = programmes?.length || 0;
  const totalCareers = careers?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            {t('careerLibrary')}
          </h1>
          <p className="text-muted-foreground">
            {/* Explore {totalProgrammes} academic programmes and {totalCareers} career paths across various streams. */}
            {t('careerDescription')}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
            <TabsTrigger value="programmes" className="gap-2" data-testid="tab-programmes">
              <GraduationCap className="w-4 h-4" />
              {t('programs')} ({totalProgrammes})
            </TabsTrigger>
            <TabsTrigger value="careers" className="gap-2" data-testid="tab-careers">
              <Briefcase className="w-4 h-4" />
              {t('careers')} ({totalCareers})
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col lg:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={activeTab === "programmes" ? t('searchProgrammes') : t('searchCareers')}
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <div className="flex flex-wrap gap-4">
              {activeTab === "programmes" ? (
                <>
                  <Select value={progStreamFilter} onValueChange={setProgStreamFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-prog-stream">
                      <SelectValue placeholder="Stream" />
                    </SelectTrigger>
                    <SelectContent>
                      {streams.map(s => (
                        <SelectItem key={s} value={s}>{s === "SOCIAL_WORK" ? "Social Work" : s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                    <SelectTrigger className="w-[180px]" data-testid="select-degree">
                      <SelectValue placeholder="Degree" />
                    </SelectTrigger>
                    <SelectContent>
                      {degrees.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              ) : (
                <Select value={careerStreamFilter} onValueChange={setCareerStreamFilter}>
                  <SelectTrigger className="w-[180px]" data-testid="select-career-stream">
                    <SelectValue placeholder="Stream" />
                  </SelectTrigger>
                  <SelectContent>
                    {careerStreams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <TabsContent value="programmes" className="space-y-6">
            {groupedProgrammes && Object.entries(groupedProgrammes).map(([groupName, progs]) => (
              <Card key={groupName} className="border-none shadow-sm bg-card">
                <CardHeader className="bg-muted/30 rounded-t-lg">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-foreground">{groupName}</CardTitle>
                        {progs[0].branch?.description && (
                          <CardDescription className="mt-1">{progs[0].branch.description}</CardDescription>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline">{progs.length} {t('programs')}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Accordion type="single" collapsible className="w-full">
                    {progs.map((p) => (
                      <AccordionItem key={p.id} value={`prog-${p.id}`} className="border-b last:border-0 px-6" data-testid={`programme-item-${p.id}`}>
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-4 text-left">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <GraduationCap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{p.fullName}</p>
                              <p className="text-xs text-muted-foreground">{p.degreeType} • {p.durationYears} Years</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-4">
                          <div className="grid md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
                                  <Info className="w-4 h-4 text-primary" />
                                  Description
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {p.shortDescription || "Details coming soon..."}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {p.keyTags?.map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                                ))}
                              </div>
                            </div>
                            <div className="bg-muted/20 p-4 rounded-lg space-y-3">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Eligibility</p>
                                <p className="text-sm">{p.eligibility12thStream || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Duration</p>
                                <p className="text-sm flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {p.durationYears} Years
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Degree Level</p>
                                <p className="text-sm">{p.degreeLevel}</p>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {(!groupedProgrammes || Object.keys(groupedProgrammes).length === 0) && (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No programmes found</h3>
                <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="careers" className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCareers?.map((career) => (
                <Card key={career.id} className="group hover-elevate transition-all" data-testid={`career-card-${career.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2 gap-1">
                      <Badge variant="outline" className="bg-muted/50 font-medium">
                        {career.stream}
                      </Badge>
                      <div className="flex gap-1">
                        {career.requiredCodes?.map(code => (
                          <Badge key={code} variant="secondary" className="text-[10px] px-1.5 h-5">
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {career.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {career.description}
                    </p>
                    <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                      <GraduationCap className="w-4 h-4" />
                      <span>{career.typicalDegree}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredCareers?.length === 0 && (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">No careers found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
