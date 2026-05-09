import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Linkedin, Mail, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const team = [
  {
    name: "Leen Kittawi",
    role: "Talent Acquisition Specialist",
    description: "Expert in identifying top talent and helping candidates find their ideal roles within JoAcademy.",
    image: "https://media.licdn.com/dms/image/D4D03AQH_7K-qV2ZJ8w/profile-displayphoto-shrink_400_400/0/1710156434456?e=1720656000&v=beta&t=7_Uq3vW9Xk8Xn7_Uq3vW9Xk8Xn7_Uq3vW9Xk8Xn7_U",
    linkedin: "https://www.linkedin.com/in/leen-kittawi/",
  },
  {
    name: "Mohammad Alnaimi",
    role: "Operations & Recruitment",
    description: "Overseeing the operational excellence and recruitment processes to ensure a smooth candidate experience.",
    image: "https://media.licdn.com/dms/image/D4D03AQE-3J5W4R6vJQ/profile-displayphoto-shrink_400_400/0/1691234567890?e=1720656000&v=beta&t=...",
    linkedin: "https://jo.linkedin.com/in/mohammad-alnaimi-998445376",
  },
];

export default function RecruitmentTeam() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Users className="w-4 h-4" />
            Meet The Experts
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Our Recruitment Team</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            The faces behind JoAcademy's growth. Our team is dedicated to matching 
            the right talent with the right opportunities.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {team.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-sm group hover:shadow-2xl transition-all duration-300">
                <div className="p-8 flex flex-col sm:flex-row gap-8 items-center sm:items-start text-center sm:text-left">
                  {/* Profile Placeholder / Image */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10 overflow-hidden group-hover:scale-105 transition-transform duration-500">
                      <Users className="w-12 h-12 text-primary/20" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg">
                      <Linkedin className="w-4 h-4 fill-current" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-4">{member.role}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {member.description}
                    </p>
                    <div className="flex gap-3 justify-center sm:justify-start">
                      <Button asChild variant="default" size="sm" className="gap-2">
                        <a href={member.linkedin} target="_blank" rel="noreferrer">
                          <Linkedin className="w-4 h-4" />
                          LinkedIn Profile
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Info Footer */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center gap-3 p-1 px-4 rounded-full bg-muted text-sm font-medium">
            <Mail className="w-4 h-4 text-primary" />
            Questions? Reach out at <span className="text-primary font-bold">hr@joacademy.com</span>
          </div>
        </div>
      </main>

      <footer className="border-t py-8 px-6 mt-16">
        <div className="max-w-7xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 Jo Academy - Recruitment Portal</p>
        </div>
      </footer>
    </div>
  );
}
