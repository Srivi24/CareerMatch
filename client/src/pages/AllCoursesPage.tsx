// import { useQuery } from "@tanstack/react-query";
// import { Navbar } from "@/components/Navbar";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Input } from "@/components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
// import { Loader2, Search, GraduationCap, Briefcase, Clock, Info } from "lucide-react";
// import { useState } from "react";
// import { type Programme, type EngineeringBranch } from "@shared/schema";
// import { useLanguage } from "@/components/LanguageProvider";

// export default function AllCoursesPage() {
//   const { t } = useLanguage();
//   const [search, setSearch] = useState("");
//   const [streamFilter, setStreamFilter] = useState("All");
//   const [degreeFilter, setDegreeFilter] = useState("All");

//   const { data: programmes, isLoading: loadingProgs } = useQuery<(Programme & { branch?: EngineeringBranch })[]>({
//     queryKey: ["/api/programmes"],
//   });

//   const { data: branches, isLoading: loadingBranches } = useQuery<EngineeringBranch[]>({
//     queryKey: ["/api/engineering-branches"],
//   });

//   if (loadingProgs || loadingBranches) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background">
//         <Loader2 className="w-10 h-10 text-primary animate-spin" />
//       </div>
//     );
//   }

//   const filtered = programmes?.filter(p => {
//     const matchesSearch = p.fullName.toLowerCase().includes(search.toLowerCase()) || 
//                          p.branch?.name.toLowerCase().includes(search.toLowerCase());
//     const matchesStream = streamFilter === "All" || p.stream === streamFilter;
//     const matchesDegree = degreeFilter === "All" || p.degreeType === degreeFilter;
//     return matchesSearch && matchesStream && matchesDegree;
//   });

//   const grouped = filtered?.reduce((acc, p) => {
//     const key = p.stream === "ENGINEERING" ? p.branch?.name || "Other Engineering" : p.stream;
//     if (!acc[key]) acc[key] = [];
//     acc[key].push(p);
//     return acc;
//   }, {} as Record<string, any[]>);

//   const streams = ["All", "ENGINEERING", "SCIENCE", "ARTS", "COMMERCE", "MANAGEMENT"];
//   const degrees = ["All", "B.E.", "B.Tech", "B.Sc.", "B.A.", "B.Com.", "B.C.A.", "B.B.A."];

//   return (
//     <div className="min-h-screen bg-background">
//       <Navbar />
      
//       <main className="container mx-auto px-4 py-8">
//         <div className="mb-10">
//           <h1 className="text-3xl font-display font-bold text-foreground mb-2">Academic Programmes</h1>
//           <p className="text-muted-foreground">Explore undergraduate degrees across various streams.</p>
//         </div>

//         <div className="flex flex-col lg:flex-row gap-4 mb-8">
//           <div className="relative flex-1">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//             <Input 
//               placeholder="Search programmes or branches..." 
//               className="pl-10"
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>
//           <div className="flex flex-wrap gap-4">
//             <Select value={streamFilter} onValueChange={setStreamFilter}>
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Stream" />
//               </SelectTrigger>
//               <SelectContent>
//                 {streams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
//               </SelectContent>
//             </Select>

//             <Select value={degreeFilter} onValueChange={setDegreeFilter}>
//               <SelectTrigger className="w-[180px]">
//                 <SelectValue placeholder="Degree" />
//               </SelectTrigger>
//               <SelectContent>
//                 {degrees.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
//               </SelectContent>
//             </Select>
//           </div>
//         </div>

//         <div className="space-y-6">
//           {grouped && Object.entries(grouped).map(([groupName, progs]) => (
//             <Card key={groupName} className="border-none shadow-sm bg-card">
//               <CardHeader className="bg-muted/30 rounded-t-lg">
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <CardTitle className="text-xl text-foreground">{groupName}</CardTitle>
//                     {progs[0].branch?.description && (
//                       <CardDescription className="mt-1">{progs[0].branch.description}</CardDescription>
//                     )}
//                   </div>
//                   <Badge variant="outline">{progs.length} Programmes</Badge>
//                 </div>
//               </CardHeader>
//               <CardContent className="p-0">
//                 <Accordion type="single" collapsible className="w-full">
//                   {progs.map((p) => (
//                     <AccordionItem key={p.id} value={`prog-${p.id}`} className="border-b last:border-0 px-6">
//                       <AccordionTrigger className="hover:no-underline py-4">
//                         <div className="flex items-center gap-4 text-left">
//                           <div className="bg-primary/10 p-2 rounded-lg">
//                             <GraduationCap className="w-5 h-5 text-primary" />
//                           </div>
//                           <div>
//                             <p className="font-semibold text-foreground">{p.fullName}</p>
//                             <p className="text-xs text-muted-foreground">{p.degreeType} • {p.durationYears} Years</p>
//                           </div>
//                         </div>
//                       </AccordionTrigger>
//                       <AccordionContent className="pb-4">
//                         <div className="grid md:grid-cols-2 gap-6 pt-2">
//                           <div className="space-y-4">
//                             <div>
//                               <h4 className="text-sm font-bold flex items-center gap-2 mb-2">
//                                 <Info className="w-4 h-4 text-primary" />
//                                 Description
//                               </h4>
//                               <p className="text-sm text-muted-foreground leading-relaxed">
//                                 {p.shortDescription || "Details coming soon..."}
//                               </p>
//                             </div>
//                             <div className="flex flex-wrap gap-2">
//                               {p.keyTags?.map(tag => (
//                                 <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
//                               ))}
//                             </div>
//                           </div>
//                           <div className="bg-muted/20 p-4 rounded-lg space-y-3">
//                             <div>
//                               <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Eligibility</p>
//                               <p className="text-sm">{p.eligibility12thStream || "N/A"}</p>
//                             </div>
//                             <div>
//                               <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Degree Level</p>
//                               <p className="text-sm">{p.degreeLevel}</p>
//                             </div>
//                           </div>
//                         </div>
//                       </AccordionContent>
//                     </AccordionItem>
//                   ))}
//                 </Accordion>
//               </CardContent>
//             </Card>
//           ))}

//           {(!grouped || Object.keys(grouped).length === 0) && (
//             <div className="text-center py-20 bg-card rounded-xl border border-dashed">
//               <Briefcase className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-foreground">No programmes found</h3>
//               <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
