
import React from 'react';
import { Heart, Github, Twitter, Mail } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-muted/50 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Built with</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>by productivity enthusiasts</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href="mailto:hello@smartpomodoro.com" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Contact us"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a 
              href="https://github.com/smartpomodoro" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="GitHub"
            >
              <Github className="h-4 w-4" />
            </a>
            <a 
              href="https://twitter.com/smartpomodoro" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Twitter"
            >
              <Twitter className="h-4 w-4" />
            </a>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Smart Pomodoro 2.0 © 2025
          </div>
        </div>
      </div>
    </footer>
  );
};
