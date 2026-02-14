// import { useCareers } from "@/hooks/use-careers";
// import { Navbar } from "@/components/Navbar";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Loader2, Search, Briefcase, GraduationCap, ArrowRight } from "lucide-react";
// import { useState } from "react";
// import { Link } from "wouter";
// import { useLanguage } from "@/components/LanguageProvider";

// export default function CareersPage() {
//   const { data: careers, isLoading } = useCareers();
//   const { t } = useLanguage();
//   const [search, setSearch] = useState("");
//   const [stream, setStream] = useState("All");

//   if (isLoading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="w-10 h-10 text-primary animate-spin" />
//       </div>
//     );
//   }

//   const filteredCareers = careers?.filter(c => {
//     const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase()) || 
//                          c.description.toLowerCase().includes(search.toLowerCase());
//     const matchesStream = stream === "All" || c.stream === stream;
//     return matchesSearch && matchesStream;
//   });

//   const STREAMS = [t('allStreams'), "Science", "Commerce", "Arts", "Vocational"];

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
      
//       <main className="container mx-auto px-4 py-8">
//         <div className="mb-10">
//           <h1 className="text-3xl font-display font-bold text-foreground mb-2">{t('careerLibrary')}</h1>
//           <p className="text-muted-foreground">Explore all available career paths and domains.</p>
//         </div>

//         <div className="flex flex-col md:flex-row gap-4 mb-8">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//             <Input 
//               placeholder={t('searchPlaceholder')} 
//               className="pl-10"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//           <Select value={stream} onValueChange={setStream}>
//             <SelectTrigger className="w-full md:w-[200px]">
//               <SelectValue placeholder="Filter by Stream" />
//             </SelectTrigger>
//             <SelectContent>
//               {STREAMS.map(s => (
//                 <SelectItem key={s} value={s === t('allStreams') ? "All" : s}>{s}</SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </div>

//         <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredCareers?.map((career) => (
//             <Card key={career.id} className="group hover:border-primary/50 transition-all hover:shadow-md">
//               <CardHeader className="pb-3">
//                 <div className="flex justify-between items-start mb-2">
//                   <Badge variant="outline" className="bg-slate-50 font-medium">
//                     {career.stream}
//                   </Badge>
//                   <div className="flex gap-1">
//                     {career.requiredCodes?.map(code => (
//                       <Badge key={code} variant="secondary" className="text-[10px] px-1.5 h-5">
//                         {code}
//                       </Badge>
//                     ))}
//                   </div>
//                 </div>
//                 <CardTitle className="text-xl group-hover:text-primary transition-colors">
//                   {career.title}
//                 </CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <p className="text-sm text-slate-600 line-clamp-3">
//                   {career.description}
//                 </p>
//                 <div className="pt-2 border-t flex items-center gap-2 text-xs text-slate-500">
//                   <GraduationCap className="w-4 h-4" />
//                   <span>{career.typicalDegree}</span>
//                 </div>
//               </CardContent>
//             </Card>
//           ))}
//         </div>

//         {filteredCareers?.length === 0 && (
//           <div className="text-center py-20 bg-white rounded-xl border border-dashed">
//             <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
//             <h3 className="text-lg font-medium text-slate-900">No careers found</h3>
//             <p className="text-slate-500">Try adjusting your search or filters.</p>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }
