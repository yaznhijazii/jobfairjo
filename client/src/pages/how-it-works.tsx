import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Upload, FileText, Briefcase, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    title: "Upload Your Resume",
    description: "Simply drag and drop your PDF resume. We support both English and Arabic formats.",
    icon: Upload,
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "AI Extraction",
    description: "Our advanced AI, powered by LlamaParse, extracts your skills, experience, and education with high precision.",
    icon: FileText,
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Smart Matching",
    description: "We scan thousands of live job listings from JoAcademy to find the perfect roles that match your profile.",
    icon: Briefcase,
    color: "bg-orange-500/10 text-orange-500",
  },
  {
    title: "Deep Analysis",
    description: "Get a detailed breakdown of why you match each job, including skill gap analysis and recommendations.",
    icon: BarChart3,
    color: "bg-green-500/10 text-green-500",
  },
];

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold mb-4">How It Works</h1>
          <p className="text-muted-foreground text-lg">
            Discover how JoAcademy JobFair uses cutting-edge AI to bridge the gap between your skills and your dream career.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full border-none shadow-lg bg-card/50 backdrop-blur-sm hover:shadow-xl transition-shadow relative overflow-hidden group">
                <div className={index < steps.length - 1 ? "hidden lg:block absolute top-12 -right-4 w-8 h-0.5 bg-border z-0" : ""} />
                
                <div className={`w-12 h-12 ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <step.icon className="w-6 h-6" />
                </div>
                
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
                
                <div className="mt-6 flex items-center text-xs font-bold text-primary/40">
                  STEP 0{index + 1}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 p-12 rounded-3xl bg-primary/5 border border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Ready to find your next role?</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Your future is just a click away. Upload your resume now and let our AI do the heavy lifting.
              </p>
              <a href="/" className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                Get Started Now
              </a>
            </div>
            <div className="hidden md:block">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/10 flex items-center justify-center">
                <BarChart3 className="w-24 h-24 text-primary/20 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
