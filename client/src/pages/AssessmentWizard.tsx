import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useAssessment, useSubmitAnswer, useCompleteAssessment } from "@/hooks/use-assessments";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight, ChevronLeft, CheckCircle, Brain, Lightbulb, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/components/LanguageProvider";

const sectionConfig: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  INTEREST: { label: "Interest", icon: Heart, color: "text-pink-500" },
  APTITUDE: { label: "Aptitude", icon: Brain, color: "text-blue-500" },
  PERSONALITY: { label: "Personality", icon: Lightbulb, color: "text-amber-500" },
};

export default function AssessmentWizard() {
  const { id } = useParams<{ id: string }>();
  const assessmentId = parseInt(id!);
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const { data: assessment, isLoading } = useAssessment(assessmentId);
  
  const submitAnswer = useSubmitAnswer(assessmentId);
  const completeAssessment = useCompleteAssessment();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const questions = assessment?.questions || [];
  const totalQuestions = questions.length;
  const currentQuestion = questions[currentIndex];
  const progress = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0;

  useEffect(() => {
    if (assessment?.currentQuestionIndex && assessment.currentQuestionIndex > 0) {
      setCurrentIndex(assessment.currentQuestionIndex);
    }
  }, [assessment?.currentQuestionIndex]);

  const existingAnswer = useMemo(() => {
    if (!assessment?.answers || !currentQuestion) return null;
    return assessment.answers.find(a => a.questionId === currentQuestion.id);
  }, [assessment?.answers, currentQuestion]);

  useEffect(() => {
    if (existingAnswer) {
      setSelectedOption(existingAnswer.optionId.toString());
    } else {
      setSelectedOption(null);
    }
  }, [existingAnswer, currentIndex]);

  const updateProgress = async (newIndex: number) => {
    try {
      await apiRequest("POST", `/api/assessments/${assessmentId}/progress`, { currentQuestionIndex: newIndex });
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  const handleNext = async () => {
    if (!selectedOption || !currentQuestion || isNavigating) return;
    setIsNavigating(true);

    try {
      await submitAnswer.mutateAsync({
        questionId: currentQuestion.id,
        optionId: parseInt(selectedOption)
      });

      if (currentIndex < totalQuestions - 1) {
        const nextIndex = currentIndex + 1;
        await updateProgress(nextIndex);
        setCurrentIndex(nextIndex);
        // Don't clear selectedOption here - let useEffect handle it based on existingAnswer
      } else {
        await completeAssessment.mutateAsync(assessmentId);
        setLocation(`/results/${assessmentId}`);
      }
    } catch (err) {
      console.error("Failed to submit answer", err);
    } finally {
      setIsNavigating(false);
    }
  };

  const handlePrevious = async () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      await updateProgress(prevIndex);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium">Loading your assessment...</p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">{t('noQuestionsFound1')}</p>
            <Button onClick={() => setLocation("/")} className="mt-4">
              {t('returnToDashboard')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const sectionInfo = sectionConfig[currentQuestion.section] || { label: currentQuestion.section, icon: Brain, color: "text-primary" };
  const SectionIcon = sectionInfo.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 space-y-2">
          <div className="flex justify-between text-sm font-medium text-muted-foreground">
            <span>Question {currentIndex + 1} of {totalQuestions}</span>
            <span>{Math.round(progress)}% Completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-0 shadow-xl overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
              <CardContent className="p-8 md:p-12">
                <div className="mb-8">
                  <span className={cn("inline-flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-xs font-bold uppercase tracking-wider mb-4", sectionInfo.color)}>
                    <SectionIcon className="w-3 h-3" />
                    {sectionInfo.label}
                    {currentQuestion.riasecCode && <span className="text-muted-foreground">({currentQuestion.riasecCode})</span>}
                  </span>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight" data-testid="text-question">
                    {currentQuestion.text}
                  </h2>
                </div>

                <RadioGroup 
                  value={selectedOption || ""} 
                  onValueChange={setSelectedOption}
                  className="space-y-4"
                >
                  {currentQuestion.options.map((option) => (
                    <div key={option.id} className="relative">
                      <RadioGroupItem 
                        value={option.id.toString()} 
                        id={`option-${option.id}`} 
                        className="peer sr-only"
                        data-testid={`radio-option-${option.id}`}
                      />
                      <Label
                        htmlFor={`option-${option.id}`}
                        data-testid={`label-option-${option.id}`}
                        className={cn(
                          "flex items-center w-full p-4 md:p-5 rounded-xl border-2 cursor-pointer transition-all duration-200",
                          "hover:bg-muted/50 hover:border-muted-foreground/30",
                          "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 peer-data-[state=checked]:shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded-full border-2 mr-4 flex items-center justify-center shrink-0 transition-colors",
                          selectedOption === option.id.toString() 
                            ? "border-primary bg-primary" 
                            : "border-muted-foreground/30"
                        )}>
                          {selectedOption === option.id.toString() && (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-lg font-medium text-foreground">
                          {option.text}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex justify-between items-center">
          <Button 
            variant="ghost" 
            onClick={handlePrevious} 
            disabled={currentIndex === 0 || isNavigating}
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-previous"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {t('previous')}
          </Button>

          <Button 
            onClick={handleNext} 
            disabled={!selectedOption || isNavigating}
            size="lg"
            className="px-8 shadow-lg shadow-primary/20"
            data-testid="button-next"
          >
            {currentIndex === totalQuestions - 1 ? (
              <>
                {t('completeAssessment')}
                {completeAssessment.isPending ? <Loader2 className="ml-2 w-4 h-4 animate-spin" /> : <CheckCircle className="ml-2 w-4 h-4" />}
              </>
            ) : (
              <>
                {t('nextQuestion')}
                {submitAnswer.isPending ? <Loader2 className="ml-2 w-4 h-4 animate-spin" /> : <ChevronRight className="ml-2 w-4 h-4" />}
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
