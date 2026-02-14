import { Button } from "@/components/ui/button";
import { useLanguage } from "./LanguageProvider";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Toggle language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[300px] overflow-y-auto">
        <DropdownMenuItem onClick={() => setLanguage("en")} className={language === "en" ? "bg-accent" : ""}>
          English
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("hi")} className={language === "hi" ? "bg-accent" : ""}>
          हिन्दी (Hindi)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("ta")} className={language === "ta" ? "bg-accent" : ""}>
          தமிழ் (Tamil)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("te")} className={language === "te" ? "bg-accent" : ""}>
          తెలుగు (Telugu)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("bn")} className={language === "bn" ? "bg-accent" : ""}>
          বাংলা (Bengali)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("mr")} className={language === "mr" ? "bg-accent" : ""}>
          मराठी (Marathi)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("kn")} className={language === "kn" ? "bg-accent" : ""}>
          ಕನ್ನಡ (Kannada)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("ml")} className={language === "ml" ? "bg-accent" : ""}>
          മലയാളം (Malayalam)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("gu")} className={language === "gu" ? "bg-accent" : ""}>
          ગુજરાતી (Gujarati)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage("ur")} className={language === "ur" ? "bg-accent" : ""}>
          اردو (Urdu)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
