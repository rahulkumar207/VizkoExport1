import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as z from "zod";

// Contact form schema
const contactFormSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  message: z.string().min(10),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Contact form submission endpoint
  app.post("/api/contact", async (req, res) => {
    try {
      // Validate form data
      const formData = contactFormSchema.parse(req.body);
      
      // Log the contact form submission (in a real app, you'd save to DB or send email)
      console.log("Contact form submission:", formData);
      
      // Return success response
      return res.status(200).json({ 
        success: true, 
        message: "Contact form submitted successfully" 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Return validation errors
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        console.error("Contact form error:", error);
        // Return generic error
        return res.status(500).json({ 
          success: false, 
          message: "An error occurred while processing your request" 
        });
      }
    }
  });

  // Add a test route to verify API functionality
  app.get("/api/test", (req, res) => {
    return res.status(200).json({ message: "API is working" });
  });

  const httpServer = createServer(app);

  return httpServer;
}
