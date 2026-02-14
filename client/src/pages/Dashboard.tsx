import { useAuth } from "@/hooks/use-auth";
import { useAssessments, useCreateAssessment } from "@/hooks/use-assessments";
import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowRight, Clock, CheckCircle2, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { api } from "@shared/routes";
import { useLanguage } from "@/components/LanguageProvider";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: assessments, isLoading } = useAssessments();
  const createAssessment = useCreateAssessment();
  const [, setLocation] = useLocation();

  const handleStartNew = async () => {
    try {
      const newAssessment = await createAssessment.mutateAsync({});
      setLocation(`/assessment/${newAssessment.id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  // Separate assessments by status
  const inProgress = assessments?.filter(a => a.status === 'in_progress') || [];
  const completed = assessments?.filter(a => a.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {t('welcome')}, {user?.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              {t('readyToExplore')}
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/careers">
              <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/5">
                <Briefcase className="mr-2 h-5 w-5" />
                {t('exploreCareers')}
              </Button>
            </Link>
            <Button 
              size="lg" 
              className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
              onClick={handleStartNew}
              disabled={createAssessment.isPending}
            >
              {createAssessment.isPending ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-5 w-5" />
              )}
              {t('startAssessment')}
            </Button>
          </div>
        </div>

        {/* Hero Section if no assessments */}
        {assessments?.length === 0 && (
          <Card className="bg-gradient-to-br from-primary to-blue-600 text-white border-none shadow-xl mb-10">
            <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold font-display mb-4">{t('startLine')}</h2>
                <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                  {t('startDescription')}
                </p>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="bg-white text-primary hover:bg-blue-50 border-none font-semibold"
                  onClick={handleStartNew}
                >
                  {t('takeAssessment')}
                </Button>
              </div>
              <div className="w-full md:w-1/3 flex justify-center">
                 {/* Illustration placeholder - using an icon for now */}
                 <div className="bg-white/10 p-8 rounded-full backdrop-blur-sm">
                   <CheckCircle2 className="w-32 h-32 text-white/90" />
                 </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-8">
          {/* In Progress Section */}
          {inProgress.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-orange-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('inProgress')}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {inProgress.map((assessment) => (
                  <Card key={assessment.id} className="group hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span>{t('assessment')} #{assessment.id}</span>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200">
                          {t('inProgress')}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {t('started')} {assessment.startedAt ? format(new Date(assessment.startedAt), 'MMM d, yyyy') : 'Recently'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <p className="text-xs text-slate-500 text-right">{t('resume')}</p>
                    </CardContent>
                    <CardFooter>
                      <Link href={`/assessment/${assessment.id}`} className="w-full">
                        <Button className="w-full group-hover:bg-primary group-hover:text-white" variant="outline">
                          {t('continue')} <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Completed Section */}
          {completed.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('completedAssessments')}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {completed.map((assessment) => (
                  <Card key={assessment.id} className="overflow-hidden border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex justify-between items-start">
                        <span>{t('assessment')} #{assessment.id}</span>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                          {t('completed')}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {t('finished')} {assessment.completedAt ? format(new Date(assessment.completedAt), 'MMM d, yyyy') : 'Unknown date'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {t('cardDescription')}
                      </p>
                    </CardContent>
                    <CardFooter className="bg-slate-50/50 dark:bg-slate-900/30 border-t p-4">
                      <Link href={`/results/${assessment.id}`} className="w-full">
                        <Button variant="ghost" className="w-full justify-between text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800">
                          {t('viewResults')} <ArrowRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
